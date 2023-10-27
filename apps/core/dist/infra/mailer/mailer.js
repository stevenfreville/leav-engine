"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMailer = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const nodemailer_1 = __importDefault(require("nodemailer"));
async function initMailer({ config }) {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer_1.default.createTransport({
        host: config.mailer.host,
        port: Number(config.mailer.port),
        secure: false,
        auth: {
            user: config.mailer.auth.user,
            pass: config.mailer.auth.password // testAccount.pass
        }
    });
    return transporter;
}
exports.initMailer = initMailer;
