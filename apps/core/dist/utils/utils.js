"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const fs_1 = __importDefault(require("fs"));
const lodash_1 = require("lodash");
const moment_1 = __importDefault(require("moment"));
const os_1 = __importDefault(require("os"));
const ValidationError_1 = __importDefault(require("../errors/ValidationError"));
const application_1 = require("../_types/application");
const attribute_1 = require("../_types/attribute");
const getDefaultActionsList_1 = __importDefault(require("./helpers/getDefaultActionsList"));
const getLibraryDefaultAttributes_1 = __importDefault(require("./helpers/getLibraryDefaultAttributes"));
const getPreviewsAttributes_1 = require("./helpers/getPreviewsAttributes");
function default_1({ config = null, translator = null } = {}) {
    return {
        getFileExtension(filename) {
            if (filename.lastIndexOf('.') === -1) {
                return null;
            }
            return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
        },
        getUnixTime: () => Math.floor(Date.now() / 1000),
        deleteFile: async (path) => {
            return fs_1.default.promises.unlink(path);
        },
        libNameToQueryName(name) {
            return (0, lodash_1.flow)([lodash_1.camelCase, lodash_1.trimEnd])(name);
        },
        libNameToTypeName(name) {
            return (0, lodash_1.flow)([lodash_1.camelCase, lodash_1.upperFirst, lodash_1.trimEnd, (0, lodash_1.partialRight)(lodash_1.trimEnd, 's')])(name);
        },
        isIdValid(id) {
            if (!id) {
                return false;
            }
            return /^[a-z0-9_]+$/.test(id);
        },
        isEndpointValid(endpoint, isExternal) {
            if (!endpoint) {
                return false;
            }
            // External app: any URL
            if (isExternal) {
                try {
                    new URL(endpoint);
                    return true;
                }
                catch (err) {
                    return false;
                }
            }
            // Internal app: simple endpoint
            return /^[a-z0-9-]+$/.test(endpoint);
        },
        rethrow(err, message) {
            if (message) {
                err.message = `${message}, ${err.message}`;
            }
            throw err;
        },
        pipe(...fns) {
            const _pipe = (f, g) => async (...args) => g(await f(...args));
            return fns.length ? fns.reduce(_pipe) : () => null;
        },
        mergeConcat(object, sources) {
            const customizer = (oVal, srcVal) => {
                if (Array.isArray(oVal)) {
                    return oVal.concat(srcVal);
                }
            };
            return (0, lodash_1.mergeWith)(object, sources, customizer);
        },
        nameValArrayToObj(arr = [], keyFieldName = 'name', valueFieldName = 'value') {
            return Array.isArray(arr) && arr.length
                ? arr.reduce((formattedElem, elem) => {
                    formattedElem[elem[keyFieldName]] = elem[valueFieldName];
                    return formattedElem;
                }, {})
                : null;
        },
        objToNameValArray(obj, keyFieldName = 'name', valueFieldName = 'value') {
            if (!obj) {
                return [];
            }
            return Object.keys(obj).reduce((arr, key) => {
                return [
                    ...arr,
                    {
                        [keyFieldName]: key,
                        [valueFieldName]: obj[key]
                    }
                ];
            }, []);
        },
        getLibraryTreeId(library) {
            return `${library}_tree`;
        },
        getFilesLibraryId(directoriesLibrary) {
            return directoriesLibrary.split('_')[0];
        },
        getDirectoriesLibraryId(library) {
            return `${library}_directories`;
        },
        forceArray(val) {
            return Array.isArray(val) ? val : [val];
        },
        getDefaultActionsList: getDefaultActionsList_1.default,
        getLibraryDefaultAttributes: getLibraryDefaultAttributes_1.default,
        timestampToDate(t) {
            return moment_1.default.unix(Number(t)).toDate();
        },
        dateToTimestamp(d) {
            return (0, moment_1.default)(d).unix();
        },
        isStandardAttribute(attribute) {
            return attribute.type === attribute_1.AttributeTypes.SIMPLE || attribute.type === attribute_1.AttributeTypes.ADVANCED;
        },
        isLinkAttribute(attribute) {
            return attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK || attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK;
        },
        isTreeAttribute(attribute) {
            return attribute.type === attribute_1.AttributeTypes.TREE;
        },
        decomposeValueEdgeDestination(value) {
            const [library, id] = value.split('/');
            return { library, id };
        },
        translateError(error, lang) {
            const toTranslate = typeof error === 'string' ? { msg: error, vars: {} } : error;
            return translator.t(('errors.' + toTranslate.msg), Object.assign(Object.assign({}, toTranslate.vars), { lng: lang, interpolation: { escapeValue: false } }));
        },
        getFullApplicationEndpoint(endpoint) {
            return `${application_1.APPS_URL_PREFIX}/${endpoint !== null && endpoint !== void 0 ? endpoint : ''}`;
        },
        getCoreEntityCacheKey(entityType, entityId) {
            return `coreEntity:${entityType}:${entityId}`;
        },
        generateExplicitValidationError(field, message, lang) {
            const fieldDetails = {};
            fieldDetails[field] = message;
            //TODO: test this
            return new ValidationError_1.default(fieldDetails, this.translateError(message, lang));
        },
        getProcessIdentifier() {
            return `${os_1.default.hostname()}-${process.pid}`;
        },
        getPreviewsAttributeName(libraryId) {
            return (0, getPreviewsAttributes_1.getPreviewsAttributeName)(libraryId);
        },
        getPreviewsStatusAttributeName(library) {
            return (0, getPreviewsAttributes_1.getPreviewsStatusAttributeName)(library);
        },
        getPreviewAttributesSettings(library) {
            const _getSizeLabel = (size) => config.lang.available.reduce((labels, lang) => {
                labels[lang] = size.name;
                return labels;
            }, {});
            const previewsSettings = library.previewsSettings;
            const previewsAttributeName = this.getPreviewsAttributeName(library.id);
            const previewsStatusAttributeName = this.getPreviewsStatusAttributeName(library.id);
            return previewsSettings.reduce((allSettings, settings) => {
                for (const size of settings.versions.sizes) {
                    allSettings[previewsAttributeName].push({
                        id: size.name,
                        label: _getSizeLabel(size),
                        format: attribute_1.AttributeFormats.TEXT
                    });
                    allSettings[previewsStatusAttributeName].push({
                        id: size.name,
                        label: _getSizeLabel(size),
                        format: attribute_1.AttributeFormats.EXTENDED,
                        embedded_fields: [
                            {
                                id: 'status',
                                format: attribute_1.AttributeFormats.NUMERIC
                            },
                            {
                                id: 'message',
                                format: attribute_1.AttributeFormats.TEXT
                            }
                        ]
                    });
                }
                return allSettings;
            }, {
                [previewsAttributeName]: [],
                [previewsStatusAttributeName]: []
            });
        },
        previewsSettingsToVersions(previewsSettings) {
            return previewsSettings.map(settings => settings.versions);
        }
    };
}
exports.default = default_1;
