# jquery-view

**The View Pattern for jQuery**

## Template Engine

jQuery View provides a simple DOM-based template engine. Basically, you
can use `{{myExpression}}` to print and evaluate expressions, and special
attributes called `directives` to manipulate the elements.

It's heavily inspired on Angular's Template Engine, but it's much much simplier.

Here's an example:

```html
<ul>
  <li :repeat="user in users">
    <span>Nº: {{$index + 1}}</span>
    <strong>{{user.name}}</strong>
    <a href="mailto:{{user.email}}" :show="user.email">Send email</a>
  </li>
  <form :submit="submit($event)">
    <input type="text" placeholder="Type a name" :data="name">
    <button type="submit">Add</button>
  </form>
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
In each loop, it will provide two additional variables:
`$index` and `$key`.


```html
<ul>
  <li :repeat="user in users">
    {{$index}}: {{user.name}}
  </li>
</ul>
```

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
on Angular's default directives.

If you miss some directive, be free to open an issue, send a PR or see the section below:

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