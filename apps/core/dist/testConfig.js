"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const config_1 = require("./config");
(async () => {
    // eslint-disable-next-line no-restricted-syntax
    console.log(await (0, config_1.getConfig)());
})();
