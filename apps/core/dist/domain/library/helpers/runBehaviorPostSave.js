"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getLibraryDefaultAttributes_1 = __importDefault(require("../../../utils/helpers/getLibraryDefaultAttributes"));
const attribute_1 = require("../../../_types/attribute");
const filesManager_1 = require("../../../_types/filesManager");
const library_1 = require("../../../_types/library");
const tree_1 = require("../../../_types/tree");
const _filesBehavior = async (library, isNewLib, deps, ctx) => {
    if (!isNewLib) {
        return;
    }
    // Create previews and previews status attributes for library if they don't exist. If they exist, update settings
    const previewsAttributeId = deps.utils.getPreviewsAttributeName(library.id);
    const previewsStatusAttributeId = deps.utils.getPreviewsStatusAttributeName(library.id);
    const attributesSettings = deps.utils.getPreviewAttributesSettings(library);
    // Previews attribute
    const previewsAttributeData = {
        id: previewsAttributeId,
        label: deps.config.lang.available.reduce((labels, lang) => {
            labels[lang] = deps.translator.t('files.previews', { lng: lang });
            return labels;
        }, {}),
        system: true,
        readonly: true,
        type: attribute_1.AttributeTypes.SIMPLE,
        format: attribute_1.AttributeFormats.EXTENDED,
        multiple_values: false,
        embedded_fields: attributesSettings[previewsAttributeId]
    };
    await deps.attributeRepo.createAttribute({
        attrData: Object.assign(Object.assign({}, previewsAttributeData), { actions_list: deps.utils.getDefaultActionsList(previewsAttributeData) }),
        ctx
    });
    // Previews status attribute
    const previewsStatusAttributeData = {
        id: previewsStatusAttributeId,
        label: deps.config.lang.available.reduce((labels, lang) => {
            labels[lang] = deps.translator.t('files.previews_status', { lng: lang });
            return labels;
        }, {}),
        system: true,
        readonly: true,
        type: attribute_1.AttributeTypes.SIMPLE,
        format: attribute_1.AttributeFormats.EXTENDED,
        multiple_values: false,
        embedded_fields: attributesSettings[previewsStatusAttributeId]
    };
    await deps.attributeRepo.createAttribute({
        attrData: Object.assign(Object.assign({}, previewsStatusAttributeData), { actions_list: deps.utils.getDefaultActionsList(previewsStatusAttributeData) }),
        ctx
    });
    // Associate attributes to library
    await deps.libraryRepo.saveLibraryAttributes({
        libId: library.id,
        attributes: [
            ...(0, getLibraryDefaultAttributes_1.default)(library_1.LibraryBehavior.FILES, library.id),
            previewsAttributeId,
            previewsStatusAttributeId
        ],
        ctx
    });
    // Create directories libraries
    const directoriesLibraryId = deps.utils.getDirectoriesLibraryId(library.id);
    await deps.libraryRepo.createLibrary({
        libData: {
            id: directoriesLibraryId,
            behavior: library_1.LibraryBehavior.DIRECTORIES,
            system: false,
            label: deps.config.lang.available.reduce((labels, lang) => {
                labels[lang] = deps.translator.t('files.directories', { lng: lang });
                return labels;
            }, {}),
            recordIdentityConf: {
                label: filesManager_1.FilesAttributes.FILE_NAME
            }
        },
        ctx
    });
    await deps.libraryRepo.saveLibraryAttributes({
        libId: directoriesLibraryId,
        attributes: (0, getLibraryDefaultAttributes_1.default)(library_1.LibraryBehavior.DIRECTORIES, directoriesLibraryId),
        ctx
    });
    // Create tree
    deps.treeRepo.createTree({
        treeData: {
            id: deps.utils.getLibraryTreeId(library.id),
            system: false,
            label: library.label,
            behavior: tree_1.TreeBehavior.FILES,
            libraries: {
                [directoriesLibraryId]: {
                    allowMultiplePositions: false,
                    allowedAtRoot: true,
                    allowedChildren: [directoriesLibraryId, library.id]
                },
                [library.id]: {
                    allowMultiplePositions: false,
                    allowedAtRoot: true,
                    allowedChildren: []
                }
            }
        },
        ctx
    });
};
exports.default = (library, isNewLib, deps, ctx) => {
    const actionByBehavior = {
        [library_1.LibraryBehavior.FILES]: () => _filesBehavior(library, isNewLib, deps, ctx)
    };
    return actionByBehavior[library.behavior] ? actionByBehavior[library.behavior]() : null;
};
