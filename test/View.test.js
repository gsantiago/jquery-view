/*global expect*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var View = require('../src/View')

describe('View#constructor', function () {

  it('should support a jQuery element', function () {
    var $el = $('<div>')
    var view = new View($el)
    expect($el).toEqual(view.$el)
  })

  it('should support initial state', function () {
    var state = {
      name: 'Guilherme',
      age: 20
    }

    var view = new View($('<div>'), {
      state: state
    })

    expect(view._state).toEqual(state)
  })

  it('should support initial state as a function', function () {
    var state = {a: 1, b: 2}
    var view = new View($('<div>'), {
      state: function () {
        return state
      }
    })

    expect(view._state).toEqual(state)
  })

})

describe('View#getState', function () {
  it('should return current state', function () {
    var state = {a: 1, b: 2}
    var view = new View($('<div>'), {
      state: state
    })

    expect(view.getState()).toEqual(view._state)
    expect(view._state).toEqual(state)
  })
})

describe('View#setState', function () {

  it('should set current state', function () {
    var state = {a: 20, b: 30}
    var view = new View($('<div>'), {
      state: function () {
        return state
      }
    })
    view.setState({c: 40})
    expect(view.getState()).toEqual({a: 20, b: 30, c: 40})
  })

  it('should fire `state change` event', function (done) {
    var view = new View($('<div>'))
    view.on('state change', function (newState) {
      expect(newState).toEqual({name: 'Guilherme Santiago'})
      expect(view.getState()).toEqual({name: 'Guilherme Santiago'})
      done()
    })
    view.setState({name: 'Guilherme Santiago'})
  })

})