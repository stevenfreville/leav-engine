"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
exports.default = async (config) => {
    await i18next_1.default.use(i18next_fs_backend_1.default).init({
        lng: config.lang.default,
        fallbackLng: config.lang.default,
        supportedLngs: config.lang.available,
        debug: false,
        preload: config.lang.available,
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json'
        }
    });
    return i18next_1.default;
};
