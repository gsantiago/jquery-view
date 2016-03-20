/**
 * Module dependencies.
 */

var $ = require('jquery')
var utils = require('./utils')
var directives = require('./directives')

/**
 * Expose `Template`.
 */

module.exports = Template

/**
 * Default directives.
 */

Template.directives = directives

/**
 * Template constructor.
 * @constructor
 * @param {String} source
 */

function Template (source) {
  source = source || ''
  this.source = source.trim()
  this.context = {}
  this.vars = {}
  this.Template = Template
}

/**
 * Alias for `Template.prototype`.
 */

var fn = Template.prototype

/**
 * Set the current source.
 * @method
 * @param {String} source
 */

fn.setSource = function (source) {
  this.source = source.trim()
}

/**
 * Parse the source with the given object.
 * @method
 * @param {Object} vars
 * @param {Object} context
 */

fn.parse = function (vars, context) {
  if (vars) this.vars = vars
  if (context) this.context = context

  var self = this
  var $source = $($.parseHTML(this.source))
  var $holder = $('<div>')

  $source.appendTo($holder)

  $holder.find('*').each(function () {
    var $this = $(this)
    if (!$this.parents().last().is($holder)) return
    self.applyDirectives($this)
  })

  return this.supplant($holder.html()).replace(/^\s*[\r\n]/gm, '')
}

/**
 * Compile a JS expression.
 * @method
 * @param {Object} context
 */

fn.compile = function (expr, context) {
  context = context || this.context
  var vars = this.vars
  var keys = Object.keys(vars)
  var values = $.map(vars, function (val, key) {
    if ($.isArray(val)) return [val]
    return val
  })
  var fn = new Function(keys, 'return ' + expr) // eslint-disable-line
  var ret = ''

  try {
    ret = fn.apply(context, values)
  } catch (e) {
    console.error('Compile error:', e)
  }

  return ret
}

/**
 * Supplant expressions.
 * @method
 * @param {String} str
 */

fn.supplant = function (str) {
  var self = this

  var fn = function (a, b) {
    return self.compile(b)
  }

  var result = str.replace(/{{([^{}]*)}}/g, function (a, b) {
    return utils.escape(fn(a, b))
  })

  result = result.replace(/{%([^{%}]*)%}/g, fn)

  return result
}

/**
 * Apply directives in the element.
 * @method
 * @param {jQuery Element}
 */

fn.applyDirectives = function ($el) {
  var self = this
  var props = utils.getProps($el)
  var directives = Object.keys(Template.directives)

  $.each(props, function (key, val) {
    if (/^:.*/.test(key) && directives.indexOf(key.replace(':', '')) !== -1) {
      Template.directives[key.replace(':', '')].call(self, $el, val, props)
      $el.removeAttr(key)
    }
  })
}

/**
 * Static method to add custom directives.
 * @static
 * @param {String} name
 * @param {Function} fn
 */

Template.addDirective = function (name, fn) {
  Template.directives[name] = fn
}
