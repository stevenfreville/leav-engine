"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const aql_1 = require("arangojs/aql");
const collection_1 = require("arangojs/collection");
const crypto_1 = require("crypto");
const MAX_ATTEMPTS = 10;
function default_1({ 'core.infra.db': db = null, 'core.utils': utils = null, config = null } = {}) {
    const collectionExists = async function (name) {
        const collections = await db.listCollections();
        return collections.reduce((exists, c) => exists || c.name === name, false);
    };
    const _sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    return {
        db,
        async execute({ query, ctx, withTotalCount = false, attempts = 0 }) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                if (config.dbProfiler.enable) {
                    const dbProfiler = (_a = ctx.dbProfiler) !== null && _a !== void 0 ? _a : {
                        totalCount: 0,
                        uniqueQueriesCount: 0,
                        queries: {}
                    };
                    dbProfiler.totalCount = ((_b = dbProfiler.totalCount) !== null && _b !== void 0 ? _b : 0) + 1;
                    // Generate a hash from the query to be able
                    // to group identical queries (exact same query with exact same params)
                    const queryKey = (0, crypto_1.createHash)('md5')
                        .update(JSON.stringify(query))
                        .digest('base64');
                    if (!dbProfiler.queries) {
                        dbProfiler.queries = {};
                    }
                    const callStack = JSON.stringify((0, utils_1.getCallStack)(10));
                    let callersStack = (_e = (_d = (_c = dbProfiler.queries) === null || _c === void 0 ? void 0 : _c[queryKey]) === null || _d === void 0 ? void 0 : _d.callers) !== null && _e !== void 0 ? _e : new Set();
                    if (!callersStack.add) {
                        callersStack = new Set();
                    }
                    dbProfiler.queries[queryKey] = {
                        count: ((_h = (_g = (_f = dbProfiler.queries) === null || _f === void 0 ? void 0 : _f[queryKey]) === null || _g === void 0 ? void 0 : _g.count) !== null && _h !== void 0 ? _h : 0) + 1,
                        callers: callersStack.add(callStack),
                        query
                    };
                    dbProfiler.uniqueQueriesCount = Object.keys(dbProfiler.queries).length;
                    ctx.dbProfiler = dbProfiler;
                }
                // Convert query to AqlQuery if we have a simple query to match query() types
                const queryToRun = (0, aql_1.isAqlQuery)(query)
                    ? Object.assign({}, query) : {
                    query,
                    bindVars: {}
                };
                const queryOptions = withTotalCount ? { count: true, fullCount: true } : {};
                const cursor = await db.query(queryToRun, queryOptions);
                const results = await cursor.all();
                return (withTotalCount ? { totalCount: cursor.extra.stats.fullCount, results } : results);
            }
            catch (e) {
                // Handle write-write conflicts: we try the query again with a growing delay between trials.
                // If we reach maximum attempts and still no success, stop it and throw the exception
                // error 1200 === conflict
                if (e.isArangoError && e.errorNum === 1200 && attempts < MAX_ATTEMPTS) {
                    const timeToWait = 2 ** attempts;
                    await _sleep(timeToWait);
                    return this.execute({ query, ctx, withTotalCount, attempts: attempts + 1 });
                }
                e.message += `\nQuery was: ${JSON.stringify(query).replace(/\\n/g, ' ')}`;
                e.query = query;
                // Response contains circular references which can cause an error when converted to JSON
                // later on. It doesn't contains useful information anyway, so throw it away.
                delete e.response;
                utils.rethrow(e);
            }
        },
        async createCollection(name, type) {
            if (await collectionExists(name)) {
                throw new Error(`Collection ${name} already exists`);
            }
            if (type === collection_1.CollectionType.EDGE_COLLECTION) {
                await db.createCollection(name, { type: type });
            }
            else {
                await db.createCollection(name, { type: type });
            }
        },
        async createAnalyzer(name, options) {
            return db.createAnalyzer(name, options);
        },
        async createView(name, options) {
            return db.createView(name, options);
        },
        async dropCollection(name, type = collection_1.CollectionType.DOCUMENT_COLLECTION) {
            if (!(await collectionExists(name))) {
                throw new Error(`Collection ${name} does not exist`);
            }
            const collection = type === collection_1.CollectionType.EDGE_COLLECTION ? db.collection(name) : db.collection(name);
            await collection.drop();
        },
        async views() {
            return db.views();
        },
        async analyzers() {
            return db.analyzers();
        },
        collectionExists
    };
}
exports.default = default_1;
