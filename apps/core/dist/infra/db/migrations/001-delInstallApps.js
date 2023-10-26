"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const arangojs_1 = require("arangojs");
function default_1({ 'core.infra.db.dbService': dbService = null } = {}) {
    const _deleteInstallApps = async (ctx) => {
        const appsCollec = dbService.db.collection('core_applications');
        const query = (0, arangojs_1.aql) `
            FOR doc IN ${appsCollec}
                UPDATE doc WITH { 
                    install: null, 
                    module: doc.module == 'admin-app' ? 'admin' : doc.module 
                } IN ${appsCollec}
                OPTIONS { keepNull: false }
            RETURN NEW
        `;
        await dbService.execute({ query, ctx });
    };
    return {
        async run(ctx) {
            await _deleteInstallApps(ctx);
        }
    };
}
exports.default = default_1;
