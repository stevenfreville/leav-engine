"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.tasksManager': tasksManagerDomain = null, config = null, translator = null }) {
    // return new percent of progress
    return async (taskId, currPercent, ctx, upData) => {
        const newPercent = !!upData.position ? Math.ceil((upData.position.index / upData.position.total) * 100) : null;
        if (!!upData.position || !!upData.translationKey) {
            await tasksManagerDomain.updateProgress(taskId, Object.assign(Object.assign({}, (newPercent && newPercent >= currPercent + 1 && { percent: newPercent })), (!!upData.translationKey && {
                description: config.lang.available.reduce((labels, lang) => {
                    labels[lang] = `${translator.t(upData.translationKey, { lng: lang })}`;
                    return labels;
                }, {})
            })), ctx);
        }
        return newPercent !== null && newPercent !== void 0 ? newPercent : currPercent;
    };
}
exports.default = default_1;
