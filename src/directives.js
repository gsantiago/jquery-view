/**
 * Module dependencies.
 */

var $ = require('jquery')
var utils = require('./utils')

/**
 * Expose `directives`.
 */

var directives = module.exports = {}

/**
 * Basic directives.
 */

$.extend(directives, {
  bind: function ($el, value, props) {
    $el.text(this.compile(value))
  },

  show: function ($el, value, props) {
    if (!this.compile(value)) $el.remove()
  },

  hide: function ($el, value, props) {
    if (this.compile(value)) $el.remove()
  },

  'class': function ($el, value, props) {
    $.each(this.compile(value), function (className, expr) {
      if (expr) {
        $el.addClass(utils.kebabCase(className))
      } else {
        $el.removeClass(className)
      }
    })
  },

  style: function ($el, value, props) {
    $el.css(this.compile(value))
  }
})

/**
 * Repeat directive.
 */

directives.repeat = function ($el, value, props) {
  var self = this
  var Template = this.Template

  var match = value.match(/(.*)\S*in\S*(.*)/)
  if (!match) throw new Error('Invalid Syntax for :repeat')

  var needle = match[1].trim()
  var haystack = this.compile(match[2].trim())

  // Make sure the haystack is a collection
  if (!($.isArray(haystack) || $.isPlainObject(haystack))) {
    throw new Error('Haystack `' + match[2].trim() + '` must be a collection')
  }

  // Make sure the haystack has at least one value
  var total = $.isArray(haystack)
    ? haystack.length
    : Object.keys(haystack).length

  if (!total) return $el.remove()

  // Start the loop
  $el.removeAttr(':repeat')

  var template = new Template()
  var $collection = $('<div>')
  var counter = 0

  $.each(haystack, function (key, val) {
    template.setSource($el.prop('outerHTML'))
    template.context = self.context

    template.vars = $.extend(template.vars, self.vars, {
      $index: counter,
      $key: key,
      $total: total,
      $first: counter === 0,
      $last: counter === total - 1,
      $even: counter % 2 === 0,
      $odd: !(counter % 2 === 0),
      $middle: counter > 0 && counter < (total - 1)
    })

    template.vars[needle] = val

    $collection.append(template.parse())

    counter += 1
  })

  $el.replaceWith($collection.html())
  $el.data('removed', true)
}

/**
 * Directives that set its attribute if the given expression is truthy.
 */

$.each(['selected', 'checked', 'disabled'], function (index, dir) {
  directives[dir] = function ($el, value, props) {
    if (this.compile(value)) {
      $el.attr(dir, true)
    } else {
      $el.removeAttr(dir)
    }
  }
})

/**
 * Directives that replace the attribute values by the expression given.
 */

$.each(['href', 'src', 'value', 'title', 'alt'], function (index, dir) {
  directives[dir] = function ($el, value, props) {
    $el.attr(dir, this.compile(value))
  }
})
