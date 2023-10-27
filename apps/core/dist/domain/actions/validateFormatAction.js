"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const joi_1 = __importDefault(require("joi"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const actionsList_1 = require("../../_types/actionsList");
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
function default_1({ 'core.domain.actionsList': actionsListDomain = null } = {}) {
    return {
        id: 'validateFormat',
        name: 'Validate Format',
        description: 'Check if value matches attribute format',
        input_types: [
            actionsList_1.ActionsListIOTypes.STRING,
            actionsList_1.ActionsListIOTypes.NUMBER,
            actionsList_1.ActionsListIOTypes.BOOLEAN,
            actionsList_1.ActionsListIOTypes.OBJECT
        ],
        output_types: [
            actionsList_1.ActionsListIOTypes.STRING,
            actionsList_1.ActionsListIOTypes.NUMBER,
            actionsList_1.ActionsListIOTypes.BOOLEAN,
            actionsList_1.ActionsListIOTypes.OBJECT
        ],
        action: (value, params, ctx) => {
            const _getSchema = (attribute) => {
                let schema;
                switch (attribute.format) {
                    case attribute_1.AttributeFormats.TEXT:
                    case attribute_1.AttributeFormats.RICH_TEXT:
                    case attribute_1.AttributeFormats.ENCRYPTED:
                        schema = joi_1.default.string().allow('', null);
                        if (attribute.validation_regex) {
                            schema = schema.regex(new RegExp(attribute.validation_regex));
                        }
                        break;
                    case attribute_1.AttributeFormats.NUMERIC:
                        schema = joi_1.default.number().allow('', null);
                        break;
                    case attribute_1.AttributeFormats.DATE:
                        schema = joi_1.default.date().allow('', null).timestamp('unix').raw();
                        break;
                    case attribute_1.AttributeFormats.BOOLEAN:
                        schema = joi_1.default.boolean();
                        break;
                    case attribute_1.AttributeFormats.EXTENDED:
                        schema = joi_1.default.object();
                        if (attribute.embedded_fields) {
                            schema = schema.keys(attribute.embedded_fields.reduce((acc, field) => {
                                acc[field.id] = _getSchema(field);
                                return acc;
                            }, {}));
                        }
                        schema = schema.allow(null);
                        break;
                    case attribute_1.AttributeFormats.DATE_RANGE:
                        schema = joi_1.default.object({
                            from: joi_1.default.date().timestamp('unix').raw().required(),
                            to: joi_1.default.date().timestamp('unix').raw().required()
                        });
                        break;
                    case attribute_1.AttributeFormats.COLOR:
                        schema = joi_1.default.string().max(6).hex();
                        break;
                }
                return schema;
            };
            const attributeSchema = _getSchema(ctx.attribute);
            if (!attributeSchema) {
                return value;
            }
            // Joi might convert value before testing. raw() force it to send back the value we passed in
            const formatSchema = attributeSchema.raw();
            const validationRes = formatSchema.validate(value);
            if (!!validationRes.error) {
                throw new ValidationError_1.default(actionsListDomain.handleJoiError(ctx.attribute, validationRes.error));
            }
            // Specific Validation for date range
            if (ctx.attribute.format === attribute_1.AttributeFormats.DATE_RANGE) {
                const rangeValue = value;
                if (Number(rangeValue.from) > Number(rangeValue.to)) {
                    throw new ValidationError_1.default({ [ctx.attribute.id]: errors_1.Errors.INVALID_DATE_RANGE });
                }
            }
            return value;
        }
    };
}
exports.default = default_1;
