"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewsDefaultData = exports.deleteFilesTreeElement = exports.createFilesTreeElement = exports.getInputData = exports.updateRecordFile = exports.createRecordFile = exports.getParentRecord = exports.getRecord = void 0;
const path_1 = require("path");
const getRecord = async ({ fileName, filePath, fileInode }, { recordLibrary, recordId }, retrieveInactive, deps, ctx) => {
    return deps.filesManagerRepo.getRecord({ fileName, filePath, fileInode }, { recordLibrary, recordId }, retrieveInactive, ctx);
};
exports.getRecord = getRecord;
const getParentRecord = async (fullParentPath, library, deps, ctx) => {
    return deps.filesManagerRepo.getParentRecord(fullParentPath, library, ctx);
};
exports.getParentRecord = getParentRecord;
const createRecordFile = async (recordData, library, deps, ctx) => {
    const { userId } = deps.config.filesManager;
    let newRecord;
    try {
        newRecord = await deps.recordDomain.createRecord({ library, ctx: Object.assign(Object.assign({}, ctx), { userId }) });
    }
    catch (e) {
        deps.logger.warn(`[FilesManager] Error when create new record : ${e.message}`);
    }
    if (newRecord.id) {
        const dataToSave = Object.keys(recordData).reduce((acc, key) => {
            acc[key] = typeof recordData[key] === 'object' ? JSON.stringify(recordData[key]) : recordData[key];
            return acc;
        }, {});
        dataToSave.id = newRecord.id;
        try {
            await deps.recordDomain.updateRecord({
                library,
                recordData: dataToSave,
                ctx
            });
        }
        catch (e) {
            deps.logger.warn(`[FilesManager] Error when saving values for new record : ${newRecord.id}`, e.message);
        }
    }
    return newRecord;
};
exports.createRecordFile = createRecordFile;
const updateRecordFile = async (recordData, recordId, library, deps, ctx) => {
    // Update record file attributes
    const dataToSave = Object.keys(recordData).reduce((acc, key) => {
        acc[key] = recordData[key];
        return acc;
    }, {});
    dataToSave.id = recordId;
    try {
        const updatedRecord = await deps.recordRepo.updateRecord({
            libraryId: library,
            recordData: dataToSave
        });
        await deps.updateRecordLastModif(library, recordId, ctx);
        await deps.sendRecordUpdateEvent(updatedRecord, Object.keys(recordData).map(attributeId => ({
            id_value: null,
            attribute: attributeId,
            value: { value: recordData[attributeId], raw_value: recordData[attributeId], attribute: attributeId },
            modified_at: null,
            modified_by: null,
            created_at: null,
            created_by: null,
            version: null,
            metadata: null
        })), ctx);
    }
    catch (e) {
        deps.logger.warn(`[${ctx.queryId}] Error when updating record: ${recordId}, ${e.message}`);
        deps.logger.warn(`[${ctx.queryId}] ${e.stack}`);
    }
};
exports.updateRecordFile = updateRecordFile;
const getInputData = (input) => {
    const filePath = (0, path_1.dirname)(input);
    const fileName = (0, path_1.basename)(input);
    return { filePath, fileName };
};
exports.getInputData = getInputData;
const createFilesTreeElement = async (record, parentRecord, filesLibraryId, deps, ctx) => {
    try {
        const treeId = deps.utils.getLibraryTreeId(filesLibraryId);
        const parentNode = parentRecord
            ? (await deps.treeDomain.getNodesByRecord({
                treeId,
                record: { id: parentRecord.id, library: parentRecord.library },
                ctx
            }))[0]
            : null;
        await deps.treeDomain.addElement({
            treeId,
            element: {
                id: record.id,
                library: record.library
            },
            parent: parentNode,
            ctx
        });
    }
    catch (e) {
        deps.logger.error(`[${ctx.queryId}] Error on tree element creation, record id: ${record.id}, error: ${e.message}`);
        deps.logger.error(`[${ctx.queryId}] ${e.stack}`);
    }
};
exports.createFilesTreeElement = createFilesTreeElement;
const deleteFilesTreeElement = async (recordId, filesLibraryId, recordLibrary, deps, ctx) => {
    try {
        const treeId = deps.utils.getLibraryTreeId(filesLibraryId);
        const recordNode = (await deps.treeDomain.getNodesByRecord({
            treeId,
            record: { id: recordId, library: recordLibrary },
            ctx
        }))[0];
        await deps.treeDomain.deleteElement({
            treeId,
            nodeId: recordNode,
            deleteChildren: true,
            ctx
        });
    }
    catch (e) {
        deps.logger.warn(`[${ctx.queryId}] Error on tree element deletion, record id: ${recordId}, error: ${e.message}`);
        deps.logger.error(`[${ctx.queryId}] ${e.stack}`);
    }
};
exports.deleteFilesTreeElement = deleteFilesTreeElement;
const getPreviewsDefaultData = (previewVersions) => {
    const previewsStatus = {};
    const previews = {};
    previewVersions.forEach(previewSettings => {
        previewSettings.versions.sizes.forEach(size => {
            // previewsStatus default value
            previewsStatus[size.name] = {
                status: -1,
                message: 'waiting for creation'
            };
            // previews default value
            previews[size.name] = '';
        });
        if (previewSettings.versions.pdf) {
            previewsStatus.pdf = {
                status: -1,
                message: 'waiting for creation'
            };
            previews.pdf = '';
        }
    });
    return {
        previewsStatus,
        previews
    };
};
exports.getPreviewsDefaultData = getPreviewsDefaultData;
