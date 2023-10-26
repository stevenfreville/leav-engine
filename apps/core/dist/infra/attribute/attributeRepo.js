"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTRIB_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const aql_1 = require("arangojs/aql");
const libraryRepo_1 = require("../library/libraryRepo");
exports.ATTRIB_COLLECTION_NAME = 'core_attributes';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.value': valueRepo = null, 'core.utils': utils = null } = {}) {
    return {
        async getLibraryAttributes({ libraryId, ctx }) {
            const query = (0, arangojs_1.aql) `
                FOR v
                IN 1 OUTBOUND ${`${libraryRepo_1.LIB_COLLECTION_NAME}/${libraryId}`}
                ${libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME}
                RETURN v
            `;
            const res = await dbService.execute({ query, ctx });
            return res.map(a => dbUtils.cleanup(a));
        },
        async getAttributeLibraries({ attributeId, ctx }) {
            const query = (0, arangojs_1.aql) `
                FOR lib IN 1 INBOUND ${`${exports.ATTRIB_COLLECTION_NAME}/${attributeId}`}
                ${libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME}
                RETURN lib
            `;
            const res = await dbService.execute({ query, ctx });
            return res.map(library => dbUtils.cleanup(library));
        },
        async getLibraryFullTextAttributes({ libraryId, ctx }) {
            const libAttributesCollec = dbService.db.collection(libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME);
            const attributesCollec = dbService.db.collection(exports.ATTRIB_COLLECTION_NAME);
            const attrs = await dbService.execute({
                query: (0, arangojs_1.aql) `LET fullTextAttrs = (
                            FOR e IN ${libAttributesCollec}
                                FILTER e._from == ${libraryRepo_1.LIB_COLLECTION_NAME + '/' + libraryId}
                                FILTER e.full_text_search == true
                            RETURN LAST(SPLIT(e._to, '/'))
                        )
                        FOR a IN ${attributesCollec}
                            FILTER POSITION(fullTextAttrs, a._key)
                        RETURN a
                    `,
                ctx
            });
            return attrs.map(a => dbUtils.cleanup(a));
        },
        async getAttributes({ params, ctx }) {
            const _generateLibrariesFilterConds = (filterKey, filterVal) => {
                if (typeof filterVal === 'boolean') {
                    return (0, arangojs_1.aql) ``;
                }
                if (!filterVal) {
                    return null;
                }
                const libs = utils.forceArray(filterVal);
                const valParts = libs.map(l => (0, arangojs_1.aql) `v._key == ${l}`);
                const libKeyCond = (0, aql_1.join)(valParts, ' OR ');
                // Check if there is links between given libraries and attribute
                return (0, arangojs_1.aql) `LENGTH(
                    FOR v IN 1 INBOUND el
                    core_edge_libraries_attributes
                    FILTER ${libKeyCond}
                    RETURN v._key
                ) > 0`;
            };
            const _generateVersionableFilterConds = (filterKey, filterVal) => {
                const filterValBool = !!filterVal; // Ensure we're dealing with a boolean
                // Check if there is links between given libraries and attribute
                return (0, arangojs_1.aql) `el.versions_conf.${filterKey} == ${filterValBool}`;
            };
            const _generateMetadataFilterConds = (filterKey, filterVal) => {
                if (!filterVal) {
                    return null;
                }
                return (0, arangojs_1.aql) `LENGTH(
                    INTERSECTION(
                        el.${filterKey},
                        ${utils.forceArray(filterVal)}
                    )
                ) > 0`;
            };
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.ATTRIB_COLLECTION_NAME, customFilterConditions: {
                    libraries: _generateLibrariesFilterConds,
                    versionable: _generateVersionableFilterConds,
                    metadata_fields: _generateMetadataFilterConds
                }, ctx }));
        },
        async updateAttribute({ attrData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(attrData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.ATTRIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async createAttribute({ attrData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(attrData);
            // Insert in libraries collection
            const col = dbService.db.collection(exports.ATTRIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async deleteAttribute({ attrData, ctx }) {
            // Delete links library<->attribute
            const libAttributesCollec = dbService.db.collection(libraryRepo_1.LIB_ATTRIB_COLLECTION_NAME);
            // Delete all values
            await valueRepo.clearAllValues({ attribute: attrData, ctx });
            await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR e IN ${libAttributesCollec}
                        FILTER e._to == ${'core_attributes/' + attrData.id}
                        REMOVE e IN ${libAttributesCollec}
                    `,
                ctx
            });
            // Delete attribute
            const col = dbService.db.collection(exports.ATTRIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: attrData.id }} IN ${col} RETURN OLD`,
                ctx
            });
            // Return deleted attribute
            return dbUtils.cleanup(res.pop());
        }
    };
}
exports.default = default_1;
