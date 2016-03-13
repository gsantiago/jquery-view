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

// var cache = {}

/**
 * Default options.
 */

View.defaults = {
  state: {}
}

/**
 * View constructor.
 * @constructor
 * @param {jQuery Element} $el
 * @param {Object} options
 */

function View ($el, options) {
  this.$el = $el
  this._options = $.extend({}, View.defaults, options)
  this._getInitialState()
}

/**
 * Inherits `EventEmitter`.
 */

inherits(View, EventEmitter)

/**
 * Alias for `View.prototype`.
 */

var fn = View.prototype

/**
 * Get the initial state.
 * @method
 * @api private
 */

fn._getInitialState = function () {
  var state = this._options.state
  this._state = $.isFunction(state)
    ? state()
    : state
  delete this._options.state
}

/**
 * Return the current state.
 * @method
 * @api public
 * @returns {Object} state
 */

fn.getState = function (obj) {
  return this._state
}

/**
 * Set the current state.
 * @method
 * @api public
 * @emits `state change`
 */

fn.setState = function (obj) {
  this._state = $.extend(this._state, obj)
  this.emit('state change', this.getState())
  return this
}
