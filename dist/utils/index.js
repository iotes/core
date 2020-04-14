"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeviceDispatchable = function (name, type, payload, meta, error) {
    var _a;
    return (_a = {},
        _a[name] = {
            type: type,
            name: name,
            payload: payload,
            meta: meta,
            error: error || null,
        },
        _a);
};
exports.createHostDispatchable = function (name, type, payload, meta, error) {
    var _a;
    return (_a = {},
        _a[name] = {
            type: type,
            name: name,
            payload: payload,
            meta: meta,
            error: error || null,
        },
        _a);
};
exports.loopbackGuard = function (deviceName, state, client, callback) {
    if (state[deviceName] && state[deviceName]['@@source'] === client.name) {
        callback();
    }
};
//# sourceMappingURL=index.js.map