"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORM_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
exports.FORM_COLLECTION_NAME = 'core_forms';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null } = {}) {
    const _generateKey = (form) => `${form.library}__${form.id}`;
    const _cleanKey = (key) => key.substring(key.indexOf('__') + 2);
    const _cleanDocForm = (formDoc) => {
        const cleanRes = dbUtils.cleanup(formDoc);
        return Object.assign(Object.assign({}, cleanRes), { id: _cleanKey(cleanRes.id) });
    };
    return {
        async getForms({ params, ctx }) {
            var _a;
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            // Convert ID filter if any
            if (!!((_a = initializedParams === null || initializedParams === void 0 ? void 0 : initializedParams.filters) === null || _a === void 0 ? void 0 : _a.id)) {
                initializedParams.filters.id = Array.isArray(initializedParams.filters.id)
                    ? initializedParams.filters.id.map(filterId => _generateKey({
                        id: filterId,
                        library: initializedParams.filters.library
                    }))
                    : _generateKey({
                        id: initializedParams.filters.id,
                        library: initializedParams.filters.library
                    });
            }
            const res = await dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.FORM_COLLECTION_NAME, ctx }));
            // Convert id to user friendly id
            return Object.assign(Object.assign({}, res), { list: res.list.map(f => (Object.assign(Object.assign({}, f), { id: _cleanKey(f.id) }))) });
        },
        async updateForm({ formData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(formData);
            docToInsert._key = _generateKey(formData); // Prevent duplicates keys
            // Insert in libraries collection
            const col = dbService.db.collection(exports.FORM_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return _cleanDocForm(res.pop());
        },
        async createForm({ formData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(formData);
            docToInsert._key = _generateKey(formData); // Prevent duplicates keys
            // Insert in libraries collection
            const col = dbService.db.collection(exports.FORM_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return _cleanDocForm(res.pop());
        },
        async deleteForm({ formData, ctx }) {
            const docToDelete = dbUtils.convertToDoc(formData);
            docToDelete._key = _generateKey(formData); // Prevent duplicates keys
            // Insert in libraries collection
            const col = dbService.db.collection(exports.FORM_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${docToDelete} IN ${col} RETURN OLD`,
                ctx
            });
            return _cleanDocForm(res.pop());
        }
    };
}
exports.default = default_1;
