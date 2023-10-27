"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const utils_1 = require("../../infra/tree/helpers/utils");
const _types_1 = require("../../infra/tree/_types");
const valueRepo_1 = require("../../infra/value/valueRepo");
const attribute_1 = require("../../_types/attribute");
const attributeTypesRepo_1 = require("./attributeTypesRepo");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.filterTypes': filterTypes = null, 'core.utils': utils = null } = {}) {
    const _buildTreeValue = (treeId, nodeId, linkedRecord, valueEdge) => {
        var _a;
        return {
            id_value: valueEdge._key,
            value: linkedRecord && nodeId
                ? {
                    id: nodeId,
                    record: linkedRecord
                }
                : null,
            attribute: valueEdge.attribute,
            modified_at: valueEdge.modified_at,
            modified_by: valueEdge.modified_by,
            created_at: valueEdge.created_at,
            created_by: valueEdge.created_by,
            version: (_a = valueEdge.version) !== null && _a !== void 0 ? _a : null,
            metadata: valueEdge.metadata,
            treeId
        };
    };
    function _getExtendedFilterPart(attributes, linkedValue) {
        return (0, aql_1.aql) `${attributes
            .map(a => a.id)
            .slice(2)
            .reduce((acc, value, i) => {
            acc.push((0, aql_1.aql) `TRANSLATE(${value}, ${i ? acc[acc.length - 1] : (0, aql_1.aql) `${linkedValue}`})`);
            if (i) {
                acc.shift();
            }
            return acc;
        }, [])[0]}`;
    }
    return {
        async createValue({ library, recordId, attribute, value, ctx }) {
            var _a;
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Create the link between records and add some metadata on it
            const edgeData = {
                _from: library + '/' + recordId,
                _to: (0, utils_1.getFullNodeId)(value.value, attribute.linked_tree),
                attribute: attribute.id,
                modified_at: value.modified_at,
                created_at: value.created_at,
                created_by: String(ctx.userId),
                modified_by: String(ctx.userId),
                version: (_a = value.version) !== null && _a !== void 0 ? _a : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const { id: nodeId, library: nodeCollection } = utils.decomposeValueEdgeDestination(edgeData._to);
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    LET linkedNode = DOCUMENT(${nodeCollection}, ${nodeId})
                    LET linkedRecord = DOCUMENT(linkedNode.libraryId, linkedNode.recordId)
                    INSERT ${edgeData} IN ${edgeCollec}
                    RETURN {newEdge: NEW, linkedRecord}
                `,
                ctx
            });
            if (!resEdge.length) {
                return null;
            }
            const savedValue = resEdge[0];
            return _buildTreeValue(attribute.linked_tree, nodeId, dbUtils.cleanup(savedValue.linkedRecord), savedValue.newEdge);
        },
        async updateValue({ library, recordId, attribute, value, ctx }) {
            var _a;
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Update value's metadata on records link
            const edgeData = {
                _from: library + '/' + recordId,
                _to: (0, utils_1.getFullNodeId)(value.value, attribute.linked_tree),
                attribute: attribute.id,
                modified_at: value.modified_at,
                created_by: value.created_by,
                modified_by: String(ctx.userId),
                version: (_a = value.version) !== null && _a !== void 0 ? _a : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const { id: nodeId, library: nodeCollection } = utils.decomposeValueEdgeDestination(edgeData._to);
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    LET linkedNode = DOCUMENT(${nodeCollection}, ${nodeId})
                    LET linkedRecord = DOCUMENT(linkedNode.libraryId, linkedNode.recordId)
                    UPDATE ${{ _key: String(value.id_value) }} WITH ${edgeData} IN ${edgeCollec}
                    RETURN {newEdge: NEW, linkedRecord}
                `,
                ctx
            });
            if (!resEdge.length) {
                return null;
            }
            const savedValue = resEdge[0];
            return _buildTreeValue(attribute.linked_tree, nodeId, dbUtils.cleanup(savedValue.linkedRecord), savedValue.newEdge);
        },
        async deleteValue({ attribute, value, library, recordId, ctx }) {
            var _a;
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    FOR linkedNode, edge IN 1 OUTBOUND ${library + '/' + recordId}
                        ${edgeCollec}
                        FILTER edge._key == ${value.id_value}
                        LET linkedRecord = DOCUMENT(linkedNode.libraryId, linkedNode.recordId)
                        REMOVE edge IN ${edgeCollec}
                        RETURN {edge: OLD, linkedRecord}
                `,
                ctx
            });
            const deletedValue = (_a = resEdge === null || resEdge === void 0 ? void 0 : resEdge[0]) !== null && _a !== void 0 ? _a : null;
            if (!deletedValue) {
                return null;
            }
            const { id: nodeId } = utils.decomposeValueEdgeDestination(deletedValue.edge._to);
            return _buildTreeValue(attribute.linked_tree, nodeId, dbUtils.cleanup(deletedValue.linkedRecord), deletedValue.edge);
        },
        async getValues({ library, recordId, attribute, forceGetAllValues = false, options, ctx }) {
            if (!attribute.linked_tree) {
                return [];
            }
            const valuesLinksCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const treeEdgeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(attribute.linked_tree));
            const queryParts = [
                (0, aql_1.aql) `FOR vertex, edge IN 1 OUTBOUND ${library + '/' + recordId}
                    ${valuesLinksCollec}, ${treeEdgeCollec}
                    LET record = DOCUMENT(
                        vertex.${(0, aql_1.literal)(_types_1.NODE_LIBRARY_ID_FIELD)},
                        vertex.${(0, aql_1.literal)(_types_1.NODE_RECORD_ID_FIELD)}
                    )
                    FILTER edge.attribute == ${attribute.id}
                `
            ];
            if (!forceGetAllValues && typeof options !== 'undefined' && options.version) {
                queryParts.push((0, aql_1.aql) `FILTER edge.version == ${options.version}`);
            }
            const limitOne = (0, aql_1.literal)(!attribute.multiple_values && !forceGetAllValues ? 'LIMIT 1' : '');
            queryParts.push((0, aql_1.aql) `
                ${limitOne}
                RETURN {id: vertex._key, record, edge}
            `);
            const query = (0, aql_1.join)(queryParts);
            const treeElements = await dbService.execute({ query, ctx });
            return treeElements.reduce((acc, r) => {
                var _a;
                if (!r.record) {
                    return acc;
                }
                const record = Object.assign(Object.assign({}, r.record), { library: (_a = r === null || r === void 0 ? void 0 : r.record) === null || _a === void 0 ? void 0 : _a._id.split('/')[0] });
                acc.push(_buildTreeValue(attribute.linked_tree, r.id, dbUtils.cleanup(record), r.edge));
                return acc;
            }, []);
        },
        async getValueById({ library, recordId, attribute, valueId, ctx }) {
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const query = (0, aql_1.aql) `
                FOR linkedNode, edge IN 1 OUTBOUND ${library + '/' + recordId}
                    ${edgeCollec}
                    FILTER edge._key == ${valueId}
                    FILTER edge.attribute == ${attribute.id}
                    LET linkedRecord = DOCUMENT(linkedNode.libraryId, linkedNode.recordId)
                    LIMIT 1
                    RETURN {linkedNode, edge, linkedRecord}
            `;
            const res = await dbService.execute({ query, ctx });
            if (!res.length) {
                return null;
            }
            return _buildTreeValue(attribute.linked_tree, res[0].linkedNode._key, dbUtils.cleanup(res[0].linkedRecord), res[0].edge);
        },
        sortQueryPart({ attributes, order }) {
            const valuesLinksCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const treeCollec = dbService.db.collection((0, utils_1.getEdgesCollectionName)(attributes[0].linked_tree));
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const linkedValue = (0, aql_1.aql) `FIRST(
                FOR v, e IN 1 OUTBOUND r._id
                ${valuesLinksCollec}, ${treeCollec}
                FILTER e.attribute == ${attributes[0].id}
                LET record = DOCUMENT(
                    v.${(0, aql_1.literal)(_types_1.NODE_LIBRARY_ID_FIELD)},
                    v.${(0, aql_1.literal)(_types_1.NODE_RECORD_ID_FIELD)}
                )
                RETURN record.${linked.id}
            )`;
            const query = linked.format !== attribute_1.AttributeFormats.EXTENDED
                ? (0, aql_1.aql) `SORT ${linkedValue} ${order}`
                : (0, aql_1.aql) `SORT ${_getExtendedFilterPart(attributes, linkedValue)} ${order}`;
            return query;
        },
        filterValueQueryPart(attributes, filter, parentIdentifier = attributeTypesRepo_1.BASE_QUERY_IDENTIFIER) {
            const valuesLinksCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const isCountFilter = filterTypes.isCountFilter(filter);
            const linkIdentifier = parentIdentifier + 'v';
            const vIdentifier = (0, aql_1.literal)(linkIdentifier);
            if (isCountFilter) {
                // In "count" filters, we don't need to retrieve the actual value, we just need to know how many links we have
                // Thus, using a "join" query on the edge collection is more efficient than using a traversal
                return (0, aql_1.aql) `
                COUNT(
                    FOR ${vIdentifier} IN ${valuesLinksCollec}
                    FILTER ${vIdentifier}._from == ${(0, aql_1.literal)(parentIdentifier)}._id
                    AND ${vIdentifier}.attribute == ${attributes[0].id}
                    RETURN true
                    )
                    `;
            }
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const linkValueIdentifier = (0, aql_1.literal)(`${parentIdentifier}linkVal`);
            const recordIdentifierStr = parentIdentifier + 'Record';
            const recordIdentifier = (0, aql_1.literal)(recordIdentifierStr);
            const eIdentifier = (0, aql_1.literal)(parentIdentifier + 'e');
            const returnValue = (0, aql_1.aql) `RETURN ${linkValueIdentifier}`;
            const retrieveValue = (0, aql_1.aql) `
                FOR ${vIdentifier}, ${eIdentifier} IN 1 OUTBOUND ${(0, aql_1.literal)(parentIdentifier)}._id
                    ${valuesLinksCollec}
                    FILTER ${eIdentifier}.attribute == ${attributes[0].id}
                    LET ${recordIdentifier} = DOCUMENT(
                        ${vIdentifier}.${(0, aql_1.literal)(_types_1.NODE_LIBRARY_ID_FIELD)},
                        ${vIdentifier}.${(0, aql_1.literal)(_types_1.NODE_RECORD_ID_FIELD)}
                        )
                        `;
            const linkValueQuery = attributes[1]
                ? (0, aql_1.aql) `LET ${(0, aql_1.literal)(linkValueIdentifier)} = (${attributes[1]._repo.filterValueQueryPart([...attributes].splice(1), filter, recordIdentifierStr)})`
                : null;
            const linkedValue = (0, aql_1.join)([(0, aql_1.literal)('FLATTEN('), retrieveValue, linkValueQuery, returnValue, (0, aql_1.literal)(')')]);
            return linked.format !== attribute_1.AttributeFormats.EXTENDED
                ? linkedValue
                : _getExtendedFilterPart(attributes, linkedValue);
        },
        async clearAllValues({ attribute, ctx }) {
            return true;
        }
    };
}
exports.default = default_1;
