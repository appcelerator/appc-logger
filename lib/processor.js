var request = require('request'),
	util = require('util'),
	events = require('events'),
	async = require('async'),
	wrench = require('wrench'),
	path = require('path'),
	fs = require('fs'),
	transmit = require('./transmit'),
	EventEmitter = events.EventEmitter;

util.inherits(Processor, events.EventEmitter);

function Processor(options, logger) {
	EventEmitter.call(this);
	this.logger = logger;
	this.options = options || {};
}

Processor.prototype.start = function() {
	if (!this.options.dir && !this.options.file) {
		return this.emit('error','must specify either --dir or --file',true);
	}
	var files = [],
		options = this.options,
		logger = this.logger,
		pattern = options.grep && new RegExp(options.grep),
		self = this,
		age = options.age || 0,
		now = Date.now();

	pattern && logger.debug("Found file filter pattern",pattern);

	async.series([
		function determineFiles(next) {
			if (options.dir) {
				wrench.readdirRecursive(options.dir, function readdirRecursive(err,results){
					if (err) { return next(err); }
					if (results && results.length) {
						results.forEach(function pathResolver(fn){
							var f = path.resolve(path.join(options.dir, fn)),
								st = fs.statSync(f);
							// only process files
							if (st.isFile(f)) {
								// check the age and make sure it's old enough
								if (!options.age || now - st.mtime.getTime() > age) {
									// check the grep pattern
									if (!pattern || pattern.test(fn)) {
										logger.trace('found log file',f);
										files.push(f);
									}
								}
							}
						});
					}
					// we have to wait for results to be null to know when
					// wrench is done finding all subdirectories
					else if (!err && !results) {
						logger.debug('processing %d log files',files.length);
						next();
					}
				});
			}
			else {
				var fn = path.resolve(options.file);
				if (!fs.existsSync(fn)) {
					return next("file doesn't not exist: "+fn);
				}
				files.push(fn);
				next();
			}
		},

		function processFiles(next) {

			// if no files, don't transmit
			if (files.length === 0) {
				return next();
			}

			self.emit('start', files.length);

			var opts = {
				files: files,
				deleteFiles: !!!options.keep,
				url: options.server,
				logger: logger
			};

			transmit.transmitFiles(opts, next);
		}
	],
	function completeCallback(err){
		if (err) {
			this.emit('error',err);
		}
		else {
			this.emit('end');
		}
	}.bind(this));
};

module.exports = Processor;
