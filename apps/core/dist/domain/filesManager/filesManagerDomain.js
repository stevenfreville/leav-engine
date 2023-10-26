"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@leav/utils");
const add_filename_increment_1 = __importDefault(require("add-filename-increment"));
const joi_1 = __importDefault(require("joi"));
const Path = __importStar(require("path"));
const uuid_1 = require("uuid");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const permissionRepo_1 = require("../../infra/permission/permissionRepo");
const errors_1 = require("../../_types/errors");
const eventsManager_1 = require("../../_types/eventsManager");
const filesManager_1 = require("../../_types/filesManager");
const library_1 = require("../../_types/library");
const permissions_1 = require("../../_types/permissions");
const record_1 = require("../../_types/record");
const getRootPathByKey_1 = require("./helpers/getRootPathByKey");
const handleFileUtilsHelper_1 = require("./helpers/handleFileUtilsHelper");
const handlePreview_1 = require("./helpers/handlePreview");
const handlePreviewResponse_1 = require("./helpers/handlePreviewResponse");
const _constants_1 = require("./_constants");
function default_1({ config = null, 'core.utils': utils = null, 'core.infra.amqpService': amqpService = null, 'core.utils.logger': logger = null, 'core.domain.record': recordDomain = null, 'core.domain.value': valueDomain = null, 'core.domain.tree': treeDomain = null, 'core.domain.permission.library': libraryPermissionDomain = null, 'core.domain.filesManager.helpers.messagesHandler': messagesHandler = null, 'core.domain.helpers.storeUploadFile': storeUploadFile = null, 'core.domain.helpers.createDirectory': createDirectory = null, 'core.domain.library': libraryDomain = null, 'core.domain.helpers.updateRecordLastModif': updateRecordLastModif = null, 'core.domain.record.helpers.sendRecordUpdateEvent': sendRecordUpdateEvent = null, 'core.domain.eventsManager': eventsManager = null, 'core.infra.record': recordRepo = null, translator = null }) {
    let _defaultCtx;
    const _initDefaultCtx = async () => {
        _defaultCtx = {
            userId: config.filesManager.userId,
            queryId: (0, uuid_1.v4)()
        };
        const groupsNodes = (await Promise.all(config.filesManager.userGroupsIds.split(',').map(groupId => treeDomain.getNodesByRecord({
            treeId: permissionRepo_1.USERS_GROUP_TREE_NAME,
            record: {
                id: groupId,
                library: permissionRepo_1.USERS_GROUP_LIB_NAME
            },
            ctx: Object.assign({}, _defaultCtx)
        }))))[0];
        _defaultCtx.groupsId = groupsNodes;
    };
    const _onMessage = async (msg) => {
        amqpService.consumer.channel.ack(msg);
        let msgBody;
        const ctx = Object.assign(Object.assign({}, _defaultCtx), { queryId: (0, uuid_1.v4)() });
        try {
            msgBody = JSON.parse(msg.content.toString());
            _validateMsg(msgBody);
        }
        catch (e) {
            logger.error(`[FilesManager] Invalid message:
                ${e.message}.
                Message was: ${msg}
                `);
            return;
        }
        messagesHandler.handleMessage(msgBody, ctx);
    };
    const _validateMsg = (msg) => {
        const msgBodySchema = joi_1.default.object().keys({
            event: joi_1.default.string()
                .equal(...Object.keys(filesManager_1.FileEvents))
                .required(),
            time: joi_1.default.number().required(),
            pathBefore: joi_1.default.string().allow(null),
            pathAfter: joi_1.default.string().allow(null),
            inode: joi_1.default.number().required(),
            rootKey: joi_1.default.string().required(),
            isDirectory: joi_1.default.boolean().required(),
            hash: joi_1.default.string(),
            recordId: joi_1.default.string()
        });
        const isValid = msgBodySchema.validate(msg);
        if (!!isValid.error) {
            const errorMsg = isValid.error.details.map(e => e.message).join(', ');
            throw new Error(errorMsg);
        }
    };
    const _extractChildrenFromNodes = (nodes, records = []) => {
        for (const n of nodes) {
            records.push(n.record);
            if (!!n.children) {
                records = _extractChildrenFromNodes(n.children, records);
            }
        }
        return records;
    };
    /**
     * Retrieve children nodes for each record
     * To make sure we don't have duplicates, store it on an object */
    const _getAllChildrenRecords = async (treeId, records, libraryId, filesLibraryId, ctx) => {
        return records.reduce(async (promAcc, record) => {
            const acc = await promAcc;
            const treeNodes = await treeDomain.getNodesByRecord({
                treeId,
                record: { id: record.id, library: libraryId },
                ctx
            });
            // Get children for first node only, as a record in file tree shouldn't be at multiple places
            const nodes = await treeDomain.getTreeContent({
                treeId,
                startingNode: treeNodes[0],
                ctx
            });
            const childrenRecords = _extractChildrenFromNodes(nodes);
            for (const childRecord of childrenRecords) {
                // Only keep records from files library (ignore directories)
                if (childRecord.library === filesLibraryId) {
                    acc[childRecord.id] = childRecord;
                }
            }
            return acc;
        }, {});
    };
    const _getSplittedListFiles = (list) => list.split(',').filter(p => p);
    return {
        async init() {
            await amqpService.consumer.channel.assertQueue(config.filesManager.queues.events);
            await amqpService.consumer.channel.bindQueue(config.filesManager.queues.events, config.amqp.exchange, config.filesManager.routingKeys.events);
            await (0, handlePreviewResponse_1.initPreviewResponseHandler)(config, logger, {
                amqpService,
                libraryDomain,
                recordDomain,
                valueDomain,
                recordRepo,
                updateRecordLastModif,
                sendRecordUpdateEvent,
                config,
                logger,
                utils
            });
            await _initDefaultCtx();
            await amqpService.consume(config.filesManager.queues.events, config.filesManager.routingKeys.events, _onMessage);
            logger.info('Files Manager is ready. Waiting for messages... 👀');
        },
        async createDirectory({ library, nodeId, name }, ctx) {
            const filesLibrary = utils.getFilesLibraryId(library);
            const treeId = treeDomain.getLibraryTreeId(filesLibrary, ctx);
            const recordNode = await treeDomain.getRecordByNodeId({ treeId, nodeId, ctx });
            // default path is root path
            let path = '.';
            if (!!recordNode) {
                const libProperties = await libraryDomain.getLibraryProperties(recordNode.library, ctx);
                if (libProperties.behavior !== library_1.LibraryBehavior.DIRECTORIES) {
                    throw utils.generateExplicitValidationError('directories', errors_1.Errors.ONLY_FOLDERS_CAN_BE_SELECTED, ctx.lang);
                }
                path = Path.join(recordNode.file_path, recordNode.file_name);
            }
            // get root key of library from config
            const rootKey = Object.keys(config.filesManager.rootKeys).find(key => config.filesManager.rootKeys[key] === filesLibrary);
            const rootPath = this.getRootPathByKey(rootKey);
            const fullPath = Path.join(rootPath, path);
            // check if a folder with the same name already exists at this path
            const fileExists = await recordDomain.find({
                params: {
                    library,
                    filters: [
                        {
                            field: filesManager_1.FilesAttributes.FILE_NAME,
                            condition: record_1.AttributeCondition.EQUAL,
                            value: name
                        },
                        {
                            operator: record_1.Operator.AND
                        },
                        {
                            field: filesManager_1.FilesAttributes.FILE_PATH,
                            condition: record_1.AttributeCondition.EQUAL,
                            value: path
                        }
                    ],
                    withCount: true,
                    retrieveInactive: true
                },
                ctx
            });
            if (fileExists.totalCount) {
                throw utils.generateExplicitValidationError('directories', errors_1.Errors.DUPLICATE_DIRECTORY_NAMES, ctx.lang);
            }
            const creationRes = await recordDomain.createRecord({ library, ctx });
            const systemCtx = {
                userId: config.defaultUserId,
                queryId: 'saveValueBatchOnCreatingFolder'
            };
            await recordDomain.updateRecord({
                library,
                recordData: {
                    id: creationRes.record.id,
                    [filesManager_1.FilesAttributes.FILE_NAME]: name,
                    [filesManager_1.FilesAttributes.FILE_PATH]: path,
                    [filesManager_1.FilesAttributes.ROOT_KEY]: rootKey
                },
                ctx: systemCtx
            });
            await createDirectory(name, fullPath, ctx);
            return creationRes.record;
        },
        async storeFiles({ library, nodeId, files }, ctx) {
            var _a;
            const filenames = files.map(f => f.data.filename);
            const treeId = treeDomain.getLibraryTreeId(library, ctx);
            const recordNode = await treeDomain.getRecordByNodeId({ treeId, nodeId, ctx });
            // default path is root path
            let path = '.';
            if (!!recordNode) {
                const libProperties = await libraryDomain.getLibraryProperties(recordNode.library, ctx);
                if (libProperties.behavior !== library_1.LibraryBehavior.DIRECTORIES) {
                    throw utils.generateExplicitValidationError('files', errors_1.Errors.ONLY_FOLDERS_CAN_BE_SELECTED, ctx.lang);
                }
                path = Path.join(recordNode.file_path, recordNode.file_name);
            }
            // get root key of library from config
            const rootKey = Object.keys(config.filesManager.rootKeys).find(key => config.filesManager.rootKeys[key] === library);
            const rootPath = this.getRootPathByKey(rootKey);
            const fullPath = Path.join(rootPath, path);
            // Check if file is allowed according to allow/ignore lists
            const allowList = _getSplittedListFiles(config.filesManager.allowFilesList);
            const ignoreList = _getSplittedListFiles(config.filesManager.ignoreFilesList);
            const forbiddenFiles = filenames.filter(f => {
                const fullFilename = `${fullPath}/${f}`;
                const isAllowed = (0, utils_1.isFileAllowed)(rootPath, allowList, ignoreList, fullFilename);
                return !isAllowed;
            });
            if (forbiddenFiles.length) {
                throw utils.generateExplicitValidationError('files', { msg: errors_1.Errors.FORBIDDEN_FILES, vars: { files: forbiddenFiles.join(', ') } }, ctx.lang);
            }
            // Check if files have the same filename
            if (filenames.filter((f, i) => filenames.indexOf(f) !== i).length) {
                throw utils.generateExplicitValidationError('files', errors_1.Errors.DUPLICATE_FILENAMES, ctx.lang);
            }
            const records = [];
            for (const file of files) {
                file.replace = (_a = file.replace) !== null && _a !== void 0 ? _a : false;
                // check if file already exists
                const fileExists = await recordDomain.find({
                    params: {
                        library,
                        filters: [
                            {
                                field: filesManager_1.FilesAttributes.FILE_NAME,
                                condition: record_1.AttributeCondition.EQUAL,
                                value: file.data.filename
                            },
                            {
                                operator: record_1.Operator.AND
                            },
                            {
                                field: filesManager_1.FilesAttributes.FILE_PATH,
                                condition: record_1.AttributeCondition.EQUAL,
                                value: path
                            }
                        ],
                        withCount: true,
                        retrieveInactive: true
                    },
                    ctx
                });
                let record;
                if (fileExists.totalCount && file.replace) {
                    const canEdit = await libraryPermissionDomain.getLibraryPermission({
                        action: permissions_1.LibraryPermissionsActions.EDIT_RECORD,
                        userId: ctx.userId,
                        libraryId: library,
                        ctx
                    });
                    if (!canEdit) {
                        throw new PermissionError_1.default(permissions_1.LibraryPermissionsActions.EDIT_RECORD);
                    }
                    record = fileExists.list[0];
                }
                else {
                    const createRecordResult = await recordDomain.createRecord({ library, ctx });
                    record = createRecordResult.record;
                    // if file already exists, we modify the filename
                    if (fileExists.totalCount && !file.replace) {
                        const newPath = add_filename_increment_1.default.path(`${fullPath}/${file.data.filename}`, {
                            fs: true,
                            platform: 'darwin'
                        });
                        file.data.filename = newPath.split('/').pop();
                    }
                    const systemCtx = {
                        userId: config.defaultUserId,
                        queryId: 'saveValueBatchOnStoringFiles'
                    };
                    await recordDomain.updateRecord({
                        library,
                        recordData: {
                            id: record.id,
                            [filesManager_1.FilesAttributes.FILE_NAME]: file.data.filename,
                            [filesManager_1.FilesAttributes.FILE_PATH]: path,
                            [filesManager_1.FilesAttributes.ROOT_KEY]: rootKey
                        },
                        ctx: systemCtx
                    });
                }
                const getProgress = async (progress) => {
                    // Round all progress values to have integers
                    Object.keys(progress).forEach(key => {
                        progress[key] = Math.floor(progress[key]);
                    });
                    await eventsManager.sendPubSubEvent({
                        triggerName: eventsManager_1.TriggerNames.UPLOAD_FILE,
                        data: { upload: { uid: file.uid, userId: ctx.userId, progress } }
                    }, ctx);
                };
                await storeUploadFile(file.data, fullPath, getProgress, file.size);
                records.push({ uid: file.uid, record });
            }
            return records;
        },
        getPreviewVersion() {
            return _constants_1.systemPreviewsSettings;
        },
        async forcePreviewsGeneration({ ctx, libraryId, failedOnly, filters, recordIds = [], previewVersionSizeNames }) {
            const libraryProps = await libraryDomain.getLibraryProperties(libraryId, ctx);
            if (!recordIds.length && !filters && libraryProps.behavior === library_1.LibraryBehavior.DIRECTORIES) {
                // Nothing to do if we ask to generate previews for directories
                return false;
            }
            // If we have both filters and recordIds, ignore filters
            const recordsFilters = filters && !recordIds.length
                ? filters
                : recordIds.reduce((allFilters, recordId, index) => {
                    allFilters.push({
                        field: 'id',
                        value: recordId,
                        condition: record_1.AttributeCondition.EQUAL
                    });
                    if (index !== recordIds.length - 1) {
                        allFilters.push({
                            operator: record_1.Operator.OR
                        });
                    }
                    return allFilters;
                }, []);
            const records = (await recordDomain.find({ params: { library: libraryId, filters: recordsFilters }, ctx }))
                .list;
            if (!records.length) {
                // No records found, nothing to do
                return false;
            }
            // If library is a directory library: recreate all previews of subfiles
            let recordsToProcess;
            let filesLibraryProps;
            if (libraryProps.behavior === library_1.LibraryBehavior.DIRECTORIES) {
                // Find tree where this directory belongs
                const trees = await treeDomain.getTrees({ params: { filters: { library: libraryId } }, ctx });
                const tree = trees.list[0];
                const treeLibraries = await Promise.all(Object.keys(tree.libraries).map(treeLibraryId => libraryDomain.getLibraryProperties(treeLibraryId, ctx)));
                const filesLibraryId = treeLibraries.find(l => l.behavior === library_1.LibraryBehavior.FILES).id;
                filesLibraryProps = await libraryDomain.getLibraryProperties(filesLibraryId, ctx);
                if (trees.list.length) {
                    const treeId = tree.id;
                    const recordsById = await _getAllChildrenRecords(treeId, records, libraryId, filesLibraryId, ctx);
                    recordsToProcess = Object.values(recordsById);
                }
            }
            else {
                recordsToProcess = records;
                filesLibraryProps = libraryProps;
            }
            let generationRequested = 0;
            let versions = utils.previewsSettingsToVersions(filesLibraryProps.previewsSettings);
            // if preview version size names are specified we generate only theses previews
            if (previewVersionSizeNames === null || previewVersionSizeNames === void 0 ? void 0 : previewVersionSizeNames.length) {
                versions = versions.reduce((acc, curr) => {
                    const sizes = curr.sizes.filter(s => previewVersionSizeNames.includes(s.name));
                    if (sizes.length) {
                        acc.push(Object.assign(Object.assign({}, curr), { sizes }));
                    }
                    return acc;
                }, []);
            }
            for (const r of recordsToProcess) {
                if (!failedOnly ||
                    (failedOnly &&
                        Object.entries(r[utils.getPreviewsStatusAttributeName(libraryProps.id)]).some(p => p[1].status !== 0))) {
                    const { previewsStatus, previews } = (0, handleFileUtilsHelper_1.getPreviewsDefaultData)(_constants_1.systemPreviewsSettings);
                    const recordData = {
                        [utils.getPreviewsStatusAttributeName(libraryProps.id)]: previewsStatus,
                        [utils.getPreviewsAttributeName(libraryProps.id)]: previews
                    };
                    await (0, handleFileUtilsHelper_1.updateRecordFile)(recordData, r.id, libraryId, {
                        recordRepo,
                        updateRecordLastModif,
                        sendRecordUpdateEvent,
                        valueDomain,
                        config,
                        logger
                    }, ctx);
                    await (0, handlePreview_1.requestPreviewGeneration)({
                        recordId: r.id,
                        pathAfter: `${r[filesManager_1.FilesAttributes.FILE_PATH]}/${r[filesManager_1.FilesAttributes.FILE_NAME]}`,
                        libraryId: r.library,
                        priority: utils_1.PreviewPriority.MEDIUM,
                        versions,
                        deps: { amqpService, config, logger }
                    });
                    generationRequested++;
                }
            }
            return generationRequested > 0;
        },
        getRootPathByKey(rootKey) {
            return (0, getRootPathByKey_1.getRootPathByKey)(rootKey, config);
        },
        async doesFileExistAsChild({ treeId, filename, parentNodeId }, ctx) {
            const nodes = await treeDomain.getElementChildren({ treeId, nodeId: parentNodeId, ctx });
            return nodes.list.findIndex(n => n.record[filesManager_1.FilesAttributes.FILE_NAME] === filename) !== -1;
        },
        async getOriginalPath({ fileId, libraryId, ctx }) {
            // Get file record
            const fileRecords = await recordDomain.find({
                params: {
                    library: libraryId,
                    filters: [{ field: 'id', value: fileId, condition: record_1.AttributeCondition.EQUAL }]
                },
                ctx
            });
            if (!fileRecords.list.length) {
                throw new ValidationError_1.default({
                    id: errors_1.Errors.FILE_NOT_FOUND
                }, translator.t('errors.FILE_NOT_FOUND'));
            }
            const fileRecord = fileRecords.list[0];
            // Get root path from file root key
            let rootPath = this.getRootPathByKey(fileRecord[filesManager_1.FilesAttributes.ROOT_KEY]);
            // Handle famous issue of presence or not of trailing slash in a path
            if (rootPath[rootPath.length - 1] !== '/') {
                rootPath += '/';
            }
            // Return original path
            const fullPath = `${rootPath}${fileRecord[filesManager_1.FilesAttributes.FILE_PATH]}/${fileRecord[filesManager_1.FilesAttributes.FILE_NAME]}`;
            // Clean double slashes, just to be sure
            return fullPath.replace('//', '/');
        }
    };
}
exports.default = default_1;
