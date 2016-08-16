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
