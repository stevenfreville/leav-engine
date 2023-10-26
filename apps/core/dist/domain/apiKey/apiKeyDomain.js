"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const bcrypt = __importStar(require("bcryptjs"));
const moment_1 = __importDefault(require("moment"));
const uuid_1 = require("uuid");
const AuthenticationError_1 = __importDefault(require("../../errors/AuthenticationError"));
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const errors_1 = require("../../_types/errors");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.admin': adminPermissionDomain = null, 'core.infra.apiKey': apiKeyRepo = null, 'core.utils': utils = null }) {
    const _hashApiKey = async (key) => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(key, salt);
        return hash;
    };
    const _encodeExposedKey = (apiKey, rawKey) => {
        // The key exposed to the user is the concatenation of the key and the id, encoded in base64
        // We'll need the ID later on to check the validity of the key
        const exposedKey = `${apiKey.id}|${rawKey}`;
        return Buffer.from(exposedKey).toString('base64url');
    };
    const _decodeExposedKey = (key) => {
        // The string received is an encoded concatenation of the key and the id. Decode it and split it
        const string = Buffer.from(key, 'base64url').toString();
        const [id, rawKey] = string.split('|');
        return { id, key: rawKey };
    };
    const _hideSecrets = (apiKey) => {
        return Object.assign(Object.assign({}, apiKey), { key: null });
    };
    return {
        async getApiKeys({ params, ctx }) {
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            const keys = await apiKeyRepo.getApiKeys({ params: initializedParams, ctx });
            return Object.assign(Object.assign({}, keys), { list: keys.list.map(_hideSecrets) });
        },
        async getApiKeyProperties({ id, hideKey = true, ctx }) {
            const searchParams = {
                filters: { id }
            };
            const keys = await apiKeyRepo.getApiKeys({ params: searchParams, ctx });
            if (!keys.list.length) {
                throw utils.generateExplicitValidationError('id', errors_1.Errors.UNKNOWN_API_KEY, ctx.lang);
            }
            return hideKey ? _hideSecrets(keys.list[0]) : keys.list[0];
        },
        async saveApiKey({ apiKey, ctx }) {
            const isNewKey = !apiKey.id;
            const action = isNewKey ? permissions_1.AdminPermissionsActions.CREATE_API_KEY : permissions_1.AdminPermissionsActions.EDIT_API_KEY;
            const canSaveApiKey = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canSaveApiKey) {
                throw new PermissionError_1.default(action);
            }
            let existingKeyProps;
            if (!isNewKey) {
                existingKeyProps = await this.getApiKeyProperties({ id: apiKey.id, ctx });
            }
            const defaultParams = {
                label: '',
                createdAt: (0, moment_1.default)().unix(),
                createdBy: String(ctx.userId),
                modifiedAt: (0, moment_1.default)().unix(),
                modifiedBy: String(ctx.userId),
                expiresAt: null,
                userId: null
            };
            const modifier = String(ctx.userId);
            const now = (0, moment_1.default)().unix();
            const { key } = apiKey, inputApiKeyData = __rest(apiKey, ["key"]); // NEVER save the key from user input
            const dataToSave = Object.assign(Object.assign(Object.assign({}, defaultParams), existingKeyProps), inputApiKeyData);
            let keyString;
            if (isNewKey) {
                keyString = (0, uuid_1.v4)();
                dataToSave.key = await _hashApiKey(keyString);
                dataToSave.createdAt = now;
                dataToSave.createdBy = modifier;
                delete dataToSave.id; // To make sure "id" is not present at all
            }
            else {
                delete dataToSave.key; // Don't update the key
            }
            dataToSave.modifiedAt = now;
            dataToSave.modifiedBy = modifier;
            let savedKey;
            if (isNewKey) {
                savedKey = await apiKeyRepo.createApiKey({ keyData: dataToSave, ctx });
                // On creation, return a concatenation of ID and raw key to the user, not the hash stored in DB
                savedKey.key = _encodeExposedKey(savedKey, keyString);
            }
            else {
                savedKey = await apiKeyRepo.updateApiKey({ keyData: dataToSave, ctx });
                savedKey = _hideSecrets(savedKey);
            }
            return savedKey;
        },
        async deleteApiKey({ id, ctx }) {
            const keyProps = await this.getApiKeyProperties({ id, ctx });
            const action = permissions_1.AdminPermissionsActions.DELETE_API_KEY;
            const canDeleteApiKey = await adminPermissionDomain.getAdminPermission({ action, userId: ctx.userId, ctx });
            if (!canDeleteApiKey) {
                throw new PermissionError_1.default(action);
            }
            const deletedKey = await apiKeyRepo.deleteApiKey({ id: keyProps.id, ctx });
            return _hideSecrets(deletedKey);
        },
        async validateApiKey({ apiKey, ctx }) {
            // Get key hash
            const { id, key: rawKey } = _decodeExposedKey(apiKey);
            // Retrieve key from DB
            const keyData = await this.getApiKeyProperties({ id, hideKey: false, ctx });
            const isKeyValid = await bcrypt.compare(rawKey, keyData.key);
            if (!isKeyValid) {
                throw new AuthenticationError_1.default('Invalid API key');
            }
            return keyData;
        }
    };
}
exports.default = default_1;
