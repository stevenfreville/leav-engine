"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const record_1 = require("../../_types/record");
function default_1({ 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.infra.record': recordRepo = null, 'core.utils': utils = null, 'core.infra.library': libraryRepo = null }) {
    return {
        async validateLibraryAttribute(library, attribute, ctx) {
            const libs = await libraryRepo.getLibrariesUsingAttribute(attribute, ctx);
            if (!libs.includes(library)) {
                throw new ValidationError_1.default({ attribute: errors_1.Errors.UNKNOWN_LIBRARY_ATTRIBUTE });
            }
        },
        async validateRecord(library, recordId, ctx) {
            const recordsRes = await recordRepo.find({
                libraryId: library,
                filters: [
                    {
                        attributes: [{ id: 'id', type: attribute_1.AttributeTypes.SIMPLE }],
                        condition: record_1.AttributeCondition.EQUAL,
                        value: String(recordId)
                    }
                ],
                retrieveInactive: true,
                ctx
            });
            if (!recordsRes.list.length) {
                throw utils.generateExplicitValidationError('recordId', { msg: errors_1.Errors.UNKNOWN_RECORD, vars: { library, recordId } }, ctx.lang);
            }
            return recordsRes.list[0];
        },
        async validateLibrary(library, ctx) {
            const lib = await getCoreEntityById('library', library, ctx);
            // Check if exists and can delete
            if (!lib) {
                throw new ValidationError_1.default({ library: errors_1.Errors.UNKNOWN_LIBRARY });
            }
        },
        async validateView(view, throwIfNotFound, ctx) {
            const existingView = await getCoreEntityById('view', view, ctx);
            if (existingView) {
                return true;
            }
            if (throwIfNotFound) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_VIEW });
            }
            return false;
        },
        async validateTree(tree, throwIfNotFound, ctx) {
            const existingTree = await getCoreEntityById('tree', tree, ctx);
            if (existingTree) {
                return true;
            }
            if (throwIfNotFound) {
                throw new ValidationError_1.default({ tree: { msg: errors_1.Errors.UNKNOWN_TREE, vars: { tree } } });
            }
            return false;
        }
    };
}
exports.default = default_1;
