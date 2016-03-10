/*global expect*/

/**
 * Dependencies.
 */

var $ = require('jquery')
var Template = require('../src/Template')

describe('Template#compile', function () {

  beforeEach(function () {
    this.template = new Template()
  })

  it('should return 5', function () {
    var result = this.template.compile('2 + 3')
    expect(result).toEqual(5)
  })

  it('should return 10', function () {
    var result = this.template.compile('(10 / 2) * 2')
    expect(result).toEqual(10)
  })

  it('should concat strings', function () {
    var result = this.template.compile('"Hello," + " world!"')
    expect(result).toEqual('Hello, world!')
  })

  it('should replace `name` variable', function () {
    this.template.context = {name: 'Guilherme'}
    var result = this.template.compile('"Hello, " + name')
    expect(result).toEqual('Hello, Guilherme')
  })

  it('should resolve operation', function () {
    this.template.context = {
      name: 'Guilherme',
      lastname: 'Santiago',
      age: 20
    }

    var result = this.template.compile('name + \' \' + lastname + \' is \' + (age + 1) + \' years old\'')
    expect(result).toEqual('Guilherme Santiago is 21 years old')
  })

  it('should return an object', function () {
    this.template.context = {
      dimensions: {width: 200, height: 200}
    }

    var result = this.template.compile('{width: dimensions.width, height: dimensions.height, value: true}')
    expect(result).toEqual({
      width: this.template.context.dimensions.width,
      height: this.template.context.dimensions.height,
      value: true
    })
  })

  it('should return an array', function () {
    this.template.context = {
      items: ['Item 1', 'Item 2', 'Item 3']
    }

    var result = this.template.compile('items')
    expect(result).toEqual(this.template.context.items)
  })

})

describe('Template#supplant', function () {

  beforeEach(function () {
    this.template = new Template()
  })

  it('should return 3', function () {
    var expr = '1 + 2 = {{1 + 2}}'
    var result = this.template.supplant(expr)
    expect(result).toEqual('1 + 2 = 3')
  })

  it('should return full name', function () {
    this.template.context = {
      name: 'Guilherme',
      lastname: 'Santiago'
    }

    var expr = 'Full name: {{name}} {{lastname}}!'
    var result = this.template.supplant(expr)

    expect(result).toEqual('Full name: Guilherme Santiago!')
  })

  it('should escape string', function () {
    this.template.context.str = 'You & I aren\'t <"GREAT">'
    var expected = 'You &amp; I aren&#x27;t &lt;&quot;GREAT&quot;&gt;'
    var expr = '{{str}}'
    var result = this.template.supplant(expr)

    expect(result).toEqual(expected)
  })

  it('should not escape string', function () {
    var expected = this.template.context.str = 'You & I aren\'t <"GREAT">'
    var expr = '{% str %}'
    var result = this.template.supplant(expr)

    expect(result).toEqual(expected)
  })
})

describe('Template#parse', function () {

  it('should render div', function () {
    var template = new Template('<div>{{ name }}</div>')
    var result = template.parse({name: 'Guilherme'})
    expect(result).toEqual('<div>Guilherme</div>')
  })

  it('should render node text', function () {
    var template = new Template('Hello, {{variable}}!!!')
    var result = template.parse({variable: 'World'})
    expect(result).toEqual('Hello, World!!!')
  })

  it('should render multiple elements', function () {
    var tpl = '<div class="container">' +
                '<strong class="name">Name: {{user.name}}</strong>' +
                '<a href="mailto:{{user.email}}" class="email">E-mail: {{user.email}}</a>' +
              '</div>'

    var tplExpected = '<div class="container">' +
                        '<strong class="name">Name: Guilherme</strong>' +
                        '<a href="mailto:gui@email.com" class="email">E-mail: gui@email.com</a>' +
                      '</div>'

    var template = new Template(tpl)
    var result = template.parse({user: {name: 'Guilherme', email: 'gui@email.com'}})
    expect(result).toEqual(tplExpected)
  })

})

describe('Template#directives', function () {

  it('`:bind`', function () {
    var tpl = '<div :bind="name" class="username"></div>'
    var template = new Template(tpl)
    var result = template.parse({name: 'Guilherme'})
    expect(result).toEqual('<div class="username">Guilherme</div>')
  })

  it('`:show`', function () {
    var tpl = '<div>' +
                '<strong class="username">{{user.name}}</strong>' +
                '<a href="mailto:{{user.email}}" :show="user.email">Contact</a>' +
              '</div>'

    var expected1 = '<div>' +
                      '<strong class="username">John</strong>' +
                      '<a href="mailto:john@gmail.com">Contact</a>' +
                    '</div>'

    var expected2 = '<div>' +
                      '<strong class="username">John</strong>' +
                    '</div>'

    var template = new Template(tpl)
    var result1 = template.parse({user: {name: 'John', email: 'john@gmail.com'}})
    var result2 = template.parse({user: {name: 'John', email: ''}})

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:hide`', function () {
    var tpl = '<div>' +
                '<strong class="username">{{user.name}}</strong>' +
                '<a href="mailto:{{user.email}}" :hide="!user.email">Contact</a>' +
              '</div>'

    var expected1 = '<div>' +
                      '<strong class="username">John</strong>' +
                      '<a href="mailto:john@gmail.com">Contact</a>' +
                    '</div>'

    var expected2 = '<div>' +
                      '<strong class="username">John</strong>' +
                    '</div>'

    var template = new Template(tpl)
    var result1 = template.parse({user: {name: 'John', email: 'john@gmail.com'}})
    var result2 = template.parse({user: {name: 'John', email: ''}})

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:class`', function () {
    var tpl = '<div class="container">' +
                '<a href="/home" :class="{isActive: page.home}">Home</a>' +
                '<a href="/about" :class="{isActive: page.about}">About</a>' +
                '<a href="/contact" :class="{isActive: page.contact}">Contact</a>' +
              '</div>'

    var expected1 = '<div class="container">' +
                      '<a href="/home" class="is-active">Home</a>' +
                      '<a href="/about">About</a>' +
                      '<a href="/contact">Contact</a>' +
                    '</div>'

    var expected2 = '<div class="container">' +
                      '<a href="/home">Home</a>' +
                      '<a href="/about">About</a>' +
                      '<a href="/contact" class="is-active">Contact</a>' +
                    '</div>'

    var template = new Template(tpl)
    var result1 = template.parse({page: {home: true}})
    var result2 = template.parse({page: {contact: true}})
    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:class` with multiple classes', function () {
    var tpl = '<div :class="{container: hasContainer, bgBlue: true}">' +
                '<span :class="{textDanger: status !== \'success\', textSuccess: status === \'success\'}">{{message}}</span>' +
              '</div>'

    var expected1 = '<div class="container bg-blue">' +
                      '<span class="text-danger">Error</span>' +
                    '</div>'

    var expected2 = '<div class="bg-blue">' +
                      '<span class="text-success">Success</span>' +
                    '</div>'

    var template = new Template(tpl)
    var result1 = template.parse({hasContainer: true, status: 'error', message: 'Error'})
    var result2 = template.parse({hasContainer: false, status: 'success', message: 'Success'})

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:disabled`', function () {
    var tpl = '<form>' +
                '<input type="text" placeholder="Name" name="name" :disabled="isDisabled">'
              '</form>'

    var expected1 = '<form>' +
                      '<input type="text" placeholder="Name" name="name" disabled="disabled">' +
                    '</form>'

    var expected2 = '<form>' +
                      '<input type="text" placeholder="Name" name="name">' +
                    '</form>'

    var template = new Template(tpl)
    var result1 = template.parse({isDisabled: true})
    var result2 = template.parse({isDisabled: false})

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:selected`', function () {
    var tpl = '<form>' +
                '<select name="list">' +
                  '<option value="1" :selected="option === 1">First Option</option>' +
                  '<option value="2" :selected="option === 2">Second Option</option>' +
                  '<option value="3" :selected="option === 3">Third Option</option>' +
                '</select>' +
              '</form>'

    var expected1 = '<form>' +
                      '<select name="list">' +
                        '<option value="1" selected="selected">First Option</option>' +
                        '<option value="2">Second Option</option>' +
                        '<option value="3">Third Option</option>' +
                      '</select>' +
                    '</form>'

    var expected2 = '<form>' +
                      '<select name="list">' +
                        '<option value="1">First Option</option>' +
                        '<option value="2">Second Option</option>' +
                        '<option value="3" selected="selected">Third Option</option>' +
                      '</select>' +
                    '</form>'

    var template = new Template(tpl)
    var result1 = template.parse({option: 1})
    var result2 = template.parse({option: 3})

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
  })

  it('`:checked`', function () {
    var tpl = '<form>' +
                '<input type="checkbox" name="item1" :checked="true">' +
                '<input type="checkbox" name="item2" :checked="false">' +
                '<input type="checkbox" name="item3" :checked="2 === 2">' +
                '<input type="checkbox" name="item4" :checked="isChecked">' +
              '</form>'

    var expected1 = '<form>' +
                      '<input type="checkbox" name="item1" checked="checked">' +
                      '<input type="checkbox" name="item2">' +
                      '<input type="checkbox" name="item3" checked="checked">' +
                      '<input type="checkbox" name="item4" checked="checked">' +
                    '</form>'

    var template = new Template(tpl)
    var result = template.parse({isChecked: true})
    expect(result).toEqual(expected1)
  })

  it('`:href`', function () {
    var tpl = '<a :href="link">My Link</a>'
    var expected = '<a href="http://google.com">My Link</a>'
    var template = new Template(tpl)
    var result = template.parse({link: 'http://google.com'})
    expect(result).toEqual(expected)
  })

  it('`:style`', function () {
    var tpl = '<div :style="{color: \'white\'}">' +
                '<p :style="{backgroundColor: colors.blue, lineHeight: 1.5}">' +
                  'Contents' +
                '</p>' +
              '</div>'

    var expected = '<div style="color: white;">' +
                      '<p style="background-color: rgb(0, 0, 139); line-height: 1.5;">' +
                        'Contents' +
                      '</p>' +
                    '</div>'

    var template = new Template(tpl)
    var result = template.parse({colors: {blue: '#00008B'}})
    expect(result).toEqual(expected)
  })

  it('`:repeat`', function () {
    var tpl = '<ul>' +
                '<li :repeat="item in items">' +
                  '{{item}}' +
                '</li>' +
              '</ul>'

    var expected = '<ul>' +
                    '<li>Item 1</li>' +
                    '<li>Item 2</li>' +
                    '<li>Item 3</li>' +
                  '</ul>'

    var template = new Template(tpl)
    var result = template.parse({items: ['Item 1', 'Item 2', 'Item 3']})
    expect(result).toEqual(expected)
  })

  it('`:repeat` with arrays that contains objects', function () {
    var tpl = '<ul>' +
                '<li :repeat="user in users">' +
                  '<strong class="username">{{ user.name }}</strong>' +
                  '<a href="mailto:{{user.email}}">{{ user.email }}</a>' +
                '</li>' +
              '</ul>'

    var expected = '<ul>' +
                      '<li>' +
                        '<strong class="username">Guilherme</strong>' +
                        '<a href="mailto:gui@email.com">gui@email.com</a>' +
                      '</li>' +
                      '<li>' +
                        '<strong class="username">Junin</strong>' +
                        '<a href="mailto:junin@aforum.com">junin@aforum.com</a>' +
                      '</li>' +
                    '</ul>'

    var template = new Template(tpl)
    var users = [
      {
        name: 'Guilherme',
        email: 'gui@email.com'
      },
      {
        name: 'Junin',
        email: 'junin@aforum.com'
      }
    ]
    var result = template.parse({users: users})

    expect(result).toEqual(expected)
  })

  it('nested `:repeat`s', function () {
    var tpl = '<ul class="users">' +
                '<li :repeat="user in users">' +
                  'User {{$index}}: {{user.name}}' +
                  '<ul class="languages">' +
                    '<li :repeat="language in user.languages">{{$index + 1}}: {{language}}</li>' +
                  '</ul>' +
                '</li>' +
              '</ul>'

    var expected = '<ul class="users">' +
                      '<li>' +
                        'User 0: Guilherme' +
                        '<ul class="languages">' +
                          '<li>1: Portuguese</li>' +
                          '<li>2: English</li>' +
                        '</ul>' +
                      '</li>' +
                      '<li>' +
                        'User 1: Zillozo' +
                        '<ul class="languages">' +
                          '<li>1: English</li>' +
                          '<li>2: Spanish</li>' +
                        '</ul>' +
                      '</li>' +
                    '</ul>'

    var template = new Template(tpl)
    var users = [
      {
        name: 'Guilherme',
        languages: ['Portuguese', 'English']
      },
      {
        name: 'Zillozo',
        languages: ['English', 'Spanish']
      }
    ]

    var result = template.parse({users: users})
    expect(result).toEqual(expected)
  })

  it('`:repeat` with objects', function () {
    var tpl = '<div>' +
                '<strong>LIST:</strong>' +
                '<a href="{{user}}" :repeat="user in users">' +
                  '<span>{{$index}}</span>' +
                  '<span>{{$key}}: {{user}}</span>' +
                '</a>' +
              '</div>'

    var expected = '<div>' +
                      '<strong>LIST:</strong>' +
                      '<a href="guilherme@email.com">' +
                        '<span>0</span>' +
                        '<span>Guilherme: guilherme@email.com</span>' +
                      '</a>' +
                      '<a href="juninzoto@email.com">' +
                        '<span>1</span>' +
                        '<span>Junin: juninzoto@email.com</span>' +
                      '</a>' +
                   '</div>'

    var template = new Template(tpl)
    var users = {
      Guilherme: 'guilherme@email.com',
      Junin: 'juninzoto@email.com'
    }
    var result = template.parse({users: users})
    expect(result).toEqual(expected)
  })

  it('`:repeat` with directives', function () {
    var tpl = '<ul>' +
                '<li :repeat="user in users">' +
                  '<span>Nº: {{$index + 1}}</span>' +
                  '<strong :bind="user.name"></strong>' +
                  '<a href="mailto:{{user.email}}" :show="user.email">Send email</a>' +
                '</li>' +
              '</ul>'

    var expected = '<ul>' +
                    '<li>' +
                      '<span>Nº: 1</span>' +
                      '<strong>Guilherme Santiago</strong>' +
                      '<a href="mailto:guilherme@email.com">Send email</a>' +
                    '</li>' +
                    '<li>' +
                      '<span>Nº: 2</span>' +
                      '<strong>Tony Stark</strong>' +
                    '</li>' +
                  '</ul>'

    var template = new Template(tpl)
    var users = [
      {
        name: 'Guilherme Santiago',
        email: 'guilherme@email.com'
      },
      {
        name: 'Tony Stark'
      }
    ]
    var result = template.parse({users: users})
    expect(result).toEqual(expected)
  })

  it('`:repeat` should expose special variables', function () {
    var tpl = '<div>' +
                '$index: {{$index}}\n' +
                '$key: {{$key}}\n' +
                '$total: {{$total}}\n' +
                '$odd: {{$odd}}\n' +
                '$even: {{$even}}\n' +
                '$middle: {{$middle}}\n' +
                '$first: {{$first}}\n' +
                '$last: {{$last}}\n' +
                'user: {{user}}\n' +
                '<div :repeat="user in users">\n' +
                  '$index: {{$index}}\n' +
                  '$key: {{$key}}\n' +
                  '$total: {{$total}}\n' +
                  '$odd: {{$odd}}\n' +
                  '$even: {{$even}}\n' +
                  '$middle: {{$middle}}\n' +
                  '$first: {{$first}}\n' +
                  '$last: {{$last}}\n' +
                  'user: {{user}}\n' +
                '</div>' +
                '$index: {{$index}}\n' +
                '$key: {{$key}}\n' +
                '$total: {{$total}}\n' +
                '$odd: {{$odd}}\n' +
                '$even: {{$even}}\n' +
                '$middle: {{$middle}}\n' +
                '$first: {{$first}}\n' +
                '$last: {{$last}}\n' +
                'user: {{user}}\n' +
              '</div>'

    var expected = '<div>' +
                      '$index: go index\n' +
                      '$key: k3y\n' +
                      '$total: 999\n' +
                      '$odd: yeah\n' +
                      '$even: nope\n' +
                      '$middle: what\n' +
                      '$first: hein\n' +
                      '$last: wow\n' +
                      'user: dafuq\n' +
                      '<div>\n' +
                        '$index: 0\n' +
                        '$key: 0\n' +
                        '$total: 3\n' +
                        '$odd: true\n' +
                        '$even: false\n' +
                        '$middle: false\n' +
                        '$first: true\n' +
                        '$last: false\n' +
                        'user: Guilherme\n' +
                      '</div>' +
                      '<div>\n' +
                        '$index: 1\n' +
                        '$key: 1\n' +
                        '$total: 3\n' +
                        '$odd: false\n' +
                        '$even: true\n' +
                        '$middle: true\n' +
                        '$first: false\n' +
                        '$last: false\n' +
                        'user: Junin\n' +
                      '</div>' +
                      '<div>\n' +
                        '$index: 2\n' +
                        '$key: 2\n' +
                        '$total: 3\n' +
                        '$odd: true\n' +
                        '$even: false\n' +
                        '$middle: false\n' +
                        '$first: false\n' +
                        '$last: true\n' +
                        'user: Zillaum\n' +
                      '</div>' +
                      '$index: go index\n' +
                      '$key: k3y\n' +
                      '$total: 999\n' +
                      '$odd: yeah\n' +
                      '$even: nope\n' +
                      '$middle: what\n' +
                      '$first: hein\n' +
                      '$last: wow\n' +
                      'user: dafuq\n' +
                    '</div>'

    var template = new Template(tpl)
    var initialContext = {
      $index: 'go index',
      $key: 'k3y',
      $total: 999,
      $odd: 'yeah',
      $even: 'nope',
      $middle: 'what',
      $first: 'hein',
      $last: 'wow',
      user: 'dafuq',
      users: ['Guilherme', 'Junin', 'Zillaum']
    }
    var result = template.parse(initialContext)

    expect(result).toEqual(expected)
  })

})

describe('Template#addDirective', function () {

  it('should add a new directive', function () {
    Template.addDirective('uppercase', function ($el, value, props) {
      if (this.compile(value)) $el.text($el.text().toUpperCase())
    })

    var tpl = '<div :uppercase="true">test</div>'
    var expected = '<div>TEST</div>'

    var template = new Template(tpl)
    var result = template.parse()
    expect(result).toEqual(expected)
  })

})
