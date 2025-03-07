// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {getCallStack} from '@leav/utils';
import {Database} from 'arangojs';
import {Analyzer, CreateAnalyzerOptions} from 'arangojs/analyzer';
import {isAqlQuery} from 'arangojs/aql';
import {CollectionType} from 'arangojs/collection';
import {CreateViewOptions, View} from 'arangojs/view';
import {createHash} from 'crypto';
import {IUtils} from 'utils/utils';
import {IConfig} from '_types/config';
import {IDbProfiler} from '_types/dbProfiler';
import {IDbDocument, IExecute, IExecuteWithCount} from './_types';

const MAX_ATTEMPTS = 10;

export interface IDbService {
    db?: Database;
    /**
     * Execute an AQL query
     * If withTotalCount is set to true, return an object with totalCount and results. Otherwise, just return
     * results straight from DB.
     *
     * @param query
     * @param withTotalCount
     * @param attempts Used when we have to retry a query after a write-write conflict
     * @throws If query fails or we still have a conflict after all attempts
     */
    execute?<T extends IExecuteWithCount<unknown> | unknown[] = IDbDocument[]>(params: IExecute): Promise<T>;

    /**
     * Create a new collection in database
     *
     * @param name Collection name
     * @param type Document or edge collection?
     * @throws If collection already exists
     */
    createCollection?(name: string, type?: CollectionType): Promise<void> | null;

    /**
     * Delete a collection in database
     *
     * @param name Collection name
     * @param type Document or edge collection?
     * @throws If collection already exists
     */
    dropCollection?(name: string, type?: CollectionType): Promise<void> | null;

    /**
     * Check if collection already exists
     *
     * @param name
     */
    collectionExists?(name: string): Promise<boolean>;

    createAnalyzer?(name: string, options: CreateAnalyzerOptions): Promise<Analyzer>;

    /**
     * Create a view in database
     *
     * @param name View name
     * @param properties ArangoSearchView properties
     * @throws If collection not exists
     */
    createView?(name: string, options: CreateViewOptions): Promise<View>;

    views?(): Promise<View[]>;

    analyzers?(): Promise<Analyzer[]>;
}

interface IDeps {
    'core.infra.db'?: Database;
    'core.utils'?: IUtils;
    config?: IConfig;
}

export default function({
    'core.infra.db': db = null,
    'core.utils': utils = null,
    config = null
}: IDeps = {}): IDbService {
    const collectionExists = async function(name: string): Promise<boolean> {
        const collections = await db.listCollections();

        return collections.reduce((exists, c) => exists || c.name === name, false);
    };

    const _sleep = (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    return {
        db,
        async execute<T extends IExecuteWithCount<any> | any[] = any[]>({
            query,
            ctx,
            withTotalCount = false,
            attempts = 0
        }: IExecute): Promise<T> {
            try {
                if (config.dbProfiler.enable) {
                    const dbProfiler: IDbProfiler = ctx.dbProfiler ?? {
                        totalCount: 0,
                        uniqueQueriesCount: 0,
                        queries: {}
                    };

                    dbProfiler.totalCount = (dbProfiler.totalCount ?? 0) + 1;

                    // Generate a hash from the query to be able
                    // to group identical queries (exact same query with exact same params)
                    const queryKey = createHash('md5')
                        .update(JSON.stringify(query))
                        .digest('base64');

                    if (!dbProfiler.queries) {
                        dbProfiler.queries = {};
                    }

                    const callStack = JSON.stringify(getCallStack(10));

                    let callersStack = dbProfiler.queries?.[queryKey]?.callers ?? new Set();

                    if (!callersStack.add) {
                        callersStack = new Set();
                    }

                    dbProfiler.queries[queryKey] = {
                        count: (dbProfiler.queries?.[queryKey]?.count ?? 0) + 1,
                        callers: callersStack.add(callStack),
                        query
                    };

                    dbProfiler.uniqueQueriesCount = Object.keys(dbProfiler.queries).length;

                    ctx.dbProfiler = dbProfiler;
                }

                // Convert query to AqlQuery if we have a simple query to match query() types
                const queryToRun = isAqlQuery(query)
                    ? {...query}
                    : {
                          query,
                          bindVars: {}
                      };

                const queryOptions = withTotalCount ? {count: true, fullCount: true} : {};

                const cursor = await db.query(queryToRun, queryOptions);

                const results = await cursor.all();

                return (withTotalCount ? {totalCount: cursor.extra.stats.fullCount, results} : results) as T;
            } catch (e) {
                // Handle write-write conflicts: we try the query again with a growing delay between trials.
                // If we reach maximum attempts and still no success, stop it and throw the exception
                // error 1200 === conflict
                if (e.isArangoError && e.errorNum === 1200 && attempts < MAX_ATTEMPTS) {
                    const timeToWait = 2 ** attempts;
                    await _sleep(timeToWait);
                    return this.execute({query, ctx, withTotalCount, attempts: attempts + 1});
                }

                e.message += `\nQuery was: ${JSON.stringify(query).replace(/\\n/g, ' ')}`;
                e.query = query;

                // Response contains circular references which can cause an error when converted to JSON
                // later on. It doesn't contains useful information anyway, so throw it away.
                delete e.response;

                utils.rethrow(e);
            }
        },
        async createCollection(name: string, type: CollectionType): Promise<void> {
            if (await collectionExists(name)) {
                throw new Error(`Collection ${name} already exists`);
            }

            if (type === CollectionType.EDGE_COLLECTION) {
                await db.createCollection(name, {type: type as CollectionType.EDGE_COLLECTION});
            } else {
                await db.createCollection(name, {type: type as CollectionType.DOCUMENT_COLLECTION});
            }
        },
        async createAnalyzer(name: string, options: CreateAnalyzerOptions): Promise<Analyzer> {
            return db.createAnalyzer(name, options);
        },
        async createView(name: string, options: CreateViewOptions): Promise<View> {
            return db.createView(name, options);
        },
        async dropCollection(name: string, type = CollectionType.DOCUMENT_COLLECTION): Promise<void> {
            if (!(await collectionExists(name))) {
                throw new Error(`Collection ${name} does not exist`);
            }

            const collection = type === CollectionType.EDGE_COLLECTION ? db.collection(name) : db.collection(name);
            await collection.drop();
        },
        async views(): Promise<any> {
            return db.views();
        },
        async analyzers(): Promise<Analyzer[]> {
            return db.analyzers();
        },
        collectionExists
    };
}
