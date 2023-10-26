"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASKS_COLLECTION = void 0;
const tasksManager_1 = require("../../_types/tasksManager");
const aql_1 = require("arangojs/aql");
exports.TASKS_COLLECTION = 'core_tasks';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.utils': utils = null } = {}) {
    return {
        async isATaskRunning(ctx, workerId) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const queryParts = [(0, aql_1.aql) `FOR task IN ${collec} FILTER task.status == ${tasksManager_1.TaskStatus.RUNNING}`];
            if (typeof workerId !== 'undefined') {
                queryParts.push((0, aql_1.aql) `FILTER task.workerId == ${workerId}`);
            }
            queryParts.push((0, aql_1.aql) `RETURN task`);
            const runningTasks = await dbService.execute({ query: (0, aql_1.join)(queryParts), ctx });
            return runningTasks.length > 0;
        },
        async getTasksToExecute(ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const query = (0, aql_1.aql) `FOR task IN ${collec}
                    FILTER task.status == ${tasksManager_1.TaskStatus.CREATED}
                    FILTER task.startAt <= ${utils.getUnixTime()}
                    FILTER task.workerId == null
                    SORT task.priority DESC, task.startAt ASC
                RETURN task`;
            const tasks = await dbService.execute({
                query,
                withTotalCount: true,
                ctx
            });
            const list = tasks.results;
            const totalCount = tasks.totalCount;
            return {
                totalCount,
                list: list.map(dbUtils.cleanup)
            };
        },
        async getTasksToCancel(ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const query = (0, aql_1.aql) `FOR task IN ${collec}
                    FILTER task.status == ${tasksManager_1.TaskStatus.PENDING_CANCEL}
                    SORT task.priority DESC
                RETURN task`;
            const tasks = await dbService.execute({
                query,
                withTotalCount: true,
                ctx
            });
            const list = tasks.results;
            const totalCount = tasks.totalCount;
            return {
                totalCount,
                list: list.map(dbUtils.cleanup)
            };
        },
        async getTasksWithPendingCallbacks(ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const query = (0, aql_1.aql) `FOR task IN ${collec}
                    FILTER task.status == ${tasksManager_1.TaskStatus.DONE} 
                        OR task.status == ${tasksManager_1.TaskStatus.FAILED} 
                        OR task.status == ${tasksManager_1.TaskStatus.CANCELED}
                    FILTER task.callbacks != null 
                    FILTER LENGTH(task.callbacks[* FILTER CURRENT.status == ${tasksManager_1.TaskCallbackStatus.PENDING}]) == LENGTH(task.callbacks)
                    SORT task.priority DESC
                RETURN task`;
            const tasks = await dbService.execute({
                query,
                withTotalCount: true,
                ctx
            });
            const list = tasks.results;
            const totalCount = tasks.totalCount;
            return {
                totalCount,
                list: list.map(dbUtils.cleanup)
            };
        },
        async getTasks({ params, ctx }) {
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            const res = await dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.TASKS_COLLECTION, ctx }));
            return res;
        },
        async createTask(task, ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const docToInsert = dbUtils.convertToDoc(task);
            const newTask = await dbService.execute({
                query: (0, aql_1.aql) `INSERT ${Object.assign(Object.assign({}, docToInsert), { created_at: utils.getUnixTime(), created_by: ctx.userId, modified_at: utils.getUnixTime() })} IN ${collec} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(newTask[0]);
        },
        async updateTask(task, ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const docToInsert = dbUtils.convertToDoc(task);
            const updatedTask = await dbService.execute({
                query: (0, aql_1.aql) `UPDATE ${Object.assign(Object.assign({}, docToInsert), { modified_at: utils.getUnixTime() })} IN ${collec} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(updatedTask[0]);
        },
        async deleteTask(taskId, ctx) {
            const collec = dbService.db.collection(exports.TASKS_COLLECTION);
            const res = await dbService.execute({
                query: (0, aql_1.aql) `REMOVE ${{ _key: taskId }} IN ${collec} RETURN OLD`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        }
    };
}
exports.default = default_1;
