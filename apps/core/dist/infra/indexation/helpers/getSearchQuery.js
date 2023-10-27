"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aql_1 = require("arangojs/aql");
const indexationService_1 = require("../indexationService");
function default_1() {
    return (libraryId, fields, search, sort) => {
        if (!fields.length) {
            return (0, aql_1.aql) `[]`;
        }
        const queryParts = [(0, aql_1.aql) `FOR doc IN ${(0, aql_1.literal)(`${indexationService_1.CORE_INDEX_VIEW}_${libraryId}`)} SEARCH`];
        for (const [i, field] of fields.entries()) {
            queryParts.push((0, aql_1.aql) `ANALYZER(TOKENS(${search}, ${indexationService_1.CORE_INDEX_INPUT_ANALYZER}) ALL IN doc.${indexationService_1.CORE_INDEX_FIELD}.${field}, ${indexationService_1.CORE_INDEX_ANALYZER})`);
            if (i < fields.length - 1) {
                queryParts.push((0, aql_1.aql) `OR`);
            }
        }
        // If no specific sort is provided, we sort by relevance and then by _key
        if (!sort) {
            queryParts.push((0, aql_1.aql) `SORT BM25(doc) DESC, TO_NUMBER(doc._key) DESC`);
        }
        queryParts.push((0, aql_1.aql) `RETURN MERGE(doc, {${indexationService_1.CORE_INDEX_FIELD}: doc.${indexationService_1.CORE_INDEX_FIELD}})`);
        return (0, aql_1.join)(queryParts, '\n');
    };
}
exports.default = default_1;
