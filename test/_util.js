'use strict';
const fs = require('fs-extra'),
	os = require('os'),
	path = require('path'),
	tmpdir = path.join(os.tmpdir(), 'appc-logger');

/**
 * create a temporary directory for use and return the path in the cb
 * @param {Function} cb callback function
 */
function getTempDir(cb) {
	const dir = path.join(tmpdir, 'test-logger-' + Date.now());
	fs.ensureDir(dir, function (err) {
		if (err) {
			console.error(err);
		}
		return cb(err, dir);
	});
}

/**
 * cleanup the created temporary directories
 * @param {Function} cb callback function
 */
function cleanupTempDirs(cb) {
	setTimeout(function () {
		fs.remove(tmpdir, cb);
	}, 9000);
}

/**
 * create a random port that is safe for listening
 * @param {Function} callback callback function
 */
function findRandomPort(callback) {
	const server = require('net').createServer(function () {});
	server.on('listening', function (err) {
		if (err) {
			return callback(err);
		}
		const port = server.address().port;
		server.close(function () {
			return callback(null, port);
		});
	});
	server.listen(0);
}

exports.findRandomPort = findRandomPort;
exports.getTempDir = getTempDir;
exports.cleanupTempDirs = cleanupTempDirs;
