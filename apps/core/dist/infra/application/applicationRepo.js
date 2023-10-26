"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPLICATIONS_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const app_root_path_1 = require("@leav/app-root-path");
const arangojs_1 = require("arangojs");
const promises_1 = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports.APPLICATIONS_COLLECTION_NAME = 'core_applications';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.utils.logger': logger = null, config = null } = {}) {
    return {
        async getApplications({ params, ctx }) {
            const defaultParams = {
                filters: null,
                strictFilters: false,
                withCount: false,
                pagination: null,
                sort: null
            };
            const initializedParams = Object.assign(Object.assign({}, defaultParams), params);
            return dbUtils.findCoreEntity(Object.assign(Object.assign({}, initializedParams), { collectionName: exports.APPLICATIONS_COLLECTION_NAME, nonStrictFields: ['label', 'id', 'endpoint'], ctx }));
        },
        async updateApplication({ applicationData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(applicationData);
            const col = dbService.db.collection(exports.APPLICATIONS_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `UPDATE ${docToInsert} IN ${col} OPTIONS { mergeObjects: false } RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async createApplication({ applicationData, ctx }) {
            const docToInsert = dbUtils.convertToDoc(applicationData);
            // Insert in applications collection
            const col = dbService.db.collection(exports.APPLICATIONS_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `INSERT ${docToInsert} IN ${col} RETURN NEW`,
                ctx
            });
            return dbUtils.cleanup(res.pop());
        },
        async deleteApplication({ id, ctx }) {
            // Delete attribute
            const col = dbService.db.collection(exports.APPLICATIONS_COLLECTION_NAME);
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `REMOVE ${{ _key: id }} IN ${col} RETURN OLD`,
                ctx
            });
            // Return deleted attribute
            return dbUtils.cleanup(res.pop());
        },
        async getAvailableModules() {
            const rootPath = (0, app_root_path_1.appRootPath)();
            const appRootFolder = path_1.default.resolve(rootPath, config.applications.rootFolder);
            let appsFolders = await (0, promises_1.readdir)(appRootFolder);
            appsFolders = appsFolders.filter(item => !/(^|\/)\.[^\/\.]/g.test(item)); // ignore hidden files
            const components = await appsFolders.reduce(async (accProm, appFolder) => {
                const acc = await accProm;
                const appPath = path_1.default.resolve(appRootFolder, appFolder);
                const manifestPath = path_1.default.resolve(appPath, 'manifest.json');
                // Check if manifest file exists. If not, just ignore the folder
                try {
                    await promises_1.default.stat(manifestPath);
                }
                catch (e) {
                    logger.warn(`Manifest file not found for module "${appPath}"`);
                    return acc;
                }
                const appManifestJson = await Promise.resolve().then(() => __importStar(require(path_1.default.resolve(appPath, 'manifest.json'))));
                acc.push({
                    id: appManifestJson.name,
                    description: appManifestJson.description,
                    version: appManifestJson.version
                });
                return acc;
            }, Promise.resolve([]));
            return components;
        }
    };
}
exports.default = default_1;
