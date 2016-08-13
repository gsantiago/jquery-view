/**
 * Module dependencies.
 */

var $ = require('jquery')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var Template = require('./Template')
var utils = require('./utils')
var morphdom = require('morphdom')

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
  data: {},
  template: '',
  templateUrl: '',
  beforeRender: $.noop,
  afterRender: $.noop,
  ready: $.noop,
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
  this.transclusion = $el.html()
  this._options = $.extend({}, View.defaults, options)
  this._data = {}

  $.each(this._options, function (key, option) {
    if (Object.keys(View.defaults).indexOf(key) !== -1) return
    self[key] = option
  })

  this.props = $.extend({}, this._options.props, utils.getProps($el))
  this._directiveEvents = []

  $.when(this._getTemplate(), this._getInitialData())
    .done(function (template, data) {
      $.extend(self._data, data)
      self._templateSource = template
      self._template = new Template(template)
      self.emit('template loaded')
      self._start()
    })
    .fail(function (err) {
      console.error(err)
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
 * Get the initial data.
 * @method
 * @api private
 */

fn._getInitialData = function () {
  var data = this._options.data
  data = $.isFunction(data)
    ? data.call(this)
    : data

  if (data.promise) {
    var deferred = $.Deferred()

    data.done(function (response) {
      deferred.resolve(response)
    }).fail(deferred.reject)

    return deferred.promise()
  }

  return data
}

/**
 * Set data.
 * @method
 * @param {String} keypath
 * @param {*} value
 */

fn.set = function (keypath, value) {
  var pointer = this._data
  var props = keypath.split('.')
  var prop = ''

  while (props.length > 1) {
    prop = props.shift()
    if ($.isPlainObject(pointer[prop])) {
      pointer = pointer[prop]
    }
  }

  prop = props[0]

  var match = prop.match(/^(.*)+\[\]$/i)

  if (match) {
    pointer[match[1]].push(utils.resolve(value, pointer[match[1]]))
  } else {
    pointer[prop] = utils.resolve(value, pointer[prop])
  }

  this.emit('data change')

  return this
}

/**
 * Get data.
 * If no keypath is passed, then return the whole data.
 * @method
 * @param {String} keypath
 * @returns {*} value
 */

fn.get = function (keypath) {
  if (!keypath) return this._data

  var pointer = this._data
  var props = keypath.split('.')
  var prop = ''

  while (props.length > 1) {
    prop = props.shift()
    if ($.isPlainObject(pointer[prop])) {
      pointer = pointer[prop]
    }
  }

  prop = props[0]

  return pointer[prop]
}

/**
 * Extends the current data.
 * @method
 * @param {Object} obj
 */

fn.extend = function (obj) {
  $.extend(this._data, obj)
  this.emit('data change')
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
    deferred.resolve($el.html(options.template).prop('outerHTML'))
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
  var data = this.get()
  var template = this._template

  this.emit('before render', $el, data)

  // Clear events
  $.each(this._directiveEvents, function (index, event) {
    var selector = '[data-view-event-listener="' + index + '"]'
    $el
      .filter(selector)
      .add($el.find(selector))
      .off(event.type)
  })

  this._directiveEvents = []

  var html = template.parse(data, this)

  morphdom($el[0], html, {
    onBeforeElUpdated: function (fromEl, toEl) {
      if (toEl.tagName === 'INPUT') {
        toEl.value = fromEl.value
      }
    }
  })

  // Bind events
  $.each(this._directiveEvents, function (index, event) {
    var selector = '[data-view-event-listener="' + index + '"]'
    $el
      .filter(selector)
      .add($el.find(selector))
      .on(event.type, event.callback)
  })

  this.emit('after render', $el, data)
}

/**
 * Start method.
 * It runs once and also call the custom `init` method.
 * @method
 * @api private
 * @emits `ready`
 */

fn._start = function () {
  this.on('data change', this._render)
  this.on('before render', this._options.beforeRender)
  this.on('after render', this._options.afterRender)

  this._render()
  this._options.ready.call(this, this.$el)
}
