"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TO_RECORD_PROP_NAME = exports.MAX_TREE_DEPTH = exports.EDGE_COLLEC_PREFIX = exports.NODE_COLLEC_PREFIX = exports.TREES_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const collection_1 = require("arangojs/collection");
const _types_1 = require("../../infra/db/_types");
const valueRepo_1 = require("../../infra/value/valueRepo");
const utils_1 = require("./helpers/utils");
const _types_2 = require("./_types");
exports.TREES_COLLECTION_NAME = 'core_trees';
exports.NODE_COLLEC_PREFIX = 'core_nodes_';
exports.EDGE_COLLEC_PREFIX = 'core_edge_tree_';
exports.MAX_TREE_DEPTH = 1000;
exports.TO_RECORD_PROP_NAME = 'toRecord';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null } = {}) {
    return {
        async createTree({ treeData, ctx }) {
            const collec = dbService.db.collection(exports.TREES_COLLECTION_NAME);
            const docToInsert = dbUtils.convertToDoc(treeData);
            const treeRes = await dbService.execute({
                query: (0, aql_1.aql) `INSERT ${docToInsert} IN ${collec} RETURN NEW`,
                ctx
            });
            await dbService.createCollection((0, utils_1.getEdgesCollectionName)(treeData.id), collection_1.CollectionType.EDGE_COLLECTION);
            await dbService.createCollection((0, utils_1.getNodesCollectionName)(treeData.id), collection_1.CollectionType.DOCUMENT_COLLECTION);
            const nodesCollection = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeData.id));
            // Add an index on nodes collection
            await nodesCollection.ensureIndex({
                fields: [_types_2.NODE_LIBRARY_ID_FIELD, _types_2.NODE_RECORD_ID_FIELD],
                sparse: true,
                type: 'persistent'
            });
            return dbUtils.cleanup(treeRes.pop());
        },
        async updateTree({ treeData, ctx }) {
            const collec = dbService.db.collection(exports.TREES_COLLECTION_NAME);
            const docToSave = dbUtils.convertToDoc(treeData);
            const treeRes = await dbService.execute({
                query: (0, aql_1.aql) `UPDATE ${docToSave} IN ${collec} OPTIONS { mergeObjects: false } RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(treeRes.pop());
        },
        async getTrees({ params = {}, ctx }) {
            const _generateLibraryFilter = (filterKey, filterVal) => {
                return (0, aql_1.aql) `POSITION(ATTRIBUTES(el.libraries), ${filterVal})`;
            };
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.TREES_COLLECTION_NAME, customFilterConditions: { library: _generateLibraryFilter }, ctx }));
        },
        async deleteTree({ id, ctx }) {
            const collec = dbService.db.collection(exports.TREES_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, aql_1.aql) `REMOVE ${{ _key: id }} IN ${collec} RETURN OLD`,
                ctx
            });
            await dbService.dropCollection((0, utils_1.getEdgesCollectionName)(id), collection_1.CollectionType.EDGE_COLLECTION);
            await dbService.dropCollection((0, utils_1.getNodesCollectionName)(id), collection_1.CollectionType.DOCUMENT_COLLECTION);
            // Return deleted library
            return dbUtils.cleanup(res.pop());
        },
        async addElement({ treeId, element, parent = null, order = 0, ctx }) {
            const destination = parent ? (0, utils_1.getFullNodeId)(parent, treeId) : (0, utils_1.getRootId)(treeId);
            // Create new node entity
            const nodeCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const nodeEntity = (await dbService.execute({
                query: (0, aql_1.aql) `INSERT {
                        ${_types_2.NODE_LIBRARY_ID_FIELD}: ${element.library},
                        ${_types_2.NODE_RECORD_ID_FIELD}: ${element.id}
                    } IN ${nodeCollec} RETURN NEW`,
                ctx
            }))[0];
            const edgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            // Add this entity to the tree
            const res = (await dbService.execute({
                query: (0, aql_1.aql) `INSERT {
                        _from: ${destination},
                        _to: ${nodeEntity._id},
                        order: ${order}
                    } IN ${edgeCollec} RETURN NEW`,
                ctx
            }))[0];
            return {
                id: nodeEntity._key,
                order: res.order
            };
        },
        async moveElement({ treeId, nodeId, parentTo = null, order = 0, ctx }) {
            const destination = parentTo ? (0, utils_1.getFullNodeId)(parentTo, treeId) : (0, utils_1.getRootId)(treeId);
            const elemId = (0, utils_1.getFullNodeId)(nodeId, treeId);
            const edgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const res = (await dbService.execute({
                query: (0, aql_1.aql) `
                    FOR e IN ${edgeCollec}
                        FILTER e._to == ${elemId}
                        UPDATE e WITH {_from: ${destination}, _to: ${elemId}, order: ${order}}
                        IN ${edgeCollec}
                        RETURN NEW
                `,
                ctx
            }))[0];
            return {
                id: nodeId,
                order: res.order
            };
        },
        async deleteElement({ treeId, nodeId, deleteChildren = true, ctx }) {
            const edgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const nodesCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const fullNodeId = (0, utils_1.getFullNodeId)(nodeId, treeId);
            if (deleteChildren) {
                // Remove all element's children
                await dbService.execute({
                    query: (0, aql_1.aql) `
                        LET edges = (
                            FOR v, e IN 0..${exports.MAX_TREE_DEPTH} OUTBOUND ${fullNodeId}
                            ${edgeCollec}
                            RETURN e
                        )
                        FOR ed IN edges
                            FILTER ed != null
                            REMOVE ed IN ${edgeCollec}
                            RETURN OLD
                    `,
                    ctx
                });
            }
            else {
                const parentId = (await dbService.execute({
                    query: (0, aql_1.aql) `
                        FOR v IN 1 INBOUND ${fullNodeId}
                        ${edgeCollec}
                        RETURN v._id
                    `,
                    ctx
                }))[0];
                const children = await dbService.execute({
                    query: (0, aql_1.aql) `
                        FOR v IN 1 OUTBOUND ${fullNodeId}
                        ${edgeCollec}
                        RETURN v
                    `,
                    ctx
                });
                // Move children to element's parent
                await Promise.all(children.map(child => {
                    return this.moveElement({
                        treeId,
                        nodeId: child._key,
                        parentTo: parentId,
                        ctx
                    });
                }));
            }
            // Remove element from its parent and link to record
            await dbService.execute({
                query: (0, aql_1.aql) `
                    FOR e IN ${edgeCollec}
                        FILTER e._to == ${fullNodeId} OR e._from == ${fullNodeId}
                        REMOVE e IN ${edgeCollec}
                        RETURN OLD
                `,
                ctx
            });
            // Remove node entity
            const removedEntity = (await dbService.execute({
                query: (0, aql_1.aql) `REMOVE {_id: ${fullNodeId}, _key: ${nodeId}} IN ${nodesCollec} RETURN OLD`,
                ctx
            }))[0];
            return { id: removedEntity._key };
        },
        async isNodePresent({ treeId, nodeId, ctx }) {
            const collec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const elemId = (0, utils_1.getFullNodeId)(nodeId, treeId);
            const query = (0, aql_1.aql) `
                FOR e IN ${collec}
                    FILTER e._to == ${elemId}
                    RETURN e
            `;
            const res = await dbService.execute({ query, ctx });
            return !!res.length;
        },
        async isRecordPresent({ treeId, record, ctx }) {
            const collec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const elementId = `${record.library}/${record.id}`;
            const query = (0, aql_1.aql) `
                FOR n IN ${collec}
                    FILTER n.${(0, aql_1.literal)(_types_2.NODE_LIBRARY_ID_FIELD)} == ${record.library}
                        AND n.${(0, aql_1.literal)(_types_2.NODE_RECORD_ID_FIELD)} == ${record.id}
                    RETURN n
            `;
            const res = await dbService.execute({ query, ctx });
            return !!res.length;
        },
        async getTreeContent({ treeId, startingNode, depth = exports.MAX_TREE_DEPTH, childrenCount = false, ctx }) {
            var _a;
            const rootId = (0, utils_1.getRootId)(treeId);
            const collec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const nodeFrom = startingNode ? (0, utils_1.getFullNodeId)(startingNode, treeId) : rootId;
            const nodeFromKey = startingNode !== null && startingNode !== void 0 ? startingNode : rootId.split('/')[1];
            /**
             * This query return a list of all records present in the tree with their path IDs
             * from the root. Query is made depth-first
             *
             * The order we need is defined between the node and its parent.
             * Thus, we have to retrieve it on the before-last edge of the path to the record
             */
            const queryParts = [
                (0, aql_1.aql) `
                    FOR v, e, p IN 1..${depth} OUTBOUND ${nodeFrom}
                    ${collec}
                    LET record = DOCUMENT(v.${_types_2.NODE_LIBRARY_ID_FIELD}, v.${_types_2.NODE_RECORD_ID_FIELD})
                    LET path = (
                        FOR pv IN p.vertices
                        FILTER pv._id != v._id
                        RETURN pv._key
                    )
                    LET nodeOrder = TO_NUMBER(p.edges[-1].order)
                `
            ];
            if (childrenCount) {
                queryParts.push((0, aql_1.aql) `
                    LET childrenCount = COUNT(
                        FOR vChildren IN 1 outbound v
                        ${collec}
                        return vChildren
                    )
                `);
            }
            queryParts.push((0, aql_1.aql) `
                SORT LENGTH(path), nodeOrder ASC
                RETURN {
                    id: v._key,
                    record: MERGE(record, {path}),
                    order: nodeOrder,
                    ${(0, aql_1.literal)(childrenCount ? 'childrenCount' : '')}
                }
            `);
            const data = await dbService.execute({
                query: (0, aql_1.join)(queryParts),
                ctx
            });
            /**
             * Process query result to transform it to a proper tree structure
             * For each record of the tree, we run through its path to find out where is its parent
             * in the tree.
             * Then we can add it to its parent children.
             */
            const treeContent = [];
            for (const elem of data) {
                /** Determine where is the parent in the tree */
                let parentInTree = treeContent;
                for (const pathPart of elem.record.path) {
                    // Root's first level children will be directly added to the tree
                    if (pathPart === nodeFromKey) {
                        parentInTree = treeContent;
                    }
                    else {
                        // If previous parent was the tree root, there's no 'children'
                        const container = parentInTree === treeContent ? parentInTree : parentInTree.children;
                        // Look for the path to follow among all nodes
                        parentInTree = container.find(el => el.id === pathPart);
                    }
                }
                /** Add element to its parent */
                delete elem.record.path;
                elem.record.library = (0, utils_1.getLibraryFromDbId)(elem.record._id);
                // If destination is the tree root, there's no 'children'
                const destination = parentInTree === treeContent ? parentInTree : parentInTree.children;
                const treeNode = {
                    id: elem.id,
                    order: elem.order,
                    record: dbUtils.cleanup(elem.record),
                    children: []
                };
                if (childrenCount) {
                    treeNode.childrenCount = (_a = elem.childrenCount) !== null && _a !== void 0 ? _a : 0;
                }
                destination.push(treeNode);
            }
            return treeContent;
        },
        async getElementChildren({ treeId, nodeId, childrenCount = false, withTotalCount, pagination, ctx }) {
            const rootId = (0, utils_1.getRootId)(treeId);
            const nodeFrom = nodeId ? (0, utils_1.getFullNodeId)(nodeId, treeId) : rootId;
            const hasPagination = typeof (pagination === null || pagination === void 0 ? void 0 : pagination.offset) !== 'undefined' && typeof (pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== 'undefined';
            const treeEdgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const childrenCountQuery = (0, aql_1.aql) `
                LET childrenCount = COUNT(
                    FOR vChildren IN 1 OUTBOUND v
                    ${treeEdgeCollec}
                    RETURN vChildren
                )
            `;
            // Fetch children. For each child, retrieve linked record
            const query = (0, aql_1.aql) `
                FOR v, e, p IN 1 OUTBOUND ${nodeFrom}
                    ${treeEdgeCollec}
                    LET order = TO_NUMBER(p.edges[0].order)
                    LET key = p.edges[0]._key
                    SORT order ASC, key ASC
                    ${hasPagination ? (0, aql_1.aql) `LIMIT ${pagination.offset}, ${pagination.limit}` : (0, aql_1.literal)('')}

                    ${childrenCount ? childrenCountQuery : (0, aql_1.aql) ``}

                    LET record = DOCUMENT(v.${_types_2.NODE_LIBRARY_ID_FIELD}, v.${_types_2.NODE_RECORD_ID_FIELD})

                    RETURN {
                        id: v._key,
                        order,
                        ${childrenCount ? (0, aql_1.literal)('childrenCount,') : (0, aql_1.aql) ``}
                        record
                    }
            `;
            const res = await dbService.execute({
                query,
                withTotalCount,
                ctx
            });
            const list = (0, _types_1.isExecuteWithCount)(res) ? res.results : res;
            return {
                totalCount: (0, _types_1.isExecuteWithCount)(res) ? res.totalCount : null,
                list: list.map(elem => {
                    var _a;
                    elem.record.library = (0, utils_1.getLibraryFromDbId)(elem.record._id);
                    return {
                        id: elem.id,
                        order: elem.order,
                        record: dbUtils.cleanup(elem.record),
                        childrenCount: (_a = elem.childrenCount) !== null && _a !== void 0 ? _a : null
                    };
                })
            };
        },
        async getElementAncestors({ treeId, nodeId, ctx }) {
            if (!nodeId) {
                return [];
            }
            const treeEdgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(treeId));
            const query = (0, aql_1.aql) `
                FOR v,e,p IN 0..${exports.MAX_TREE_DEPTH} INBOUND ${(0, utils_1.getFullNodeId)(nodeId, treeId)}
                    ${treeEdgeCollec}
                    FILTER v._id != ${(0, utils_1.getRootId)(treeId)}
                    LET record = DOCUMENT(v.${_types_2.NODE_LIBRARY_ID_FIELD}, v.${_types_2.NODE_RECORD_ID_FIELD})
                    RETURN {id: v._key, order: TO_NUMBER(e.order), record}
            `;
            const res = await dbService.execute({ query, ctx });
            const cleanResult = res.reverse().map(elem => {
                var _a;
                elem.record.library = ((_a = elem.record) === null || _a === void 0 ? void 0 : _a._id) ? (0, utils_1.getLibraryFromDbId)(elem.record._id) : null;
                return { id: elem.id, order: elem.order, record: dbUtils.cleanup(elem.record) };
            });
            return cleanResult;
        },
        async getLinkedRecords({ treeId, attribute, nodeId, ctx }) {
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const query = (0, aql_1.aql) `
                FOR v,e,p
                    IN 1 INBOUND ${(0, utils_1.getFullNodeId)(nodeId, treeId)}
                    ${edgeCollec}
                    FILTER e.attribute == ${attribute}
                    RETURN v
            `;
            const res = await dbService.execute({ query, ctx });
            return res.map(elem => {
                elem.library = (0, utils_1.getLibraryFromDbId)(elem._id);
                return dbUtils.cleanup(elem);
            });
        },
        async getRecordByNodeId({ treeId, nodeId, ctx }) {
            const nodesCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const query = (0, aql_1.aql) `
                FOR n IN ${nodesCollec}
                    FILTER n._key == ${nodeId}
                    LET record = DOCUMENT(n.${_types_2.NODE_LIBRARY_ID_FIELD}, n.${_types_2.NODE_RECORD_ID_FIELD})
                    RETURN record
            `;
            const queryRes = await dbService.execute({ query, ctx });
            const recordDoc = queryRes[0];
            if (!recordDoc) {
                return null;
            }
            recordDoc.library = (0, utils_1.getLibraryFromDbId)(recordDoc._id);
            return dbUtils.cleanup(recordDoc);
        },
        async getNodesByRecord({ treeId, record, ctx }) {
            const nodesCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const query = (0, aql_1.aql) `
                FOR n IN ${nodesCollec}
                    FILTER n.${_types_2.NODE_LIBRARY_ID_FIELD} == ${record.library} && n.${_types_2.NODE_RECORD_ID_FIELD} == ${record.id}
                    RETURN n._key
            `;
            const nodes = await dbService.execute({ query, ctx });
            return nodes;
        },
        async getNodesByLibrary({ treeId, libraryId, ctx }) {
            const nodesCollec = dbService.db.collection((0, utils_1.getNodesCollectionName)(treeId));
            const query = (0, aql_1.aql) `
                FOR n IN ${nodesCollec}
                    FILTER n.${_types_2.NODE_LIBRARY_ID_FIELD} == ${libraryId}
                    RETURN n._key
            `;
            const nodes = await dbService.execute({ query, ctx });
            return nodes;
        }
    };
}
exports.default = default_1;
