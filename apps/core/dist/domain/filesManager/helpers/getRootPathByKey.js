"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootPathByKey = void 0;
const getRootPathByKey = (rootKey, config) => {
    const rootPathConfig = config.files.rootPaths;
    // Paths config is in the form of: "key1:path1,key2:path2"
    const pathsByKeys = rootPathConfig.split(',').reduce((paths, pathByKey) => {
        // Trim all the thing to be tolerant with trailing spaces
        const [key, path] = pathByKey.trim().split(':');
        paths[key.trim()] = path.trim();
        return paths;
    }, {});
    if (!pathsByKeys[rootKey]) {
        throw new Error(`Root path for key ${rootKey} not found`);
    }
    return pathsByKeys[rootKey];
};
exports.getRootPathByKey = getRootPathByKey;
