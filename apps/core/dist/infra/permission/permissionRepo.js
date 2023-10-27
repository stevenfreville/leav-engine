"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USERS_GROUP_TREE_NAME = exports.USERS_GROUP_LIB_NAME = exports.USERS_GROUP_ATTRIBUTE_NAME = exports.PERM_COLLECTION_NAME = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
exports.PERM_COLLECTION_NAME = 'core_permissions';
exports.USERS_GROUP_ATTRIBUTE_NAME = 'user_groups';
exports.USERS_GROUP_LIB_NAME = 'users_groups';
exports.USERS_GROUP_TREE_NAME = 'users_groups';
function default_1({ 'core.infra.db.dbService': dbService = null, 'core.infra.db.dbUtils': dbUtils = null } = {}) {
    return {
        async savePermission({ permData, ctx }) {
            var _a;
            const userGroupToSave = (_a = permData.usersGroup) !== null && _a !== void 0 ? _a : null;
            // Upsert in permissions collection
            const col = dbService.db.collection(exports.PERM_COLLECTION_NAME);
            const dbPermData = Object.assign(Object.assign({}, permData), { usersGroup: userGroupToSave });
            const searchObj = {
                type: dbPermData.type,
                applyTo: dbPermData.applyTo,
                usersGroup: dbPermData.usersGroup,
                permissionTreeTarget: dbPermData.permissionTreeTarget
            };
            const res = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    UPSERT ${searchObj}
                    INSERT ${dbPermData}
                    UPDATE ${dbPermData}
                    IN ${col}
                    RETURN NEW
                `,
                ctx
            });
            const savedPerm = Object.assign(Object.assign({}, res[0]), { usersGroup: permData.usersGroup ? res[0].usersGroup : null });
            return dbUtils.cleanup(savedPerm);
        },
        async getPermissions({ type, applyTo = null, usersGroupNodeId, permissionTreeTarget = null, ctx }) {
            var _a;
            const col = dbService.db.collection(exports.PERM_COLLECTION_NAME);
            const userGroupToFilter = usersGroupNodeId !== null && usersGroupNodeId !== void 0 ? usersGroupNodeId : null;
            const query = (0, arangojs_1.aql) `
                FOR p IN ${col}
                FILTER p.type == ${type}
                    AND p.applyTo == ${applyTo}
                    AND p.usersGroup == ${userGroupToFilter}
                    AND p.permissionTreeTarget == ${permissionTreeTarget}
                RETURN p
            `;
            const res = await dbService.execute({ query, ctx });
            return (_a = res[0]) !== null && _a !== void 0 ? _a : null;
        }
    };
}
exports.default = default_1;
