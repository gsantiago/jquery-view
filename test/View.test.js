/*global expect, jasmine*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var View = require('../src/View')
require('jasmine-ajax')

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

  it('should implement custom methods', function (done) {
    var view = new View($('<div>'), {
      state: {a: 100},
      templateUrl: '',
      init: function () {
        return this
      },
      finish: function () {
        done()
      }
    })

    expect(view.state).toBeUndefined()
    expect(view.template).toBeUndefined()
    expect(view.templateUrl).toBeUndefined()
    expect($.isFunction(view.init)).toBeTruthy()

    view.finish()
  })

  it('should support template from element\'s html', function () {
    var source = '<div>Hello, {{ str }}!</div>'
    var $el = $(source)
    var view = new View($el, {
      state: {str: 'Earth'}
    })

    expect(view._templateSource).toEqual(source)
    expect(view.$el.html()).toEqual('Hello, Earth!')
  })

  it('should support a template option', function () {
    var tpl = '<p>{{ content }}</p>'
    var view = new View($('<div>Hey</div>'), {
      template: tpl,
      state: {content: 'My Beautiful Content!'}
    })

    expect(view._templateSource).toEqual(tpl)
    expect(view.$el.prop('outerHTML')).toEqual('<p>My Beautiful Content!</p>')
  })

  it('should support external templates', function (done) {
    jasmine.Ajax.install()

    var tpl = '<p>Welcome, <strong :bind="name"></strong></p>'
    var expected = '<div><p>Welcome, <strong>Guilherme</strong></p></div>'

    jasmine.Ajax.stubRequest('/templates/my-element.html').andReturn({
      responseText: tpl,
      statusCode: 200,
      contentType: 'text/html'
    })

    var view = new View($('<div>'), {
      state: {name: 'Guilherme'},
      templateUrl: '/templates/my-element.html',
      init: function () {
        expect(this._templateSource).toEqual('<div><p>Welcome, <strong :bind="name"></strong></p></div>')
        this.on('ready', function ($el) {
          expect($el.prop('outerHTML')).toEqual(expected)
          done()
        })
      }
    })

    jasmine.Ajax.uninstall()
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

describe('View rendering', function () {

  it('should trigger `before render` and `after render` callbacks', function (done) {
    var beforeRenderSpy = jasmine.createSpy()
    var afterRenderSpy = jasmine.createSpy()

    var view = new View($('<div>'), {
      beforeRender: function () {
        beforeRenderSpy()
      },
      afterRender: function () {
        afterRenderSpy()
      },
      init: function () {
        this.on('ready', function () {
          expect(beforeRenderSpy.calls.count()).toEqual(1)
          expect(afterRenderSpy.calls.count()).toEqual(1)
          this.setState({a: 1})
          expect(beforeRenderSpy.calls.count()).toEqual(2)
          expect(afterRenderSpy.calls.count()).toEqual(2)
          done()
        })
      }
    })
  })

  it('should update DOM when state changes', function (done) {
    var view = new View($('<div>{{ msg }}</div>'), {
      state: {msg: 'a'},
      init: function () {
        this.on('ready', function () {
          expect(this.$el.html()).toEqual('a')
          this.setState({msg: 'b'})
          expect(this.$el.html()).toEqual('b')
          done()
        })
      }
    })
  })

})