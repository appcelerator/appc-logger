var bunyan = require('bunyan'),
	_ = require('lodash'),
	path = require('path');

/**
 * create a restify server logger and setup not only the main
 * logger but also the request logger.
 */
function createRestifyLogger (server, options) {
	var ConsoleLogger = require('./console');
	var consoleLogger = new ConsoleLogger(options),
		config = {
			name: server.name || 'server',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res
			},
			streams: [
				{
					level: 'trace',
					type:'raw',
					stream: consoleLogger
				}
			]
		},
		serverLogger = bunyan.createLogger(config),
		logDir = options && options.logs || './logs',
		requestLogger = bunyan.createLogger({
			name: server.name || 'requests',
			serializers: {
				req: bunyan.stdSerializers.req,
				res: bunyan.stdSerializers.res
			},
			streams: [
				{
					level: 'info',
					path: path.join(logDir,'requests.log')
				}
			]
		});

	// for each request, create a request logger
	server.pre(function(req, resp, next){
		// we prefix with date to make it easier to sort logs by timestamp
		var name = 'request-'+Date.now()+'-'+req.getId(),
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
						level: 'trace',
						type:'raw',
						stream: consoleLogger
					}
				]
			});
		requestLogger.info({req_id: req.getId(), req:req, name: name, logname: logname});
		log.info({req_id:req.getId(),req:req,res:resp,start:true,ignore:true},'start');
		req.log = log;
		next();
	});

	server.log = serverLogger;

	return serverLogger;
}

/**
 * create a default logger
 */
function createDefaultLogger(options) {
	var ConsoleLogger = require('./console');
	var config = _.merge({
		name:'logger',
		streams: [
			{
				level: 'trace',
				type: 'raw',
				stream: new ConsoleLogger(options)
			}
		]
	},options);

	return bunyan.createLogger(config);
}

function specialObjectClone(obj) {
	if (!obj || typeof(obj)==='function') { return null; }
	if (typeof(obj)!=='object') { return obj; }
	if (Array.isArray(obj)) { return obj; }

	// clone so we don't mutate original object
	var keys = Object.keys(obj),
		length = keys.length,
		newobj = {};
	for (var c=0;c<length;c++) {
		var key = keys[c],
			value = obj[key],
			type = typeof(value);
		// if the object contains a password key, we want to
		// not log the actual password
		if (key === 'password') {
			value = '[HIDDEN]';
		}
		else if (type === 'object' && !Array.isArray(value)) {
			value = specialObjectClone(value);
		}
		newobj[key]=value;
	}
	return newobj;
}

var patchedEmit = bunyan.prototype._emit;

/**
 * monkey patch Bunyan to support suppressing password fields
 */
bunyan.prototype._emit = function (rec, noemit) {
	// we can skip built-in fields so just pull out fields that aren't one of them
	var fields = _.omit(rec,'name','hostname','pid','level','msg','v','time'),
		keys = Object.keys(fields);
	if (keys.length) {
		// we found properties in the rec that aren't built-in. we need to
		// make sure that any of these fields aren't named password and if so
		// mask the value
		var obj = specialObjectClone(_.pick(rec,keys));
		_.merge(rec,obj);
	}
	return patchedEmit.call(this,rec,noemit);
};

/**
 * remove any ANSI color codes from the string
 */
function stripColors(str) {
	return String(str).replace(/\u001b\[\d+m/g,'');
}

exports.createLogger = createDefaultLogger;
exports.createDefaultLogger = createDefaultLogger;
exports.createRestifyLogger = createRestifyLogger;
exports.stripColors = stripColors;
