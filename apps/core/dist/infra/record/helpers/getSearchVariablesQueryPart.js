"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
function default_1({ 'core.infra.attributeTypes': attributeTypes = null, 'core.infra.record.helpers.getClassifyingFiltersVariableQueryPart': getClassifyingFiltersVariableQueryPart = null, 'core.infra.record.helpers.getSearchVariableName': getSearchVariableName = null, 'core.infra.record.helpers.filterTypes': filterTypesHelper = null }) {
    const { isAttributeFilter, isClassifyingFilter } = filterTypesHelper;
    return filters => {
        const queryPartsById = {};
        const variablesDeclarations = filters.reduce((acc, filter) => {
            if (!isAttributeFilter(filter) && !isClassifyingFilter(filter)) {
                return acc;
            }
            const variableName = getSearchVariableName(filter);
            if (typeof queryPartsById[variableName] !== 'undefined') {
                return acc;
            }
            let variablePart;
            if (isAttributeFilter(filter)) {
                const lastQueryAttribute = filter.attributes[0];
                const typeRepo = attributeTypes.getTypeRepo(lastQueryAttribute);
                variablePart = typeRepo.filterValueQueryPart(filter.attributes.map(attr => (Object.assign(Object.assign({}, attr), { _repo: attributeTypes.getTypeRepo(attr) }))), filter);
            }
            else if (isClassifyingFilter(filter)) {
                variablePart = getClassifyingFiltersVariableQueryPart(filter);
            }
            queryPartsById[variableName] = variablePart;
            acc.push((0, aql_1.aql) `LET ${(0, aql_1.literal)(variableName)} = (${variablePart})`);
            return acc;
        }, []);
        return variablesDeclarations;
    };
}
exports.default = default_1;
