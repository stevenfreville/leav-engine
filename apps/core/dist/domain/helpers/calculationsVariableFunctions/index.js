"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.record': recordDomain = null, 'core.domain.attribute': attributeDomain = null } = {}) {
    const first = async (context, inputValue) => {
        return [
            Object.assign({}, inputValue[0])
        ];
    };
    const input = first;
    const last = async (context, inputValue) => {
        return [
            Object.assign({}, inputValue[inputValue.length - 1])
        ];
    };
    const sum = async (context, inputValue) => {
        return [
            Object.assign(Object.assign({}, inputValue[0]), { value: inputValue.reduce((acc, v) => {
                    const value = typeof v.value === 'object' ? v.value.value : v.value;
                    return acc + parseFloat(value);
                }, 0) })
        ];
    };
    const avg = async (context, inputValue) => {
        return [
            Object.assign(Object.assign({}, inputValue[0]), { value: inputValue.reduce((acc, v) => {
                    const value = typeof v.value === 'object' ? v.value.value : v.value;
                    return acc + parseFloat(value);
                }, 0) / inputValue.length })
        ];
    };
    const concat = async (context, inputValue, separator) => {
        return [
            Object.assign(Object.assign({}, inputValue[0]), { value: inputValue.map(v => v.value).join(separator) })
        ];
    };
    const dedup = async (context, inputValue) => {
        const seen = {};
        return inputValue.filter(function (v) {
            const stringRepresentation = JSON.stringify(v.value);
            return seen.hasOwnProperty(stringRepresentation) ? false : (seen[stringRepresentation] = true);
        });
    };
    const getValue = async (context, inputValue, attributeKey) => {
        const properties = await attributeDomain.getAttributeProperties({ id: attributeKey, ctx: context });
        let returnValue = Object.assign({}, inputValue);
        const tmpPromises = inputValue.map(async (inputV) => {
            const recordId = inputV.recordId;
            const library = inputV.library;
            let values = await recordDomain.getRecordFieldValue({
                library,
                record: {
                    id: recordId,
                    library
                },
                attributeId: attributeKey,
                ctx: context
            });
            let currReturnValue = [Object.assign({}, inputV)];
            if (!Array.isArray(values)) {
                values = [values];
            }
            if (values.length) {
                currReturnValue = [];
                if (properties === null || properties === void 0 ? void 0 : properties.linked_library) {
                    currReturnValue = values
                        .map(v => !!(v === null || v === void 0 ? void 0 : v.value)
                        ? {
                            library: properties === null || properties === void 0 ? void 0 : properties.linked_library,
                            recordId: v.value.id,
                            value: v.value.id
                        }
                        : null)
                        .filter(v => !!v);
                }
                else {
                    currReturnValue = values.map(v => {
                        var _a;
                        return ({
                            library,
                            recordId,
                            value: (_a = v === null || v === void 0 ? void 0 : v.value) !== null && _a !== void 0 ? _a : null
                        });
                    });
                }
            }
            else {
                currReturnValue = [];
            }
            return currReturnValue;
        });
        const tmp = await Promise.all(tmpPromises);
        if (tmp.length) {
            returnValue = tmp.reduce((acc, v) => {
                acc = [...acc, ...v];
                return acc;
            }, []);
        }
        else {
            returnValue = [];
        }
        return returnValue;
    };
    return {
        input: {
            run: input,
            after: []
        },
        first: {
            run: first,
            after: []
        },
        last: {
            run: last,
            after: []
        },
        sum: {
            run: sum,
            after: []
        },
        avg: {
            run: avg,
            after: []
        },
        concat: {
            run: concat,
            after: []
        },
        dedup: {
            run: dedup,
            after: []
        },
        getValue: {
            run: getValue,
            after: []
        }
    };
}
exports.default = default_1;
