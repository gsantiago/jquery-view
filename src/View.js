/**
 * Module dependencies.
 */

var $ = require('jquery')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

/**
 * Expose `View`.
 */

module.exports = View

/**
 * Cache object for templates.
 */

var cache = {}
