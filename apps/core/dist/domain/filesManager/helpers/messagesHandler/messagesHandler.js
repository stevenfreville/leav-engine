"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Handle messages: new messages are stacked in a queue. Then we process them one by one.
// The purpose is to make sure we process message in the same order they are received.
// Otherwise, we may have a situation where we try to add a file to a directory,
// but the directory is not yet created.
function default_1({ 'core.utils.logger': logger = null, 'core.domain.filesManager.helpers.handleFileSystemEvent': handleFileSystemEvent = null, config = null }) {
    const _messagesQueue = [];
    let _isWorking = false;
    const _processMessage = async (ctx) => {
        if (_isWorking || !_messagesQueue.length) {
            return;
        }
        _isWorking = true;
        const message = _messagesQueue.shift();
        try {
            const library = config.filesManager.rootKeys[message.rootKey];
            await handleFileSystemEvent(message, { library }, ctx);
        }
        catch (e) {
            console.error(e);
            logger.error(`[FilesManager] Error when processing file event msg:${e.message}. Message was: ${message}`);
        }
        _isWorking = false;
        _processMessage(ctx);
    };
    return {
        handleMessage(message, ctx) {
            _messagesQueue.push(message);
            _processMessage(ctx);
        }
    };
}
exports.default = default_1;
