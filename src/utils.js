/**
 * Module dependencies.
 */

var $ = require('jquery')

/**
 * Get all attributes from an element. The attribute's name is converted to
 * camelCase.
 * @param {jQuery Element} $el
 */

exports.getProps = function ($el) {
  var props = {}

  $.each($el[0].attributes, function (key, attr) {
    props[$.camelCase(attr.name)] = attr.value
  })

  return props
}

/**
 * Return the string as kebab-case.
 * https://github.com/joakimbeng/kebab-case/blob/master/index.js
 * @param {String} str
 */

exports.kebabCase = function (str) {
  var KEBAB_REGEX = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g
  return str.replace(KEBAB_REGEX, function (match) {
    return '-' + match.toLowerCase()
  })
}

/**
 * Escapes a string for insertion into HTML,
 * replacing &, <, >, ", `, and ' characters.
 * @param {String} str
 */

exports.escape = function (str) {
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '/': '&#x2F;'
  }

  return String(str).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s]
  })
}

/**
 * Resolves a value if is a function or return the object passed itself.
 * @param {Function | *} obj
 * @param {*} optional argument for the function
 */

exports.resolve = function () {
  var args = $.makeArray(arguments)
  var obj = args.shift()

  if ($.isFunction(obj)) {
    return obj.apply(null, args)
  }

  return obj
}
