/**
 * Module dependencies.
 */

var $ = require('jquery')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var Template = require('./Template')

/**
 * Expose `View`.
 */

module.exports = View

/**
 * Cache object for templates.
 */

var cache = {}

/**
 * Default options.
 */

View.defaults = {
  state: {},
  template: '',
  templateUrl: '',
  replace: true,
  beforeRender: $.noop,
  afterRender: $.noop
}

/**
 * View constructor.
 * @constructor
 * @param {jQuery Element} $el
 * @param {Object} options
 * @emits `template loaded`
 */

function View ($el, options) {
  var self = this
  this.$el = $el
  this._options = $.extend({}, View.defaults, options)
  this._getInitialState()

  $.each(this._options, function (key, option) {
    if (Object.keys(View.defaults).indexOf(key) !== -1) return
    self[key] = option
  })

  this._getTemplate()
    .done(function (template) {
      self._templateSource = template
      self._template = new Template(template)
      self.emit('template loaded')
      self._start()
    })
    .fail(function (err) {
      console.error('Fail to load external template:', err)
    })
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

/**
 * Get the template string.
 * The priority for get the template code is:
 * 1. templateUrl
 * 2. template
 * 3. $el's html
 * @method
 * @api private
 * @returns {Promise}
 */

fn._getTemplate = function () {
  var options = this._options
  var $el = this.$el

  if (options.templateUrl) return this._getExternalTemplate()

  var deferred = $.Deferred()

  if (options.template) {
    deferred.resolve(options.template)
  } else {
    var source = options.replace
     ? $('<div>').append($el.clone()).html()
     : $el.html()
    deferred.resolve(source)
  }

  return deferred.promise()
}

/**
 * Get external template.
 * @method
 * @api private
 * @returns {Promise}
 */

fn._getExternalTemplate = function () {
  var url = this._options.templateUrl
  var deferred = $.Deferred()

  if (cache[url]) {
    deferred.resolve(cache[url])
  } else {
    $.get(url)
      .done(function (response) {
        cache[url] = response
        deferred.resolve(response)
      })
      .fail(deferred.reject)
  }

  return deferred.promise()
}

/**
 * Render `$el`.
 * @method
 * @api private
 * @emits `before render`
 * @emits `after render`
 */

fn._render = function () {
  var $el = this.$el
  var currentState = this.getState()
  var template = this._template

  this.emit('before render', $el, currentState)

  var html = template.parse(currentState, this)

  if (this._options.replace) {
    var $newEl = $(html)
    $el.replaceWith($newEl)
    this.$el = $el = $newEl
  } else {
    $el.html(html)
  }

  this.emit('after render', $el, currentState)
}

/**
 * Start method.
 * It runs once and also call the custom `init` method.
 * @method
 * @api private
 * @emits `ready`
 */

fn._start = function () {
  this.on('state change', this._render)
  this.on('before render', this._options.beforeRender)
  this.on('after render', this._options.afterRender)
  if (this.init) this.init()
  this._render()
  this.emit('ready', this.$el)
}
