
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
