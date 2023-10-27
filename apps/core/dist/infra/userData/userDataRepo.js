"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const USER_DATA_COLLECTION = 'core_user_data';
function default_1({ 'core.infra.db.dbService': dbService = null } = {}) {
    return {
        async saveUserData({ key, value, global, isCoreData = false, ctx }) {
            const collection = dbService.db.collection(USER_DATA_COLLECTION);
            const dataKey = isCoreData ? 'core_data' : 'data';
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    UPSERT ${{ userId: global ? null : ctx.userId }}
                    INSERT ${{ userId: global ? null : ctx.userId, data: { [key]: value } }}
                    UPDATE ${{ [dataKey]: { [key]: typeof value !== 'undefined' ? value : null } }}
                    IN ${collection}
                    OPTIONS { mergeObjects: true, keepNull: false }
                    RETURN NEW`,
                ctx
            });
            return { global, data: { [key]: res[0].data[key] } };
        },
        async getUserData(keys, global, ctx) {
            const collection = dbService.db.collection(USER_DATA_COLLECTION);
            const userData = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    LET userData = 
                        FIRST(FOR e IN ${collection}
                            FILTER e.userId == ${global ? null : ctx.userId}
                        RETURN e)

                    LET MERGED = MERGE(userData.data || {}, userData.core_data || {})

                    RETURN KEEP(MERGED, ${keys})
                `,
                ctx
            });
            return { global, data: userData[0] || {} };
        }
    };
}
exports.default = default_1;
