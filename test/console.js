var should = require('should'),
	_console = new (require('./_console'))(),
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

});