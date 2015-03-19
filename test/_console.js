// jscs:disable jsDoc
var events = require('events'),
	util = require('util'),
	Logger = require('../lib/logger'),
	oldConsole = console.log;

util.inherits(MockConsole, events.EventEmitter);

/**
 * this class is a utility for overriding the console.log
 * function and capturing all the calls to it (which are fired
 * via an emit event named 'data' with the log line as event parameter).
 */
function MockConsole(stripColors) {
	this.started = false;
	this.stripColors = typeof(stripColors) === 'undefined' ? true : stripColors;
}

/**
 * log to the original underlying logger
 */
MockConsole.prototype.log = function () {
	oldConsole.apply(oldConsole, arguments);
	return this;
};

MockConsole.prototype.start = function (timeout) {
	if (!this.started) {
		this.removeAllListeners();
		this.started = true;
		this.timer = timeout && setTimeout(function () {
			this.timer = null;
			if (this.started) {
				this.emit('timeout');
			}
			this.stop();
		}.bind(this), timeout);
		console.log = function () {
			if (this.started) {
				var args = Array.prototype.slice.call(arguments),
					buf = util.format.apply(util.format, args);
				if (this.stripColors) {
					buf = Logger.stripColors(buf);
				}
				(process.env.TRAVIS || process.env.CONSOLE) && oldConsole('=>', buf);
				buf && this.emit('data', buf);
			}
		}.bind(this);
	}
	return this;
};

MockConsole.prototype.stop = function () {
	if (this.started) {
		this.started = false;
		console.log = oldConsole;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	this.removeAllListeners();
	return this;
};

exports = module.exports = MockConsole;
