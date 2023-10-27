"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const fs_1 = __importDefault(require("fs"));
const progress_stream_1 = __importDefault(require("progress-stream"));
function default_1() {
    return async (fileData, path, onProgress, size) => {
        const { createReadStream, filename } = fileData;
        const readStream = createReadStream();
        const storedFilePath = `${path}/${filename}`;
        const str = (0, progress_stream_1.default)({
            length: size,
            time: 100 /* ms */
        });
        await new Promise((resolve, reject) => {
            const writeStream = fs_1.default.createWriteStream(storedFilePath);
            if (typeof onProgress !== 'undefined') {
                str.on('progress', (p) => {
                    onProgress(p);
                });
            }
            writeStream.on('finish', resolve);
            writeStream.on('error', error => {
                console.error('Error while writing file', error);
                fs_1.default.unlink(storedFilePath, () => {
                    reject(error);
                });
            });
            readStream.pipe(str).pipe(writeStream);
        });
    };
}
exports.default = default_1;
