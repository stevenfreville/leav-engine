"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("../../_types/library");
const record_1 = require("../../_types/record");
const views_1 = require("../../_types/views");
function default_1({ 'core.domain.view': viewDomain = null, 'core.domain.record': recordDomain = null, 'core.utils': utils = null }) {
    return {
        async getGraphQLSchema() {
            return {
                typeDefs: `
                    enum ViewTypes {
                        ${Object.values(views_1.ViewTypes).join(' ')}
                    }

                    enum ViewSizes {
                        ${Object.values(views_1.ViewSizes).join(' ')}
                    }

                    type ViewSettings {
                        name: String!,
                        value: Any
                    }

                    type ViewDisplay {
                        type: ViewTypes!,
                        size: ViewSizes!
                    }

                    input ViewSettingsInput {
                        name: String!,
                        value: Any
                    }

                    input ViewDisplayInput {
                        type: ViewTypes!,
                        size: ViewSizes!
                    }

                    type ViewValuesVersion {
                        treeId: String!,
                        treeNode: TreeNode!
                    }

                    input ViewValuesVersionInput {
                        treeId: String!,
                        treeNode: String!
                    }

                    type View {
                        id: String!,
                        library: String!,
                        created_by: User!,
                        shared: Boolean!,
                        created_at: Int!,
                        modified_at: Int!,
                        label: SystemTranslation!,
                        description: SystemTranslationOptional,
                        color: String,
                        filters: [RecordFilter!],
                        sort: RecordSort,
                        display: ViewDisplay!,
                        valuesVersions: [ViewValuesVersion!],
                        settings: [ViewSettings!]
                    }

                    input ViewInput {
                        id: String,
                        library: String!,
                        display: ViewDisplayInput!,
                        shared: Boolean!,
                        label: SystemTranslation,
                        description: SystemTranslationOptional,
                        color: String,
                        filters: [RecordFilterInput!],
                        sort: RecordSortInput,
                        valuesVersions: [ViewValuesVersionInput!],
                        settings: [ViewSettingsInput!]
                    }

                    type ViewsList {
                        totalCount: Int!,
                        list: [View!]!
                    }

                    extend type Query {
                        views(library: String!): ViewsList!
                        view(viewId: String!): View!
                    }

                    extend type Mutation {
                        saveView(view: ViewInput!): View!
                        deleteView(viewId: String!): View!
                    }
                `,
                resolvers: {
                    Query: {
                        views: (_, { library }, ctx) => viewDomain.getViews(library, ctx),
                        view: (_, { viewId }, ctx) => viewDomain.getViewById(viewId, ctx)
                    },
                    Mutation: {
                        saveView: (_, { view }, ctx) => {
                            return viewDomain.saveView(Object.assign(Object.assign({}, view), { valuesVersions: utils.nameValArrayToObj(view.valuesVersions, 'treeId', 'treeNode'), settings: utils.nameValArrayToObj(view.settings) }), ctx);
                        },
                        deleteView: (_, { viewId }, ctx) => viewDomain.deleteView(viewId, ctx)
                    },
                    View: {
                        created_by: async (view, _, ctx) => {
                            const record = await recordDomain.find({
                                params: {
                                    library: library_1.USERS_LIBRARY,
                                    filters: [
                                        { field: 'id', value: view.created_by, condition: record_1.AttributeCondition.EQUAL }
                                    ]
                                },
                                ctx
                            });
                            return record.list.length ? record.list[0] : null;
                        },
                        valuesVersions: (view, _, ctx) => {
                            if (!view.valuesVersions) {
                                return null;
                            }
                            const versions = Object.keys(view.valuesVersions).map(treeId => ({
                                treeId,
                                treeNode: { id: view.valuesVersions[treeId], treeId }
                            }));
                            return versions;
                        },
                        settings: (view) => {
                            return view.settings ? utils.objToNameValArray(view.settings) : null;
                        }
                    }
                }
            };
        }
    };
}
exports.default = default_1;
