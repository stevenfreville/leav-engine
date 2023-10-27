"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const bcrypt = __importStar(require("bcryptjs"));
const moment_1 = __importDefault(require("moment"));
const userGroups_1 = require("../../../../_constants/userGroups");
const list_1 = require("../../../../_types/list");
const permissions_1 = require("../../../../_types/permissions");
const views_1 = require("../../../../_types/views");
const libraryRepo_1 = require("../../../library/libraryRepo");
const utils_1 = require("../../../tree/helpers/utils");
const _types_1 = require("../../../view/_types");
const coreCollections_1 = require("./coreCollections");
const systemApplications_1 = require("./systemApplications");
const systemAttributes_1 = require("./systemAttributes");
const systemLibraries_1 = require("./systemLibraries");
const systemTrees_1 = require("./systemTrees");
const collection_1 = require("arangojs/collection");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.library': libraryRepo = null, 'core.infra.attribute': attributeRepo = null, 'core.infra.permission': permissionRepo = null, translator = null, config = null } = {}) {
    const adminUserId = '1';
    const systemUserId = String(config.defaultUserId);
    const now = (0, moment_1.default)().unix();
    const _createAttributes = async (attributes, ctx) => {
        for (const attribute of attributes) {
            // Check if attribute already exists
            const attributeFromDb = await attributeRepo.getAttributes({
                params: {
                    filters: {
                        id: attribute.id
                    },
                    strictFilters: true,
                    withCount: false
                },
                ctx
            });
            // It already exists, move on
            if (attributeFromDb.list.length) {
                continue;
            }
            // Let's create it
            await attributeRepo.createAttribute({
                attrData: Object.assign({}, attribute),
                ctx
            });
        }
    };
    const _createCollections = async (collections, ctx) => {
        for (const collection of collections) {
            if (!(await dbService.collectionExists(collection.name))) {
                await dbService.createCollection(collection.name, collection.type);
            }
        }
    };
    const _createLibraries = async (libraries, ctx) => {
        for (const lib of libraries) {
            // Check if library already exists
            const libsCollec = await dbService.db.collection(libraryRepo_1.LIB_COLLECTION_NAME);
            const existingLib = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR lib IN ${libsCollec}
                        FILTER lib._key == ${lib._key}
                        RETURN lib
                `,
                ctx
            });
            // If not, create it
            if (!existingLib.length) {
                const { attributes, fullTextAttributes } = lib, libData = __rest(lib, ["attributes", "fullTextAttributes"]);
                // Insert in libraries collection
                await dbService.execute({
                    query: (0, arangojs_1.aql) `INSERT ${libData} INTO ${libsCollec} RETURN NEW`,
                    ctx
                });
                // Save its attributes
                await libraryRepo.saveLibraryAttributes({
                    libId: lib._key,
                    attributes,
                    ctx
                });
                await libraryRepo.saveLibraryFullTextAttributes({
                    libId: lib._key,
                    fullTextAttributes,
                    ctx
                });
            }
            // Ensure collection exists for this library
            if (!(await dbService.collectionExists(lib._key))) {
                await dbService.createCollection(lib._key);
            }
        }
    };
    const _createTrees = async (trees, ctx) => {
        for (const tree of trees) {
            const treeFromDb = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR t IN core_trees
                        FILTER t._key == ${tree._key}
                    RETURN t._key
                `,
                ctx
            });
            if (!treeFromDb.length) {
                await dbService.execute({
                    query: (0, arangojs_1.aql) `INSERT ${tree} INTO core_trees RETURN NEW`,
                    ctx
                });
            }
            const edgeCollecName = `core_edge_tree_${tree._key}`;
            if (!(await dbService.collectionExists(edgeCollecName))) {
                await dbService.createCollection(edgeCollecName, collection_1.CollectionType.EDGE_COLLECTION);
            }
            const nodesCollectionName = (0, utils_1.getNodesCollectionName)(tree._key);
            if (!(await dbService.collectionExists(nodesCollectionName))) {
                await dbService.createCollection(nodesCollectionName);
            }
        }
    };
    const _createApplications = async (apps, ctx) => {
        for (const app of apps) {
            // Check if app already exists
            const existingApp = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR app IN core_applications
                        FILTER app._key == ${app._key}
                        RETURN app
                `,
                ctx
            });
            // If not, create it
            if (!existingApp.length) {
                await dbService.execute({
                    query: (0, arangojs_1.aql) `INSERT ${app} INTO core_applications RETURN NEW`,
                    ctx
                });
            }
        }
    };
    const _createUsers = async (ctx) => {
        const salt = await bcrypt.genSalt(10);
        const adminPwd = await bcrypt.hash(config.server.admin.password, salt);
        const creationMetadata = {
            created_at: now,
            modified_at: now,
            created_by: ctx.userId,
            modified_by: ctx.userId
        };
        // System user password is randomly generated as nobody is supposed to sign in with it
        // It might be changed later on if needed
        const systemUserPwd = await bcrypt.hash(Math.random()
            .toString(36)
            .slice(2), salt);
        const users = [
            {
                _key: adminUserId,
                login: config.server.admin.login,
                email: config.server.admin.email,
                label: 'Admin',
                password: adminPwd,
                group: [userGroups_1.adminsGroupId],
                active: true
            },
            {
                _key: systemUserId,
                login: 'system',
                email: config.server.systemUser.email,
                label: 'System',
                password: systemUserPwd,
                group: [userGroups_1.filesAdminsGroupId],
                active: true
            }
        ];
        const usersCollec = dbService.db.collection('users');
        const valuesLinkCollec = dbService.db.collection('core_edge_values_links');
        for (const user of users) {
            const { group } = user, userData = __rest(user, ["group"]);
            const existingUser = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR u IN ${usersCollec}
                        FILTER u._key == ${user._key}
                        RETURN u
                `,
                ctx
            });
            if (!existingUser.length) {
                await dbService.execute({
                    query: (0, arangojs_1.aql) `INSERT ${Object.assign(Object.assign({}, userData), creationMetadata)} INTO ${usersCollec} RETURN NEW`,
                    ctx
                });
            }
            // Add user to group
            const groupNodeId = `${(0, utils_1.getNodesCollectionName)('users_groups')}/${group}`;
            const userDbId = `users/${user._key}`;
            const linkFromDb = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR link IN ${valuesLinkCollec}
                        FILTER link._from == ${userDbId} AND link._to == ${groupNodeId}
                        RETURN link
                `,
                ctx
            });
            if (!linkFromDb.length) {
                await dbService.execute({
                    query: (0, arangojs_1.aql) `
                        INSERT {
                            _from: ${userDbId},
                            _to: ${groupNodeId},
                            attribute: 'user_groups',
                            created_at: ${creationMetadata.created_at},
                            modified_at: ${creationMetadata.modified_at},
                            created_by: ${creationMetadata.created_by},
                            modified_by: ${creationMetadata.modified_by}
                        } IN ${valuesLinkCollec}
                    `,
                    ctx
                });
            }
        }
    };
    const _createUsersGroups = async (ctx) => {
        // Create users group
        const groups = [
            {
                id: userGroups_1.adminsGroupId,
                label: translator.t('default.admin_users_group_label')
            },
            {
                id: userGroups_1.filesAdminsGroupId,
                label: translator.t('files.default_users_group_label')
            }
        ];
        const usersGroupsLibCollec = dbService.db.collection('users_groups');
        const usersGroupsNodeCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)('users_groups'));
        for (const group of groups) {
            const groupFromDb = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR group IN users_groups
                        FILTER group._key == ${group.id}
                        RETURN group
                `,
                ctx
            });
            let groupRecord;
            if (!groupFromDb.length) {
                const resInsertAdminGroupRecord = await dbService.execute({
                    query: (0, arangojs_1.aql) `
                        INSERT {
                            _key: ${group.id},
                            created_at: ${now},
                            modified_at: ${now},
                            created_by: ${ctx.userId},
                            modified_by: ${ctx.userId},
                            label: ${group.label},
                            active: true
                        } IN ${usersGroupsLibCollec}
                        RETURN NEW
                    `,
                    ctx
                });
                groupRecord = resInsertAdminGroupRecord[0];
            }
            else {
                groupRecord = groupFromDb[0];
            }
            const groupNodeFromDb = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR node IN ${usersGroupsNodeCollec}
                        FILTER node.recordId == ${groupRecord._key}
                        RETURN node
                `,
                ctx
            });
            let groupNode;
            if (!groupNodeFromDb.length) {
                const resInsertAdminGroupNode = await dbService.execute({
                    query: (0, arangojs_1.aql) `
                            INSERT {
                                _key: ${groupRecord._key},
                                libraryId: 'users_groups',
                                recordId: ${groupRecord._key},
                            } IN ${usersGroupsNodeCollec}
                            RETURN NEW
                        `,
                    ctx
                });
                groupNode = resInsertAdminGroupNode[0];
            }
            else {
                groupNode = groupNodeFromDb[0];
            }
            // Insert node in tree
            const usersGroupsEdgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)('users_groups'));
            const edgeFromDb = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR edge IN ${usersGroupsEdgeCollec}
                        FILTER edge._from == ${groupNode._id} AND edge._to == ${groupNode._id}
                        RETURN edge
                `,
                ctx
            });
            if (!edgeFromDb.length) {
                await dbService.execute({
                    query: (0, arangojs_1.aql) `INSERT {
                        _from: 'core_trees/users_groups',
                        _to: ${groupNode._id}
                    } IN ${usersGroupsEdgeCollec}`,
                    ctx
                });
            }
        }
    };
    return {
        async run(ctx) {
            await _createCollections(coreCollections_1.coreCollections, ctx);
            await _createAttributes(systemAttributes_1.systemAttributes, ctx);
            await _createLibraries(systemLibraries_1.systemLibraries, ctx);
            await _createTrees(systemTrees_1.systemTrees, ctx);
            await _createUsersGroups(ctx);
            await _createUsers(ctx);
            await _createApplications(systemApplications_1.systemApplications, ctx);
            // Set permissions on files tree
            const filesTree = (await dbService.execute({
                query: (0, arangojs_1.aql) `
                FOR tree IN core_trees
                    FILTER tree.behavior == 'files'
                    RETURN tree
            `,
                ctx
            }))[0];
            // Define permissions on tree: forbidden for everyone except admin group
            await permissionRepo.savePermission({
                permData: {
                    type: permissions_1.PermissionTypes.TREE,
                    applyTo: filesTree._key,
                    actions: {
                        [permissions_1.TreeNodePermissionsActions.DETACH]: false,
                        [permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN]: false
                    },
                    usersGroup: null,
                    permissionTreeTarget: null
                },
                ctx
            });
            await permissionRepo.savePermission({
                permData: {
                    type: permissions_1.PermissionTypes.TREE,
                    applyTo: filesTree._key,
                    actions: {
                        [permissions_1.TreeNodePermissionsActions.DETACH]: true,
                        [permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN]: true
                    },
                    usersGroup: userGroups_1.filesAdminsGroupId,
                    permissionTreeTarget: null
                },
                ctx
            });
            const treeLibraries = Object.keys(filesTree.libraries);
            for (const treeLibrary of treeLibraries) {
                // Define permissions for each library used in tree: forbidden for everyone except admin group
                await permissionRepo.savePermission({
                    permData: {
                        type: permissions_1.PermissionTypes.TREE_LIBRARY,
                        applyTo: `${filesTree._key}/${treeLibrary}`,
                        actions: {
                            [permissions_1.TreeNodePermissionsActions.DETACH]: false,
                            [permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN]: false
                        },
                        usersGroup: null,
                        permissionTreeTarget: null
                    },
                    ctx
                });
                await permissionRepo.savePermission({
                    permData: {
                        type: permissions_1.PermissionTypes.TREE_LIBRARY,
                        applyTo: `${filesTree._key}/${treeLibrary}`,
                        actions: {
                            [permissions_1.TreeNodePermissionsActions.DETACH]: true,
                            [permissions_1.TreeNodePermissionsActions.EDIT_CHILDREN]: true
                        },
                        usersGroup: userGroups_1.filesAdminsGroupId,
                        permissionTreeTarget: null
                    },
                    ctx
                });
            }
            // Create grid view for files library
            const filesDefaultView = {
                label: { fr: 'Vue mosaique', en: 'Mosaic view' },
                display: { type: views_1.ViewTypes.CARDS, size: views_1.ViewSizes.MEDIUM },
                created_by: ctx.userId,
                created_at: now,
                modified_at: now,
                shared: true,
                library: 'files',
                settings: {},
                filters: [],
                sort: {
                    field: 'id',
                    order: list_1.SortOrder.ASC
                },
                description: null,
                color: null
            };
            const viewsCollec = dbService.db.collection(_types_1.VIEWS_COLLECTION_NAME);
            const createdView = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${filesDefaultView} INTO ${viewsCollec} RETURN NEW`,
                ctx
            });
            const viewId = createdView[0]._key;
            // Set it as default
            const libsCollec = dbService.db.collection(libraryRepo_1.LIB_COLLECTION_NAME);
            await dbService.execute({
                query: (0, arangojs_1.aql) `
                        UPDATE ${{ _key: 'files' }}
                            WITH ${{ defaultView: viewId }}
                            IN ${libsCollec}
                        RETURN NEW`,
                ctx
            });
        }
    };
}
exports.default = default_1;
