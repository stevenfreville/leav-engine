"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValuesCountCondition = exports.BASE_QUERY_IDENTIFIER = exports.ATTRIB_COLLECTION_NAME = void 0;
const attribute_1 = require("../../_types/attribute");
const record_1 = require("../../_types/record");
exports.ATTRIB_COLLECTION_NAME = 'core_attributes';
exports.BASE_QUERY_IDENTIFIER = 'r';
const isValuesCountCondition = (condition) => {
    return [
        record_1.AttributeCondition.VALUES_COUNT_EQUAL,
        record_1.AttributeCondition.VALUES_COUNT_GREATER_THAN,
        record_1.AttributeCondition.VALUES_COUNT_LOWER_THAN
    ].includes(condition);
};
exports.isValuesCountCondition = isValuesCountCondition;
function default_1({ 'core.infra.attributeTypes.attributeSimple': attributeSimpleRepo = null, 'core.infra.attributeTypes.attributeSimpleLink': attributeSimpleLinkRepo = null, 'core.infra.attributeTypes.attributeAdvanced': attributeAdvancedRepo = null, 'core.infra.attributeTypes.attributeAdvancedLink': attributeAdvancedLinkRepo = null, 'core.infra.attributeTypes.attributeTree': attributeTreeRepo = null } = {}) {
    return {
        getTypeRepo(attribute) {
            let attrTypeRepo;
            switch (attribute.type) {
                case attribute_1.AttributeTypes.SIMPLE:
                    attrTypeRepo = attributeSimpleRepo;
                    break;
                case attribute_1.AttributeTypes.SIMPLE_LINK:
                    attrTypeRepo = attributeSimpleLinkRepo;
                    break;
                case attribute_1.AttributeTypes.ADVANCED:
                    attrTypeRepo = attributeAdvancedRepo;
                    break;
                case attribute_1.AttributeTypes.ADVANCED_LINK:
                    attrTypeRepo = attributeAdvancedLinkRepo;
                    break;
                case attribute_1.AttributeTypes.TREE:
                    attrTypeRepo = attributeTreeRepo;
                    break;
            }
            return attrTypeRepo;
        }
    };
}
exports.default = default_1;
