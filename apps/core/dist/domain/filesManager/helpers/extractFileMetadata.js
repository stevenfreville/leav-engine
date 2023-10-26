"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFileMetadata = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const exiftool_vendored_1 = require("exiftool-vendored");
const node_path_1 = __importDefault(require("node:path"));
const poppler_simple_1 = require("poppler-simple");
const filesManager_1 = require("../../../_types/filesManager");
const getRootPathByKey_1 = require("./getRootPathByKey");
const extractFileMetadata = async (filePath, rootKey, config) => {
    var _a, _b, _c;
    let fileData = {};
    const rootPath = (0, getRootPathByKey_1.getRootPathByKey)(rootKey, config);
    const fullPath = node_path_1.default.join(rootPath, filePath);
    const exifData = await exiftool_vendored_1.exiftool.read(fullPath, ['-FileSize#']);
    const rawMimeType = exifData.MIMEType;
    const splittedMimeType = exifData.MIMEType.split('/');
    const resolution = exifData.XResolution;
    const width = Number((_a = exifData.ImageWidth) !== null && _a !== void 0 ? _a : exifData.ExifImageWidth);
    const height = Number((_b = exifData.ImageHeight) !== null && _b !== void 0 ? _b : exifData.ExifImageHeight);
    const printWidth = resolution && width ? (25.4 * width) / resolution : null;
    const printHeight = resolution && width ? (25.4 * height) / resolution : null;
    fileData = {
        [filesManager_1.FilesAttributes.WIDTH]: width,
        [filesManager_1.FilesAttributes.HEIGHT]: height,
        [filesManager_1.FilesAttributes.MIME_TYPE1]: splittedMimeType[0],
        [filesManager_1.FilesAttributes.MIME_TYPE2]: splittedMimeType[1],
        [filesManager_1.FilesAttributes.COLOR_SPACE]: (_c = exifData.ColorMode) !== null && _c !== void 0 ? _c : exifData.ColorSpace,
        [filesManager_1.FilesAttributes.FILE_SIZE]: exifData.FileSize,
        [filesManager_1.FilesAttributes.HAS_CLIPPING_PATH]: !!exifData.ClippingPathName,
        [filesManager_1.FilesAttributes.COLOR_PROFILE]: exifData.ICCProfileName,
        [filesManager_1.FilesAttributes.RESOLUTION]: resolution,
        [filesManager_1.FilesAttributes.PRINT_WIDTH]: printWidth,
        [filesManager_1.FilesAttributes.PRINT_HEIGHT]: printHeight
    };
    if (rawMimeType === 'application/pdf') {
        const pdf = new poppler_simple_1.PopplerDocument(fullPath);
        const page = pdf.getPage(1);
        const pdfResolution = 72;
        const pdfWidth = Number(page.width);
        const pdfHeight = Number(page.height);
        fileData[filesManager_1.FilesAttributes.PRINT_WIDTH] = pdfWidth ? (25.4 * pdfWidth) / pdfResolution : null; // In mm
        fileData[filesManager_1.FilesAttributes.PRINT_HEIGHT] = pdfHeight ? (25.4 * pdfHeight) / pdfResolution : null; // In mm
    }
    return fileData;
};
exports.extractFileMetadata = extractFileMetadata;
