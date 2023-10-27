"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORE_INDEX_FIELD = exports.CORE_INDEX_VIEW = exports.CORE_INDEX_ANALYZER = exports.CORE_INDEX_INPUT_ANALYZER = void 0;
exports.CORE_INDEX_INPUT_ANALYZER = 'core_index_input';
exports.CORE_INDEX_ANALYZER = 'core_index';
exports.CORE_INDEX_VIEW = 'core_index';
exports.CORE_INDEX_FIELD = 'core_index';
const _getCoreIndexView = libraryId => `${exports.CORE_INDEX_VIEW}_${libraryId}`;
function default_1({ config = null, 'core.infra.db.dbService': dbService = null, 'core.infra.record': recordRepo = null, 'core.infra.indexation.helpers.getSearchQuery': getSearchQuery = null }) {
    return {
        async init() {
            // Create indexation analyzer
            const analyzers = await dbService.analyzers();
            // Create analyzer used by the view
            if (!analyzers.find(a => a.name === `${config.db.name}::${exports.CORE_INDEX_ANALYZER}`)) {
                // Create norm analyzer used by indexation manager
                await dbService.createAnalyzer(exports.CORE_INDEX_ANALYZER, {
                    type: 'text',
                    properties: {
                        locale: 'en',
                        case: 'lower',
                        accent: false,
                        stemming: false,
                        edgeNgram: {
                            preserveOriginal: true
                        }
                    },
                    features: ['frequency', 'norm']
                });
            }
            // Create analyzer to apply on search input
            if (!analyzers.find(a => a.name === `${config.db.name}::${exports.CORE_INDEX_INPUT_ANALYZER}`)) {
                // Create norm analyzer used by indexation manager
                await dbService.createAnalyzer(exports.CORE_INDEX_INPUT_ANALYZER, {
                    type: 'text',
                    properties: {
                        locale: 'en',
                        case: 'lower',
                        accent: false,
                        stemming: false
                    },
                    features: ['frequency', 'norm']
                });
            }
        },
        async listLibrary(libraryId) {
            await dbService.createView(_getCoreIndexView(libraryId), {
                type: 'arangosearch',
                links: {
                    [libraryId]: {
                        analyzers: [exports.CORE_INDEX_ANALYZER],
                        fields: {
                            [exports.CORE_INDEX_FIELD]: {
                                includeAllFields: true
                            }
                        }
                    }
                }
            });
        },
        async isLibraryListed(libraryId) {
            const views = await dbService.views();
            return !!views.find(v => v.name === _getCoreIndexView(libraryId));
        },
        async indexRecord(libraryId, recordId, data) {
            await recordRepo.updateRecord({
                libraryId,
                recordData: { id: recordId, [exports.CORE_INDEX_FIELD]: data },
                mergeObjects: true
            });
        },
        getSearchQuery
    };
}
exports.default = default_1;
