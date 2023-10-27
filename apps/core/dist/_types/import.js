"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = exports.ImportMode = exports.ImportType = void 0;
var ImportType;
(function (ImportType) {
    ImportType["IGNORE"] = "IGNORE";
    ImportType["STANDARD"] = "STANDARD";
    ImportType["LINK"] = "LINK";
})(ImportType = exports.ImportType || (exports.ImportType = {}));
var ImportMode;
(function (ImportMode) {
    ImportMode["INSERT"] = "insert";
    ImportMode["UPDATE"] = "update";
    ImportMode["UPSERT"] = "upsert";
})(ImportMode = exports.ImportMode || (exports.ImportMode = {}));
var Action;
(function (Action) {
    Action["ADD"] = "add";
    Action["REPLACE"] = "replace";
    Action["UPDATE"] = "update";
    Action["REMOVE"] = "remove";
})(Action = exports.Action || (exports.Action = {}));
