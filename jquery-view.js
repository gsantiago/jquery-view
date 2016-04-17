/**
 * Define the `View` class as a jQuery plugin.
 */

var $ = require('jquery')
var View = require('./src/View')
var Template = require('./src/Template')

$.fn.view = function (options) {
  if (!this.length) return

  if (this.length > 1) {
    var views = []

    this.each(function () {
      views.push($.fn.view.call($(this), options))
    })

    return views
  }

  var view = new View(this, options)
  this.data('view', view)
  return view
}

$.fn.view.Template = Template

/**
 * Expose `View`.
 */

module.exports = View
