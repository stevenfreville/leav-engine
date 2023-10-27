"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
function default_1({ 'core.infra.record': recordRepo = null }) {
    return (library, recordId, ctx) => {
        return recordRepo.updateRecord({
            libraryId: library,
            recordData: {
                id: recordId,
                modified_at: (0, moment_1.default)().unix(),
                modified_by: String(ctx.userId)
            }
        });
    };
}
exports.default = default_1;
