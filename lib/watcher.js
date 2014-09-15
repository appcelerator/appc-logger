var util = require('util'),
    _ = require('lodash'),
    events = require('events'),
    path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    EventEmitter = events.EventEmitter;

util.inherits(Watcher, events.EventEmitter);

/**
 * this class will manage a separate child process that will
 * run the log-publish command with --watch so that it will monitor
 * logs and send them to the server
 */
function Watcher(options) {
    EventEmitter.call(this);
    this.options = options || {};
    this.running = false;

    if (!this.options.dir && !this.options.file) {
        throw new Error("must supply either a dir or file");
    }
}

Watcher.prototype._exited = function() {
    this.stop();
};

Watcher.prototype.start = function() {
    if (!this.running) {

        this._exitListener = this._exited.bind(this);

        process.on('SIGINT',this._exitListener);
        process.on('exit',this._exitListener);

        var bin = path.join(__dirname,'..','bin','log-publish'),
            args = [],
            self = this,
            opts = _.pick(this.options,'age','dir','file','interval','level','quiet','server');

        args.push('--watch');

        Object.keys(opts).forEach(function(key){
            var value = opts[key];
            args.push('--'+key);
            value && args.push(value);
        });

        this.running = true;
        this.child = spawn(bin,args);
        this.child.on('error', function(error){
            self.emit('error',error);
        });
        this.child.stdout.on('data',function(buf){
            self.emit('stdout',String(buf).trim());
        });
        this.child.stderr.on('data',function(buf){
            self.emit('stderr',String(buf).trim());
        });
        this.child.on('close',function(err,signal){
            self.stop();
        });

        this.emit('start',args,bin);
    }
};

Watcher.prototype.stop = function() {
    if (this.running) {
        this.child.kill('SIGINT');
        this.running = false;
        process.removeListener('SIGINT',this._exitListener);
        process.removeListener('exit',this._exitListener);
        this.child.removeAllListeners();
        this.child = null;
        this.emit('stop');
    }
};

module.exports = Watcher;

if (module.id === ".") {
    var w = new Watcher({age:1000, interval:1000,dir:'./logs',level:'trace'});
    w.on('stdout',function(buf){
        console.log(buf.toString());
    });
    w.on('stop',function(){
        console.log('stopped');
    });
    w.start();
    setTimeout(w.stop.bind(w),10000);
}
