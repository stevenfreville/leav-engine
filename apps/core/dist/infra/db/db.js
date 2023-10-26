"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const _getDbConnection = (config) => {
    return new arangojs_1.Database({
        url: config.db.url
    });
};
function default_1(deps) {
    const db = _getDbConnection(deps.config);
    return db.database(deps.config.db.name);
}
exports.default = default_1;
const initDb = async (config) => {
    const db = _getDbConnection(config);
    const databases = await db.listDatabases();
    const dbExists = databases.reduce((exists, d) => exists || d === config.db.name, false);
    if (!dbExists) {
        await db.createDatabase(config.db.name);
    }
    db.close();
};
exports.initDb = initDb;
