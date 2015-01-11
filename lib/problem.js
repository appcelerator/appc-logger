/**
 * Logger stream that will only write out a log file
 * if the process exits non-zero in the current directory
 */
var util = require('util'),
	fs = require('fs-extra'),
	bunyan = require('bunyan'),
	path = require('path'),
	logger = require('./logger'),
	ConsoleLogger = require('./console'),
	streams = [];

util.inherits(ProblemLogger, ConsoleLogger);

function ProblemLogger(options) {
	options = options || {};
	ConsoleLogger.call(this, options);
	var tmpdir = require('os').tmpdir();
	this.filename = path.join(tmpdir, 'logger-'+(+new Date())+'.log');
	this.name = options.problemLogName || ((options.name || 'problem') + '.log');
	this.stream = fs.createWriteStream(this.filename);
	streams.push(this);
}

/**
 * override to write to a file
 */
ProblemLogger.prototype.writeFormatted = function(args) {
	this.stream.write(logger.stripColors(args.join(' '))+'\n');
};

/**
 * called when the process exits. if non-zero exit code, will write out
 * the underlying log file to current working directory
 */
ProblemLogger.prototype.exited = function(exitCode) {
	if (exitCode!==0) {
		var dest = path.join(process.cwd(), this.name);
		fs.copySync(this.filename, dest);
	}
	fs.unlinkSync(this.filename);
};

// patch process.exit to make sure that we handle closing our streams and 
// then writing the log file
var realExit = process.exit;
process.exit = function(exitCode) {
	// default is 0 if not specified
	exitCode = exitCode===undefined ? 0 : exitCode;
	var count = 0;
	streams.forEach(function(logger){
		logger.write({level: bunyan.TRACE, msg: util.format('exited with code %d',exitCode)});
		logger.stream.end(function() {
			logger.exited(exitCode);
			if (++count === streams.length) {
				realExit(exitCode);
			}
		});
	});
};

module.exports = ProblemLogger;
