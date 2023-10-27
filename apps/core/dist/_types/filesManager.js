"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREVIEWS_STATUS_ATTRIBUTE_SUFFIX = exports.PREVIEWS_ATTRIBUTE_SUFFIX = exports.FilesAttributes = exports.FileEvents = void 0;
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var FileEvents;
(function (FileEvents) {
    FileEvents["CREATE"] = "CREATE";
    FileEvents["REMOVE"] = "REMOVE";
    FileEvents["UPDATE"] = "UPDATE";
    FileEvents["MOVE"] = "MOVE";
})(FileEvents = exports.FileEvents || (exports.FileEvents = {}));
var FilesAttributes;
(function (FilesAttributes) {
    FilesAttributes["ROOT_KEY"] = "root_key";
    FilesAttributes["FILE_PATH"] = "file_path";
    FilesAttributes["FILE_NAME"] = "file_name";
    FilesAttributes["INODE"] = "inode";
    FilesAttributes["ACTIVE"] = "active";
    FilesAttributes["HASH"] = "hash";
    FilesAttributes["FILE_SIZE"] = "file_size";
    FilesAttributes["MIME_TYPE1"] = "mime_type1";
    FilesAttributes["MIME_TYPE2"] = "mime_type2";
    FilesAttributes["HAS_CLIPPING_PATH"] = "has_clipping_path";
    FilesAttributes["COLOR_SPACE"] = "color_space";
    FilesAttributes["COLOR_PROFILE"] = "color_profile";
    FilesAttributes["WIDTH"] = "width";
    FilesAttributes["HEIGHT"] = "height";
    FilesAttributes["PRINT_WIDTH"] = "print_width";
    FilesAttributes["PRINT_HEIGHT"] = "print_height";
    FilesAttributes["RESOLUTION"] = "resolution";
})(FilesAttributes = exports.FilesAttributes || (exports.FilesAttributes = {}));
exports.PREVIEWS_ATTRIBUTE_SUFFIX = 'previews';
exports.PREVIEWS_STATUS_ATTRIBUTE_SUFFIX = 'previews_status';
