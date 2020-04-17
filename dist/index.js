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
var store_1 = require("./store");
var environment_1 = require("./environment");
var logger_1 = require("./logger");
var integrate_1 = require("./integrate");
var identity_1 = require("./plugins/identity");
var utils_1 = require("./utils");
exports.createDeviceDispatchable = utils_1.createDeviceDispatchable;
exports.createHostDispatchable = utils_1.createHostDispatchable;
exports.loopbackGuard = utils_1.loopbackGuard;
var insertMetadata = function (dispatchable, meta) { return (Object.keys(dispatchable).reduce(function (a, key) {
    var _a;
    return (__assign(__assign({}, a), (_a = {}, _a[key] = __assign(__assign({}, dispatchable[key]), meta), _a)));
}, {})); };
var createIotes = function (_a) {
    var topology = _a.topology, strategy = _a.strategy, _b = _a.plugin, plugin = _b === void 0 ? identity_1.identityPlugin : _b, logLevel = _a.logLevel, logger = _a.logger;
    // Set up logger
    environment_1.EnvironmentObject.logger = logger_1.createLogger(logger, logLevel);
    var env = environment_1.EnvironmentObject;
    // Set up stores
    environment_1.EnvironmentObject.stores = __assign(__assign({}, environment_1.EnvironmentObject.stores), { host$: store_1.createStore(), device$: store_1.createStore() });
    var _c = environment_1.EnvironmentObject.stores, host$ = _c.host$, device$ = _c.device$;
    try {
        integrate_1.createIntegration(strategy({
            hostDispatch: host$.dispatch,
            deviceDispatch: device$.dispatch,
            hostSubscribe: host$.subscribe,
            deviceSubscribe: device$.subscribe,
        }), topology);
    }
    catch (error) {
        if (error && error.length > 0) {
            throw Error(error);
        }
        throw Error('Failed to create Integration for unknown reasons. Did you pass the result of a function call instead of a function?');
    }
    var client = topology.client;
    return plugin({
        hostSubscribe: host$.subscribe,
        deviceSubscribe: device$.subscribe,
        // wrap dispatch with source value
        hostDispatch: function (dispatchable) {
            env.logger.info("Host dispatch recieved " + dispatchable);
            var hostDispatchable = insertMetadata(dispatchable, { '@@source': client.name || 'client', '@@bus': 'Host' });
            host$.dispatch(hostDispatchable);
        },
        deviceDispatch: function (dispatchable) {
            env.logger.info("Device dispatch recieved " + JSON.stringify(dispatchable, null, 2));
            var deviceDispatchable = insertMetadata(dispatchable, { '@@source': client.name || 'client', '@@bus': 'Device' });
            device$.dispatch(deviceDispatchable);
        },
    });
};
exports.createIotes = createIotes;
//# sourceMappingURL=index.js.map