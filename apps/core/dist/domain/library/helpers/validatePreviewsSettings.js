"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../_types/errors");
const library_1 = require("../../../_types/library");
exports.default = async (libData, ctx) => {
    const errors = {};
    if (!libData.previewsSettings) {
        return {};
    }
    if (libData.behavior !== library_1.LibraryBehavior.FILES) {
        errors.previewsSettings = errors_1.Errors.PREVIEWS_SETTINGS_NOT_ALLOWED;
        return errors;
    }
    // Sort settings to have system settings first
    const settingsToCheck = [...libData.previewsSettings];
    settingsToCheck.sort((a, b) => (a.system ? -1 : 1));
    // Check for duplicates in sizes names.
    // If a duplicate is found, we must be able to tell where the name was previously used
    const sizeNames = [];
    const duplicates = [];
    for (const settings of settingsToCheck) {
        for (const size of settings.versions.sizes) {
            if (sizeNames.find(name => name === size.name)) {
                duplicates.push(size.name);
            }
            else {
                sizeNames.push(size.name);
            }
        }
    }
    if (duplicates.length) {
        errors.previewsSettings = {
            msg: errors_1.Errors.PREVIEWS_SETTINGS_DUPLICATE_NAMES,
            vars: { duplicates: duplicates.join(', ') }
        };
    }
    return errors;
};
