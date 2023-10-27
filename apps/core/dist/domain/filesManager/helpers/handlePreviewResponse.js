"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPreviewResponseHandler = void 0;
const uuid_1 = require("uuid");
const handleFileUtilsHelper_1 = require("./handleFileUtilsHelper");
const _onMessage = async (msg, logger, deps) => {
    deps.amqpService.consumer.channel.ack(msg);
    let previewResponse;
    const ctx = {
        userId: deps.config.filesManager.userId,
        queryId: (0, uuid_1.v4)()
    };
    try {
        previewResponse = JSON.parse(msg.content.toString());
    }
    catch (e) {
        logger.error(`[FilesManager] Preview return invalid message:
            ${e.message}.
            Message was: ${msg}'
            `);
        return;
    }
    const { library, recordId } = previewResponse.context;
    const libraryProps = await deps.libraryDomain.getLibraryProperties(library, ctx);
    // Update previews info in the record
    const previewsStatus = {};
    const previews = {};
    for (const previewResult of previewResponse.results) {
        // if possible take name from response
        if (previewResult.params && previewResult.params.name) {
            const name = previewResult.params.name;
            previewsStatus[name] = {
                status: previewResult.error,
                message: previewResult.error_detail
            };
            previews[name] = previewResult.params.output;
        }
        else {
            const versions = deps.utils.previewsSettingsToVersions(libraryProps.previewsSettings);
            for (const version in versions) {
                if (previewResponse[version]) {
                    previewsStatus[version] = {
                        status: previewResult.error,
                        message: previewResult.error_detail
                    };
                }
            }
        }
    }
    const recordData = {
        [deps.utils.getPreviewsStatusAttributeName(library)]: previewsStatus,
        [deps.utils.getPreviewsAttributeName(library)]: previews
    };
    await (0, handleFileUtilsHelper_1.updateRecordFile)(recordData, recordId, library, {
        valueDomain: deps.valueDomain,
        recordRepo: deps.recordRepo,
        updateRecordLastModif: deps.updateRecordLastModif,
        sendRecordUpdateEvent: deps.sendRecordUpdateEvent,
        config: deps.config,
        logger: deps.logger
    }, ctx);
};
const initPreviewResponseHandler = async (config, logger, deps) => {
    await deps.amqpService.consumer.channel.assertQueue(config.filesManager.queues.previewResponse);
    await deps.amqpService.consumer.channel.bindQueue(config.filesManager.queues.previewResponse, config.amqp.exchange, config.filesManager.routingKeys.previewResponse);
    await deps.amqpService.consume(config.filesManager.queues.previewResponse, config.filesManager.routingKeys.previewResponse, (msg) => _onMessage(msg, logger, deps));
};
exports.initPreviewResponseHandler = initPreviewResponseHandler;
