var _ = require('lodash'),
	bunyan = require('bunyan');

exports.TRACE = bunyan.TRACE;
exports.DEBUG = bunyan.DEBUG;
exports.INFO = bunyan.INFO;
exports.WARN = bunyan.WARN;
exports.ERROR = bunyan.ERROR;
exports.FATAL = bunyan.FATAL;

exports.ConsoleLogger = require('./console');
exports.JSONStreamer = require('./json');

_.merge(exports, require('./logger'));
