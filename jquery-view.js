/**
 * Define the `View` class as a jQuery plugin.
 */

var $ = require('jquery')
var View = require('./src/View')

$.fn.view = function (options) {
  var view = new View(this, options)
  this.data('view', view)
  return view
}

/**
 * Expose `View`.
 */

module.exports = View
