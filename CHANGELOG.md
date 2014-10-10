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
