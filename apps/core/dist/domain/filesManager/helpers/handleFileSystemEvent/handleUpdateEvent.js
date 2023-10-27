"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdateEvent = void 0;
const filesManager_1 = require("../../../../_types/filesManager");
const _constants_1 = require("../../_constants");
const extractFileMetadata_1 = require("../extractFileMetadata");
const handleFileUtilsHelper_1 = require("../handleFileUtilsHelper");
const handlePreview_1 = require("../handlePreview");
const handleUpdateEvent = async (scanMsg, { library }, deps, ctx) => {
    const { fileName, filePath } = (0, handleFileUtilsHelper_1.getInputData)(scanMsg.pathAfter);
    const directoriesLibraryId = deps.utils.getDirectoriesLibraryId(library);
    const filesLibraryId = library;
    const recordLibrary = scanMsg.isDirectory ? directoriesLibraryId : filesLibraryId;
    const recordId = scanMsg.recordId;
    const recordLibraryProps = await deps.libraryDomain.getLibraryProperties(recordLibrary, ctx);
    // Get the records
    const record = await (0, handleFileUtilsHelper_1.getRecord)({ fileName, filePath, fileInode: scanMsg.inode }, { recordLibrary, recordId }, false, deps, ctx);
    if (!record) {
        deps.logger.warn(`[FilesManager] event ${scanMsg.event} - record not found : ${scanMsg.pathAfter}`);
        return;
    }
    const { previewsStatus, previews } = (0, handleFileUtilsHelper_1.getPreviewsDefaultData)(_constants_1.systemPreviewsSettings);
    let recordData = {
        [filesManager_1.FilesAttributes.INODE]: scanMsg.inode,
        [filesManager_1.FilesAttributes.ROOT_KEY]: scanMsg.rootKey,
        [filesManager_1.FilesAttributes.HASH]: scanMsg.hash,
        [deps.utils.getPreviewsStatusAttributeName(library)]: previewsStatus,
        [deps.utils.getPreviewsAttributeName(library)]: previews
    };
    const fileMetadata = !scanMsg.isDirectory
        ? await (0, extractFileMetadata_1.extractFileMetadata)(scanMsg.pathAfter, scanMsg.rootKey, deps.config)
        : null;
    recordData = Object.assign(Object.assign({}, recordData), fileMetadata);
    // Update datas
    await (0, handleFileUtilsHelper_1.updateRecordFile)(recordData, record.id, library, deps, ctx).catch(function (e) {
        deps.logger.warn(`[FilesManager] error during updateRecordFile recordId ${record.id}`);
    });
    // Regenerate Previews
    (0, handlePreview_1.requestPreviewGeneration)({
        recordId: record.id,
        pathAfter: scanMsg.pathAfter,
        libraryId: library,
        versions: deps.utils.previewsSettingsToVersions(recordLibraryProps.previewsSettings),
        deps: Object.assign({}, deps)
    });
};
exports.handleUpdateEvent = handleUpdateEvent;
