var should = require('should'),
	ConsoleClass = require('./_console'),
	_console = new ConsoleClass(),
	index = require('../'),
	ConsoleLogger = index.ConsoleLogger;

describe("console", function(){

	after(function(){
		_console.stop();
	});

	it("should be able to log at info", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('INFO   | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.info('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log at debug", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('DEBUG  | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.debug('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log at trace", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('TRACE  | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.trace('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log at warn", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('WARN   | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.warn('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log at error", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('ERROR  | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.error('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log at fatal", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('FATAL  | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.fatal('hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to log with object but have it ignored", function(callback){
		should(ConsoleLogger).be.an.object;
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('INFO   | hello');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.info({a:1},'hello');
		}
		finally {
			_console.stop();
		}
	});

	it("should be able to use format symbols", function(callback){
		try {
			_console.start();
			_console.on('data',function(buf){
				_console.stop();
				should(buf).equal('INFO   | hello world 1');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.info('hello %s %d','world',1);
		}
		finally {
			_console.stop();
		}
	});

	it("should remove color coding", function(callback){
		var console_ = new ConsoleClass(false);
		var travis = process.env.TRAVIS;
		try {
			console_.start();
			console_.on('data',function(buf){
				console_.stop();
				should(buf).equal('INFO   | hello world 1');
				callback();
			});
			var logger = index.createDefaultLogger();
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			var chalk = require('chalk');
			process.env.TRAVIS = 1; // force log coloring off
			logger.info('hello %s %d',chalk.red('world'),1);
		}
		finally {
			process.env.TRAVIS = travis; // reset travis setting
			console_.stop();
		}
	});


	it("should remove log level", function(callback){
		var console_ = new ConsoleClass(false);
		try {
			console_.start();
			console_.on('data',function(buf){
				console_.stop();
				should(buf).equal('hello world');
				callback();
			});
			var logger = index.createLogger({prefix:false});
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.info('hello world');
		}
		finally {
			console_.stop();
		}
	});

});