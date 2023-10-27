"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    const _registeredPlugins = [];
    return {
        registerPlugin(path, plugin) {
            const pluginToRegister = { path, infos: Object.assign({}, plugin) };
            _registeredPlugins.push(pluginToRegister);
            return pluginToRegister;
        },
        getRegisteredPlugins() {
            return _registeredPlugins;
        }
    };
}
exports.default = default_1;
