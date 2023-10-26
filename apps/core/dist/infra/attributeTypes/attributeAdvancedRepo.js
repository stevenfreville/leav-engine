"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const valueRepo_1 = require("../../infra/value/valueRepo");
const attribute_1 = require("../../_types/attribute");
const attributeTypesRepo_1 = require("./attributeTypesRepo");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.filterTypes': filterTypesHelper = null } = {}) {
    function _getExtendedFilterPart(attributes, advancedValue) {
        return (0, aql_1.aql) `${attributes
            .map(a => a.id)
            .slice(1)
            .reduce((acc, value, i) => {
            acc.push((0, aql_1.aql) `TRANSLATE(${value}, ${i ? acc[acc.length - 1] : (0, aql_1.aql) `${advancedValue}`})`);
            if (i) {
                acc.shift();
            }
            return acc;
        }, [])[0]}`;
    }
    return {
        async createValue({ library, recordId, attribute, value, ctx }) {
            var _a, _b;
            const valCollec = dbService.db.collection(valueRepo_1.VALUES_COLLECTION);
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Create new value entity
            const valueData = {
                value: value.value
            };
            const resVal = await dbService.execute({
                query: (0, aql_1.aql) `
                    INSERT ${valueData}
                    IN ${valCollec}
                    RETURN NEW`,
                ctx
            });
            const savedVal = resVal.length ? resVal[0] : {};
            // Create the link record<->value and add some metadata on it
            const edgeData = {
                _from: library + '/' + recordId,
                _to: savedVal._id,
                attribute: attribute.id,
                modified_at: value.modified_at,
                created_at: value.created_at,
                modified_by: String(ctx.userId),
                created_by: String(ctx.userId),
                version: (_a = value.version) !== null && _a !== void 0 ? _a : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    INSERT ${edgeData}
                    IN ${edgeCollec}
                    RETURN NEW`,
                ctx
            });
            const savedEdge = resEdge.length ? resEdge[0] : {};
            const res = {
                id_value: savedVal._key,
                value: savedVal.value,
                attribute: savedEdge.attribute,
                modified_at: savedEdge.modified_at,
                created_at: savedEdge.created_at,
                modified_by: savedEdge.modified_by,
                created_by: savedEdge.created_by,
                metadata: savedEdge.metadata,
                version: (_b = savedEdge.version) !== null && _b !== void 0 ? _b : null
            };
            return res;
        },
        async updateValue({ library, recordId, attribute, value, ctx }) {
            var _a, _b;
            const valCollec = dbService.db.collection(valueRepo_1.VALUES_COLLECTION);
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Save value entity
            const valueData = {
                value: value.value
            };
            const resVal = await dbService.execute({
                query: (0, aql_1.aql) `
                    UPDATE ${{ _key: value.id_value }}
                    WITH ${valueData}
                    IN ${valCollec}
                    RETURN NEW`,
                ctx
            });
            const savedVal = resVal.length ? resVal[0] : {};
            // Update value's metadata on record<->value link
            const edgeFrom = library + '/' + recordId;
            const edgeTo = savedVal._id;
            const edgeData = {
                _from: edgeFrom,
                _to: edgeTo,
                attribute: attribute.id,
                modified_at: value.modified_at,
                created_at: value.created_at,
                modified_by: String(ctx.userId),
                created_by: value.created_by,
                version: (_a = value.version) !== null && _a !== void 0 ? _a : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    FOR e IN ${edgeCollec}
                    FILTER e._from == ${edgeFrom} AND e._to == ${edgeTo}
                    UPDATE e
                        WITH ${edgeData}
                        IN ${edgeCollec}
                    RETURN NEW`,
                ctx
            });
            const savedEdge = resEdge.length ? resEdge[0] : {};
            const res = {
                id_value: savedVal._key,
                value: savedVal.value,
                attribute: savedEdge.attribute,
                modified_at: savedEdge.modified_at,
                created_at: savedEdge.created_at,
                modified_by: savedEdge.modified_by,
                created_by: savedEdge.created_by,
                metadata: savedEdge.metadata,
                version: (_b = savedEdge.version) !== null && _b !== void 0 ? _b : null
            };
            return res;
        },
        async deleteValue({ library, recordId, attribute, value, ctx }) {
            const valCollec = dbService.db.collection(valueRepo_1.VALUES_COLLECTION);
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const deletedVal = await valCollec.remove({ _key: String(value.id_value) });
            // Delete the link record<->value and add some metadata on it
            const edgeData = {
                _from: library + '/' + recordId,
                _to: deletedVal._id
            };
            const deletedEdge = await edgeCollec.removeByExample(edgeData);
            return {
                id_value: deletedVal._key,
                attribute: deletedEdge.attribute,
                modified_at: deletedEdge.modified_at,
                created_at: deletedEdge.created_at,
                modified_by: deletedEdge.modified_by,
                created_by: deletedEdge.created_by
            };
        },
        async getValues({ library, recordId, attribute, forceGetAllValues = false, options, ctx }) {
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const queryParts = [
                (0, aql_1.aql) `
                FOR value, edge
                IN 1 OUTBOUND ${library + '/' + recordId}
                ${edgeCollec}
                FILTER edge.attribute == ${attribute.id}
                `
            ];
            if (!forceGetAllValues && typeof options !== 'undefined' && options.version) {
                queryParts.push((0, aql_1.aql) `FILTER edge.version == ${options.version}`);
            }
            const limitOne = (0, aql_1.literal)(!attribute.multiple_values && !forceGetAllValues ? 'LIMIT 1' : '');
            queryParts.push((0, aql_1.aql) `
                ${limitOne}
                RETURN {value, edge}
            `);
            const query = (0, aql_1.join)(queryParts);
            const res = await dbService.execute({ query, ctx });
            return res.map(r => {
                var _a;
                return ({
                    id_value: r.value._key,
                    value: r.value.value,
                    attribute: r.edge.attribute,
                    modified_at: r.edge.modified_at,
                    created_at: r.edge.created_at,
                    modified_by: r.edge.modified_by,
                    created_by: r.edge.created_by,
                    metadata: r.edge.metadata,
                    version: (_a = r.edge.version) !== null && _a !== void 0 ? _a : null
                });
            });
        },
        async getValueById({ library, recordId, attribute, valueId, ctx }) {
            const valCollec = dbService.db.collection(valueRepo_1.VALUES_COLLECTION);
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const query = (0, aql_1.aql) `
                LET value = FIRST(FOR v IN ${valCollec}
                    FILTER v._key == ${valueId}
                RETURN v)

                FOR e IN ${edgeCollec}
                    FILTER e._to == value._id
                RETURN MERGE(e, {value: value.value})
            `;
            const valueLinks = await dbService.execute({ query, ctx });
            if (!valueLinks.length) {
                return null;
            }
            return {
                id_value: valueId,
                value: valueLinks[0].value,
                attribute: valueLinks[0].attribute,
                modified_at: valueLinks[0].modified_at,
                created_at: valueLinks[0].created_at,
                modified_by: valueLinks[0].modified_by,
                created_by: valueLinks[0].created_by
            };
        },
        sortQueryPart({ attributes, order }) {
            const collec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const advancedValue = (0, aql_1.aql) `FIRST(
                FOR v, e IN 1 OUTBOUND r._id
                ${collec}
                FILTER e.attribute == ${attributes[0].id} RETURN v.value
            )`;
            const query = attributes[0].format === attribute_1.AttributeFormats.EXTENDED && attributes.length > 1
                ? (0, aql_1.aql) `SORT ${_getExtendedFilterPart(attributes, advancedValue)} ${order}`
                : (0, aql_1.aql) `SORT ${advancedValue} ${order}`;
            return query;
        },
        filterValueQueryPart(attributes, filter, parentIdentifier = attributeTypesRepo_1.BASE_QUERY_IDENTIFIER) {
            const vIdentifier = (0, aql_1.literal)(parentIdentifier + 'v');
            const eIdentifier = (0, aql_1.literal)(parentIdentifier + 'e');
            const collec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const retrieveValues = (0, aql_1.aql) `
                FOR ${vIdentifier}, ${eIdentifier} IN 1 OUTBOUND ${(0, aql_1.literal)(parentIdentifier)}._id
                    ${collec}
                    FILTER ${eIdentifier}.attribute == ${attributes[0].id}
                    RETURN ${vIdentifier}.value
            `;
            let advancedValue;
            if (attributes[0].format === attribute_1.AttributeFormats.EXTENDED && attributes.length > 1) {
                advancedValue = _getExtendedFilterPart(attributes, retrieveValues);
            }
            else {
                advancedValue = retrieveValues;
            }
            return filterTypesHelper.isCountFilter(filter) ? (0, aql_1.aql) `COUNT(${advancedValue})` : advancedValue;
        },
        async clearAllValues({ attribute, ctx }) {
            return true;
        }
    };
}
exports.default = default_1;
