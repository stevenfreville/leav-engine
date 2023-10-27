"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const _constants_1 = require("../../domain/filesManager/_constants");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const getLibraryDefaultAttributes_1 = __importDefault(require("../../utils/helpers/getLibraryDefaultAttributes"));
const errors_1 = require("../../_types/errors");
const event_1 = require("../../_types/event");
const library_1 = require("../../_types/library");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
const getPermissionCachePatternKey_1 = __importDefault(require("../permission/helpers/getPermissionCachePatternKey"));
const checkSavePermission_1 = __importDefault(require("./helpers/checkSavePermission"));
const runBehaviorPostSave_1 = __importDefault(require("./helpers/runBehaviorPostSave"));
const validateLibAttributes_1 = __importDefault(require("./helpers/validateLibAttributes"));
const validateLibFullTextAttributes_1 = __importDefault(require("./helpers/validateLibFullTextAttributes"));
const validatePermConf_1 = __importDefault(require("./helpers/validatePermConf"));
const validatePreviewsSettings_1 = __importDefault(require("./helpers/validatePreviewsSettings"));
const validateRecordIdentityConf_1 = __importDefault(require("./helpers/validateRecordIdentityConf"));
function default_1({ 'core.domain.attribute': attributeDomain = null, 'core.domain.eventsManager': eventsManager = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.domain.helpers.validate': validateHelper = null, 'core.domain.library.helpers.deleteAssociatedValues': deleteAssociatedValues = null, 'core.domain.library.helpers.runPreDelete': runPreDelete = null, 'core.domain.library.helpers.updateAssociatedForms': updateAssociatedForms = null, 'core.domain.permission.admin': adminPermissionDomain = null, 'core.domain.record': recordDomain = null, 'core.infra.attribute': attributeRepo = null, 'core.infra.cache.cacheService': cacheService = null, 'core.infra.library': libraryRepo = null, 'core.infra.tree': treeRepo = null, 'core.utils': utils = null, config = null, translator: translator = null } = {}) {
    return {
        async getLibraries({ params, ctx }) {
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            const libsList = await libraryRepo.getLibraries({ params: initializedParams, ctx });
            const libs = await Promise.all(libsList.list.map(async (lib) => {
                lib.attributes = await attributeDomain.getLibraryAttributes(lib.id, ctx);
                lib.fullTextAttributes = await attributeDomain.getLibraryFullTextAttributes(lib.id, ctx);
                return lib;
            }));
            return {
                totalCount: libsList.totalCount,
                list: libs
            };
        },
        async getLibraryProperties(id, ctx) {
            if (!id) {
                throw new ValidationError_1.default({ id: errors_1.Errors.MISSING_LIBRARY_ID });
            }
            const lib = await getCoreEntityById('library', id, ctx);
            if (!lib) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
            }
            return lib;
        },
        async getLibrariesUsingAttribute(attributeId, ctx) {
            const attribute = await getCoreEntityById('attribute', attributeId, ctx);
            if (!attribute) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_ATTRIBUTE });
            }
            return libraryRepo.getLibrariesUsingAttribute(attributeId, ctx);
        },
        async saveLibrary(libData, ctx) {
            var _a, _b, _c, _d;
            const library = await getCoreEntityById('library', libData.id, ctx);
            const existingLib = !!library;
            const defaultParams = {
                id: '',
                system: false,
                behavior: library_1.LibraryBehavior.STANDARD,
                label: { fr: '', en: '' }
            };
            // We need behavior later on for validation. It's forbidden to change it so we get it from the existing lib
            const libBehavior = existingLib ? library === null || library === void 0 ? void 0 : library.behavior : (_a = libData === null || libData === void 0 ? void 0 : libData.behavior) !== null && _a !== void 0 ? _a : defaultParams.behavior;
            // If existing lib, force all uneditable fields to value saved id DB
            // If new lib, merge default params with supplied params
            const dataToSave = existingLib
                ? Object.assign(Object.assign({}, libData), { behavior: library.behavior, system: library.system }) : Object.assign(Object.assign({}, defaultParams), libData);
            if (libBehavior === library_1.LibraryBehavior.FILES) {
                dataToSave.previewsSettings = [..._constants_1.systemPreviewsSettings, ...((_b = libData.previewsSettings) !== null && _b !== void 0 ? _b : [])];
                // Make sure the "system" flag is defined everywhere
                dataToSave.previewsSettings = dataToSave.previewsSettings.map(preview => {
                    var _a;
                    return Object.assign(Object.assign({}, preview), { system: (_a = preview.system) !== null && _a !== void 0 ? _a : false });
                });
            }
            const validationErrors = [];
            const defaultAttributes = (0, getLibraryDefaultAttributes_1.default)(dataToSave.behavior, libData.id);
            const currentLibraryAttributes = existingLib
                ? (await attributeDomain.getLibraryAttributes(libData.id, ctx)).map(a => a.id)
                : [];
            const currentFullTextAttributes = existingLib
                ? (await attributeDomain.getLibraryFullTextAttributes(libData.id, ctx)).map(a => a.id)
                : [];
            // Check permissions
            const permCheck = await (0, checkSavePermission_1.default)(existingLib, ctx.userId, { adminPermissionDomain }, ctx);
            if (!permCheck.canSave) {
                throw new PermissionError_1.default(permCheck.action);
            }
            // Validate ID format
            if (!utils.isIdValid(dataToSave.id)) {
                throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_ID_FORMAT });
            }
            validationErrors.push(await (0, validatePermConf_1.default)(dataToSave.permissions_conf, { attributeDomain }, ctx));
            if (dataToSave.defaultView && !(await validateHelper.validateView(dataToSave.defaultView, false, ctx))) {
                validationErrors.push({
                    defaultView: errors_1.Errors.UNKNOWN_VIEW
                });
            }
            // New library? Link default attributes. Otherwise, save given attributes if any
            const attributesToSave = dataToSave.attributes
                ? dataToSave.attributes.map(attr => attr.id)
                : currentLibraryAttributes;
            const fullTextAttributesToSave = dataToSave.fullTextAttributes
                ? dataToSave.fullTextAttributes.map(fta => fta.id)
                : (0, lodash_1.intersection)(attributesToSave, currentFullTextAttributes); // in case an attribute is deleted while indexed
            const libAttributes = (0, lodash_1.union)(defaultAttributes, attributesToSave);
            const libFullTextAttributes = [...new Set(fullTextAttributesToSave)];
            // We can get rid of attributes and full text attributes in lib data, it will be saved separately
            delete dataToSave.attributes;
            delete dataToSave.fullTextAttributes;
            validationErrors.push(await (0, validateLibAttributes_1.default)(Object.assign(Object.assign({}, dataToSave), { behavior: libBehavior }), libAttributes, { attributeDomain }, ctx), (0, validateLibFullTextAttributes_1.default)((0, lodash_1.union)(defaultAttributes, attributesToSave.length ? attributesToSave : currentLibraryAttributes), libFullTextAttributes), await (0, validateRecordIdentityConf_1.default)(dataToSave, libAttributes, {
                attributeDomain
            }, ctx), await (0, validatePreviewsSettings_1.default)(dataToSave, ctx));
            // remove full text attributes if attribute is delete
            libFullTextAttributes.filter(a => libAttributes.includes(a));
            const mergedValidationErrors = validationErrors.reduce((acc, cur) => (Object.assign(Object.assign({}, acc), cur)), {});
            if (Object.keys(mergedValidationErrors).length) {
                throw new ValidationError_1.default(mergedValidationErrors);
            }
            // If permissions conf changed we clean cache related to this library.
            if (existingLib &&
                JSON.stringify((_c = libData.permissions_conf) === null || _c === void 0 ? void 0 : _c.permissionTreeAttributes) !==
                    JSON.stringify((_d = library.permissions_conf) === null || _d === void 0 ? void 0 : _d.permissionTreeAttributes)) {
                const keyLib = (0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.LIBRARY,
                    applyTo: libData.id
                });
                const keyRec = (0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.RECORD,
                    applyTo: libData.id
                });
                await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([keyLib, keyRec]);
            }
            const savedLib = existingLib
                ? await libraryRepo.updateLibrary({
                    libData: dataToSave,
                    ctx
                })
                : await libraryRepo.createLibrary({
                    libData: dataToSave,
                    ctx
                });
            await libraryRepo.saveLibraryAttributes({
                libId: dataToSave.id,
                attributes: libAttributes,
                ctx
            });
            await libraryRepo.saveLibraryFullTextAttributes({
                libId: dataToSave.id,
                fullTextAttributes: libFullTextAttributes,
                ctx
            });
            await (0, runBehaviorPostSave_1.default)(savedLib, !existingLib, { treeRepo, attributeRepo, libraryRepo, translator, utils, config }, ctx);
            // delete associate values and update forms if attribute is delete
            const deletedAttrs = (0, lodash_1.difference)((0, lodash_1.difference)(currentLibraryAttributes, defaultAttributes), libAttributes);
            if (deletedAttrs.length) {
                await deleteAssociatedValues.deleteAssociatedValues(deletedAttrs, libData.id, ctx);
                await updateAssociatedForms.updateAssociatedForms(deletedAttrs, libData.id, ctx);
            }
            // sending indexation event
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.LIBRARY_SAVE,
                data: Object.assign({ new: Object.assign(Object.assign({}, savedLib), { fullTextAttributes: libFullTextAttributes, attributes: libAttributes }) }, (existingLib && {
                    old: Object.assign(Object.assign({}, library), { fullTextAttributes: currentFullTextAttributes, attributes: currentLibraryAttributes })
                }))
            }, ctx);
            if (existingLib) {
                const cacheKey = utils.getCoreEntityCacheKey('library', savedLib.id);
                await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey, `${cacheKey}:*`]);
            }
            return savedLib;
        },
        async deleteLibrary(id, ctx) {
            // Check permissions
            const action = permissions_1.AdminPermissionsActions.DELETE_LIBRARY;
            const canSaveLibrary = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSaveLibrary) {
                throw new PermissionError_1.default(action);
            }
            // Get library
            const library = await this.getLibraryProperties(id, ctx);
            if (library.system) {
                throw new ValidationError_1.default({ id: errors_1.Errors.SYSTEM_LIBRARY_DELETION });
            }
            await runPreDelete(library, ctx);
            // Get all records and delete them
            const records = await recordDomain.find({ params: { library: id }, ctx });
            for (const r of records.list) {
                await recordDomain.deleteRecord({ library: id, id: r.id, ctx });
            }
            const deletedLibrary = await libraryRepo.deleteLibrary({ id, ctx });
            // sending indexation event
            await eventsManager.sendDatabaseEvent({
                action: event_1.EventAction.LIBRARY_DELETE,
                data: { old: Object.assign(Object.assign({}, deletedLibrary), { attributes: undefined, fullTextAttributes: undefined }) }
            }, ctx);
            const cacheKey = utils.getCoreEntityCacheKey('library', id);
            await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey, `${cacheKey}:*`]);
            return deletedLibrary;
        }
    };
}
exports.default = default_1;
