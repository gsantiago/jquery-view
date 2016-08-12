/*global expect*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var utils = require('../src/utils')

describe('utils#getProps', function () {

  it('should return the props as camelCase', function () {
    var $el = $('<div name="peter" last-name="parker" data-toggle-class="hey" />')
    var props = utils.getProps($el)
    var expectedProps = {
      name: 'peter',
      lastName: 'parker',
      dataToggleClass: 'hey'
    }
    expect(props).toEqual(expectedProps)
  })

})

describe('utils#kebabCase', function () {

  it('should dashify the string', function () {
    expect(utils.kebabCase('helloWorld')).toEqual('hello-world')
    expect(utils.kebabCase('myBeautifulClassName')).toEqual('my-beautiful-class-name')
  })

})

describe('utils#escape', function () {

  it('should escape string', function () {
    var expected = 'You &amp; I aren&#x27;t &lt;&quot;GREAT&quot;&gt;'
    var str = 'You & I aren\'t <"GREAT">'
    expect(utils.escape(str)).toEqual(expected)
  })

})

describe('utils#resolve', function () {

  it('should return the original value passed', function () {
    expect(utils.resolve('string')).toEqual('string')
    expect(utils.resolve(100)).toEqual(100)
    expect(utils.resolve({a: 1})).toEqual({a: 1})
  })

  it('should return the value from the function', function () {
    var value1 = utils.resolve(function () {
      return 'test'
    })

    var value2 = utils.resolve(function (name) {
      return name.toUpperCase()
    }, 'peter')

    var value3 = utils.resolve(function (a, b) {
      return a + b
    }, 10, 20)

    expect(value1).toEqual('test')
    expect(value2).toEqual('PETER')
    expect(value3).toEqual(30)
  })

})
