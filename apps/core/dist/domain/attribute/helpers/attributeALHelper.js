"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionsListToSave = exports.getAllowedOutputTypes = exports.getAllowedInputTypes = void 0;
const actionsList_1 = require("../../../_types/actionsList");
const attribute_1 = require("../../../_types/attribute");
const getAllowedInputTypes = (attribute) => {
    let inputTypes;
    switch (attribute.format) {
        case attribute_1.AttributeFormats.NUMERIC:
        case attribute_1.AttributeFormats.DATE:
            inputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.NUMBER],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [actionsList_1.ActionsListIOTypes.NUMBER],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.NUMBER]
            };
            break;
        case attribute_1.AttributeFormats.BOOLEAN:
            inputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.BOOLEAN],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [actionsList_1.ActionsListIOTypes.BOOLEAN],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.BOOLEAN]
            };
            break;
        case attribute_1.AttributeFormats.DATE_RANGE:
            inputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [actionsList_1.ActionsListIOTypes.OBJECT],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING]
            };
            break;
        default:
            inputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [actionsList_1.ActionsListIOTypes.STRING],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING]
            };
            break;
    }
    return inputTypes;
};
exports.getAllowedInputTypes = getAllowedInputTypes;
const getAllowedOutputTypes = (attribute) => {
    let outputTypes;
    switch (attribute.format) {
        case attribute_1.AttributeFormats.NUMERIC:
        case attribute_1.AttributeFormats.DATE:
            outputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.NUMBER],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.NUMBER]
            };
            break;
        case attribute_1.AttributeFormats.BOOLEAN:
            outputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.BOOLEAN],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.BOOLEAN]
            };
            break;
        case attribute_1.AttributeFormats.EXTENDED:
        case attribute_1.AttributeFormats.DATE_RANGE:
            outputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.OBJECT],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.OBJECT]
            };
            break;
        default:
            outputTypes = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: [actionsList_1.ActionsListIOTypes.STRING]
            };
            break;
    }
    outputTypes[actionsList_1.ActionsListEvents.GET_VALUE] = Object.values(actionsList_1.ActionsListIOTypes);
    return outputTypes;
};
exports.getAllowedOutputTypes = getAllowedOutputTypes;
const getActionsListToSave = (attrDataToSave, existingAttrData, newAttr, utils) => {
    let alToSave = null;
    if (!newAttr) {
        if (attrDataToSave.actions_list) {
            // We need to merge actions list to save with existing actions list to make sure we keep
            // the is_system flag to true on system actions
            const existingAL = existingAttrData.actions_list || {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [],
                [actionsList_1.ActionsListEvents.DELETE_VALUE]: []
            };
            alToSave = Object.values(actionsList_1.ActionsListEvents).reduce((allALs, evName) => {
                // Merge each action with existing system action. If there's no matching system action, we force
                // the flag to false
                allALs[evName] = attrDataToSave.actions_list[evName]
                    ? attrDataToSave.actions_list[evName].map(actionToSave => {
                        var _a, _b;
                        const sysActionIndex = ((_a = existingAL[evName]) !== null && _a !== void 0 ? _a : []).findIndex(al => al.id === actionToSave.id && al.is_system);
                        return Object.assign(Object.assign({ is_system: false }, (_b = existingAL[evName]) === null || _b === void 0 ? void 0 : _b[sysActionIndex]), actionToSave);
                    })
                    : [];
                return allALs;
            }, {});
        }
    }
    else {
        // set is_system to false of new actions
        attrDataToSave.actions_list = Object.entries(attrDataToSave.actions_list || {}).reduce((acc, [k, v]) => (Object.assign(Object.assign({}, acc), { [k]: v.map(a => (Object.assign(Object.assign({}, a), { is_system: false }))) })), {});
        alToSave = utils.mergeConcat(utils.getDefaultActionsList(attrDataToSave), attrDataToSave.actions_list);
    }
    return alToSave;
};
exports.getActionsListToSave = getActionsListToSave;
