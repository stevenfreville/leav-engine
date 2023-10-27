"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const path_1 = require("path");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const preview_1 = require("../../utils/preview/preview");
const actionsList_1 = require("../../_types/actionsList");
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const event_1 = require("../../_types/event");
const library_1 = require("../../_types/library");
const permissions_1 = require("../../_types/permissions");
const record_1 = require("../../_types/record");
const getAttributesFromField_1 = __importDefault(require("./helpers/getAttributesFromField"));
/**
 * Simple list of filters (fieldName: filterValue) to apply to get records.
 */
const allowedTypeOperator = {
    string: [
        record_1.AttributeCondition.EQUAL,
        record_1.AttributeCondition.NOT_EQUAL,
        record_1.AttributeCondition.BEGIN_WITH,
        record_1.AttributeCondition.END_WITH,
        record_1.AttributeCondition.CONTAINS,
        record_1.AttributeCondition.NOT_CONTAINS,
        record_1.AttributeCondition.START_ON,
        record_1.AttributeCondition.START_BEFORE,
        record_1.AttributeCondition.START_AFTER,
        record_1.AttributeCondition.END_ON,
        record_1.AttributeCondition.END_BEFORE,
        record_1.AttributeCondition.END_AFTER,
        record_1.TreeCondition.CLASSIFIED_IN,
        record_1.TreeCondition.NOT_CLASSIFIED_IN
    ],
    number: [
        record_1.AttributeCondition.EQUAL,
        record_1.AttributeCondition.NOT_EQUAL,
        record_1.AttributeCondition.GREATER_THAN,
        record_1.AttributeCondition.LESS_THAN,
        record_1.AttributeCondition.START_ON,
        record_1.AttributeCondition.START_BEFORE,
        record_1.AttributeCondition.START_AFTER,
        record_1.AttributeCondition.END_ON,
        record_1.AttributeCondition.END_BEFORE,
        record_1.AttributeCondition.END_AFTER,
        record_1.AttributeCondition.VALUES_COUNT_EQUAL,
        record_1.AttributeCondition.VALUES_COUNT_GREATER_THAN,
        record_1.AttributeCondition.VALUES_COUNT_LOWER_THAN
    ],
    boolean: [record_1.AttributeCondition.EQUAL, record_1.AttributeCondition.NOT_EQUAL],
    null: [
        record_1.AttributeCondition.EQUAL,
        record_1.AttributeCondition.NOT_EQUAL,
        record_1.AttributeCondition.IS_EMPTY,
        record_1.AttributeCondition.IS_NOT_EMPTY,
        record_1.AttributeCondition.TODAY,
        record_1.AttributeCondition.YESTERDAY,
        record_1.AttributeCondition.TOMORROW,
        record_1.AttributeCondition.LAST_MONTH,
        record_1.AttributeCondition.NEXT_MONTH
    ],
    object: [record_1.AttributeCondition.BETWEEN]
};
function default_1({ config = null, 'core.infra.record': recordRepo = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.value': valueDomain = null, 'core.domain.permission.record': recordPermissionDomain = null, 'core.domain.permission.library': libraryPermissionDomain = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.domain.helpers.validate': validateHelper = null, 'core.domain.record.helpers.sendRecordUpdateEvent': sendRecordUpdateEvent = null, 'core.infra.library': libraryRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.value': valueRepo = null, 'core.domain.eventsManager': eventsManager = null, 'core.infra.cache.cacheService': cacheService = null, 'core.utils': utils = null } = {}) {
    /**
     * Extract value from record if it's available (attribute simple), or fetch it from DB
     *
     * @param record
     * @param attribute
     * @param library
     * @param options
     * @param ctx
     */
    const _extractRecordValue = async (record, attribute, library, options, ctx) => {
        let values;
        if (typeof record[attribute.id] !== 'undefined') {
            // Format attribute field into simple value
            values = [
                {
                    value: attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK && typeof record[attribute.id] === 'string'
                        ? { id: record[attribute.id] }
                        : record[attribute.id]
                }
            ];
            // Apply actionsList
            values = await Promise.all(values.map(v => valueDomain.runActionsList({
                listName: actionsList_1.ActionsListEvents.GET_VALUE,
                value: v,
                attribute,
                record,
                library,
                ctx
            })));
        }
        else {
            values = await valueDomain.getValues({
                library,
                recordId: record.id,
                attribute: attribute.id,
                options,
                ctx
            });
        }
        return values;
    };
    const _checkLogicExpr = async (filters) => {
        const stack = [];
        const output = [];
        // convert to Reverse Polish Notation
        for (const f of filters) {
            await _validationFilter(f);
            if (!_isOperatorFilter(f)) {
                output.push(f);
            }
            else if (f.operator !== record_1.Operator.CLOSE_BRACKET) {
                stack.push(f);
            }
            else {
                let e = stack.pop();
                while (e && e.operator !== record_1.Operator.OPEN_BRACKET) {
                    output.push(e);
                    e = stack.pop();
                }
                if (!e) {
                    throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_FILTERS_EXPRESSION });
                }
            }
        }
        const rpn = output.concat(stack.reverse());
        // validation filters logical expression (order)
        let stackSize = 0;
        for (const e of rpn) {
            stackSize += !_isOperatorFilter(e) ? 1 : -1;
            if (stackSize <= 0) {
                throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_FILTERS_EXPRESSION });
            }
        }
        if (stackSize !== 1) {
            throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_FILTERS_EXPRESSION });
        }
    };
    const _getSimpleLinkedRecords = async (library, value, ctx) => {
        const filters = { type: [attribute_1.AttributeTypes.SIMPLE_LINK], linked_library: library };
        // get all attributes linked to the library param
        const attributes = await attributeDomain.getAttributes({
            params: {
                filters
            },
            ctx
        });
        const linkedValuesToDel = [];
        const libraryAttributes = {};
        // Get libraries using link attributes
        for (const attr of attributes.list) {
            const libs = await libraryRepo.getLibrariesUsingAttribute(attr.id, ctx);
            for (const l of libs) {
                libraryAttributes[l] = !!libraryAttributes[l] ? [...libraryAttributes[l], attr] : [attr];
            }
        }
        for (const [lib, attrs] of Object.entries(libraryAttributes)) {
            for (const attr of attrs) {
                let reverseLink;
                if (!!attr.reverse_link) {
                    reverseLink = await attributeDomain.getAttributeProperties({
                        id: attr.reverse_link,
                        ctx
                    });
                }
                const records = await recordRepo.find({
                    libraryId: lib,
                    filters: [
                        { attributes: [Object.assign(Object.assign({}, attr), { reverse_link: reverseLink })], condition: record_1.AttributeCondition.EQUAL, value }
                    ],
                    ctx
                });
                if (records.list.length) {
                    linkedValuesToDel.push({ records: records.list, attribute: attr.id });
                }
            }
        }
        return linkedValuesToDel;
    };
    const _isRelativeDateCondition = (condition) => {
        return (condition === record_1.AttributeCondition.TODAY ||
            condition === record_1.AttributeCondition.TOMORROW ||
            condition === record_1.AttributeCondition.YESTERDAY ||
            condition === record_1.AttributeCondition.NEXT_MONTH ||
            condition === record_1.AttributeCondition.LAST_MONTH);
    };
    const _isNumericCondition = (condition) => {
        return (condition === record_1.AttributeCondition.VALUES_COUNT_EQUAL ||
            condition === record_1.AttributeCondition.VALUES_COUNT_GREATER_THAN ||
            condition === record_1.AttributeCondition.VALUES_COUNT_LOWER_THAN);
    };
    const _isAttributeFilter = (filter) => {
        return (filter.condition in record_1.AttributeCondition &&
            typeof filter.field !== 'undefined' &&
            (typeof filter.value !== 'undefined' ||
                filter.condition === record_1.AttributeCondition.IS_EMPTY ||
                filter.condition === record_1.AttributeCondition.IS_NOT_EMPTY ||
                _isRelativeDateCondition(filter.condition)));
    };
    const _isClassifiedFilter = (filter) => {
        return filter.condition in record_1.TreeCondition && typeof filter.treeId !== 'undefined';
    };
    const _isOperatorFilter = (filter) => filter.operator in record_1.Operator;
    const _validationFilter = async (filter) => {
        if (typeof filter.condition === 'undefined' && typeof filter.operator === 'undefined') {
            throw new ValidationError_1.default({
                id: errors_1.Errors.INVALID_FILTER_FORMAT,
                message: 'Filter must have a condition or operator'
            });
        }
        if (filter.condition in record_1.AttributeCondition && !_isAttributeFilter(filter)) {
            throw new ValidationError_1.default({
                id: errors_1.Errors.INVALID_FILTER_FORMAT,
                message: 'Attribute filter must have condition, field and value'
            });
        }
        if (filter.condition in record_1.TreeCondition && !_isClassifiedFilter(filter)) {
            throw new ValidationError_1.default({
                id: errors_1.Errors.INVALID_FILTER_FORMAT,
                message: 'Classified filter must have condition, value and treeId'
            });
        }
    };
    const _getPreviews = async ({ conf, lib, record, visitedLibraries = [], ctx }) => {
        var _a, _b;
        const previewBaseUrl = (0, preview_1.getPreviewUrl)();
        visitedLibraries.push(lib.id);
        let previewRecord;
        // On a file, previews are accessible straight on the record
        // Otherwise, we fetch values of the previews attribute
        let previewsAttributeId;
        let fileLibraryId;
        if (lib.behavior === library_1.LibraryBehavior.FILES) {
            previewRecord = record;
            previewsAttributeId = utils.getPreviewsAttributeName(lib.id);
            fileLibraryId = lib.id;
        }
        else {
            const previewAttribute = conf.preview;
            if (!previewAttribute) {
                return null;
            }
            const previewAttributeProps = await attributeDomain.getAttributeProperties({ id: previewAttribute, ctx });
            const previewValues = await ret.getRecordFieldValue({
                library: lib.id,
                record,
                attributeId: previewAttribute,
                options: { forceArray: true, version: ctx.version },
                ctx
            });
            if (!previewValues.length) {
                return null;
            }
            const previewAttributeLibraryProps = (await libraryRepo.getLibraries({
                params: {
                    filters: { id: previewAttributeProps.linked_library }
                },
                ctx
            })).list[0];
            if (!previewAttributeLibraryProps) {
                return null;
            }
            previewRecord = previewValues[0].value;
            if (previewAttributeLibraryProps.behavior !== library_1.LibraryBehavior.FILES) {
                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library preview is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                return !visitedLibraries.includes(previewAttributeLibraryProps.id)
                    ? _getPreviews({
                        record: previewRecord,
                        lib: previewAttributeLibraryProps,
                        conf: previewAttributeLibraryProps.recordIdentityConf,
                        visitedLibraries,
                        ctx
                    })
                    : null;
            }
            previewsAttributeId = utils.getPreviewsAttributeName(previewRecord.library);
            fileLibraryId = previewRecord.library;
        }
        // Get value of the previews field. We're calling getRecordFieldValue to apply actions_list if any
        const filePreviewsValue = await ret.getRecordFieldValue({
            library: fileLibraryId,
            record: previewRecord,
            attributeId: previewsAttributeId,
            options: { forceArray: true },
            ctx
        });
        const previews = (_b = (_a = filePreviewsValue[0]) === null || _a === void 0 ? void 0 : _a.raw_value) !== null && _b !== void 0 ? _b : {};
        const previewsWithUrl = Object.entries(previews)
            .map(value => {
            const [key, url] = value;
            if (!url || url.toString() === '') {
                // avoid broken image
                return { [key]: null };
            }
            // add host url to preview
            const absoluteUrl = (0, path_1.join)(previewBaseUrl, url.toString());
            return { [key]: absoluteUrl };
        })
            .reduce((obj, o) => (Object.assign(Object.assign({}, obj), o)), {});
        previewsWithUrl.file = previewRecord;
        previewsWithUrl.original = `/${config.files.originalsPathPrefix}/${previewRecord.library}/${previewRecord.id}`;
        return previewsWithUrl;
    };
    const _getLibraryIconPreview = async (library, ctx) => {
        const cacheKey = `${utils.getCoreEntityCacheKey('library', library.id)}:icon_preview`;
        const _execute = async () => {
            var _a;
            // Retrieve library icon
            const libraryIcon = library.icon;
            if (!(libraryIcon === null || libraryIcon === void 0 ? void 0 : libraryIcon.libraryId) || !(libraryIcon === null || libraryIcon === void 0 ? void 0 : libraryIcon.recordId)) {
                return null;
            }
            const libraryIconRecord = await ret.find({
                params: {
                    library: libraryIcon.libraryId,
                    filters: [{ condition: record_1.AttributeCondition.EQUAL, field: 'id', value: libraryIcon.recordId }]
                },
                ctx
            });
            if (!((_a = libraryIconRecord === null || libraryIconRecord === void 0 ? void 0 : libraryIconRecord.list) === null || _a === void 0 ? void 0 : _a.length)) {
                return null;
            }
            const libraryIconLib = await getCoreEntityById('library', libraryIcon.libraryId, ctx);
            return _getPreviews({
                conf: libraryIconLib.recordIdentityConf,
                lib: libraryIconLib,
                record: libraryIconRecord.list[0],
                ctx
            });
        };
        return cacheService.memoize({ key: cacheKey, func: _execute, storeNulls: true, ctx });
    };
    const _getLabel = async (record, visitedLibraries = [], ctx) => {
        var _a;
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);
        const lib = (record === null || record === void 0 ? void 0 : record.library) ? await getCoreEntityById('library', record.library, ctx) : null;
        if (!lib) {
            throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
        }
        const conf = lib.recordIdentityConf || {};
        const valuesOptions = {
            version: (_a = ctx.version) !== null && _a !== void 0 ? _a : null
        };
        let label = null;
        if (conf.label) {
            const labelAttributeProps = await attributeDomain.getAttributeProperties({ id: conf.label, ctx });
            const labelValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.label,
                options: valuesOptions,
                ctx
            });
            if (!labelValues.length) {
                return null;
            }
            if (utils.isLinkAttribute(labelAttributeProps)) {
                const linkValue = labelValues.pop().value;
                // To avoid infinite loop, we check if the library has already been visited. If so, we return the id.
                // For example, if the users' library label is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(labelAttributeProps.linked_library)) {
                    return linkValue.id;
                }
                label = await _getLabel(linkValue, visitedLibraries, ctx);
            }
            else if (utils.isTreeAttribute(labelAttributeProps)) {
                label = await _getLabel(labelValues.pop().value.record, visitedLibraries, ctx);
            }
            else {
                label = labelValues.pop().value;
            }
        }
        return label;
    };
    const _getColor = async (record, visitedLibraries = [], ctx) => {
        var _a;
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);
        const lib = (record === null || record === void 0 ? void 0 : record.library) ? await getCoreEntityById('library', record.library, ctx) : null;
        if (!lib) {
            throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
        }
        const conf = lib.recordIdentityConf || {};
        const valuesOptions = {
            version: (_a = ctx.version) !== null && _a !== void 0 ? _a : null
        };
        let color = null;
        if (conf.color) {
            const colorAttributeProps = await attributeDomain.getAttributeProperties({ id: conf.color, ctx });
            const colorValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.color,
                options: valuesOptions,
                ctx
            });
            if (!colorValues.length) {
                return null;
            }
            if (utils.isLinkAttribute(colorAttributeProps)) {
                const linkValue = colorValues.pop().value;
                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library color is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(colorAttributeProps.linked_library)) {
                    return null;
                }
                color = await _getColor(linkValue, visitedLibraries, ctx);
            }
            else if (utils.isTreeAttribute(colorAttributeProps)) {
                const treeValue = colorValues.pop().value.record;
                color = await _getColor(treeValue, visitedLibraries, ctx);
            }
            else {
                color = colorValues.pop().value;
            }
        }
        return color;
    };
    const _getSubLabel = async (record, visitedLibraries = [], ctx) => {
        var _a;
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);
        const lib = (record === null || record === void 0 ? void 0 : record.library) ? await getCoreEntityById('library', record.library, ctx) : null;
        if (!lib) {
            throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
        }
        const conf = lib.recordIdentityConf || {};
        const valuesOptions = {
            version: (_a = ctx.version) !== null && _a !== void 0 ? _a : null
        };
        let subLabel = null;
        if (conf.subLabel) {
            const subLabelAttributeProps = await attributeDomain.getAttributeProperties({ id: conf.subLabel, ctx });
            const subLabelValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.subLabel,
                options: valuesOptions,
                ctx
            });
            if (conf.subLabel === 'id') {
                subLabelValues[0].value = record.id;
            }
            if (!subLabelValues.length) {
                return null;
            }
            if (utils.isLinkAttribute(subLabelAttributeProps)) {
                const linkValue = subLabelValues.pop().value;
                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library color is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(subLabelAttributeProps.linked_library)) {
                    return null;
                }
                subLabel = await _getSubLabel(linkValue, visitedLibraries, ctx);
            }
            else if (utils.isTreeAttribute(subLabelAttributeProps)) {
                const treeValue = subLabelValues.pop().value.record;
                subLabel = await _getSubLabel(treeValue, visitedLibraries, ctx);
            }
            else {
                subLabel = subLabelValues.pop().value;
            }
        }
        return subLabel;
    };
    const _getRecordIdentity = async (record, ctx) => {
        var _a, _b, _c, _d, _e;
        const lib = await getCoreEntityById('library', record.library, ctx);
        if (!lib) {
            throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
        }
        const conf = lib.recordIdentityConf || {};
        const valuesOptions = {
            version: (_a = ctx.version) !== null && _a !== void 0 ? _a : null
        };
        let label = null;
        if (conf.label) {
            label = await _getLabel(record, [], ctx);
        }
        let subLabel = null;
        if (conf.subLabel) {
            subLabel = await _getSubLabel(record, [], ctx);
        }
        let color = null;
        if (conf.color) {
            color = await _getColor(record, [], ctx);
        }
        let preview = null;
        if (conf.preview || lib.behavior === library_1.LibraryBehavior.FILES) {
            preview = (_b = (await _getPreviews({ conf, lib, record, ctx }))) !== null && _b !== void 0 ? _b : null;
        }
        //look in tree if not defined on current record
        if ((color === null || preview === null) && conf.treeColorPreview) {
            const treeValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.treeColorPreview,
                options: valuesOptions,
                ctx
            });
            if (treeValues.length) {
                // for now we look through first element (discard others if linked to multiple leaves of tree)
                const treeAttrProps = await attributeDomain.getAttributeProperties({ id: conf.treeColorPreview, ctx });
                const ancestors = await treeRepo.getElementAncestors({
                    treeId: treeAttrProps.linked_tree,
                    nodeId: treeValues[0].value.id,
                    ctx
                });
                const inheritedData = await ancestors.reduceRight(async (resProm, ancestor) => {
                    const res = await resProm; // cause async function so res is a promise
                    if (res.color !== null && res.preview !== null) {
                        // already found data, nothing to do
                        return res;
                    }
                    const ancestorIdentity = await _getRecordIdentity(ancestor.record, ctx);
                    return {
                        color: res.color === null ? ancestorIdentity.color : res.color,
                        preview: res.preview === null ? ancestorIdentity.preview : res.preview
                    };
                }, Promise.resolve({ color, preview }));
                color = color === null ? inheritedData.color : color;
                preview = preview === null ? inheritedData.preview : preview;
            }
        }
        // If no preview found, or preview is not available, use library icon if any
        if (preview === null ||
            !Object.keys((_e = (_c = preview === null || preview === void 0 ? void 0 : preview.file) === null || _c === void 0 ? void 0 : _c[utils.getPreviewsAttributeName((_d = preview === null || preview === void 0 ? void 0 : preview.file) === null || _d === void 0 ? void 0 : _d.library)]) !== null && _e !== void 0 ? _e : {}).length) {
            preview = await _getLibraryIconPreview(lib, ctx);
        }
        const identity = {
            id: record.id,
            library: lib,
            label,
            subLabel,
            color,
            preview
        };
        return identity;
    };
    const ret = {
        async createRecord({ library, values, ctx }) {
            const recordData = {
                created_at: (0, moment_1.default)().unix(),
                created_by: String(ctx.userId),
                modified_at: (0, moment_1.default)().unix(),
                modified_by: String(ctx.userId),
                active: true
            };
            const canCreate = await libraryPermissionDomain.getLibraryPermission({
                action: permissions_1.LibraryPermissionsActions.CREATE_RECORD,
                userId: ctx.userId,
                libraryId: library,
                ctx
            });
            if (!canCreate) {
                throw new PermissionError_1.default(permissions_1.LibraryPermissionsActions.CREATE_RECORD);
            }
            if (values === null || values === void 0 ? void 0 : values.length) {
                // First, check if values are ok. If not, we won't create the record at all
                const res = await Promise.allSettled(values.map(async (v) => {
                    const attributeProps = await attributeDomain.getAttributeProperties({
                        id: v.attribute,
                        ctx
                    });
                    return valueDomain.runActionsList({
                        listName: actionsList_1.ActionsListEvents.SAVE_VALUE,
                        value: v,
                        attribute: attributeProps,
                        library,
                        ctx
                    });
                }));
                const errors = res
                    .filter(r => r.status === 'rejected')
                    .map(err => {
                    const rejection = err;
                    const errorAttribute = rejection.reason.context.attributeId;
                    return {
                        type: rejection.reason.type,
                        attributeId: errorAttribute,
                        id_value: rejection.reason.context.value.id_value,
                        input: rejection.reason.context.value.value,
                        message: utils.translateError(rejection.reason.fields[errorAttribute], ctx.lang)
                    };
                });
                if (errors.length) {
                    return { record: null, valuesErrors: errors };
                }
            }
            const newRecord = await recordRepo.createRecord({ libraryId: library, recordData, ctx });
            if (values === null || values === void 0 ? void 0 : values.length) {
                // Make sure we don't any id_value hanging on as we're on creation here
                const cleanValues = values.map(v => (Object.assign(Object.assign({}, v), { id_value: null })));
                await valueDomain.saveValueBatch({
                    library,
                    recordId: newRecord.id,
                    values: cleanValues,
                    ctx
                });
            }
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.RECORD_SAVE,
                data: {
                    id: newRecord.id,
                    libraryId: newRecord.library,
                    new: newRecord
                }
            }, ctx);
            return { record: newRecord, valuesErrors: null };
        },
        async updateRecord({ library, recordData, ctx }) {
            const savedRecord = await recordRepo.updateRecord({ libraryId: library, recordData });
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.RECORD_SAVE,
                data: {
                    id: recordData.id,
                    libraryId: library,
                    new: recordData
                }
            }, ctx);
            await sendRecordUpdateEvent({ recordData, library }, null, ctx);
            return savedRecord;
        },
        async deleteRecord({ library, id, ctx }) {
            await validateHelper.validateLibrary(library, ctx);
            // Check permission
            const canDelete = await recordPermissionDomain.getRecordPermission({
                action: permissions_1.RecordPermissionsActions.DELETE_RECORD,
                userId: ctx.userId,
                library,
                recordId: id,
                ctx
            });
            if (!canDelete) {
                throw new PermissionError_1.default(permissions_1.RecordPermissionsActions.DELETE_RECORD);
            }
            const simpleLinkedRecords = await _getSimpleLinkedRecords(library, id, ctx);
            // delete simple linked values
            for (const e of simpleLinkedRecords) {
                for (const r of e.records) {
                    await valueDomain.deleteValue({
                        library: r.library,
                        recordId: r.id,
                        attribute: e.attribute,
                        ctx
                    });
                }
            }
            // Delete linked values (advanced, advanced link and tree)
            await valueRepo.deleteAllValuesByRecord({ libraryId: library, recordId: id, ctx });
            // Remove element from all trees
            const libraryTrees = await treeRepo.getTrees({
                params: {
                    filters: {
                        library
                    }
                },
                ctx
            });
            // For each tree, get all record nodes
            await Promise.all(libraryTrees.list.map(async (tree) => {
                const nodes = await treeRepo.getNodesByRecord({
                    treeId: tree.id,
                    record: {
                        id,
                        library
                    },
                    ctx
                });
                for (const node of nodes) {
                    await treeRepo.deleteElement({
                        treeId: tree.id,
                        nodeId: node,
                        deleteChildren: true,
                        ctx
                    });
                }
            }));
            // Everything is clean, we can actually delete the record
            const deletedRecord = await recordRepo.deleteRecord({ libraryId: library, recordId: id, ctx });
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.RECORD_DELETE,
                data: {
                    id: deletedRecord.id,
                    libraryId: deletedRecord.library,
                    old: deletedRecord.old
                }
            }, ctx);
            return deletedRecord;
        },
        async find({ params, ctx }) {
            var _a;
            const { library, sort, pagination, withCount, retrieveInactive = false } = params;
            const { filters = [], fulltextSearch } = params;
            const fullFilters = [];
            let fullSort;
            const isLibraryAccessible = await libraryPermissionDomain.getLibraryPermission({
                libraryId: params.library,
                userId: ctx.userId,
                action: permissions_1.LibraryPermissionsActions.ACCESS_LIBRARY,
                ctx
            });
            if (!isLibraryAccessible) {
                throw new PermissionError_1.default(permissions_1.LibraryPermissionsActions.ACCESS_LIBRARY);
            }
            if (filters.length) {
                await _checkLogicExpr(filters);
            }
            // Hydrate filters with attribute properties and cast filters values if needed
            for (const f of filters) {
                let filter = {};
                if (_isAttributeFilter(f)) {
                    const attributes = await (0, getAttributesFromField_1.default)({
                        field: f.field,
                        condition: f.condition,
                        deps: {
                            'core.domain.attribute': attributeDomain,
                            'core.infra.library': libraryRepo,
                            'core.infra.tree': treeRepo
                        },
                        ctx
                    });
                    // Set reverse links if necessary.
                    const attrsRepo = (await Promise.all(attributes.map(async (a) => !!a.reverse_link
                        ? Object.assign(Object.assign({}, a), { reverse_link: await attributeDomain.getAttributeProperties({
                                id: a.reverse_link,
                                ctx
                            }) }) : a)));
                    let value = (_a = f.value) !== null && _a !== void 0 ? _a : null;
                    const lastAttr = attrsRepo[attrsRepo.length - 1];
                    if (value !== null) {
                        if (lastAttr.format === attribute_1.AttributeFormats.NUMERIC ||
                            (lastAttr.format === attribute_1.AttributeFormats.DATE &&
                                f.condition !== record_1.AttributeCondition.BETWEEN &&
                                !_isRelativeDateCondition(filter.condition)) ||
                            _isNumericCondition(f.condition)) {
                            value = Number(f.value);
                        }
                        else if (lastAttr.format === attribute_1.AttributeFormats.BOOLEAN) {
                            value = f.value === 'true';
                        }
                        else if (lastAttr.format === attribute_1.AttributeFormats.DATE &&
                            f.condition === record_1.AttributeCondition.BETWEEN) {
                            value = JSON.parse(f.value);
                            if (typeof value.from === 'undefined' || typeof value.to === 'undefined') {
                                throw new ValidationError_1.default({ condition: errors_1.Errors.INVALID_FILTER_CONDITION_VALUE });
                            }
                        }
                    }
                    const valueType = value === null ? 'null' : typeof value;
                    if ((f.condition && !allowedTypeOperator[valueType].includes(f.condition)) ||
                        (f.condition === record_1.AttributeCondition.BETWEEN &&
                            (typeof value.from === 'undefined' || typeof value.to === 'undefined'))) {
                        throw new ValidationError_1.default({ condition: errors_1.Errors.INVALID_FILTER_CONDITION_VALUE });
                    }
                    filter = { attributes: attrsRepo, value, condition: f.condition };
                }
                else {
                    filter = f;
                }
                fullFilters.push(filter);
            }
            // Check sort fields
            if (sort) {
                const sortAttributes = await (0, getAttributesFromField_1.default)({
                    field: sort.field,
                    condition: null,
                    deps: {
                        'core.domain.attribute': attributeDomain,
                        'core.infra.library': libraryRepo,
                        'core.infra.tree': treeRepo
                    },
                    ctx
                });
                const sortAttributesRepo = (await Promise.all(sortAttributes.map(async (a) => !!a.reverse_link
                    ? Object.assign(Object.assign({}, a), { reverse_link: await attributeDomain.getAttributeProperties({
                            id: a.reverse_link,
                            ctx
                        }) }) : a)));
                fullSort = {
                    attributes: sortAttributesRepo,
                    order: sort.order
                };
            }
            const records = await recordRepo.find({
                libraryId: library,
                filters: fullFilters,
                sort: fullSort,
                pagination,
                withCount,
                retrieveInactive,
                fulltextSearch,
                ctx
            });
            return records;
        },
        getRecordIdentity: _getRecordIdentity,
        async getRecordFieldValue({ library, record, attributeId, options, ctx }) {
            var _a;
            const attrProps = await attributeDomain.getAttributeProperties({ id: attributeId, ctx });
            let values = await _extractRecordValue(record, attrProps, library, options, ctx);
            const hasNoValue = values.length === 0;
            if (hasNoValue) {
                values = [
                    {
                        value: null
                    }
                ];
            }
            const forceArray = (_a = options === null || options === void 0 ? void 0 : options.forceArray) !== null && _a !== void 0 ? _a : false;
            //TODO: fix "[object]" on input after edit
            let formattedValues = await Promise.all(values.map(async (v) => {
                const formattedValue = await valueDomain.formatValue({
                    attribute: attrProps,
                    value: v,
                    record,
                    library,
                    ctx
                });
                if (attrProps.metadata_fields && formattedValue.metadata) {
                    for (const metadataField of attrProps.metadata_fields) {
                        if (!formattedValue.metadata[metadataField]) {
                            continue;
                        }
                        const metadataAttributeProps = await attributeDomain.getAttributeProperties({
                            id: metadataField,
                            ctx
                        });
                        formattedValue.metadata[metadataField] = await valueDomain.runActionsList({
                            listName: actionsList_1.ActionsListEvents.GET_VALUE,
                            attribute: metadataAttributeProps,
                            library,
                            value: formattedValue.metadata[metadataField],
                            ctx
                        });
                    }
                }
                return formattedValue;
            }));
            // sort of flatMap cause _formatRecordValue can return multiple values for 1 input val (think heritage)
            formattedValues = formattedValues.reduce((acc, v) => {
                if (Array.isArray(v.value)) {
                    acc = [
                        ...acc,
                        ...v.value.map(vpart => ({
                            value: vpart,
                            attribute: v.attribute
                        }))
                    ];
                }
                else {
                    acc.push(v);
                }
                return acc;
            }, []);
            if (hasNoValue) {
                // remove null values or values that do not represent a record
                formattedValues = formattedValues.filter(v => v.value !== null &&
                    typeof v.value === 'object' &&
                    v.value.hasOwnProperty('id') &&
                    v.value.hasOwnProperty('library'));
            }
            return attrProps.multiple_values || forceArray ? formattedValues : formattedValues[0] || null;
        },
        async deactivateRecord(record, ctx) {
            const savedVal = await valueDomain.saveValue({
                library: record.library,
                recordId: record.id,
                attribute: 'active',
                value: { value: false },
                ctx
            });
            return Object.assign(Object.assign({}, record), { active: savedVal.value });
        },
        async activateRecord(record, ctx) {
            const savedVal = await valueDomain.saveValue({
                library: record.library,
                recordId: record.id,
                attribute: 'active',
                value: { value: true },
                ctx
            });
            return Object.assign(Object.assign({}, record), { active: savedVal.value });
        },
        async deactivateRecordsBatch({ libraryId, recordsIds, filters, ctx }) {
            let recordsToDeactivate = recordsIds !== null && recordsIds !== void 0 ? recordsIds : [];
            if (filters) {
                const records = await this.find({
                    params: {
                        library: libraryId,
                        filters,
                        options: { forceArray: true, forceGetAllValues: true },
                        retrieveInactive: false,
                        withCount: false
                    },
                    ctx
                });
                recordsToDeactivate = records.list.map(record => record.id);
            }
            if (!recordsToDeactivate.length) {
                return [];
            }
            const inactiveRecords = await Promise.all(recordsToDeactivate.map(recordId => this.deactivateRecord({ id: recordId, library: libraryId }, ctx)));
            return inactiveRecords;
        },
        async purgeInactiveRecords({ libraryId, ctx }) {
            const inactiveRecords = await this.find({
                params: {
                    library: libraryId,
                    filters: [{ field: 'active', condition: record_1.AttributeCondition.EQUAL, value: 'false' }]
                },
                ctx
            });
            const purgedRecords = [];
            for (const record of inactiveRecords.list) {
                purgedRecords.push(await this.deleteRecord({
                    library: libraryId,
                    id: record.id,
                    ctx
                }));
            }
            return purgedRecords;
        }
    };
    return ret;
}
exports.default = default_1;
