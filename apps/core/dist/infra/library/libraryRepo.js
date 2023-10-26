"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIB_ATTRIB_COLLECTION_NAME = exports.LIB_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const lodash_1 = require("lodash");
exports.LIB_COLLECTION_NAME = 'core_libraries';
exports.LIB_ATTRIB_COLLECTION_NAME = 'core_edge_libraries_attributes';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.infra.attribute': attributeRepo = null } = {}) {
    return {
        async getLibraries({ params = {}, ctx }) {
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            const libraries = await dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.LIB_COLLECTION_NAME, ctx }));
            return libraries;
        },
        async createLibrary({ libData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(libData);
            // Create new collection for library
            await dbService.createCollection(docToInsert._key);
            // Insert in libraries collection
            const libCollc = dbService.db.collection(exports.LIB_COLLECTION_NAME);
            const libRes = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${libCollc} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(libRes.pop());
        },
        async updateLibrary({ libData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(libData);
            delete docToInsert.attributes; // Attributes have to be handled separately
            // Insert in libraries collection
            const col = dbService.db.collection(exports.LIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async deleteLibrary({ id, ctx }) {
            const filters = { linked_library: id };
            // Delete attributes linked to this library
            const linkedAttributes = await attributeRepo.getAttributes({
                params: { filters },
                ctx
            });
            for (const linkedAttribute of linkedAttributes.list) {
                await attributeRepo.deleteAttribute({
                    attrData: linkedAttribute,
                    ctx
                });
            }
            // Delete library attributes
            const libAttributesCollec = dbService.db.collection(exports.LIB_ATTRIB_COLLECTION_NAME);
            await dbService.execute({
                query: (0, arangojs_1.aql) `FOR e IN ${libAttributesCollec}
                         FILTER e._from == ${exports.LIB_COLLECTION_NAME + '/' + id}
                         REMOVE e IN ${libAttributesCollec}`,
                ctx
            });
            // Delete library
            const col = dbService.db.collection(exports.LIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: id }} IN ${col} RETURN OLD`,
                ctx
            });
            // Delete library's collection
            await dbService.dropCollection(id);
            // Return deleted library
            return dbUtils.cleanup(res.pop());
        },
        async saveLibraryAttributes({ libId, attributes, insertOnly = false, ctx }) {
            // TODO: in CONCAT, query will fail if using constant instead of hard coding 'core_attributes'
            const libAttribCollec = dbService.db.collection(exports.LIB_ATTRIB_COLLECTION_NAME);
            // Get current library attributes
            if (!insertOnly) {
                const currentAttrs = await attributeRepo.getLibraryAttributes({ libraryId: libId, ctx });
                const deletedAttrs = (0, lodash_1.difference)(currentAttrs.filter(a => !a.system).map(a => a.id), attributes);
                // Unlink attributes not used anymore
                if (deletedAttrs.length) {
                    await dbService.execute({
                        query: (0, arangojs_1.aql) `
                        FOR attr IN ${deletedAttrs}
                            FOR l in ${libAttribCollec}
                                FILTER
                                    l._from == ${exports.LIB_COLLECTION_NAME + '/' + libId}
                                    AND l._to == CONCAT('core_attributes/', attr)
                                REMOVE l
                                IN ${libAttribCollec}
                                RETURN OLD
                    `,
                        ctx
                    });
                }
            }
            // Save new ones
            const libAttribRes = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR attr IN ${attributes}
                        LET attrToInsert = {
                            _from: ${exports.LIB_COLLECTION_NAME + '/' + libId},
                            _to: CONCAT('core_attributes/', attr)
                        }
                        UPSERT {
                            _from: ${exports.LIB_COLLECTION_NAME + '/' + libId},
                            _to: CONCAT('core_attributes/', attr)
                        }
                        INSERT attrToInsert
                        UPDATE attrToInsert
                        IN ${libAttribCollec}
                        RETURN NEW
                `,
                ctx
            });
            return libAttribRes.map(res => res._to.split('/')[1]);
        },
        async saveLibraryFullTextAttributes({ libId, fullTextAttributes, ctx }) {
            const libAttribCollec = dbService.db.collection(exports.LIB_ATTRIB_COLLECTION_NAME);
            await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR attr IN ${libAttribCollec}
                        FILTER attr._from == ${exports.LIB_COLLECTION_NAME + '/' + libId}
                        UPDATE {
                            _key: attr._key,
                            full_text_search: POSITION(${fullTextAttributes}, LAST(SPLIT(attr._to, '/')))
                        }
                        IN ${libAttribCollec}
                `,
                ctx
            });
        },
        async getLibrariesUsingAttribute(attributeId, ctx) {
            const libAttributesCollec = dbService.db.collection(exports.LIB_ATTRIB_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `FOR e IN ${libAttributesCollec}
                        FILTER e._to == ${'core_attributes/' + attributeId}
                    RETURN LAST(SPLIT(e._from, ${exports.LIB_COLLECTION_NAME + '/'}))`,
                ctx
            });
            return res;
        }
    };
}
exports.default = default_1;
