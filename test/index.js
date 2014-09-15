var should = require('should'),
	index = require('../');

describe("index", function(){

	it("should be able to load", function(){
		should(index).be.an.object;
	});

	it("should define ConsoleLogger", function(){
		should(index.ConsoleLogger).be.an.object;
	});

    it("should mask password in record", function(callback){
        var logger = index.createDefaultLogger(),
            consoleLogger = logger.streams[0].stream;

        consoleLogger.write = function(record) {
            should(record).have.property('password','[HIDDEN]');
            callback();
            return true;
        };
        logger.info({password:'1234'},'hello');
    });

    it("should mask password in record (nested)", function(callback){
        var logger = index.createDefaultLogger(),
            consoleLogger = logger.streams[0].stream;

        consoleLogger.write = function(record) {
            should(record.obj).be.an.object;
            should(record.obj).have.property('password','[HIDDEN]');
            callback();
            return true;
        };
        logger.info({obj:{password:'1234'}},'hello');
    });

});