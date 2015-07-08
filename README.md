# Appcelerator Logger 

> This is a library for creating a Logger to be used by AppC Node applications. The internal logger is a [Bunyan](https://github.com/trentm/node-bunyan) logger instance.

[![Build Status](https://travis-ci.org/appcelerator/appc-logger.png)](https://travis-ci.org/appcelerator/appc-logger)

## Default Logger

You can create a default logger that logs to the console using:

```javascript
var Logger = require('appc-logger');
var logger = Logger.createLogger();
logger.info('Hello, world');
```

You should see:

```bash
INFO   | Hello, world
```

The returned logger instance is a Bunyan logger instance.  The only stream added for the basic logger is a console logger.  The built-in console logger will do basic color coding to the console based on the level. However, by default, color coding will be removed when the TTY is not attached (for example, piping the output of the process to a file) or when running in the [Travis](travis-ci.org) build environment.

You can customize the default logger with sending options into the constructor.

The following are available properties for customization:

- `prefix` - boolean to indicate if the Log Level should be printed in the console.  defaults to true. set to false to suppress the label.

- `showcr` - boolean to indicate if the log output show show a special carriage return symbol (`↩`) to indicate a carriage return in the message.  defaults to true.

- `showtab` - boolean to indicate if the log output show show a special tab symbol (`↠`) to indicate a tab in the message.  defaults to true.


```javascript
var Logger = require('appc-logger');
var logger = Logger.createLogger({prefix:false});
logger.info('Hello, world');
```

You should see:

```bash
Hello, world
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


## Hacking the code

You just need to pull the code and resolve the dependendencies.  You will need to make sure you have [Grunt](http://gruntjs.com/) installed before running:

```bash
[sudo] npm install grunt -g
```

```bash
git clone git@github.com:appcelerator/appc-logger.git
cd appc-logger
npm install
grunt
```

### Running Unit Tests

To run the unit tests, simply run:

```bash
grunt
```

### Running Code Coverage

To generate the code coverage, you can simply run:

```bash
grunt cover
```

It will generate a folder called `coverage`.  Open the file `index.html` in your browser to view the coverage results.


## Contributing

This is an open source project. Please consider forking this repo to improve,
enhance or fix issues. If you feel like the community will benefit from your
fork, please open a pull request.

To protect the interests of the contributors, Appcelerator, customers
and end users we require contributors to sign a Contributors License Agreement
(CLA) before we pull the changes into the main repository. Our CLA is simple and
straightforward - it requires that the contributions you make to any
Appcelerator open source project are properly licensed and that you have the
legal authority to make those changes. This helps us significantly reduce future
legal risk for everyone involved. It is easy, helps everyone, takes only a few
minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate
your e-mail address in your first pull request so that we can make sure that
will locate your CLA. Once you've submitted it, you no longer need to send one
for subsequent submissions.

## License

This project is open source and provided under the [Apache Public License
(version 2)](https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)).

Copyright (c) 2014, [Appcelerator](http://www.appcelerator.com/) Inc. All Rights Reserved.
