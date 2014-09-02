angular-cc-autorefresh
======================

[![Build Status](https://travis-ci.org/christianacca/angular-cc-autorefresh.svg?branch=master)](https://travis-ci.org/christianacca/angular-cc-autorefresh)
[![devDependency Status](https://david-dm.org/christianacca/angular-cc-autorefresh/dev-status.svg?branch=master)](https://david-dm.org/christianacca/angular-cc-autorefresh#info=devDependencies)

[AngularJS](http://angularjs.org/) directives to schedule work that refreshes $scope.

## Demo and docs

To see directives in action visit the [demo](http://projects.codingmonster.co.uk/angular-cc-autorefresh/).

Alternatively, browse the [API reference](http://projects.codingmonster.co.uk/angular-cc-autorefresh//ref-docs)

## Installation

### 1. Reference dependencies

- [AngularJS](http://angularjs.org/)
	- eg: `<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.23/angular.min.js"></script>` 
- [Bootstrap's **CSS**](http://getbootstrap.com/)
	- eg: `<link href="//netdna.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" rel="stylesheet"/>`

### 2. Reference **angular-cc-autorefresh**

- Either:
	- Download the latest `cc-autorefresh-tpls-[version].min.js` script file from [here](https://github.com/christianacca/angular-cc-autorefresh/tree/gh-pages); **OR**
	- Install with bower. eg: `bower install angular-cc-autorefresh`
- Add the reference (remember to replace *'your/path'* and *'[version]'*). eg:
    - `<script src="your/path/cc-autorefresh-tpls-[version].min.js"></script>`

### 3. Add dependencies on the `cc.autorefresh` AngularJS module

Eg:
```javascript
angular.module('myModule', ['cc-autorefresh']);
```


