<p class='lead'>
The <strong>cc-auto-refresh-fn directive</strong> will schedule an expression to run every 
<em>n</em> number of milliseconds and assign the return value to the scope.
</p>

Use `cc-auto-refresh-fn` or `refresh-fn` attribute to supply the expression, `refresh-model` to data-bind the result 
to the scope and `refresh-interval` to control the frequency of execution.

*Optionally* use:

- the `refresh-paused` attribute to pause the schedule as required
- the `refresh-on-refreshed` attribute to specify an expression that should be executed on successful refreshes.
- the `refresh-busy` attribute to set a flag on the scope when the execution is in progress

### API documentation

See [API reference]({%= apiDocUrl.directive %})