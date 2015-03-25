var bunyan = require('bunyan'),
	_ = require('lodash'),
	fs = require('fs'),
	wrench = require('wrench'),
	path = require('path');

/**
 * create a restify server logger and setup not only the main
 * logger but also the request logger.
 *
 * @param  {Object} server - server
 * @param  {Object} options - options
 */
function createRestifyLogger (server, options) {
	var ConsoleLogger = require('./console');

	var logs = options && options.logs || './logs';
	if (!fs.existsSync(logs)) {
		wrench.mkdirSyncRecursive(logs);
	}

	var consoleLogger = new ConsoleLogger(options),
		config = {
			name: server.name || 'server',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res
			},
			streams: [
				{
					level: options && options.level || 'info',
					type: 'raw',
					stream: consoleLogger
				}
			]
		},
		serverLogger = bunyan.createLogger(config),
		logDir = logs,
		requestLogger = bunyan.createLogger({
			name: server.name || 'requests',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res
			},
			streams: [
				{
					level: 'trace',
					path: path.join(logDir, 'requests.log')
				}
			]
		});

	// for each request, create a request logger
	(server.pre || server.use).call(server, function (req, resp, next) {
		// we prefix with date to make it easier to sort logs by timestamp
		var name = 'request-' + req.getId(),
			logname = path.join(logDir, name + '.log'),
			log = bunyan.createLogger({
				name: name,
				serializers: {
					req: bunyan.stdSerializers.req,
					res: bunyan.stdSerializers.res
				},
				streams: [
					{
						level: 'trace',
						path: logname
					},
					{
						level: options && options.level || 'info',
						type:'raw',
						stream: consoleLogger
					}
				]
			});
		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		log.info({req_id:req.getId(), req:req, res:resp, start:true, ignore:true}, 'start');
		req.log = log;
		req.started = process.hrtime();
		req.log.logname = logname;
		req.log.name = name;

		next();
	});

	// by default, listen for the server's 'after' event but also let the
	// creator tell us to use a different event. this is nice when you have
	// additional things you want to do before ending the logging (after the server might
	// have sent the response) that you want to log or capture before ending
	var afterEvent = options && options.afterEvent || 'after';

	server.on(afterEvent, function (req, res) {
		// see if we've already calculated the duration and if so, use it
		var duration = req.duration;
		if (!duration) {
			// otherwise we need to calculated
			var time = process.hrtime(req.started);
			duration = (time[0] / 1000) + (time[1] * 1.0e-6);
			req.duration = duration;
		}
		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		requestLogger.info({res:res, req_id: req.getId(), req:req, name: req.log.name, logname: req.log.logname, duration: duration});
		if (req.log.logname) {
			// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
			var result = {
				url: req.url,
				req_headers: req.headers,
				status: res.status,
				req_id: req.getId(),
				name: req.log.name,
				logname: req.log.logname,
				duration: duration
			};
			fs.writeFileSync(req.log.logname + '.metadata', JSON.stringify(result));
		}
		// wait a little bit to let the after events to be processed before closing the stream
		process.nextTick(function () {
			setTimeout(function () {
				// Bunyan doesn't close the file stream on its own. Dirty, dirty...
				req.log.streams.forEach(function (ls) {
					try {
						if (ls.closeOnExit || !ls.raw) {
							ls.stream.end();
						}
					}
					catch (e) {
					}
				});
			}, 500);
		});
	});

	server.log = serverLogger;

	return serverLogger;
}

/**
 * Create a default logger
 *
 * @param  {Object} options - options
 */
function createDefaultLogger(options) {
	var ConsoleLogger = require('./console');
	var config = _.merge({
		name:'logger',
		streams: [
			{
				level: options && options.level || 'trace',
				type: 'raw',
				stream: new ConsoleLogger(options)
			}
		]
	}, options, function (a, b) {
		return _.isArray(a) ? a.concat(b) : undefined;
	});

	// default is to add the problem logger
	if (!options || options.problemLogger || options.problemLogger === undefined) {
		var ProblemLogger = require('./problem');
		config.streams.push({
			level: 'trace',
			type: 'raw',
			stream: new ProblemLogger(options)
		});
	}

	return bunyan.createLogger(config);
}

/**
 * Clone object
 *
 * @param  {Object} obj - object to clone
 */
function specialObjectClone(obj) {
	if (!obj || typeof(obj) === 'function') { return null; }
	if (typeof(obj) !== 'object') { return obj; }
	if (Array.isArray(obj)) { return obj; }

	// clone so we don't mutate original object
	var keys = Object.keys(obj),
		length = keys.length,
		newobj = {};
	for (var c = 0; c < length; c++) {
		var key = keys[c],
			value = obj[key],
			type = typeof(value);
		// if the object contains a password key, we want to
		// not log the actual password
		if (key === 'password') {
			value = '[HIDDEN]';
		} else if (type === 'object' && !Array.isArray(value)) {
			value = specialObjectClone(value);
		}
		newobj[key] = value;
	}
	return newobj;
}

var patchedEmit = bunyan.prototype._emit;

/**
 * monkey patch Bunyan to support suppressing password fields
 */
bunyan.prototype._emit = function (rec, noemit) {
	// we can skip built-in fields so just pull out fields that aren't one of them
	var fields = _.omit(rec, 'name', 'hostname', 'pid', 'level', 'msg', 'v', 'time'),
		keys = Object.keys(fields);
	if (keys.length) {
		// we found properties in the rec that aren't built-in. we need to
		// make sure that any of these fields aren't named password and if so
		// mask the value
		var obj = specialObjectClone(_.pick(rec, keys));
		_.merge(rec, obj);
	}
	return patchedEmit.call(this, rec, noemit);
};

/**
 * remove any ANSI color codes from the string
 */
function stripColors(str) {
	return String(str).replace(/\u001b\[\d+m/g, '');
}

exports.createLogger = createDefaultLogger;
exports.createDefaultLogger = createDefaultLogger;
exports.createRestifyLogger = createRestifyLogger;
exports.stripColors = stripColors;
