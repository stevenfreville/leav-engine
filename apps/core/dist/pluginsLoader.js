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
exports.initPlugins = void 0;
const awilix_1 = require("awilix");
const fs = __importStar(require("fs"));
const config_1 = require("./config");
const initPlugins = async (folder, depsManager) => {
    const pluginsApp = depsManager.cradle['core.app.core.plugins'];
    // Retrieve extensions points accross all core app files
    // They will be passed to each plugin in init function
    const appModules = Object.keys(depsManager.registrations)
        .filter(modName => modName.match(/^core\.app\./))
        .map(modName => depsManager.cradle[modName]);
    const extensionPoints = appModules.reduce((allExtPoints, mod) => {
        if (typeof mod.extensionPoints !== 'undefined') {
            return Object.assign(Object.assign({}, allExtPoints), mod.extensionPoints);
        }
        return allExtPoints;
    }, {});
    // Init plugins
    const plugins = await fs.promises.readdir(folder);
    for (const pluginName of plugins) {
        // Ignore files (like .gitignore or any other files)
        const pluginFullPath = folder + '/' + pluginName;
        if (!fs.existsSync(pluginFullPath) ||
            (!fs.lstatSync(pluginFullPath).isDirectory() && !fs.lstatSync(pluginFullPath).isSymbolicLink())) {
            continue;
        }
        const importedPlugin = await Promise.resolve().then(() => __importStar(require(folder + '/' + pluginName)));
        const defaultExport = importedPlugin.default;
        // Load plugin config
        const pluginConf = await (0, config_1.getConfig)(`${folder}/${pluginName}`);
        const newConf = Object.assign(Object.assign({}, depsManager.cradle.config), { plugins: Object.assign(Object.assign({}, depsManager.cradle.config.plugins), { [pluginName]: pluginConf }) });
        depsManager.register('config', (0, awilix_1.asValue)(newConf));
        // Default export must be a function that takes deps as the only parameter
        if (typeof defaultExport === 'function') {
            // Manually inject ours deps
            const injectedIndex = defaultExport(depsManager.cradle);
            await injectedIndex.init(extensionPoints);
        }
        // Read plugins informations in package.json to register it
        const pluginPath = folder + '/' + pluginName;
        const packageInfos = await Promise.resolve().then(() => __importStar(require(pluginPath + '/package.json')));
        pluginsApp.registerPlugin(pluginPath, {
            name: packageInfos.name,
            description: packageInfos.description,
            version: packageInfos.version,
            author: packageInfos.author
        });
    }
};
exports.initPlugins = initPlugins;
