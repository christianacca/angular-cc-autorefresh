angular-cc-autorefresh
======================

[AngularJS](http://angularjs.org/) directives to schedule work that refreshes $scope.

## Demo and docs

To see directives in action visit the [demo](http://christianacca.github.io/angular-cc-autorefresh).

Alternatively, browse the [API reference](http://christianacca.github.io/angular-cc-autorefresh/ref-docs)

## Installation

### 1. Reference dependencies

- [AngularJS](http://angularjs.org/)
	- eg: `<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min.js"></script>` 
- [Bootstrap's **CSS**](http://getbootstrap.com/)
	- eg: `<link href="//netdna.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" rel="stylesheet"/>`

### 2. Reference **angular-cc-autorefresh**

- Download the latest `cc-autorefresh-tpls-[version].min.js` script file from [here](<a href="https://github.com/christianacca/angular-cc-autorefresh/tree/gh-pages">)
- Add the reference (remember to replace *'your/path'* and *'[version]'*). eg:
    - `<script src="your/path/cc-autorefresh-tpls-[version].min.js"></script>`

### 3. Add dependencies on the `cc.autorefresh` AngularJS module

Eg:
```javascript
angular.module('myModule', ['cc-autorefresh']);
```


