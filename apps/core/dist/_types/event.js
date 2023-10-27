"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventAction = void 0;
/* Database events */
var EventAction;
(function (EventAction) {
    EventAction["RECORD_SAVE"] = "RECORD_SAVE";
    EventAction["RECORD_DELETE"] = "RECORD_DELETE";
    EventAction["LIBRARY_SAVE"] = "LIBRARY_SAVE";
    EventAction["LIBRARY_DELETE"] = "LIBRARY_DELETE";
    EventAction["ATTRIBUTE_SAVE"] = "ATTRIBUTE_SAVE";
    EventAction["ATTRIBUTE_DELETE"] = "ATTRIBUTE_DELETE";
    EventAction["VALUE_SAVE"] = "VALUE_SAVE";
    EventAction["VALUE_DELETE"] = "VALUE_DELETE";
})(EventAction = exports.EventAction || (exports.EventAction = {}));
