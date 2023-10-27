"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.attributeTree = exports.attributeSimple = exports.attributeSimpleLink = exports.attributeAdvanced = exports.attributeAdvancedLink = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var attributeAdvancedLinkRepo_1 = require("./attributeAdvancedLinkRepo");
Object.defineProperty(exports, "attributeAdvancedLink", { enumerable: true, get: function () { return __importDefault(attributeAdvancedLinkRepo_1).default; } });
var attributeAdvancedRepo_1 = require("./attributeAdvancedRepo");
Object.defineProperty(exports, "attributeAdvanced", { enumerable: true, get: function () { return __importDefault(attributeAdvancedRepo_1).default; } });
var attributeSimpleLinkRepo_1 = require("./attributeSimpleLinkRepo");
Object.defineProperty(exports, "attributeSimpleLink", { enumerable: true, get: function () { return __importDefault(attributeSimpleLinkRepo_1).default; } });
var attributeSimpleRepo_1 = require("./attributeSimpleRepo");
Object.defineProperty(exports, "attributeSimple", { enumerable: true, get: function () { return __importDefault(attributeSimpleRepo_1).default; } });
var attributeTreeRepo_1 = require("./attributeTreeRepo");
Object.defineProperty(exports, "attributeTree", { enumerable: true, get: function () { return __importDefault(attributeTreeRepo_1).default; } });
var attributeTypesRepo_1 = require("./attributeTypesRepo");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(attributeTypesRepo_1).default; } });
