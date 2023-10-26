"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewsStatusAttributeName = exports.getPreviewsAttributeName = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const filesManager_1 = require("../../_types/filesManager");
const getPreviewsAttributeName = (libraryId) => `${libraryId}_${filesManager_1.PREVIEWS_ATTRIBUTE_SUFFIX}`;
exports.getPreviewsAttributeName = getPreviewsAttributeName;
const getPreviewsStatusAttributeName = (libraryId) => `${libraryId}_${filesManager_1.PREVIEWS_STATUS_ATTRIBUTE_SUFFIX}`;
exports.getPreviewsStatusAttributeName = getPreviewsStatusAttributeName;
