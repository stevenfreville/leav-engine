"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_subscriptions_1 = require("graphql-subscriptions");
const joi_1 = __importDefault(require("joi"));
function default_1({ config = null, 'core.infra.amqpService': amqpService = null, 'core.utils.logger': logger = null, 'core.utils': utils = null }) {
    const pubsub = new graphql_subscriptions_1.PubSub();
    const _validateMsg = (msg) => {
        const msgBodySchema = joi_1.default.object().keys({
            time: joi_1.default.number().required(),
            userId: joi_1.default.string().required(),
            emitter: joi_1.default.string().required(),
            payload: joi_1.default.object().keys({
                triggerName: joi_1.default.string().required(),
                data: joi_1.default.any().required()
            })
        });
        const isValid = msgBodySchema.validate(msg);
        if (!!isValid.error) {
            const errorMsg = isValid.error.details.map(e => e.message).join(', ');
            throw new Error(errorMsg);
        }
    };
    const _onMessage = async (msg) => {
        amqpService.consumer.channel.ack(msg);
        const pubSubEvent = JSON.parse(msg.content.toString());
        try {
            _validateMsg(pubSubEvent);
        }
        catch (e) {
            logger.error(e);
        }
        const publishedPayload = Object.assign({ time: pubSubEvent.time, userId: pubSubEvent.userId }, pubSubEvent.payload.data);
        await pubsub.publish(pubSubEvent.payload.triggerName, publishedPayload);
    };
    const _send = async (routingKey, payload, ctx) => {
        await amqpService.publish(config.amqp.exchange, routingKey, JSON.stringify({ time: Date.now(), userId: ctx.userId, emitter: utils.getProcessIdentifier(), payload }));
    };
    return {
        async initPubSubEventsConsumer() {
            // listening pubsub events
            await amqpService.consumer.channel.assertQueue(config.eventsManager.queues.pubsub_events);
            await amqpService.consumer.channel.bindQueue(config.eventsManager.queues.pubsub_events, config.amqp.exchange, config.eventsManager.routingKeys.pubsub_events);
            await amqpService.consume(config.eventsManager.queues.pubsub_events, config.eventsManager.routingKeys.pubsub_events, _onMessage);
        },
        async initCustomConsumer(queue, routingKey, onMessage) {
            // listening pubsub events
            await amqpService.consumer.channel.assertQueue(queue);
            await amqpService.consumer.channel.bindQueue(queue, config.amqp.exchange, routingKey);
            await amqpService.consume(queue, routingKey, msg => onMessage(msg, amqpService.consumer.channel));
        },
        async sendDatabaseEvent(payload, ctx) {
            await _send(config.eventsManager.routingKeys.data_events, payload, ctx);
        },
        async sendPubSubEvent(payload, ctx) {
            await _send(config.eventsManager.routingKeys.pubsub_events, payload, ctx);
        },
        subscribe(triggersName) {
            return pubsub.asyncIterator(triggersName);
        }
    };
}
exports.default = default_1;
