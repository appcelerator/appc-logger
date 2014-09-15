# Appcelerator Common Logger [![Build Status](https://magnum.travis-ci.com/appcelerator/appc-logger.svg?token=xjwxUDk3aUJaLhguTqyB)](https://magnum.travis-ci.com/appcelerator/appc-logger)

## Introduction

This is a library for creating a Logger to be used by AppC Node applications.

The internal logger is a [Bunyan](https://github.com/trentm/node-bunyan) logger instance.

## Default Logger

You can create a default logger that logs to the console using:

```javascript
var Logger = require('appc-logger');
var logger = Logger.createLogger();
logger.info('Hello, world');
```

## Restify Logger

If you are using [Restify](https://github.com/mcavage/node-restify) you can create a restify logger:

```javascript
var server = restify.createServer();
var Logger = require('appc-logger');
var logger = Logger.createRestifyLogger(server);
logger.info('Hello, world');
```

This will create a basic logger that you can use but also setup a per-request logger.

To control the directory to where it should place logs, specify a `logs` property in the options.  For example:

```javascript
var logger = Logger.createRestifyLogger(server,{
    logs: 'my_log_dir'
});
```

## Features

### Password Masking

When using this library, any log records will automatically mask the password value if the object property is named `password` (including nested object properties).

```javascript
logger.info({obj:{password:'1234'}},'hello');
```

### Restify Request Logging

Each Restify request will log it's own log file.

The `log` property is automatically set on the Restify `req` object (request).

