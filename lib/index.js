var _ = require('lodash'),
	bunyan = require('bunyan'),
	util = require('util'),
	logger = require('./logger');

exports.TRACE = bunyan.TRACE;
exports.DEBUG = bunyan.DEBUG;
exports.INFO = bunyan.INFO;
exports.WARN = bunyan.WARN;
exports.ERROR = bunyan.ERROR;
exports.FATAL = bunyan.FATAL;

exports.ConsoleLogger = require('./console');
exports.JSONStreamer = require('./json');

/**
 * create a log adapter that will handle masking
 */
function createLogger(fn) {
	return function () {
		var args = [], self = this;
		for (var c = 0; c < arguments.length; c++) {
			args[c] = logger.specialObjectClone(arguments[c]);
		}
		return fn.apply(self, args);
	};
}

bunyan.prototype.trace = createLogger(bunyan.prototype.trace);
bunyan.prototype.debug = createLogger(bunyan.prototype.debug);
bunyan.prototype.info = createLogger(bunyan.prototype.info);
bunyan.prototype.warn = createLogger(bunyan.prototype.warn);
bunyan.prototype.error = createLogger(bunyan.prototype.error);
bunyan.prototype.fatal = createLogger(bunyan.prototype.fatal);

_.merge(exports, logger);
