"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPreviewGeneration = exports.generatePreviewMsg = exports.sendPreviewMessage = void 0;
const utils_1 = require("@leav/utils");
const sendPreviewMessage = async (previewMessage, priority, deps) => {
    const msg = JSON.stringify(previewMessage);
    await deps.amqpService.publish(deps.config.amqp.exchange, deps.config.filesManager.routingKeys.previewRequest, msg, priority);
};
exports.sendPreviewMessage = sendPreviewMessage;
const generatePreviewMsg = (recordId, pathAfter, versions, context) => {
    const input = pathAfter;
    const recordIdAsString = recordId.toString();
    const [firstDigit, secondDigit] = [...recordIdAsString];
    const output = `${firstDigit}/${secondDigit}/${recordId}`;
    const extension = 'png';
    const pdfFolderName = 'pdf';
    // add output to version
    const versionsWithOutput = versions.map(version => (Object.assign(Object.assign({}, version), { pdf: `${pdfFolderName}/${output}.pdf`, sizes: version.sizes.map(size => (Object.assign(Object.assign({}, size), { output: `${size.name}/${output}.${extension}` }))) })));
    const previewMsg = {
        input,
        context,
        versions: versionsWithOutput
    };
    return previewMsg;
};
exports.generatePreviewMsg = generatePreviewMsg;
const requestPreviewGeneration = async ({ recordId, pathAfter, libraryId, versions, priority = utils_1.PreviewPriority.LOW, deps }) => {
    const context = { library: libraryId, recordId };
    const previewMessage = (0, exports.generatePreviewMsg)(recordId, pathAfter, versions, context);
    (0, exports.sendPreviewMessage)(previewMessage, priority, Object.assign({}, deps)).catch(function (e) {
        deps.logger.warn(`[FilesManager] error sending prevew request ${e.message}`);
    });
};
exports.requestPreviewGeneration = requestPreviewGeneration;
