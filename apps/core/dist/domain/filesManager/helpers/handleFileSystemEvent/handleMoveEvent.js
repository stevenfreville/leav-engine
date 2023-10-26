"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMoveEvent = void 0;
const filesManager_1 = require("../../../../_types/filesManager");
const handleFileUtilsHelper_1 = require("../handleFileUtilsHelper");
const handleMoveEvent = async (scanMsg, { library }, deps, ctx) => {
    const { fileName: fileNameDest, filePath: filePathDest } = (0, handleFileUtilsHelper_1.getInputData)(scanMsg.pathAfter);
    const { fileName: fileNameOrigin, filePath: filePathOrigin } = (0, handleFileUtilsHelper_1.getInputData)(scanMsg.pathBefore);
    const directoriesLibraryId = deps.utils.getDirectoriesLibraryId(library);
    const filesLibraryId = library;
    const recordLibrary = scanMsg.isDirectory ? directoriesLibraryId : filesLibraryId;
    const recordId = scanMsg.recordId;
    // Find the origin record
    const originRecord = await (0, handleFileUtilsHelper_1.getRecord)({ fileName: fileNameOrigin, filePath: filePathOrigin, fileInode: scanMsg.inode }, { recordLibrary, recordId }, false, deps, ctx);
    // Update the origin record
    if (!originRecord) {
        deps.logger.error(`[${ctx.queryId}] event ${scanMsg.event}, origin record not found : ${scanMsg.pathBefore}`);
        return false;
    }
    // Find the destination record
    const destRecord = await (0, handleFileUtilsHelper_1.getRecord)({ fileName: fileNameDest, filePath: filePathDest }, { recordLibrary }, false, deps, ctx);
    // If destination record already exists, disable it.
    // We check difference between destination and origin ids to avoid error due to a
    // move, only in a tree, of the origin file (file path attribute is not updated in this case),
    // but this should be allowed!
    if (destRecord && destRecord.id !== originRecord.id) {
        await deps.recordDomain.deactivateRecord(destRecord, ctx);
        await (0, handleFileUtilsHelper_1.deleteFilesTreeElement)(destRecord.id, filesLibraryId, recordLibrary, deps, ctx);
    }
    const recordData = {
        [filesManager_1.FilesAttributes.ROOT_KEY]: scanMsg.rootKey,
        [filesManager_1.FilesAttributes.FILE_PATH]: filePathDest,
        [filesManager_1.FilesAttributes.FILE_NAME]: fileNameDest
    };
    await (0, handleFileUtilsHelper_1.updateRecordFile)(recordData, originRecord.id, recordLibrary, deps, ctx);
    // Find parent record destination
    if (filePathDest !== filePathOrigin) {
        try {
            const treeId = deps.utils.getLibraryTreeId(filesLibraryId);
            const recordNode = (await deps.treeDomain.getNodesByRecord({
                treeId,
                record: { id: originRecord.id, library: originRecord.library },
                ctx
            }))[0];
            if (!recordNode) {
                throw new Error('Record node not found');
            }
            // use getRecordParent, ignore disable
            const parentRecord = await (0, handleFileUtilsHelper_1.getParentRecord)(filePathDest, directoriesLibraryId, deps, ctx);
            // Move element in the tree
            const parentNode = parentRecord
                ? (await deps.treeDomain.getNodesByRecord({
                    treeId,
                    record: { id: parentRecord.id, library: parentRecord.library },
                    ctx
                }))[0]
                : null;
            if (filePathDest && filePathDest !== '.' && !parentNode) {
                throw new Error('Parent not found');
            }
            await deps.treeDomain.moveElement({
                treeId: deps.utils.getLibraryTreeId(library),
                nodeId: recordNode,
                parentTo: parentNode,
                ctx,
                skipChecks: true
            });
        }
        catch (e) {
            deps.logger.error(`[${ctx.queryId}] event ${scanMsg.event}, move element in tree fail : ${originRecord.id}. ${e.message}`);
            deps.logger.error(`[${ctx.queryId}] ${e.stack}`);
        }
    }
};
exports.handleMoveEvent = handleMoveEvent;
