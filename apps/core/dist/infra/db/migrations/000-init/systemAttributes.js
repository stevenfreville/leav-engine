"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemAttributes = void 0;
const actionsList_1 = require("../../../../_types/actionsList");
const attribute_1 = require("../../../../_types/attribute");
const commonAttributeData = {
    system: true,
    multiple_values: false,
    versions_conf: { versionable: false },
    readonly: false,
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
const previewStatusSubFields = [
    {
        id: 'status',
        format: attribute_1.AttributeFormats.NUMERIC
    },
    {
        id: 'message',
        format: attribute_1.AttributeFormats.TEXT
    }
];
exports.systemAttributes = [
    Object.assign(Object.assign({}, commonAttributeData), { id: 'id', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Identifiant', en: 'Identifier' }, readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'created_by', linked_library: 'users', type: attribute_1.AttributeTypes.SIMPLE_LINK, label: { fr: 'Créé par', en: 'Created by' }, readonly: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { saveValue: [] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'created_at', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.DATE, label: { fr: 'Date de création', en: 'Creation date' }, readonly: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                {
                    id: 'formatDate',
                    name: 'Format Date',
                    is_system: false,
                    params: [
                        {
                            name: 'format',
                            value: 'DD/MM/YYYY HH:mm:ss'
                        }
                    ]
                }
            ] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'modified_by', linked_library: 'users', type: attribute_1.AttributeTypes.SIMPLE_LINK, label: { fr: 'Modifié par', en: 'Modified by' }, readonly: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { saveValue: [] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'modified_at', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.DATE, label: { fr: 'Date de modification', en: 'Modification date' }, readonly: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
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
                {
                    id: 'formatDate',
                    name: 'Format Date',
                    is_system: false,
                    params: [
                        {
                            name: 'format',
                            value: 'DD/MM/YYYY HH:mm:ss'
                        }
                    ]
                }
            ] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { system: false, id: 'label', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Libellé', en: 'Label' } }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'login', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Login', en: 'Login' }, unique: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'email', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Email', en: 'Email' }, readonly: false, unique: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                {
                    id: 'validateFormat',
                    name: 'Validate Format',
                    is_system: true
                },
                {
                    id: 'validateEmail',
                    name: 'Validate Email',
                    is_system: true
                }
            ] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'password', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.ENCRYPTED, label: { fr: 'Mot de passe', en: 'Password' }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { saveValue: [
                {
                    id: 'validateFormat',
                    name: 'validateFormat',
                    is_system: true
                },
                {
                    id: 'validateRegex',
                    name: 'Validate Regex',
                    is_system: true,
                    params: [
                        {
                            name: 'regex',
                            // prettier-ignore
                            // Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
                            value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})'
                        }
                    ]
                },
                {
                    id: 'encrypt',
                    name: 'encrypt',
                    is_system: true
                }
            ] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'user_groups', type: attribute_1.AttributeTypes.TREE, label: {
            fr: "Groupes de l'utilisateur",
            en: 'User groups'
        }, linked_tree: 'users_groups', multiple_values: true, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { saveValue: [] }) }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'root_key', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Clé racine', en: 'Root key' }, readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'hash', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Hash', en: 'Hash' }, readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'file_path', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Chemin du fichier', en: 'File path' }, readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'file_name', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.TEXT, label: { fr: 'Nom du fichier', en: 'File name' }, readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'inode', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.NUMERIC, label: { fr: 'Inode', en: 'Inode' }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                {
                    id: 'validateFormat',
                    name: 'Validate Format',
                    is_system: true
                },
                {
                    id: 'toNumber',
                    name: 'To Number',
                    is_system: true
                }
            ] }), readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'previews', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.EXTENDED, embedded_fields: [
            {
                id: 'tiny',
                format: attribute_1.AttributeFormats.TEXT
            },
            {
                id: 'small',
                format: attribute_1.AttributeFormats.TEXT
            },
            {
                id: 'medium',
                format: attribute_1.AttributeFormats.TEXT
            },
            {
                id: 'big',
                format: attribute_1.AttributeFormats.TEXT
            },
            {
                id: 'huge',
                format: attribute_1.AttributeFormats.TEXT
            },
            {
                id: 'pdf',
                format: attribute_1.AttributeFormats.TEXT
            }
        ], label: { fr: 'Aperçus', en: 'Previews' }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.GET_VALUE]: [
                {
                    is_system: true,
                    id: 'toJSON',
                    name: 'To JSON'
                }
            ], [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                {
                    is_system: true,
                    id: 'parseJSON',
                    name: 'Parse JSON'
                },
                {
                    is_system: true,
                    id: 'validateFormat',
                    name: 'Validate Format'
                }
            ] }), readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'previews_status', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.EXTENDED, label: { fr: 'Statut des aperçus', en: 'Previews status' }, embedded_fields: [
            {
                id: 'tiny',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            },
            {
                id: 'small',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            },
            {
                id: 'medium',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            },
            {
                id: 'big',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            },
            {
                id: 'huge',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            },
            {
                id: 'pdf',
                format: attribute_1.AttributeFormats.EXTENDED,
                embedded_fields: previewStatusSubFields
            }
        ], actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.GET_VALUE]: [
                {
                    is_system: true,
                    id: 'toJSON',
                    name: 'To JSON'
                }
            ], [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                {
                    is_system: true,
                    id: 'parseJSON',
                    name: 'Parse JSON'
                },
                {
                    is_system: true,
                    id: 'validateFormat',
                    name: 'Validate Format'
                }
            ] }), readonly: true }),
    Object.assign(Object.assign({}, commonAttributeData), { id: 'active', type: attribute_1.AttributeTypes.SIMPLE, format: attribute_1.AttributeFormats.BOOLEAN, label: { fr: 'Actif', en: 'Active' }, actions_list: Object.assign(Object.assign({}, commonAttributeData.actions_list), { [actionsList_1.ActionsListEvents.GET_VALUE]: [
                {
                    id: 'toBoolean',
                    name: 'To Boolean',
                    is_system: true
                }
            ], [actionsList_1.ActionsListEvents.SAVE_VALUE]: [
                {
                    id: 'validateFormat',
                    name: 'Validate Format',
                    is_system: true
                },
                {
                    id: 'toBoolean',
                    name: 'To Boolean',
                    is_system: true
                }
            ] }), readonly: false })
];
