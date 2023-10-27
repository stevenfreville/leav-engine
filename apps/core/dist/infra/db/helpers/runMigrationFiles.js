"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const awilix_1 = require("awilix");
const dbUtils_1 = require("../dbUtils");
const loadMigrationFile_1 = __importDefault(require("./loadMigrationFile"));
exports.default = async (params) => {
    const { files, executedMigrations, migrationsDir, prefix = null, deps, ctx } = params;
    for (const file of files) {
        // Check if it's been run before
        const fileKey = prefix ? [prefix, file].join('/') : file;
        if (typeof executedMigrations.find(el => el === fileKey) === 'undefined') {
            const importedFile = await (0, loadMigrationFile_1.default)(migrationsDir + '/' + file);
            if (typeof importedFile.default !== 'function') {
                throw new Error(`[DB Migration Error] ${fileKey}: Migration files' default export must be a function`);
            }
            try {
                deps.logger.info(`[DB Migration] Executing ${fileKey}...`);
                // Run migration
                const migration = deps.depsManager.build((0, awilix_1.asFunction)(importedFile.default));
                await migration.run(ctx);
                // Store migration execution to DB
                const collection = deps.dbService.db.collection(dbUtils_1.MIGRATIONS_COLLECTION_NAME);
                await collection.save({
                    file: fileKey,
                    date: Date.now()
                });
            }
            catch (err) {
                err.message = `[DB Migration Error] ${fileKey}: } ${err.message}`;
                throw err;
            }
        }
    }
};
