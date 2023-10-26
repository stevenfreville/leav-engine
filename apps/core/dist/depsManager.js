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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDI = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const awilix_1 = require("awilix");
const fs_1 = require("fs");
const config_1 = require("./config");
const _registerModules = async (container, folder, glob, prefix = '') => {
    // We only consider index files so that we explicity declare what we want to make available
    // in dependency injector. This allows to have some helper files kept private inside a module.
    const modulesList = (0, awilix_1.listModules)(glob, {
        cwd: folder
    });
    for (const mod of modulesList) {
        const relativePath = mod.path.split(folder + '/').join('');
        // Import module
        const importedMod = await Promise.resolve().then(() => __importStar(require(mod.path)));
        // Explode path, remove index file
        const pathParts = relativePath.split('/').filter(p => !p.match(/index\.(ts|js)/g));
        // Register module exports
        // Register default export by its parent folder name, register named exports by their actual name
        // This will give, for example: 'core.domain.value' or 'core.domain.permissions.record'
        for (const modExport of Object.keys(importedMod)) {
            const prefixedNamePart = prefix ? [prefix] : [];
            const nameParts = [...prefixedNamePart, ...pathParts];
            if (modExport !== 'default') {
                nameParts.push(modExport);
            }
            // Check if we must register function or a simple value.
            // Registering as class is not supported voluntarily. We don't want class.
            container.register({
                [nameParts.join('.')]: typeof importedMod[modExport] === 'function'
                    ? (0, awilix_1.asFunction)(importedMod[modExport]).singleton()
                    : (0, awilix_1.asValue)(importedMod[modExport])
            });
        }
    }
    return container;
};
async function initDI(additionalModulesToRegister) {
    const srcFolder = __dirname;
    const pluginsFolder = (0, fs_1.realpathSync)(__dirname + '/plugins');
    const modulesGlob = '+(app|domain|infra|interface|utils)/**/index.+(ts|js)';
    const pluginsModulesGlob = `!(core)/${modulesGlob}`;
    /*** CORE ***/
    const coreContainer = (0, awilix_1.createContainer)({
        injectionMode: awilix_1.InjectionMode.PROXY
    });
    await _registerModules(coreContainer, srcFolder, modulesGlob, 'core');
    // Add a few extra dependencies
    const coreConf = await (0, config_1.getConfig)();
    coreContainer.register('config', (0, awilix_1.asValue)(coreConf));
    coreContainer.register('pluginsFolder', (0, awilix_1.asValue)(pluginsFolder));
    for (const [modKey, mod] of Object.entries(additionalModulesToRegister)) {
        coreContainer.register(modKey, (0, awilix_1.asValue)(mod));
    }
    /*** PLUGINS ***/
    const pluginsContainer = coreContainer.createScope();
    await _registerModules(pluginsContainer, pluginsFolder, pluginsModulesGlob);
    // Register this at the very end because we don't want plugins to access the deps manager
    coreContainer.register('core.depsManager', (0, awilix_1.asValue)(coreContainer));
    return { coreContainer, pluginsContainer };
}
exports.initDI = initDI;
