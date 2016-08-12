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
  state: {},
  data: {},
  template: '',
  templateUrl: '',
  beforeRender: $.noop,
  afterRender: $.noop,
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
  this._state = {}
  this._data = {}

  $.each(this._options, function (key, option) {
    if (Object.keys(View.defaults).indexOf(key) !== -1) return
    self[key] = option
  })

  this.props = $.extend({}, this._options.props, utils.getProps($el))
  this._directiveEvents = []

  $.when(this._getInitialState(), this._getTemplate(), this._getInitialData())
    .done(function (state, template, data) {
      $.extend(self._state, state)
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
 * Get the initial state.
 * @method
 * @api private
 */

fn._getInitialState = function () {
  var state = this._options.state
  state = $.isFunction(state)
    ? state.call(this)
    : state

  if (state.promise) {
    var deferred = $.Deferred()

    state.done(function (response) {
      deferred.resolve(response)
    }).fail(deferred.reject)

    return deferred.promise()
  }

  return state
}

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
 * Return the current state.
 * @method
 * @api public
 * @returns {Object} state
 */

fn.getState = function (obj) {
  return this._state
}

/**
 * Return the current data.
 * @method
 * @api public
 * @returns {Object} data
 */

fn.getData = function () {
  return this._data
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

  return this
}

/**
 * Set the current state.
 * @method
 * @api public
 * @emits `state change`
 */

fn.setState = function () {
  if (arguments.length === 1) {
    this._state = $.extend(this._state, arguments[0])
  } else {
    this._state[arguments[0]] = arguments[1]
  }

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
        this.setState(conf.state, response)
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
  this.setState(prop, state)
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
  this.setState(prop, state)
}

/**
 * Extends an item from the state.
 * @method
 * @api public
 * @param {String} state property
 * @param {Object} item
 * @param {Object} obj
 */

fn.extendStateItem = function (prop, item, obj) {
  var state = this.getState()[prop]
  var index = state.indexOf(item)
  if (index === -1) return
  state.splice(index, 1, $.extend({}, item, obj))
  this.setState(prop, state)
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
