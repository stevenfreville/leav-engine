"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const arangojs_1 = require("arangojs");
const actionsList_1 = require("../../../_types/actionsList");
const attribute_1 = require("../../../_types/attribute");
const library_1 = require("../../../_types/library");
function default_1({ 'core.infra.attribute': attributeRepo = null, 'core.infra.library': libraryRepo = null, 'core.infra.db.dbService': dbService = null } = {}) {
    return {
        async run(ctx) {
            const commonAttributeData = {
                system: true,
                multiple_values: false,
                versions_conf: { versionable: false },
                readonly: true,
                actions_list: {
                    [actionsList_1.ActionsListEvents.GET_VALUE]: [],
                    [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                        {
                            id: 'validateFormat',
                            name: 'Validate Format',
                            is_system: true
                        }
                    ],
                    [actionsList_1.ActionsListEvents.DELETE_VALUE]: []
                }
            };
            const attributesToCreate = [
                Object.assign(Object.assign({}, commonAttributeData), { id: 'file_size', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: 'Taille du fichier',
                        en: 'File size'
                    }, description: {
                        fr: 'Taille en octets',
                        en: 'Size in bytes'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ''
                                    }
                                ]
                            }
                        ] }) }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'mime_type1', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: {
                        fr: 'Type MIME 1',
                        en: 'MIME type 1'
                    } }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'mime_type2', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: {
                        fr: 'Type MIME 2',
                        en: 'MIME type 2'
                    } }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'has_clipping_path', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.BOOLEAN, label: {
                        fr: 'Masque de détourage détecté',
                        en: 'Clipping path detected'
                    } }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'color_space', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: {
                        fr: 'Espace colorimétrique',
                        en: 'Color space'
                    } }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'color_profile', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: {
                        fr: 'Profil colorimétrique',
                        en: 'Color profile'
                    } }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'width', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: 'Largeur',
                        en: 'Width'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ' px'
                                    }
                                ]
                            }
                        ] }) }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'height', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: 'Hauteur',
                        en: 'Height'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ' px'
                                    }
                                ]
                            }
                        ] }) }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'print_width', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: "Largeur d'impression",
                        en: 'Print width'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ' mm'
                                    }
                                ]
                            }
                        ] }) }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'print_height', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: "Hauteur d'impression",
                        en: 'Print height'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ' mm'
                                    }
                                ]
                            }
                        ] }) }),
                Object.assign(Object.assign({}, commonAttributeData), { id: 'resolution', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: {
                        fr: 'Résolution',
                        en: 'Resolution'
                    }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                        ], [actionsList_1.ActionsListEvents.GET_VALUE]: [
                            ...commonAttributeData.actions_list[actionsList_1.ActionsListEvents.GET_VALUE],
                            {
                                id: 'formatNumber',
                                is_system: false,
                                params: [
                                    {
                                        name: 'decimals',
                                        value: '0'
                                    },
                                    {
                                        name: 'thousandsSeparator',
                                        value: ' '
                                    },
                                    {
                                        name: 'decimalsSeparator',
                                        value: ','
                                    },
                                    {
                                        name: 'prefix',
                                        value: ''
                                    },
                                    {
                                        name: 'suffix',
                                        value: ' dpi'
                                    }
                                ]
                            }
                        ] }) })
            ];
            /** Create attributes */
            // Check if attribute already exists
            await Promise.all(attributesToCreate.map(async (attribute) => {
                const existingAttribute = await attributeRepo.getAttributes({
                    params: {
                        filters: { id: attribute.id }
                    },
                    ctx
                });
                if (!existingAttribute.list.length) {
                    await attributeRepo.createAttribute({
                        attrData: attribute,
                        ctx
                    });
                }
            }));
            // Add attributes to all files libraries
            const filesLibraries = await dbService.execute({
                query: (0, arangojs_1.aql) `
                    FOR library IN core_libraries
                        FILTER library.behavior == ${library_1.LibraryBehavior.FILES}
                        RETURN library
                `,
                ctx
            });
            const attributesToAdd = attributesToCreate.map(attribute => attribute.id);
            await Promise.all(filesLibraries.map(async (library) => libraryRepo.saveLibraryAttributes({
                attributes: attributesToAdd,
                libId: library._key,
                insertOnly: true,
                ctx
            })));
        }
    };
}
exports.default = default_1;
