"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = exports.TaskCallbackStatus = exports.TaskCallbackType = exports.TaskPriority = exports.TaskStatus = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["CREATE"] = "CREATE";
    OrderType["CANCEL"] = "CANCEL";
    OrderType["DELETE"] = "DELETE";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["CREATED"] = "CREATED";
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["RUNNING"] = "RUNNING";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["PENDING_CANCEL"] = "PENDING_CANCEL";
    TaskStatus["CANCELED"] = "CANCELED";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 0] = "LOW";
    TaskPriority[TaskPriority["MEDIUM"] = 1] = "MEDIUM";
    TaskPriority[TaskPriority["HIGH"] = 2] = "HIGH";
})(TaskPriority = exports.TaskPriority || (exports.TaskPriority = {}));
var TaskCallbackType;
(function (TaskCallbackType) {
    TaskCallbackType["ON_SUCCESS"] = "ON_SUCCESS";
    TaskCallbackType["ON_FAILURE"] = "ON_FAILURE";
    TaskCallbackType["ON_CANCEL"] = "ON_CANCEL";
})(TaskCallbackType = exports.TaskCallbackType || (exports.TaskCallbackType = {}));
var TaskCallbackStatus;
(function (TaskCallbackStatus) {
    TaskCallbackStatus["PENDING"] = "PENDING";
    TaskCallbackStatus["RUNNING"] = "RUNNING";
    TaskCallbackStatus["FAILED"] = "FAILED";
    TaskCallbackStatus["DONE"] = "DONE";
    TaskCallbackStatus["SKIPPED"] = "SKIPPED";
})(TaskCallbackStatus = exports.TaskCallbackStatus || (exports.TaskCallbackStatus = {}));
var TaskType;
(function (TaskType) {
    TaskType["EXPORT"] = "EXPORT";
    TaskType["IMPORT_CONFIG"] = "IMPORT_CONFIG";
    TaskType["IMPORT_DATA"] = "IMPORT_DATA";
    TaskType["INDEXATION"] = "INDEXATION";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
