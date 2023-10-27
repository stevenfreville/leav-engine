"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../_types/record");
function default_1({ 'core.domain.indexationManager': indexationManager }) {
    return {
        init: () => indexationManager.init(),
        indexDatabase: async (ctx, libraryId, records) => {
            // if records are undefined we re-index all library's records
            const filters = (records || []).reduce((acc, id) => {
                acc.push({ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: id });
                if (records.length > 1) {
                    acc.push({ operator: record_1.Operator.OR });
                }
                return acc;
            }, []);
            await indexationManager.indexDatabase({
                findRecordParams: Object.assign({ library: libraryId }, (filters.length && { filters })),
                ctx
            });
        }
    };
}
exports.default = default_1;
