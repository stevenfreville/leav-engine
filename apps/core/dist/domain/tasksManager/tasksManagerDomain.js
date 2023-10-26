"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const nanoid_1 = require("nanoid");
const process_1 = __importDefault(require("process"));
const uuid_1 = require("uuid");
const eventsManager_1 = require("../../_types/eventsManager");
const list_1 = require("../../_types/list");
const tasksManager_1 = require("../../_types/tasksManager");
function default_1({ config = null, 'core.infra.amqpService': amqpService = null, 'core.infra.task': taskRepo = null, 'core.depsManager': depsManager = null, 'core.domain.eventsManager': eventsManager = null, 'core.utils.logger': logger = null, 'core.utils': utils = null }) {
    const tag = `${process_1.default.pid}_${(0, nanoid_1.nanoid)(3)}`;
    const workerCtx = {
        userId: config.defaultUserId,
        queryId: 'TasksManagerWorker'
    };
    const _monitorTasks = (ctx) => {
        // check if tasks waiting for execution and execute them
        return setInterval(async () => {
            var _a, _b, _c;
            const taskToExecute = (_a = (await taskRepo.getTasksToExecute(ctx))) === null || _a === void 0 ? void 0 : _a.list[0];
            const taskToCancel = (_b = (await taskRepo.getTasksToCancel(ctx))) === null || _b === void 0 ? void 0 : _b.list[0];
            const taskWithPendingCallbacks = (_c = (await taskRepo.getTasksWithPendingCallbacks(ctx))) === null || _c === void 0 ? void 0 : _c.list[0];
            if (taskToCancel) {
                await _sendOrder(config.tasksManager.routingKeys.cancelOrders, taskToCancel, ctx);
            }
            if (taskWithPendingCallbacks) {
                await _executeCallbacks(taskWithPendingCallbacks, ctx);
            }
            if (taskToExecute) {
                await _updateTask(taskToExecute.id, { status: tasksManager_1.TaskStatus.PENDING }, ctx);
                await _sendOrder(config.tasksManager.routingKeys.execOrders, taskToExecute, ctx);
            }
        }, config.tasksManager.checkingInterval);
    };
    const _executeTask = async (task, ctx) => {
        await _attachWorker(task.id, process_1.default.pid, workerCtx);
        await _updateTask(task.id, { startedAt: utils.getUnixTime(), status: tasksManager_1.TaskStatus.RUNNING, progress: { percent: 0 } }, ctx);
        let status = task.status;
        let errorMessage = null;
        try {
            const func = _getDepsManagerFunc({
                moduleName: task.func.moduleName,
                subModuleName: task.func.subModuleName,
                funcName: task.func.name
            });
            await func(task.func.args, { id: task.id });
            status = tasksManager_1.TaskStatus.DONE;
        }
        catch (e) {
            logger.error('Error executing task', e);
            status = tasksManager_1.TaskStatus.FAILED;
            errorMessage = e.message;
        }
        const progress = status === tasksManager_1.TaskStatus.DONE
            ? { progress: { percent: 100 } }
            : Object.assign({}, (errorMessage
                ? {
                    progress: {
                        description: config.lang.available.reduce((labels, lang) => {
                            labels[lang] = errorMessage;
                            return labels;
                        }, {})
                    }
                }
                : {}));
        return _updateTask(task.id, Object.assign(Object.assign({}, progress), { completedAt: utils.getUnixTime(), status }), ctx);
    };
    const _executeCallbacks = async (task, ctx) => {
        let callbacks = task.callbacks.map(a => (Object.assign({}, a)));
        for (const [i, callback] of callbacks.entries()) {
            callbacks[i].status = tasksManager_1.TaskCallbackStatus.RUNNING;
            await _updateTask(task.id, { callbacks }, ctx);
            let status;
            if ((callback.type.includes(tasksManager_1.TaskCallbackType.ON_FAILURE) && task.status === tasksManager_1.TaskStatus.FAILED) ||
                (callback.type.includes(tasksManager_1.TaskCallbackType.ON_SUCCESS) && task.status === tasksManager_1.TaskStatus.DONE) ||
                (callback.type.includes(tasksManager_1.TaskCallbackType.ON_CANCEL) && task.status === tasksManager_1.TaskStatus.CANCELED)) {
                try {
                    const callbackFunc = _getDepsManagerFunc({
                        moduleName: callback.moduleName,
                        subModuleName: callback.subModuleName,
                        funcName: callback.name
                    });
                    await callbackFunc(...callback.args);
                    status = tasksManager_1.TaskCallbackStatus.DONE;
                }
                catch (e) {
                    logger.error('Error executing callback', e);
                    status = tasksManager_1.TaskCallbackStatus.FAILED;
                }
            }
            else {
                status = tasksManager_1.TaskCallbackStatus.SKIPPED;
            }
            callbacks = callbacks.map(c => (Object.assign({}, c))); // copy of callbacks to avoid changes on old refs in mock calls (tests only)
            callbacks[i].status = status;
            await _updateTask(task.id, { callbacks }, ctx);
        }
    };
    const _validateMsg = (msg) => {
        const msgBodySchema = joi_1.default.object().keys({
            time: joi_1.default.number().required(),
            userId: joi_1.default.string().required(),
            payload: joi_1.default.object().when('order', {
                switch: [
                    {
                        is: tasksManager_1.OrderType.CREATE,
                        then: joi_1.default.object().keys({
                            id: joi_1.default.string().required(),
                            label: joi_1.default.object().required(),
                            func: joi_1.default.object()
                                .keys({
                                moduleName: joi_1.default.string().required(),
                                subModuleName: joi_1.default.string().required(),
                                name: joi_1.default.string().required(),
                                args: joi_1.default.array().required()
                            })
                                .required(),
                            startAt: joi_1.default.date().timestamp('unix').raw().required(),
                            priority: joi_1.default.string()
                                .valid(...Object.values(tasksManager_1.TaskPriority))
                                .required(),
                            role: joi_1.default.object().keys({
                                type: joi_1.default.string()
                                    .valid(...Object.values(tasksManager_1.TaskType))
                                    .required(),
                                detail: joi_1.default.string()
                            }),
                            callbacks: joi_1.default.array().items(joi_1.default.object().keys({
                                moduleName: joi_1.default.string().required(),
                                subModuleName: joi_1.default.string(),
                                name: joi_1.default.string().required(),
                                args: joi_1.default.array().required(),
                                type: joi_1.default.array()
                                    .items(...Object.values(tasksManager_1.TaskCallbackType))
                                    .required()
                            }))
                        })
                    },
                    {
                        is: tasksManager_1.OrderType.CANCEL,
                        then: joi_1.default.object().keys({ id: joi_1.default.string().required() })
                    }
                ]
            })
        });
        const isValid = msgBodySchema.validate(msg);
        if (!!isValid.error) {
            const errorMsg = isValid.error.details.map(e => e.message).join(', ');
            throw new Error(errorMsg);
        }
    };
    const _updateTask = async (taskId, data, ctx) => {
        let task = (await _getTasks({ params: { filters: { id: taskId } }, ctx })).list[0];
        if (!task) {
            throw new Error('Task not found');
        }
        task = await taskRepo.updateTask(Object.assign({ id: taskId }, data
        // ...(!data.callbacks && {
        //     callbacks: data.callbacks.map(a => ({...a})) // copy of callbacks to avoid changes on old refs in mock calls (tests only)
        // })
        ), ctx);
        await eventsManager.sendPubSubEvent({ triggerName: eventsManager_1.TriggerNames.TASK, data: { task } }, ctx);
        return task;
    };
    const _attachWorker = async (taskId, workerId, ctx) => {
        await _updateTask(taskId, { workerId }, ctx);
    };
    const _detachWorker = async (taskId, ctx) => {
        await _updateTask(taskId, { workerId: null }, ctx);
    };
    const _getTasks = async ({ params, ctx }) => {
        if (typeof params.sort === 'undefined') {
            params.sort = { field: 'id', order: list_1.SortOrder.ASC };
        }
        return taskRepo.getTasks({ params, ctx });
    };
    const _getDepsManagerFunc = ({ moduleName, subModuleName, funcName }) => {
        var _a;
        const func = (_a = depsManager.resolve(`core.${moduleName}${!!subModuleName ? `.${subModuleName}` : ''}`)) === null || _a === void 0 ? void 0 : _a[funcName];
        if (!func) {
            throw new Error(`Function core.${moduleName}${!!subModuleName ? `.${subModuleName}` : ''}.${funcName} not found`);
        }
        return func;
    };
    const _cancelTask = async ({ id }, ctx) => {
        const task = (await _getTasks({ params: { filters: { id } }, ctx })).list[0];
        if (!task) {
            throw new Error('Task not found');
        }
        // if task is still pending or running, cancel it
        if (task.status === tasksManager_1.TaskStatus.CREATED ||
            task.status === tasksManager_1.TaskStatus.PENDING ||
            task.status === tasksManager_1.TaskStatus.RUNNING) {
            const newData = typeof task.workerId === 'undefined'
                ? { status: tasksManager_1.TaskStatus.CANCELED, canceledBy: ctx.userId, completedAt: utils.getUnixTime() }
                : { status: tasksManager_1.TaskStatus.PENDING_CANCEL, canceledBy: ctx.userId };
            await _updateTask(task.id, newData, ctx);
        }
    };
    const _createTask = async ({ id, label, func, startAt, priority, callbacks, role }, ctx) => {
        const task = await taskRepo.createTask(Object.assign({ id: id !== null && id !== void 0 ? id : (0, uuid_1.v4)(), label,
            func, startAt: startAt !== null && startAt !== void 0 ? startAt : utils.getUnixTime(), status: tasksManager_1.TaskStatus.CREATED, priority,
            role, archive: false }, (!!callbacks && { callbacks: callbacks.map(c => (Object.assign(Object.assign({}, c), { status: tasksManager_1.TaskCallbackStatus.PENDING }))) })), ((_a) => {
            var { dbProfiler } = _a, c = __rest(_a, ["dbProfiler"]);
            return c;
        })(ctx));
        await eventsManager.sendPubSubEvent({ triggerName: eventsManager_1.TriggerNames.TASK, data: { task } }, ctx);
        return task.id;
    };
    const _deleteTask = async ({ id, archive }, ctx) => {
        const task = (await _getTasks({ params: { filters: { id } }, ctx })).list[0];
        if (!task) {
            throw new Error('Task not found');
        }
        else if (!!task.workerId) {
            throw new Error(`Cannot delete: task ${id} is still running.`);
        }
        return archive ? _updateTask(id, { archive }, ctx) : taskRepo.deleteTask(id, ctx);
    };
    const _exit = async () => {
        await amqpService.close();
        process_1.default.exit();
    };
    const _onExecMessage = async (msg) => {
        const order = JSON.parse(msg.content.toString());
        try {
            _validateMsg(order);
        }
        catch (e) {
            logger.error(e);
            amqpService.consumer.channel.ack(msg);
        }
        // We stop listening to the execution order queue because if we ack the message we receive a new task.
        // We can't wait for the task to finish before the ack because it can be long and exceed the rabbitmq timeout.
        amqpService.consumer.channel.cancel(tag);
        amqpService.consumer.channel.ack(msg);
        const task = order.payload;
        await _executeTask(task, { userId: task.created_by });
        await _detachWorker(task.id, workerCtx);
        if (config.tasksManager.restartWorker) {
            return _exit();
        }
        await _listenExecOrders();
    };
    const _onCancelMessage = async (msg) => {
        const order = JSON.parse(msg.content.toString());
        try {
            _validateMsg(order);
        }
        catch (e) {
            logger.error(e);
        }
        finally {
            amqpService.consumer.channel.ack(msg);
        }
        const task = order.payload;
        // This worker is not involved
        if (task.workerId !== process_1.default.pid) {
            return;
        }
        await _updateTask(task.id, { completedAt: utils.getUnixTime(), status: tasksManager_1.TaskStatus.CANCELED }, workerCtx);
        await _detachWorker(task.id, workerCtx);
        if (config.tasksManager.restartWorker) {
            await _exit();
        }
    };
    const _sendOrder = async (routingKey, payload, ctx) => {
        await amqpService.publish(config.amqp.exchange, routingKey, JSON.stringify({ time: utils.getUnixTime(), userId: ctx.userId, payload }));
    };
    const _listenExecOrders = async () => {
        await amqpService.consume(config.tasksManager.queues.execOrders, config.tasksManager.routingKeys.execOrders, _onExecMessage, tag);
    };
    return {
        // Core
        getTasks: _getTasks,
        async createTask(task, ctx) {
            return _createTask(task, ctx);
        },
        async cancelTask(task, ctx) {
            await _cancelTask(task, ctx);
        },
        async deleteTasks(tasks, ctx) {
            for (const t of tasks) {
                await _deleteTask(t, ctx);
            }
        },
        // Master
        async initMaster() {
            // Create exec queue
            await amqpService.consumer.channel.assertQueue(config.tasksManager.queues.execOrders);
            await amqpService.consumer.channel.bindQueue(config.tasksManager.queues.execOrders, config.amqp.exchange, config.tasksManager.routingKeys.execOrders);
            return _monitorTasks({
                userId: config.defaultUserId,
                queryId: 'TasksManagerDomain'
            });
        },
        // Workers
        async initWorker() {
            await _listenExecOrders();
            // wait for cancel orders
            const cancelOrdersQueue = `${config.tasksManager.queues.cancelOrders}_${tag}`;
            await amqpService.consumer.channel.assertQueue(cancelOrdersQueue, {
                autoDelete: true,
                durable: false,
                exclusive: true
            });
            await amqpService.consumer.channel.bindQueue(cancelOrdersQueue, config.amqp.exchange, config.tasksManager.routingKeys.cancelOrders);
            await amqpService.consume(cancelOrdersQueue, config.tasksManager.routingKeys.cancelOrders, _onCancelMessage);
        },
        async updateProgress(taskId, progress, ctx) {
            if (typeof progress.percent !== 'undefined' && progress.percent === 100) {
                // If percent update is equal to 100, task is completed but not yet updated
                // Only the task manager can update task status to completed
                progress.percent = 99;
            }
            await _updateTask(taskId, { progress }, ctx);
        },
        async setLink(taskId, link, ctx) {
            await _updateTask(taskId, { link }, ctx);
        }
    };
}
exports.default = default_1;
