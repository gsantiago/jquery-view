# jQuery View

<p align="center">
  <a href="https://travis-ci.org/gsantiago/jquery-view">
    <img src="https://travis-ci.org/gsantiago/jquery-view.svg?branch=master" alt="Build Status">
  </a>
  <a href="https://codeclimate.com/github/gsantiago/jquery-view">
    <img src="https://codeclimate.com/github/gsantiago/jquery-view/badges/gpa.svg?gsantiago" alt="Code Climate">
  </a>
  <a href="http://standardjs.com/">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" alt="js-standard-style">
  </a>
  <a href="https://badge.fury.io/js/jquery-view">
    <img src="https://badge.fury.io/js/jquery-view.svg" alt="npm version">
  </a>
</p>

<p align="center">
  <a href="https://saucelabs.com/u/guilhermepolvo">
    <img src="https://saucelabs.com/browser-matrix/guilhermepolvo.svg" alt="Sauce Test Status">
  </a>
</p>

> NOTE: This project is in early development. Don't use it in production yet.

## Introduction

jQuery View is an extension for jQuery that allows you to build dynamic views powered by templates and data binding.

You can use it just like a normal jQuery plugin:

```js
$('.my-view').view({
  data: {
    users: ['John', 'Peter', 'Mark'],
    clickCount: 0
  },
  clickHandler: function (event, $button) {
    var count = this.get('clickCount') + 1
    this.set('clickCount', count)
  }
})
```

And enjoy its simple and expressive DOM-based template:

```html
<div class="my-view">
  <ul>
    <li :repeat="user in users">
      {{user}}
    </li>
  </ul>
  <button :click="this.clickHandler($event, $target)">
    You clicked {{clickCount}} times.
  </button>
</div>
```

Checkout the example above in this pen: https://codepen.io/gsantiago/pen/jqLjzg

## TODO Example

Check out a TODO List example here: https://codepen.io/gsantiago/pen/KzyYqw

## Installation

```npm install jquery-view --save```

Then just require it:

```js
require('jquery-view')
```

If you don't use NPM, then just copy `dist/jquery-view.js` from this repo and include it in your project.

## Usage

You can use it like a jQuery plugin:

```js
var myView = $('.my-view').view({options})
```

Or using the View constructor:

```js
var myView = new View($('.my-view'), {options})
```

### Options

|Name|Type|Description|
|--------|----|-------|
|data | Object or Function | Default value for view's state.
|template | String | Optional template.
|templateUrl | String | Use an external template.
|beforeRender | Function | Callback called before rendering.
|afterRender | Function | Callback called after rendering.
|events | Object | Event binding similar to Backbone's Event Hash.
|init | Function | Callback called once the template is loaded.

Each extra option passed will be attached to the instance like a method:

```js
var view = $('my-view').view({
  myExtraMethod: function () {
    console.log('my extra method')
  }
})

view.myExtraMethod() // `my extra method`
```

### API

#### `getState()`

Return the current state.

#### `setState(obj)`

Extend the current state.

#### `props`

Object with view's attributes.


## Template Engine

jQuery View provides a simple DOM-based template engine. Basically, you
can use `{{myExpression}}` to print and evaluate expressions, and special
attributes called `directives` to manipulate the elements.

It's heavily inspired by Angular's Templates, but it's much much simplier.

Here's an example:

```html
<ul>
  <li :repeat="user in users">
    <span>Nº: {{$index + 1}}</span>
    <strong>{{user.name}}</strong>
    <a href="mailto:{{user.email}}" :show="user.email">Send email</a>
  </li>
</ul>
```

### Expressions

You can put your expressions between curly braces `{{ }}`:

```html
<p>{{message}}</p>
<p>
  {{ message.toUpperCase() }}
</p>
```

By default, the expressions are escaped.
If you want an unescaped result, use `{% %}` instead of double curly braces.

```html
<span>{% unsafe_text %}</span>
```

### Directives

All directives begin with a colon `:`

#### :show

If expression given is `false`, then the element is removed.

```html
<div :show="1 === 2">
  This element will not be present in the DOM.
</div>

<div :show="email">
  {{email}}
</div>
```


### :hide

Similar to `:show`. It will remove the element if the expression is truthy.


### :bind

Replace the element's content by the expression given.

```html
<div :bind="name">Name will show here</div>
<span :bind="4 + 4">8</span>
```


### :repeat

Create a loop similar to `ng-repeat` from Angular.

```html
<ul>
  <li :repeat="user in users">
    {{$index}}: {{user.name}}
  </li>
</ul>
```

For each loop, `:repeat` will provide special properties:

|Variable|Type|Details|
|--------|----|-------|
| `$index` | Number | Iterator's offset (0..length-1).
| `$key` | Number or String | Item's index for arrays, or key for objects.
| `$total` | Number | The collection's length.
| `$first` | Boolean | true if the repeated element is first in the iterator.
| `$middle` | Boolean | true if the repeated element is between the first and last in the iterator.
| `$last` | Boolean | true if the repeated element is last in the iterator.
| `$even` | Boolean | true if the iterator position is even (otherwise false).
| `$odd` | Boolean | true if the iterator position is odd (otherwise false).

It also supports nested `:repeat`'s:

```html
<div class="my-list">
  My list:
  <a href="{{user.homepage}}" :repeat="user in users">
    <strong>Name: {{user.name}}</strong>
    Skills:
    <ul>
      <li :repeat="skill in user.skills">
        {{skill}}
      </li>
    </ul>
  </a>
</div>
```

### :class

Pass a simple JavaScript Object with the class name as the key and
an expression as the value. If the expression is truthy, the class is added:

```html
<!-- myVariable = true -->
<div :class="{isActive: 1 === 1, hasDropdown: myVariable}"></div>
```

The element is rendered to:

```html
<div class="is-active has-dropdown"></div>
```

### :style

Inject an object as CSS inline:

```html
<div :style="{backgroundColor: myColor, lineHeight: 1.5}"></div>
```

Is rendered to:

```html
<div style="background-color: rgba(0, 100, 50); line-height: 1.5;"></div>
```

### Other directives

This template engine supports many other directives like
`:href`, `:disabled`, `:checked`, `:selected`. All of them are inspired
by Angular's default directives.

If you miss some directive, feel free to open an issue, send a PR or see the section below:

## Custom Directives

The method `addDirective` offers a simple way to create your own directives.

Here's a simple directive that let your text uppercase if the expression given is truthy:

```js
$.view.Template.addDirective('uppercase', function ($el, value, props) {
  if (this.compile(value)) {
    var txt = $el.text()
    $el.text(txt.toUpperCase())
  }
})
```
