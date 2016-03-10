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
 * Default directives.
 */

Template.directives = {
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

  disabled: function ($el, value, props) {
    if (this.compile(value)) {
      $el.attr('disabled', true)
    } else {
      $el.removeAttr('disabled')
    }
  },

  selected: function ($el, value, props) {
    if (this.compile(value)) {
      $el.attr('selected', true)
    } else {
      $el.removeAttr('selected')
    }
  },

  checked: function ($el, value, props) {
    if (this.compile(value)) {
      $el.attr('checked', true)
    } else {
      $el.removeAttr('checked')
    }
  },

  href: function ($el, value, props) {
    $el.attr('href', this.compile(value))
  },

  style: function ($el, value, props) {
    $el.css(this.compile(value))
  },

  repeat: function ($el, value, props) {
    var self = this
    var match = value.match(/(.*)\S*in\S*(.*)/)
    var needle = match[1]
    var collection = this.compile(match[2])
    var $clone = $el.clone().removeAttr(':repeat')
    var $parent = $el.parent()
    var template = new Template()
    var oldReferences = {
      needle: self.context[needle],
      $index: self.context.$index,
      $key: self.context.$key
    }

    //$el.remove()
    var $holder = $('<div>')
    var counter = 0

    $.each(collection, function (key, val) {
      var $item = $clone.clone()
      var $itemHolder = $('<div>').append($item)
      self.context[needle] = val
      self.context.$index = counter
      self.context.$key = key
      template.setSource($itemHolder.html())
      template.context = self.context
      $itemHolder.html(template.parse())
      $item = $($itemHolder.html())
      //$item.html(template.parse())
      $item.appendTo($holder)
      counter += 1
    })

    $el.replaceWith($holder.html())

    self.context[needle] = oldReferences.needle
    self.context.$index = oldReferences.$index
    self.context.$key = oldReferences.$key
  }
}

/**
 * Template constructor.
 * @constructor
 * @param {String} source
 */

function Template (source) {
  source = source || ''
  this.source = source.trim()
  this.context = {}
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
 * @param {Object} obj
 */

fn.parse = function (obj) {
  if (obj) this.context = obj

  var self = this
  var $source = $($.parseHTML(this.source))
  var $holder = $('<div>')

  $source.appendTo($holder)

  $holder.find('*').each(function () {
    var $this = $(this)
    self.applyDirectives($this)
  })

  return this.supplant($holder.html())
}

/**
 * Compile a JS expression.
 * @method
 * @param {Object} additional context
 */

fn.compile = function (expr, obj) {
  var context = this.context
  var keys = Object.keys(context)
  var values = $.map(context, function (val, key) {
    if ($.isArray(val)) return [val]
    return val
  })
  var fn = new Function(keys, 'return ' + expr)
  var ret = ''

  try {
    ret = fn.apply(this, values)
  } catch (e) {
    console.error(e)
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
  var result = str.replace(
    /{{([^{}]*)}}/g,
      function (a, b) {
        var r = self.compile(b)
          return r
      }
    )
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
