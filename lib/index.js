var _ = require('lodash');

exports.ConsoleLogger = require('./console');
exports.JSONStreamer = require('./json');

_.merge(exports, require('./logger'));

