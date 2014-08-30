/**
 * @ngdoc overview
 * @name cc.autorefresh
 * @description
 * <p class='lead'>Collection of directives and controllers for scheduling a routine to run at intervals</p>
 * 
 * ## {@link cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn ccAutoRefreshFn}
 * 
 * - The directive for those scenarios where you **do not need a GUI** but still require regular refresh of a value
 * 
 * ## {@link cc.autorefresh.ccAutoRefreshFn.controller:ccAutoRefreshFnCtl ccAutoRefreshFnCtl}
 *
 * - Controller to create a **custom directive** that extends 
 *   {@link cc.autorefresh.ccAutoRefreshFn.directive:ccAutoRefreshFn ccAutoRefreshFn} (eg with a GUI)
 * - See {@link cc.autorefresh.ccAutoRefreshBtn.directive:ccAutoRefreshBtn ccAutoRefreshBtn} for an example of a
 *   custom extension directive that uses this controller
 *   
 * ## {@link cc.autorefresh.ccAutoRefreshBtn.directive:ccAutoRefreshBtn ccAutoRefreshBtn}
 * 
 * - The directive provides a button for the user to pause, trigger a refresh and cancel a refresh that might be 
 *   taking to long
 */