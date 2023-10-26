"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const attribute_1 = require("../../_types/attribute");
const event_1 = require("../../_types/event");
const eventsManager_1 = require("../../_types/eventsManager");
const record_1 = require("../../_types/record");
const tasksManager_1 = require("../../_types/tasksManager");
function default_1({ config = null, 'core.infra.amqpService': amqpService = null, 'core.domain.record': recordDomain = null, 'core.domain.library': libraryDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.tasksManager': tasksManagerDomain = null, 'core.infra.indexation.indexationService': indexationService = null, 'core.domain.eventsManager': eventsManager = null, translator = null }) {
    const _indexRecords = async (findRecordParams, ctx, attributes) => {
        if (!(await indexationService.isLibraryListed(findRecordParams.library))) {
            await indexationService.listLibrary(findRecordParams.library);
        }
        const fullTextLibraryAttributes = await attributeDomain.getLibraryFullTextAttributes(findRecordParams.library, ctx);
        // We retrieve the properties of the indexed attributes to be updated
        const attributesToEdit = { up: [], del: [] };
        if (attributes) {
            const libraryAttributes = await attributeDomain.getLibraryAttributes(findRecordParams.library, ctx);
            attributesToEdit.up = fullTextLibraryAttributes.filter(a => { var _a; return (_a = attributes.up) === null || _a === void 0 ? void 0 : _a.includes(a.id); });
            attributesToEdit.del = libraryAttributes.filter(a => { var _a; return (_a = attributes.del) === null || _a === void 0 ? void 0 : _a.includes(a.id); });
        }
        else {
            attributesToEdit.up = fullTextLibraryAttributes;
            attributesToEdit.del = [];
        }
        const _toUp = async (record, attribute) => {
            let val = await recordDomain.getRecordFieldValue({
                library: findRecordParams.library,
                record,
                attributeId: attribute.id,
                options: {
                    forceGetAllValues: true
                },
                ctx
            });
            // FIXME: is this statement necessary?
            if (typeof val === 'undefined') {
                return {};
            }
            val = await _getFormattedValuesAndLabels(attribute, val, ctx);
            const value = Array.isArray(val) ? val.map(v => v === null || v === void 0 ? void 0 : v.value).filter(e => e) : val === null || val === void 0 ? void 0 : val.value;
            if (value === null || (Array.isArray(value) && !value.length)) {
                return { [attribute.id]: null };
            }
            return {
                [attribute.id]: typeof value === 'object' ? JSON.stringify(value) : String(value)
            };
        };
        const records = await recordDomain.find({
            params: findRecordParams,
            ctx
        });
        for (const record of records.list) {
            // We iterate on the attributes to be edited and define new values for these attributes.
            // The _toUp function returns the updated value of an attribute. Attributes to be deleted are set to null.
            const data = (await Promise.all([...attributesToEdit.up.map(async (a) => _toUp(record, a))]))
                .concat(attributesToEdit.del.map(a => ({ [a.id]: null })))
                .reduce((acc, e) => (Object.assign(Object.assign({}, acc), e)), {});
            await indexationService.indexRecord(findRecordParams.library, record.id, data);
        }
    };
    const _getFormattedValuesAndLabels = async (attribute, values, ctx) => {
        if (attribute.type === attribute_1.AttributeTypes.TREE) {
            values = Array.isArray(values)
                ? values.map(v => {
                    var _a;
                    return (Object.assign(Object.assign({}, v), { value: (_a = v.value) === null || _a === void 0 ? void 0 : _a.record }));
                })
                : Object.assign(Object.assign({}, values), { value: values.value.record });
        }
        if (attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK ||
            attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK ||
            attribute.type === attribute_1.AttributeTypes.TREE) {
            if (Array.isArray(values)) {
                for (const [i, v] of values.entries()) {
                    const recordIdentity = await recordDomain.getRecordIdentity({ id: v.value.id, library: attribute.linked_library || v.value.library }, ctx);
                    values[i].value = recordIdentity.label || v.value.id;
                }
            }
            else {
                const recordIdentity = await recordDomain.getRecordIdentity({
                    id: values.value.id,
                    library: attribute.linked_library || values.value.library
                }, ctx);
                values.value = recordIdentity.label || values.value.id;
            }
        }
        return values;
    };
    const _indexLinkedLibraries = async (libraryId, ctx, toRecordId) => {
        // get all attributes with the new library as linked library / linked_tree
        const attributesToUpdate = (await attributeDomain.getAttributes({
            params: {
                filters: { linked_library: libraryId }
            },
            ctx
        })).list.concat((await attributeDomain.getAttributes({
            params: {
                filters: { linked_tree: libraryId }
            },
            ctx
        })).list);
        const libs = (await libraryDomain.getLibraries({ ctx })).list;
        // We cross-reference the attributes that point to the library that has been previously updated and
        // the indexed attributes of each library. If these libraries use them, we need to update the indexes.
        for (const l of libs) {
            const intersections = (0, lodash_1.intersectionBy)(l.fullTextAttributes, attributesToUpdate, 'id');
            if (intersections.length) {
                let filters;
                if (typeof toRecordId !== 'undefined') {
                    filters = intersections.map(a => ({
                        field: `${a.id}.${a.linked_tree ? `${libraryId}.` : ''}id`,
                        condition: record_1.AttributeCondition.EQUAL,
                        value: toRecordId
                    }));
                }
                await _indexDatabase({
                    findRecordParams: { library: l.id, filters },
                    ctx,
                    attributes: { up: intersections.map(a => a.id) },
                    forceNoTask: true
                });
            }
        }
    };
    const _onMessage = async (msg) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        amqpService.consumer.channel.ack(msg);
        const event = JSON.parse(msg.content.toString());
        const ctx = {
            userId: '1',
            queryId: (0, uuid_1.v4)()
        };
        try {
            _validateMsg(event);
        }
        catch (e) {
            console.error(e);
        }
        let data;
        switch (event.payload.action) {
            case event_1.EventAction.RECORD_SAVE: {
                data = event.payload.data;
                await _indexDatabase({
                    findRecordParams: {
                        library: data.libraryId,
                        filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: data.id }]
                    },
                    ctx,
                    forceNoTask: true
                });
                break;
            }
            case event_1.EventAction.LIBRARY_SAVE: {
                data = event.payload.data;
                const attrsToDel = (0, lodash_1.difference)((_a = data.old) === null || _a === void 0 ? void 0 : _a.fullTextAttributes, (_b = data.new) === null || _b === void 0 ? void 0 : _b.fullTextAttributes);
                const attrsToAdd = (0, lodash_1.difference)((_c = data.new) === null || _c === void 0 ? void 0 : _c.fullTextAttributes, (_d = data.old) === null || _d === void 0 ? void 0 : _d.fullTextAttributes);
                if (!(0, lodash_1.isEqual)((_f = (_e = data.old) === null || _e === void 0 ? void 0 : _e.fullTextAttributes) === null || _f === void 0 ? void 0 : _f.sort(), (_h = (_g = data.new) === null || _g === void 0 ? void 0 : _g.fullTextAttributes) === null || _h === void 0 ? void 0 : _h.sort())) {
                    await _indexDatabase({
                        findRecordParams: { library: data.new.id },
                        ctx,
                        attributes: { up: attrsToAdd, del: attrsToDel }
                    });
                }
                // if label change we re-index all linked libraries
                if (((_j = data.new.recordIdentityConf) === null || _j === void 0 ? void 0 : _j.label) !== ((_l = (_k = data.old) === null || _k === void 0 ? void 0 : _k.recordIdentityConf) === null || _l === void 0 ? void 0 : _l.label)) {
                    await _indexLinkedLibraries(data.new.id, ctx);
                }
                break;
            }
            case event_1.EventAction.VALUE_SAVE: {
                data = event.payload.data;
                const fullTextAttributes = await attributeDomain.getLibraryFullTextAttributes(data.libraryId, ctx);
                const isActivated = data.attributeId === 'active' && data.value.new.value === true;
                const isAttrToIndex = fullTextAttributes.map(a => a.id).includes(data.attributeId);
                if (isActivated || isAttrToIndex) {
                    await _indexDatabase({
                        findRecordParams: {
                            library: data.libraryId,
                            filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: data.recordId }]
                        },
                        ctx,
                        attributes: isActivated || !isAttrToIndex ? null : { up: [data.attributeId] },
                        forceNoTask: true
                    });
                }
                // if the new attribute's value is the label of the library
                // we have to re-index all linked libraries
                const library = await libraryDomain.getLibraryProperties(data.libraryId, ctx);
                if (((_m = library.recordIdentityConf) === null || _m === void 0 ? void 0 : _m.label) === data.attributeId) {
                    await _indexLinkedLibraries(data.libraryId, ctx, data.recordId);
                }
                break;
            }
            case event_1.EventAction.VALUE_DELETE: {
                data = event.payload.data;
                const attrProps = await attributeDomain.getAttributeProperties({ id: data.attributeId, ctx });
                await _indexDatabase({
                    findRecordParams: {
                        library: data.libraryId,
                        filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: data.recordId }]
                    },
                    ctx,
                    attributes: attrProps.multiple_values ? { up: [data.attributeId] } : { del: [data.attributeId] },
                    forceNoTask: true
                });
                // if the updated/deleted attribute is the label of the library
                // we have to re-index all linked libraries
                const library = await libraryDomain.getLibraryProperties(data.libraryId, ctx);
                if (((_o = library.recordIdentityConf) === null || _o === void 0 ? void 0 : _o.label) === data.attributeId) {
                    await _indexLinkedLibraries(data.libraryId, ctx, data.recordId);
                }
                break;
            }
        }
    };
    const _validateMsg = (msg) => {
        const msgBodySchema = joi_1.default.object().keys({
            time: joi_1.default.number().required(),
            userId: joi_1.default.string().required(),
            emitter: joi_1.default.string().required(),
            payload: joi_1.default.object()
                .keys({
                action: joi_1.default.string()
                    .valid(...Object.values(event_1.EventAction))
                    .required(),
                data: joi_1.default.object().required()
            })
                .required()
        });
        const isValid = msgBodySchema.validate(msg);
        if (!!isValid.error) {
            const errorMsg = isValid.error.details.map(e => e.message).join(', ');
            throw new Error(errorMsg);
        }
    };
    const _indexDatabase = async (params, task) => {
        const findRecordParams = [].concat(params.findRecordParams || []);
        if (!params.forceNoTask && typeof (task === null || task === void 0 ? void 0 : task.id) === 'undefined') {
            const newTaskId = (0, uuid_1.v4)();
            await tasksManagerDomain.createTask(Object.assign({ id: newTaskId, label: config.lang.available.reduce((labels, lang) => {
                    labels[lang] = `${translator.t('indexation.index_database', {
                        lng: lang,
                        library: findRecordParams.map(e => e.library).join(', ')
                    })}`;
                    return labels;
                }, {}), func: {
                    moduleName: 'domain',
                    subModuleName: 'indexationManager',
                    name: 'indexDatabase',
                    args: params
                }, role: {
                    type: tasksManager_1.TaskType.INDEXATION,
                    detail: findRecordParams.map(e => e.library).join(',')
                }, priority: tasksManager_1.TaskPriority.MEDIUM, startAt: !!(task === null || task === void 0 ? void 0 : task.startAt) ? task.startAt : Math.floor(Date.now() / 1000) }, (!!(task === null || task === void 0 ? void 0 : task.callbacks) && { callbacks: task.callbacks })), params.ctx);
            return newTaskId;
        }
        const _updateLibraryIndexationStatus = async (inProgress) => {
            for (const libraryId of findRecordParams.map(e => e.library)) {
                await eventsManager.sendPubSubEvent({
                    triggerName: eventsManager_1.TriggerNames.INDEXATION,
                    data: { indexation: { userId: params.ctx.userId, libraryId, inProgress } }
                }, params.ctx);
            }
        };
        await _updateLibraryIndexationStatus(true);
        for (const frp of findRecordParams) {
            await _indexRecords(frp, params.ctx);
        }
        await _updateLibraryIndexationStatus(false);
        return task.id;
    };
    return {
        async init() {
            // Init rabbitmq
            await amqpService.consumer.channel.assertQueue(config.indexationManager.queues.events);
            await amqpService.consumer.channel.bindQueue(config.indexationManager.queues.events, config.amqp.exchange, config.eventsManager.routingKeys.data_events);
            await amqpService.consume(config.indexationManager.queues.events, config.eventsManager.routingKeys.data_events, _onMessage);
            await indexationService.init();
        },
        indexDatabase: _indexDatabase
    };
}
exports.default = default_1;
