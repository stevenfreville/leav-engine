"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormatFromAttribute = exports.getFormatFromALConf = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../../../_types/actionsList");
const attribute_1 = require("../../../../_types/attribute");
const getFormatFromALConf = async (actions, { 'core.domain.actionsList': actionsListDomain = null }) => {
    // Get actions list output type if any
    const availableActions = await actionsListDomain.getAvailableActions();
    const lastActionConf = [...actions].pop();
    const lastActionSettings = availableActions.filter(al => lastActionConf.id === al.id)[0];
    if (!lastActionSettings) {
        return null;
    }
    if (lastActionSettings.output_types.length > 1) {
        return 'Any';
    }
    else {
        switch (lastActionSettings.output_types[0]) {
            case actionsList_1.ActionsListIOTypes.STRING:
                return 'String';
            case actionsList_1.ActionsListIOTypes.NUMBER:
                return 'Float';
            case actionsList_1.ActionsListIOTypes.BOOLEAN:
                return 'Boolean';
            case actionsList_1.ActionsListIOTypes.OBJECT:
                return 'JSONObject';
        }
    }
};
exports.getFormatFromALConf = getFormatFromALConf;
const getFormatFromAttribute = (format) => {
    switch (format) {
        case attribute_1.AttributeFormats.TEXT:
        case attribute_1.AttributeFormats.ENCRYPTED:
        case attribute_1.AttributeFormats.COLOR:
        case attribute_1.AttributeFormats.RICH_TEXT:
            return 'String';
        case attribute_1.AttributeFormats.NUMERIC:
            return 'Float';
        case attribute_1.AttributeFormats.DATE:
            return 'Int';
        case attribute_1.AttributeFormats.BOOLEAN:
            return 'Boolean';
        case attribute_1.AttributeFormats.EXTENDED:
            return 'JSONObject';
        case attribute_1.AttributeFormats.DATE_RANGE:
            return 'DateRangeValue';
    }
};
exports.getFormatFromAttribute = getFormatFromAttribute;
