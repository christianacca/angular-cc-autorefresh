# 0.3.0 (2015-11-21)


## Bug Fixes

* **ccAutoRefreshBtn:** scope clash with ccAutoRefreshFn ([7850250e](https://github.com/christianacca/angular-cc-autorefresh.git/commit/7850250e45182f7a93dbafbcb80f036d8561a552))
* **ccAutoRefreshFn:** incorrect http cancellation classification ([fef723b2](https://github.com/christianacca/angular-cc-autorefresh.git/commit/fef723b28f80c1cf489cf1bf8a6f4312c789c687))


## Breaking Changes

* 
`ccAutoRefreshBtn` directive must now be nested within a parent `ccAutoRefreshFn`.

Previously:

```html
<cc-auto-refresh-btn
    cc-auto-refresh-fn="..."
    refresh-interval="..."
    refresh-model="...">
</cc-auto-refresh-btn>
```

Now:

```html
<div style="display: inline-block"
     cc-auto-refresh-fn="..."
     refresh-interval="..."
     refresh-model="...">
     <cc-auto-refresh-btn></cc-auto-refresh-btn>
</div>
```

 ([7850250e](https://github.com/christianacca/angular-cc-autorefresh.git/commit/7850250e45182f7a93dbafbcb80f036d8561a552))


# 0.2.0 (2014-11-17)

Translations are now "compiled" into the html templates as a build step

# 0.1.4 (2014-08-31)

Demo / documentation changes

# 0.1.0 (2014-08-30)

_Very first, initial release_.

## Features

Version `0.1.0` was released with the following directives:

* ccAutoRefreshBtn
* ccAutoRefreshFn
