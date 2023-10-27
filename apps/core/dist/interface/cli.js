"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
function default_1({ 'core.app.core.import': importApp = null } = {}) {
    return {
        run(args) {
            commander_1.default
                .command('import <file>')
                .description('Import data from a JSON file')
                .option('--clear', 'Empty database before import')
                .action(async (filepath, options) => {
                try {
                    await importApp.importConfig(filepath, options.clear);
                    process.exit(0);
                }
                catch (e) {
                    console.error(e);
                    process.exit(1);
                }
            });
            commander_1.default.parse(process.argv);
            if (!process.argv.slice(2).length) {
                commander_1.default.outputHelp();
            }
        }
    };
}
exports.default = default_1;
