/*global expect, jasmine*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var View = require('../src/View')
var fs = require('fs')
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

  it('should get element\'s props', function () {
    var $el = $('<user name="Guilherme" last-name="Santiago">{{this.props.name}} {{this.props.lastName}}</user>')
    var expected = '<user name="Guilherme" last-name="Santiago">Guilherme Santiago</user>'
    var view = new View($el, {

    })
    expect(view.$el[0]).toEqual($(expected)[0])
    expect(view.props).toEqual({
      name: 'Guilherme',
      lastName: 'Santiago'
    })
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

describe('View#setStateFromAjax', function () {
  var usersResponse = {users: ['John', 'Peter', 'Luke', 'Mark']}
  var skillsResponse = ['html', 'css', 'js']

  beforeEach(function () {
    jasmine.Ajax.uninstall()
    jasmine.Ajax.install()

    jasmine.Ajax.stubRequest('/api/users').andReturn({
      responseText: JSON.stringify(usersResponse),
      statusCode: 200,
      contentType: 'text/html'
    })

    jasmine.Ajax.stubRequest('/api/skills').andReturn({
      responseText: JSON.stringify(skillsResponse),
      statusCode: 200,
      contentType: 'text/html'
    })

    jasmine.Ajax.stubRequest('/api/users/guilherme').andReturn({
      responseText: JSON.stringify({name: 'Guilherme', lastName: 'Santiago', age: 20}),
      statusCode: 200,
      contentType: 'text/html'
    })
  })

  afterEach(function () {
    jasmine.Ajax.uninstall()
  })

  it('should set the whole state', function (done) {
    var view = new View($('<div>'), {
      state: {users: []}
    })

    view.setStateFromAjax({
      url: '/api/users'
    })
      .done(function () {
        expect(this.getState()).toEqual(usersResponse)
        done()
      })
  })

  it('should only set the skills state', function (done) {
    var view = new View($('<div>'), {
      state: {name: 'William', skills: []}
    })

    view.setStateFromAjax({
      url: '/api/skills',
      state: 'skills'
    })
      .done(function () {
        expect(this.getState()).toEqual({name: 'William', skills: skillsResponse})
        done()
      })
  })

  it('should only set the `lastName` skill', function (done) {
    var view = new View($('<div>'), {
      state: {name: 'Guilherme', lastName: ''}
    })

    view.setStateFromAjax({
      url: '/api/users/guilherme',
      state: 'lastName',
      property: 'lastName'
    })
      .done(function () {
        expect(this.getState()).toEqual({name: 'Guilherme', lastName: 'Santiago'})
        done()
      })
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

describe('View events', function () {

  it('should add listeners to elements with event hash', function (done) {
    var source = fs.readFileSync(__dirname + '/fixtures/views/view-events-hash.html', 'utf8')
    var $div = $(source)

    var editSpy = jasmine.createSpy()
    var changeSpy = jasmine.createSpy()

    var view = new View($div, {
      events: {
        'submit': 'submitHandler',
        'click,dblclick .js-edit': 'editHandler',
        'change [name="my-input"]': 'changeHandler'
      },

      submitHandler: function ($el, event) {
        event.preventDefault()
        done()
      },

      editHandler: function ($el, event) {
        editSpy()
      },

      changeHandler: function ($el, event) {
        changeSpy()
      }
    })

    view.$el.find('.js-edit').trigger('click').trigger('dblclick')
    expect(editSpy.calls.count()).toEqual(2)

    view.$el.find('[name="my-input"]').trigger('change')
    expect(changeSpy.calls.count()).toEqual(1)

    view.$el.trigger('submit')
  })

  it('should add event listeners with directives', function (done) {
    var source = fs.readFileSync(__dirname + '/fixtures/views/view-events-directive.html', 'utf8')
    var $div = $(source).appendTo('body')

    var changeHandlerSpy = jasmine.createSpy()
    var clickHandlerSpy = jasmine.createSpy()
    var submitHandlerSpy = jasmine.createSpy()

    var view = new View($div, {
      submitHandler: function (e) {
        e.preventDefault()
        submitHandlerSpy()
      },

      changeHandler: function ($target) {
        expect($target.is(this.$el.find('input'))).toBeTruthy()
        changeHandlerSpy()
      },

      clickHandler: function () {
        clickHandlerSpy()
      }
    })

    setTimeout(function () {
      view.$el.find('input').trigger('change').trigger('change')
      expect(changeHandlerSpy.calls.count()).toEqual(2)

      view.$el.find('a').click()
      expect(clickHandlerSpy).toHaveBeenCalled()

      view.$el.trigger('submit')
      expect(submitHandlerSpy).toHaveBeenCalled()

      done()
    }, 500)

  })

})
