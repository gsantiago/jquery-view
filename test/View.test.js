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

  it('should support initial data', function () {
    var data = {
      name: 'Guilherme',
      age: 21
    }

    var view = new View($('<div>'), {
      data: data
    })

    expect(view._data).toEqual(data)
  })

  it('should support initial data as a function', function () {
    var data = {a: 1, b: 2}
    var $el = $('<div>')
    var view = new View($el, {
      data: function () {
        expect(this.$el[0]).toEqual($el[0])
        return data
      }
    })

    expect(view._data).toEqual(data)
  })

  it('should support initial data as a promise', function (done) {
    jasmine.Ajax.install()

    var data = {countries: ['Brazil', 'Argentina', 'Mexico', 'Chile']}

    jasmine.Ajax.stubRequest('/api/countries').andReturn({
      responseText: JSON.stringify(data),
      statusCode: 200,
      contentType: 'application/json'
    })

    var view = new View($('<div>'), {
      data: function () {
        return $.get('/api/countries')
      },
      init: function () {
        expect(this.get()).toEqual(data)
        jasmine.Ajax.uninstall()
        done()
      }
    })
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

    expect(view._templateSource).toEqual('<div><p>{{ content }}</p></div>')
    expect(view.$el.prop('outerHTML')).toEqual('<div><p>My Beautiful Content!</p></div>')
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
          jasmine.Ajax.uninstall()
          done()
        })
      }
    })
  })

  it('should get element\'s props', function () {
    var $el = $('<user name="Guilherme" last-name="Santiago">{{this.props.name}} {{this.props.lastName}}</user>')
    var expected = '<user name="Guilherme" last-name="Santiago">Guilherme Santiago</user>'
    var view = new View($el, {
      props: {
        defaultValueTest: 'this is the default value for this prop'
      }
    })
    expect(view.$el[0]).toEqual($(expected)[0])
    expect(view.props).toEqual({
      name: 'Guilherme',
      lastName: 'Santiago',
      defaultValueTest: 'this is the default value for this prop'
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

describe('View#set', function () {

  it('should set a new property', function () {
    var data = {a: 20, b: 30}
    var view = new View($('<div>'), {
      data: function () {
        return data
      }
    })

    view.set('c', 40)
    expect(view.get()).toEqual({a: 20, b: 30, c: 40})
  })

  it('should set an existing property', function () {
    var data = {a: 1, b: 2, c: 3}
    var view = new View($('<div>'), {
      data: data
    })

    view.set('c', 'new value for C')
    expect(view.get()).toEqual({
      a: 1,
      b: 2,
      c: 'new value for C'
    })
  })

  it('should set a property from keypath', function () {
    var data = {
      name: 'David',
      skills: {js: 'jquery'}
    }
    var view = new View($('<div>'), {
      data: data
    })

    view.set('skills.js', 'vanilla')

    expect(view.get()).toEqual({
      name: 'David',
      skills: {js: 'vanilla'}
    })
  })

  it('should support function as value', function () {
    var view = new View($('<div>'), {
      data: {
        a: 'value',
        sub: {
          prop: {test: 'value for test'}
        }
      }
    })

    view.set('a', function (value) {
      return value.toUpperCase()
    })

    view.set('sub.prop.test', function (value) {
      return value + ', cool!'
    })

    expect(view.get()).toEqual({
      a: 'VALUE',
      sub: {
        prop: {test: 'value for test, cool!'}
      }
    })
  })

  it('should support array pushing', function () {
    var view = new View($('<div>'), {
      data: {
        skills: {
          frontend: ['html'],
          backend: []
        }
      }
    })

    view.set('skills.frontend[]', 'css')
    view.set('skills.backend[]', 'php')
    view.set('skills.backend[]', function (array) {
      expect(array).toEqual(['php'])
      return 'java'
    })

    expect(view.get()).toEqual({
      skills: {
        frontend: ['html', 'css'],
        backend: ['php', 'java']
      }
    })
  })

})

describe('View#get', function () {
  var view = new View($('<div>'), {
    data: {
      a: 1,
      b: {
        c: {
          d: [0,1,2,3]
        }
      },
      e: 'string'
    }
  })

  it('should return the specific value from keypath', function () {
    expect(view.get('a')).toEqual(1)
    expect(view.get('b.c.d')).toEqual([0,1,2,3])
    expect(view.get('e')).toEqual('string')
  })

  it('should return the whole data', function () {
    expect(view.get()).toEqual({
      a: 1,
      b: {
        c: {
          d: [0,1,2,3]
        }
      },
      e: 'string'
    })
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

    view.setState('a', 25)
    expect(view.getState()).toEqual({a: 25, b: 30, c: 40})

    view.setState('d', 100)
    expect(view.getState()).toEqual({a: 25, b: 30, c: 40, d: 100})
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

describe('View#removeFromState', function () {

  it('should remove user from the state', function () {
    var view = new View($('<div>'), {
      state: {users: ['John', 'Peter', 'Luke']}
    })

    view.removeFromState('users', 'Luke')

    expect(view.getState()).toEqual({
      users: ['John', 'Peter']
    })
  })

  it('should remove an object from the state', function () {
    var users = [
      {name: 'Luke', email: 'luke@email.com'},
      {name: 'John', email: 'john@email.com'},
      {name: 'Jack', email: 'jack@email.com'}
    ]

    var view = new View($('<div>'), {
      state: {users: users}
    })

    // Remove the user John from the object
    view.removeFromState('users', users[1])

    expect(view.getState().users).toEqual([
      {name: 'Luke', email: 'luke@email.com'},
      {name: 'Jack', email: 'jack@email.com'}
    ])
  })

})

describe('View#insertIntoState', function () {
  it('should add a new item into the state', function () {
    var view = new View($('<div>'), {
      state: {
        users: []
      }
    })

    view.insertIntoState('users', 'Guilherme')
    view.insertIntoState('users', 'Henrik')

    expect(view.getState().users).toEqual(['Guilherme', 'Henrik'])
  })
})

describe('View#extendStateItem', function () {
  it('should update an item', function () {
    var fruits = [
      {name: 'Banana', count: 7},
      {name: 'Apple', count: 3},
      {name: 'Orange', count: 0}
    ]

    var view = new View($('<div>'), {
      state: {fruits: fruits}
    })

    view.extendStateItem('fruits', fruits[1], {count: 10})
    view.extendStateItem('fruits', fruits[2], {name: 'Super Orange', price: 5})

    expect(view.getState().fruits[1]).toEqual({name: 'Apple', count: 10})
    expect(view.getState().fruits[2]).toEqual({
      name: 'Super Orange',
      count: 0,
      price: 5
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

describe('View Transclusion', function () {
  it('should transclude elements', function () {
    var source = fs.readFileSync(__dirname + '/fixtures/views/transclusion.html', 'utf8')
    var expected = fs.readFileSync(__dirname + '/fixtures/views/transclusion.expected.html', 'utf8')
    var $el = $('<my-element label="Title">Please <span>{{name}}</span>, transclude me!</my-element>')

    var view = new View($el, {
      template: source,
      state: {name: 'Luke'}
    })

    expect(view.$el[0]).toEqual($(expected)[0])
    expect(view.$el.prop('outerHTML')).toEqual($(expected).prop('outerHTML'))
  })
})
