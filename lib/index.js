const bunyan = require('bunyan');
const logger = require('./logger');

logger.TRACE = bunyan.TRACE;
logger.DEBUG = bunyan.DEBUG;
logger.INFO = bunyan.INFO;
logger.WARN = bunyan.WARN;
logger.ERROR = bunyan.ERROR;
logger.FATAL = bunyan.FATAL;

logger.ConsoleLogger = require('./console');
logger.JSONStreamer = require('./json');

/**
 * create a log adapter that will handle masking
 *
 * @param  {Function} fn [description]
 * @return {Function}      [description]
 */
function createLogger(fn) {
	return function () {
		var args = [],
			self = this,
			c;
		for (c = 0; c < arguments.length; c++) {
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

module.exports = logger;
