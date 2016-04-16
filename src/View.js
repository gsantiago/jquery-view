/**
 * Module dependencies.
 */

var $ = require('jquery')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var Template = require('./Template')
var utils = require('./utils')

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
  beforeRender: $.noop,
  afterRender: $.noop,
  events: null,
  props: {}
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

  this.props = $.extend({}, this._options.props, utils.getProps($el))
  this._directiveEvents = []

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
 * Set the state from an Ajax request.
 * @method
 * @api public
 * @params {Object} conf
 * @returns {Promise}
 */

fn.setStateFromAjax = function (conf) {
  var self = this

  var defaults = {
    url: null,
    method: 'get',
    state: null,
    property: null,
    data: null
  }

  conf = $.extend({}, defaults, conf)

  var deferred = $.Deferred()

  $.ajax({
    url: conf.url,
    context: self,
    method: conf.method.toUpperCase(),
    data: conf.data,
    dataType: 'json'
  })
    .done(function (response) {
      if (conf.property) {
        response = response[conf.property]
      }

      if (conf.state) {
        var obj = {}
        obj[conf.state] = response
        this.setState(obj)
      } else {
        this.setState(response)
      }

      deferred.resolveWith(this)
    })
    .fail(function (err) {
      deferred.rejectWith(this, err)
    })

  return deferred.promise()
}

/**
 * Remove an object from an array in the state.
 * @method
 * @api public
 * @param {String} state property
 * @param {*} object you want to remove
 */

fn.removeFromState = function (prop, obj) {
  var state = this.getState()[prop]
  var index = state.indexOf(obj)
  if (index === -1) return
  state.splice(index, 1)
  var newState = {}
  newState[prop] = state
  this.setState(newState)
}

/**
 * Insert a new item into an array from the state.
 * @method
 * @api public
 * @param {String} state property
 * @param {*} item
 */

fn.insertIntoState = function (prop, item) {
  var state = this.getState()[prop]
  state.push(item)
  var newState = {}
  newState[prop] = state
  this.setState()
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
    var source = $el.prop('outerHTML')
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
  var self = this
  var url = this._options.templateUrl
  var deferred = $.Deferred()

  if (cache[url]) {
    deferred.resolve(cache[url])
  } else {
    $.get(url)
      .done(function (response) {
        cache[url] = response
        self.$el.html(response)
        response = self.$el.prop('outerHTML')
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

  // Clear events
  $.each(this._directiveEvents, function (index, event) {
    var selector = '[data-view-event-listener="' + index + '"]'
    $el
      .filter(selector)
      .add($el.find(selector))
      .off(event.type)
  })

  this._directiveEvents = []

  var html = template.parse(currentState, this)
  var $newEl = $(html)

  $el.replaceWith($newEl)

  this.$el = $el = $newEl

  // Bind events
  $.each(this._directiveEvents, function (index, event) {
    var selector = '[data-view-event-listener="' + index + '"]'
    $el
      .filter(selector)
      .add($el.find(selector))
      .on(event.type, event.callback)
  })

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

  if (this._options.events) {
    this.on('before render', this._clearEvents)
    this.on('after render', this._bindEvents)
  }

  if (this.init) this.init()
  this._render()
  this.emit('ready', this.$el)
}

/**
 * Walk through events hash and triggers a callback.
 * @method
 * @params {Function} cb
 * @api private
 */

fn._walkEventsHash = function (cb) {
  var self = this

  $.each(this._options.events, function (eventName, eventListener) {
    eventName = eventName.split(/\s+/)
    var listeners = eventName[0].split(',')
    var selectors = eventName[1] ? eventName[1].split(',') : ['']

    $.each(selectors, function (index, selector) {
      $.each(listeners, function (index, listener) {
        cb.call(self, selector, listener, eventListener)
      })
    })
  })
}

/**
 * Clear events before rendering.
 * @method
 * @api private
 */

fn._clearEvents = function () {
  this._walkEventsHash(function (selector, listener, eventListener) {
    this.$el.find(selector).off(listener)
  })
}

/**
 * Bind events after rendering.
 * @method
 * @api private
 */

fn._bindEvents = function () {
  var self = this
  this._walkEventsHash(function (selector, listener, eventListener) {
    var $target = selector
     ? this.$el.find(selector)
     : this.$el

    $target.on(listener, function (event) {
      eventListener = $.isFunction(eventListener)
        ? eventListener
        : self[eventListener]
      eventListener.call(self, $(this), event)
    })
  })
}
