"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceljs_1 = __importDefault(require("exceljs"));
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const tasksManager_1 = require("../../_types/tasksManager");
function default_1({ config = null, 'core.domain.record': recordDomain = null, 'core.domain.helpers.validate': validateHelper = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.library': libraryDomain = null, 'core.domain.tasksManager': tasksManager = null, 'core.domain.helpers.updateTaskProgress': updateTaskProgress = null, 'core.utils': utils = null, translator = null } = {}) {
    const _getFormattedValues = async (attribute, values, ctx) => {
        if (attribute.type === attribute_1.AttributeTypes.TREE) {
            values = values.map(v => {
                var _a;
                return (Object.assign(Object.assign({}, v), { value: (_a = v.value) === null || _a === void 0 ? void 0 : _a.record }));
            });
        }
        if (attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK ||
            attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK ||
            attribute.type === attribute_1.AttributeTypes.TREE) {
            for (const [i, v] of values.entries()) {
                const recordIdentity = await recordDomain.getRecordIdentity({ id: v.value.id, library: attribute.linked_library || v.value.library }, ctx);
                values[i].value = recordIdentity.label || v.value.id;
            }
        }
        return values;
    };
    const _extractRecordFieldValue = async (record, attribute, asRecord, ctx) => {
        let res = await recordDomain.getRecordFieldValue({
            library: record.library,
            record,
            attributeId: attribute.id,
            ctx
        });
        if (res !== null && asRecord) {
            if (attribute.type === attribute_1.AttributeTypes.TREE) {
                res = Array.isArray(res) ? res.map(e => e.value.record) : res.value.record;
            }
            else if (attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK ||
                attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK) {
                res = Array.isArray(res) ? res.map(e => e.value) : res.value;
            }
        }
        return res;
    };
    const _getRecFieldValue = async (elements, attributes, ctx) => {
        if (!attributes.length) {
            return elements;
        }
        const attrProps = await attributeDomain.getAttributeProperties({ id: attributes[0], ctx });
        const values = [];
        for (const elem of elements) {
            if (Array.isArray(elem)) {
                for (const e of elem) {
                    const value = await _extractRecordFieldValue(e, attrProps, attributes.length > 1, ctx);
                    if (value !== null) {
                        values.push(value);
                    }
                }
            }
            else {
                const value = await _extractRecordFieldValue(elem, attrProps, attributes.length > 1, ctx);
                if (value !== null) {
                    values.push(value);
                }
            }
        }
        return _getRecFieldValue(values, attributes.slice(1), ctx);
    };
    return {
        async export(params, task) {
            const { library, attributes, filters, ctx } = params;
            if (typeof (task === null || task === void 0 ? void 0 : task.id) === 'undefined') {
                const newTaskId = (0, uuid_1.v4)();
                await tasksManager.createTask(Object.assign({ id: newTaskId, label: config.lang.available.reduce((labels, lang) => {
                        labels[lang] = `${translator.t('tasks.export_label', { lng: lang, library })}`;
                        return labels;
                    }, {}), func: {
                        moduleName: 'domain',
                        subModuleName: 'export',
                        name: 'export',
                        args: params
                    }, role: {
                        type: tasksManager_1.TaskType.EXPORT
                    }, startAt: !!task.startAt ? task.startAt : Math.floor(Date.now() / 1000), priority: tasksManager_1.TaskPriority.MEDIUM }, (!!(task === null || task === void 0 ? void 0 : task.callbacks) && { callbacks: task.callbacks })), ctx);
                return newTaskId;
            }
            const progress = {
                recordsNb: 0,
                position: 0,
                percent: 0
            };
            const _updateTaskProgress = async (increasePosition, translationKey) => {
                progress.position += increasePosition;
                progress.percent = await updateTaskProgress(task.id, progress.percent, ctx, Object.assign({ position: {
                        index: progress.position,
                        total: progress.recordsNb
                    } }, (translationKey && { translationKey })));
            };
            // separate different depths
            const attrsSplited = attributes.map(a => a.split('.'));
            const firstAttributes = attrsSplited.map(a => a[0]);
            // Validations
            await validateHelper.validateLibrary(library, ctx);
            const libraryAttributes = await attributeDomain.getLibraryAttributes(library, ctx);
            const libraryAttributesIds = libraryAttributes.map(a => a.id);
            const invalidAttributes = firstAttributes.filter(a => !libraryAttributesIds.includes(a));
            if (invalidAttributes.length) {
                throw utils.generateExplicitValidationError('attributes', {
                    msg: errors_1.Errors.INVALID_ATTRIBUTES,
                    vars: { attributes: invalidAttributes.join(', ') }
                }, ctx.lang);
            }
            await _updateTaskProgress(0, 'tasks.export_description.elements_retrieval');
            const records = await recordDomain.find({ params: { library, filters }, ctx });
            progress.recordsNb = records.list.length;
            // Create Excel document
            const workbook = new exceljs_1.default.Workbook();
            // Set page
            const libAttributes = await libraryDomain.getLibraryProperties(library, ctx);
            const data = workbook.addWorksheet((libAttributes === null || libAttributes === void 0 ? void 0 : libAttributes.label[ctx === null || ctx === void 0 ? void 0 : ctx.lang]) || (libAttributes === null || libAttributes === void 0 ? void 0 : libAttributes.label[config.lang.default]) || library);
            // Set columns
            const columns = [];
            const labels = {};
            for (const a of attributes) {
                columns.push({ header: a, key: a });
                const attrProps = await attributeDomain.getAttributeProperties({ id: a.split('.').pop(), ctx });
                labels[a] = (attrProps === null || attrProps === void 0 ? void 0 : attrProps.label[ctx === null || ctx === void 0 ? void 0 : ctx.lang]) || (attrProps === null || attrProps === void 0 ? void 0 : attrProps.label[config.lang.default]) || attrProps.id;
            }
            data.columns = columns;
            data.addRow(labels);
            for (const record of records.list) {
                // keep only attributes record to export
                const subset = (0, lodash_1.pick)(record, firstAttributes);
                for (const attr of attrsSplited) {
                    // get values of full path attribute
                    const fieldValues = await _getRecFieldValue([record], attr, ctx);
                    // get record label or id if last attribute of full path is a link or tree type
                    const attrProps = await attributeDomain.getAttributeProperties({ id: attr[attr.length - 1], ctx });
                    const value = await _getFormattedValues(attrProps, fieldValues.flat(Infinity), ctx);
                    // set value(s) and concat them if there are several
                    subset[attr.join('.')] = value.map(v => v.value).join(' | ');
                }
                // Add subset object record on excel row document
                data.addRow(subset);
                await _updateTaskProgress(1, 'tasks.export_description.excel_writing');
            }
            const filename = `${library}_${new Date().toLocaleDateString().split('/').join('')}_${Date.now()}.xlsx`;
            await workbook.xlsx.writeFile(`${path_1.default.resolve(config.export.directory)}/${filename}`);
            // This is a public URL users will use to retrieve files.
            // It must match the route defined in the server.
            const url = `/${config.export.endpoint}/${filename}`;
            await tasksManager.setLink(task.id, { name: 'export file', url }, ctx);
            return task.id;
        }
    };
}
exports.default = default_1;
