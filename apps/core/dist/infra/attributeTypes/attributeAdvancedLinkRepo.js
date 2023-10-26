"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aql_1 = require("arangojs/aql");
const attribute_1 = require("../../_types/attribute");
const valueRepo_1 = require("../../infra/value/valueRepo");
const attributeTypesRepo_1 = require("./attributeTypesRepo");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attributeTypes.attributeSimpleLink': attributeSimpleLinkRepo = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.filterTypes': filterTypes = null, 'core.utils': utils = null } = {}) {
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
    const _buildLinkValue = (linkedRecord, valueEdge, reverseLink) => {
        var _a;
        const recordIdField = reverseLink ? '_from' : '_to';
        const [recordLibrary] = valueEdge[recordIdField].split('/');
        return {
            id_value: valueEdge._key,
            value: linkedRecord ? Object.assign(Object.assign({}, linkedRecord), { library: recordLibrary }) : null,
            attribute: valueEdge.attribute,
            modified_at: valueEdge.modified_at,
            modified_by: valueEdge.modified_by,
            created_at: valueEdge.created_at,
            created_by: valueEdge.created_by,
            version: (_a = valueEdge.version) !== null && _a !== void 0 ? _a : null,
            metadata: valueEdge.metadata
        };
    };
    return {
        async createValue({ library, recordId, attribute, value, ctx }) {
            var _a, _b, _c, _d;
            // If reverse_link is a simple link we call attributeSimpleLinkRepo instead.
            if (((_a = attribute.reverse_link) === null || _a === void 0 ? void 0 : _a.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
                await attributeSimpleLinkRepo.createValue({
                    library: attribute.linked_library,
                    recordId: value.value,
                    attribute: Object.assign(Object.assign({}, attribute.reverse_link), { reverse_link: undefined }),
                    value: { value: recordId },
                    ctx
                });
                // To return the "from" value.
                return {
                    value: { id: value.value, library: attribute.linked_library },
                    created_by: null,
                    modified_by: null
                };
            }
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Create the link between records and add some metadata on it.
            const _from = !!attribute.reverse_link
                ? attribute.linked_library + '/' + value.value
                : library + '/' + recordId;
            const toLibrary = !!attribute.reverse_link ? library : attribute.linked_library;
            const toRecordId = !!attribute.reverse_link ? recordId : value.value;
            const _to = toLibrary + '/' + toRecordId;
            const edgeDataAttr = !!attribute.reverse_link ? attribute.reverse_link.id : attribute.id;
            const edgeData = {
                _from,
                _to,
                attribute: edgeDataAttr,
                modified_at: value.modified_at,
                created_at: value.created_at,
                created_by: String(ctx.userId),
                modified_by: String(ctx.userId),
                version: (_b = value.version) !== null && _b !== void 0 ? _b : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    LET linkedRecord = DOCUMENT(${toLibrary + '/' + toRecordId})
                    INSERT ${edgeData} IN ${edgeCollec}
                    RETURN {edge: NEW, linkedRecord}`,
                ctx
            });
            const savedEdge = resEdge.length ? resEdge[0] : null;
            const savedValue = !!attribute.reverse_link ? (_c = savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge) === null || _c === void 0 ? void 0 : _c._from : (_d = savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge) === null || _d === void 0 ? void 0 : _d._to;
            return _buildLinkValue(Object.assign(Object.assign({}, savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.linkedRecord), utils.decomposeValueEdgeDestination(savedValue)), savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge, !!attribute.reverse_link);
        },
        async updateValue({ library, recordId, attribute, value, ctx }) {
            var _a, _b, _c, _d;
            // If reverse_link is a simple link we call attributeSimpleLinkRepo instead.
            if (((_a = attribute.reverse_link) === null || _a === void 0 ? void 0 : _a.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
                return attributeSimpleLinkRepo.updateValue({
                    library: attribute.linked_library,
                    recordId: value.value.id,
                    attribute: Object.assign(Object.assign({}, attribute.reverse_link), { reverse_link: undefined }),
                    value: { value: recordId },
                    ctx
                });
            }
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Update value's metadata on records link.r
            const _from = !!attribute.reverse_link
                ? attribute.linked_library + '/' + value.value
                : library + '/' + recordId;
            const toLibrary = !!attribute.reverse_link ? library : attribute.linked_library;
            const toRecordId = !!attribute.reverse_link ? recordId : value.value;
            const _to = toLibrary + '/' + toRecordId;
            const edgeDataAttr = !!attribute.reverse_link ? attribute.reverse_link.id : attribute.id;
            const edgeData = {
                _from,
                _to,
                attribute: edgeDataAttr,
                modified_at: value.modified_at,
                created_by: value.created_by,
                modified_by: String(ctx.userId),
                version: (_b = value.version) !== null && _b !== void 0 ? _b : null
            };
            if (value.metadata) {
                edgeData.metadata = value.metadata;
            }
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    LET linkedRecord = DOCUMENT(${toLibrary + '/' + toRecordId})
                    UPDATE ${{ _key: value.id_value }}
                        WITH ${edgeData}
                        IN ${edgeCollec}
                    RETURN {edge: NEW, linkedRecord}`,
                ctx
            });
            const savedEdge = resEdge.length ? resEdge[0] : null;
            const savedValue = !!attribute.reverse_link ? (_c = savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge) === null || _c === void 0 ? void 0 : _c._from : (_d = savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge) === null || _d === void 0 ? void 0 : _d._to;
            return _buildLinkValue(Object.assign(Object.assign({}, savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.linkedRecord), utils.decomposeValueEdgeDestination(savedValue)), savedEdge === null || savedEdge === void 0 ? void 0 : savedEdge.edge, !!attribute.reverse_link);
        },
        async deleteValue({ attribute, value, ctx }) {
            var _a;
            if (((_a = attribute.reverse_link) === null || _a === void 0 ? void 0 : _a.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
                return attributeSimpleLinkRepo.deleteValue({
                    library: attribute.linked_library,
                    recordId: value.value.id,
                    attribute: Object.assign(Object.assign({}, attribute.reverse_link), { reverse_link: undefined }),
                    value: { value: null },
                    ctx
                });
            }
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            // Create the link between records and add some metadata on it
            const edgeData = {
                _key: value.id_value
            };
            const resEdge = await dbService.execute({
                query: (0, aql_1.aql) `
                    REMOVE ${edgeData} IN ${edgeCollec}
                    RETURN OLD`,
                ctx
            });
            const deletedEdge = resEdge.length ? resEdge[0] : {};
            return _buildLinkValue(utils.decomposeValueEdgeDestination(deletedEdge._to), deletedEdge, !!attribute.reverse_link);
        },
        async getValues({ library, recordId, attribute, forceGetAllValues = false, options, ctx }) {
            var _a;
            // If reverse_link is a simple link we call attributeSimpleLinkRepo instead.
            if (((_a = attribute.reverse_link) === null || _a === void 0 ? void 0 : _a.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
                return attributeSimpleLinkRepo.getReverseValues({
                    advancedLinkAttr: attribute,
                    value: recordId,
                    forceGetAllValues,
                    ctx
                });
            }
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const queryParts = [];
            const edgeAttribute = !!attribute.reverse_link ? attribute.reverse_link.id : attribute.id;
            const direction = !!attribute.reverse_link ? (0, aql_1.aql) `INBOUND` : (0, aql_1.aql) `OUTBOUND`;
            queryParts.push((0, aql_1.aql) `
                FOR linkedRecord, edge
                    IN 1 ${direction} ${library + '/' + recordId}
                    ${edgeCollec}
                    FILTER edge.attribute == ${edgeAttribute}
                `);
            if (!forceGetAllValues && typeof options !== 'undefined' && options.version) {
                queryParts.push((0, aql_1.aql) `FILTER edge.version == ${options.version}`);
            }
            const limitOne = (0, aql_1.literal)(!attribute.multiple_values && !forceGetAllValues ? 'LIMIT 1' : '');
            queryParts.push((0, aql_1.aql) `
                ${limitOne}
                RETURN {linkedRecord, edge}
            `);
            const query = (0, aql_1.join)(queryParts);
            const res = await dbService.execute({ query, ctx });
            return res.map(r => _buildLinkValue(dbUtils.cleanup(r.linkedRecord), r.edge, !!attribute.reverse_link));
        },
        async getValueById({ library, recordId, attribute, valueId, ctx }) {
            const edgeCollec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const edgeAttribute = !!attribute.reverse_link ? attribute.reverse_link.id : attribute.id;
            const direction = !!attribute.reverse_link ? (0, aql_1.aql) `INBOUND` : (0, aql_1.aql) `OUTBOUND`;
            const query = (0, aql_1.aql) ` FOR linkedRecord, edge
                    IN 1 ${direction} ${library + '/' + recordId}
                    ${edgeCollec}
                    FILTER edge._key == ${valueId}
                    FILTER edge.attribute == ${edgeAttribute}
                    LIMIT 1
                    RETURN {linkedRecord, edge}`;
            const res = await dbService.execute({ query, ctx });
            if (!res.length) {
                return null;
            }
            return _buildLinkValue(dbUtils.cleanup(res[0].edge.linkedRecord), res[0].edge, !!attribute.reverse_link);
        },
        sortQueryPart({ attributes, order }) {
            var _a, _b;
            const collec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const eAttribute = !!attributes[0].reverse_link
                ? (_a = attributes[0].reverse_link) === null || _a === void 0 ? void 0 : _a.id
                : attributes[0].id;
            const direction = !!attributes[0].reverse_link ? (0, aql_1.aql) `INBOUND` : (0, aql_1.aql) `OUTBOUND`;
            let linkedValue = (0, aql_1.aql) `FIRST(
                FOR v, e IN 1 ${direction} r._id
                ${collec}
                FILTER e.attribute == ${eAttribute} RETURN v.${linked.id}
            )`;
            if (((_b = attributes[0].reverse_link) === null || _b === void 0 ? void 0 : _b.type) === attribute_1.AttributeTypes.SIMPLE_LINK) {
                const c = dbService.db.collection(attributes[0].linked_library);
                linkedValue = (0, aql_1.aql) `
                        FIRST(FOR v IN ${c}
                            FILTER v.${eAttribute} == r._key
                        RETURN v.${linked.id})
                    `;
            }
            const query = linked.format !== attribute_1.AttributeFormats.EXTENDED
                ? (0, aql_1.aql) `SORT ${linkedValue} ${order}`
                : (0, aql_1.aql) `SORT ${_getExtendedFilterPart(attributes, linkedValue)} ${order}`;
            return query;
        },
        filterValueQueryPart(attributes, filter, parentIdentifier = attributeTypesRepo_1.BASE_QUERY_IDENTIFIER) {
            var _a, _b;
            const collec = dbService.db.collection(valueRepo_1.VALUES_LINKS_COLLECTION);
            const linked = !attributes[1]
                ? { id: '_key', format: attribute_1.AttributeFormats.TEXT }
                : attributes[1].id === 'id'
                    ? Object.assign(Object.assign({}, attributes[1]), { id: '_key' }) : attributes[1];
            const isCountFilter = filterTypes.isCountFilter(filter);
            const isReverseLink = !!attributes[0].reverse_link;
            const isReverseLinkOnSimpleLink = isReverseLink && ((_a = attributes[0].reverse_link) === null || _a === void 0 ? void 0 : _a.type) === attribute_1.AttributeTypes.SIMPLE_LINK;
            const linkIdentifier = parentIdentifier + 'v';
            const vIdentifier = (0, aql_1.literal)(linkIdentifier);
            const eIdentifier = (0, aql_1.literal)(parentIdentifier + 'e');
            const eAttribute = isReverseLink ? (_b = attributes[0].reverse_link) === null || _b === void 0 ? void 0 : _b.id : attributes[0].id;
            const direction = isReverseLink ? (0, aql_1.aql) `INBOUND` : (0, aql_1.aql) `OUTBOUND`;
            let retrieveValue;
            if (isCountFilter) {
                const countValueDirection = isReverseLink ? '_to' : '_from';
                if (isReverseLinkOnSimpleLink) {
                    const c = dbService.db.collection(attributes[0].linked_library);
                    return (0, aql_1.aql) `
                        COUNT(
                            FOR ${vIdentifier} IN ${c}
                                FILTER ${vIdentifier}.${attributes[0].reverse_link.id} == ${(0, aql_1.literal)(parentIdentifier)}._key
                            RETURN true
                        )
                    `;
                }
                // In "count" filters, we don't need to retrieve the actual value, we just need to know how many links we have
                // Thus, using a "join" query on the edge collection is more efficient than using a traversal
                return (0, aql_1.aql) `
                    COUNT(
                        FOR ${vIdentifier} IN ${collec}
                            FILTER ${vIdentifier}.${(0, aql_1.literal)(countValueDirection)} == ${(0, aql_1.literal)(parentIdentifier)}._id
                                AND ${vIdentifier}.attribute == ${eAttribute}
                            RETURN true
                    )
                `;
            }
            if (isReverseLinkOnSimpleLink) {
                const c = dbService.db.collection(attributes[0].linked_library);
                retrieveValue = (0, aql_1.aql) `
                        FOR ${vIdentifier} IN ${c}
                            FILTER ${vIdentifier}.${attributes[0].reverse_link.id} == ${(0, aql_1.literal)(parentIdentifier)}._key`;
            }
            else {
                retrieveValue = (0, aql_1.aql) `
                        FOR ${vIdentifier}, ${eIdentifier} IN 1 ${direction} ${(0, aql_1.literal)(parentIdentifier)}._id
                            ${collec}
                            FILTER ${eIdentifier}.attribute == ${eAttribute}
                        `;
            }
            const linkValueIdentifier = (0, aql_1.literal)(`${parentIdentifier}linkVal`);
            const returnValue = (0, aql_1.aql) `RETURN ${linkValueIdentifier}`;
            const linkValueQuery = attributes[1]
                ? (0, aql_1.aql) `LET ${(0, aql_1.literal)(linkValueIdentifier)} = (${attributes[1]._repo.filterValueQueryPart([...attributes].splice(1), filter, linkIdentifier)})`
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
