"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const doesValueExist_1 = __importDefault(require("./doesValueExist"));
const _handleValueVersion = async (value, attribute, deps, ctx) => {
    const versionProfile = await deps.versionProfileDomain.getVersionProfileProperties({
        id: attribute.versions_conf.profile,
        ctx
    });
    // Run through each profile's tree: if value's version has a value for this tree, we keep it, otherwise we affect
    // default version for this tree.
    // The goal is to make sure the version is always relevant in regard to the profile
    const valueVersion = versionProfile.trees.reduce(async (versionProm, treeId) => {
        var _a;
        const version = await versionProm;
        if ((_a = value.version) === null || _a === void 0 ? void 0 : _a[treeId]) {
            version[treeId] = value.version[treeId];
        }
        else {
            const treeDefaultElement = await deps.getDefaultElementHelper.getDefaultElement({
                treeId,
                ctx
            });
            version[treeId] = treeDefaultElement.id;
        }
        return version;
    }, Promise.resolve({}));
    return valueVersion;
};
exports.default = async (library, recordId, attribute, value, deps, ctx) => {
    var _a;
    const valueExists = (0, doesValueExist_1.default)(value, attribute);
    const valueToSave = Object.assign(Object.assign({}, value), { modified_at: (0, moment_1.default)().unix() });
    if (!valueExists) {
        valueToSave.created_at = (0, moment_1.default)().unix();
    }
    let reverseLink;
    if (!!attribute.reverse_link) {
        reverseLink = await deps.attributeDomain.getAttributeProperties({
            id: attribute.reverse_link,
            ctx
        });
    }
    // Make sure version only contains relevant trees for this attribute
    if ((_a = attribute.versions_conf) === null || _a === void 0 ? void 0 : _a.versionable) {
        valueToSave.version = await _handleValueVersion(valueToSave, attribute, deps, ctx);
    }
    const savedVal = valueExists
        ? await deps.valueRepo.updateValue({
            library,
            recordId,
            attribute: Object.assign(Object.assign({}, attribute), { reverse_link: reverseLink }),
            value: valueToSave,
            ctx
        })
        : await deps.valueRepo.createValue({
            library,
            recordId,
            attribute: Object.assign(Object.assign({}, attribute), { reverse_link: reverseLink }),
            value: valueToSave,
            ctx
        });
    return savedVal;
};
