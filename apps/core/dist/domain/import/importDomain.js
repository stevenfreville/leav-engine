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
exports.IMPORT_CONFIG_SCHEMA_PATH = exports.IMPORT_DATA_SCHEMA_PATH = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const exceljs_1 = __importDefault(require("exceljs"));
const fs_1 = __importDefault(require("fs"));
const jsonparse_1 = __importDefault(require("jsonparse"));
const jsonschema_1 = require("jsonschema");
const helpers_1 = require("jsonschema/lib/helpers");
const nanoid_1 = require("nanoid");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const import_1 = require("../../_types/import");
const record_1 = require("../../_types/record");
const tasksManager_1 = require("../../_types/tasksManager");
exports.IMPORT_DATA_SCHEMA_PATH = path_1.default.resolve(__dirname, './import-data-schema.json');
exports.IMPORT_CONFIG_SCHEMA_PATH = path_1.default.resolve(__dirname, './import-config-schema.json');
const DEFAULT_IMPORT_MODE = import_1.ImportMode.UPSERT;
var ImportAction;
(function (ImportAction) {
    ImportAction["CREATED"] = "created";
    ImportAction["UPDATED"] = "updated";
    ImportAction["IGNORED"] = "ignored";
})(ImportAction || (ImportAction = {}));
function default_1({ 'core.domain.library': libraryDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.helpers.validate': validateHelper = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.value': valueDomain = null, 'core.domain.tree': treeDomain = null, 'core.infra.cache.cacheService': cacheService = null, 'core.domain.tasksManager': tasksManagerDomain = null, 'core.domain.helpers.updateTaskProgress': updateTaskProgress = null, 'core.utils': utils = null, config = null, translator = null } = {}) {
    const _addValue = async (library, attribute, recordId, value, ctx, valueId) => {
        var _a;
        const isMatch = Array.isArray(value.value);
        if (isMatch) {
            const recordsList = await recordDomain.find({
                params: {
                    library: attribute.type === attribute_1.AttributeTypes.TREE ? value.library : attribute.linked_library,
                    filters: _matchesToFilters(value.value)
                },
                ctx
            });
            value.value = (_a = recordsList.list[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (attribute.type === attribute_1.AttributeTypes.TREE) {
                const node = await treeDomain.getNodesByRecord({
                    treeId: attribute.linked_tree,
                    record: {
                        id: value.value,
                        library: value.library
                    },
                    ctx
                });
                value.value = node[0];
            }
            if (typeof value.value === 'undefined') {
                // TODO: Throw
                return;
            }
        }
        await valueDomain.saveValue({
            library,
            recordId,
            attribute: attribute.id,
            value: { value: value.value, id_value: valueId, metadata: value.metadata, version: value.version },
            ctx
        });
    };
    const _treatElement = async (library, data, recordIds, ctx) => {
        var _a;
        const attrs = await attributeDomain.getLibraryAttributes(library, ctx);
        const libraryAttribute = attrs.find(a => a.id === data.attribute);
        if (typeof libraryAttribute === 'undefined') {
            throw new ValidationError_1.default({
                id: { msg: errors_1.Errors.UNKNOWN_ATTRIBUTE, vars: { attribute: data.attribute } }
            });
        }
        for (const recordId of recordIds) {
            let currentValues;
            if (data.action === import_1.Action.REPLACE) {
                currentValues = await valueDomain.getValues({
                    library,
                    recordId,
                    attribute: libraryAttribute.id,
                    ctx
                });
                // if replace && multiple values, delete all old values
                if (libraryAttribute.multiple_values) {
                    for (const cv of currentValues) {
                        await valueDomain.deleteValue({
                            library,
                            recordId,
                            attribute: libraryAttribute.id,
                            value: { id_value: cv.id_value },
                            ctx
                        });
                    }
                }
            }
            for (const v of data.values) {
                try {
                    const valueId = data.action === import_1.Action.REPLACE && !libraryAttribute.multiple_values
                        ? (_a = currentValues[0]) === null || _a === void 0 ? void 0 : _a.id_value
                        : undefined;
                    await _addValue(library, libraryAttribute, recordId, v, ctx, valueId);
                }
                catch (err) {
                    if (!(err instanceof ValidationError_1.default) && !(err instanceof PermissionError_1.default)) {
                        throw err;
                    }
                    utils.rethrow(err, translator.t('import.add_value_error', {
                        lng: ctx.lang || config.lang.default,
                        attributeId: libraryAttribute.id,
                        value: v.value
                    }));
                }
            }
        }
    };
    const _matchesToFilters = (matches) => {
        // add AND operator between matches
        const filters = matches.reduce((acc, m) => acc.concat(m, { operator: record_1.Operator.AND }), []);
        // delete last AND operator
        filters.pop();
        const filtersLight = filters.map((m) => {
            if (!!m.operator) {
                return { operator: m.operator };
            }
            return {
                field: m.attribute,
                condition: record_1.AttributeCondition.EQUAL,
                value: m.value
            };
        });
        return filtersLight;
    };
    const _getMatchRecords = async (library, matches, ctx) => {
        let recordIds = [];
        if (matches.length) {
            const recordsList = await recordDomain.find({
                params: {
                    library,
                    filters: _matchesToFilters(matches)
                },
                ctx
            });
            if (recordsList.list.length) {
                recordIds = recordsList.list.map(r => r.id);
            }
        }
        return recordIds;
    };
    const _treatTree = async (library, treeId, parent, elements, action, ctx, order) => {
        if (action === import_1.Action.UPDATE) {
            if (!elements.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.MISSING_ELEMENTS });
            }
            for (const e of elements) {
                const record = { library, id: e };
                const elementNodes = await treeDomain.getNodesByRecord({ treeId, record, ctx });
                const destination = parent
                    ? (await treeDomain.getNodesByRecord({ treeId, record: parent, ctx }))[0]
                    : null;
                if (parent && !destination) {
                    throw new ValidationError_1.default({ parent: errors_1.Errors.UNKNOWN_PARENT });
                }
                if (elementNodes.length) {
                    // If record is at multiple places in tree, only move the first
                    await treeDomain.moveElement({
                        treeId,
                        nodeId: elementNodes[0],
                        parentTo: destination,
                        order,
                        ctx
                    });
                }
                else {
                    await treeDomain.addElement({
                        treeId,
                        element: { library, id: e },
                        parent: destination,
                        order,
                        ctx
                    });
                }
            }
        }
        else if (action === import_1.Action.REMOVE) {
            if (elements.length) {
                for (const e of elements) {
                    const record = { library, id: e };
                    const elementNodes = await treeDomain.getNodesByRecord({ treeId, record, ctx });
                    for (const node of elementNodes) {
                        await treeDomain.deleteElement({ treeId, nodeId: node, deleteChildren: true, ctx });
                    }
                }
            }
            else if (typeof parent !== 'undefined') {
                const parentNodes = await treeDomain.getNodesByRecord({ treeId, record: parent, ctx });
                const children = await treeDomain.getElementChildren({ treeId, nodeId: parentNodes[0], ctx });
                for (const child of children.list) {
                    await treeDomain.deleteElement({
                        treeId,
                        nodeId: child.id,
                        deleteChildren: true,
                        ctx
                    });
                }
            }
        }
    };
    const _getStoredFileData = async (filename, callbackElement, callbackTree, ctx, updateProgress) => {
        return new Promise((resolve, reject) => {
            const parser = new jsonparse_1.default();
            const fileStream = fs_1.default.createReadStream(`${config.import.directory}/${filename}`, { highWaterMark: 128 }); // 128 characters by chunk
            let elementIndex = 0;
            let treeIndex = 0;
            let treesReached = false;
            // We stack the callbacks and after reaching a specific length we pause
            // the flow and execute them all before resuming the flow again.
            let callbacks = [];
            const callCallbacks = async () => {
                fileStream.pause();
                await Promise.all(callbacks.map(c => c()));
                callbacks = [];
                fileStream.resume();
            };
            parser.onValue = async function (data) {
                var _a, _b;
                try {
                    if (((_a = this.stack[this.stack.length - 1]) === null || _a === void 0 ? void 0 : _a.key) === 'elements' && !!data.library) {
                        if (callbacks.length >= config.import.groupData) {
                            await callCallbacks();
                        }
                        callbacks.push(async () => callbackElement(data, elementIndex++));
                        if (typeof updateProgress !== 'undefined') {
                            await updateProgress(data.matches.length + data.data.length, 'tasks.import_description.elements_process');
                        }
                    }
                    else if (((_b = this.stack[this.stack.length - 1]) === null || _b === void 0 ? void 0 : _b.key) === 'trees' && !!data.treeId) {
                        // If the first tree has never been reached before we check if callbacks for
                        // elements are still pending and call them before processing the trees.
                        if (!treesReached) {
                            await callCallbacks();
                        }
                        treesReached = true;
                        // We dont stack callbacks for trees to keep the order
                        // of JSON file because of the parent attribute.
                        fileStream.pause();
                        await callbackTree(data, treeIndex++);
                        if (typeof updateProgress !== 'undefined') {
                            await updateProgress(1, 'tasks.import_description.tree_elements_process');
                        }
                        fileStream.resume();
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            fileStream.on('error', err => reject(new Error(translator.t(`errors.${errors_1.Errors.FILE_ERROR}`, {
                lng: ctx.lang,
                error: err,
                interpolation: { escapeValue: false }
            }))));
            fileStream.on('data', chunk => {
                parser.write(chunk);
            });
            fileStream.on('end', async () => {
                try {
                    // If there are still pending callbacks we call them.
                    if (callbacks.length) {
                        await callCallbacks();
                    }
                }
                catch (e) {
                    reject(e);
                }
                resolve(true);
            });
        });
    };
    const _getFileDataBuffer = async (filepath, ctx) => {
        const fileStream = fs_1.default.createReadStream(filepath);
        const data = await (() => new Promise((resolve, reject) => {
            const chunks = [];
            fileStream.on('data', chunk => chunks.push(chunk));
            fileStream.on('error', err => {
                reject(new Error(translator.t(`errors.${errors_1.Errors.FILE_ERROR}`, {
                    lng: ctx.lang,
                    error: err,
                    interpolation: { escapeValue: false }
                })));
            });
            fileStream.on('end', () => resolve(Buffer.concat(chunks)));
        }))();
        return data;
    };
    const _jsonSchemaValidation = async (schemaPath, filepath, ctx) => {
        const { size } = await fs_1.default.promises.stat(filepath);
        const megaBytesSize = size / (1024 * 1024);
        // if file is too big we validate json schema
        if (megaBytesSize > config.import.sizeLimit) {
            return;
        }
        const buffer = await _getFileDataBuffer(filepath, ctx);
        const data = JSON.parse(buffer.toString('utf8'));
        const schema = await fs_1.default.promises.readFile(schemaPath);
        (0, jsonschema_1.validate)(data, JSON.parse(schema.toString()), { throwAll: true });
    };
    const _writeReport = (fd, pos, err, lang) => {
        const errors = err.fields
            ? Object.values(err.fields)
                .map(v => utils.translateError(v, lang))
                .join(', ')
            : '';
        const message = err.message || '';
        fs_1.default.writeSync(fd, `${pos}: ${errors}${errors && message ? ' | ' : ''}${message}\n`);
    };
    const _writeStats = (fd, stats, lang) => {
        fs_1.default.writeSync(fd, `\n### ${translator.t('import.stats_title', { lng: lang }).toUpperCase()} ###\n`);
        if (_isExcelMapped(stats)) {
            for (const sheetIndex of Object.keys(stats)) {
                if (stats[sheetIndex].elements) {
                    fs_1.default.writeSync(fd, `${translator.t('import.stats_sheet_elements', {
                        lng: lang,
                        sheet: Number(sheetIndex) + 1,
                        created: stats[sheetIndex].elements[ImportAction.CREATED] || 0,
                        updated: stats[sheetIndex].elements[ImportAction.UPDATED] || 0,
                        ignored: stats[sheetIndex].elements[ImportAction.IGNORED] || 0
                    })}\n`);
                }
                if (stats[sheetIndex].links) {
                    fs_1.default.writeSync(fd, `${translator.t('import.stats_sheet_links', {
                        lng: lang,
                        sheet: Number(sheetIndex) + 1,
                        links: stats[sheetIndex].links
                    })}\n`);
                }
            }
        }
        else {
            fs_1.default.writeSync(fd, `${translator.t('import.stats_elements', {
                lng: lang,
                created: stats.elements[ImportAction.CREATED],
                updated: stats.elements[ImportAction.UPDATED],
                ignored: stats.elements[ImportAction.IGNORED]
            })}\n`);
            fs_1.default.writeSync(fd, `${translator.t('import.stats_links', {
                lng: lang,
                links: stats.links
            })}\n`);
            fs_1.default.writeSync(fd, `${translator.t('import.stats_trees', {
                lng: lang,
                trees: stats.trees
            })}\n`);
        }
    };
    const _isExcelMapped = (stats) => !stats.elements;
    return {
        async importConfig(params, task) {
            var _a;
            const { filepath, ctx, forceNoTask } = params;
            if (!forceNoTask && typeof (task === null || task === void 0 ? void 0 : task.id) === 'undefined') {
                const newTaskId = (0, uuid_1.v4)();
                await tasksManagerDomain.createTask(Object.assign({ id: newTaskId, label: config.lang.available.reduce((labels, lang) => {
                        labels[lang] = `${translator.t('tasks.import_label', {
                            lng: lang,
                            filename: path_1.default.parse(filepath).name
                        })}`;
                        return labels;
                    }, {}), func: {
                        moduleName: 'domain',
                        subModuleName: 'import',
                        name: 'importConfig',
                        args: params
                    }, role: {
                        type: tasksManager_1.TaskType.IMPORT_CONFIG
                    }, priority: tasksManager_1.TaskPriority.MEDIUM, startAt: !!(task === null || task === void 0 ? void 0 : task.startAt) ? task.startAt : Math.floor(Date.now() / 1000) }, (!!(task === null || task === void 0 ? void 0 : task.callbacks) && { callbacks: task.callbacks })), ctx);
                return newTaskId;
            }
            const reportFileName = (0, nanoid_1.nanoid)() + '.config.report.txt';
            const reportFilePath = `${config.import.directory}/${reportFileName}`;
            const lang = ctx.lang || config.lang.default;
            try {
                await _jsonSchemaValidation(exports.IMPORT_CONFIG_SCHEMA_PATH, filepath, ctx);
            }
            catch (err) {
                if (!(err instanceof helpers_1.ValidatorResultError)) {
                    throw err;
                }
                const fd = fs_1.default.openSync(reportFilePath, 'as');
                for (const e of err.errors) {
                    _writeReport(fd, e.path.join(' '), e, lang);
                }
                if (!forceNoTask) {
                    // We link report file to task
                    await tasksManagerDomain.setLink(task.id, { name: reportFileName, url: `/${config.import.endpoint}/${reportFileName}` }, ctx);
                }
                throw new Error(`Invalid JSON data. See ${reportFilePath} file for more details.`);
            }
            const buffer = await _getFileDataBuffer(filepath, ctx);
            const elements = JSON.parse(buffer.toString());
            console.info('Starting configuration import...');
            console.info('Processing libraries...');
            if ('libraries' in elements) {
                for (const library of elements.libraries) {
                    await libraryDomain.saveLibrary(((_a) => {
                        var { attributes } = _a, rest = __rest(_a, ["attributes"]);
                        return rest;
                    })(library), ctx);
                }
            }
            console.info('Processing attributes...');
            if ('attributes' in elements) {
                for (const attribute of elements.attributes) {
                    await attributeDomain.saveAttribute({ attrData: attribute, ctx });
                }
            }
            console.info('Add attributes to libraries...');
            if ('libraries' in elements) {
                for (const library of elements.libraries) {
                    library.attributes = (_a = library.attributes) === null || _a === void 0 ? void 0 : _a.map((id) => ({ id }));
                    await libraryDomain.saveLibrary({ id: library.id, attributes: library.attributes }, ctx);
                }
            }
            console.info('Processing trees...');
            if ('trees' in elements) {
                for (const tree of elements.trees) {
                    await treeDomain.saveTree(tree, ctx);
                }
            }
            console.info('Configuration import completed.');
            if (!forceNoTask) {
                return task.id;
            }
        },
        async importData(params, task) {
            var _a;
            const { filename, ctx, excelMapping } = params;
            if (typeof (task === null || task === void 0 ? void 0 : task.id) === 'undefined') {
                const newTaskId = (0, uuid_1.v4)();
                await tasksManagerDomain.createTask(Object.assign({ id: newTaskId, label: config.lang.available.reduce((labels, lang) => {
                        labels[lang] = `${translator.t('tasks.import_label', { lng: lang, filename })}`;
                        return labels;
                    }, {}), func: {
                        moduleName: 'domain',
                        subModuleName: 'import',
                        name: 'importData',
                        args: params
                    }, role: {
                        type: tasksManager_1.TaskType.IMPORT_DATA
                    }, priority: tasksManager_1.TaskPriority.MEDIUM, startAt: !!(task === null || task === void 0 ? void 0 : task.startAt) ? task.startAt : Math.floor(Date.now() / 1000) }, (!!(task === null || task === void 0 ? void 0 : task.callbacks) && { callbacks: task.callbacks })), ctx);
                return newTaskId;
            }
            const reportFileName = (0, nanoid_1.nanoid)() + '.data.report.txt';
            const reportFilePath = `${config.import.directory}/${reportFileName}`;
            const lang = ctx.lang || config.lang.default;
            const fd = fs_1.default.openSync(reportFilePath, 'as');
            const _getExcelPos = (elementIndex) => {
                var _a, _b;
                if (excelMapping) {
                    const sheet = ((_a = excelMapping[elementIndex]) === null || _a === void 0 ? void 0 : _a.sheet) + 1 || translator.t('errors.unknown', { lng: lang });
                    const line = ((_b = excelMapping[elementIndex]) === null || _b === void 0 ? void 0 : _b.line) + 1 || translator.t('errors.unknown', { lng: lang });
                    return translator.t('import.excel_pos', { lng: lang, sheet, line });
                }
            };
            try {
                await _jsonSchemaValidation(exports.IMPORT_DATA_SCHEMA_PATH, `${config.import.directory}/${filename}`, ctx);
            }
            catch (err) {
                if (!(err instanceof helpers_1.ValidatorResultError)) {
                    throw err;
                }
                for (const e of err.errors) {
                    _writeReport(fd, e.path.join(' '), e, lang);
                }
                await tasksManagerDomain.setLink(task.id, { name: reportFileName, url: `/${config.import.endpoint}/${reportFileName}` }, ctx);
                throw new Error(`Invalid JSON data. See ${reportFilePath} file for more details.`);
            }
            const progress = {
                elementsNb: 0,
                treesNb: 0,
                linksNb: 0,
                position: 0,
                percent: 0
            };
            const _updateTaskProgress = async (increasePosition, translationKey) => {
                progress.position += increasePosition;
                progress.percent = await updateTaskProgress(task.id, progress.percent, ctx, Object.assign({ position: {
                        index: progress.position,
                        total: progress.elementsNb + progress.treesNb + progress.linksNb
                    } }, (translationKey && { translationKey })));
            };
            // We call iterate on file a first time to estimate time of import
            await _getStoredFileData(filename, async (element, index) => {
                progress.elementsNb += element.matches.length + element.data.length;
                progress.linksNb += element.links.length;
            }, async (tree, index) => {
                progress.treesNb += 1;
            }, params.ctx);
            const cacheDataPath = `${filename}-links`;
            let lastCacheIndex;
            let action;
            const stats = excelMapping
                ? {}
                : { elements: { created: 0, updated: 0, ignored: 0 }, links: 0, trees: 0 };
            await _getStoredFileData(filename, 
            // Treat elements and cache links
            async (element, index) => {
                var _a, _b;
                try {
                    const importMode = (_a = element.mode) !== null && _a !== void 0 ? _a : DEFAULT_IMPORT_MODE;
                    await validateHelper.validateLibrary(element.library, ctx);
                    if (importMode === import_1.ImportMode.UPDATE && !element.matches.length) {
                        throw new ValidationError_1.default({ element: errors_1.Errors.NO_IMPORT_MATCHES });
                    }
                    let recordIds = await _getMatchRecords(element.library, element.matches, ctx);
                    const recordFound = !!recordIds.length;
                    if (!recordFound && importMode === import_1.ImportMode.UPDATE) {
                        throw new ValidationError_1.default({ element: errors_1.Errors.MISSING_ELEMENTS });
                    }
                    if (recordFound && importMode === import_1.ImportMode.INSERT) {
                        action = ImportAction.IGNORED;
                        return;
                    }
                    // Create the record if it does not exist
                    if (!recordIds.length) {
                        recordIds = [(await recordDomain.createRecord({ library: element.library, ctx })).record.id];
                        action = ImportAction.CREATED;
                    }
                    else {
                        action = ImportAction.UPDATED;
                    }
                    for (const data of element.data) {
                        await _treatElement(element.library, data, recordIds, ctx);
                    }
                    // update import stats
                    if (element.data.length) {
                        if (excelMapping) {
                            const sheetIndex = (_b = excelMapping[index]) === null || _b === void 0 ? void 0 : _b.sheet;
                            stats[sheetIndex] = stats[sheetIndex] || { elements: {} };
                            stats[sheetIndex].elements[action] = stats[sheetIndex].elements[action] + 1 || 1;
                        }
                        else {
                            stats.elements[action] += 1;
                        }
                    }
                    // Caching element links, to treat them later
                    // TODO: Improvement: if no links no cache.
                    await cacheService.getCache(cacheService_1.ECacheType.DISK).storeData({
                        key: index.toString(),
                        data: JSON.stringify({
                            library: element.library,
                            recordIds,
                            links: element.links
                        }),
                        path: cacheDataPath
                    });
                    if (typeof lastCacheIndex === 'undefined' || index > lastCacheIndex) {
                        lastCacheIndex = index;
                    }
                }
                catch (e) {
                    if (!(e instanceof ValidationError_1.default) && !(e instanceof PermissionError_1.default)) {
                        throw e;
                    }
                    const pos = excelMapping
                        ? _getExcelPos(index)
                        : translator.t('import.element_pos', { lng: lang, index });
                    _writeReport(fd, pos, e, lang);
                }
            }, 
            // Treat trees
            async (tree, index) => {
                try {
                    await validateHelper.validateLibrary(tree.library, ctx);
                    const recordIds = await _getMatchRecords(tree.library, tree.matches, ctx);
                    let parent;
                    if (typeof tree.parent !== 'undefined') {
                        const parentIds = await _getMatchRecords(tree.parent.library, tree.parent.matches, ctx);
                        parent = parentIds.length
                            ? { id: parentIds[0], library: tree.parent.library }
                            : parent;
                    }
                    if (typeof parent === 'undefined' && !recordIds.length) {
                        throw new ValidationError_1.default({ id: errors_1.Errors.MISSING_ELEMENTS });
                    }
                    await _treatTree(tree.library, tree.treeId, parent, recordIds, tree.action, ctx, tree.order);
                    if (!excelMapping) {
                        stats.trees += 1;
                    }
                }
                catch (e) {
                    if (!(e instanceof ValidationError_1.default) && !(e instanceof PermissionError_1.default)) {
                        throw e;
                    }
                    // Trees import is impossible with Excel file, so we don't need to check if excelMapping is defined
                    const pos = translator.t('import.tree_pos', { lng: lang, index });
                    _writeReport(fd, pos, e, lang);
                }
            }, ctx, 
            // For each element we check if it increases the progress, and update it if necessary
            _updateTaskProgress);
            // Treat links
            for (let cacheKey = 0; cacheKey <= lastCacheIndex; cacheKey++) {
                try {
                    const cacheStringifiedObject = (await cacheService.getCache(cacheService_1.ECacheType.DISK).getData([cacheKey.toString()], cacheDataPath))[0];
                    const element = JSON.parse(cacheStringifiedObject);
                    for (const link of element.links) {
                        try {
                            await _treatElement(element.library, link, element.recordIds, ctx);
                            if (excelMapping) {
                                const sheetIndex = (_a = excelMapping[cacheKey]) === null || _a === void 0 ? void 0 : _a.sheet;
                                stats[sheetIndex] = stats[sheetIndex] || {};
                                stats[sheetIndex].links = stats[sheetIndex].links + 1 || 1;
                            }
                            else {
                                stats.links += 1;
                            }
                        }
                        catch (e) {
                            if (!(e instanceof ValidationError_1.default) && !(e instanceof PermissionError_1.default)) {
                                throw e;
                            }
                            // cacheKey is equal to element index here
                            const pos = excelMapping
                                ? _getExcelPos(cacheKey)
                                : translator.t('import.element_pos', { lng: lang, index: cacheKey });
                            _writeReport(fd, pos, e, lang);
                        }
                    }
                    await _updateTaskProgress(element.links.length, 'tasks.import_description.links_process');
                }
                catch (err) {
                    continue;
                }
            }
            // Delete cache.
            await cacheService.getCache(cacheService_1.ECacheType.DISK).deleteAll(cacheDataPath);
            _writeStats(fd, stats, lang);
            // We link report file to task
            await tasksManagerDomain.setLink(task.id, { name: reportFileName, url: `/${config.import.endpoint}/${reportFileName}` }, ctx);
            return task.id;
        },
        async importExcel({ filename, sheets, startAt }, ctx) {
            var _a;
            const buffer = await _getFileDataBuffer(`${config.import.directory}/${filename}`, ctx);
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.load(buffer);
            const data = [];
            workbook.eachSheet((s, i) => {
                s.eachRow(r => {
                    let elems = r.values.slice(1);
                    elems = Array.from(elems, e => {
                        if (typeof e === 'undefined') {
                            return null; // we replace empty cell value by null
                        }
                        else if (typeof e === 'object') {
                            return e.result; // if cell value is a formula
                        }
                        return e;
                    });
                    if (typeof data[i - 1] === 'undefined') {
                        data[i - 1] = [];
                    }
                    data[i - 1].push(elems);
                });
            });
            const JSONFilename = filename.slice(0, filename.lastIndexOf('.')) + '.json';
            const writeStream = fs_1.default.createWriteStream(`${config.import.directory}/${JSONFilename}`, {
                flags: 'a' // 'a' means appending (old data will be preserved)
            });
            const writeLine = (line) => writeStream.write(line);
            const header = '{"elements": [';
            writeLine(header);
            let firstElementWritten = false;
            let elementIndex = 0;
            const excelMapping = {};
            for (const [indexSheet, dataSheet] of data.entries()) {
                let { type, library, mode = DEFAULT_IMPORT_MODE, mapping = [], keyIndex, linkAttribute, keyToIndex, treeLinkLibrary } = (sheets === null || sheets === void 0 ? void 0 : sheets[indexSheet]) || {};
                mapping = mapping !== null && mapping !== void 0 ? mapping : [];
                // If mapping in file.
                if (typeof sheets === 'undefined') {
                    const comments = [];
                    workbook.worksheets[indexSheet].getRow(1).eachCell(cell => {
                        var _a, _b;
                        // Cell comment might be split in multiple texts, merge them.
                        const cellComments = ((_b = (_a = cell.note) === null || _a === void 0 ? void 0 : _a.texts) !== null && _b !== void 0 ? _b : [])
                            .map(cellComm => cellComm.text)
                            .join(' ');
                        comments.push(cellComments.replace(/\n/g, ' ') || null);
                    });
                    // if mapping parameters not specified we ignore this sheet
                    if (comments[0] === null) {
                        continue;
                    }
                    // Extract args global args from comment on first column
                    const args = (0, utils_1.extractArgsFromString)(comments[0]);
                    type = import_1.ImportType[String(args.type)];
                    mode = args.mode ? String(args.mode) : DEFAULT_IMPORT_MODE;
                    // if sheet type is not specified we ignore this sheet
                    if (typeof type === 'undefined' || type === import_1.ImportType.IGNORE) {
                        continue;
                    }
                    library = String(args.library);
                    // Extract mapping, keyIndex and keyToIndex from all columns comments
                    for (const [index, comm] of comments.entries()) {
                        const commArgs = (0, utils_1.extractArgsFromString)(comm);
                        mapping.push((_a = String(commArgs.id)) !== null && _a !== void 0 ? _a : null);
                        if (commArgs.key) {
                            keyIndex = index;
                        }
                        if (commArgs.keyTo) {
                            keyToIndex = index;
                        }
                    }
                    // may be undefined if standard import
                    linkAttribute = args.linkAttribute ? String(args.linkAttribute) : null;
                    treeLinkLibrary = args.treeLinkLibrary ? String(args.treeLinkLibrary) : null;
                    if ((type === import_1.ImportType.LINK &&
                        (typeof keyIndex === 'undefined' ||
                            typeof linkAttribute === 'undefined' ||
                            typeof keyToIndex === 'undefined' ||
                            !mapping[keyToIndex])) ||
                        (typeof keyIndex !== 'undefined' && !mapping[keyIndex]) ||
                        typeof library === 'undefined' ||
                        typeof mapping === 'undefined') {
                        throw new ValidationError_1.default({ mapping: `Sheet n° ${indexSheet}: Missing mapping parameters` });
                    }
                }
                if (!!(sheets === null || sheets === void 0 ? void 0 : sheets[indexSheet]) && sheets[indexSheet].type !== import_1.ImportType.IGNORE) {
                    // Delete columns' name line.
                    dataSheet.shift();
                    const linkAttributeProps = linkAttribute
                        ? await attributeDomain.getAttributeProperties({ id: linkAttribute, ctx })
                        : null;
                    const filteredMapping = mapping.filter(m => m); // Filters null values
                    for (const [indexLine, dataLine] of dataSheet.entries()) {
                        let matches = [];
                        let elementData = [];
                        let elementLinks = [];
                        if (typeof keyIndex !== 'undefined' && typeof dataLine[keyIndex] !== 'undefined') {
                            const keyAttribute = mapping[keyIndex];
                            matches = [
                                {
                                    attribute: keyAttribute,
                                    value: String(dataLine[keyIndex])
                                }
                            ];
                        }
                        if (type === import_1.ImportType.STANDARD) {
                            elementData = dataLine
                                .filter((_, i) => mapping[i]) // Ignore cells not mapped
                                .map((cellValue, cellIndex) => ({
                                attribute: filteredMapping[cellIndex],
                                values: [{ value: String(cellValue) }],
                                action: import_1.Action.REPLACE
                            }))
                                .filter(cell => cell.attribute !== 'id');
                        }
                        if (type === import_1.ImportType.LINK) {
                            const keyToAttribute = mapping[keyToIndex];
                            const keyToValue = String(dataLine[keyToIndex]);
                            const keyToValueLibrary = linkAttributeProps.type === attribute_1.AttributeTypes.TREE
                                ? treeLinkLibrary
                                : linkAttributeProps.linked_library;
                            const metadataValues = dataLine.filter((_, cellIndex) => mapping[cellIndex] && cellIndex !== keyIndex && cellIndex !== keyToIndex);
                            elementLinks = [
                                {
                                    attribute: linkAttribute,
                                    values: [
                                        {
                                            library: keyToValueLibrary !== null && keyToValueLibrary !== void 0 ? keyToValueLibrary : '',
                                            value: [{ attribute: keyToAttribute, value: keyToValue }],
                                            metadata: metadataValues.reduce((allMetadata, metadataValue, metadataValueIndex) => {
                                                allMetadata[metadataValueIndex] = metadataValue;
                                                return allMetadata;
                                            }, {})
                                        }
                                    ],
                                    action: 'add'
                                }
                            ];
                        }
                        const element = {
                            library,
                            matches,
                            mode,
                            data: elementData,
                            links: elementLinks
                        };
                        // Adding element to JSON file.
                        // Add comma if not first element
                        writeLine((firstElementWritten ? ',' : '') + JSON.stringify(element));
                        excelMapping[elementIndex++] = { sheet: indexSheet, line: indexLine + 1 }; // +1 because we removed the first line
                        firstElementWritten = true;
                    }
                }
            }
            // End of file.
            writeLine('], "trees": []}');
            // Delete xlsx file
            await utils.deleteFile(`${config.import.directory}/${filename}`);
            return this.importData({ filename: JSONFilename, ctx, excelMapping }, Object.assign(Object.assign({}, (!!startAt && { startAt })), { 
                // Delete remaining import file.
                callbacks: [
                    {
                        moduleName: 'utils',
                        name: 'deleteFile',
                        args: [`${config.import.directory}/${JSONFilename}`],
                        type: [tasksManager_1.TaskCallbackType.ON_SUCCESS, tasksManager_1.TaskCallbackType.ON_FAILURE, tasksManager_1.TaskCallbackType.ON_CANCEL]
                    }
                ] }));
        }
    };
}
exports.default = default_1;
