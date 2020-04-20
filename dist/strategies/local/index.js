"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
var store_1 = require("../../store");
var defeatLoopbackGuard = function (deviceName, state) {
    var _a;
    var newState;
    if ((_a = state[deviceName]) === null || _a === void 0 ? void 0 : _a['@@storeId']) {
        var _b = state[deviceName], n = _b["@@storeId"], ns = __rest(_b, ['@@storeId']);
        newState = ns;
    }
    return newState || state;
};
var createDeviceFactory = function (hostConfig, client, deviceDispatch, deviceSubscribe, store) { return __awaiter(void 0, void 0, void 0, function () {
    var createRfidReader, createRotaryEncoder;
    return __generator(this, function (_a) {
        createRfidReader = function (device) { return __awaiter(void 0, void 0, void 0, function () {
            var name, type;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = device.name, type = device.type;
                        // resigster trasmitter
                        deviceSubscribe(function (state) {
                            var _a;
                            var _b, _c;
                            store.dispatch((_a = {},
                                _a[name] = ((_c = (_b = state[name]) === null || _b === void 0 ? void 0 : _b.payload) === null || _c === void 0 ? void 0 : _c.defeatLoopbackGuard) ? state
                                    : defeatLoopbackGuard(name, state),
                                _a));
                        });
                        return [4 /*yield*/, setTimeout(function () {
                                deviceDispatch(utils_1.createDeviceDispatchable(name, type, 'EXTERNAL', { value: Date.now() }));
                            }, 10)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, device];
                }
            });
        }); };
        createRotaryEncoder = function (device) { return __awaiter(void 0, void 0, void 0, function () {
            var type, name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        type = device.type, name = device.name;
                        // resigster trasmitter
                        deviceSubscribe(function (state) {
                            var _a;
                            var _b, _c;
                            store.dispatch((_a = {},
                                _a[name] = ((_c = (_b = state[name]) === null || _b === void 0 ? void 0 : _b.payload) === null || _c === void 0 ? void 0 : _c.defeatLoopbackGuard) ? state
                                    : defeatLoopbackGuard(name, state),
                                _a));
                        });
                        // Register listeners
                        return [4 /*yield*/, setTimeout(function () {
                                deviceDispatch(utils_1.createDeviceDispatchable(name, type, 'EXTERNAL', { value: Date.now() }));
                            }, 10)];
                    case 1:
                        // Register listeners
                        _a.sent();
                        return [2 /*return*/, device];
                }
            });
        }); };
        return [2 /*return*/, {
                RFID_READER: createRfidReader,
                ROTARY_ENCODER: createRotaryEncoder,
            }];
    });
}); };
exports.createLocalStoreAndStrategy = function () {
    var store$ = store_1.createStore();
    return [
        store$,
        function (I) { return function (hostConfig, clientConfig) { return __awaiter(void 0, void 0, void 0, function () {
            var name, hostDispatch, deviceDispatch, hostSubscribe, deviceSubscribe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = clientConfig.name;
                        hostDispatch = I.hostDispatch, deviceDispatch = I.deviceDispatch, hostSubscribe = I.hostSubscribe, deviceSubscribe = I.deviceSubscribe;
                        hostSubscribe(function (state) {
                            store$.dispatch(utils_1.createHostDispatchable(hostConfig.name, 'CONNECT', 'LOCAL', {
                                signal: 'test',
                            }));
                        });
                        // Test host dispatch
                        return [4 /*yield*/, new Promise(function (res) {
                                setTimeout(function () {
                                    hostDispatch(utils_1.createHostDispatchable(hostConfig.name, 'CONNECT', 'LOCAL', {}));
                                    res();
                                }, 10);
                            })];
                    case 1:
                        // Test host dispatch
                        _a.sent();
                        return [2 /*return*/, createDeviceFactory(hostConfig, clientConfig, deviceDispatch, deviceSubscribe, store$)];
                }
            });
        }); }; },
    ];
};
//# sourceMappingURL=index.js.map