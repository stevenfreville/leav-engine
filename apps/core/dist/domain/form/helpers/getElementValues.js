"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementValues = void 0;
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const forms_1 = require("../../../_types/forms");
const getElementValues = async (params) => {
    const { element, recordId, libraryId, version, deps, ctx } = params;
    const result = {
        error: null,
        values: null
    };
    if (element.type !== forms_1.FormElementTypes.field || !element.settings.attribute || !recordId) {
        return result;
    }
    try {
        const values = await deps['core.domain.record'].getRecordFieldValue({
            library: libraryId,
            attributeId: element.settings.attribute,
            record: {
                id: recordId,
                library: libraryId
            },
            options: { version },
            ctx
        });
        if (values === null || (!Array.isArray(values) && values.value === null)) {
            return result;
        }
        result.values = Array.isArray(values) ? values : [values];
    }
    catch (error) {
        result.error = error.message;
        if (error instanceof ValidationError_1.default) {
            const lang = ctx.lang;
            result.error = Object.values(error.fields)
                .map(fieldError => deps['core.utils'].translateError(fieldError, lang))
                .join(', ');
        }
        else {
            deps['core.utils.logger'].error(error);
        }
    }
    return result;
};
exports.getElementValues = getElementValues;
