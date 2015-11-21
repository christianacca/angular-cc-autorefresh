/* jshint quotmark: double */
/**
 * @ngdoc overview
 * @name cc.autorefresh.ccAutoRefreshBtn
 *
 * @description
 * Button directive for scheduling a routine to run at intervals.
 *
 * @requires cc.autorefresh.ccAutoRefreshFn
 */
angular.module("cc.autorefresh.ccAutoRefreshBtn", ["cc.autorefresh.ccAutoRefreshFn"])
/**
 * @ngdoc directive
 * @name cc.autorefresh.ccAutoRefreshBtn.directive:ccAutoRefreshBtn
 * @restrict E
 *
 * @description
 * Schedule a expression to run every n number of milliseconds and assign the return value to the scope.
 * Extends {@link cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn ccAutoRefreshFn} with a button for the user
 * to:
 *
 * - pause and refresh on demand
 * - cancel a refresh in progress
 *
 * ### Parameters
 * This directive does not expose parameters itself but instead works in concert with a parent
 * {@link cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn ccAutoRefreshFn}
 * @scope
 */
    .directive("ccAutoRefreshBtn", [function () {
        "use strict";

        return {
            restrict: "E",
            require: "^ccAutoRefreshFn",
            transclude: true,
            replace: true,
            scope: true,
            templateUrl: "app/vendor/angular-ccacca/autoRefresh/ccAutoRefreshBtn.html",
            controller: [function () { }],
            link: function (scope, elem, attrs, ccAutoRefreshFn) {
                scope.ctrl = ccAutoRefreshFn;
            }
        };
    }])
    .directive("ccTranscludeAppend", [function () {
        "use strict";

        // NOTE: this directive is a copy of ngTransclude (vs 1.2.9) and modified to behave the same (hopefully) as angular
        // 1.x in that it *appends* the transcluded content to the element with the ramTranscludeAppend directive.
        // This is in contrast to angular 1.2 behaviour which *replaces* the inner content of the element with the
        // ccTranscludeAppend directive

        return {
            restrict: "A",
            controller: ["$element", "$transclude", function ($element, $transclude) {
                if (!$transclude) {
                    throw new Error("Illegal use of ngTransclude directive in the template! " +
                        "No parent directive that requires a transclusion found. ");
                }

                // remember the transclusion fn but call it during linking so that we don't process transclusion before directives on
                // the parent element even when the transclusion replaces the current element. (we can't use priority here because
                // that applies only to compile fns and not controllers
                this.$transclude = $transclude;
            }],
            link: function ($scope, $element, $attrs, controller) {
                controller.$transclude(function (clone) {
                    $element.append(clone);
                });
            }
        };
    }]);
