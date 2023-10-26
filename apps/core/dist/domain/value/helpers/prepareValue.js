"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const actionsList_1 = require("../../../_types/actionsList");
exports.default = async (params) => {
    var _a;
    const { attributeProps, value, library, recordId, deps, ctx } = params;
    // Execute actions list. Output value might be different from input value
    const preparedValue = !!attributeProps.actions_list && !!attributeProps.actions_list.saveValue
        ? await deps.actionsListDomain.runActionsList(attributeProps.actions_list.saveValue, value, Object.assign(Object.assign({}, ctx), { attribute: attributeProps, recordId,
            library }))
        : value;
    if (preparedValue.metadata) {
        try {
            for (const metaFieldName of Object.keys(preparedValue.metadata)) {
                const metaFieldProps = await deps.attributeDomain.getAttributeProperties({ id: metaFieldName, ctx });
                if ((_a = metaFieldProps === null || metaFieldProps === void 0 ? void 0 : metaFieldProps.actions_list) === null || _a === void 0 ? void 0 : _a[actionsList_1.ActionsListEvents.SAVE_VALUE]) {
                    const processedMetaValue = await deps.actionsListDomain.runActionsList(metaFieldProps.actions_list[actionsList_1.ActionsListEvents.SAVE_VALUE], { value: preparedValue.metadata[metaFieldName] }, Object.assign(Object.assign({}, ctx), { attribute: metaFieldProps, recordId,
                        library }));
                    preparedValue.metadata[metaFieldName] = processedMetaValue.value;
                }
            }
        }
        catch (e) {
            if (!(e instanceof ValidationError_1.default)) {
                deps.utils.rethrow(e);
            }
            e.fields = { metadata: Object.assign({}, e.fields) };
            deps.utils.rethrow(e);
        }
    }
    return preparedValue;
};
