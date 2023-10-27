"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tree = exports.treeNode = exports.treeLibrary = exports.record = exports.recordAttribute = exports.default = exports.library = exports.attribute = exports.application = exports.admin = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var adminPermissionDomain_1 = require("./adminPermissionDomain");
Object.defineProperty(exports, "admin", { enumerable: true, get: function () { return __importDefault(adminPermissionDomain_1).default; } });
var applicationPermissionDomain_1 = require("./applicationPermissionDomain");
Object.defineProperty(exports, "application", { enumerable: true, get: function () { return __importDefault(applicationPermissionDomain_1).default; } });
var attributePermissionDomain_1 = require("./attributePermissionDomain");
Object.defineProperty(exports, "attribute", { enumerable: true, get: function () { return __importDefault(attributePermissionDomain_1).default; } });
var libraryPermissionDomain_1 = require("./libraryPermissionDomain");
Object.defineProperty(exports, "library", { enumerable: true, get: function () { return __importDefault(libraryPermissionDomain_1).default; } });
var permissionDomain_1 = require("./permissionDomain");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(permissionDomain_1).default; } });
var recordAttributePermissionDomain_1 = require("./recordAttributePermissionDomain");
Object.defineProperty(exports, "recordAttribute", { enumerable: true, get: function () { return __importDefault(recordAttributePermissionDomain_1).default; } });
var recordPermissionDomain_1 = require("./recordPermissionDomain");
Object.defineProperty(exports, "record", { enumerable: true, get: function () { return __importDefault(recordPermissionDomain_1).default; } });
var treeLibraryPermissionDomain_1 = require("./treeLibraryPermissionDomain");
Object.defineProperty(exports, "treeLibrary", { enumerable: true, get: function () { return __importDefault(treeLibraryPermissionDomain_1).default; } });
var treeNodePermissionDomain_1 = require("./treeNodePermissionDomain");
Object.defineProperty(exports, "treeNode", { enumerable: true, get: function () { return __importDefault(treeNodePermissionDomain_1).default; } });
var treePermissionDomain_1 = require("./treePermissionDomain");
Object.defineProperty(exports, "tree", { enumerable: true, get: function () { return __importDefault(treePermissionDomain_1).default; } });
