angular.module('cc.autorefresh.demo').controller('AutoRefreshBtnDemoCtrl', function ($q, $http) {
    'use strict';

    var vm = this;

    function refreshList(cancellationToken) {
        var request = {
            url: '/items',
            method: 'GET',
            timeout: cancellationToken
        };
        return $http(request).then(function (response) {
            return response.data;
        });
    }

    function setLastRefreshed(list, eventArgs) {
        list.lastRefresh = eventArgs.when;
    }

    function initialise() {
        vm.refreshList = refreshList;

        vm.lists = [{
                interval: 5000,
                title: 'List 1',
                data: ['Item 0'],
                lastRefresh: new Date()
            }, {
                interval: 5000,
                title: 'List 2',
                data: ['Item 0'],
                lastRefresh: new Date()
            }];
        vm.lists[0].setLastRefreshed = setLastRefreshed.bind(null, vm.lists[0]);
        vm.lists[1].setLastRefreshed = setLastRefreshed.bind(null, vm.lists[1]);
    }

    initialise();
})
    .run(function ($httpBackend) {

        var counter = 0;
        // fakes a backend
        $httpBackend.whenGET('/items').respond(function () {
            return  [
                200,
                JSON.stringify(['Item ' + (++counter)]),
                {},
                'OK'
            ];
        });
    });