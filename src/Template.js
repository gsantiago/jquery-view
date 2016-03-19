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

  style: function ($el, value, props) {
    $el.css(this.compile(value))
  },

  repeat: function ($el, value, props) {
    var self = this

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

}

$.each(['selected', 'checked', 'disabled'], function (index, dir) {
  Template.directives[dir] = function ($el, value, props) {
    if (this.compile(value)) {
      $el.attr(dir, true)
    } else {
      $el.removeAttr(dir)
    }
  }
})

$.each(['href', 'src', 'value', 'title', 'alt'], function (index, dir) {
  Template.directives[dir] = function ($el, value, props) {
    $el.attr(dir, this.compile(value))
  }
})

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
