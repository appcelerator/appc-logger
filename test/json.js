// jscs:disable jsDoc
// jshint -W079
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('should'),
	fs = require('fs'),
	path = require('path'),
	tmpdir = require('os').tmpdir(),
	index = require('../'),
	JSONStreamer = index.JSONStreamer;

describe('console', function () {

	it('should be able to stream JSON logs', function (callback) {
		should(JSONStreamer).be.an.object;

		const fn = path.join(tmpdir, 'json.log');
		const outfn = path.join(tmpdir, 'json_result.log');
		console.log(tmpdir);

		const buf = [];
		for (let c = 0; c < 10; c++) {
			buf[c] = JSON.stringify({ c: c });
		}

		const stream = new JSONStreamer(),
			outstream = fs.createWriteStream(outfn);

		outstream.on('finish', function () {
			var contents = fs.readFileSync(outfn).toString();
			var result = JSON.parse(contents);
			should(result).be.ok;
			should(result).be.an.array;
			should(result).have.length(buf.length);
			for (let c = 0; c < buf.length; c++) {
				should(JSON.stringify(result[c])).eql(buf[c]);
			}
			callback();
		});
		stream.pipe(outstream);

		fs.writeFileSync(fn, buf.join('\n'));
		fs.createReadStream(fn).pipe(stream);
	});
});
