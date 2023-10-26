"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_subscriptions_1 = require("graphql-subscriptions");
const eventsManager_1 = require("../../_types/eventsManager");
const library_1 = require("../../_types/library");
const record_1 = require("../../_types/record");
const tasksManager_1 = require("../../_types/tasksManager");
function default_1({ 'core.domain.record': recordDomain = null, 'core.domain.tasksManager': tasksManagerDomain = null, 'core.domain.eventsManager': eventsManager = null }) {
    const _getUser = async (userId, ctx) => {
        const record = await recordDomain.find({
            params: {
                library: library_1.USERS_LIBRARY,
                filters: [{ field: 'id', value: userId, condition: record_1.AttributeCondition.EQUAL }]
            },
            ctx
        });
        return record.list.length ? record.list[0] : null;
    };
    return {
        initMaster: tasksManagerDomain.initMaster,
        initWorker: tasksManagerDomain.initWorker,
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    scalar TaskPriority

                    enum TaskStatus {
                        ${Object.values(tasksManager_1.TaskStatus).join(' ')}
                    }

                    enum TaskType {
                        ${Object.values(tasksManager_1.TaskType).join(' ')}
                    }

                    type TaskLink {
                        name: String!,
                        url: String!
                    }

                    type TaskRole {
                        type: TaskType!,
                        detail: String
                    }

                    type Task {
                        id: ID!,
                        label: SystemTranslation!,
                        modified_at: Int!,
                        created_at: Int!,
                        created_by: User!,
                        startAt: Int!,
                        status: TaskStatus!,
                        priority: TaskPriority!,
                        archive: Boolean!,
                        role: TaskRole,
                        progress: Progress,
                        startedAt: Int,
                        completedAt: Int,
                        link: TaskLink,
                        canceledBy: User
                    }

                    type Progress {
                        percent: Int
                        description: SystemTranslation
                    }

                    type TasksList {
                        totalCount: Int!
                        list: [Task!]!
                    }

                    input TaskFiltersInput {
                        id: ID,
                        created_by: ID,
                        status: TaskStatus,
                        archive: Boolean,
                        type: TaskType
                    }

                    input DeleteTaskInput {
                        id: ID!
                        archive: Boolean!
                    }

                    extend type Query {
                        tasks(
                            filters: TaskFiltersInput,
                            pagination: Pagination,
                            sort: RecordSortInput
                        ): TasksList!
                    }

                    extend type Mutation {
                        cancelTask(taskId: ID!): Boolean!
                        deleteTasks(tasks: [DeleteTaskInput!]!): Boolean!
                    }

                    type Subscription {
                        task(filters: TaskFiltersInput): Task!
                    }
                `,
                resolvers: {
                    TaskPriority: tasksManager_1.TaskPriority,
                    Task: {
                        created_by: async (task, _, ctx) => {
                            return _getUser(task.created_by, ctx);
                        },
                        canceledBy: async (task, _, ctx) => {
                            if (!task.canceledBy) {
                                return null;
                            }
                            return _getUser(task.canceledBy, ctx);
                        }
                    },
                    Query: {
                        async tasks(_, { filters, pagination, sort }, ctx) {
                            return tasksManagerDomain.getTasks({
                                params: { filters, pagination, sort, withCount: true },
                                ctx
                            });
                        }
                    },
                    Mutation: {
                        async deleteTasks(_, { tasks }, ctx) {
                            await tasksManagerDomain.deleteTasks(tasks, ctx);
                            return true;
                        },
                        async cancelTask(_, { taskId }, ctx) {
                            await tasksManagerDomain.cancelTask({ id: taskId }, ctx);
                            return true;
                        }
                    },
                    Subscription: {
                        task: {
                            subscribe: (0, graphql_subscriptions_1.withFilter)(() => eventsManager.subscribe([eventsManager_1.TriggerNames.TASK]), (payload, variables) => {
                                var _a, _b, _c, _d, _e, _f;
                                let toReturn = true;
                                if (typeof ((_a = variables.filters) === null || _a === void 0 ? void 0 : _a.created_by) !== 'undefined') {
                                    toReturn = payload.task.created_by === variables.filters.created_by;
                                }
                                if (toReturn && typeof ((_b = variables.filters) === null || _b === void 0 ? void 0 : _b.id) !== 'undefined') {
                                    toReturn = payload.task.id === variables.filters.id;
                                }
                                if (toReturn && typeof ((_c = variables.filters) === null || _c === void 0 ? void 0 : _c.status) !== 'undefined') {
                                    toReturn = payload.task.status === variables.filters.status;
                                }
                                if (toReturn && typeof ((_d = variables.filters) === null || _d === void 0 ? void 0 : _d.archive) !== 'undefined') {
                                    toReturn = payload.task.archive === variables.filters.archive;
                                }
                                if (toReturn && typeof ((_e = variables.filters) === null || _e === void 0 ? void 0 : _e.type) !== 'undefined') {
                                    toReturn = ((_f = payload.task.role) === null || _f === void 0 ? void 0 : _f.type) === variables.filters.type;
                                }
                                return toReturn;
                            })
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
