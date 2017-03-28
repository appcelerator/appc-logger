var fs = require('fs-extra'),
		os = require('os'),
		path = require('path'),
		tmpdir = path.join(os.tmpdir(), 'appc-logger');

/**
 * create a temporary directory for use and return the path in the cb
 */
function getTempDir(cb) {
	var dir = path.join(tmpdir, 'test-logger-' + Date.now());
	fs.ensureDir(dir, function (err) {
		if (err) {
			console.error(err);
		}
		return cb(err, dir);
	});
}

/**
 * cleanup the created temporary directories
 */
function cleanupTempDirs(cb) {
	setTimeout(function () {
		fs.remove(tmpdir, cb);
	}, 9000);
}

/**
 * create a random port that is safe for listening
 */
function findRandomPort(callback) {
	var server = require('net').createServer(function () {});
	server.on('listening', function (err) {
		if (err) { return callback(err); }
		var port = server.address().port;
		server.close(function () {
			return callback(null, port);
		});
	});
	server.listen(0);
}

exports.findRandomPort = findRandomPort;
exports.getTempDir = getTempDir;
exports.cleanupTempDirs = cleanupTempDirs;
