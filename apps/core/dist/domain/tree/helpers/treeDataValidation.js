"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const difference_1 = __importDefault(require("lodash/difference"));
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const errors_1 = require("../../../_types/errors");
const library_1 = require("../../../_types/library");
const tree_1 = require("../../../_types/tree");
function default_1({ 'core.infra.library': libraryRepo = null, 'core.utils': utils = null }) {
    const _validateId = (treeData) => {
        if (!utils.isIdValid(treeData.id)) {
            throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_ID_FORMAT });
        }
    };
    const _checkLibExists = (treeData, existingLibs) => {
        var _a;
        // Check if all libraries exists
        const libsIds = existingLibs.map(lib => lib.id);
        const unknownLibs = (0, difference_1.default)(Object.keys((_a = treeData.libraries) !== null && _a !== void 0 ? _a : {}), libsIds);
        if (unknownLibs.length) {
            throw new ValidationError_1.default({
                libraries: { msg: errors_1.Errors.UNKNOWN_LIBRARIES, vars: { libraries: unknownLibs.join(', ') } }
            });
        }
    };
    const _validateFilesTree = (treeLibraries) => {
        const hasForbiddenLibrary = treeLibraries.some(lib => lib.behavior !== library_1.LibraryBehavior.FILES && lib.behavior !== library_1.LibraryBehavior.DIRECTORIES);
        if (hasForbiddenLibrary) {
            throw new ValidationError_1.default({ libraries: errors_1.Errors.NON_FILES_LIBRARY });
        }
    };
    const _validatePermissionsConf = (treeData) => {
        if (!treeData.permissions_conf) {
            return;
        }
        const permConfLibs = Object.keys(treeData.permissions_conf);
        const invalidLibs = (0, difference_1.default)(permConfLibs, Object.keys(treeData.libraries));
        if (invalidLibs.length) {
            throw new ValidationError_1.default({
                permissions_conf: {
                    msg: errors_1.Errors.INVALID_PERMISSIONS_CONF_LIBRARIES,
                    vars: { libraries: invalidLibs.join(', ') }
                }
            });
        }
    };
    const validate = async (treeData, ctx) => {
        const { list: existingLibraries } = await libraryRepo.getLibraries({ ctx });
        _validateId(treeData);
        _checkLibExists(treeData, existingLibraries);
        _validatePermissionsConf(treeData);
        if (treeData.behavior === tree_1.TreeBehavior.FILES) {
            const treeLibraries = Object.keys(treeData.libraries).map(libId => existingLibraries.find(lib => lib.id === libId));
            _validateFilesTree(treeLibraries);
        }
    };
    return {
        validate
    };
}
exports.default = default_1;
