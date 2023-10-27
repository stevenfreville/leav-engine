"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeEventTypes = exports.TreeBehavior = void 0;
var TreeBehavior;
(function (TreeBehavior) {
    TreeBehavior["STANDARD"] = "standard";
    TreeBehavior["FILES"] = "files";
})(TreeBehavior = exports.TreeBehavior || (exports.TreeBehavior = {}));
var TreeEventTypes;
(function (TreeEventTypes) {
    TreeEventTypes["ADD"] = "add";
    TreeEventTypes["REMOVE"] = "remove";
    TreeEventTypes["MOVE"] = "move";
})(TreeEventTypes = exports.TreeEventTypes || (exports.TreeEventTypes = {}));
