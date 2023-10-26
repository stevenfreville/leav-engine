"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const event_1 = require("../../_types/event");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const getPermissionCachePatternKey_1 = __importDefault(require("../permission/helpers/getPermissionCachePatternKey"));
const attributeALHelper_1 = require("./helpers/attributeALHelper");
const attributeValidationHelper_1 = require("./helpers/attributeValidationHelper");
function default_1({ 'core.infra.attribute': attributeRepo = null, 'core.domain.actionsList': actionsListDomain = null, 'core.domain.permission.admin': adminPermissionDomain = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.domain.versionProfile': versionProfileDomain = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.infra.form': formRepo = null, 'core.infra.library': libraryRepo = null, 'core.infra.tree': treeRepo = null, 'core.utils': utils = null, config = null, 'core.infra.cache.cacheService': cacheService = null } = {}) {
    const _updateFormsUsingAttribute = async (attributeId, ctx) => {
        const formsList = await formRepo.getForms({ ctx });
        const formsToUpdate = formsList.list.filter(form => {
            var _a;
            return (_a = form.elements) === null || _a === void 0 ? void 0 : _a.some(dependentElements => dependentElements.elements.some(element => { var _a; return ((_a = element.settings) === null || _a === void 0 ? void 0 : _a.attribute) === attributeId; }));
        });
        // update form to remove attribute
        await Promise.all(formsToUpdate.map(form => {
            form.elements = form.elements.map(dependentElements => {
                dependentElements.elements = dependentElements.elements.filter(element => element.settings.attribute !== attributeId);
                return dependentElements;
            });
            return formRepo.updateForm({ formData: form, ctx });
        }));
    };
    return {
        async getLibraryAttributes(libraryId, ctx) {
            const libs = await libraryRepo.getLibraries({ params: { filters: { id: libraryId } }, ctx });
            if (!libs.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
            }
            return attributeRepo.getLibraryAttributes({ libraryId, ctx });
        },
        async getAttributeLibraries({ attributeId, ctx }) {
            // Validate attribute
            await this.getAttributeProperties({ id: attributeId, ctx });
            const libraries = await attributeRepo.getAttributeLibraries({ attributeId, ctx });
            return libraries;
        },
        async getLibraryFullTextAttributes(libraryId, ctx) {
            const library = await getCoreEntityById('library', libraryId, ctx);
            if (!library) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
            }
            return attributeRepo.getLibraryFullTextAttributes({ libraryId, ctx });
        },
        async getAttributeProperties({ id, ctx }) {
            const attribute = await getCoreEntityById('attribute', id, ctx);
            if (!attribute) {
                throw new ValidationError_1.default({ id: { msg: errors_1.Errors.UNKNOWN_ATTRIBUTE, vars: { attribute: id } } });
            }
            return attribute;
        },
        async getAttributes({ params, ctx }) {
            // TODO: possibility to search multiple IDs
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            return attributeRepo.getAttributes({ params: initializedParams, ctx });
        },
        async saveAttribute({ attrData, ctx }) {
            // TODO: Validate attribute data (linked library, linked tree...)
            var _a, _b, _c, _d;
            const attrProps = await getCoreEntityById('attribute', attrData.id, ctx);
            const isExistingAttr = !!attrProps;
            const defaultParams = {
                _key: '',
                system: false,
                multiple_values: false,
                values_list: {
                    enable: false
                }
            };
            const attrToSave = isExistingAttr
                ? Object.assign(Object.assign(Object.assign({}, defaultParams), attrProps), attrData) : Object.assign(Object.assign({}, defaultParams), attrData);
            // Check permissions
            const action = isExistingAttr
                ? permissions_1.AdminPermissionsActions.EDIT_ATTRIBUTE
                : permissions_1.AdminPermissionsActions.CREATE_ATTRIBUTE;
            const canSavePermission = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSavePermission) {
                throw new PermissionError_1.default(action);
            }
            // Add default actions list on new attribute
            attrToSave.actions_list = (0, attributeALHelper_1.getActionsListToSave)(attrToSave, attrProps, !isExistingAttr, utils);
            // Check settings validity
            const validationErrors = await (0, attributeValidationHelper_1.validateAttributeData)(attrToSave, {
                utils,
                treeRepo,
                config,
                attributeRepo,
                actionsListDomain,
                versionProfileDomain
            }, ctx);
            if (Object.keys(validationErrors).length) {
                throw new ValidationError_1.default(validationErrors);
            }
            if (attrToSave.format === attribute_1.AttributeFormats.DATE_RANGE && ((_b = (_a = attrToSave.values_list) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b.length)) {
                attrToSave.values_list.values = attrToSave.values_list.values.map((v) => {
                    const valuesObj = typeof v !== 'object' ? JSON.parse(v) : v;
                    // Extract the precise fields we need to make sure
                    // we don't have something else hanging out (eg. a __typename field)
                    return { from: Number(valuesObj.from), to: Number(valuesObj.to) };
                });
            }
            // If permissions conf changed we clean cache related to this attribute.
            if (isExistingAttr &&
                JSON.stringify((_c = attrData.permissions_conf) === null || _c === void 0 ? void 0 : _c.permissionTreeAttributes) !==
                    JSON.stringify((_d = attrProps.permissions_conf) === null || _d === void 0 ? void 0 : _d.permissionTreeAttributes)) {
                const keyAttr = (0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.ATTRIBUTE,
                    applyTo: attrProps.id
                });
                const keyRecAttr = (0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.RECORD_ATTRIBUTE,
                    applyTo: attrProps.id
                });
                await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([keyAttr, keyRecAttr]);
            }
            const attr = isExistingAttr
                ? await attributeRepo.updateAttribute({ attrData: attrToSave, ctx })
                : await attributeRepo.createAttribute({ attrData: attrToSave, ctx });
            await eventsManagerDomain.sendDatabaseEvent({
                action: event_1.EventAction.ATTRIBUTE_SAVE,
                data: Object.assign({ new: attr }, (isExistingAttr && {
                    old: attrProps
                }))
            }, ctx);
            const cacheKey = utils.getCoreEntityCacheKey('attribute', attrToSave.id);
            await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey]);
            return attr;
        },
        async deleteAttribute({ id, ctx }) {
            // Check permissions
            const action = permissions_1.AdminPermissionsActions.DELETE_ATTRIBUTE;
            const canSavePermission = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSavePermission) {
                throw new PermissionError_1.default(action);
            }
            // Get attribute
            const attr = await this.getAttributes({ params: { filters: { id } }, ctx });
            // Check if exists and can delete
            if (!attr.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_ATTRIBUTE });
            }
            const attrProps = attr.list.pop();
            if (attrProps.system) {
                throw new ValidationError_1.default({ id: errors_1.Errors.SYSTEM_ATTRIBUTE_DELETION });
            }
            // Check if attribute is used in metadata of another attribute
            const attributesLinkedThroughMetadata = await attributeRepo.getAttributes({
                params: {
                    filters: {
                        metadata_fields: [id]
                    }
                },
                ctx
            });
            if (attributesLinkedThroughMetadata.list.length) {
                throw utils.generateExplicitValidationError('id', {
                    msg: errors_1.Errors.ATTRIBUTE_USED_IN_METADATA,
                    vars: { attributes: attributesLinkedThroughMetadata.list.map(a => a.id).join(', ') }
                }, ctx.lang);
            }
            const deletedAttribute = await attributeRepo.deleteAttribute({ attrData: attrProps, ctx });
            await eventsManagerDomain.sendDatabaseEvent({
                action: event_1.EventAction.ATTRIBUTE_DELETE,
                data: { old: deletedAttribute }
            }, ctx);
            const cacheKey = utils.getCoreEntityCacheKey('attribute', id);
            await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey]);
            await _updateFormsUsingAttribute(id, ctx);
            return deletedAttribute;
        },
        getInputTypes({ attrData }) {
            return (0, attributeALHelper_1.getAllowedInputTypes)(attrData);
        },
        getOutputTypes({ attrData }) {
            return (0, attributeALHelper_1.getAllowedOutputTypes)(attrData);
        }
    };
}
exports.default = default_1;
