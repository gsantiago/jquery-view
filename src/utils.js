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
