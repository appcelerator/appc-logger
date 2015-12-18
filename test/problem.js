// jscs:disable jsDoc
// jshint -W079
var should = require('should'),
	util = require('util'),
	ConsoleClass = require('./_console'),
	_console = new ConsoleClass(),
	index = require('../'),
	debug = require('debug')('appc:logger'),
	defaultTravis = process.env.TRAVIS,
	defaultArgs = process.argv;

describe('problem', function () {

	after(function () {
		_console.stop();
		process.env.TRAVIS = defaultTravis;
		process.argv = defaultArgs;
	});

	it('should be created', function (callback) {
		try {
			_console.start();
			_console.on('data', function (buf) {
				_console.stop();
				should(buf).equal('INFO   | hello');
				callback();
			});
			var logger = index.createDefaultLogger({
				problemLogger: true
			});
			should(logger).be.an.object;
			should(logger.info).be.a.function;
			logger.setLevel('info');
			logger.info('hello');
			process.emit('uncaughtException', new Error('catch me if you can'));
		}
		finally {
			_console.stop();
		}
	});

	it.skip('should be tested more thoroughly');
});
