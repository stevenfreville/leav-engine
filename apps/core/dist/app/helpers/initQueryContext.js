"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
function default_1({ config = null }) {
    return (req) => {
        var _a;
        return ({
            userId: null,
            lang: (_a = req.query.lang) !== null && _a !== void 0 ? _a : config.lang.default,
            queryId: req.body.requestId || (0, uuid_1.v4)(),
            groupsId: []
        });
    };
}
exports.default = default_1;
