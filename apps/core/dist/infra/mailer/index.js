"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailerService = exports.initMailer = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var mailer_1 = require("./mailer");
Object.defineProperty(exports, "initMailer", { enumerable: true, get: function () { return mailer_1.initMailer; } });
var mailerService_1 = require("./mailerService");
Object.defineProperty(exports, "mailerService", { enumerable: true, get: function () { return __importDefault(mailerService_1).default; } });
