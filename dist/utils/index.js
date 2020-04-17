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
    var _a, _b;
    if (state[deviceName] && ((_a = state[deviceName]) === null || _a === void 0 ? void 0 : _a['@@source']) !== ((_b = client) === null || _b === void 0 ? void 0 : _b.name)) {
        callback();
    }
};
//# sourceMappingURL=index.js.map