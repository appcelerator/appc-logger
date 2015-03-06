## 1.0.24 (2015-01-31)

- always log request logs at trace level, regardless of console log level

## 1.0.22 (2015-01-31)

- switch requests.log to use rotating file by default

## 1.0.21 (2015-01-28)

- support for express in addition to restify

## 1.0.20 (2015-01-21)

- write out a metadata for logging in addition to requests.log
- removed unused log processing code and CLI

## 1.0.19 (2015-01-11)

- make sure we remember the user set level and return that from overriden level() in ProblemLogger

## 1.0.18 (2015-01-11)

- make sure we return built in level if called with no args from overriden level() in ProblemLogger

## 1.0.17 (2015-01-11)

- make sure we return the level from overriden level() in ProblemLogger

## 1.0.16 (2015-01-10)

- more improvements to ProblemLogger

## 1.0.15 (2015-01-10)

- add a header to the problem log file when opened. print out date/time for problem log.
- make sure problem logger exits if no problem logger configured

## 1.0.14 (2015-01-10)

- make sure process.exit override defaults to 0 if not specified

## 1.0.13 (2015-01-10)

- Added ability for default logger which will dump a log file at TRACE level if process exits non-zero in current working directory

## 1.0.10 (2014-11-15)

- Allow passing through color codes for logging when --colorize is passed in or specifically specifying colorize option in constructor of Logger

## 1.0.9 (2014-10-22)

- Limit Bunyan to 1.1.x because of [issue with bundling](https://github.com/appcelerator/appc-logger/commit/af72f1f5f3a14ef96e188620defadcd58b7ce3a4)

## 1.0.8 (2014-10-11)

- Use high resolution timer for request logging (Restify)
- Allow Restify after event to be customized

## 1.0.7 (2014-10-09)

- Restify logger: send log entry to requests.log only after request ends. added duration to log entry that represents the milliseconds that the request took (duration)

## 1.0.5 (2014-09-19)

- Support sending first argument as an object and having it correctly format for Console Logger ([#7](https://github.com/appcelerator/appc-logger/issues/7))
- Fixed context for console.log in Console Logger

## 1.0.4 (2014-09-15)

- Make sure that the directory exists for Restify logger before attempting to setup the stream
- Support merging logger stream options

## 1.0.3 (2014-09-15)

- Added ability for built-in Console Logger to show carriage return and tab characters in console output (only) with special color coded character to make it easier to see these characters visibility.  On by default, but configurable (see doc).

## 1.0.2 (2014-09-15)

- Added property `prefix` to allow suppression of Log level on Console logger

## 1.0.1 (2014-09-15)

- Fixed issue with cyclic dependency on external loading of module

## 1.0.0 (2014-09-15)

- Initial commit
