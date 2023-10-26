"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreCollections = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const collection_1 = require("arangojs/collection");
exports.coreCollections = [
    { name: 'core_attributes', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_libraries', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_permissions', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_trees', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_values', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_forms', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_views', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_user_data', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_applications', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_tasks', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_version_profiles', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_api_keys', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_global_settings', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
    { name: 'core_edge_libraries_attributes', type: collection_1.CollectionType.EDGE_COLLECTION },
    { name: 'core_edge_values_links', type: collection_1.CollectionType.EDGE_COLLECTION }
];
