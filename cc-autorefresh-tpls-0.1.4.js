/*
 * angular-cc-autorefresh
 * http://projects.codingmonster.co.uk/angular-cc-autorefresh

 * Version: 0.1.4 - 2014-08-31
 * License: MIT
 */
angular.module("cc.autorefresh", ["cc.autorefresh.tpls", "cc.autorefresh.ccAutoRefreshFn","cc.autorefresh.ccAutoRefreshBtn"]);
angular.module("cc.autorefresh.tpls", ["template/ccAutoRefreshBtn/ccAutoRefreshBtn.html"]);
/* jshint quotmark: double */
/**
 * @ngdoc overview
 * @name cc.autorefresh.ccAutoRefreshFn
 *
 * @description
 * Directive for scheduling a routine to run at intervals.
 *
 */
angular.module("cc.autorefresh.ccAutoRefreshFn", [])
    .factory("_ccAutoRefreshUtils", ["$injector", function ($injector) {
        "use strict";

        function resolveExPoliciesSvc() {
            // integrate with ccExceptionPoliciesModule if installed
            // otherwise return a sufficient "lite" service
            if ($injector.has("ccExceptionPolicies")) {
                return $injector.get("ccExceptionPolicies");
            }
            else {
                return {
                    promiseFinExPolicy: $injector.get("$exceptionHandler"),
                    httpFailureFormatter: function (rejection) {
                        if (rejection instanceof Error) { return rejection; }
                        return { isHttpCancel: rejection && rejection.status === 0 };
                    }
                };
            }
        }

        return {
            resolveExPoliciesSvc: resolveExPoliciesSvc
        };
    }])
/**
 * @ngdoc directive
 * @name cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn
 * @restrict EA
 *
 * @description
 * Schedule a expression to run every n number of milliseconds and assign the return value to the scope.
 *
 * The `ccAutoRefreshFn` directive creates and exposes the
 * {@link cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl ccAutoRefreshFnCtl} controller.
 * This controller can be `required` by another directive which can then *extend* the `ccAutoRefreshFn`, for example
 * by adding a GUI
 * @element ANY
 * @scope
 * @param {expression} ccAutoRefreshFn|refreshFn An expression to schedule for execution.
 *
 *  On *successfully* execution, the return value is assigned to the scope field identified by `refreshModel`.
 *
 *  Where the expression returns a *rejected* promise or *throws* an exception, the schedule is paused (`refreshPaused`
 *  is set to `true`).
 *
 *  The expression will receive a `cancellationToken`
 *  argument that references a {@link https://docs.angularjs.org/api/ng/service/$q $q promise}
 *
 *    - `cancellationToken` should be supplied to any call to
 *      {@link https://docs.angularjs.org/api/ng/service/$http $http} as the `timeout` property of the `config`
 *      parameter
 *    - the `cancellationToken` promise will be resolved, thus cancelling any in-flight `$http` request, whenever the
 *      {@link https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope} for the current view is about to
 *      be `$destroy`'ed. The most likely reason for this occurring is when the user switches to another view
 *    - `cancellationToken` can be safely ignored if the `refreshFn` is not asynchronous
 * @param {expression=} refreshPaused **Assignable** angular expression which determines whether the schedule is paused.
 *
 *   - If the expression is truthy the schedule is paused
 *   - If this directive determines that the schedule should be paused, it will assign the expression to a value of `true`
 * @param {expression} refreshInterval
 *  Angular expression that determines the interval (milliseconds) that `refreshFn` will be executed.
 * @param {expression} refreshModel **Assignable** angular expression to data-bind the value returned by `refreshFn`.
 * @param {expression=} refreshBusy
 *  **Assignable** angular expression that this directive will set whenever `refreshFn` is in progress
 * @param {expression=} refreshOnRefreshed
 *  An expression that is called on the successful completion of `refreshFn`. The expression will receive an `eventArgs`
 *
 *   - `eventArgs.when` the date when the refresh completed
 *   - `eventArgs.model` the value returned by `refreshFn`
 */
    .directive("ccAutoRefreshFn", [function () {
        "use strict";

        return {
            restrict: "AE",
            scope: {
                refreshFn: "&", // OR supply fn as the html attribute 'cc-auto-refresh-fn'
                isPaused: "=?refreshPaused",
                interval: "=refreshInterval",
                model: "=refreshModel",
                isBusy: "=?refreshBusy",
                onRefreshed: "&refreshOnRefreshed"
            },
            controller: "ccAutoRefreshFnCtl"
        };
    }])
/**
 * @ngdoc controller
 * @name cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl
 *
 * @description
 *
 * `ccAutoRefreshFnCtl` provides the API for the `cc-auto-refresh-fn` directive. The controller exposes services
 * that make it convenient to create custom directives that extend the `cc-auto-refresh-fn` directive
 *
 * @property {number} interval The interval (milliseconds) for the refresh schedule (*readonly*)
 * @property {boolean} isDisabled Whether the directive is considered disabled (*readonly*)
 * @property {boolean} isVisible Whether the GUI (if any) is visible (*readonly*)
 * @property {boolean} isPaused Whether the schedule is paused (*read/write*)
 * @property {boolean} isRefreshing Whether a refresh is currently executing (*readonly*)
 *
 */
    .controller("ccAutoRefreshFnCtl", ["$interval", "$scope", "$attrs", "$q", "_ccAutoRefreshUtils",
        function ($interval, $scope, $attrs, $q, utils) {

            var intervalTimer,
                exPolicies;

            var self = this;
            var inflightRequestCancellors = [];

            var setScope = function (newCaches) {
                $scope.model = newCaches;
                return newCaches;
            };

            /**
             * @ngdoc method
             * @name ccAutoRefreshFnCtl#cancelRefresh
             * @methodOf cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl
             *
             * @description
             * Cancels the `refresh` method that might be executing
             */
            function cancelRefresh() {
                inflightRequestCancellors.forEach(function (cancellor) {
                    cancellor.resolve();
                });
                inflightRequestCancellors = [];
                $scope.isBusy = false;
            }

            function destroy() {
                setScope = angular.noop;
                cancelRefresh();
                stopRefreshSchedule();
            }

            function removeInstance(list, instance) {
                var index = list.indexOf(instance);
                if (index !== -1) {
                    list.splice(index, 1);
                }
                return index;
            }

            function publishRefreshedEvent(newCaches) {
                var eventArgs = {
                    when: new Date(),
                    caches: newCaches
                };
                $scope.onRefreshed({ eventArgs: eventArgs });
                return newCaches;
            }

            function initialise() {
                exPolicies = utils.resolveExPoliciesSvc();

                Object.defineProperties(self, {
                    interval: {
                        get: function () {
                            return parseInt($scope.interval, 10);
                        }
                    },
                    isDisabled: {
                        get: function () {
                            return $scope.$parent.$eval($attrs.ngDisabled);
                        }
                    },
                    isPaused: {
                        get: function () {
                            return $scope.isPaused;
                        },
                        set: function (val) {
                            $scope.isPaused = val;
                        }
                    },
                    isRefreshing: {
                        get: function () {
                            return inflightRequestCancellors.length > 0;
                        }
                    },
                    isVisible: {
                        get: function () {
                            if ($attrs.ngHide){
                                return !$scope.$parent.$eval($attrs.ngHide);
                            } else{
                                return true;
                            }
                        }
                    }
                });

                self.cancelRefresh = cancelRefresh;
                self.refresh = refresh;
                self.togglePause = togglePause;

                $scope.$on("$destroy", destroy);

                if ($scope.model == null) {
                    return refresh().finally(watchStateChanges);
                } else {
                    watchStateChanges();
                    return null;
                }
            }

            /**
             * @ngdoc method
             * @name ccAutoRefreshFnCtl#refresh
             * @methodOf cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl
             *
             * @description
             *     - Executes the function supplied by `refresh-fn` or `cc-autorefresh-fn`
             *     - Sets the return value to the scope field that the `refresh-model` expression identifies
             *     - executes any callback function supplied by `refresh-on-refreshed`
             */
            function refresh() {
                if (self.isDisabled) {
                    return $q.when(null);
                }
                $scope.isBusy = true;
                var requestCancellor = $q.defer();
                inflightRequestCancellors.push(requestCancellor);
                return $q.when(doRefresh())
                    .then(setScope)
                    .then(publishRefreshedEvent)
                    .catch(maybeStopSchedule)
                    .catch(exPolicies.promiseFinExPolicy)
                    .finally(function () {
                        $scope.isBusy = false;
                        removeInstance(inflightRequestCancellors, requestCancellor);
                    });


                function doRefresh() {
                    try{
                        var args = { cancellationToken: requestCancellor.promise };
                        if ($attrs.ccAutoRefreshFn) {
                            return $scope.$parent.$eval($attrs.ccAutoRefreshFn, args);
                        } else {
                            return $scope.refreshFn(args);
                        }
                    } catch (ex) {
                        return $q.reject(ex);
                    }
                }

                function maybeStopSchedule(ex) {
                    var formattedEx = exPolicies.httpFailureFormatter(ex);
                    if (!formattedEx.isHttpCancel) {
                        self.isPaused = true;
                        stopRefreshSchedule();
                    }
                    return $q.reject(ex);
                }
            }

            function resetRefreshSchedule() {
                stopRefreshSchedule();
                var interval = self.interval;
                if (interval && !self.isPaused) {
                    startRefreshSchedule(interval);
                }
            }

            function startRefreshSchedule(interval) {
                intervalTimer = $interval(refresh, interval);
            }

            function stopRefreshSchedule() {
                if (intervalTimer) {
                    $interval.cancel(intervalTimer);
                }
            }

            /**
             * @ngdoc method
             * @name ccAutoRefreshFnCtl#togglePause
             * @methodOf cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl
             *
             * @description
             * Pauses/resumes the refresh schedule
             */
            function togglePause() {
                self.isPaused = !self.isPaused;
            }

            function watchedState() {
                return {
                    interval: self.interval,
                    isPaused: self.isPaused
                };
            }

            function watchStateChanges() {
                $scope.$watch(watchedState, resetRefreshSchedule, true);

            }

            initialise();
        }]
);

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
/**
 * @ngdoc object
 * @name cc.autorefresh.ccAutoRefreshBtn.type:ccAutoRefreshDefaultTranslations
 *
 * @description
 * Default translations for the {@link cc.autorefresh.ccAutoRefreshBtn.directive:ccAutoRefreshBtn ccAutoRefreshBtn}
 * directive
 */
angular.module("cc.autorefresh.ccAutoRefreshBtn", ["cc.autorefresh.ccAutoRefreshFn"])
    .value("ccAutoRefreshDefaultTranslations", {
        resumeTitle: "Resume",
        pauseTitle: "Pause",
        cancelTitle: "Cancel refresh",
        refreshTitle: "Refresh now"
    })
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
 * For details on all the parameters that this directive accepts see
 * {@link cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn ccAutoRefreshFn}
 *
 * @scope
 * @param {expression} ccAutoRefreshFn An expression to schedule for execution.
 * @param {expression} refreshInterval
 *  Angular expression that determines the interval (milliseconds) that `refreshFn` will be executed.
 * @param {expression} refreshModel **Assignable** angular expression to data-bind the value returned by `refreshFn`.
 * @param {expression=} refreshTranslations An expression that returns overrides the default translations.
 */
    .directive("ccAutoRefreshBtn", ["ccAutoRefreshDefaultTranslations", function (defaultTranslations) {
        "use strict";

        return {
            restrict: "E",
            require: "ccAutoRefreshFn",
            transclude: true,
            replace: true,
            scope: true,
            templateUrl: "template/ccAutoRefreshBtn/ccAutoRefreshBtn.html",
            controller: ["$q", "$scope", "$attrs", "_ccAutoRefreshUtils", function ($q, $scope, $attrs, utils) {

                var exPolicies;

                function fetchTranslations() {
                    if (!$attrs.refreshTranslations) { return $q.when(defaultTranslations); }

                    return $q.when($scope.$eval($attrs.refreshTranslations))
                        .catch(function (ex) {
                            $scope.ctrl.isPaused = true;
                            return $q.reject(ex);
                        })
                        .catch(exPolicies.promiseFinExPolicy);
                }

                function initialise() {
                    exPolicies = utils.resolveExPoliciesSvc();
                    return fetchTranslations()
                        .then(function (translations) {
                            $scope.langs = translations;
                        });
                }

                initialise();
            }],
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
angular.module("template/ccAutoRefreshBtn/ccAutoRefreshBtn.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/ccAutoRefreshBtn/ccAutoRefreshBtn.html",
    "<div class=\"btn-group\" ng-show=\"ctrl.isVisible\">\n" +
    "    <button type=\"button\" class=\"btn btn-default\"\n" +
    "            ng-click=\"ctrl.togglePause()\" \n" +
    "            ng-disabled=\"ctrl.isDisabled || ctrl.isRefreshing\" \n" +
    "            title=\"{{ctrl.isPaused ? langs.resumeTitle : langs.pauseTitle}}\">\n" +
    "        <i class=\"glyphicon\" ng-class=\"{ \n" +
    "            'glyphicon-pause': !ctrl.isPaused, \n" +
    "            'glyphicon-play': ctrl.isPaused }\"></i>\n" +
    "    </button>\n" +
    "    <button type=\"button\" class=\"btn btn-default\" \n" +
    "            ng-click=\"ctrl.isRefreshing ? ctrl.cancelRefresh() : ctrl.refresh()\" \n" +
    "            ng-disabled=\"ctrl.isDisabled\" \n" +
    "            title=\"{{ctrl.isRefreshing ? langs.cancelTitle: langs.refreshTitle}}\"\n" +
    "            cc-transclude-append>\n" +
    "        <i class=\"glyphicon\" ng-class=\"{ \n" +
    "            'glyphicon-refresh': !ctrl.isRefreshing, \n" +
    "            'glyphicon-minus-sign': ctrl.isRefreshing }\"></i>\n" +
    "    </button>\n" +
    "</div>");
}]);
