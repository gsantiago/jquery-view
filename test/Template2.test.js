/*global expect*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var Template = require('../src/Template2')
var fs = require('fs')
var utils = require('../src/utils')

/**
 * Template methods.
 */

describe('Template#constructor', function () {
  it('should accept the source as the first argument', function () {
    var source = '<span>my source</span>'
    var template = new Template(source)
    expect(template.source).toEqual(source)
  })

  it('should accept options as the second argument', function () {
    var source = '<div>test</div>'
    var options = {
      delimiters: ['${', '}']
    }
    var template = new Template(source, options)
    expect(template.options).toEqual($.extend({}, Template.defaults, options))
  })
})

describe('Template#evaluate', function () {
  it('should return 4', function () {
    expect(Template.evaluate('2 + 2')).toEqual(4)
    expect(Template.evaluate('2 * 2')).toEqual(4)
  })

  it('should return 10', function () {
    expect(Template.evaluate('((10 / 2) * 3) - 5')).toEqual(10)
  })

  it('should concatenate strings', function () {
    var result = Template.evaluate('"Hello, " + "World!"')
    expect(result).toEqual('Hello, World!')
  })

  it('should replace the variables', function () {
    var result = Template.evaluate('name + " " + lastname', {
      name: 'Peter',
      lastname: 'Parker'
    })

    expect(result).toEqual('Peter Parker')
  })

  it('should return an array', function () {
    var expected = ['html', 'js', ['css', ['stylus', 'sass', 'less']]]
    var result = Template.evaluate('["html", "js", ["css", ["stylus", "sass", "less"]]]')
    expect(result).toEqual(expected)
  })

  it('should return an object', function () {
    var expected = {
      name: 'object name',
      size: {
        width: 20,
        height: 20
      }
    }

    var result = Template.evaluate('{name: "object name", size: {width: 20, height: 20}}')
    expect(result).toEqual(expected)
  })

  it('should support custom context', function () {
    var context = {
      sum: function (a, b) {
        return a + b
      }
    }

    var result = Template.evaluate('this.sum(a, b)', {a: 10, b: 15}, context)
    expect(result).toEqual(25)
  })
})

describe('Template#supplant', function () {
  beforeEach(function () {
    this.template = new Template()
  })

  it('should return 8', function () {
    var result = this.template.supplant('{{ 4 * 2 }}')
    expect(result).toEqual('8')
  })

  it('should return the full name', function () {
    var result = this.template.supplant('The full name is {{name}} {{lastname}}', {
      name: 'Peter',
      lastname: 'Parker'
    })

    expect(result).toEqual('The full name is Peter Parker')
  })

  it('should escape strings by default', function () {
    var str = 'You & I aren\'t <"GREAT">'
    var expected = 'You &amp; I aren&#x27;t &lt;&quot;GREAT&quot;&gt;'
    var result = this.template.supplant('{{str}}', {str: str})
    expect(result).toEqual(expected)
  })

  it('should unescape strings with special delimiters', function () {
    var str = 'You & I aren\'t <"GREAT">'
    var expected = str
    var result = this.template.supplant('{{{ str }}}', {str: str})
    expect(result).toEqual(expected)
  })

  it('should call a function', function (done) {
    this.template.supplant('{{ func() }}', {
      func: function () {
        done()
      }
    })
  })
})

describe('Template#render', function () {
  it('should return a node', function () {
    var expected = $('<span>My node</span>')[0]
    var template = new Template('<span>{{msg}}</span>')
    var result = template.render({msg: 'My node'})
    expect(result).toEqual(expected)
  })

  it('should return a node with children', function () {
    var str = '' +
    '<div>' +
      '<span>{{ id }}</span>' +
      '<strong>{{ name }}</strong>' +
    '</div>'

    var expected = Template.prototype.supplant.call({}, str, {
      id: 100,
      name: 'John'
    })

    expected = $(expected)[0]

    var template = new Template(str)
    var result = template.render({
      id: 100,
      name: 'John'
    })

    expect(result).toEqual(expected)
  })

  it('should set the attributes value', function () {
    var str = '' +
      '<div id="id-{{ index }}" class="{{ class_name }}">' +
        '<input type="{{ input_type }}" value="{{ value }}">' +
      '</div>'

    var opts = {
      index: 5,
      class_name: 'alert-box',
      input_type: 'hidden',
      value: 'input value'
    }

    var expected = Template.prototype.supplant.call({}, str, opts)
    expected = $(expected)[0]

    var template = new Template(str)
    var result = template.render(opts)

    expect(result).toEqual(expected)
  })
})
