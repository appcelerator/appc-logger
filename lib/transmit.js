var fs = require('fs-extra'),
    path = require('path'),
    async = require('async'),
    request = require('request'),
    targz = require('tar.gz'),
    wrench = require('wrench'),
    ip = require('ip'),
    _tmpdir = require('os').tmpdir();

//FIXME
var DEFAULT_URL = 'http://requestb.in/1fuizjr1';

function transmitFiles (options, callback) {

    var url = options.url || DEFAULT_URL,
        files = options.files,
        logger = options.logger,
        tmpdir = options.tmpdir || _tmpdir,
        headers = options.headers || {},
        metadata = options.metadata,
        deleteFiles = !!options.deleteFiles,
        dest = path.join(tmpdir,'tmp-'+Date.now()),
        destgz = path.join(tmpdir,'logs-'+Date.now()+'.tar.gz'),
        transmitted;

    if (!fs.existsSync(dest)) {
        wrench.mkdirSyncRecursive(dest);
    }

    async.series([

        function copyFiles(next_) {
            async.eachSeries(files, function(srcfn,next){
                var destfn = path.join(dest,path.basename(srcfn));
                logger.trace('copying',destfn);
                fs.copy(srcfn,destfn,next);
            },next_);
        },

        function targzip(next_) {
            logger.trace('tar.gz',dest,destgz);
            var tz = new targz();
            tz.compress(dest, destgz, next_);
        },

        function sendFiles(next_) {
            logger.trace('sending files');
            var opts = {
                url: url,
                method: options.method || 'POST',
                headers: headers
            };
            logger.trace('sending',url);
            var r = request(opts,function(err,response,body){
                if (err) {
                    if (err.code==='ENOTFOUND' || err.code==='ECONNREFUSED') {
                        return next_('Error connecting to '+url);
                    }
                    return next_(err);
                }
                logger.trace('received status=%d',response.statusCode,body);
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    // any sort of 200+ response status is OK
                    transmitted = true;
                    next_();
                }
                else {
                    next_('HTTP status was: '+response.statusCode+'. '+body);
                }
            });
            // r.on('error',next_);
            var form = r.form();
            form.append('file', fs.createReadStream(destgz));
            form.append('count', files.length);
            form.append('ipaddress', ip.address());
            form.append('platform', process.platform);
            form.append('user',process.env.USER || process.env.USERNAME);
            if (metadata) {
                Object.keys(metadata).forEach(function(key){
                    form.append(key, metadata[key]);
                });
            }
        }

    ],function(err){
        function cleanup() {
            try {
                fs.unlinkSync(destgz);
            }
            catch (E) {
                // ignore
            }
            try {
                wrench.rmdirSyncRecursive(dest);
            }
            catch (E) {
                // ignore
            }
            callback(err);
        }
        if (deleteFiles && transmitted) {
            async.each(files, fs.unlink, cleanup);
        }
        else {
            process.nextTick(cleanup);
        }
    });
}

exports.transmitFiles = transmitFiles;

if (module.id === "."){
    var files = [
        '/Users/jhaynie/work/proto/apibuilder/api-logger/logs/json.log',
        '/Users/jhaynie/work/proto/apibuilder/api-logger/logs/json_result.log'
    ];

    var logger = require('./logger').createDefaultLogger();

    transmitFiles({logger:logger, files:files, deleteFiles:true, metadata:{'a':'b'}}, function(err,results){
        console.log('done');
    });
}
