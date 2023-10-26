"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const aql_1 = require("arangojs/aql");
const utils_1 = require("../../../infra/tree/helpers/utils");
const treeRepo_1 = require("../../../infra/tree/treeRepo");
const _types_1 = require("../../../infra/tree/_types");
function default_1({ 'core.infra.record.helpers.filterTypes': filterTypesHelper = null, 'core.infra.db.dbService': dbService = null }) {
    return filter => {
        if (!filterTypesHelper.isClassifyingFilter(filter)) {
            return null;
        }
        const collec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(filter.treeId));
        const startingNode = filter.value
            ? (0, utils_1.getFullNodeId)(String(filter.value), filter.treeId)
            : (0, utils_1.getRootId)(filter.treeId);
        const queryPart = (0, arangojs_1.aql) `
            FOR v, e IN 1..${treeRepo_1.MAX_TREE_DEPTH} OUTBOUND ${startingNode}
                ${collec}
                LET record = DOCUMENT(
                    v.${(0, aql_1.literal)(_types_1.NODE_LIBRARY_ID_FIELD)},
                    v.${(0, aql_1.literal)(_types_1.NODE_RECORD_ID_FIELD)}
                )
                RETURN record._id
        `;
        return queryPart;
    };
}
exports.default = default_1;
