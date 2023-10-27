"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssociatedForms = exports.runPreDelete = exports.runBehaviorPostSave = exports.deleteAssociatedValues = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var deleteAssociatedValues_1 = require("./deleteAssociatedValues");
Object.defineProperty(exports, "deleteAssociatedValues", { enumerable: true, get: function () { return __importDefault(deleteAssociatedValues_1).default; } });
var runBehaviorPostSave_1 = require("./runBehaviorPostSave");
Object.defineProperty(exports, "runBehaviorPostSave", { enumerable: true, get: function () { return __importDefault(runBehaviorPostSave_1).default; } });
var runPreDelete_1 = require("./runPreDelete");
Object.defineProperty(exports, "runPreDelete", { enumerable: true, get: function () { return __importDefault(runPreDelete_1).default; } });
var updateAssociatedForms_1 = require("./updateAssociatedForms");
Object.defineProperty(exports, "updateAssociatedForms", { enumerable: true, get: function () { return __importDefault(updateAssociatedForms_1).default; } });
