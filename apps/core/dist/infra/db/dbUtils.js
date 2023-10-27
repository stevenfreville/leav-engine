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
exports.MIGRATIONS_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const aql_1 = require("arangojs/aql");
const collection_1 = require("arangojs/collection");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const cacheService_1 = require("../../infra/cache/cacheService");
const runMigrationFiles_1 = __importDefault(require("./helpers/runMigrationFiles"));
exports.MIGRATIONS_COLLECTION_NAME = 'core_db_migrations';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.cache.cacheService': cacheService = null, 'core.utils.logger': logger = null, 'core.infra.plugins': pluginsRepo = null, config = null } = {}) {
    /**
     * Create the collections used to managed db migrations
     * This can't be in a migration file because we do have to initialize it somewhere
     *
     */
    async function _initMigrationsCollection() {
        const collections = await dbService.db.listCollections();
        const colExists = collections.reduce((exists, c) => exists || c.name === exports.MIGRATIONS_COLLECTION_NAME, false);
        if (!colExists) {
            const collection = dbService.db.collection(exports.MIGRATIONS_COLLECTION_NAME);
            await collection.create();
        }
    }
    /**
     * Return the filter's conditions based on key and val supplied.
     *
     * @param filterKey
     * @param filterVal
     * @param bindVars
     * @param index
     * @param strictFilters
     */
    function _getFilterCondition(filterKey, filterVal, strictFilters, nonStrictFields) {
        const queryParts = [];
        // If value is an array (types or formats for example),
        // we call this function recursively on array and join filters with an OR
        if (Array.isArray(filterVal)) {
            if (filterVal.length) {
                const valParts = filterVal.map(val => _getFilterCondition(filterKey, val, strictFilters, nonStrictFields));
                queryParts.push((0, aql_1.join)(valParts, ' OR '));
            }
        }
        else {
            if (filterKey === 'label') {
                // Search for label in any language
                const valParts = config.lang.available.map(l => (0, arangojs_1.aql) `LIKE(el.label.${l}, ${filterVal}, true)`);
                valParts.push((0, arangojs_1.aql) `LIKE(el.label, ${filterVal}, true)`); // In case label is not translated
                queryParts.push((0, aql_1.join)(valParts, ' OR '));
            }
            else {
                // Filter with a "like" on ID or exact value in other fields
                queryParts.push((nonStrictFields !== null && nonStrictFields !== void 0 ? nonStrictFields : []).includes(filterKey) && !strictFilters
                    ? (0, arangojs_1.aql) `LIKE(el.${filterKey}, ${filterVal}, true)`
                    : (0, arangojs_1.aql) `el.${filterKey} == ${filterVal}`);
            }
        }
        return (0, aql_1.join)(queryParts);
    }
    const ret = {
        /**
         * Run database migrations.
         * It takes all files present in migrations folder and run it if it's never been executed before
         *
         * @param depsManager
         */
        async migrate(depsManager) {
            await _initMigrationsCollection();
            const ctx = {
                userId: config.defaultUserId,
                queryId: 'run-migrations'
            };
            // Load already ran migrations
            const executedMigrations = await dbService.execute({
                query: `
                    FOR m IN core_db_migrations
                    RETURN m.file
                `,
                ctx
            });
            const _runMigrationFiles = (files, folder, prefix = null) => (0, runMigrationFiles_1.default)({
                files,
                executedMigrations,
                migrationsDir: folder,
                prefix,
                deps: { depsManager, dbService, logger },
                ctx
            });
            /*** Core migrations ***/
            // Load migrations files
            const migrationsDir = path.resolve(__dirname, 'migrations');
            const migrationFiles = (0, fs_1.readdirSync)(migrationsDir).filter(file => file.indexOf('.map') === -1);
            await _runMigrationFiles(migrationFiles, migrationsDir);
            /*** Plugins migrations ***/
            const plugins = pluginsRepo.getRegisteredPlugins();
            for (const plugin of plugins) {
                const pluginMigrationFolder = path.resolve(plugin.path + '/infra/db/migrations');
                try {
                    (0, fs_1.accessSync)(pluginMigrationFolder, fs_1.constants.R_OK);
                }
                catch (e) {
                    continue;
                }
                const pluginMigrationFiles = (0, fs_1.readdirSync)(pluginMigrationFolder).filter(file => file.indexOf('.map') === -1);
                await _runMigrationFiles(pluginMigrationFiles, pluginMigrationFolder, plugin.infos.name);
            }
            /** Clear cache */
            for (const cacheType of Object.values(cacheService_1.ECacheType)) {
                cacheService.getCache(cacheType).deleteAll();
            }
        },
        /**
         * Cleanup every system keys from an object coming from database.
         * _key is kept under 'id'
         *
         * @param obj
         * @return any   Cleaned up object
         */
        cleanup(obj) {
            if (obj === null || typeof obj === 'undefined') {
                return null;
            }
            return Object.keys(obj).reduce((newObj, key) => {
                if (key === '_key') {
                    newObj.id = obj[key];
                }
                else if (key[0] !== '_') {
                    newObj[key] = obj[key];
                }
                return newObj;
            }, {});
        },
        /**
         * Convert an object to an object looking like a DB document
         * id is replaced by _key
         *
         * @param obj
         * @return any   DB document compatible object
         */
        convertToDoc(obj) {
            const newObj = Object.assign({}, obj);
            if (typeof newObj.id !== 'undefined') {
                newObj._key = newObj.id;
            }
            delete newObj.id;
            return newObj;
        },
        /**
         * Search core entities (libraries, attributes, trees)
         *
         * @param collectionName
         * @param filters
         * @param strictFilters
         */
        async findCoreEntity(params) {
            const { collectionName = null, filters = null, strictFilters = false, withCount = false, pagination = null, sort = null, customFilterConditions = {}, nonStrictFields = ['label', '_key'], ctx = {} } = params;
            const collec = dbService.db.collection(collectionName);
            const queryParts = [(0, arangojs_1.aql) `FOR el IN ${collec}`];
            if (filters !== null) {
                const dbFilters = ret.convertToDoc(filters);
                const filtersKeys = Object.keys(dbFilters);
                for (const filterKey of filtersKeys) {
                    const filterVal = dbFilters[filterKey];
                    // Caller can define some custom functions to generate filter condition (like looking on edges to
                    // filter on libraries linked to an attribute). So, if a custom function is define for this filter,
                    // we use it, otherwise we use the standard filters
                    const filterCondsFunc = typeof customFilterConditions[filterKey] !== 'undefined'
                        ? customFilterConditions[filterKey]
                        : _getFilterCondition;
                    const conds = filterCondsFunc(filterKey, filterVal, strictFilters, nonStrictFields);
                    if (conds === null || conds === void 0 ? void 0 : conds.query) {
                        queryParts.push((0, arangojs_1.aql) `FILTER`, conds);
                    }
                }
            }
            if (!!sort) {
                const field = sort.field === 'id' ? '_key' : sort.field;
                queryParts.push((0, arangojs_1.aql) `SORT el.${field} ${sort.order}`);
            }
            if (!!pagination) {
                queryParts.push((0, arangojs_1.aql) `LIMIT ${pagination.offset || 0}, ${pagination.limit}`);
            }
            queryParts.push((0, arangojs_1.aql) `RETURN el`);
            const query = (0, aql_1.join)(queryParts);
            const res = await dbService.execute({ query, withTotalCount: withCount, ctx });
            const results = !Array.isArray(res) ? res.results : res;
            return {
                totalCount: withCount ? res.totalCount : null,
                list: results.map(ret.cleanup)
            };
        },
        convertValueVersionToDb(version) {
            return Object.keys(version).reduce((allVers, treeName) => {
                const id = version[treeName];
                allVers[treeName] = id;
                return allVers;
            }, {});
        },
        async clearDatabase() {
            // Drop all collections
            const cols = await dbService.db.listCollections();
            for (const col of cols) {
                const colType = col.type === collection_1.CollectionType.DOCUMENT_COLLECTION
                    ? collection_1.CollectionType.DOCUMENT_COLLECTION
                    : collection_1.CollectionType.EDGE_COLLECTION;
                await dbService.dropCollection(col.name, colType);
                // TODO: clear linked arango views
            }
        }
    };
    return ret;
}
exports.default = default_1;
