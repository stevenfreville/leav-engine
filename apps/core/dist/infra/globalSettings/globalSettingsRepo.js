"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const GLOBAL_SETTINGS_COLLECTION = 'core_global_settings';
function default_1({ 'core.infra.db.dbService': dbService = null } = {}) {
    const settingsKey = '1';
    return {
        async saveSettings({ settings, ctx }) {
            var _a, _b, _c, _d;
            const collec = dbService.db.collection(GLOBAL_SETTINGS_COLLECTION);
            const settingsToSave = Object.assign({ _key: settingsKey }, settings);
            const savedSettings = await dbService.execute({
                query: (0, arangojs_1.aql) `UPSERT {_key: ${settingsKey}}
                    INSERT ${settingsToSave}
                    UPDATE ${settingsToSave}
                    IN ${collec}
                    RETURN NEW
                `,
                ctx
            });
            return {
                name: (_b = (_a = savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
                icon: (_d = (_c = savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings[0]) === null || _c === void 0 ? void 0 : _c.icon) !== null && _d !== void 0 ? _d : null
            };
        },
        async getSettings(ctx) {
            var _a, _b, _c, _d;
            const collec = dbService.db.collection(GLOBAL_SETTINGS_COLLECTION);
            const settings = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR s IN ${collec}
                        FILTER s._key == ${settingsKey}
                        RETURN s
                `,
                ctx
            });
            return {
                name: (_b = (_a = settings === null || settings === void 0 ? void 0 : settings[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
                icon: (_d = (_c = settings === null || settings === void 0 ? void 0 : settings[0]) === null || _c === void 0 ? void 0 : _c.icon) !== null && _d !== void 0 ? _d : null
            };
        }
    };
}
exports.default = default_1;
