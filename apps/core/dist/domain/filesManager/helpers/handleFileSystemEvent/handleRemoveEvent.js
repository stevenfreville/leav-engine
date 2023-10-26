"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRemoveEvent = void 0;
const handleFileUtilsHelper_1 = require("../handleFileUtilsHelper");
const handleRemoveEvent = async (scanMsg, { library }, deps, ctx) => {
    const { filePath, fileName } = (0, handleFileUtilsHelper_1.getInputData)(scanMsg.pathBefore);
    const { userId } = deps.config.filesManager;
    const directoriesLibraryId = deps.utils.getDirectoriesLibraryId(library);
    const filesLibraryId = library;
    const recordLibrary = scanMsg.isDirectory ? directoriesLibraryId : filesLibraryId;
    const recordId = scanMsg.recordId;
    const record = await (0, handleFileUtilsHelper_1.getRecord)({ fileName, filePath, fileInode: scanMsg.inode }, { recordLibrary, recordId }, false, deps, ctx);
    if (!record) {
        deps.logger.error(`[${ctx.queryId}] Event ${scanMsg.event} - Can't find the record to disable - file: ${scanMsg.pathBefore}`);
        return false;
    }
    // First, remove the record from the tree, then deactivate the record.
    // If we start by deactivating the record and something goes wrong when removing it from the tree, the record
    // won't be found on the next attempt to remove it (eg. triggered by sync scan). The only way to fix this would be
    // to reactivate it in DB
    await (0, handleFileUtilsHelper_1.deleteFilesTreeElement)(record.id, filesLibraryId, recordLibrary, deps, ctx);
    // Deactivate the record
    try {
        await deps.recordDomain.deactivateRecord(record, { userId });
    }
    catch (e) {
        deps.logger.warn(`[FilesManager] Error when deactivating the record: ${record.id}`);
    }
    return true;
};
exports.handleRemoveEvent = handleRemoveEvent;
