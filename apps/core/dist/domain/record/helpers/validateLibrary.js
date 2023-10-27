"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../_types/errors");
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
exports.default = async (library, deps, ctx) => {
    const lib = await deps.libraryDomain.getLibraries({ params: { filters: { id: library }, strictFilters: true }, ctx });
    // Check if exists and can delete
    if (!lib.list.length) {
        throw new ValidationError_1.default({ library: errors_1.Errors.UNKNOWN_LIBRARY });
    }
};
