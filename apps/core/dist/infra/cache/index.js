"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.ramService = exports.diskService = exports.initRedis = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var redis_1 = require("./redis");
Object.defineProperty(exports, "initRedis", { enumerable: true, get: function () { return redis_1.initRedis; } });
var diskService_1 = require("./diskService");
Object.defineProperty(exports, "diskService", { enumerable: true, get: function () { return __importDefault(diskService_1).default; } });
var ramService_1 = require("./ramService");
Object.defineProperty(exports, "ramService", { enumerable: true, get: function () { return __importDefault(ramService_1).default; } });
var cacheService_1 = require("./cacheService");
Object.defineProperty(exports, "cacheService", { enumerable: true, get: function () { return __importDefault(cacheService_1).default; } });
