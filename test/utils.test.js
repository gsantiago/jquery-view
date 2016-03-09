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
