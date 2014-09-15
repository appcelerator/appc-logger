var bunyan = require('bunyan'),
	chalk = require('chalk'),
	util = require('util'),
	events = require('events'),
	Logger = require('./logger'),
	EventEmitter = events.EventEmitter,
	LevelMapping = {},
	grey = chalk.grey,
	green = chalk.green,
	cyan = chalk.cyan,
	red = chalk.red,
	yellow = chalk.yellow,
	dash = grey.bold('|');

util.inherits(ConsoleLogger, events.EventEmitter);

function ConsoleLogger(options) {
	EventEmitter.call(this);
	this.options = options || {};
	// allow use to customize if they want the label or not
	this.prefix = this.options.prefix===undefined ? true : this.options.prefix;
}

LevelMapping[bunyan.TRACE]={prefix: grey('TRACE '), color:grey, prefixNoColor: 'TRACE ' };
LevelMapping[bunyan.DEBUG]={prefix: grey.bold('DEBUG '), color: cyan, prefixNoColor: 'DEBUG '};
LevelMapping[bunyan.INFO]={prefix: green('INFO  '), prefixNoColor: 'INFO  '};
LevelMapping[bunyan.WARN]={prefix: yellow('WARN  '), prefixNoColor:'WARN  ' };
LevelMapping[bunyan.ERROR]={prefix: red('ERROR '), prefixNoColor:'ERROR ' };
LevelMapping[bunyan.FATAL]={prefix: red.underline('FATAL')+' ', color:red, prefixNoColor:'FATAL ' };

ConsoleLogger.prototype.write = function (record) {
	if (!record.ignore) {
		var level = LevelMapping[record.level],
			color = process.stdout.isTTY && !process.env.TRAVIS,
			args = [];

		if (this.prefix) {
			args.push(color ? level.prefix : level.prefixNoColor);
			args.push(color ? dash : '|');
		}
		if (color) {
			args.push(level.color && level.color(record.msg) || record.msg);
		}
		else {
			args.push(Logger.stripColors(record.msg));
		}
		console.log.apply(console.log,args);
	}
	return true;
};

ConsoleLogger.prototype.end = function () {
	if (arguments.length > 0) {
		this.write.apply(this, Array.prototype.slice.call(arguments));
	}
};

ConsoleLogger.prototype.destroy = function () {
	this.emit('close');
};

ConsoleLogger.prototype.destroySoon = function () {
	this.destroy();
};

module.exports = ConsoleLogger;
