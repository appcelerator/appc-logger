var cluster = require('cluster');

if (cluster.isMaster) {
	cluster.fork();
} else {
	var Logger = require('../');
	var logger = Logger.createLogger();
	logger.info('hello');
	process.exit(0);
}
