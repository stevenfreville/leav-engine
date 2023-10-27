"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const errors_1 = require("../../../_types/errors");
exports.default = async (permissionsConf, deps, ctx) => {
    const errors = {};
    if (typeof permissionsConf === 'undefined') {
        return {};
    }
    const availableTreeAttributes = await deps.attributeDomain.getAttributes({ ctx });
    const unknownTreeAttributes = (0, lodash_1.difference)(permissionsConf.permissionTreeAttributes, availableTreeAttributes.list.map(treeAttr => treeAttr.id));
    if (unknownTreeAttributes.length) {
        errors.permissions_conf = {
            msg: errors_1.Errors.UNKNOWN_ATTRIBUTES,
            vars: { attributes: unknownTreeAttributes.join(', ') }
        };
    }
    return errors;
};
