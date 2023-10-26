"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibraryFromDbId = exports.getFullNodeId = exports.getRootId = exports.getEdgesCollectionName = exports.getNodesCollectionName = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const treeRepo_1 = require("../treeRepo");
const getNodesCollectionName = (treeId) => treeRepo_1.NODE_COLLEC_PREFIX + treeId;
exports.getNodesCollectionName = getNodesCollectionName;
const getEdgesCollectionName = (treeId) => treeRepo_1.EDGE_COLLEC_PREFIX + treeId;
exports.getEdgesCollectionName = getEdgesCollectionName;
const getRootId = (treeId) => `${treeRepo_1.TREES_COLLECTION_NAME}/${treeId}`;
exports.getRootId = getRootId;
const getFullNodeId = (nodeId, treeId) => `${(0, exports.getNodesCollectionName)(treeId)}/${nodeId}`;
exports.getFullNodeId = getFullNodeId;
const getLibraryFromDbId = (dbId) => dbId.split('/')[0];
exports.getLibraryFromDbId = getLibraryFromDbId;
