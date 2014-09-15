var bunyan = require('bunyan'),
	chalk = require('chalk'),
	util = require('util'),
	events = require('events'),
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
}

LevelMapping[bunyan.TRACE]={prefix: grey('TRACE '), color:grey };
LevelMapping[bunyan.DEBUG]={prefix: grey.bold('DEBUG '), color: cyan };
LevelMapping[bunyan.INFO]={prefix: green('INFO  ') };
LevelMapping[bunyan.WARN]={prefix: yellow('WARN  ') };
LevelMapping[bunyan.ERROR]={prefix: red('ERROR ') };
LevelMapping[bunyan.FATAL]={prefix: red.underline('FATAL')+' ', color:red };

ConsoleLogger.prototype.write = function (record) {
	if (!record.ignore) {
		var level = LevelMapping[record.level],
			color = process.stdout.isTTY && !process.env.TRAVIS && level.color,
			msg = color && color(record.msg) || record.msg;
		console.log(level.prefix,dash,msg);
	}
	return (true);
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
