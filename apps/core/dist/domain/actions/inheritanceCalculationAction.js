"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actionsList_1 = require("../../_types/actionsList");
const attribute_1 = require("../../_types/attribute");
function default_1({ 'core.domain.helpers.calculationVariable': calculationVariable = null, 'core.domain.attribute': attributeDomain = null } = {}) {
    return {
        id: 'inheritanceCalculation',
        name: 'Inheritance calculation',
        description: 'Inherit values from another record',
        input_types: [
            actionsList_1.ActionsListIOTypes.STRING,
            actionsList_1.ActionsListIOTypes.NUMBER,
            actionsList_1.ActionsListIOTypes.OBJECT,
            actionsList_1.ActionsListIOTypes.BOOLEAN
        ],
        output_types: [
            actionsList_1.ActionsListIOTypes.STRING,
            actionsList_1.ActionsListIOTypes.NUMBER,
            actionsList_1.ActionsListIOTypes.OBJECT,
            actionsList_1.ActionsListIOTypes.BOOLEAN
        ],
        params: [
            {
                name: 'Description',
                type: 'string',
                description: 'Quick description of your calculation',
                required: true,
                default_value: 'Your description'
            },
            {
                name: 'Formula',
                type: 'string',
                description: 'Variables function calls to perform. Ex: getValue(linked_products).getValue(image)',
                required: true,
                default_value: ''
            }
        ],
        action: async (value, params, ctx) => {
            const { Formula: formula } = params;
            const attrProps = await attributeDomain.getAttributeProperties({ id: ctx.attribute.id, ctx });
            const result = await calculationVariable.processVariableString(ctx, formula, value);
            if (!result.length) {
                return null;
            }
            if (attrProps.type === attribute_1.AttributeTypes.SIMPLE_LINK || attrProps.type === attribute_1.AttributeTypes.ADVANCED_LINK) {
                return result.map(v => ({
                    id: String(v.value),
                    library: v.library
                }))[0];
            }
            const finalResult = result.map(v => v.value)[0];
            return finalResult;
        }
    };
}
exports.default = default_1;
