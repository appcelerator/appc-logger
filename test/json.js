// jscs:disable jsDoc
// jshint -W079
var should = require('should'),
	fs = require('fs'),
	path = require('path'),
	tmpdir = require('os').tmpdir(),
	index = require('../'),
	JSONStreamer = index.JSONStreamer;

describe('console', function () {

	it('should be able to stream JSON logs', function (callback) {
		should(JSONStreamer).be.an.object;

		var fn = path.join(tmpdir, 'json.log');
		var outfn = path.join(tmpdir, 'json_result.log');
		console.log(tmpdir);

		var buf = [];
		for (var c = 0; c < 10; c++) {
			buf[c] = JSON.stringify({c: c});
		}

		var stream = new JSONStreamer(),
			outstream = fs.createWriteStream(outfn);

		outstream.on('finish', function () {
			var contents = fs.readFileSync(outfn).toString();
			var result = JSON.parse(contents);
			should(result).be.ok;
			should(result).be.an.array;
			should(result).have.length(buf.length);
			for (var c = 0; c < buf.length; c++) {
				should(JSON.stringify(result[c])).eql(buf[c]);
			}
			callback();
		});
		stream.pipe(outstream);

		fs.writeFileSync(fn, buf.join('\n'));
		fs.createReadStream(fn).pipe(stream);
	});
});
