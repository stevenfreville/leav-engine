"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../_types/actionsList");
const attribute_1 = require("../../_types/attribute");
exports.default = (attribute) => {
    if (attribute.type !== attribute_1.AttributeTypes.SIMPLE && attribute.type !== attribute_1.AttributeTypes.ADVANCED) {
        return {};
    }
    let defaultActions = {};
    switch (attribute.format) {
        case attribute_1.AttributeFormats.NUMERIC:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'toNumber',
                        name: 'To Number',
                        is_system: true
                    },
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ],
                [actionsList_1.ActionsListEvents.GET_VALUE]: []
            };
            break;
        case attribute_1.AttributeFormats.DATE:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'toNumber',
                        name: 'To Number',
                        is_system: true
                    },
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [
                    {
                        id: 'formatDate',
                        name: 'Format Date',
                        is_system: false
                    }
                ]
            };
            break;
        case attribute_1.AttributeFormats.BOOLEAN:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'toBoolean',
                        name: 'To Boolean',
                        is_system: true
                    },
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ]
            };
            break;
        case attribute_1.AttributeFormats.ENCRYPTED:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    },
                    {
                        id: 'encrypt',
                        name: 'Encrypt',
                        is_system: true
                    }
                ],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [
                    {
                        id: 'toBoolean',
                        name: 'To Boolean',
                        is_system: true
                    }
                ]
            };
            break;
        case attribute_1.AttributeFormats.EXTENDED:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'parseJSON',
                        name: 'Parse JSON',
                        is_system: true
                    },
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [
                    {
                        is_system: true,
                        id: 'toJSON',
                        name: 'To JSON'
                    }
                ]
            };
            break;
        case attribute_1.AttributeFormats.DATE_RANGE:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'parseJSON',
                        name: 'Parse JSON',
                        is_system: true
                    },
                    {
                        id: 'dateRangeToNumber',
                        name: 'dateRangeToNumber',
                        is_system: true
                    },
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ],
                [actionsList_1.ActionsListEvents.GET_VALUE]: [
                    {
                        id: 'formatDateRange',
                        name: 'Format Date Range',
                        is_system: false
                    }
                ]
            };
            break;
        default:
            defaultActions = {
                [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                    {
                        id: 'validateFormat',
                        name: 'Validate Format',
                        is_system: true
                    }
                ]
            };
            break;
    }
    return Object.assign({ [actionsList_1.ActionsListEvents.GET_VALUE]: [], [actionsList_1.ActionsListEvents.SAVE_VALUE]: [], [actionsList_1.ActionsListEvents.DELETE_VALUE]: [] }, defaultActions);
};
