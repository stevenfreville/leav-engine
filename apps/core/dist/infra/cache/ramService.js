"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ config = null, 'core.infra.redis': redis = null }) {
    return {
        async storeData({ key, data, expiresIn }) {
            await redis.SET(key, data, { PX: expiresIn });
        },
        async getData(keys) {
            return redis.MGET(keys);
        },
        async deleteData(keys) {
            for (const k of keys) {
                let cursor = 0;
                do {
                    const res = await redis.SCAN(cursor, { MATCH: k });
                    cursor = res.cursor;
                    if (res.keys.length) {
                        await redis.DEL(res.keys);
                    }
                } while (cursor !== 0);
            }
        },
        async deleteAll() {
            await redis.FLUSHDB();
        }
    };
}
exports.default = default_1;
