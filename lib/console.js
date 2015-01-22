var bunyan = require('bunyan'),
	chalk = require('chalk'),
	util = require('util'),
	_ = require('lodash'),
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

function ConsoleLogger(options) {
	EventEmitter.call(this);
	this.options = options || {};
	// allow use to customize if they want the label or not
	this.prefix = this.options.prefix===undefined ? true : this.options.prefix;
	this.showcr = this.options.showcr===undefined ? true : this.options.showcr;
	this.showtab = this.options.showtab===undefined ? true : this.options.showtab;
	this.colorize = this.options.colorize===undefined ? checkColorize() : this.options.colorize;
	chalk.enabled = !!this.colorize;
	this.remapLevels();
}

function checkColorize() {
	if (defaultColorizeArg!==undefined) {
		return defaultColorizeArg;
	}
	// default is to only colorize if we have a TTY and not running on TTY
	defaultColorizeArg = process.stdout.isTTY && !process.env.TRAVIS;
	for (var c=1; c<process.argv.length; c++) {
		var arg = process.argv[c];
		if (arg === '--colorize' || arg === '--color' || arg === '--colors') {
			defaultColorizeArg = true;
			break;
		}
		else if (arg === '--no-colors' || arg === '--no-color') {
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

ConsoleLogger.prototype.remapLevels = function remapLevels() {
	this.LevelMapping = {};
	this.LevelMapping[bunyan.TRACE]={prefix: grey('TRACE '), color:grey, prefixNoColor: 'TRACE ' };
	this.LevelMapping[bunyan.DEBUG]={prefix: grey.bold('DEBUG '), color: cyan, prefixNoColor: 'DEBUG '};
	this.LevelMapping[bunyan.INFO]={prefix: green('INFO  '), prefixNoColor: 'INFO  '};
	this.LevelMapping[bunyan.WARN]={prefix: yellow('WARN  '), prefixNoColor:'WARN  ' };
	this.LevelMapping[bunyan.ERROR]={prefix: red('ERROR '), prefixNoColor:'ERROR ' };
	this.LevelMapping[bunyan.FATAL]={prefix: red.underline('FATAL')+' ', color:red, prefixNoColor:'FATAL ' };
};

/**
 * called to write a formatted set of args (as an array) to
 * console.log. allows subclasses to override after formatting
 * has been applied
 */
ConsoleLogger.prototype.writeFormatted = function(args) {
	console.log.apply(console,args);
};

ConsoleLogger.prototype.write = function (record) {
	if (!record.ignore) {

		// this should only happen during unit testing
		if (defaultColorizeArg===undefined) {
			this.colorize = checkColorize();
		}

		var level = this.LevelMapping[record.level],
			color = this.colorize,
			args = [];

		if (this.prefix) {
			args.push(color ? level.prefix : level.prefixNoColor);
			args.push(color ? dash : '|');
		}
		var msg = record.msg;
		if (!msg || msg===' ') {
			// this is the case where you send in an object as the only argument
			var fields = _.omit(record,'name','prefix','showtab','showcr','hostname','pid','level','msg','time','v');
			msg = util.inspect(fields, {colors:true});
		}
		if (this.showcr && msg.indexOf('\n') > 0) {
			var lines = msg.split(/\n/),
				cr = color ? CR : CR_NC;
			msg = lines.join(cr+'\n') + (lines.length > 1 ? cr : '');
		}
		if (this.showtab && msg.indexOf('\t') > 0) {
			var tlines = msg.split(/\t/),
				tab = color ? TAB : TAB_NC;
			msg = tlines.join('\t'+tab);
		}
		if (color) {
			args.push(level.color && level.color(msg) || msg);
		}
		else {
			args.push(Logger.stripColors(msg));
		}
		this.writeFormatted(args);
	}
	return true;
};

ConsoleLogger.prototype.end = function () {
	if (arguments.length > 0) {
		this.write.apply(this, Array.prototype.slice.call(arguments));
	}
	this.destroySoon();
};

ConsoleLogger.prototype.destroy = function () {
	this.emit('close');
};

ConsoleLogger.prototype.destroySoon = function () {
	this.destroy();
};

// this should only be used by unit tests
ConsoleLogger.resetColorize = function() {
	defaultColorizeArg = undefined;
	chalk.enabled = chalk.supportsColor;
};

module.exports = ConsoleLogger;
