'use strict';
const cluster = require('cluster');

if (cluster.isMaster) {
	cluster.fork();
} else {
	const Logger = require('../');
	const logger = Logger.createLogger();
	logger.info('hello');
	process.exit(0);
}
