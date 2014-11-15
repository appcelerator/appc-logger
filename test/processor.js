var should = require('should'),
	index = require('../'),
	_util = require('./_util'),
	_console = new (require('./_console'))(),
	restify = require('restify'),
	path = require('path'),
	fs = require('fs-extra'),
	wrench = require('wrench'),
	exec = require('child_process').exec,
	bin = path.join(__dirname, '..', 'bin', 'log-publish'),
	tmpdir = path.join(require('os').tmpdir(),'test-logger-'+Date.now());


describe("logger", function(){

	before(function(){
		try {
			wrench.mkdirSyncRecursive(tmpdir);
		}
		catch(E) {
		}
	});

	after(function(){
		_console.stop();
		wrench.rmdirSyncRecursive(tmpdir);
	});

	it("should be able to process empty log directory", function(callback){
		var cmd = bin + ' --quiet --server http://0.0.0.0:{port} --dir "'+tmpdir+'"';
		createServerTest(cmd, function(err,stdout,stderr){
			should(err).be.not.ok;
			should(stdout).be.not.ok;
			should(stderr).be.not.ok;
			callback();
		});
	});

	it("should be able to fail on bad server", function(callback){
		var fn = path.join(tmpdir, 'fail.log');
		fs.writeJSONFileSync(fn,{});
		var cmd = bin + '  --server http://0.0.0.0:1 --file "'+fn+'"';
		createServerTest(cmd, function(err,stdout,stderr){
			fs.unlinkSync(fn);
			should(err).be.ok;
			should(err.code).equal(1);
			should(stdout).be.ok;
			should(stderr).be.not.ok;
			stdout.should.match(/Error connecting to http:\/\/0\.0\.0\.0\:1/);
			callback();
		});
	});

	it("should be able to send log", function(callback){
		var fn = path.join(tmpdir, 'fail.log');
		fs.writeJSONFileSync(fn,{});
		var cmd = bin + '  --server http://0.0.0.0:{port}/logs --file "'+fn+'"';
		createServerTest(cmd, function(err,stdout,stderr,body,files){
			should(fs.existsSync(fn)).be.false;
			should(err).be.not.ok;
			should(stdout).be.ok;
			should(stderr).be.not.ok;
			stdout.should.match(/Done!/);
			should(body).be.ok;
			should(files).be.ok;
			should(body).have.property('count','1');
			should(body).have.property('platform',process.platform);
			should(body).have.property('ipaddress');
			should(body).have.property('user');
			should(files.file).be.an.object;
			should(files.file).have.property('name');
			should(files.file).have.property('type','application/octet-stream');
			callback();
		});
	});

});

function createServerTest(cmd, callback) {
	var server = restify.createServer();

	_util.findRandomPort(function(err, port){
		should(err).be.not.ok;
		should(port).be.a.number;

		cmd = cmd.replace(/\{(\w+)\}/g, function(value){
			var key = value.substring(1, value.length-1);
			switch (key) {
				case 'port': {
					return port;
				}
			}
			return value;
		});

		server.listen(port, function(err){
			should(err).be.not.ok;

			server.pre(restify.pre.sanitizePath())
				.pre(restify.pre.userAgentConnection())
				.use(restify.fullResponse())
				.use(restify.bodyParser())
				.use(restify.gzipResponse())
				.use(restify.queryParser());

			var body, files;

			server.post('/logs', function(req,resp,next){
				body = req.body;
				files = req.files;
				resp.send({success:true});
				next();
			});

			console.log(cmd);

			exec(cmd, function(err,stdout,stderr){
				process.env.CONSOLE && console.log(arguments);
				server.close();
				callback(err,stdout,stderr,body,files);
			});
		});
	});
}
