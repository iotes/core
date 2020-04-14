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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_1 = __importDefault(require("mqtt"));
var environment_1 = require("../../environment");
var createDeviceFactory = function (hostConfig, host) {
    // RFID READER
    var createRfidReader = function (device) { return __awaiter(void 0, void 0, void 0, function () {
        var name;
        return __generator(this, function (_a) {
            name = device.name;
            // Register listeners
            host.subscribe(hostConfig.name + "/phidget/" + name + "/onTag");
            host.subscribe(hostConfig.name + "/phidget/" + name + "/onLostTag");
            return [2 /*return*/, device];
        });
    }); };
    // ROTARY ENCODER
    var createRotaryEncoder = function (device) { return __awaiter(void 0, void 0, void 0, function () {
        var type, name, channel;
        return __generator(this, function (_a) {
            type = device.type, name = device.name, channel = device.channel;
            // Register listeners
            host.subscribe(hostConfig.name + "/phidget/" + name + "/onPositionChange");
            return [2 /*return*/, device];
        });
    }); };
    return {
        ROTARY_ENCODER: createRotaryEncoder,
        RFID_READER: createRfidReader,
    };
};
exports.createMqttStrategy = function (hostDispatch, deviceDispatch) { return function (hostConfig) { return __awaiter(void 0, void 0, void 0, function () {
    var logger, name, hostPath, connect, host, createHostDispatchable, createDeviceDispatchable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger = environment_1.EnvironmentObject.logger;
                name = hostConfig.name;
                hostPath = "ws://" + hostConfig.host + ":" + hostConfig.port;
                connect = function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, (new Promise(function (res, reject) {
                                try {
                                    res(mqtt_1.default.connect(hostPath));
                                }
                                catch (error) {
                                    reject(Error(error));
                                }
                            }))];
                    });
                }); };
                return [4 /*yield*/, connect()];
            case 1:
                host = _a.sent();
                logger.info("mqtt host config: " + JSON.stringify(host.options, null, 2));
                createHostDispatchable = function (type) {
                    var _a;
                    return (_a = {},
                        _a[name] = {
                            type: type,
                            meta: { timestamp: Date.now().toString(), channel: hostPath, host: name },
                            payload: {},
                        },
                        _a);
                };
                createDeviceDispatchable = function (type, deviceName, payload) {
                    var _a;
                    return (_a = {},
                        _a[deviceName] = {
                            type: type,
                            meta: { timestamp: Date.now().toString(), channel: 'mqtt', host: name },
                            payload: payload,
                        },
                        _a);
                };
                host.on('connect', function () {
                    hostDispatch(createHostDispatchable('CONNECT'));
                });
                host.on('reconnect', function () {
                    hostDispatch(createHostDispatchable('CONNECT'));
                });
                host.on('reconnecting', function () {
                    hostDispatch(createHostDispatchable('RECONNECTING'));
                });
                host.on('disconnect', function () {
                    hostDispatch(createHostDispatchable('DISCONNECT'));
                });
                host.on('subscribe', function () {
                    hostDispatch(createHostDispatchable('CONNECT'));
                });
                host.on('message', function (topic, message) {
                    var topics = topic.split('/');
                    var _a = topics.slice(-2), deviceName = _a[0], type = _a[1];
                    deviceDispatch(createDeviceDispatchable(deviceName, type, JSON.parse(message)));
                });
                return [2 /*return*/, createDeviceFactory(hostConfig, host)];
        }
    });
}); }; };
//# sourceMappingURL=index.js.map