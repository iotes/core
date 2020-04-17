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
Object.defineProperty(exports, "__esModule", { value: true });
var environment_1 = require("../environment");
exports.createIntegration = function (hostFactory, topologyMap) {
    var logger = environment_1.EnvironmentObject.logger;
    var hosts = topologyMap.hosts, devices = topologyMap.devices, client = topologyMap.client;
    Promise.all(hosts.map(function (hostConfig) { return __awaiter(void 0, void 0, void 0, function () {
        var deviceFactory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info("Creating host " + hostConfig.name);
                    return [4 /*yield*/, hostFactory(hostConfig, client).catch(function () {
                            throw Error("Failed to create Factory " + hostConfig.name + ")");
                        })];
                case 1:
                    deviceFactory = _a.sent();
                    return [2 /*return*/, [hostConfig.name, deviceFactory]];
            }
        });
    }); })).then(function (deviceFactories) {
        var deviceFactoriesIndex = deviceFactories.reduce(function (a, v) {
            var _a;
            return (__assign(__assign({}, a), (_a = {}, _a[v[0]] = v[1], _a)));
        }, {});
        // connect device
        Promise.all(devices.map(function (device) {
            // Select device creation method from correct host
            logger.info("Creating device of type: " + device.type + " on " + device.hostName);
            return deviceFactoriesIndex[device.hostName][device.type](__assign(__assign({}, device), { client: client }))
                .catch(function (error) {
                console.warn("Failed to create Device " + device.name + " on host " + device.hostName + ", details: " + error);
            });
        })).catch(function (err) {
            console.warn('Failed to create Devices one of more Devices from topology map. Check chosen strategy has a method to handle the device type you need');
        });
    }).catch(function () {
        throw Error('Failed to create one or more Host Factories from topology map. Cannot continue');
    });
};
//# sourceMappingURL=index.js.map