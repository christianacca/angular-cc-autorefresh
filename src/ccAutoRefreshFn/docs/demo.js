angular.module("cc.autorefresh.demo").controller("AutoRefreshFnDemoCtrl", function ($q, $timeout) {
    "use strict";

    var counter = 0,
        vm = this;

    function refreshList(){
        // simulate async
        return $timeout(function(){
            return ["Item " + (++counter), "Item " + (++counter)];
        }, 500);
    }

    function setLastRefreshed(eventArgs){
        vm.lastRefresh = eventArgs.when;
    }

    function initialise(){
        vm.refreshList = refreshList;
        vm.setLastRefreshed = setLastRefreshed;

        vm.refreshOpts = {
            interval: 2000,
            paused: false
        };
        vm.list = [];
    }

    initialise();
});
