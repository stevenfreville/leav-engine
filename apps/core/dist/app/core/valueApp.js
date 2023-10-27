"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const attribute_1 = require("../../_types/attribute");
const record_1 = require("../../_types/record");
function default_1({ 'core.domain.value': valueDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.app.graphql': graphqlApp = null, 'core.app.helpers.convertVersionFromGqlFormat': convertVersionFromGqlFormat = null, 'core.utils': utils = null } = {}) {
    const _convertVersionToGqlFormat = (version) => {
        const versionsNames = Object.keys(version);
        const formattedVersion = [];
        for (const versName of versionsNames) {
            formattedVersion.push({
                treeId: versName,
                treeNode: { id: version[versName], treeId: versName }
            });
        }
        return formattedVersion;
    };
    const _getUser = async (userId, ctx) => {
        const res = await recordDomain.find({
            params: {
                library: 'users',
                filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: userId }]
            },
            ctx
        });
        return res.list[0] ? res.list[0] : null;
    };
    const commonValueResolvers = {
        attribute: (value, _, ctx) => {
            return attributeDomain.getAttributeProperties({ id: value.attribute, ctx });
        },
        created_by: async (value, _, ctx) => {
            return typeof value.created_by === 'undefined' ? null : _getUser(value.created_by, ctx);
        },
        modified_by: async (value, _, ctx) => {
            return typeof value.modified_by === 'undefined' ? null : _getUser(value.modified_by, ctx);
        },
        metadata: (value, _, ctx) => {
            return value.metadata ? (0, utils_1.objectToNameValueArray)(value.metadata) : [];
        },
        version: (value, _, ctx) => {
            return (value === null || value === void 0 ? void 0 : value.version)
                ? (0, utils_1.objectToNameValueArray)(value.version).map(v => ({
                    treeId: v.name,
                    treeNode: { id: v.value, treeId: v.name }
                }))
                : [];
        }
    };
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type ValueVersion {
                        treeId: String!,
                        treeNode: TreeNode
                    }

                    input ValueVersionInput {
                        treeId: String!,
                        treeNodeId: String!
                    }

                    type ValueMetadata {
                        name: String!,
                        value: Value
                    }

                    interface GenericValue {
                        id_value: ID,
                        modified_at: Int,
                        created_at: Int,
                        modified_by: User,
                        created_by: User,
                        version: [ValueVersion],
                        attribute: Attribute,
                        metadata: [ValueMetadata]
                    }

                    type Value implements GenericValue {
                        id_value: ID,
                        value: Any,
                        raw_value: Any,
                        modified_at: Int,
                        created_at: Int,
                        modified_by: User,
                        created_by: User,
                        version: [ValueVersion],
                        attribute: Attribute,
                        metadata: [ValueMetadata]
                    }

                    type saveValueBatchResult {
                        values: [GenericValue!],
                        errors: [ValueBatchError!]
                    }

                    type ValueBatchError {
                        type: String!,
                        attribute: String!,
                        input: String,
                        message: String!
                    }

                    input ValueMetadataInput {
                        name: String!,
                        value: String
                    }

                    type LinkValue implements GenericValue {
                        id_value: ID,
                        value: Record,
                        modified_at: Int,
                        created_at: Int,
                        modified_by: User,
                        created_by: User,
                        version: [ValueVersion],
                        attribute: Attribute,
                        metadata: [ValueMetadata]
                    }

                    type TreeValue implements GenericValue {
                        id_value: ID,
                        modified_at: Int,
                        created_at: Int
                        modified_by: User,
                        created_by: User,
                        value: TreeNode,
                        version: [ValueVersion],
                        attribute: Attribute,
                        metadata: [ValueMetadata]
                    }

                    type DateRangeValue {
                        from: String
                        to: String
                    }

                    input ValueInput {
                        id_value: ID,
                        value: String,
                        metadata: [ValueMetadataInput],
                        version: [ValueVersionInput]
                    }

                    input ValueBatchInput {
                        attribute: ID,
                        id_value: ID,
                        value: String,
                        metadata: [ValueMetadataInput]
                    }

                    extend type Mutation {
                        # Save one value
                        saveValue(library: ID, recordId: ID, attribute: ID, value: ValueInput): GenericValue!

                        # Save values for several attributes at once.
                        # If deleteEmpty is true, empty values will be deleted
                        saveValueBatch(
                            library: ID,
                            recordId: ID,
                            version: [ValueVersionInput],
                            values: [ValueBatchInput],
                            deleteEmpty: Boolean
                        ): saveValueBatchResult!

                        deleteValue(library: ID!, recordId: ID!, attribute: ID!, value: ValueInput): GenericValue!
                    }
                `,
                resolvers: {
                    Mutation: {
                        async saveValue(_, { library, recordId, attribute, value }, ctx) {
                            const valToSave = Object.assign(Object.assign({}, value), { version: convertVersionFromGqlFormat(value.version), metadata: utils.nameValArrayToObj(value.metadata) });
                            const savedVal = await valueDomain.saveValue({
                                library,
                                recordId,
                                attribute,
                                value: valToSave,
                                ctx
                            });
                            return Object.assign({}, savedVal);
                        },
                        async saveValueBatch(parent, { library, recordId, version, values, deleteEmpty }, ctx) {
                            // Convert version
                            const versionToUse = convertVersionFromGqlFormat(version);
                            const convertedValues = values.map(val => (Object.assign(Object.assign({}, val), { version: versionToUse, metadata: utils.nameValArrayToObj(val.metadata) })));
                            const savedValues = await valueDomain.saveValueBatch({
                                library,
                                recordId,
                                values: convertedValues,
                                ctx,
                                keepEmpty: !deleteEmpty
                            });
                            const res = Object.assign(Object.assign({}, savedValues), { values: savedValues.values.map(val => (Object.assign(Object.assign({}, val), { version: Array.isArray(val.version) && val.version.length
                                        ? _convertVersionToGqlFormat(val.version)
                                        : null }))) });
                            return res;
                        },
                        async deleteValue(parent, { library, recordId, attribute, value }, ctx) {
                            return valueDomain.deleteValue({
                                library,
                                recordId,
                                attribute,
                                value,
                                ctx
                            });
                        }
                    },
                    GenericValue: {
                        __resolveType: async (fieldValue, _, ctx) => {
                            const attribute = Array.isArray(fieldValue)
                                ? fieldValue[0].attribute
                                : fieldValue.attribute;
                            const attrProps = await attributeDomain.getAttributeProperties({ id: attribute, ctx });
                            switch (attrProps.type) {
                                case attribute_1.AttributeTypes.SIMPLE:
                                case attribute_1.AttributeTypes.ADVANCED:
                                    return 'Value';
                                case attribute_1.AttributeTypes.SIMPLE_LINK:
                                case attribute_1.AttributeTypes.ADVANCED_LINK:
                                    return 'LinkValue';
                                case attribute_1.AttributeTypes.TREE:
                                    return 'TreeValue';
                            }
                        }
                    },
                    Value: commonValueResolvers,
                    LinkValue: Object.assign(Object.assign({}, commonValueResolvers), { value: parent => {
                            if (parent.value === null) {
                                return null;
                            }
                            return Object.assign(Object.assign({}, parent.value), { 
                                // Add attribute on value as it might be useful for nested resolvers like ancestors
                                attribute: parent.attribute });
                        } }),
                    TreeValue: Object.assign(Object.assign({}, commonValueResolvers), { value: parent => {
                            if (parent.value === null) {
                                return null;
                            }
                            return Object.assign(Object.assign({}, parent.value), { 
                                // Add attribute and treeId on value as it might be useful for nested resolvers like ancestors
                                attribute: parent.attribute, treeId: parent.treeId });
                        } })
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
