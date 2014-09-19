var bunyan = require('bunyan'),
	chalk = require('chalk'),
	util = require('util'),
	_ = require('lodash'),
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
	this.showcr = this.options.showcr===undefined ? true : this.options.showcr;
	this.showtab = this.options.showtab===undefined ? true : this.options.showtab;
}

LevelMapping[bunyan.TRACE]={prefix: grey('TRACE '), color:grey, prefixNoColor: 'TRACE ' };
LevelMapping[bunyan.DEBUG]={prefix: grey.bold('DEBUG '), color: cyan, prefixNoColor: 'DEBUG '};
LevelMapping[bunyan.INFO]={prefix: green('INFO  '), prefixNoColor: 'INFO  '};
LevelMapping[bunyan.WARN]={prefix: yellow('WARN  '), prefixNoColor:'WARN  ' };
LevelMapping[bunyan.ERROR]={prefix: red('ERROR '), prefixNoColor:'ERROR ' };
LevelMapping[bunyan.FATAL]={prefix: red.underline('FATAL')+' ', color:red, prefixNoColor:'FATAL ' };

const CR_NC = '↩',
	  CR = chalk.blue.bold(CR_NC),
	  TAB_NC = '↠',
	  TAB = chalk.blue.bold(TAB_NC);


ConsoleLogger.prototype.write = function (record) {
	if (!record.ignore) {
		var level = LevelMapping[record.level],
			color = process.stdout.isTTY && !process.env.TRAVIS,
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
