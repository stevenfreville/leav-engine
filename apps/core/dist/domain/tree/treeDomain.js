"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const errors_1 = require("../../_types/errors");
const eventsManager_1 = require("../../_types/eventsManager");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
const record_1 = require("../../_types/record");
const tree_1 = require("../../_types/tree");
const getPermissionCachePatternKey_1 = __importDefault(require("../permission/helpers/getPermissionCachePatternKey"));
const _types_1 = require("../permission/_types");
function default_1({ 'core.domain.record': recordDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.permission.admin': adminPermissionDomain = null, 'core.domain.permission.tree': treePermissionDomain = null, 'core.domain.permission.treeNode': treeNodePermissionDomain = null, 'core.domain.tree.helpers.treeDataValidation': treeDataValidationHelper = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.domain.tree.helpers.elementAncestors': elementAncestorsHelper = null, 'core.domain.tree.helpers.handleRemovedLibraries': handleRemovedLibraries = null, 'core.domain.tree.helpers.getDefaultElement': getDefaultElementHelper = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.infra.library': libraryRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.versionProfile': versionProfileRepo = null, 'core.utils': utils = null, 'core.infra.cache.cacheService': cacheService = null } = {}) {
    async function _isExistingTree(treeId, ctx) {
        const treeProps = await getCoreEntityById('tree', treeId, ctx);
        return !!treeProps;
    }
    async function _isRecordExisting(element, ctx) {
        const record = await recordDomain.find({
            params: {
                library: element.library,
                filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: `${element.id}` }],
                retrieveInactive: true
            },
            ctx
        });
        return !!record.list.length;
    }
    const _isForbiddenAsChild = (treeProps, parent, element) => {
        var _a, _b, _c, _d, _e, _f;
        return (parent === null && !((_b = (_a = treeProps.libraries) === null || _a === void 0 ? void 0 : _a[element.library]) === null || _b === void 0 ? void 0 : _b.allowedAtRoot)) ||
            (parent !== null &&
                !((_d = (_c = treeProps.libraries) === null || _c === void 0 ? void 0 : _c[parent.library]) === null || _d === void 0 ? void 0 : _d.allowedChildren.includes('__all__')) &&
                !((_f = (_e = treeProps.libraries) === null || _e === void 0 ? void 0 : _e[parent.library]) === null || _f === void 0 ? void 0 : _f.allowedChildren.includes(element.library)));
    };
    const _clearLibraries = async (libraries) => {
        const keys = [];
        for (const libId of libraries) {
            keys.push((0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.LIBRARY,
                applyTo: libId
            }), (0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.RECORD,
                applyTo: libId
            }));
        }
        await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData(keys);
    };
    const _clearTrees = async (trees) => {
        const keys = [];
        for (const treeId of trees) {
            keys.push((0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.TREE,
                applyTo: treeId
            }), (0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.TREE_LIBRARY,
                applyTo: treeId
            }), (0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.TREE_NODE,
                applyTo: treeId
            }));
        }
        await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData(keys);
    };
    const _clearAttributes = async (attributes) => {
        const keys = [];
        for (const attributeId of attributes) {
            keys.push((0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.ATTRIBUTE,
                applyTo: attributeId
            }), (0, getPermissionCachePatternKey_1.default)({
                permissionType: permissions_1.PermissionTypes.RECORD_ATTRIBUTE,
                applyTo: attributeId
            }));
        }
        await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData(keys);
    };
    const _cleanPermissionsCacheRelatedToTree = async (treeId, ctx) => {
        if (treeId === 'users_groups') {
            return cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([`${_types_1.PERMISSIONS_CACHE_HEADER}:*`]);
        }
        const attributes = (await attributeDomain.getAttributes({ params: { filters: { linked_tree: treeId } }, ctx })).list;
        const libraries = (await libraryRepo.getLibraries({ ctx })).list
            .filter(l => !!l.permissions_conf)
            .filter(library => {
            var _a;
            let isUsingAttributes = false;
            for (const attrs of (_a = library.permissions_conf) === null || _a === void 0 ? void 0 : _a.permissionTreeAttributes) {
                isUsingAttributes = !!attributes.filter(a => attrs.includes(a.id)).length || isUsingAttributes;
            }
            return isUsingAttributes;
        });
        await _clearLibraries(libraries.map(l => l.id));
        const trees = (await treeRepo.getTrees({ ctx })).list
            .filter(tree => !!tree.permissions_conf)
            .filter(tree => {
            let isUsingAttributes = false;
            for (const [lib, treePermissionsConf] of Object.entries(tree.permissions_conf)) {
                isUsingAttributes =
                    !!attributes.filter(a => treePermissionsConf.permissionTreeAttributes.includes(a.id)).length ||
                        isUsingAttributes;
            }
            return isUsingAttributes;
        });
        await _clearTrees(trees.map(t => t.id));
        const attribs = (await attributeDomain.getAttributes({ ctx })).list
            .filter(a => !!a.permissions_conf)
            .filter(attribute => {
            var _a;
            let isUsingAttributes = false;
            for (const attrs of (_a = attribute.permissions_conf) === null || _a === void 0 ? void 0 : _a.permissionTreeAttributes) {
                isUsingAttributes = !!attributes.filter(a => attrs.includes(a.id)).length || isUsingAttributes;
            }
            return isUsingAttributes;
        });
        await _clearAttributes(attribs.map(a => a.id));
    };
    const _clearAllTreeCaches = async (treeId, ctx) => {
        await _cleanPermissionsCacheRelatedToTree(treeId, ctx);
        await elementAncestorsHelper.clearElementAncestorsCache({ treeId, ctx });
        await getDefaultElementHelper.clearCache({ treeId, ctx });
    };
    const _sendTreeEvent = async (params, ctx) => {
        const { treeId, type, element, parentNode, parentNodeBefore, order } = params;
        return eventsManagerDomain.sendPubSubEvent({
            data: {
                treeEvent: {
                    type,
                    treeId,
                    element: Object.assign(Object.assign({}, element), { treeId }),
                    parentNode: parentNode ? { id: parentNode, treeId } : null,
                    parentNodeBefore: parentNodeBefore ? { id: parentNodeBefore, treeId } : null,
                    order
                }
            },
            triggerName: eventsManager_1.TriggerNames.TREE_EVENT
        }, ctx);
    };
    return {
        async saveTree(treeData, ctx) {
            // Check is existing tree
            const isExistingTree = await _isExistingTree(treeData.id, ctx);
            // Check permissions
            const action = isExistingTree ? permissions_1.AdminPermissionsActions.EDIT_TREE : permissions_1.AdminPermissionsActions.CREATE_TREE;
            const canSaveTree = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSaveTree) {
                throw new PermissionError_1.default(action);
            }
            // Get data to save
            const defaultParams = { id: '', behavior: tree_1.TreeBehavior.STANDARD, system: false, label: { fr: '', en: '' } };
            const treeProps = await getCoreEntityById('tree', treeData.id, ctx);
            // If existing tree, skip all uneditable fields from supplied params.
            // If new tree, merge default params with supplied params
            const uneditableFields = ['behavior', 'system'];
            const dataToSave = isExistingTree
                ? Object.assign(Object.assign(Object.assign({}, defaultParams), treeProps), (0, lodash_1.omit)(treeData, uneditableFields)) : Object.assign(Object.assign({}, defaultParams), treeData);
            // Validate tree data
            await treeDataValidationHelper.validate(dataToSave, ctx);
            // If permissions conf changed we clean cache related to this tree.
            if (isExistingTree &&
                JSON.stringify(treeData.permissions_conf) !== JSON.stringify(treeProps.permissions_conf)) {
                await _clearTrees([treeData.id]);
            }
            // Save
            const savedTree = isExistingTree
                ? await treeRepo.updateTree({ treeData: dataToSave, ctx })
                : await treeRepo.createTree({ treeData: dataToSave, ctx });
            if (isExistingTree) {
                const cacheKey = utils.getCoreEntityCacheKey('tree', dataToSave.id);
                await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey]);
                await handleRemovedLibraries(treeProps, dataToSave, ctx);
            }
            return savedTree;
        },
        async deleteTree(id, ctx) {
            // Check permissions
            const action = permissions_1.AdminPermissionsActions.DELETE_TREE;
            const canSaveTree = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSaveTree) {
                throw new PermissionError_1.default(action);
            }
            // Check is existing tree
            const treeProps = await getCoreEntityById('tree', id, ctx);
            if (!treeProps) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_TREE });
            }
            if (treeProps.system) {
                throw new ValidationError_1.default({ id: errors_1.Errors.SYSTEM_TREE_DELETION });
            }
            await _cleanPermissionsCacheRelatedToTree(treeProps.id, ctx);
            await elementAncestorsHelper.clearElementAncestorsCache({ treeId: treeProps.id, ctx });
            // Remove tree from versions profile using it
            const versionProfiles = await versionProfileRepo.getVersionProfiles({
                params: { filters: { trees: treeProps.id } },
                ctx
            });
            if (versionProfiles.list.length) {
                await Promise.all(versionProfiles.list.map(async (versionProfile) => {
                    const trees = versionProfile.trees.filter(t => t !== treeProps.id);
                    await versionProfileRepo.updateVersionProfile({
                        profileData: Object.assign(Object.assign({}, versionProfile), { trees }),
                        ctx
                    });
                }));
            }
            const deletedTree = treeRepo.deleteTree({ id, ctx });
            const cacheKey = utils.getCoreEntityCacheKey('tree', id);
            await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey, `${cacheKey}:*`]);
            return deletedTree;
        },
        async getTrees({ params, ctx }) {
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            return treeRepo.getTrees({ params: initializedParams, ctx });
        },
        async getTreeProperties(treeId, ctx) {
            const tree = await getCoreEntityById('tree', treeId, ctx);
            if (!tree) {
                throw utils.generateExplicitValidationError('id', { msg: errors_1.Errors.UNKNOWN_TREE, vars: { tree: treeId } }, ctx.lang);
            }
            return tree;
        },
        async addElement({ treeId, element, parent = null, order = 0, ctx }) {
            const errors = {};
            const treeProps = await getCoreEntityById('tree', treeId, ctx);
            const treeExists = !!treeProps;
            if (!treeExists) {
                errors.treeId = errors_1.Errors.UNKNOWN_TREE;
            }
            const isRecordExisting = await _isRecordExisting(element, ctx);
            if (!isRecordExisting) {
                errors.element = errors_1.Errors.UNKNOWN_RECORD;
            }
            if (parent !== null && !(await treeRepo.isNodePresent({ treeId, nodeId: parent, ctx }))) {
                errors.parentTo = errors_1.Errors.UNKNOWN_PARENT;
            }
            // check allow as children setting
            const parentRecord = parent ? await treeRepo.getRecordByNodeId({ treeId, nodeId: parent, ctx }) : null;
            const parentElement = parentRecord ? { id: parentRecord.id, library: parentRecord.library } : null;
            if (treeExists && isRecordExisting && _isForbiddenAsChild(treeProps, parentElement, element)) {
                errors.element = errors_1.Errors.LIBRARY_FORBIDDEN_AS_CHILD;
            }
            const isRecordPresent = await treeRepo.isRecordPresent({ treeId, record: element, ctx });
            if (treeExists && isRecordExisting && isRecordPresent) {
                if (!treeProps.libraries[element.library].allowMultiplePositions) {
                    errors.element = errors_1.Errors.ELEMENT_ALREADY_PRESENT;
                    // if allow multiple positions is true, check if parents are not same
                }
                else {
                    const ancestors = await this.getElementAncestors({ treeId, nodeId: parent, ctx });
                    if (parent &&
                        ancestors.some(a => a.record.id === element.id && a.record.library === element.library)) {
                        errors.element = errors_1.Errors.ELEMENT_ALREADY_PRESENT_IN_ANCESTORS;
                    }
                }
            }
            if (Object.keys(errors).length) {
                throw new ValidationError_1.default(errors, Object.values(errors).join(', '));
            }
            await getDefaultElementHelper.clearCache({ treeId, ctx });
            const addedElement = await treeRepo.addElement({
                treeId,
                element,
                parent,
                order,
                ctx
            });
            await _sendTreeEvent({ type: tree_1.TreeEventTypes.ADD, treeId, element: addedElement, parentNode: parent, order }, ctx);
            return addedElement;
        },
        async moveElement({ treeId, nodeId, parentTo = null, order = 0, ctx, skipChecks = false }) {
            var _a;
            const parents = await this.getElementAncestors({ treeId, nodeId, ctx });
            const parentBefore = parents.length > 1 ? [...parents].splice(-2, 1)[0] : null;
            const errors = {};
            let treeExists;
            let nodeExists;
            let treeProps;
            let parentElement;
            let nodeRecord;
            let nodeElement;
            if (!skipChecks) {
                treeProps = await getCoreEntityById('tree', treeId, ctx);
                treeExists = !!treeProps;
                if (!(await _isExistingTree(treeId, ctx))) {
                    errors.treeId = errors_1.Errors.UNKNOWN_TREE;
                }
                nodeExists = await treeRepo.isNodePresent({ treeId, nodeId, ctx });
                if (!nodeExists) {
                    errors.element = errors_1.Errors.UNKNOWN_ELEMENT;
                }
                const parentExists = await treeRepo.isNodePresent({ treeId, nodeId: parentTo, ctx });
                if (parentTo !== null && !parentExists) {
                    errors.parentTo = errors_1.Errors.UNKNOWN_PARENT;
                }
                nodeRecord = await treeRepo.getRecordByNodeId({ treeId, nodeId, ctx });
                nodeElement = { id: nodeRecord.id, library: nodeRecord.library };
                const parentRecord = parentTo
                    ? await treeRepo.getRecordByNodeId({ treeId, nodeId: parentTo, ctx })
                    : null;
                parentElement = parentRecord ? { id: parentRecord.id, library: parentRecord.library } : null;
                // Check permissions on source
                let canEditSourceChildren;
                if (parentBefore) {
                    canEditSourceChildren = await treeNodePermissionDomain.getTreeNodePermission({
                        treeId,
                        action: permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN,
                        nodeId: parentBefore.id,
                        userId: ctx.userId,
                        ctx
                    });
                }
                else {
                    canEditSourceChildren = await treePermissionDomain.getTreePermission({
                        treeId,
                        action: permissions_1.TreePermissionsActions.EDIT_CHILDREN,
                        userId: ctx.userId,
                        ctx
                    });
                }
                // Check permissions on destination
                const canEditDestinationChildren = parentTo
                    ? await treeNodePermissionDomain.getTreeNodePermission({
                        treeId,
                        action: permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN,
                        nodeId: parentTo,
                        userId: ctx.userId,
                        ctx
                    })
                    : await treePermissionDomain.getTreePermission({
                        treeId,
                        action: permissions_1.TreePermissionsActions.EDIT_CHILDREN,
                        userId: ctx.userId,
                        ctx
                    });
                if (!canEditSourceChildren || !canEditDestinationChildren) {
                    throw new PermissionError_1.default(permissions_1.TreePermissionsActions.EDIT_CHILDREN);
                }
                // check allow as children setting
                if (treeExists && nodeExists && _isForbiddenAsChild(treeProps, parentElement, nodeElement)) {
                    errors.element = errors_1.Errors.LIBRARY_FORBIDDEN_AS_CHILD;
                }
                if (treeExists &&
                    nodeExists &&
                    parentTo &&
                    (await this.getElementAncestors({ treeId, nodeId: parentTo, ctx })).some(a => a.record.id === nodeRecord.id && a.record.library === nodeRecord.library)) {
                    errors.element = errors_1.Errors.ELEMENT_ALREADY_PRESENT_IN_ANCESTORS;
                }
                if (!!Object.keys(errors).length) {
                    throw new ValidationError_1.default(errors, Object.values(errors).join(', '));
                }
            }
            await _clearAllTreeCaches(treeId, ctx);
            const movedElement = await treeRepo.moveElement({ treeId, nodeId, parentTo, order, ctx });
            await _sendTreeEvent({
                type: tree_1.TreeEventTypes.MOVE,
                treeId,
                element: movedElement,
                parentNode: parentTo !== null && parentTo !== void 0 ? parentTo : null,
                parentNodeBefore: (_a = parentBefore === null || parentBefore === void 0 ? void 0 : parentBefore.id) !== null && _a !== void 0 ? _a : null,
                order
            }, ctx);
            return movedElement;
        },
        async deleteElement({ treeId, nodeId, deleteChildren = true, ctx }) {
            var _a;
            const errors = {};
            if (!(await _isExistingTree(treeId, ctx))) {
                errors.treeId = errors_1.Errors.UNKNOWN_TREE;
            }
            if (!(await treeRepo.isNodePresent({ treeId, nodeId, ctx }))) {
                errors.element = errors_1.Errors.UNKNOWN_ELEMENT;
            }
            if (!!Object.keys(errors).length) {
                throw new ValidationError_1.default(errors, Object.values(errors).join(', '));
            }
            const canDetach = await treeNodePermissionDomain.getTreeNodePermission({
                treeId,
                action: permissions_1.TreeNodePermissionsActions.DETACH,
                nodeId,
                userId: ctx.userId,
                ctx
            });
            if (!canDetach) {
                throw new PermissionError_1.default(permissions_1.TreeNodePermissionsActions.DETACH);
            }
            await _clearAllTreeCaches(treeId, ctx);
            const parents = await this.getElementAncestors({ treeId, nodeId, ctx });
            const parentBefore = parents.length > 1 ? [...parents].splice(-2, 1)[0] : null;
            const deletedElement = await treeRepo.deleteElement({ treeId, nodeId, deleteChildren, ctx });
            await _sendTreeEvent({
                type: tree_1.TreeEventTypes.REMOVE,
                treeId,
                element: deletedElement,
                parentNode: null,
                parentNodeBefore: (_a = parentBefore === null || parentBefore === void 0 ? void 0 : parentBefore.id) !== null && _a !== void 0 ? _a : null,
                order: null
            }, ctx);
            return deletedElement;
        },
        async getTreeContent({ treeId, startingNode = null, depth, childrenCount, ctx }) {
            const errors = {};
            if (!(await _isExistingTree(treeId, ctx))) {
                errors.treeId = errors_1.Errors.UNKNOWN_TREE;
            }
            const isTreeAccessible = await treePermissionDomain.getTreePermission({
                treeId,
                action: permissions_1.TreePermissionsActions.ACCESS_TREE,
                userId: ctx.userId,
                ctx
            });
            if (!isTreeAccessible) {
                throw new PermissionError_1.default(permissions_1.TreePermissionsActions.ACCESS_TREE);
            }
            if (Object.keys(errors).length) {
                throw new ValidationError_1.default(errors, Object.values(errors).join(', '));
            }
            return treeRepo.getTreeContent({ treeId, startingNode, depth, childrenCount, ctx });
        },
        async getElementChildren({ treeId, nodeId, childrenCount, withTotalCount, pagination, ctx }) {
            if (!(await _isExistingTree(treeId, ctx))) {
                throw new ValidationError_1.default({ treeId: errors_1.Errors.UNKNOWN_TREE });
            }
            if (nodeId && !(await this.isNodePresent({ treeId, nodeId, ctx }))) {
                throw new ValidationError_1.default({ node: errors_1.Errors.UNKNOWN_NODE });
            }
            return treeRepo.getElementChildren({ treeId, nodeId, childrenCount, withTotalCount, pagination, ctx });
        },
        async getElementAncestors({ treeId, nodeId, ctx }) {
            return elementAncestorsHelper.getCachedElementAncestors({ treeId, nodeId, ctx });
        },
        async getLinkedRecords({ treeId, attribute, nodeId, ctx }) {
            const attrs = await attributeDomain.getAttributes({ params: { filters: { id: attribute } }, ctx });
            if (!attrs.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_ATTRIBUTE });
            }
            return treeRepo.getLinkedRecords({ treeId, attribute, nodeId, ctx });
        },
        async isNodePresent({ treeId, nodeId, ctx }) {
            return treeRepo.isNodePresent({ treeId, nodeId, ctx });
        },
        async isRecordPresent({ treeId, record, ctx }) {
            return treeRepo.isRecordPresent({ treeId, record, ctx });
        },
        getLibraryTreeId(library, ctx) {
            return utils.getLibraryTreeId(library);
        },
        async getRecordByNodeId({ treeId, nodeId, ctx }) {
            if (!treeId) {
                throw new ValidationError_1.default({ treeId: errors_1.Errors.UNKNOWN_TREE });
            }
            if (!nodeId) {
                throw new ValidationError_1.default({ nodeId: errors_1.Errors.UNKNOWN_NODE });
            }
            return treeRepo.getRecordByNodeId({ treeId, nodeId, ctx });
        },
        async getNodesByRecord({ treeId, record, ctx }) {
            return treeRepo.getNodesByRecord({ treeId, record, ctx });
        },
        async getDefaultElement({ treeId, ctx }) {
            return getDefaultElementHelper.getDefaultElement({ treeId, ctx });
        }
    };
}
exports.default = default_1;
