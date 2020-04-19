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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var environment_1 = require("../environment");
var createStoreId = function () { return "iotes_" + Math.random().toString(16).substr(2, 8); };
var createDefaultMetadata = function () {
    var storeId = createStoreId();
    return function () { return ({
        '@@timestamp': Date.now().toString(),
        '@@storeId': storeId,
    }); };
};
exports.createStore = function (metadata, errorHandler) {
    if (metadata === void 0) { metadata = createDefaultMetadata(); }
    var logger = environment_1.EnvironmentObject.logger;
    var state = {};
    var subscribers = [];
    var subscribe = function (subscription, selector) {
        var subscriber = [subscription, selector];
        subscribers = __spreadArrays(subscribers, [subscriber]);
    };
    var applySelectors = function (selectors) { return (selectors.reduce(function (a, selector) { return (state[selector]
        ? __assign(__assign({}, a), state[selector]) : a); }, {})); };
    var updateSubscribers = function () {
        logger.log("Subscriber to receive state: " + JSON.stringify(state, null, 2));
        subscribers.forEach(function (subscriber) {
            var subscription = subscriber[0], selector = subscriber[1];
            var stateSelection = selector ? applySelectors(selector) : state;
            if (Object.keys(stateSelection).length !== 0)
                subscription(stateSelection);
            subscription(state);
        });
    };
    var isObjectLiteral = function (testCase) {
        if (Object.getPrototypeOf(testCase) !== Object.getPrototypeOf({}))
            return false;
        if (Object.keys(testCase).some(function (e) { return (Object.getPrototypeOf(testCase[e]) !== Object.getPrototypeOf({})); })) {
            return false;
        }
        var keys = [];
        try {
            keys = Object.keys(testCase);
            if (keys.length === 0)
                return false;
        }
        catch (_a) {
            return false;
        }
        return keys.reduce(function (a, v) { return (testCase[v] ? a : false); }, true);
    };
    var unwrapDispatchable = function (dispatchable) {
        if (dispatchable instanceof Error)
            return [errorHandler(dispatchable, state), false];
        var deltaDispatchable = Object.keys(dispatchable).filter(function (key) { return (dispatchable[key] ? !dispatchable[key]['@@storeId'] : false); }).reduce(function (a, key) {
            var _a;
            return (__assign(__assign({}, a), (_a = {}, _a[key] = dispatchable[key], _a)));
        }, {});
        if (isObjectLiteral(deltaDispatchable)) {
            var metaDispatchable = Object.keys(deltaDispatchable).reduce(function (a, key) {
                var _a;
                return (__assign(__assign({}, a), (_a = {}, _a[key] = __assign(__assign({}, deltaDispatchable[key]), metadata()), _a)));
            }, {});
            return [metaDispatchable, true];
        }
        return [{}, false];
    };
    var setState = function (newState, callback) {
        state = __assign(__assign({}, state), newState);
        callback();
    };
    var dispatch = function (dispatchable) {
        var _a = unwrapDispatchable(dispatchable), unwrappedDispatchable = _a[0], shouldUpdateState = _a[1];
        if (shouldUpdateState)
            setState(unwrappedDispatchable, updateSubscribers);
    };
    return {
        dispatch: dispatch,
        subscribe: subscribe,
    };
};
//# sourceMappingURL=index.js.map