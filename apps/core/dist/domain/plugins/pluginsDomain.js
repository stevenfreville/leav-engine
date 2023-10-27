"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.infra.plugins': pluginsRepo }) {
    return {
        registerPlugin(path, plugin) {
            return pluginsRepo.registerPlugin(path, plugin);
        },
        getRegisteredPlugins() {
            return pluginsRepo.getRegisteredPlugins();
        }
    };
}
exports.default = default_1;
