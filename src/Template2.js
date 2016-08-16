/**
 * Module dependencies.
 */

var $ = require('jquery')
var utils = require('./utils')

/**
 * Expose `Template`.
 */

module.exports = Template

/**
 * Template.
 * @constructor
 * @param {String} source
 * @param {Object} options
 */

function Template (source, options) {
  this.source = source.trim()
  this.options = $.extend({}, Template.options, options)
}

/**
 * Alias for `Template.prototype`.
 */

var fn = Template.prototype

/**
 * Defaults.
 */

Template.defaults = {
  delimiters: ['{{', '}}']
}

/**
 * Evaluates an expression given.
 * @static
 * @param {String} expression
 * @param {Object} data
 * @param {Object} context
 * @return {*} expression's result
 */

Template.evaluate = function (expression, data, context) {
  data = data || {}
  context = context || {}

  var keys = Object.keys(data)
  var values = $.map(data, function (val, key) {
    if ($.isArray(val)) return [val]
    return val
  })

  var fn = new Function(keys, 'return ' + expression) // eslint-disable-line
  var ret = ''

  try {
    ret = fn.apply(context, values)
  } catch (e) {
    console.error('Compile error:', e)
  }

  return ret
}
