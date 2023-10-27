"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_KEY_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
exports.API_KEY_COLLECTION_NAME = 'core_api_keys';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null } = {}) {
    return {
        async getApiKeys({ params, ctx }) {
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.API_KEY_COLLECTION_NAME, ctx }));
        },
        async createApiKey({ keyData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(keyData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.API_KEY_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async updateApiKey({ keyData, ctx }) {
            const docToUpdate = dbUtils.convertToDoc(keyData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.API_KEY_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToUpdate} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async deleteApiKey({ id, ctx }) {
            const col = dbService.db.collection(exports.API_KEY_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: id }} IN ${col} RETURN OLD`,
                ctx
            });
            // Return deleted attribute
            return dbUtils.cleanup(res.pop());
        }
    };
}
exports.default = default_1;
