"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const errors_1 = require("../../_types/errors");
function default_1({ 'core.depsManager': depsManager = null } = {}) {
    let _pluginActions = [];
    return {
        getAvailableActions() {
            const actions = Object.keys(depsManager.registrations)
                .filter(modName => modName.match(/^core\.domain\.actions\./))
                .map(modName => depsManager.cradle[modName]);
            return [...actions, ..._pluginActions];
        },
        handleJoiError(attribute, error) {
            return {
                [attribute.id]: {
                    msg: errors_1.Errors.FORMAT_ERROR,
                    vars: { details: error.details.map(er => er.message).join('\n') }
                }
            };
        },
        registerActions(actions) {
            _pluginActions = [..._pluginActions, ...actions];
        },
        async runActionsList(actions, value, ctx) {
            var _a, _b, _c, _d, _e, _f;
            const availActions = this.getAvailableActions();
            let resultAction = value.value;
            for (const action of actions) {
                const params = !!action.params
                    ? action.params.reduce((all, p) => {
                        all[p.name] = p.value;
                        return all;
                    }, {})
                    : {};
                const actionFunc = availActions.find(a => {
                    const availableActionId = a.id ? a.id : a.name;
                    const actionId = action.id ? action.id : action.name;
                    return availableActionId === actionId;
                }).action;
                try {
                    // run each actions separately to catch the context of the error.
                    resultAction = await actionFunc(resultAction, params, ctx);
                }
                catch (error) {
                    //check if there is a custom message added by a user (also check the default lng message)
                    let customMessage = !(0, isEmpty_1.default)((_b = (_a = action === null || action === void 0 ? void 0 : action.error_message) === null || _a === void 0 ? void 0 : _a[ctx.lang]) === null || _b === void 0 ? void 0 : _b.trim())
                        ? action.error_message[ctx.lang]
                        : !(0, isEmpty_1.default)((_d = (_c = action === null || action === void 0 ? void 0 : action.error_message) === null || _c === void 0 ? void 0 : _c[ctx.defaultLang]) === null || _d === void 0 ? void 0 : _d.trim())
                            ? action.error_message[ctx.defaultLang]
                            : '';
                    //check if there is a joy error message
                    customMessage =
                        customMessage === '' && ((_f = (_e = error.fields[ctx.attribute.id]) === null || _e === void 0 ? void 0 : _e.vars) === null || _f === void 0 ? void 0 : _f.details)
                            ? error.fields[ctx.attribute.id].vars.details
                            : customMessage;
                    let objectValidationError = { [ctx.attribute.id]: error.fields[ctx.attribute.id] };
                    let isCustomMessage = false;
                    if (!(0, isEmpty_1.default)(customMessage)) {
                        objectValidationError = { [ctx.attribute.id]: customMessage };
                        isCustomMessage = true;
                    }
                    //throw the validation error with a custom message
                    throw new ValidationError_1.default(objectValidationError, error.message, isCustomMessage);
                }
            }
            return Object.assign(Object.assign({}, value), { value: resultAction });
        }
    };
}
exports.default = default_1;
