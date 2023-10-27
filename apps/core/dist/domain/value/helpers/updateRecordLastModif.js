"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
exports.default = (library, recordId, deps, ctx) => {
    return deps.recordRepo.updateRecord({
        libraryId: library,
        recordData: {
            id: recordId,
            modified_at: (0, moment_1.default)().unix(),
            modified_by: String(ctx.userId)
        }
    });
};
