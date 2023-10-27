"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventsManager_1 = require("../../../_types/eventsManager");
function default_1({ 'core.domain.eventsManager': eventsManagerDomain = null }) {
    return async (record, updatedValues, ctx) => {
        await eventsManagerDomain.sendPubSubEvent({
            triggerName: eventsManager_1.TriggerNames.RECORD_UPDATE,
            data: { recordUpdate: { record, updatedValues } }
        }, ctx);
    };
}
exports.default = default_1;
