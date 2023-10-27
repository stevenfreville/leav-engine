"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.treeBasedPermissions = exports.simplePermission = exports.reducePermissionsArray = exports.permissionsByActions = exports.permissionByUserGroups = exports.globalPermission = exports.defaultPermission = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var defaultPermission_1 = require("./defaultPermission");
Object.defineProperty(exports, "defaultPermission", { enumerable: true, get: function () { return __importDefault(defaultPermission_1).default; } });
var globalPermission_1 = require("./globalPermission");
Object.defineProperty(exports, "globalPermission", { enumerable: true, get: function () { return __importDefault(globalPermission_1).default; } });
var permissionByUserGroups_1 = require("./permissionByUserGroups");
Object.defineProperty(exports, "permissionByUserGroups", { enumerable: true, get: function () { return __importDefault(permissionByUserGroups_1).default; } });
var permissionsByActions_1 = require("./permissionsByActions");
Object.defineProperty(exports, "permissionsByActions", { enumerable: true, get: function () { return __importDefault(permissionsByActions_1).default; } });
var reducePermissionsArray_1 = require("./reducePermissionsArray");
Object.defineProperty(exports, "reducePermissionsArray", { enumerable: true, get: function () { return __importDefault(reducePermissionsArray_1).default; } });
var simplePermission_1 = require("./simplePermission");
Object.defineProperty(exports, "simplePermission", { enumerable: true, get: function () { return __importDefault(simplePermission_1).default; } });
var treeBasedPermissions_1 = require("./treeBasedPermissions");
Object.defineProperty(exports, "treeBasedPermissions", { enumerable: true, get: function () { return __importDefault(treeBasedPermissions_1).default; } });
