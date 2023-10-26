"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const cacache_1 = __importDefault(require("cacache"));
function default_1({ config = null }) {
    return {
        async storeData({ key, data, path }) {
            await cacache_1.default.put(`${config.diskCache.directory}/${path}`, key, data);
        },
        async getData(keys, path) {
            const data = [];
            for (const k of keys) {
                const value = await cacache_1.default.get(`${config.diskCache.directory}/${path}`, k);
                data.push(value.data.toString());
            }
            return data;
        },
        async deleteData(keys, path) {
            for (const k of keys) {
                await cacache_1.default.rm.entry(`${config.diskCache.directory}/${path}`, k);
            }
        },
        async deleteAll(path) {
            await cacache_1.default.rm.all(path !== null && path !== void 0 ? path : '');
        }
    };
}
exports.default = default_1;
