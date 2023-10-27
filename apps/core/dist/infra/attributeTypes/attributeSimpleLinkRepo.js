"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const attribute_1 = require("../../_types/attribute");
const attributeTypesRepo_1 = require("./attributeTypesRepo");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attributeTypes.attributeSimple': attributeSimpleRepo = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.filterTypes': filterTypesHelper = null } = {}) {
    function _getExtendedFilterPart(attributes, linkedValue) {
        return attributes
            .map(a => a.id)
            .slice(2)
            .reduce((acc, value, i) => {
            acc.push((0, aql_1.aql) `TRANSLATE(${value}, ${i ? acc[acc.length - 1] : (0, aql_1.aql) `${linkedValue}`})`);
            if (i) {
                acc.shift();
            }
            return acc;
        }, [])[0];
    }
    const _buildLinkValue = (savedValue, attribute) => (Object.assign(Object.assign({}, savedValue), { value: savedValue.value !== null ? { id: savedValue.value, library: attribute.linked_library } : null }));
    const _saveValue = async ({ library, recordId, attribute, value, ctx }) => {
        var _a;
        const collec = dbService.db.collection(library);
        const res = await dbService.execute({
            query: (0, aql_1.aql) `
                    LET linkedRecord = DOCUMENT(${attribute.linked_library}, ${value.value})
                    UPDATE ${{ _key: recordId }} WITH ${{ [attribute.id]: value.value }} IN ${collec}
                    OPTIONS { keepNull: false }
                    RETURN {doc: NEW, linkedRecord}`,
            ctx
        });
        const updatedDoc = res.length ? res[0] : null;
        const savedVal = {
            value: ((_a = updatedDoc === null || updatedDoc === void 0 ? void 0 : updatedDoc.doc) === null || _a === void 0 ? void 0 : _a[attribute.id])
                ? Object.assign(Object.assign({}, dbUtils.cleanup(updatedDoc.linkedRecord)), { library: attribute.linked_library }) : null,
            created_by: null,
            modified_by: null
        };
        return savedVal;
    };
    return {
        async createValue(args) {
            return _saveValue(args);
        },
        async updateValue(args) {
            return _saveValue(args);
        },
        async deleteValue(args) {
            const deletedValue = await attributeSimpleRepo.deleteValue(args);
            return _buildLinkValue(deletedValue, args.attribute);
        },
        // To get values from advanced reverse link attribute into simple link.
        async getReverseValues({ advancedLinkAttr, value, forceGetAllValues = false, ctx }) {
            var _a;
            const libCollec = dbService.db.collection(advancedLinkAttr.linked_library);
            const queryParts = [];
            queryParts.push((0, aql_1.aql) `
                FOR r IN ${libCollec}
                    FILTER r.${(_a = advancedLinkAttr.reverse_link) === null || _a === void 0 ? void 0 : _a.id} == ${value}`);
            const limitOne = (0, aql_1.literal)(!advancedLinkAttr.multiple_values && !forceGetAllValues ? 'LIMIT 1' : '');
            queryParts.push((0, aql_1.aql) `
                ${limitOne}
                RETURN r
            `);
            const query = (0, aql_1.join)(queryParts);
            const res = await dbService.execute({ query, ctx });
            return res.map(r => ({ id_value: null, value: dbUtils.cleanup(r), created_by: null, modified_by: null }));
        },
        async getValues({ library, recordId, attribute, ctx }) {
            const libCollec = dbService.db.collection(library);
            const linkedLibCollec = dbService.db.collection(attribute.linked_library);
            const res = await dbService.execute({
                query: (0, aql_1.aql) `
                    FOR r IN ${libCollec}
                        FILTER r._key == ${recordId}
                        FOR l IN ${linkedLibCollec}
                            FILTER r.${attribute.id} == l._key
                            RETURN l
                `,
                ctx
            });
            return res
                .filter(r => !!r)
                .slice(0, 1)
                .map(r => ({
                id_value: null,
                library: attribute.linked_library,
                value: dbUtils.cleanup(Object.assign(Object.assign({}, r), { library: attribute.linked_library })),
                created_by: null,
                modified_by: null
            }));
        },
        sortQueryPart({ attributes, order }) {
            const linkedLibCollec = dbService.db.collection(attributes[0].linked_library);
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const linkedValue = (0, aql_1.aql) `
                FIRST(FOR l IN ${linkedLibCollec}
                    FILTER TO_STRING(r.${attributes[0].id}) == l._key
                RETURN l.${linked.id})
            `;
            const query = linked.format !== attribute_1.AttributeFormats.EXTENDED
                ? (0, aql_1.aql) `SORT ${linkedValue} ${order}`
                : (0, aql_1.aql) `SORT ${_getExtendedFilterPart(attributes, linkedValue)} ${order}`;
            return query;
        },
        filterValueQueryPart(attributes, filter, parentIdentifier = attributeTypesRepo_1.BASE_QUERY_IDENTIFIER) {
            const isCountFilter = filterTypesHelper.isCountFilter(filter);
            if (isCountFilter) {
                return (0, aql_1.aql) `COUNT(r.${attributes[0].id}) ? 1 : 0`;
            }
            const linkedLibCollec = dbService.db.collection(attributes[0].linked_library);
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const baseIdentifier = `l${parentIdentifier}`;
            const baseIdentifierLiteral = (0, aql_1.literal)(baseIdentifier);
            const retrieveValue = (0, aql_1.aql) `FOR ${baseIdentifierLiteral} IN ${linkedLibCollec}
                    FILTER TO_STRING(r.${attributes[0].id}) == ${baseIdentifierLiteral}._key`;
            const linkedValueQueryPart = attributes[1]
                ? attributes[1]._repo.filterValueQueryPart([...attributes].splice(1), filter, baseIdentifier)
                : null;
            const linkValueIdentifier = (0, aql_1.literal)(`${parentIdentifier}linkVal`);
            const returnLinkedValue = (0, aql_1.aql) `
                    LET ${linkValueIdentifier} = (${linkedValueQueryPart})
                    RETURN ${linkValueIdentifier}
                `;
            const linkedValue = (0, aql_1.join)([(0, aql_1.literal)('FLATTEN('), retrieveValue, returnLinkedValue, (0, aql_1.literal)(')')]);
            return linked.format !== attribute_1.AttributeFormats.EXTENDED
                ? linkedValue
                : _getExtendedFilterPart(attributes, linkedValue);
        },
        async clearAllValues(args) {
            return true;
        }
    };
}
exports.default = default_1;
