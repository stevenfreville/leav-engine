"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../../_types/record");
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const attribute_1 = require("../../../_types/attribute");
const errors_1 = require("../../../_types/errors");
exports.default = async (library, recordId, deps, ctx) => {
    const recordsRes = await deps.recordRepo.find({
        libraryId: library,
        filters: [
            {
                attributes: [{ id: 'id', type: attribute_1.AttributeTypes.SIMPLE }],
                condition: record_1.AttributeCondition.EQUAL,
                value: String(recordId)
            }
        ],
        retrieveInactive: true,
        ctx
    });
    if (!recordsRes.list.length) {
        throw new ValidationError_1.default({ recordId: errors_1.Errors.UNKNOWN_RECORD });
    }
};
