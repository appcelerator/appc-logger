var stream = require('stream'),
	util = require('util'),
	Transform = stream.Transform || require('readable-stream').Transform;

util.inherits(JSONStreamer, Transform);

/**
 * Transform stream that will read a stream of JSON objects (one per line) that
 * will output as a valid JSON array where each array entry is JSON lines
 *
 * @param  {Object}   options - options
 */
function JSONStreamer(options) {
	// allow use without new
	if (!(this instanceof JSONStreamer)) {
		return new JSONStreamer(options);
	}
	// init Transform
	Transform.call(this, options);

	this.push('[');
	this.count = 0;
}

/**
 * Transform
 *
 * @param  {Object}   chunk - chunk
 * @param  {Object}   enc - encoding
 * @param  {Function} callback - callback
 */
JSONStreamer.prototype._transform = function (chunk, enc, callback) {
	var lines = chunk.toString().split('\n');
	lines.forEach(function (line) {
		line = line.trim();
		if (line) {
			if (this.count++) {
				this.push(',');
			}
			this.push(line);
		}
	}.bind(this));
	callback();
};

/**
 * Flush
 *
 * @param  {Function} callback - callback
 */
JSONStreamer.prototype._flush = function (callback) {
	this.push(']');
	this.push('\n');
	callback();
};

module.exports = JSONStreamer;
