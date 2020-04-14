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
// eslint-enable no-unused-vars
exports.nullLogger = {
    log: function (log) { },
    warn: function (warn) { },
    info: function (info) { },
    error: function (error) { },
};
var logConditionally = function (level) {
    if (level === void 0) { level = 'SILENT'; }
    return function (logger) {
        if (level === 'SILENT')
            return exports.nullLogger;
        if (level === 'DEBUG')
            return logger;
        if (level === 'INFO')
            return __assign(__assign({}, exports.nullLogger), { info: logger.info });
        if (level === 'LOG')
            return __assign(__assign({}, exports.nullLogger), { info: logger.info, log: logger.log });
        if (level === 'WARN')
            return __assign(__assign({}, logger), { info: exports.nullLogger.info, log: exports.nullLogger.log });
        return logger;
    };
};
var defaultLogger = {
    log: function (log) { return console.log("[Log]: " + log); },
    warn: function (warn) { return console.warn("[Warn]: " + warn); },
    error: function (error) { return console.error("[Error]: " + error); },
    info: function (info) { return console.info("[Info]: " + info); },
};
exports.createLogger = function (logger, logLevel) {
    if (logger === void 0) { logger = defaultLogger; }
    if (logLevel === void 0) { logLevel = 'SILENT'; }
    return (logConditionally(logLevel)(logger));
};
//# sourceMappingURL=index.js.map