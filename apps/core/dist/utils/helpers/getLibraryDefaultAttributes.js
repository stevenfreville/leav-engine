"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const filesManager_1 = require("../../_types/filesManager");
const library_1 = require("../../_types/library");
const getPreviewsAttributes_1 = require("./getPreviewsAttributes");
exports.default = (behavior, libraryId) => {
    const libraryCommonAttributes = {
        [library_1.USERS_LIBRARY]: ['user_groups', 'password', 'login', 'email']
    };
    const commonAttributes = [
        ...['id', 'created_at', 'created_by', 'modified_at', 'modified_by', 'active'],
        ...(libraryCommonAttributes[libraryId] ? libraryCommonAttributes[libraryId] : [])
    ];
    if (!behavior) {
        return commonAttributes;
    }
    const behaviorSpecificAttr = {
        [library_1.LibraryBehavior.STANDARD]: [],
        [library_1.LibraryBehavior.FILES]: [
            ...Object.values(filesManager_1.FilesAttributes),
            (0, getPreviewsAttributes_1.getPreviewsAttributeName)(libraryId),
            (0, getPreviewsAttributes_1.getPreviewsStatusAttributeName)(libraryId)
        ],
        [library_1.LibraryBehavior.DIRECTORIES]: [
            filesManager_1.FilesAttributes.ROOT_KEY,
            filesManager_1.FilesAttributes.FILE_PATH,
            filesManager_1.FilesAttributes.FILE_NAME,
            filesManager_1.FilesAttributes.INODE,
            filesManager_1.FilesAttributes.ACTIVE
        ]
    };
    // Using a Set to prevent duplicates
    return [...new Set([...commonAttributes, ...behaviorSpecificAttr[behavior]])];
};
