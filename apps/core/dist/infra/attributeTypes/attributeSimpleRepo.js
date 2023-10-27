"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const attribute_1 = require("../../_types/attribute");
const attributeRepo_1 = require("../attribute/attributeRepo");
const libraryRepo_1 = require("../library/libraryRepo");
const attributeTypesRepo_1 = require("./attributeTypesRepo");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.filterTypes': filterTypesHelper = null } = {}) {
    async function _saveValue(library, recordId, attribute, value, ctx) {
        const collec = dbService.db.collection(library);
        const res = await dbService.execute({
            query: (0, aql_1.aql) `
                UPDATE ${{ _key: recordId }}
                WITH ${{ [attribute.id]: value.value }}
                IN ${collec}
                OPTIONS { keepNull: false }
                RETURN NEW`,
            ctx
        });
        const updatedDoc = res.length ? res[0] : {};
        return {
            value: typeof updatedDoc[attribute.id] !== 'undefined' ? updatedDoc[attribute.id] : null,
            created_by: null,
            modified_by: null
        };
    }
    function _getExtendedFilterPart(attributes) {
        return (0, aql_1.aql) `${attributes
            .map(a => a.id)
            .reduce((acc, value, i) => {
            acc.push((0, aql_1.aql) `TRANSLATE(${value}, ${i ? acc[acc.length - 1] : (0, aql_1.aql) `r`})`);
            if (i) {
                acc.shift();
            }
            return acc;
        }, [])[0]}`;
    }
    return {
        async createValue({ library, recordId, attribute, value, ctx }) {
            return _saveValue(library, recordId, attribute, value, ctx);
        },
        async updateValue({ library, recordId, attribute, value, ctx }) {
            return _saveValue(library, recordId, attribute, value, ctx);
        },
        async deleteValue({ library, recordId, attribute, value, ctx }) {
            return _saveValue(library, recordId, attribute, Object.assign(Object.assign({}, value), { value: null }), ctx);
        },
        async isValueUnique({ library, recordId, attribute, value, ctx }) {
            const query = (0, aql_1.aql) `
                FOR r IN ${dbService.db.collection(library)} 
                    FILTER r._key != ${recordId} && r.${attribute.id} == ${value.value}
                    RETURN r._key
            `;
            const res = await dbService.execute({ query, ctx });
            return !res.length;
        },
        async getValues({ library, recordId, attribute, ctx }) {
            const query = (0, aql_1.aql) `
                FOR r IN ${dbService.db.collection(library)}
                    FILTER r._key == ${String(recordId)}
                    RETURN r.${attribute.id}
            `;
            const res = await dbService.execute({ query, ctx });
            return [
                {
                    value: res[0],
                    attribute: attribute.id,
                    modified_by: null,
                    created_by: null
                }
            ];
        },
        sortQueryPart({ attributes, order }) {
            attributes[0].id = attributes[0].id === 'id' ? '_key' : attributes[0].id;
            const query = attributes[0].format === attribute_1.AttributeFormats.EXTENDED && attributes.length > 1
                ? (0, aql_1.aql) `SORT ${_getExtendedFilterPart(attributes)} ${order}`
                : (0, aql_1.aql) `SORT r.${attributes[0].id} ${order}`;
            return query;
        },
        filterValueQueryPart(attributes, filter, parentIdentifier = attributeTypesRepo_1.BASE_QUERY_IDENTIFIER) {
            let recordValue;
            if (attributes[0].format === attribute_1.AttributeFormats.EXTENDED && attributes.length > 1) {
                recordValue = _getExtendedFilterPart(attributes);
            }
            else {
                const attributeId = attributes[0].id === 'id' ? '_key' : attributes[0].id;
                recordValue = (0, aql_1.aql) `${(0, aql_1.literal)(parentIdentifier)}.${attributeId}`;
            }
            return filterTypesHelper.isCountFilter(filter) ? (0, aql_1.aql) `COUNT(${recordValue}) ? 1 : 0` : recordValue;
        },
        async clearAllValues({ attribute, ctx }) {
            const libAttribCollec = dbService.db.collection(libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME);
            // TODO: use aql template tag, and find out why it doesn't work :)
            const query = `
                FOR v
                IN 1 INBOUND '${attributeRepo_1.ATTRIB_COLLECTION_NAME}/${attribute.id}'
                ${libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME}
                RETURN v
            `;
            const libraries = await dbService.execute({ query, ctx });
            for (const lib of libraries) {
                const recordsCollec = dbService.db.collection(lib._key);
                const clearQuery = (0, aql_1.aql) `
                    FOR r IN ${recordsCollec}
                    FILTER r.${attribute.id} != null
                    UPDATE r WITH {${attribute.id}: null} IN ${recordsCollec} OPTIONS {keepNull: false}
                `;
                await dbService.execute({ query: clearQuery, ctx });
            }
            return true;
        }
    };
}
exports.default = default_1;
