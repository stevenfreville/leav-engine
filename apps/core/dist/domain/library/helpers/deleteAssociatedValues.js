"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attribute_1 = require("../../../_types/attribute");
function default_1({ 'core.domain.record': recordDomain = null, 'core.domain.value': valueDomain = null, 'core.infra.value': valueRepo = null, 'core.domain.attribute': attributeDomain = null }) {
    return {
        async deleteAssociatedValues(attributes, libraryId, ctx) {
            const records = await recordDomain.find({ params: { library: libraryId }, ctx });
            const attributesWithProps = await Promise.all(attributes.map(async (a) => attributeDomain.getAttributeProperties({ id: a, ctx })));
            for (const r of records.list) {
                for (const a of attributesWithProps) {
                    if (!a.reverse_link &&
                        (a.type === attribute_1.AttributeTypes.ADVANCED ||
                            a.type === attribute_1.AttributeTypes.ADVANCED_LINK ||
                            a.type === attribute_1.AttributeTypes.TREE)) {
                        const values = await valueRepo.getValues({
                            library: libraryId,
                            recordId: r.id,
                            attribute: a,
                            options: { forceGetAllValues: true, forceArray: true },
                            ctx
                        });
                        for (const v of values) {
                            await valueDomain.deleteValue({
                                library: libraryId,
                                recordId: r.id,
                                attribute: a.id,
                                value: v,
                                ctx
                            });
                        }
                    }
                    else {
                        await valueDomain.deleteValue({
                            library: libraryId,
                            recordId: r.id,
                            attribute: a.id,
                            ctx
                        });
                    }
                }
            }
        }
    };
}
exports.default = default_1;
