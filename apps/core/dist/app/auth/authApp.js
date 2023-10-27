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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const bcrypt = __importStar(require("bcryptjs"));
const express_useragent_1 = __importDefault(require("express-useragent"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthenticationError_1 = __importDefault(require("../../errors/AuthenticationError"));
const permissionRepo_1 = require("../../infra/permission/permissionRepo");
const auth_1 = require("../../_types/auth");
const library_1 = require("../../_types/library");
const record_1 = require("../../_types/record");
const cacheService_1 = require("../../infra/cache/cacheService");
const ms_1 = __importDefault(require("ms"));
const uuid_1 = require("uuid");
const SESSION_CACHE_HEADER = 'session';
function default_1({ 'core.domain.value': valueDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.apiKey': apiKeyDomain = null, 'core.domain.user': userDomain = null, 'core.infra.cache.cacheService': cacheService = null, config = null } = {}) {
    const _generateAccessToken = async (userId, ctx) => {
        const groupsId = (await valueDomain.getValues({
            library: 'users',
            recordId: userId,
            attribute: 'user_groups',
            ctx
        })).map(g => g.value.id);
        // Generate token
        const token = jsonwebtoken_1.default.sign({
            userId,
            groupsId
        }, config.auth.key, {
            algorithm: config.auth.algorithm,
            expiresIn: String(config.auth.tokenExpiration)
        });
        return token;
    };
    const _generateRefreshToken = (payload) => {
        const token = jsonwebtoken_1.default.sign(payload, config.auth.key, {
            algorithm: config.auth.algorithm,
            expiresIn: String(config.auth.refreshTokenExpiration),
            jwtid: (0, uuid_1.v4)()
        });
        return token;
    };
    return {
        getGraphQLSchema() {
            return {
                typeDefs: `
                    extend type Query {
                        me: User
                    }
                `,
                resolvers: {
                    Query: {
                        async me(parent, args, ctx, info) {
                            const users = await recordDomain.find({
                                params: {
                                    library: 'users',
                                    filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: ctx.userId }],
                                    withCount: false,
                                    retrieveInactive: true
                                },
                                ctx
                            });
                            return users.list[0];
                        }
                    }
                }
            };
        },
        registerRoute(app) {
            app.post('/auth/authenticate', async (req, res, next) => {
                try {
                    const { login, password } = req.body;
                    if (typeof login === 'undefined' || typeof password === 'undefined') {
                        return res.status(401).send('Missing credentials');
                    }
                    // Check if user is active
                    const ctx = {
                        userId: config.defaultUserId,
                        queryId: 'authenticate'
                    };
                    const users = await recordDomain.find({
                        params: {
                            library: 'users',
                            filters: [{ field: 'login', condition: record_1.AttributeCondition.EQUAL, value: login }]
                        },
                        ctx
                    });
                    if (!users.list.length) {
                        return res.status(401).send('Invalid credentials');
                    }
                    // Check if password is correct
                    const user = users.list[0];
                    const userPwd = await valueDomain.getValues({
                        library: 'users',
                        recordId: user.id,
                        attribute: 'password',
                        ctx
                    });
                    const isValidPwd = !!userPwd[0].raw_value && (await bcrypt.compare(password, userPwd[0].raw_value));
                    if (!isValidPwd) {
                        return res.status(401).send('Invalid credentials');
                    }
                    const accessToken = await _generateAccessToken(user.id, ctx);
                    const refreshToken = _generateRefreshToken({
                        userId: user.id,
                        ip: req.headers['x-forwarded-for'],
                        agent: req.headers['user-agent']
                    });
                    // store refresh token in cache
                    const cacheKey = `${SESSION_CACHE_HEADER}:${refreshToken}`;
                    await cacheService.getCache(cacheService_1.ECacheType.RAM).storeData({
                        key: cacheKey,
                        data: user.id,
                        expiresIn: (0, ms_1.default)(config.auth.refreshTokenExpiration)
                    });
                    // We need the milliseconds value to set cookie expiration
                    // ms is the package used by jsonwebtoken under the hood, hence we're sure the value is same
                    const cookieExpires = (0, ms_1.default)(String(config.auth.tokenExpiration));
                    res.cookie(auth_1.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
                        httpOnly: true,
                        sameSite: config.auth.cookie.sameSite,
                        secure: config.auth.cookie.secure,
                        domain: req.headers.host,
                        expires: new Date(Date.now() + cookieExpires)
                    });
                    return res.status(200).json({
                        refreshToken
                    });
                }
                catch (err) {
                    next(err);
                }
            });
            app.post('/auth/logout', (req, res) => {
                res.cookie(auth_1.ACCESS_TOKEN_COOKIE_NAME, '', {
                    expires: new Date(0),
                    httpOnly: true,
                    sameSite: config.auth.cookie.sameSite,
                    secure: config.auth.cookie.secure,
                    domain: req.headers.host
                });
                return res.status(200).end();
            });
            app.post('/auth/forgot-password', async (req, res, next) => {
                try {
                    const { email, lang } = req.body;
                    const ua = express_useragent_1.default.parse(req.headers['user-agent']);
                    if (typeof email === 'undefined' || typeof lang === 'undefined') {
                        return res.status(400).send('Missing parameters');
                    }
                    // Get user id
                    const ctx = {
                        userId: config.defaultUserId,
                        queryId: 'forgot-password'
                    };
                    const users = await recordDomain.find({
                        params: {
                            library: 'users',
                            filters: [{ field: 'email', condition: record_1.AttributeCondition.EQUAL, value: email }]
                        },
                        ctx
                    });
                    if (!users.list.length) {
                        return res.status(401).send('Email not found');
                    }
                    const user = users.list[0];
                    // Generate token
                    const token = jsonwebtoken_1.default.sign({
                        userId: user.id,
                        email: user.email
                    }, config.auth.key, {
                        algorithm: config.auth.algorithm,
                        expiresIn: String(config.auth.resetPasswordExpiration)
                    });
                    await userDomain.sendResetPasswordEmail(user.email, token, user.login, ua.browser, ua.os, lang, ctx);
                    return res.sendStatus(200);
                }
                catch (err) {
                    next(err);
                }
            });
            app.post('/auth/reset-password', async (req, res, next) => {
                try {
                    const { token, newPassword } = req.body;
                    if (typeof token === 'undefined' || typeof newPassword === 'undefined') {
                        return res.status(400).send('Missing required parameters');
                    }
                    let payload;
                    // to catch expired token error properly
                    try {
                        payload = jsonwebtoken_1.default.verify(token, config.auth.key);
                    }
                    catch (e) {
                        throw new AuthenticationError_1.default('Invalid token');
                    }
                    if (typeof payload.userId === 'undefined' || typeof payload.email === 'undefined') {
                        throw new AuthenticationError_1.default('Invalid token');
                    }
                    const ctx = {
                        userId: config.defaultUserId,
                        queryId: 'resetPassword'
                    };
                    const users = await recordDomain.find({
                        params: {
                            library: 'users',
                            filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: payload.userId }]
                        },
                        ctx
                    });
                    if (!users.list.length) {
                        throw new AuthenticationError_1.default('User not found');
                    }
                    try {
                        // save new password
                        await valueDomain.saveValue({
                            library: 'users',
                            recordId: payload.userId,
                            attribute: 'password',
                            value: { value: newPassword },
                            ctx
                        });
                    }
                    catch (e) {
                        return res.status(422).send('Invalid password');
                    }
                    return res.sendStatus(200);
                }
                catch (err) {
                    next(err);
                }
            });
            app.post('/auth/refresh', async (req, res, next) => {
                try {
                    const { refreshToken } = req.body;
                    if (typeof refreshToken === 'undefined') {
                        return res.status(400).send('Missing refresh token');
                    }
                    let payload;
                    try {
                        payload = jsonwebtoken_1.default.verify(refreshToken, config.auth.key);
                    }
                    catch (e) {
                        throw new AuthenticationError_1.default('Invalid token');
                    }
                    if (!payload.userId || !payload.ip || !payload.agent) {
                        throw new AuthenticationError_1.default('Invalid token');
                    }
                    // Get user data
                    const ctx = {
                        userId: config.defaultUserId,
                        queryId: 'refresh'
                    };
                    const users = await recordDomain.find({
                        params: {
                            library: 'users',
                            filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: payload.userId }]
                        },
                        ctx
                    });
                    // User could have been deleted / disabled in database
                    if (!users.list.length) {
                        return res.status(401).send('Invalid token');
                    }
                    const userSessionId = (await cacheService
                        .getCache(cacheService_1.ECacheType.RAM)
                        .getData([`${SESSION_CACHE_HEADER}:${refreshToken}`]))[0];
                    if (!userSessionId) {
                        return res.status(401).send('Invalid session');
                    }
                    // We check if user agent is the same
                    if (payload.agent !== req.headers['user-agent']) {
                        return res.status(401).send('Invalid session');
                    }
                    // Everything is ok, we can generate, update and return new tokens
                    const newAccessToken = await _generateAccessToken(payload.userId, ctx);
                    const newRefreshToken = _generateRefreshToken({
                        userId: payload.userId,
                        ip: req.headers['x-forwarded-for'],
                        agent: req.headers['user-agent']
                    });
                    await cacheService.getCache(cacheService_1.ECacheType.RAM).storeData({
                        key: `${SESSION_CACHE_HEADER}:${newRefreshToken}`,
                        data: payload.userId,
                        expiresIn: (0, ms_1.default)(config.auth.refreshTokenExpiration)
                    });
                    // Delete old session
                    await cacheService
                        .getCache(cacheService_1.ECacheType.RAM)
                        .deleteData([`${SESSION_CACHE_HEADER}:${refreshToken}`]);
                    const cookieExpires = (0, ms_1.default)(String(config.auth.tokenExpiration));
                    res.cookie(auth_1.ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
                        httpOnly: true,
                        sameSite: config.auth.cookie.sameSite,
                        secure: config.auth.cookie.secure,
                        domain: req.headers.host,
                        expires: new Date(Date.now() + cookieExpires)
                    });
                    return res.status(200).json({
                        refreshToken: newRefreshToken
                    });
                }
                catch (err) {
                    next(err);
                }
            });
        },
        async validateRequestToken({ apiKey, cookies }) {
            const ctx = {
                userId: config.defaultUserId,
                queryId: 'validateToken'
            };
            const token = cookies === null || cookies === void 0 ? void 0 : cookies[auth_1.ACCESS_TOKEN_COOKIE_NAME];
            let userId;
            let groupsId;
            if (!token && !apiKey) {
                throw new AuthenticationError_1.default('No token or api key provided');
            }
            if (token) {
                // Token validation checking
                let payload;
                try {
                    payload = jsonwebtoken_1.default.verify(token, config.auth.key);
                }
                catch (e) {
                    throw new AuthenticationError_1.default('Invalid token');
                }
                if (!payload.userId) {
                    throw new AuthenticationError_1.default('Invalid token');
                }
                userId = payload.userId;
                groupsId = payload.groupsId;
            }
            if (!userId && apiKey) {
                // If no valid token in cookies, check api key
                const apiKeyData = await apiKeyDomain.validateApiKey({ apiKey, ctx });
                // Check API key has not expired
                const hasExpired = apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date();
                if (hasExpired) {
                    throw new AuthenticationError_1.default('API key expired');
                }
                userId = apiKeyData.userId;
                // Fetch user groups
                const userGroups = (await valueDomain.getValues({
                    library: library_1.USERS_LIBRARY,
                    recordId: userId,
                    attribute: permissionRepo_1.USERS_GROUP_ATTRIBUTE_NAME,
                    ctx
                }));
                groupsId = userGroups.map(g => g.value.id);
            }
            // Validate user
            const users = await recordDomain.find({
                params: {
                    library: 'users',
                    filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: userId }]
                },
                ctx
            });
            if (!users.list.length) {
                throw new AuthenticationError_1.default('User not found');
            }
            return {
                userId,
                groupsId
            };
        }
    };
}
exports.default = default_1;
