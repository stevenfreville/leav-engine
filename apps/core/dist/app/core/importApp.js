"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_upload_1 = require("graphql-upload");
const nanoid_1 = require("nanoid");
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const errors_1 = require("../../_types/errors");
const import_1 = require("../../_types/import");
const tasksManager_1 = require("../../_types/tasksManager");
function default_1({ 'core.domain.import': importDomain = null, 'core.domain.helpers.storeUploadFile': storeUploadFile, 'core.utils': utils = null, 'core.depsManager': depsManager = null, 'core.app.graphql': graphqlApp = null, 'core.infra.db.dbUtils': dbUtils = null, config = null } = {}) {
    const _validateFileFormat = (filename, allowed) => {
        const fileExtension = utils.getFileExtension(filename);
        if (!allowed.includes(fileExtension)) {
            throw new ValidationError_1.default({
                file: {
                    msg: errors_1.Errors.INVALID_FILE_FORMAT,
                    vars: { expected: allowed, received: fileExtension }
                }
            });
        }
    };
    const _importConfig = async (filepath, clearDatabase, ctx, forceNoTask) => {
        if (clearDatabase) {
            await dbUtils.clearDatabase();
        }
        // Run DB migration before doing anything
        await dbUtils.migrate(depsManager);
        return importDomain.importConfig({ filepath, forceNoTask, ctx }, Object.assign({}, (!forceNoTask && {
            // Delete remaining import file.
            callbacks: [
                {
                    moduleName: 'app',
                    subModuleName: 'graphql',
                    name: 'generateSchema',
                    args: [],
                    type: [tasksManager_1.TaskCallbackType.ON_SUCCESS, tasksManager_1.TaskCallbackType.ON_FAILURE, tasksManager_1.TaskCallbackType.ON_CANCEL]
                },
                {
                    moduleName: 'utils',
                    name: 'deleteFile',
                    args: [filepath],
                    type: [tasksManager_1.TaskCallbackType.ON_SUCCESS, tasksManager_1.TaskCallbackType.ON_FAILURE, tasksManager_1.TaskCallbackType.ON_CANCEL]
                }
            ]
        })));
    };
    return {
        importConfig: async (filepath, clear) => {
            try {
                await _importConfig(filepath, clear, {
                    userId: config.defaultUserId,
                    queryId: 'ImportConfig'
                }, true);
            }
            finally {
                await graphqlApp.generateSchema();
            }
        },
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    scalar Upload

                    enum ImportType {
                        ${Object.values(import_1.ImportType).join(' ')}
                    }

                    enum ImportMode {
                        ${Object.values(import_1.ImportMode).join(' ')}
                    }

                    input SheetInput {
                        type: ImportType!
                        mode: ImportMode!
                        library: String!,
                        mapping: [String],
                        keyIndex: Int,
                        linkAttribute: String,
                        keyToIndex: Int,
                        treeLinkLibrary: String,
                    }

                    extend type Mutation {
                        importData(file: Upload!, startAt: Int): ID!
                        importConfig(file: Upload!, clear: Boolean): ID!
                        importExcel(file: Upload!, sheets: [SheetInput], startAt: Int): ID!
                    }
                `,
                resolvers: {
                    Upload: graphql_upload_1.GraphQLUpload,
                    Mutation: {
                        async importConfig(_, { file, clear }, ctx) {
                            const fileData = await file;
                            const allowedExtensions = ['json'];
                            _validateFileFormat(fileData.filename, allowedExtensions);
                            fileData.filename = (0, nanoid_1.nanoid)() + '.' + utils.getFileExtension(fileData.filename);
                            // Store JSON file in local filesystem.
                            await storeUploadFile(fileData, config.import.directory);
                            return _importConfig(`${config.import.directory}/${fileData.filename}`, clear, ctx);
                        },
                        async importData(_, { file, startAt }, ctx) {
                            const fileData = await file;
                            const allowedExtensions = ['json'];
                            _validateFileFormat(fileData.filename, allowedExtensions);
                            fileData.filename = (0, nanoid_1.nanoid)() + '.' + utils.getFileExtension(fileData.filename);
                            // Store JSON file in local filesystem.
                            await storeUploadFile(fileData, config.import.directory);
                            return importDomain.importData({ filename: fileData.filename, ctx }, Object.assign(Object.assign({}, (!!startAt && { startAt })), { callbacks: [
                                    {
                                        moduleName: 'utils',
                                        name: 'deleteFile',
                                        args: [`${config.import.directory}/${fileData.filename}`],
                                        type: [
                                            tasksManager_1.TaskCallbackType.ON_SUCCESS,
                                            tasksManager_1.TaskCallbackType.ON_FAILURE,
                                            tasksManager_1.TaskCallbackType.ON_CANCEL
                                        ]
                                    }
                                ] }));
                            // FIXME: If import fail should we backup database?
                        },
                        async importExcel(_, { file, sheets, startAt }, ctx) {
                            const fileData = await file;
                            const allowedExtensions = ['xlsx'];
                            _validateFileFormat(fileData.filename, allowedExtensions);
                            fileData.filename = (0, nanoid_1.nanoid)() + '.' + utils.getFileExtension(fileData.filename);
                            // Store XLSX file in local filesystem.
                            await storeUploadFile(fileData, config.import.directory);
                            return importDomain.importExcel({ filename: fileData.filename, sheets, startAt }, ctx);
                        }
                    }
                }
            };
            return { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
        }
    };
}
exports.default = default_1;
