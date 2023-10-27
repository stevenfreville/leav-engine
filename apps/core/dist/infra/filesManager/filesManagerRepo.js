"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aql_1 = require("arangojs/aql");
const path_1 = require("path");
const filesManager_1 = require("../../_types/filesManager");
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null, 'core.utils.logger': logger = null }) {
    return {
        async getRecord({ fileName, filePath, fileInode }, { recordLibrary, recordId }, retrieveInactive, ctx) {
            const coll = dbService.db.collection(recordLibrary);
            const queryParts = [(0, aql_1.aql) `FOR r in ${coll}`];
            let results;
            if (recordId) {
                queryParts.push((0, aql_1.aql) `FILTER (r.id == ${recordId})`);
            }
            else if (!!fileInode) {
                queryParts.push((0, aql_1.aql) `FILTER (r.${filesManager_1.FilesAttributes.INODE} == ${fileInode}
                        OR (r.${filesManager_1.FilesAttributes.FILE_PATH} == ${filePath} AND r.${filesManager_1.FilesAttributes.FILE_NAME} == ${fileName})
                    )`);
            }
            else {
                queryParts.push((0, aql_1.aql) `FILTER (r.${filesManager_1.FilesAttributes.FILE_PATH} == ${filePath}
                        AND r.${filesManager_1.FilesAttributes.FILE_NAME} == ${fileName}
                    )`);
            }
            if (!retrieveInactive) {
                queryParts.push((0, aql_1.aql) `FILTER r.active == true`);
            }
            queryParts.push((0, aql_1.aql) `SORT r._key DESC`);
            queryParts.push((0, aql_1.aql) `RETURN MERGE(r, {library: ${recordLibrary}})`);
            const query = (0, aql_1.join)(queryParts, '\n');
            try {
                results = await dbService.execute({
                    query,
                    withTotalCount: false,
                    ctx
                });
            }
            catch (e) {
                return null;
            }
            const count = results.length;
            if (count === 0) {
                return null;
            }
            if (count > 1) {
                logger.warn(`[FilesManager] Multiple record found using fileName and filePath: ${results.toString()}`);
            }
            return dbUtils.cleanup(results[0]);
        },
        async getParentRecord(fullParentPath, library, ctx) {
            let parentPath = fullParentPath.split('/');
            const parentName = parentPath.pop();
            if (parentPath.length === 0) {
                parentPath = ['.'];
            }
            const coll = dbService.db.collection(library);
            const query = (0, aql_1.aql) `FOR r in ${coll} FILTER (r.${filesManager_1.FilesAttributes.FILE_NAME} == ${parentName} AND r.${filesManager_1.FilesAttributes.FILE_PATH} == ${(0, path_1.join)(...parentPath)}) RETURN MERGE(r, {library: ${library}})`;
            let results;
            try {
                results = await dbService.execute({
                    query,
                    withTotalCount: false,
                    ctx
                });
            }
            catch (e) {
                logger.warn(`[FilesManager] Error when search parent folder : ${fullParentPath}`);
                return null;
            }
            const parent = results[0] ? dbUtils.cleanup(results[0]) : null;
            return parent;
        }
    };
}
exports.default = default_1;
