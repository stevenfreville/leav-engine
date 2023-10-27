"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attribute_1 = require("../../../_types/attribute");
exports.default = (value, attributeProps) => !!(value.id_value && attributeProps.type !== attribute_1.AttributeTypes.SIMPLE);
