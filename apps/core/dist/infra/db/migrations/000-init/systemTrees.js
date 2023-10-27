"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemTrees = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const tree_1 = require("../../../../_types/tree");
const commonTreeData = {
    system: true,
    behavior: tree_1.TreeBehavior.STANDARD
};
exports.systemTrees = [
    Object.assign(Object.assign({}, commonTreeData), { _key: 'users_groups', label: { fr: "Groupes d'utilisateurs", en: 'Users groups' }, libraries: {
            users_groups: {
                allowedAtRoot: true,
                allowedChildren: ['users_groups'],
                allowMultiplePositions: false
            }
        } }),
    Object.assign(Object.assign({}, commonTreeData), { _key: 'files_tree', behavior: tree_1.TreeBehavior.FILES, label: { fr: 'Fichiers', en: 'Files' }, libraries: {
            files: {
                allowedAtRoot: true,
                allowedChildren: [],
                allowMultiplePositions: false
            },
            files_directories: {
                allowedAtRoot: true,
                allowedChildren: ['__all__'],
                allowMultiplePositions: false
            }
        } })
];
