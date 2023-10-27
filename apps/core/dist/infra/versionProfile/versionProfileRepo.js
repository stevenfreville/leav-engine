"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION_PROFILE_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const attributeRepo_1 = require("../../infra/attribute/attributeRepo");
exports.VERSION_PROFILE_COLLECTION_NAME = 'core_version_profiles';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null } = {}) {
    return {
        async getVersionProfiles({ params, ctx }) {
            const _generateTreesFilterConds = (filterKey, filterVal) => {
                if (typeof filterVal !== 'string') {
                    return (0, arangojs_1.aql) ``;
                }
                if (!filterVal) {
                    return null;
                }
                return (0, arangojs_1.aql) `${filterVal} IN el.${filterKey}`;
            };
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.VERSION_PROFILE_COLLECTION_NAME, customFilterConditions: { trees: _generateTreesFilterConds }, ctx }));
        },
        async createVersionProfile({ profileData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(profileData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.VERSION_PROFILE_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async updateVersionProfile({ profileData, ctx }) {
            const docToUpdate = dbUtils.convertToDoc(profileData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.VERSION_PROFILE_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToUpdate} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async deleteVersionProfile({ id, ctx }) {
            const col = dbService.db.collection(exports.VERSION_PROFILE_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: id }} IN ${col} RETURN OLD`,
                ctx
            });
            // Return deleted attribute
            return dbUtils.cleanup(res.pop());
        },
        async getAttributesUsingProfile({ id, ctx }) {
            const collection = dbService.db.collection(attributeRepo_1.ATTRIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR attrib IN ${collection}
                        FILTER attrib.versions_conf.profile == ${id}
                        RETURN attrib
                `,
                ctx
            });
            return res.map(attribute => dbUtils.cleanup(attribute));
        }
    };
}
exports.default = default_1;
