/*global expect*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var Template = require('../src/Template')
var fs = require('fs')

/**
 * Template methods.
 */

describe('The method', function () {

  describe('Template#compile', function () {

    beforeEach(function () {
      this.template = new Template()
    })

    it('should return 4', function () {
      var result = this.template.compile('2 + 2')
      expect(result).toEqual(4)
    })

    it('should return 10', function () {
      var result = this.template.compile('((10 / 2) * 3) - 5')
      expect(result).toEqual(10)
    })

    it('should concatenate strings', function () {
      var result = this.template.compile('"Hello, " + "World!"')
      expect(result).toEqual('Hello, World!')
    })

    it('should replace the `name` variable', function () {
      this.template.vars = {
        name: 'Guilherme'
      }

      var result = this.template.compile('"Your name is " + name')
      expect(result).toEqual('Your name is Guilherme')
    })

    it('should solve operations and concatenations', function () {
      this.template.vars = {
        name: 'Guilherme',
        lastname: 'Santiago',
        age: 20
      }

      var result = this.template.compile('name + " " + lastname + " is " + (age + 1) + " years old"')
      var expected = 'Guilherme Santiago is 21 years old'
      expect(result).toEqual(expected)
    })

    it('should return an array', function () {
      var expected = ['html', 'js', ['css', ['stylus', 'sass', 'less']]]
      var result = this.template.compile('["html", "js", ["css", ["stylus", "sass", "less"]]]')
      expect(result).toEqual(expected)
    })

    it('should return an object', function () {
      var expected = {
        name: 'object',
        size: {width: 20, height: 30}
      }

      var result = this.template.compile('{name: "object", size: {width: 20, height: 30}}')
      expect(result).toEqual(expected)
    })

  })


  describe('Template#supplant', function () {

    beforeEach(function () {
      this.template = new Template()
    })

    it('should return 8', function () {
      var result = this.template.supplant('Your result is {{4 * 2}}')
      expect(result).toEqual('Your result is 8')
    })

    it('should return full name', function () {
      this.template.vars = {
        name: 'Guilherme',
        lastname: 'Santiago'
      }

      var result = this.template.supplant('Your full name is {{name}} {{lastname}}!')
      expect(result).toEqual('Your full name is Guilherme Santiago!')
    })

    it('should escape strings by default', function () {
      this.template.vars.str = 'You & I aren\'t <"GREAT">'
      var expected = 'You &amp; I aren&#x27;t &lt;&quot;GREAT&quot;&gt;'
      var result = this.template.supplant('{{str}}')
      expect(result).toEqual(expected)
    })

    it('should return unescaped strings when `{% %}` delimiters are used', function () {
      var expected = this.template.vars.str = 'You & I aren\'t <"GREAT">'
      var result = this.template.supplant('{% str %}')
      expect(result).toEqual(expected)
    })

    it('should call a function', function (done) {
      this.template.vars = {
        myFunc: function () {
          done()
        }
      }

      this.template.supplant('{{ myFunc() }}')
    })

  })


  describe('Template#parse', function () {

    it('should render <div>', function () {
      var template = new Template('<div>{{ name }} {% lastname %}</div>')
      var result = template.parse({name: 'Guilherme', lastname: 'Santiago'})
      expect(result).toEqual('<div>Guilherme Santiago</div>')
    })

    it('should render a simple node text', function () {
      var template = new Template('This is my {{ str }}!!!')
      var result = template.parse({str: 'text'})
      expect(result).toEqual('This is my text!!!')
    })

    it('should render multiple elements', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/multiple-elements.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/multiple-elements.expected.html', 'utf8')
      var template = new Template(source)

      var result = template.parse({
        firstname: 'Guilherme',
        description: '<strong>Front-end Developer</strong>',
        user: {
          name: 'Guilherme Santiago',
          email: 'guilherme@email.com'
        }
      })

      expect(result).toEqual(expected.trim())
    })

  })


  describe('Template#addDirective', function () {

    it('should add a new directive', function () {
      Template.addDirective('uppercase', function ($el, value, props) {
        if (this.compile(value)) {
          $el.text($el.text().toUpperCase())
        }
      })

      var template = new Template('<div :uppercase="true">hello</div>')
      var expected = '<div>HELLO</div>'
      var result = template.parse()

      expect(result).toEqual(expected)
    })

  })

  describe('Template#setSource', function () {

    it('should set the template source', function () {
      var template = new Template('{{ 1 + 2 }}')
      expect(template.parse()).toEqual('3')
      template.setSource('{{ 5 * 5 }}')
      expect(template.parse()).toEqual('25')
    })

  })

})


/**
 * Directives
 */

describe('The directive', function () {

  describe(':bind', function () {
    it('should replace the element\'s text', function () {
      var template = new Template('<span :bind="name">Your name</span>')
      var result = template.parse({name: 'Guilhermão'})
      expect(result).toEqual('<span>Guilhermão</span>')
    })
  })

  describe(':show', function () {
    it('should show the element if expression given is truthy', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/directive-show.html', 'utf8')
      var expected1 = fs.readFileSync(__dirname + '/fixtures/templates/directive-show.expected1.html', 'utf8')
      var expected2 = fs.readFileSync(__dirname + '/fixtures/templates/directive-show.expected2.html', 'utf8')

      var template = new Template(source)
      var result1 = template.parse({user: {name: 'Guilherme Santiago', email: 'guilherme@email.com'}})
      var result2 = template.parse({user: {name: 'Zilla Zillão'}})

      expect(result1).toEqual(expected1.trim())
      expect(result2).toEqual(expected2.trim())
    })
  })

  describe(':hide', function () {
    it('should remove the element if the expression given is false', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/directive-hide.html', 'utf8')
      var expected1 = fs.readFileSync(__dirname + '/fixtures/templates/directive-hide.expected1.html', 'utf8')
      var expected2 = fs.readFileSync(__dirname + '/fixtures/templates/directive-hide.expected2.html', 'utf8')

      var template = new Template(source)
      var result1 = template.parse({user: {name: 'Guilherme Santiago', email: 'guilherme@email.com'}})
      var result2 = template.parse({user: {name: 'Zilla Zillão'}})

      expect(result1).toEqual(expected1.trim())
      expect(result2).toEqual(expected2.trim())
    })
  })

  describe(':class', function () {
    it('should apply classes to element', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/directive-class.html', 'utf8')
      var expected1 = fs.readFileSync(__dirname + '/fixtures/templates/directive-class.expected1.html', 'utf8')
      var expected2 = fs.readFileSync(__dirname + '/fixtures/templates/directive-class.expected2.html', 'utf8')

      var template = new Template(source)
      var result1 = template.parse({hasContainer: true, color: 'white', fontSize: 16})
      var result2 = template.parse({hasContainer: true, color: 'black', fontSize: 18})

      expect($(result1)[0]).toEqual($(expected1.trim())[0])
      expect($(result2)[0]).toEqual($(expected2.trim())[0])
    })
  })

  describe(':selected', function () {
    it('sould set `selected` attribute if the expression given is truthy', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/directive-selected.html', 'utf8')
      var expected1 = fs.readFileSync(__dirname + '/fixtures/templates/directive-selected.expected1.html', 'utf8')
      var expected2 = fs.readFileSync(__dirname + '/fixtures/templates/directive-selected.expected2.html', 'utf8')

      var template = new Template(source)
      var result1 = $(template.parse({option: 1}))[0]
      var result2 = $(template.parse({option: 3}))[0]

      expect(result1).toEqual($(expected1)[0])
      expect(result2).toEqual($(expected2)[0])
    })
  })

  describe(':checked', function () {
    it('should set `checked` attribute if the expression given is truthy', function () {
      var source = '<input type="checkbox" :checked="expression">'
      var expected1 = $('<input type="checkbox" checked="checked">')[0]
      var expected2 = $('<input type="checkbox">')[0]
      var template = new Template(source)

      var result1 = $(template.parse({expression: true}))[0]
      var result2 = $(template.parse({expression: false}))[0]

      expect(result1).toEqual(expected1)
      expect(result2).toEqual(expected2)
    })
  })

  describe(':href', function () {
    it('should set `href` attribute to the expression given', function () {
      var tpl = '<a :href="link">My Link</a>'
      var expected = '<a href="http://google.com">My Link</a>'
      var template = new Template(tpl)
      var result = template.parse({link: 'http://google.com'})
      expect(result).toEqual(expected)
    })
  })

  describe(':src', function () {
    it('should set `src` attribute to the expression given', function () {
      var tpl = '<img :src="myImage">'
      var expected = '<img src="path/to/logo.svg">'
      var template = new Template(tpl)
      var result = template.parse({myImage: 'path/to/logo.svg'})
      expect($(result)[0]).toEqual($(expected)[0])
    })
  })

  describe(':value', function () {
    it('should set `value` attribute to the expression given', function () {
      var tpl = '<input type="text" :value="name">'
      var expected = '<input type="text" value="Guilherme Santiago">'
      var template = new Template(tpl)
      var result = template.parse({name: 'Guilherme Santiago'})
      expect($(result)[0]).toEqual($(expected)[0])
    })
  })

  describe(':title and :alt', function () {
    it('should set `title` and `alt` attributes to the expression given to them', function () {
      var tpl = '<img src="{{img.url}}" :title="img.title" :alt="img.description">'
      var expected = '<img src="foo/bar/image.png" title="Image Title" alt="Image Description">'
      var template = new Template(tpl)
      var result = template.parse({img: {
        url: 'foo/bar/image.png',
        title: 'Image Title',
        description: 'Image Description'
      }})
      expect($(result)[0]).toEqual($(expected)[0])
    })
  })

  describe(':style', function () {
    it('should set `style` attribute to the object given', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/directive-style.html', 'utf8')
      var expected1 = fs.readFileSync(__dirname + '/fixtures/templates/directive-style.expected1.html', 'utf8')
      var expected2 = fs.readFileSync(__dirname + '/fixtures/templates/directive-style.expected2.html', 'utf8')
      var template = new Template(source)

      var result1 = $(template.parse({fontSize: 16}))[0]
      var result2 = $(template.parse({fontSize: 14}))[0]

      expect(result1).toEqual($(expected1)[0])
      expect(result2).toEqual($(expected2)[0])
    })
  })

  describe(':repeat', function () {
    it('should iterate array', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/iterate-array.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/iterate-array.expected.html', 'utf8')
      var template = new Template(source)
      var result = template.parse({items: ['Banana', 'Orange', 'Apple', 'Pear']})

      expect($(result)[0]).toEqual($(expected)[0])
    })

    it('should iterate object', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/iterate-object.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/iterate-object.expected.html', 'utf8')
      var template = new Template(source)
      var result = template.parse({users: {
        Guilherme: 'guilherme@email.com',
        Junin: 'junin@email.com',
        Zillao: 'zillao@email.com'
      }})

      expect($(result)[0]).toEqual($(expected)[0])
    })

    it('should add special properties to each loop', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/special-properties.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/special-properties.expected.html', 'utf8')
      var template = new Template(source)
      var result = template.parse({
        user: 'Initial user',
        $index: 'Initial index',
        $key: 'Initial key',
        $total: 'Initial total',
        $first: 'Initial first',
        $middle: 'Initial middle',
        $last: 'Initial last',
        $even: 'Initial even',
        $odd: 'Initial odd',
        users: ['Guilherme', 'Junin', 'Zilla']
      })

      expect($(result)[0]).toEqual($(expected)[0])
    })

    it('should support nested :repeat', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/nested-repeat.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/nested-repeat.expected.html', 'utf8')
      var template = new Template(source)
      var result = template.parse({
        users: [
          {
            name: 'Guilherme',
            skills: ['html', 'css', 'js']
          },
          {
            name: 'Zilla',
            skills: ['php', 'mysql']
          },
          {
            name: 'Junin',
            skills: []
          }
        ]
      })

      expect(result).toEqual(expected)
    })

    it('should support other directives', function () {
      var source = fs.readFileSync(__dirname + '/fixtures/templates/repeat-with-directives.html', 'utf8')
      var expected = fs.readFileSync(__dirname + '/fixtures/templates/repeat-with-directives.expected.html', 'utf8')
      var template = new Template(source)
      var result = template.parse({
        users: [
          {
            name: 'Guilherme',
            email: 'guilherme@email.com'
          },
          {
            name: 'Zilla'
          },
          {
            name: 'Junin',
            email: 'junin@email.com'
          }
        ]
      })

      expect($(result)[0]).toEqual($(expected)[0])
    })
  })

})
