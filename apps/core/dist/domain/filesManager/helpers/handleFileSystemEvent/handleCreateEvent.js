"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateEvent = void 0;
const filesManager_1 = require("../../../../_types/filesManager");
const _constants_1 = require("../../_constants");
const extractFileMetadata_1 = require("../extractFileMetadata");
const handleFileUtilsHelper_1 = require("../handleFileUtilsHelper");
const handlePreview_1 = require("../handlePreview");
const handleCreateEvent = async (scanMsg, resources, deps, ctx) => {
    const { filePath, fileName } = (0, handleFileUtilsHelper_1.getInputData)(scanMsg.pathAfter);
    // Search for existing record
    const directoriesLibraryId = deps.utils.getDirectoriesLibraryId(resources.library);
    const filesLibraryId = resources.library;
    const recordLibrary = scanMsg.isDirectory ? directoriesLibraryId : filesLibraryId;
    const recordLibraryProps = await deps.libraryDomain.getLibraryProperties(recordLibrary, ctx);
    let record = await (0, handleFileUtilsHelper_1.getRecord)({ fileName, filePath, fileInode: scanMsg.inode }, { recordLibrary }, true, deps, ctx);
    // Preview and Previews status
    const { previewsStatus, previews } = (0, handleFileUtilsHelper_1.getPreviewsDefaultData)(_constants_1.systemPreviewsSettings);
    const fileMetadata = !scanMsg.isDirectory
        ? await (0, extractFileMetadata_1.extractFileMetadata)(scanMsg.pathAfter, scanMsg.rootKey, deps.config)
        : null;
    if (record) {
        try {
            const { userId } = deps.config.filesManager;
            await deps.recordDomain.activateRecord(record, { userId });
            const recordData = Object.assign({ [filesManager_1.FilesAttributes.ROOT_KEY]: scanMsg.rootKey, [filesManager_1.FilesAttributes.INODE]: scanMsg.inode, [deps.utils.getPreviewsStatusAttributeName(filesLibraryId)]: previewsStatus, [deps.utils.getPreviewsAttributeName(filesLibraryId)]: previews, [filesManager_1.FilesAttributes.HASH]: scanMsg.hash }, fileMetadata);
            await (0, handleFileUtilsHelper_1.updateRecordFile)(recordData, record.id, recordLibrary, deps, ctx);
        }
        catch (e) {
            console.error(e);
            deps.logger.error(`[FilesManager] Event ${scanMsg.event} - Error on record activation : ${e.message}`);
        }
    }
    else {
        const recordData = Object.assign({ [filesManager_1.FilesAttributes.ROOT_KEY]: scanMsg.rootKey, [filesManager_1.FilesAttributes.FILE_PATH]: filePath, [filesManager_1.FilesAttributes.FILE_NAME]: fileName, [filesManager_1.FilesAttributes.INODE]: scanMsg.inode, [filesManager_1.FilesAttributes.HASH]: scanMsg.hash, [deps.utils.getPreviewsStatusAttributeName(filesLibraryId)]: previewsStatus, [deps.utils.getPreviewsAttributeName(filesLibraryId)]: previews }, fileMetadata);
        try {
            record = await (0, handleFileUtilsHelper_1.createRecordFile)(recordData, recordLibrary, deps, ctx);
        }
        catch (e) {
            deps.logger.error(`[${ctx.queryId}] Event ${scanMsg.event} - Error on record creation: ${e.message}`);
            deps.logger.error(`[${ctx.queryId}] ${e.stack}`);
        }
    }
    // Find the parent folder
    const parentRecords = await (0, handleFileUtilsHelper_1.getParentRecord)(filePath, directoriesLibraryId, deps, ctx);
    // Link the child to his parent in the tree
    await (0, handleFileUtilsHelper_1.createFilesTreeElement)(record, parentRecords, filesLibraryId, deps, ctx);
    // Create the previews
    if (!scanMsg.isDirectory) {
        await (0, handlePreview_1.requestPreviewGeneration)({
            recordId: record.id,
            pathAfter: scanMsg.pathAfter,
            libraryId: recordLibrary,
            versions: deps.utils.previewsSettingsToVersions(recordLibraryProps.previewsSettings),
            deps: Object.assign({}, deps)
        });
    }
};
exports.handleCreateEvent = handleCreateEvent;
