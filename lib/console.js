var bunyan = require('bunyan'),
	chalk = require('chalk'),
	util = require('util'),
	_ = require('lodash'),
	cluster = require('cluster'),
	events = require('events'),
	Logger = require('./logger'),
	EventEmitter = events.EventEmitter,
	grey = chalk.grey,
	green = chalk.green,
	cyan = chalk.cyan,
	red = chalk.red,
	yellow = chalk.yellow,
	dash = grey.bold('|'),
	defaultChalkEnabled = chalk.enabled,
	defaultColorizeArg;

util.inherits(ConsoleLogger, events.EventEmitter);

/**
 * Console logging functionality
 *
 * @param {Object} options - options
 */
function ConsoleLogger(options) {
	EventEmitter.call(this);
	this.options = options || {};
	// allow use to customize if they want the label or not
	this.prefix = this.options.prefix === undefined ? true : this.options.prefix;
	this.showcr = this.options.showcr === undefined ? true : this.options.showcr;
	this.showtab = this.options.showtab === undefined ? true : this.options.showtab;
	this.colorize = this.options.colorize === undefined ? checkColorize() : this.options.colorize;
	this.logPrepend = this.options.logPrepend;
	chalk.enabled = !!this.colorize;

	// if we are logging from a cluster worker, prepend the process PID
	// istanbul ignore if
	if (cluster.isWorker) {
		if (chalk.enabled) {
			this.logPrepend = chalk.black.inverse(String(process.pid)) + grey(' |');
		} else {
			this.logPrepend = process.pid + ' |';
		}
	}
	this.remapLevels();
}

/**
 * Check colorization
 */
function checkColorize() {
	if (defaultColorizeArg !== undefined) {
		return defaultColorizeArg;
	}
	// default is to only colorize if we have a TTY and not running on TTY
	defaultColorizeArg = process.stdout.isTTY && !process.env.TRAVIS;
	for (var c = 1; c < process.argv.length; c++) {
		var arg = process.argv[c];
		if (arg === '--colorize' || arg === '--color' || arg === '--colors') {
			defaultColorizeArg = true;
			break;
		} else if (arg === '--no-colors' || arg === '--no-color') {
			defaultColorizeArg = false;
			break;
		}
	}
	return defaultColorizeArg;
}

const CR_NC = '↩',
	CR = chalk.blue.bold(CR_NC),
	TAB_NC = '↠',
	TAB = chalk.blue.bold(TAB_NC);

/**
 * Remap levels
 */
ConsoleLogger.prototype.remapLevels = function remapLevels() {
	this.LevelMapping = {};
	this.LevelMapping[bunyan.TRACE] = {prefix: grey('TRACE '), color: grey, prefixNoColor: 'TRACE '};
	this.LevelMapping[bunyan.DEBUG] = {prefix: grey.bold('DEBUG '), color: cyan, prefixNoColor: 'DEBUG '};
	this.LevelMapping[bunyan.INFO] = {prefix: green('INFO  '), prefixNoColor: 'INFO  '};
	this.LevelMapping[bunyan.WARN] = {prefix: yellow('WARN  '), prefixNoColor: 'WARN  '};
	this.LevelMapping[bunyan.ERROR] = {prefix: red('ERROR '), prefixNoColor: 'ERROR '};
	this.LevelMapping[bunyan.FATAL] = {prefix: red.underline('FATAL') + ' ', color: red, prefixNoColor: 'FATAL '};
};

/**
 * called to write a formatted set of args (as an array) to
 * console.log. allows subclasses to override after formatting
 * has been applied
 *
 * @param  {Object} args - args
 */
ConsoleLogger.prototype.writeFormatted = function (args) {
	console.log.apply(console, args);
};

/**
 * Write
 *
 * @param  {Object} record - record
 */
ConsoleLogger.prototype.write = function (record) {
	if (record.ignore) {
		return true;
	}

	this.colorize = checkColorize();

	var level = this.LevelMapping[record.level],
		color = this.colorize,
		args = [];

	if (this.prefix) {
		// If the log level is tracing or debugging, add a timestamp to each log statement.
		var setLevel = this.level;
		if (setLevel === bunyan.TRACE || setLevel === bunyan.DEBUG) {
			var ts = new Date().toISOString();
			args.push(color ? grey(ts) : ts);
			args.push(color ? dash : '|');
		}
		// Then add the prefix (such as INFO, WARN, etc).
		args.push(color ? level.prefix : level.prefixNoColor);
		args.push(color ? dash : '|');
		if (this.logPrepend) {
			args.push(this.logPrepend);
		}
	}

	// Now add the message.
	var msg = record.msg;
	if (!msg || msg === ' ') {
		// this is the case where you send in an object as the only argument
		var fields = _.omit(record, 'name', 'prefix', 'showtab', 'showcr', 'hostname', 'pid', 'level', 'msg', 'time', 'v', 'problemLogName');
		if (_.isEmpty(fields)) {
			msg = '';
		} else {
			msg = util.inspect(fields, {colors: true});
		}
	}
	if (this.showcr && msg.indexOf('\n') > 0) {
		var lines = msg.split(/\n/),
			cr = color ? CR : CR_NC;
		msg = lines.join(cr + '\n') + (lines.length > 1 ? cr : '');
	}
	if (this.showtab && msg.indexOf('\t') > 0) {
		var tlines = msg.split(/\t/),
			tab = color ? TAB : TAB_NC;
		msg = tlines.join('\t' + tab);
	}
	if (color) {
		args.push(level.color && level.color(msg) || msg);
	} else {
		args.push(Logger.stripColors(msg));
	}

	this.writeFormatted(args);
	return true;
};

/**
 * End
 */
ConsoleLogger.prototype.end = function () {
	if (arguments.length > 0) {
		this.write.apply(this, Array.prototype.slice.call(arguments));
	}
	this.destroySoon();
};

/**
 * Destroy
 */
ConsoleLogger.prototype.destroy = function () {
	this.emit('close');
};

/**
 * Destroy soon
 */
ConsoleLogger.prototype.destroySoon = function () {
	this.destroy();
};

/**
 * Reset colorization
 */
ConsoleLogger.resetColorize = function () {
	defaultColorizeArg = undefined;
	chalk.enabled = chalk.supportsColor;
};

module.exports = ConsoleLogger;
