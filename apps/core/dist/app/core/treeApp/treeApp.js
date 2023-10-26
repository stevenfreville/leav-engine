"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const lodash_1 = require("lodash");
const eventsManager_1 = require("../../../_types/eventsManager");
const permissions_1 = require("../../../_types/permissions");
const tree_1 = require("../../../_types/tree");
function default_1({ 'core.domain.tree': treeDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.permission': permissionDomain = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.app.core': coreApp = null, 'core.app.graphql': graphqlApp = null, 'core.app.core.subscriptionsHelper': subscriptionsHelper = null, 'core.domain.library': libraryDomain = null } = {}) {
    /**
     * Retrieve parent tree attribute by recursively getting up on GraphQL query path.
     * We consider that the attribute is the first key that it's not one of our tree queries keys (ancestors, children,
     * value) and not a number (which is an array index)
     *
     * @param path
     * @return string
     */
    const _findParentAttribute = (path) => {
        const restrictedKeys = ['record', 'ancestors', 'children', 'value', 'treeValue'];
        if (!restrictedKeys.includes(path.key) && typeof path.key !== 'number') {
            return path.key;
        }
        return path.prev !== null ? _findParentAttribute(path.prev) : null;
    };
    /**
     * Extract tree ID from parent by retrieving attribute, then tree linked to this attribute
     *
     * @param parent
     * @param info
     */
    const _extractTreeIdFromParent = async (parent, info, ctx) => {
        var _a;
        const attribute = (_a = parent.attribute) !== null && _a !== void 0 ? _a : _findParentAttribute(info.path);
        const attributeProps = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
        return attributeProps.linked_tree;
    };
    const _filterTreeContentReduce = (ctx, treeId) => async (visibleNodesProm, treeNode) => {
        const visibleNodes = await visibleNodesProm;
        const isVisible = await permissionDomain.isAllowed({
            type: permissions_1.PermissionTypes.TREE_NODE,
            applyTo: treeId,
            action: permissions_1.TreeNodePermissionsActions.ACCESS_TREE,
            target: { nodeId: treeNode.id },
            userId: ctx.userId,
            ctx
        });
        if (isVisible) {
            visibleNodes.push(Object.assign(Object.assign({}, treeNode), { treeId }));
        }
        return visibleNodes;
    };
    const _getChildrenDepth = (fields, depth) => {
        const children = fields.find(f => f.name === 'children');
        if (children) {
            return _getChildrenDepth(children.fields, depth + 1);
        }
        return depth;
    };
    const _getAncestors = async (parent, _, ctx, info) => {
        var _a, _b;
        const treeId = (_b = (_a = parent.treeId) !== null && _a !== void 0 ? _a : ctx.treeId) !== null && _b !== void 0 ? _b : (await _extractTreeIdFromParent(parent, info, ctx));
        const ancestors = await treeDomain.getElementAncestors({ treeId, nodeId: parent.id, ctx });
        // Add treeId as it might be useful for nested resolvers
        return ancestors.map(n => (Object.assign(Object.assign({}, n), { treeId })));
    };
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    scalar FullTreeContent

                    enum TreeBehavior {
                        ${Object.values(tree_1.TreeBehavior).join(' ')}
                    }

                    type TreeLibrarySettings {
                        allowMultiplePositions: Boolean!
                        allowedChildren: [String!]!
                        allowedAtRoot: Boolean!
                    }

                    type TreeLibrary {
                        library: Library!,
                        settings: TreeLibrarySettings!
                    }

                    type TreePermissions {
                        ${Object.values(permissions_1.TreePermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                    }

                    type TreeNodePermissions {
                        ${Object.values(permissions_1.TreeNodePermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                    }

                    type Tree {
                        id: ID!,
                        system: Boolean!,
                        libraries: [TreeLibrary!]!,
                        behavior: TreeBehavior!,
                        label(lang: [AvailableLanguage!]): SystemTranslation,
                        permissions_conf: [TreeNodePermissionsConf!],
                        permissions: TreePermissions!,
                        defaultElement: TreeNode
                    }

                    type TreeNodePermissionsConf {
                        libraryId: ID!,
                        permissionsConf: Treepermissions_conf!
                    }

                    input TreeLibrarySettingsInput {
                        allowMultiplePositions: Boolean!
                        allowedChildren: [String!]!
                        allowedAtRoot: Boolean!
                    }

                    input TreeLibraryInput {
                        library: ID!,
                        settings: TreeLibrarySettingsInput!
                    }

                    input TreeInput {
                        id: ID!
                        libraries: [TreeLibraryInput!],
                        behavior: TreeBehavior,
                        label: SystemTranslation
                        permissions_conf: [TreeNodePermissionsConfInput!]
                    }

                    input TreeNodePermissionsConfInput {
                        libraryId: ID!,
                        permissionsConf: Treepermissions_confInput!
                    }

                    type TreeElement {
                        id: ID,
                        library: String
                    }

                    type TreeNode {
                        id: ID!,
                        order: Int,
                        childrenCount: Int,
                        record: Record,
                        ancestors: [TreeNode!],
                        children: [TreeNode!],
                        linkedRecords(attribute: ID): [Record!],
                        permissions: TreeNodePermissions!
                    }

                    type TreeNodeLight {
                        id: ID!,
                        order: Int,
                        childrenCount: Int,
                        ancestors: [TreeNode!],
                        record: Record!,
                        linkedRecords(attribute: ID): [Record!],
                        permissions: TreeNodePermissions!
                    }

                    type TreeNodeLightList {
                        totalCount: Int,
                        list: [TreeNodeLight!]!
                    }

                    input TreeElementInput {
                        id: ID!,
                        library: String!
                    }

                    input TreesFiltersInput {
                        id: [ID!],
                        label: [String!],
                        system: Boolean,
                        behavior: TreeBehavior,
                        library: String
                    }

                    type TreesList {
                        totalCount: Int!,
                        list: [Tree!]!
                    }

                    enum TreesSortableFields {
                        id
                        system
                        behavior
                    }

                    input SortTrees {
                        field: TreesSortableFields!
                        order: SortOrder
                    }

                    enum TreeEventTypes {
                        ${Object.values(tree_1.TreeEventTypes).join(' ')}
                    }

                    type TreeEvent {
                        type: TreeEventTypes!,
                        treeId: ID!,
                        element: TreeNode!,
                        parentNode: TreeNode,
                        parentNodeBefore: TreeNode,
                    }

                    input TreeEventFiltersInput {
                        ${subscriptionsHelper.commonSubscriptionsFilters}

                        treeId: ID!,
                        # Nodes concerned by the event, whether be the source or the target
                        nodes: [ID],
                        events: [TreeEventTypes!]
                    }

                    extend type Query {
                        trees(
                            filters: TreesFiltersInput,
                            pagination: Pagination,
                            sort: SortTrees
                        ): TreesList

                        # Retrieve tree content.
                        # If startAt is specified, it returns this element's children. Otherwise, it starts
                        # from tree root
                        treeContent(treeId: ID!, startAt: ID): [TreeNode!]!

                        # Retrieve direct children of a node. If node is not specified, retrieves root children
                        treeNodeChildren(treeId: ID!, node: ID, pagination: Pagination): TreeNodeLightList!

                        # Retrieve full tree content form tree root, as an object.
                        fullTreeContent(treeId: ID!): FullTreeContent

                        # Retrieve record by node id
                        getRecordByNodeId(treeId: ID!, nodeId: ID!): Record!
                    }

                    extend type Mutation {
                        saveTree(tree: TreeInput!): Tree!
                        deleteTree(id: ID!): Tree!
                        treeAddElement(
                            treeId: ID!,
                            element: TreeElementInput!,
                            parent: ID,
                            order: Int
                        ): TreeNode!
                        treeMoveElement(
                            treeId: ID!,
                            nodeId: ID!,
                            parentTo: ID,
                            order: Int
                        ): TreeNode!
                        treeDeleteElement(
                            treeId: ID!,
                            nodeId: ID!,
                            deleteChildren: Boolean
                        ): ID!
                    }

                    extend type Subscription {
                        treeEvent(filters: TreeEventFiltersInput): TreeEvent!
                    }
                `,
                resolvers: {
                    Query: {
                        async trees(_, { filters, pagination, sort }, ctx) {
                            return treeDomain.getTrees({ params: { filters, withCount: true, pagination, sort }, ctx });
                        },
                        async getRecordByNodeId(_, { treeId, nodeId }, ctx) {
                            return treeDomain.getRecordByNodeId({ treeId, nodeId, ctx });
                        },
                        async treeContent(_, { treeId, startAt }, ctx, info) {
                            ctx.treeId = treeId;
                            const fields = graphqlApp.getQueryFields(info);
                            const hasChildrenCount = !!fields.find(f => f.name === 'childrenCount');
                            const depth = _getChildrenDepth(fields, 1);
                            const treeContent = (await treeDomain.getTreeContent({
                                treeId,
                                startingNode: startAt,
                                depth,
                                childrenCount: hasChildrenCount,
                                ctx
                            })).map(node => (Object.assign(Object.assign({}, node), { treeId })));
                            return treeContent;
                        },
                        async treeNodeChildren(_, { treeId, node, pagination }, ctx, info) {
                            var _a, _b;
                            ctx.treeId = treeId;
                            const fields = graphqlApp.getQueryFields(info);
                            const hasChildrenCount = !!((_b = (_a = fields
                                .find(f => f.name === 'list')) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.find(f => f.name === 'childrenCount'));
                            const withTotalCount = !!fields.find(f => f.name === 'totalCount');
                            const children = await treeDomain.getElementChildren({
                                treeId,
                                nodeId: node !== null && node !== void 0 ? node : null,
                                childrenCount: hasChildrenCount,
                                withTotalCount,
                                pagination,
                                ctx
                            });
                            return Object.assign(Object.assign({}, children), { list: children.list.map(child => (Object.assign(Object.assign({}, child), { treeId }))) });
                        },
                        async fullTreeContent(_, { treeId }, ctx) {
                            return treeDomain.getTreeContent({ treeId, ctx });
                        }
                    },
                    Mutation: {
                        async saveTree(_, { tree }, ctx) {
                            // Convert permissions conf
                            const treeToSave = Object.assign({}, (0, lodash_1.omit)(tree, ['libraries', 'permissions_conf']));
                            if (tree.permissions_conf) {
                                treeToSave.permissions_conf = tree.permissions_conf.reduce((acc, cur) => (Object.assign(Object.assign({}, acc), { [cur.libraryId]: cur.permissionsConf })), {});
                            }
                            if (tree.libraries) {
                                treeToSave.libraries = tree.libraries.reduce((acc, cur) => {
                                    return Object.assign(Object.assign({}, acc), { [cur.library]: cur.settings });
                                }, {});
                            }
                            return treeDomain.saveTree(treeToSave, ctx);
                        },
                        async deleteTree(parent, { id }, ctx) {
                            return treeDomain.deleteTree(id, ctx);
                        },
                        async treeAddElement(_, { treeId, element, parent, order }, ctx) {
                            parent = parent || null;
                            const addedNode = await treeDomain.addElement({ treeId, element, parent, order, ctx });
                            return Object.assign(Object.assign({}, addedNode), { treeId });
                        },
                        async treeMoveElement(_, { treeId, nodeId, parentTo, order }, ctx) {
                            parentTo = parentTo || null;
                            const movedNode = await treeDomain.moveElement({
                                treeId,
                                nodeId,
                                parentTo,
                                order,
                                ctx
                            });
                            return Object.assign(Object.assign({}, movedNode), { treeId });
                        },
                        async treeDeleteElement(_, { treeId, nodeId, deleteChildren }, ctx) {
                            const deletedNode = await treeDomain.deleteElement({
                                treeId,
                                nodeId,
                                deleteChildren: deleteChildren !== null && deleteChildren !== void 0 ? deleteChildren : true,
                                ctx
                            });
                            return deletedNode.id;
                        }
                    },
                    Subscription: {
                        treeEvent: {
                            subscribe: (0, graphql_subscriptions_1.withFilter)(() => eventsManagerDomain.subscribe([eventsManager_1.TriggerNames.TREE_EVENT]), (event, { filters }, ctx) => {
                                var _a, _b, _c, _d;
                                if (filters.ignoreOwnEvents && subscriptionsHelper.isOwnEvent(event, ctx)) {
                                    return false;
                                }
                                const { treeEvent } = event;
                                let mustReturn = true;
                                if (filters === null || filters === void 0 ? void 0 : filters.treeId) {
                                    mustReturn = treeEvent.treeId === filters.treeId;
                                }
                                if (mustReturn && (filters === null || filters === void 0 ? void 0 : filters.nodes)) {
                                    mustReturn =
                                        filters.nodes.includes((_b = (_a = treeEvent.parentNode) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null) ||
                                            filters.nodes.includes((_d = (_c = treeEvent.parentNodeBefore) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null);
                                }
                                if (mustReturn && (filters === null || filters === void 0 ? void 0 : filters.events)) {
                                    mustReturn = filters.events.includes(treeEvent.type);
                                }
                                return mustReturn;
                            })
                        }
                    },
                    FullTreeContent: new graphql_1.GraphQLScalarType({
                        name: 'FullTreeContent',
                        description: `Object representing the full tree structure.
                            On each node we will have record data and children`,
                        serialize: val => val,
                        parseValue: val => val,
                        parseLiteral: ast => ast
                    }),
                    Tree: {
                        /**
                         * Return tree label, potentially filtered by requested language
                         */
                        label: async (treeData, args) => {
                            return coreApp.filterSysTranslationField(treeData.label, args.lang || []);
                        },
                        libraries: async (treeData, _, ctx) => {
                            var _a;
                            return Promise.all(Object.keys((_a = treeData.libraries) !== null && _a !== void 0 ? _a : {}).map(async (libId) => {
                                const lib = await libraryDomain.getLibraryProperties(libId, ctx);
                                return { library: lib, settings: treeData.libraries[libId] };
                            }));
                        },
                        permissions_conf: (treeData) => {
                            return treeData.permissions_conf
                                ? Object.keys(treeData.permissions_conf).map(libId => ({
                                    libraryId: libId,
                                    permissionsConf: treeData.permissions_conf[libId]
                                }))
                                : null;
                        },
                        permissions: (tree, _, ctx, infos) => {
                            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                            return requestedActions.reduce(async (allPermsProm, action) => {
                                const allPerms = await allPermsProm;
                                const isAllowed = await permissionDomain.isAllowed({
                                    type: permissions_1.PermissionTypes.TREE,
                                    applyTo: tree.id,
                                    action: action,
                                    userId: ctx.userId,
                                    ctx
                                });
                                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                            }, Promise.resolve({}));
                        },
                        defaultElement: async (treeData, _, ctx) => {
                            const element = await treeDomain.getDefaultElement({ treeId: treeData.id, ctx });
                            return element ? Object.assign(Object.assign({}, element), { treeId: treeData.id }) : null;
                        }
                    },
                    TreeNode: {
                        record: async (parent, _, ctx, info) => {
                            var _a, _b;
                            const treeId = (_b = (_a = parent.treeId) !== null && _a !== void 0 ? _a : ctx.treeId) !== null && _b !== void 0 ? _b : (await _extractTreeIdFromParent(parent, info, ctx));
                            const record = await treeDomain.getRecordByNodeId({ treeId, nodeId: parent.id, ctx });
                            return record !== null && record !== void 0 ? record : null;
                        },
                        children: async (parent, _, ctx, info) => {
                            var _a, _b;
                            const treeId = (_b = (_a = parent.treeId) !== null && _a !== void 0 ? _a : ctx.treeId) !== null && _b !== void 0 ? _b : (await _extractTreeIdFromParent(parent, info, ctx));
                            let children = [];
                            if (typeof parent.children !== 'undefined') {
                                children = parent.children;
                            }
                            else {
                                children = (await treeDomain.getElementChildren({ treeId, nodeId: parent.id, ctx })).list;
                            }
                            // Add treeId as it might be useful for nested resolvers
                            return children.reduce(_filterTreeContentReduce(ctx, treeId), Promise.resolve([]));
                        },
                        ancestors: _getAncestors,
                        linkedRecords: async (parent, { attribute }, ctx, info) => {
                            const attributeProps = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
                            const records = await treeDomain.getLinkedRecords({
                                treeId: attributeProps.linked_tree,
                                attribute,
                                nodeId: parent.id,
                                ctx
                            });
                            return records;
                        },
                        permissions: (treeNode, _, ctx, infos) => {
                            if (!treeNode.treeId) {
                                return null;
                            }
                            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                            return requestedActions.reduce(async (allPermsProm, action) => {
                                const allPerms = await allPermsProm;
                                const isAllowed = await permissionDomain.isAllowed({
                                    type: permissions_1.PermissionTypes.TREE_NODE,
                                    applyTo: treeNode.treeId,
                                    action: action,
                                    userId: ctx.userId,
                                    target: { nodeId: treeNode.id },
                                    ctx
                                });
                                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                            }, Promise.resolve({}));
                        }
                    },
                    TreeNodeLight: {
                        permissions: (treeNode, _, ctx, infos) => {
                            if (!treeNode.treeId) {
                                return null;
                            }
                            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                            return requestedActions.reduce(async (allPermsProm, action) => {
                                const allPerms = await allPermsProm;
                                const isAllowed = await permissionDomain.isAllowed({
                                    type: permissions_1.PermissionTypes.TREE_NODE,
                                    applyTo: treeNode.treeId,
                                    action: action,
                                    userId: ctx.userId,
                                    target: { nodeId: treeNode.id },
                                    ctx
                                });
                                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                            }, Promise.resolve({}));
                        },
                        ancestors: _getAncestors
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
