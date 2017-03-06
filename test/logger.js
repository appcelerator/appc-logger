// jscs:disable jsDoc
// jshint -W079
var should = require('should'),
	index = require('../'),
	_util = require('./_util'),
	_console = new (require('./_console'))(),
	path = require('path'),
	fs = require('fs-extra'),
	express = require('express'),
	request = require('request'),
	tmpdir = path.join(require('os').tmpdir(), 'test-logger-' + Date.now());

function readFile (filePath, cb) {
	fs.readFile(filePath, 'utf8', function (err,data) {
		if (err) {
			cb(err);
			return;
		}
		fs.unlinkSync(filePath);
		cb(null, data);
	});
}

describe('logger', function () {

	before(function (done) {
		try {
			fs.mkdirs(tmpdir, done);
		}
		catch (E) {
		}
	});

	after(function (done) {
		_console.stop();
		fs.emptyDir(tmpdir, done);
	});

	it('should be able to load', function () {
		should(index).be.an.object;
	});

	it('should define createDefaultLogger', function () {
		should(index.createDefaultLogger).be.a.function;
	});

	it('should merge stream options', function (done) {
		var logfile = path.join(tmpdir, 'test.log');

		var logger = index.createLogger({
			streams: [
				{
					level: 'trace',
					path: logfile,
					type: 'file'
				}
			]
		});

		logger.trace('trace');

		// need to give logging time to flush output
		setTimeout(function () {
			should(fs.existsSync(logfile)).be.ok;
			var contents = fs.readFileSync(logfile).toString();
			should(/\"msg\"\:\"trace\"/.test(contents)).be.ok;
			fs.unlinkSync(logfile);
			done();
		}, 100);
	});

	it('should be able to log requests', function (callback) {

		var app = express();

		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;

				var logger = index.createExpressLogger(app, {logs:tmpdir, logSingleRequest:true});
				should(logger).be.an.object;
				should(logger.info).be.a.function;

				_console.on('data', function (buf) {
					should(buf).be.equal('INFO   | hello');
				});
				_console.start();
				try {
					logger.info('hello');
					app.log.info('hello');
				}
				finally {
					_console.stop();
				}

				app.use(function (req, resp, next) {
					resp.set('request-id', req.requestId);
					next();
				});

				app.get('/echo', function (req, resp, next) {
					resp.send({hello:'world'});
					next();
				});

				request.get('http://127.0.0.1:' + port + '/echo', function (err, res, body) {
					should(err).not.be.ok;
					var obj = body && JSON.parse(body);
					should(obj).be.an.object;
					should(obj).eql({hello:'world'});
					should(res.headers).be.an.object;
					should(res.headers['request-id']).be.a.string;
					var reqid = res.headers['request-id'];
					var files = fs.readdirSync(tmpdir);
					should(files).be.an.array;
					should(files).have.length(3);
					var fn = path.join(tmpdir, files.filter(function (fn) {
						return fn !== 'requests.log' && !/metadata$/.test(fn);
					})[0]);
					var logfn = fn;

					// validate that the request has the right info
					var contents = JSON.parse(fs.readFileSync(fn).toString());
					should(contents).be.an.object;
					should(contents).have.property('name', files[0].replace(/\.log$/, ''));
					should(contents).have.property('req_id', reqid);
					should(contents).have.property('req');
					should(contents).have.property('res');
					should(contents).have.property('start', true);
					should(contents).have.property('ignore', true);
					should(contents).have.property('msg', 'start');
					should(contents).have.property('level', 30);

					should(fs.existsSync(fn + '.metadata')).be.true;

					var metadata = fs.readFileSync(fn + '.metadata').toString();
					contents = JSON.parse(metadata);
					should(contents).be.an.object;
					should(contents).have.property('logname', logfn);
					should(contents).have.property('req_id', reqid);
					should(contents).have.property('req_headers');
					should(contents).have.property('response_time');
					should(contents).have.property('name', path.basename(fn).replace('.log', ''));

					// now validate that our request is logged that points to our
					// request log
					fn = path.join(tmpdir, 'requests.log');
					contents = JSON.parse(fs.readFileSync(fn).toString());
					should(contents).be.an.object;
					should(contents).have.property('name', files[0].replace(/\.log$/, ''));
					should(contents).have.property('req_id', reqid);
					should(contents).have.property('req');
					should(contents).have.property('res');
					should(contents).have.property('msg', '');
					should(contents).have.property('level', 30);
					should(contents).have.property('logname', logfn);
					callback();
				});

			});
		});
	});

	it('RDPP-638: adiLogger.info logs if enabled in arrow config ', function (callback) {
		var app = express();
		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;
				var loggerConfig = {
					logs: tmpdir,
					logSingleRequest: true,
					adiLogging: true,
					name: 'arrowTest'
				};
				var logger = index.createExpressLogger(app, loggerConfig);
				app.use(function (req, resp, next) {
					resp.set('request-id', req.requestId);
					next();
				});
				app.get('/echo', function (req, resp, next) {
					resp.send({hello:'world'});
					next();
				});
				request.get('http://127.0.0.1:' + port + '/echo', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
					readFile(logPath, function (err, data) {
						should(err).equal(null);
						var logContent = JSON.parse(data);
						should(logContent.length).not.equal(0);
					});
					callback();
				});
			});
		});
	});

	it('RDPP-639: protocolSrc is derived from the host if its available', function (callback) {
		var app = express();
		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;
				var loggerConfig = {
					logs: tmpdir,
					logSingleRequest: true,
					adiLogging: true,
					name: 'arrowTest'
				};
				var logger = index.createExpressLogger(app, loggerConfig);
				app.use(function (req, resp, next) {
					resp.set('request-id', req.requestId);
					next();
				});
				app.get('/echo', function (req, resp, next) {
					resp.send({hello:'world'});
					next();
				});
				request.get('http://127.0.0.1:' + port + '/echo', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
					readFile(logPath, function (err, data) {
						should(err).equal(null);
						var logContent = JSON.parse(data);
						should(logContent.length).not.equal(0);
						should(logContent.protocolSrc).equal(port.toString());
					});
					callback();
				});

			});
		});
	});

	it('RDPP-645: correlationId is derived from requestId', function (callback) {
		var app = express();
		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;
				var loggerConfig = {
					logs: tmpdir,
					logSingleRequest: true,
					adiLogging: true,
					name: 'arrowTest'
				};
				var logger = index.createExpressLogger(app, loggerConfig);
				app.use(function (req, resp, next) {
					resp.set('request-id', req.requestId);
					next();
				});
				app.get('/echo', function (req, resp, next) {
					resp.send({hello:'world'});
					next();
				});
				request.get('http://127.0.0.1:' + port + '/echo', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
					var obj = body && JSON.parse(body);
					readFile(logPath, function (err, data) {
						should(err).equal(null);
						var logContent = JSON.parse(data);
						should(logContent.length).not.equal(0);
						should(logContent.correlationId).equal(res.headers['request-id']);
					});
					callback();
				});

			});
		});
	});
	it('RDPP-644: status is "success" 1xx, 2xx, 3xx status codes', function (callback) {
		var app = express();
		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;
				var loggerConfig = {
					logs: tmpdir,
					logSingleRequest: true,
					adiLogging: true,
					name: 'arrowTest'
				};
				var logger = index.createExpressLogger(app, loggerConfig);
				app.use(function (req, resp, next) {
					resp.set('request-id', req.requestId);
					next();
				});
				app.get('/hundred', function (req, resp, next) {
					resp.status(100).send();
					next();
				});
				app.get('/twoHundred', function (req, resp, next) {
					resp.status(204).send();
					next();
				});
				app.get('/threeHundred', function (req, resp, next) {
					resp.status(301).send();
					next();
				});
				app.get('/fourHundred', function (req, resp, next) {
					resp.status(404).send();
					next();
				});
				app.get('/fiveHundred', function (req, resp, next) {
					resp.status(500).send();
					next();
				});
				request.get('http://127.0.0.1:' + port + '/hundred', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
				});
				request.get('http://127.0.0.1:' + port + '/twoHundred', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
				});
				request.get('http://127.0.0.1:' + port + '/threeHundred', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
				});
				request.get('http://127.0.0.1:' + port + '/fourHundred', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
				});
				request.get('http://127.0.0.1:' + port + '/fiveHundred', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
					readFile(logPath, function (err, data) {
						should(err).equal(null);
						var logEntries = data.split('\n');
						var hundred = JSON.parse(logEntries[0]);
						var twoHundred = JSON.parse(logEntries[1]);
						var threeHundred = JSON.parse(logEntries[2]);
						var fourHundred = JSON.parse(logEntries[3]);
						var fiveHundred = JSON.parse(logEntries[4]);
						should(hundred.status).equal('success');
						should(twoHundred.status).equal('success');
						should(threeHundred.status).equal('success');
						should(fourHundred.status).equal('failure');
						should(fiveHundred.status).equal('failure');
					});
					callback();
				});

			});
		});
	});
	it('RDPP-646: correlationId is null if no request-', function (callback) {
		var app = express();
		_util.findRandomPort(function (err, port) {
			should(err).be.not.ok;
			should(port).be.a.number;
			var server = app.listen(port, function (err) {
				should(err).be.not.ok;
				var loggerConfig = {
					logs: tmpdir,
					logSingleRequest: true,
					adiLogging: true,
					name: 'arrowTest'
				};
				var logger = index.createExpressLogger(app, loggerConfig);
				app.use(function (req, resp, next) {
					req._logname = '';
					next();
				});
				app.get('/echo', function (req, resp, next) {
					resp.send({hello:'world'});
					next();
				});
				request.get('http://127.0.0.1:' + port + '/echo', function (err, res, body) {
					should(err).not.be.ok;
					var logPath = path.join(tmpdir, 'adi-analytics.log');
					should(fs.existsSync(logPath)).be.true;
					var obj = body && JSON.parse(body);
					readFile(logPath, function (err, data) {
						should(err).equal(null);
						var logContent = JSON.parse(data);
						should(logContent.length).not.equal(0);
						should(logContent.correlationId).equal(null);
					});
					callback();
				});

			});
		});
	});
});
