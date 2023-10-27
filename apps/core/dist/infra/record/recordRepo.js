"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const list_1 = require("../../_types/list");
const record_1 = require("../../_types/record");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attributeTypes': attributeTypesRepo = null, 'core.infra.attributeTypes.helpers.getConditionPart': getConditionPart = null, 'core.infra.record.helpers.getSearchVariablesQueryPart': getSearchVariablesQueryPart = null, 'core.infra.record.helpers.getSearchVariableName': getSearchVariableName = null, 'core.infra.record.helpers.filterTypes': filterTypesHelper = null, 'core.infra.indexation.helpers.getSearchQuery': getSearchQuery = null, 'core.infra.attribute': attributeRepo = null } = {}) {
    const _generateCursor = (from, direction) => Buffer.from(`${direction}:${from}`).toString('base64');
    const _parseCursor = (cursor) => {
        const s = Buffer.from(cursor, 'base64').toString();
        const [direction, from] = s.split(':');
        return {
            direction,
            from
        };
    };
    return {
        async find({ libraryId, filters, sort, pagination, withCount, fulltextSearch, retrieveInactive = false, ctx }) {
            const withCursorPagination = !!pagination && !!pagination.cursor;
            // Force disabling count on cursor  pagination as it's pointless
            const withTotalCount = withCount && !withCursorPagination;
            const coll = dbService.db.collection(libraryId);
            let fulltextSearchQuery;
            if (typeof fulltextSearch !== 'undefined' && fulltextSearch !== '') {
                // format search query
                const cleanFulltextSearch = fulltextSearch === null || fulltextSearch === void 0 ? void 0 : fulltextSearch.replace(/\s+/g, ' ').trim();
                const fullTextAttributes = await attributeRepo.getLibraryFullTextAttributes({ libraryId, ctx });
                fulltextSearchQuery = getSearchQuery(libraryId, fullTextAttributes.map(a => a.id), cleanFulltextSearch);
            }
            const queryParts = [(0, aql_1.aql) `FOR r IN (${fulltextSearchQuery !== null && fulltextSearchQuery !== void 0 ? fulltextSearchQuery : coll})`];
            let isFilteringOnActive = false;
            const aqlPartByOperator = {
                [record_1.Operator.AND]: (0, aql_1.aql) `AND`,
                [record_1.Operator.OR]: (0, aql_1.aql) `OR`,
                [record_1.Operator.OPEN_BRACKET]: (0, aql_1.aql) `(`,
                [record_1.Operator.CLOSE_BRACKET]: (0, aql_1.aql) `)`
            };
            if (typeof filters !== 'undefined' && filters.length) {
                // Get all variables definitions
                const variablesDeclarations = getSearchVariablesQueryPart(filters);
                const filterStatements = [(0, aql_1.aql) `FILTER (`];
                for (const filter of filters) {
                    if (filter.operator) {
                        filterStatements.push(aqlPartByOperator[filter.operator]);
                    }
                    else if (filterTypesHelper.isAttributeFilter(filter)) {
                        isFilteringOnActive = isFilteringOnActive || filter.attributes[0].id === 'active';
                        const variableName = getSearchVariableName(filter);
                        const lastFilterAttribute = filter.attributes.slice(-1)[0];
                        const variableNameAql = (0, aql_1.literal)(variableName);
                        let statement;
                        if (filterTypesHelper.isCountFilter(filter)) {
                            // For count filters, variable only contains the number of values
                            let conditionApplied;
                            let valueToCheck = filter.value;
                            switch (filter.condition) {
                                case record_1.AttributeCondition.VALUES_COUNT_EQUAL:
                                    conditionApplied = record_1.AttributeCondition.EQUAL;
                                    break;
                                case record_1.AttributeCondition.VALUES_COUNT_GREATER_THAN:
                                    conditionApplied = record_1.AttributeCondition.GREATER_THAN;
                                    break;
                                case record_1.AttributeCondition.VALUES_COUNT_LOWER_THAN:
                                    conditionApplied = record_1.AttributeCondition.LESS_THAN;
                                    break;
                                case record_1.AttributeCondition.IS_EMPTY:
                                    conditionApplied = record_1.AttributeCondition.EQUAL;
                                    valueToCheck = 0;
                                    break;
                                case record_1.AttributeCondition.IS_NOT_EMPTY:
                                    conditionApplied = record_1.AttributeCondition.GREATER_THAN;
                                    valueToCheck = 0;
                            }
                            const countConditionPart = getConditionPart(variableName, conditionApplied, valueToCheck, lastFilterAttribute);
                            statement = (0, aql_1.aql) `${countConditionPart}`;
                        }
                        else {
                            // If multiple values or versionable attribute, apply filter on each value of the array
                            // Otherwise, apply filter on the first value of the array
                            const arrayConditionPart = getConditionPart('CURRENT', filter.condition, filter.value, lastFilterAttribute);
                            const standardConditionPart = getConditionPart(variableName, filter.condition, filter.value, lastFilterAttribute);
                            statement = (0, aql_1.aql) `IS_ARRAY(${variableNameAql}) ? LENGTH(${(0, aql_1.literal)(variableNameAql)}[* FILTER ${arrayConditionPart}]) : ${standardConditionPart}`;
                        }
                        filterStatements.push((0, aql_1.join)([(0, aql_1.aql) `(`, statement, (0, aql_1.aql) `)`]));
                    }
                    else if (filterTypesHelper.isClassifyingFilter(filter)) {
                        const variableName = getSearchVariableName(filter);
                        const classifyingCondition = filter.condition === record_1.TreeCondition.CLASSIFIED_IN ? 'IN' : 'NOT IN';
                        filterStatements.push((0, aql_1.aql) `r._id ${(0, aql_1.literal)(classifyingCondition)} ${(0, aql_1.literal)(variableName)}`);
                    }
                }
                filterStatements.push((0, aql_1.aql) `)`);
                queryParts.push((0, aql_1.join)(variablesDeclarations, '\n'));
                queryParts.push((0, aql_1.join)(filterStatements, '\n'));
            }
            // If we have a full text search query and no specific sort, sorting by relevance is already handled.
            if (sort || !fulltextSearchQuery) {
                const sortQueryPart = sort
                    ? attributeTypesRepo.getTypeRepo(sort.attributes[0]).sortQueryPart(sort)
                    : (0, aql_1.aql) `SORT ${(0, aql_1.literal)('TO_NUMBER(r._key) DESC')}`;
                queryParts.push(sortQueryPart);
            }
            if (!retrieveInactive && !isFilteringOnActive) {
                queryParts.push((0, aql_1.aql) `FILTER r.active == true`);
            }
            if (pagination) {
                if (!pagination.offset && !pagination.cursor) {
                    pagination.offset = 0;
                }
                if (typeof pagination.offset !== 'undefined') {
                    queryParts.push((0, aql_1.aql) `LIMIT ${pagination.offset}, ${pagination.limit}`);
                }
                else if (pagination.cursor) {
                    const { direction, from } = _parseCursor(pagination.cursor);
                    // When looking for previous records, first sort in reverse order to get the last records
                    if (direction === list_1.CursorDirection.PREV) {
                        queryParts.push((0, aql_1.aql) `SORT r.created_at ASC, r._key ASC`);
                    }
                    const operator = direction === list_1.CursorDirection.NEXT ? '<' : '>';
                    queryParts.push((0, aql_1.aql) `FILTER r._key ${(0, aql_1.literal)(operator)} ${from}`);
                    queryParts.push((0, aql_1.aql) `LIMIT ${pagination.limit}`);
                }
            }
            queryParts.push((0, aql_1.aql) `RETURN MERGE(r, {library: ${libraryId}})`);
            const fullQuery = (0, aql_1.join)(queryParts, '\n');
            const records = await dbService.execute({
                query: fullQuery,
                withTotalCount,
                ctx
            });
            const list = withTotalCount ? records.results : records;
            const totalCount = withTotalCount ? records.totalCount : null;
            // TODO: detect if we reach end/beginning of the list and should not provide a cursor
            const cursor = pagination
                ? {
                    prev: list.length ? _generateCursor(Number(list[0]._key), list_1.CursorDirection.PREV) : null,
                    next: list.length ? _generateCursor(Number(list.slice(-1)[0]._key), list_1.CursorDirection.NEXT) : null
                }
                : null;
            const returnVal = {
                totalCount,
                list: list.map(dbUtils.cleanup),
                cursor
            };
            return returnVal;
        },
        async createRecord({ libraryId, recordData, ctx }) {
            const collection = dbService.db.collection(libraryId);
            let newRecord = await collection.save(recordData);
            newRecord = await collection.document(newRecord);
            newRecord.library = newRecord._id.split('/')[0];
            return dbUtils.cleanup(newRecord);
        },
        async deleteRecord({ libraryId, recordId, ctx }) {
            const collection = dbService.db.collection(libraryId);
            // Delete record
            const deletedRecord = await collection.remove({ _key: String(recordId) }, { returnOld: true });
            deletedRecord.library = deletedRecord._id.split('/')[0];
            deletedRecord.old = dbUtils.cleanup(deletedRecord.old);
            return dbUtils.cleanup(deletedRecord);
        },
        async updateRecord({ libraryId, recordData, mergeObjects = true }) {
            const collection = dbService.db.collection(libraryId);
            const dataToSave = Object.assign({}, recordData);
            const recordId = dataToSave.id;
            delete dataToSave.id; // Don't save ID
            const { new: updatedRecord } = await collection.update({ _key: String(recordId) }, dataToSave, {
                mergeObjects,
                returnNew: true,
                keepNull: false
            });
            updatedRecord.library = updatedRecord._id.split('/')[0];
            return dbUtils.cleanup(updatedRecord);
        }
    };
}
exports.default = default_1;
