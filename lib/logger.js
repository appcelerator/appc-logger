var bunyan = require('bunyan'),
	_ = require('lodash'),
	fs = require('fs-extra'),
	path = require('path'),
	assert = require('assert'),
	debug = require('debug')('appc:logger'),
	supportedHttpServices = ['restify', 'express', 'expressjs'],
	arrowCloudHosted = !!process.env.NODE_ACS_URL,
	arrowCloudLogDir = arrowCloudHosted && searchForArrowCloudLogDir();

// istanbul ignore next
/**
 * Looks through the filesystem for a writable spot to which we can write the logs.
 */
function searchForArrowCloudLogDir() {
	if (isWritable('/ctlog')) {
		return '/ctlog';
	}
	if (process.env.HOME && isWritable(path.join(process.env.HOME, 'ctlog'))) {
		return path.join(process.env.HOME, 'ctlog');
	}
	if (process.env.USERPROFILE && isWritable(path.join(process.env.USERPROFILE, 'ctlog'))) {
		return path.join(process.env.USERPROFILE, 'ctlog');
	}
	if (isWritable('./logs')) {
		return path.resolve('./logs');
	}
	throw new Error('No writable logging directory was found.');
}

// istanbul ignore next
/**
 * Checks if a directory is writable, returning a boolean or throwing an exception, depending on the arguments.
 * @param dir The directory to check.
 * @returns {boolean} Whether or not the directory is writable.
 */
function isWritable(dir) {
	debug('checking if ' + dir + ' is writable');
	try {
		if (!fs.existsSync(dir)) {
			debug(' - it does not exist yet, attempting to create it');
			fs.mkdirSync(dir);
		}
		if (fs.accessSync) {
			fs.accessSync(dir, fs.W_OK);
		} else {
			debug(' - fs.accessSync is not available, falling back to manual write detection');
			fs.writeFileSync(path.join(dir, '.foo'), 'foo');
			assert.equal(fs.readFileSync(path.join(dir, '.foo'), 'UTF-8'), 'foo');
			fs.unlinkSync(path.join(dir, '.foo'));
		}
		debug(' - yes, it is writable');
		return true;
	} catch (exc) {
		debug(' - no, it is not writable: ', exc);
		return false;
	}
}

/**
 * A bunyan serializer for req.route of express/restify
 * @param  {Object} original route
 * @return {Object} serialized route
 */
function routeSerializer(route) {
	if (route && route.path) {
		return {
			path: route.path,
			methods: route.methods,
			method: route.method
		};
	}
	return route;
}

/**
 * create a server logger (based on expressjs or restify),
 * and setup not only the main logger but also the request logger.
 * @param  {Object} server      instance of express app or restify server
 * @param  {string} serviceType express, expressjs or restify
 * @param  {Object} options     options: {name:'server/app name', level:'debug', afterEvent:'afterEvent', logSingleRequest:false, adiLogging: false, adiPathFilter: []}
 * @return {Object}             server logger instance, with a request logger inside
 */
function createHttpLogger(server, serviceType, options) {
	if (typeof service === 'object') {
		options = serviceType;
		// default service type: express
		serviceType = 'express';
	}

	if (supportedHttpServices.indexOf(serviceType) === -1) {
		throw new Error('Wrong service type');
	}

	// variable to indicate if this app is hosted by Arrow Cloud
	var ConsoleLogger = require('./console'),
		logDir = arrowCloudHosted ? arrowCloudLogDir : (options && options.logs || './logs'),
		skipRequestLog;

	// if not hosted, create the directory.
	if (!arrowCloudHosted && !fs.existsSync(logDir)) {
		fs.mkdirs(logDir);
	}

	// turn off if specified we don't want logging
	if (!arrowCloudHosted && options && !options.logSingleRequest) {
		skipRequestLog = true;
	}

	if (options && options.adiPathFilter === undefined) {
		options.adiPathFilter = [];
	}

	var serverName = server.name || (options && options.name),
		consoleLogger = new ConsoleLogger(options),
		serverLogger = bunyan.createLogger({
			name: serverName || 'server',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res
			},
			streams: [{
				level: options && options.level || 'info',
				type: 'raw',
				stream: consoleLogger
			}]
		}),
		// only create the request logger if we have a log directory to log to
		requestLogger = !skipRequestLog && fs.existsSync(logDir) && bunyan.createLogger({
				name: serverName || 'requests',
				serializers: {
					req: bunyan.stdSerializers.req,
					res: bunyan.stdSerializers.res,
					route: routeSerializer
				},
				streams: [{
					type: 'rotating-file',
					period: '1d',
					count: 1,
					level: 'trace',
					path: path.join(logDir, options && options.requestsLogFilename || 'requests.log')
				}]
			}),
		adiLogger = options && options.adiLogging && fs.existsSync(logDir) && bunyan.createLogger({
			name: serverName || 'adiLogs',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res,
				route: routeSerializer
			},
			streams: [{
				type: 'rotating-file',
				period: '1d',
				count: 1,
				level: 'trace',
				path: path.join(logDir, 'adi-analytics.log')
			}]
		});

	serverLogger.requestLogger = requestLogger;
	server.log = serverLogger;

	(server.pre || server.use).call(server, function (req, resp, next) {
		req.requestId = req.requestId || (serviceType === 'restify' ? req.getId() : require('uuid-v4')());
		if (serviceType === 'restify') {
			// record timestamp if using restify framework
			req.started = req.started || process.hrtime();
		}

		if (options && options.logSingleRequest && (req.url && req.url !== '/arrowPing.json')) {
			// we prefix with date to make it easier to sort logs by timestamp
			var name = 'request-' + req.requestId,
				logname = path.join(logDir, name + '.log'),
				logstream = fs.createWriteStream(logname),
				log = bunyan.createLogger({
					name: name,
					serializers: {
						req: bunyan.stdSerializers.req,
						res: bunyan.stdSerializers.res,
						route: routeSerializer
					},
					streams: [{
						level: 'trace',
						stream: logstream
					}, {
						level: options && options.level || 'info',
						type: 'raw',
						stream: consoleLogger
					}]
				});
			// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
			log.info({
				req_id: req.requestId,
				req: req,
				res: resp,
				route: req.route,
				start: true,
				ignore: true
			}, 'start');
			req.log = log;
			req.logname = logname;
			req.logstream = logstream;
			req._logname = name;
			req.cleanStream = cleanStream;
		}

		next();
	});

	/**
	 * derive the port if its in the host string.
	 * @param  {Object} req a express req object
	 * @return {string}     string representation of port
	 */
	function getPort(req) {
		if (req.connection && req.connection.localPort) {
			return req.connection.localPort.toString();
		}
		var host = req.headers && req.headers.host;
		var protocolSrc = 80;
		if (host && ((host.match(/:/g) || []).length) === 1) {
			var possiblePort = host.split(':')[1];
			protocolSrc = isNaN(possiblePort) ? protocolSrc : possiblePort;
		}
		return protocolSrc;
	}
	/**
	 * derive the status string from the status code
	 * @param  {Object} res express res object
	 * @return {string}     success or error string
	 */
	function getStatus (res) {
		var status,
		statusCode = res.statusCode;
		if (statusCode) {
			status = Math.floor(statusCode / 100) * 100;
		}
		switch (status) {
			case 100:
			case 200:
			case 300:
				return 'success';
			default:
				return 'failure';
		}
	}
	/**
	 * get the request id from the logname
	 * @param  {Object} req express request object
	 * @return {string}     string representation of request id
	 */
	function getCorrelationId(req) {
		return req.requestId || null;
	}

	/**
	 * Determine whether a certain URL is whitelisted based off the prefix
	 * @param  {string}  url URL to check
	 * @return {boolean}     Is the URL in the whitelist
	 */
	function isWhitelisted(url) {
		return _.some(options.adiPathFilter, function (route) {
			return url.substr(0, route.length) === route;
		});
	}

	/**
	 * A function to log request into file
	 * @param  {Object} req  Request
	 * @param  {Object} res  Response
	 */
	function logRequest(req, res) {
		var responseTime = Math.round(req.duration),
			shouldLogRequest = requestLogger && req && req.url && req.url !== '/arrowPing.json',
			shouldADILog = options && options.adiLogging && adiLogger && req && req.url && isWhitelisted(req.url),
			time = new Date().getTime(),
			uri = (req.route && req.route.path) || req.path || (req.url && req.url.split('?')[0]),
			localPort = getPort(req);

		if (shouldLogRequest && req.log && req.logname && (req.logmetadata === undefined || req.logmetadata)) {
			requestLogger.info({
				req_id: req.requestId,
				req: req,
				res: res,
				route: req.route,
				name: req._logname,
				logname: req.logname,
				response_time: responseTime
			});

			var result = {
				url: req.url,
				req_headers: req.headers,
				status: res.status,
				req_id: req.requestId,
				name: req._logname,
				logname: req.logname,
				response_time: responseTime
			};
			fs.writeFile(req.logname + '.metadata', JSON.stringify(result));
		} else if (shouldLogRequest) {
			requestLogger.info({
				req_id: req.requestId,
				response_time: responseTime,
				route: req.route,
				req: req,
				res: res
			});
		}

		if (shouldADILog) {
			adiLogger.info({
				type: 'transaction',
				time: time,
				path: uri,
				protocol: req.protocol,
				protocolSrc: localPort,
				duration: responseTime,
				status: getStatus(res),
				serviceContexts: [
					{
						service: '',
						monitor: '',
						client: null,
						org: null,
						app: options.name,
						method: '',
						status: '',
						duration: ''
					}
				],
				customMsgAtts: {},
				correlationId: getCorrelationId(req),
				legs: [
					{
						uri: uri,
						status: res.statusCode,
						statusText: '',
						method: req.method,
						vhost: null,
						wafStatus: 0,
						bytesSent: parseInt(res.get('Content-Length'), 10) || null,
						bytesReceived: parseInt(req.get('Content-Length'), 10) || null,
						remoteName: '',
						remoteAddr: '',
						localAddr: '',
						remotePort: '',
						localPort: '',
						sslsubject: null,
						leg: 0,
						timestamp: time,
						duration: responseTime,
						serviceName: uri,
						subject: null,
						operation: req.method + ' - ' + uri,
						type: req.protocol,
						finalStatus: ''
					}
				]
			});
		}
		if (req.cleanStream) {
			req.cleanStream();
			req.cleanStream = null;
		}
	}

	if (serviceType === 'restify') {
		// restify framework

		// by default, listen for the server's 'after' event but also let the
		// creator tell us to use a different event. this is nice when you have
		// additional things you want to do before ending the logging (after the server might
		// have sent the response) that you want to log or capture before ending
		var afterEvent = options && options.afterEvent || 'after';
		server.on(afterEvent, function (req, res) {
			// see if we've already calculated the duration and if so, use it
			var duration = req.duration;
			if (!duration) {
				// otherwise we need to calculate it
				var time = process.hrtime(req.started);
				duration = (time[0] / 1000) + (time[1] * 1.0e-6);
				req.duration = duration;
			}
			logRequest(req, res);
		});
	} else {
		// express framework
		var responseTimeMiddleWare = require('response-time');
		server.use(responseTimeMiddleWare(function (req, res, duration) {
			req.duration = duration;
			logRequest(req, res);
		}));
	}

	return serverLogger;
}

/**
 * Cleans a req log stream up after a delayed period. This should be used as a method of a req, and called within the
 * context of a req only (ie. req.cleanStream = cleanStream; req.cleanStream()).
 */
function cleanStream() {
	var logStream = this.logstream;
	this.logstream = this.cleanStream = null;

	this.log = null;
	this.logname = null;
	this._logname = null;

	// wait a little bit to let other end events process before closing the stream
	logStream && setTimeout(logStream.end.bind(logStream), 500);
}

/**
 * create a restify server logger and setup not only the main
 * logger but also the request logger.
 *
 * @param  {Object} server - restify server
 * @param  {Object} options - options
 */
function createRestifyLogger(server, options) {
	return createHttpLogger(server, 'restify', options);
}

/**
 * create a expressjs logger and setup not only the main
 * logger but also the request logger.
 *
 * @param  {Object} app - expressjs app
 * @param  {Object} options - options
 */
function createExpressLogger(app, options) {
	return createHttpLogger(app, 'express', options);
}

/**
 * Create a default logger
 *
 * @param  {Object} options - options
 */
function createDefaultLogger(options) {
	var ConsoleLogger = require('./console'),
		consoleLogger = new ConsoleLogger(options),
		config = _.merge({
			name: 'logger',
			streams: [
				{
					level: options && options.level || 'trace',
					type: 'raw',
					stream: consoleLogger
				}
			]
		}, options, function (a, b) {
			return _.isArray(a) ? a.concat(b) : undefined;
		});

	consoleLogger.level = bunyan.resolveLevel(options && options.level || 'trace');

	// default is to add the problem logger
	if (!options || options.problemLogger || options.problemLogger === undefined) {
		var ProblemLogger = require('./problem');
		config.streams.push({
			level: 'trace',
			type: 'raw',
			stream: new ProblemLogger(options)
		});
	}

	var defaultLogger = bunyan.createLogger(config);
	/**
	 * Set log level
	 * Backward compatible with Arrow Cloud MVC framework
	 * @param {Object} nameOrNum log level in string or number
	 */
	defaultLogger.setLevel = function (nameOrNum) {
		var level = 'trace';
		try {
			level = bunyan.resolveLevel(nameOrNum);
		} catch (e) {}
		consoleLogger.level = level;
		return this.level(level);
	};
	return defaultLogger;
}

/**
 * Clone object
 *
 * @param  {Object} obj - object to clone
 * @param [seen] An array containing objects that have been seen before, useful to prevent infinite circular recursion.
 */
function specialObjectClone(obj, seen) {
	if (obj === undefined || obj === null) { return obj; }
	var type = typeof(obj);
	if (type === 'function') { return null; }
	if (type !== 'object') { return obj; }
	if (obj instanceof Error) { return obj; }
	if (obj instanceof Buffer) { return '[Buffer]'; }
	if (obj instanceof RegExp) { return '/' + obj.source + '/'; }
	if (Array.isArray(obj)) {
		var maskFields = ['--password', '-password'];
		newobj = null;
		for (var i = 0, l = obj.length; i < l; ++i) {
			if (maskFields.indexOf(obj[i]) > -1 && obj[++i]) {
				if (newobj === null) { newobj = obj.slice(0); }
				newobj[i] = '[HIDDEN]';
			}
		}
		return newobj ? newobj : obj;
	}

	// we need to deal with circular references
	seen = seen || [];

	// clone so we don't mutate original object
	var keys = Object.keys(obj),
		length = keys.length,
		newobj = {};
	for (var c = 0; c < length; c++) {
		var key = keys[c],
			value = obj[key];
		// if the object contains a password key, we want to
		// not log the actual password
		if (/^password[-_]?/.test(key)) {
			value = '[HIDDEN]';
		} else if (key === 'req' || key === 'res') {
			// Skip.
		} else if (typeof(value) === 'object') {
			if (seen.indexOf(value) !== -1) {
				value = '[Circular]';
			} else {
				seen.push(value);
				value = specialObjectClone(value, seen);
			}
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
		var seen = [];
		var obj = specialObjectClone(_.pick(rec, keys), seen);
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
exports.createHttpLogger = createHttpLogger;
exports.createRestifyLogger = createRestifyLogger;
exports.createExpressLogger = createExpressLogger;
exports.stripColors = stripColors;
exports.specialObjectClone = specialObjectClone;
exports.arrowCloudLogDir = arrowCloudLogDir;
