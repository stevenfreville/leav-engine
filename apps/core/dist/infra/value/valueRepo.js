"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALUES_COLLECTION = exports.VALUES_LINKS_COLLECTION = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
exports.VALUES_LINKS_COLLECTION = 'core_edge_values_links';
exports.VALUES_COLLECTION = 'core_values';
function default_1({ 'core.infra.attributeTypes': attributeTypesRepo = null, 'core.infra.db.dbService': dbService = null } = {}) {
    return {
        createValue({ library, recordId, attribute, value, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.createValue({ library, recordId, attribute, value, ctx });
        },
        updateValue({ library, recordId, attribute, value, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.updateValue({ library, recordId, attribute, value, ctx });
        },
        deleteValue({ library, recordId, attribute, value, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.deleteValue({ library, recordId, attribute, value, ctx });
        },
        isValueUnique({ library, recordId, attribute, value, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.isValueUnique({ library, recordId, attribute, value, ctx });
        },
        getValues({ library, recordId, attribute, forceGetAllValues, options, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.getValues({
                library,
                recordId,
                attribute,
                forceGetAllValues,
                options,
                ctx
            });
        },
        getValueById({ library, recordId, attribute, valueId, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.getValueById({
                library,
                recordId,
                attribute,
                valueId,
                ctx
            });
        },
        clearAllValues({ attribute, ctx }) {
            const typeRepo = attributeTypesRepo.getTypeRepo(attribute);
            return typeRepo.clearAllValues({ attribute, ctx });
        },
        async deleteAllValuesByRecord({ libraryId, recordId, ctx }) {
            const collection = dbService.db.collection(exports.VALUES_LINKS_COLLECTION);
            await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR l IN ${collection}
                        FILTER l._from == ${libraryId + '/' + recordId} OR l._to == ${libraryId + '/' + recordId}
                        REMOVE {_key: l._key} IN ${collection}
                `,
                ctx
            });
        }
    };
}
exports.default = default_1;
