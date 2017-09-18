'use strict';
const util = require('util'),
	fs = require('fs-extra'),
	bunyan = require('bunyan'),
	path = require('path'),
	logger = require('./logger'),
	ConsoleLogger = require('./console');
let streams = [];

util.inherits(ProblemLogger, ConsoleLogger);

/**
 * Logger stream that will only write out a log file
 * if the process exits non-zero in the current directory
 *
 * @param {Object} options - options
 * @constructor
 */
function ProblemLogger(options) {
	options = options || {};
	ConsoleLogger.call(this);
	const tmpdir = require('os').tmpdir();
	this.filename = path.join(tmpdir, 'logger-' + (+new Date()) + '.log');
	this.name = options.problemLogName || ((options.name || 'problem') + '.log');
	this.stream = fs.createWriteStream(this.filename);
	this.write({ level: bunyan.TRACE, msg: util.format('log file opened') });
	streams.push(this);
}

/**
 * Override to write to a file
 *
 * @param  {Array} args - array of arguments
 */
ProblemLogger.prototype.writeFormatted = function (args) {
	const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	this.stream.write(date + ' ' + logger.stripColors(args.join(' ')) + '\n');
};

/**
 * Called when the process exits. if non-zero exit code, will write out
 * the underlying log file to current working directory
 *
 * @param  {number} exitCode - numeric entry code
 */
ProblemLogger.prototype.exited = function (exitCode) {
	if (exitCode !== 0) {
		const dest = path.join(process.cwd(), this.name);
		fs.copySync(this.filename, dest);
	}
	fs.unlinkSync(this.filename);
};

/**
 * Close the stream
 *
 * @param  {number} exitCode - numeric entry code
 */
function closeStreams(exitCode) {
	// default is 0 if not specified
	exitCode = exitCode === undefined ? 0 : exitCode;

	if (streams.length) {
		streams.forEach(function (logger) {
			logger.write({ level: bunyan.TRACE, msg: util.format('exited with code %d', exitCode) });
			logger.stream.end();
			// jscs:disable jsDoc
			logger.write = function () {};
		});
	}
}

// every which bad way to exit an app
process.on('exit', closeStreams);
process.on('SIGINT', closeStreams);
process.on('uncaughtException', closeStreams);

// monkey patch bunyan to not allow changing level of ProblemLogger
// which must always be at TRACE level
// jscs:disable jsDoc
const createBunyanLogger = bunyan.createLogger;
bunyan.createLogger = function createLogger() {
	var logger = createBunyanLogger.apply(bunyan, arguments);
	logger.level = function (value) {
		if (arguments.length === 0) {
			return this.__level === undefined ? this._level : this.__level;
		}
		const newLevel = bunyan.resolveLevel(value);
		const len = this.streams.length;
		for (let i = 0; i < len; i++) {
			const stream = this.streams[i];
			if (!(stream.stream instanceof ProblemLogger)) {
				stream.level = newLevel;
			}
		}
		this.__level = newLevel;
		return newLevel;
	};
	return logger;
};

module.exports = ProblemLogger;
