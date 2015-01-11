/**
 * Logger stream that will only write out a log file
 * if the process exits non-zero in the current directory
 */
var util = require('util'),
	fs = require('fs-extra'),
	bunyan = require('bunyan'),
	path = require('path'),
	async = require('async'),
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
	this.write({level: bunyan.TRACE, msg: util.format('log file opened')});
	streams.push(this);
}

/**
 * override to write to a file
 */
ProblemLogger.prototype.writeFormatted = function(args) {
	var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	this.stream.write(date+' '+logger.stripColors(args.join(' '))+'\n');
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

process.on('realexit', realExit);

function closeStreams(exitCode) {
	// default is 0 if not specified
	exitCode = exitCode===undefined ? 0 : exitCode;
	if (streams.length) {
		async.each(streams,function(logger,cb){
			logger.write({level: bunyan.TRACE, msg: util.format('exited with code %d',exitCode)});
			logger.stream.end(function() {
				logger.exited(exitCode);
				cb();
			});
			logger.write = function() {};
		}, function(){
			process.emit('realexit',exitCode);
			realExit(exitCode);
		});
	}
	else {
		process.emit('realexit',exitCode);
		realExit(exitCode);
	}
}

process.exit = function(exitCode) {
	if (process.env.TEST || process.env.TRAVIS) {
		closeStreams();
		realExit(exitCode);
		return;
	}
	process.on('realexit', function(){
		realExit(exitCode);
	});
	closeStreams(exitCode);
};

process.on('exit', function(exitCode){
	closeStreams(exitCode);
});

module.exports = ProblemLogger;
