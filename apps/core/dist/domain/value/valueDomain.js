"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const actionsList_1 = require("../../_types/actionsList");
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const event_1 = require("../../_types/event");
const permissions_1 = require("../../_types/permissions");
const canSaveValue_1 = __importDefault(require("./helpers/canSaveValue"));
const findValue_1 = __importDefault(require("./helpers/findValue"));
const prepareValue_1 = __importDefault(require("./helpers/prepareValue"));
const saveOneValue_1 = __importDefault(require("./helpers/saveOneValue"));
const validateValue_1 = __importDefault(require("./helpers/validateValue"));
const valueDomain = function ({ config = null, 'core.domain.actionsList': actionsListDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.permission.recordAttribute': recordAttributePermissionDomain = null, 'core.domain.permission.record': recordPermissionDomain = null, 'core.domain.eventsManager': eventsManager = null, 'core.domain.helpers.validate': validate = null, 'core.domain.helpers.updateRecordLastModif': updateRecordLastModif = null, 'core.domain.tree.helpers.elementAncestors': elementAncestors = null, 'core.domain.tree.helpers.getDefaultElement': getDefaultElementHelper = null, 'core.domain.record.helpers.sendRecordUpdateEvent': sendRecordUpdateEvent = null, 'core.domain.versionProfile': versionProfileDomain = null, 'core.infra.record': recordRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.value': valueRepo = null, 'core.utils': utils = null, 'core.utils.logger': logger = null } = {}) {
    /**
     * Run actions list on a value
     *
     * @param listName
     * @param value
     * @param attrProps
     * @param record
     * @param library
     * @param ctx
     */
    const _runActionsList = async ({ listName, value, attribute: attrProps, record, library, ctx }) => {
        var _a;
        try {
            const processedValue = await (!!((_a = attrProps.actions_list) === null || _a === void 0 ? void 0 : _a[listName]) && value !== null
                ? actionsListDomain.runActionsList(attrProps.actions_list[listName], value, Object.assign(Object.assign({}, ctx), { attribute: attrProps, recordId: record === null || record === void 0 ? void 0 : record.id, library,
                    value }))
                : value);
            if (utils.isStandardAttribute(attrProps)) {
                processedValue.raw_value = value.value;
            }
            return processedValue;
        }
        catch (e) {
            // If ValidationError, add some context about value to the error and throw it again
            if (e.type === errors_1.ErrorTypes.VALIDATION_ERROR) {
                e.context = {
                    attributeId: attrProps.id,
                    value,
                    recordId: record === null || record === void 0 ? void 0 : record.id
                };
            }
            throw e;
        }
    };
    const _formatValue = async ({ attribute, value, record, library, ctx }) => {
        var _a, _b;
        let processedValue = Object.assign({}, value); // Don't mutate given value
        const isLinkAttribute = attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK || attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK;
        if (isLinkAttribute && attribute.linked_library) {
            const linkValue = processedValue.value
                ? Object.assign(Object.assign({}, processedValue.value), { library: (_a = processedValue.value.library) !== null && _a !== void 0 ? _a : attribute.linked_library }) : null;
            processedValue = Object.assign(Object.assign({}, value), { value: linkValue });
        }
        processedValue.attribute = attribute.id;
        // Format metadata values as well
        if (((_b = attribute.metadata_fields) !== null && _b !== void 0 ? _b : []).length) {
            const metadataValuesFormatted = await attribute.metadata_fields.reduce(async (allValuesProm, metadataField) => {
                var _a, _b;
                const allValues = await allValuesProm;
                try {
                    const metadataAttributeProps = await attributeDomain.getAttributeProperties({
                        id: metadataField,
                        ctx
                    });
                    allValues[metadataField] =
                        typeof ((_a = value.metadata) === null || _a === void 0 ? void 0 : _a[metadataField]) !== 'undefined'
                            ? await _formatValue({
                                attribute: metadataAttributeProps,
                                value: { value: (_b = value.metadata) === null || _b === void 0 ? void 0 : _b[metadataField] },
                                record,
                                library,
                                ctx
                            })
                            : null;
                }
                catch (err) {
                    logger.error(err);
                    allValues[metadataField] = null;
                }
                return allValues;
            }, Promise.resolve({}));
            processedValue.metadata = metadataValuesFormatted;
        }
        return processedValue;
    };
    const _executeDeleteValue = async ({ library, recordId, attribute, value, ctx }) => {
        // Check permission
        const canUpdateRecord = await recordPermissionDomain.getRecordPermission({
            action: permissions_1.RecordPermissionsActions.EDIT_RECORD,
            userId: ctx.userId,
            library,
            recordId,
            ctx
        });
        if (!canUpdateRecord) {
            throw new PermissionError_1.default(permissions_1.RecordPermissionsActions.EDIT_RECORD);
        }
        const isAllowedToDelete = await recordAttributePermissionDomain.getRecordAttributePermission(permissions_1.RecordAttributePermissionsActions.EDIT_VALUE, ctx.userId, attribute, library, recordId, ctx);
        if (!isAllowedToDelete) {
            throw new PermissionError_1.default(permissions_1.RecordAttributePermissionsActions.EDIT_VALUE);
        }
        const attributeProps = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
        if (attributeProps.readonly) {
            throw new ValidationError_1.default({ attribute: { msg: errors_1.Errors.READONLY_ATTRIBUTE, vars: { attribute } } });
        }
        let reverseLink;
        if (!!attributeProps.reverse_link) {
            reverseLink = await attributeDomain.getAttributeProperties({
                id: attributeProps.reverse_link,
                ctx
            });
        }
        // if simple attribute type
        let v;
        if (attributeProps.type === attribute_1.AttributeTypes.SIMPLE || attributeProps.type === attribute_1.AttributeTypes.SIMPLE_LINK) {
            v = (await valueRepo.getValues({
                library,
                recordId,
                attribute: Object.assign(Object.assign({}, attributeProps), { reverse_link: reverseLink }),
                ctx
            })).pop();
        }
        else if (attributeProps.type === attribute_1.AttributeTypes.ADVANCED_LINK &&
            (reverseLink === null || reverseLink === void 0 ? void 0 : reverseLink.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
            const values = await valueRepo.getValues({
                library,
                recordId,
                attribute: Object.assign(Object.assign({}, attributeProps), { reverse_link: reverseLink }),
                ctx
            });
            v = values.filter(val => val.value.id === value.value).pop();
        }
        else if (!!(value === null || value === void 0 ? void 0 : value.id_value)) {
            v = await valueRepo.getValueById({
                library,
                recordId,
                attribute: attributeProps,
                valueId: value.id_value,
                ctx
            });
        }
        if (!v) {
            throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_VALUE });
        }
        const actionsListRes = !!attributeProps.actions_list && !!attributeProps.actions_list.deleteValue
            ? await actionsListDomain.runActionsList(attributeProps.actions_list.deleteValue, v, Object.assign(Object.assign({}, ctx), { attribute: attributeProps, recordId,
                library, value: v }))
            : v;
        const res = await valueRepo.deleteValue({
            library,
            recordId,
            attribute: Object.assign(Object.assign({}, attributeProps), { reverse_link: reverseLink }),
            value: actionsListRes,
            ctx
        });
        // Make sure attribute is returned here
        res.attribute = attribute;
        await eventsManager.sendDatabaseEvent({
            action: event_1.EventAction.VALUE_DELETE,
            data: {
                libraryId: library,
                recordId,
                attributeId: attribute,
                value: { old: actionsListRes }
            }
        }, ctx);
        await sendRecordUpdateEvent({ id: recordId, library }, [{ attribute, value: actionsListRes }], ctx);
        return res;
    };
    const _executeSaveValue = async (library, record, attribute, value, ctx) => {
        var _a;
        const savedVal = await (0, saveOneValue_1.default)(library, record.id, attribute, value, {
            valueRepo,
            recordRepo,
            treeRepo,
            getDefaultElementHelper,
            actionsListDomain,
            attributeDomain,
            versionProfileDomain
        }, ctx);
        // Apply actions list on value
        let processedValue = await _runActionsList({
            listName: actionsList_1.ActionsListEvents.GET_VALUE,
            value: savedVal,
            attribute,
            record,
            library,
            ctx
        });
        processedValue = await _formatValue({
            attribute,
            value: processedValue,
            record,
            library,
            ctx
        });
        // Runs actionsList on metadata values as well
        if (((_a = attribute.metadata_fields) === null || _a === void 0 ? void 0 : _a.length) && processedValue.metadata) {
            for (const metadataField of attribute.metadata_fields) {
                if (processedValue.metadata[metadataField] === null ||
                    typeof processedValue.metadata[metadataField] === 'undefined') {
                    continue;
                }
                const metadataAttributeProps = await attributeDomain.getAttributeProperties({
                    id: metadataField,
                    ctx
                });
                processedValue.metadata[metadataField] = await _runActionsList({
                    listName: actionsList_1.ActionsListEvents.GET_VALUE,
                    value: processedValue.metadata[metadataField],
                    attribute: metadataAttributeProps,
                    record,
                    library,
                    ctx
                });
            }
        }
        return processedValue;
    };
    return {
        async getValues({ library, recordId, attribute, options, ctx }) {
            var _a;
            await validate.validateLibrary(library, ctx);
            await validate.validateRecord(library, recordId, ctx);
            const attr = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
            let reverseLink;
            if (!!attr.reverse_link) {
                reverseLink = await attributeDomain.getAttributeProperties({ id: attr.reverse_link, ctx });
            }
            let values;
            if (!attr.versions_conf ||
                !attr.versions_conf.versionable ||
                attr.versions_conf.mode === attribute_1.ValueVersionMode.SIMPLE) {
                const getValOptions = Object.assign(Object.assign({}, options), { version: ((_a = attr === null || attr === void 0 ? void 0 : attr.versions_conf) === null || _a === void 0 ? void 0 : _a.versionable) ? options.version : null });
                values = await valueRepo.getValues({
                    library,
                    recordId,
                    attribute: Object.assign(Object.assign({}, attr), { reverse_link: reverseLink }),
                    forceGetAllValues: false,
                    options: getValOptions,
                    ctx
                });
            }
            else {
                // Get all values, no matter the version.
                const allValues = await valueRepo.getValues({
                    library,
                    recordId,
                    attribute: Object.assign(Object.assign({}, attr), { reverse_link: reverseLink }),
                    forceGetAllValues: true,
                    options,
                    ctx
                });
                const versionProfile = await versionProfileDomain.getVersionProfileProperties({
                    id: attr.versions_conf.profile,
                    ctx
                });
                // Get trees ancestors
                const trees = await Promise.all(versionProfile.trees.map(async (treeName) => {
                    const treeElem = (options === null || options === void 0 ? void 0 : options.version) && options.version[treeName]
                        ? options.version[treeName]
                        : (await getDefaultElementHelper.getDefaultElement({ treeId: treeName, ctx })).id;
                    const ancestors = (await elementAncestors.getCachedElementAncestors({
                        treeId: treeName,
                        nodeId: treeElem,
                        ctx
                    })).reverse(); // We want the leaves first
                    return {
                        name: treeName,
                        currentIndex: 0,
                        elements: ancestors
                    };
                }));
                // Retrieve appropriate value among all values
                values = (options === null || options === void 0 ? void 0 : options.forceGetAllValues) ? allValues : (0, findValue_1.default)(trees, allValues);
            }
            // Runs actionsList
            values = values.length
                ? await Promise.all(values.map(v => _runActionsList({
                    listName: actionsList_1.ActionsListEvents.GET_VALUE,
                    value: v,
                    attribute: attr,
                    record: { id: recordId },
                    library,
                    ctx
                })))
                : [
                    // Force running actionsList for actions that generate values (eg. calculation or inheritance)
                    await _runActionsList({
                        listName: actionsList_1.ActionsListEvents.GET_VALUE,
                        value: { value: null },
                        attribute: attr,
                        record: { id: recordId },
                        library,
                        ctx
                    })
                ].filter(v => (v === null || v === void 0 ? void 0 : v.value) !== null);
            return values;
        },
        async saveValue({ library, recordId, attribute, value, ctx }) {
            await validate.validateLibrary(library, ctx);
            const attributeProps = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
            await validate.validateLibraryAttribute(library, attribute, ctx);
            const record = await validate.validateRecord(library, recordId, ctx);
            const valueChecksParams = {
                attributeProps,
                library,
                recordId,
                value,
                keepEmpty: false,
                infos: ctx
            };
            // Check permissions
            const { canSave, reason: forbiddenSaveReason, fields } = await (0, canSaveValue_1.default)(Object.assign(Object.assign({}, valueChecksParams), { ctx, deps: {
                    recordPermissionDomain,
                    recordAttributePermissionDomain,
                    config
                } }));
            if (!canSave) {
                if (Object.values(errors_1.Errors).find(err => err === forbiddenSaveReason)) {
                    throw new ValidationError_1.default({ attribute: { msg: errors_1.Errors.READONLY_ATTRIBUTE, vars: { attribute } } });
                }
                throw new PermissionError_1.default(forbiddenSaveReason, fields);
            }
            // Validate value
            const validationErrors = await (0, validateValue_1.default)(Object.assign(Object.assign({}, valueChecksParams), { attributeProps, deps: {
                    attributeDomain,
                    recordRepo,
                    valueRepo,
                    treeRepo
                }, ctx }));
            if (Object.keys(validationErrors).length) {
                throw new ValidationError_1.default(validationErrors);
            }
            // Prepare value
            const valueToSave = await (0, prepareValue_1.default)(Object.assign(Object.assign({}, valueChecksParams), { deps: {
                    actionsListDomain,
                    attributeDomain,
                    utils
                }, ctx }));
            const savedVal = await _executeSaveValue(library, record, attributeProps, valueToSave, ctx);
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.VALUE_SAVE,
                data: {
                    libraryId: library,
                    recordId,
                    attributeId: attributeProps.id,
                    value: { new: savedVal }
                }
            }, ctx);
            await updateRecordLastModif(library, recordId, ctx);
            await sendRecordUpdateEvent(record, [{ attribute, value: savedVal }], ctx);
            return savedVal;
        },
        async saveValueBatch({ library, recordId, values, ctx, keepEmpty = false }) {
            await validate.validateLibrary(library, ctx);
            for (const value of values) {
                await validate.validateLibraryAttribute(library, value.attribute, ctx);
            }
            const record = await validate.validateRecord(library, recordId, ctx);
            const saveRes = await values.reduce(async (promPrevRes, value) => {
                var _a;
                const prevRes = await promPrevRes;
                try {
                    if (value.value === null && !keepEmpty) {
                        const deletedVal = await _executeDeleteValue({
                            library,
                            value,
                            recordId,
                            attribute: value.attribute,
                            ctx
                        });
                        prevRes.values.push(deletedVal);
                        return prevRes;
                    }
                    const attributeProps = await attributeDomain.getAttributeProperties({ id: value.attribute, ctx });
                    let reverseLink;
                    if (!!attributeProps.reverse_link) {
                        reverseLink = await attributeDomain.getAttributeProperties({
                            id: attributeProps.reverse_link,
                            ctx
                        });
                    }
                    const valueChecksParams = {
                        attributeProps,
                        library,
                        recordId,
                        value,
                        keepEmpty
                    };
                    // Check permissions
                    const { canSave, reason: forbiddenSaveReason } = await (0, canSaveValue_1.default)(Object.assign(Object.assign({}, valueChecksParams), { ctx, deps: {
                            recordPermissionDomain,
                            recordAttributePermissionDomain,
                            config
                        } }));
                    if (!canSave) {
                        if (Object.values(errors_1.Errors).find(err => err === forbiddenSaveReason)) {
                            throw new ValidationError_1.default({
                                attribute: { msg: errors_1.Errors.READONLY_ATTRIBUTE, vars: { attribute: attributeProps.id } }
                            });
                        }
                        throw new PermissionError_1.default(forbiddenSaveReason);
                    }
                    // Validate value
                    const validationErrors = await (0, validateValue_1.default)(Object.assign(Object.assign({}, Object.assign(Object.assign({}, valueChecksParams), { attributeProps })), { deps: {
                            attributeDomain,
                            recordRepo,
                            valueRepo,
                            treeRepo
                        }, ctx }));
                    if (Object.keys(validationErrors).length) {
                        throw new ValidationError_1.default(validationErrors);
                    }
                    // Prepare value
                    const valToSave = await (0, prepareValue_1.default)(Object.assign(Object.assign({}, valueChecksParams), { deps: {
                            actionsListDomain,
                            attributeDomain,
                            utils
                        }, ctx }));
                    const savedVal = !keepEmpty && !valToSave.value && !!valToSave.id_value
                        ? await valueRepo.deleteValue({
                            library,
                            recordId,
                            attribute: Object.assign(Object.assign({}, attributeProps), { reverse_link: reverseLink }),
                            value: valToSave,
                            ctx
                        })
                        : await _executeSaveValue(library, record, attributeProps, valToSave, ctx);
                    // TODO: get old value ?
                    await eventsManager.sendDatabaseEvent({
                        action: event_1.EventAction.VALUE_SAVE,
                        data: {
                            libraryId: library,
                            recordId,
                            attributeId: attributeProps.id,
                            value: { new: savedVal }
                        }
                    }, ctx);
                    prevRes.values.push(savedVal);
                }
                catch (e) {
                    if (!e.type ||
                        (e.type !== errors_1.ErrorTypes.VALIDATION_ERROR && e.type !== errors_1.ErrorTypes.PERMISSION_ERROR)) {
                        utils.rethrow(e);
                    }
                    if (!Array.isArray(prevRes.errors)) {
                        prevRes.errors = [];
                    }
                    prevRes.errors.push({
                        type: e.type,
                        message: ((_a = e === null || e === void 0 ? void 0 : e.fields) === null || _a === void 0 ? void 0 : _a[value.attribute])
                            ? !e.isCustomMessage
                                ? utils.translateError(e.fields[value.attribute], ctx.lang)
                                : e.fields[value.attribute]
                            : e.message,
                        input: value.value,
                        attribute: value.attribute
                    });
                }
                return prevRes;
            }, Promise.resolve({ values: [], errors: null }));
            if (saveRes.values.length) {
                await updateRecordLastModif(library, recordId, ctx);
                await sendRecordUpdateEvent(record, saveRes.values.map(savedValue => ({
                    attribute: savedValue.attribute,
                    value: savedValue
                })), ctx);
            }
            return saveRes;
        },
        async deleteValue({ library, recordId, attribute, value, ctx }) {
            await validate.validateLibrary(library, ctx);
            await validate.validateRecord(library, recordId, ctx);
            return _executeDeleteValue({ library, recordId, attribute, value, ctx });
        },
        formatValue: _formatValue,
        runActionsList: _runActionsList
    };
};
exports.default = valueDomain;
