"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const camelCase_1 = __importDefault(require("lodash/camelCase"));
function default_1({ 'core.infra.record.helpers.filterTypes': filterTypesHelper = null }) {
    const { isAttributeFilter, isClassifyingFilter } = filterTypesHelper;
    return filter => {
        if (isAttributeFilter(filter)) {
            const attributesNames = filter.attributes.map(attribute => (0, camelCase_1.default)(attribute.id));
            return `${attributesNames.join('_')}_Value`;
        }
        else if (isClassifyingFilter(filter)) {
            const treeName = (0, camelCase_1.default)(filter.treeId);
            return `classified_${treeName}_${filter.value}`;
        }
    };
}
exports.default = default_1;
