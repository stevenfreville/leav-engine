"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOTypes = exports.AttributeFormats = exports.AttributeTypes = exports.ValueVersionMode = void 0;
var ValueVersionMode;
(function (ValueVersionMode) {
    ValueVersionMode["SIMPLE"] = "simple";
    ValueVersionMode["SMART"] = "smart";
})(ValueVersionMode = exports.ValueVersionMode || (exports.ValueVersionMode = {}));
var AttributeTypes;
(function (AttributeTypes) {
    AttributeTypes["SIMPLE"] = "simple";
    AttributeTypes["SIMPLE_LINK"] = "simple_link";
    AttributeTypes["ADVANCED"] = "advanced";
    AttributeTypes["ADVANCED_LINK"] = "advanced_link";
    AttributeTypes["TREE"] = "tree";
})(AttributeTypes = exports.AttributeTypes || (exports.AttributeTypes = {}));
var AttributeFormats;
(function (AttributeFormats) {
    AttributeFormats["TEXT"] = "text";
    AttributeFormats["NUMERIC"] = "numeric";
    AttributeFormats["DATE"] = "date";
    AttributeFormats["DATE_RANGE"] = "date_range";
    AttributeFormats["ENCRYPTED"] = "encrypted";
    AttributeFormats["BOOLEAN"] = "boolean";
    AttributeFormats["EXTENDED"] = "extended";
    AttributeFormats["COLOR"] = "color";
    AttributeFormats["RICH_TEXT"] = "rich_text";
})(AttributeFormats = exports.AttributeFormats || (exports.AttributeFormats = {}));
var IOTypes;
(function (IOTypes) {
    IOTypes["STRING"] = "string";
    IOTypes["NUMBER"] = "number";
    IOTypes["BOOLEAN"] = "boolean";
    IOTypes["OBJECT"] = "object";
})(IOTypes = exports.IOTypes || (exports.IOTypes = {}));
