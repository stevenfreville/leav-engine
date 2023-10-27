"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsListIOTypes = exports.ActionsListEvents = void 0;
var ActionsListEvents;
(function (ActionsListEvents) {
    ActionsListEvents["SAVE_VALUE"] = "saveValue";
    ActionsListEvents["DELETE_VALUE"] = "deleteValue";
    ActionsListEvents["GET_VALUE"] = "getValue";
})(ActionsListEvents = exports.ActionsListEvents || (exports.ActionsListEvents = {}));
var ActionsListIOTypes;
(function (ActionsListIOTypes) {
    ActionsListIOTypes["STRING"] = "string";
    ActionsListIOTypes["NUMBER"] = "number";
    ActionsListIOTypes["OBJECT"] = "object";
    ActionsListIOTypes["BOOLEAN"] = "boolean";
})(ActionsListIOTypes = exports.ActionsListIOTypes || (exports.ActionsListIOTypes = {}));
