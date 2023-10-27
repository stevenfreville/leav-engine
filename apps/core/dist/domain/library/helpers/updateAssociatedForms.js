"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.form': formDomain = null }) {
    return {
        async updateAssociatedForms(deletedAttrs, libraryId, ctx) {
            const forms = await formDomain.getFormsByLib({ library: libraryId, ctx });
            for (const form of forms.list) {
                const updatedForm = Object.assign(Object.assign({}, form), { elements: form.elements.map(depElem => (Object.assign(Object.assign({}, depElem), { elements: depElem.elements.filter(elem => {
                            var _a;
                            return !deletedAttrs.includes((_a = elem.settings) === null || _a === void 0 ? void 0 : _a.attribute);
                        }) }))) });
                await formDomain.saveForm({ form: updatedForm, ctx });
            }
        }
    };
}
exports.default = default_1;
