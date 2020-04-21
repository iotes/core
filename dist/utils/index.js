"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeviceDispatchable = function (name, type, payload, meta, source, error) {
    var _a;
    if (meta === void 0) { meta = {}; }
    return (_a = {},
        _a[name] = {
            type: type,
            name: name,
            source: source,
            payload: payload,
            meta: meta,
            error: error || null,
        },
        _a);
};
exports.createHostDispatchable = function (name, type, payload, meta, source, error) {
    var _a;
    if (meta === void 0) { meta = {}; }
    return (_a = {},
        _a[name] = {
            type: type,
            name: name,
            source: source,
            payload: payload,
            meta: meta,
            error: error || null,
        },
        _a);
};
exports.insertMetadata = function (dispatchable, meta) { return (Object.keys(dispatchable).reduce(function (a, key) {
    var _a;
    return (__assign(__assign({}, a), (_a = {}, _a[key] = __assign(__assign({}, dispatchable[key]), meta), _a)));
}, {})); };
//# sourceMappingURL=index.js.map