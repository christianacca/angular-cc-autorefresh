<p class='lead'>
The <strong>cc-auto-refresh-btn directive</strong> extends <code>cc-auto-refresh-fn</code> directive with a button
that enables the user to pause and refresh on demand, and to cancel a refresh in progress 
</p>

*Optionally* use:

- `ng-disabled` attribute to disable the button
- `ng-hide` attribute to show/hide the button

### Overriding translations

The service `ccAutoRefreshDefaultTranslations` provides the directive with translations for tooltips, etc. Custom
translations can be provided either:

- supplying an expression to `refresh-translations` attribute
- globally by defining your own service named `ccAutoRefreshDefaultTranslations`  


### API documentation

See [API reference]({%= apiDocUrl.directive %})