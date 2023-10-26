"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const _types_1 = require("./_types");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null }) {
    return {
        async updateView(view, ctx) {
            const collec = dbService.db.collection(_types_1.VIEWS_COLLECTION_NAME);
            const docToInsert = dbUtils.convertToDoc(view);
            const updatedView = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    UPDATE ${docToInsert} IN ${collec}
                    OPTIONS {mergeObjects: false, keepNull: false}
                    RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(updatedView[0]);
        },
        async createView(view, ctx) {
            const collec = dbService.db.collection(_types_1.VIEWS_COLLECTION_NAME);
            const docToInsert = dbUtils.convertToDoc(view);
            const newView = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${collec} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(newView[0]);
        },
        async getViews(params, ctx) {
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: _types_1.VIEWS_COLLECTION_NAME, customFilterConditions: {
                    created_by: (filterKey, filterVal) => (0, arangojs_1.aql) `el.${filterKey} == ${filterVal} OR el.shared == true`
                }, ctx }));
        },
        async deleteView(viewId, ctx) {
            const collec = dbService.db.collection(_types_1.VIEWS_COLLECTION_NAME);
            const deletedView = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: viewId }} IN ${collec} RETURN OLD`,
                ctx
            });
            return dbUtils.cleanup(deletedView[0]);
        }
    };
}
exports.default = default_1;
