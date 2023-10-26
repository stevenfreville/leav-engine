"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemLibraries = void 0;
const library_1 = require("../../../../_types/library");
const commonLibraryData = {
    system: true,
    recordIdentityConf: {
        label: 'label'
    },
    behavior: library_1.LibraryBehavior.STANDARD,
    attributes: ['id', 'created_by', 'created_at', 'modified_by', 'modified_at', 'active', 'label']
};
exports.systemLibraries = [
    Object.assign(Object.assign({}, commonLibraryData), { _key: 'users', label: { fr: 'Utilisateurs', en: 'Users' }, fullTextAttributes: ['login', 'email', 'label'], recordIdentityConf: {
            label: 'login'
        }, attributes: [...commonLibraryData.attributes, 'login', 'email', 'password', 'user_groups'] }),
    Object.assign(Object.assign({}, commonLibraryData), { _key: 'users_groups', fullTextAttributes: ['label'], label: { fr: "Groupes d'utilisateurs", en: 'Users groups' } }),
    Object.assign(Object.assign({}, commonLibraryData), { _key: 'files', behavior: library_1.LibraryBehavior.FILES, label: { fr: 'Fichiers', en: 'Files' }, recordIdentityConf: {
            label: 'file_name'
        }, fullTextAttributes: ['file_name'], attributes: [
            ...commonLibraryData.attributes,
            'root_key',
            'hash',
            'file_path',
            'file_name',
            'inode',
            'previews',
            'previews_status'
        ] }),
    Object.assign(Object.assign({}, commonLibraryData), { _key: 'files_directories', behavior: library_1.LibraryBehavior.DIRECTORIES, label: { fr: 'Dossiers', en: 'Directories' }, recordIdentityConf: {
            label: 'file_name'
        }, fullTextAttributes: ['file_name'], attributes: [
            ...commonLibraryData.attributes,
            'root_key',
            'hash',
            'file_path',
            'file_name',
            'inode',
            'previews',
            'previews_status'
        ] })
];
