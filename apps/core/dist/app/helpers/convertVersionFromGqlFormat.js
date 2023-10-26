"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    const convertVersionFromGqlFormat = version => {
        return Array.isArray(version) && version.length
            ? version.reduce((formattedVers, valVers) => {
                formattedVers[valVers.treeId] = valVers.treeNodeId;
                return formattedVers;
            }, {})
            : null;
    };
    return convertVersionFromGqlFormat;
}
exports.default = default_1;
