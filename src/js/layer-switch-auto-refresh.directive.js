/**
 * @desc A directive to toggle a layer on or off, and when on, refresh it with a given interval.
 */
(function () {
    'use strict';

    angular
        .module('gnapMap')
        .directive('layerSwitchAutoRefresh', layerSwitchAutoRefresh);

    layerSwitchAutoRefresh.$inject = ['$interval', 'mapManager'];

    function layerSwitchAutoRefresh($interval, mapManager) {

        var translationBase = mapManager.config.translationLocationBase;

        return {
            restrict: 'AE',
            link: link,
            scope: {
                layer: '@',
                layerRefresh: '=?',
                layerAppend: '=?',
                linkedLayers: '@',
                linkedLayersRefresh: '=?',
                linkedLayersAppend: '=?',
                interval: '=?',
                alwaysEnabled: '=?',
                hideIcon: '=?',
                hideLabel: '=?'
            },
            template: '' +
'<div ng-class="{ \'translucent\': vm.muteDisplayOption() }" class="layer-switch">' +
'    <label ng-if="vm.layer.iconUrl && !hideIcon" for="{{vm.layer.itemType}}"><img style="width: 20px" ng-src="{{vm.layer.iconUrl}}" /></label>'+
'    <input class="ace ace-switch ace-switch-3" type="checkbox" id="{{vm.layer.itemType}}" ng-model="vm.layer.displayLayer">' +
'    <span class="lbl"></span>' +
'    <label ng-hide="hideLabel" ng-class="{ \'text-muted\': vm.muteDisplayOption() }" for="{{vm.layer.itemType}}">'+
'        {{(vm.layer.translationId || \'' + translationBase + '\' + vm.layer.itemType + \'s\') | translate}}'+
'    </label>'+
'</div>'
        };

        function link(scope, iElement, iAttrs, controller) {
            var vm = scope.vm = {};
            vm.layer = mapManager.dataLayers[scope.layer];
            vm.muteDisplayOption = muteDisplayOption;

            var canceller;

            function refresh() {
                if (!vm.layer.displayLayer) {
                    return;
                }

                mapManager.fetchDataInBounds(vm.layer, {
                    refresh: (scope.layerRefresh === 'true' || scope.layerRefresh === true) ? true : false,
                    append: (scope.layerAppend === 'true' || scope.layerAppend === true) ? true : false
                });

                if (scope.linkedLayers) {
                    angular.forEach(scope.linkedLayers.split(','), function (linkedLayer) {
                        mapManager.fetchDataInBounds(mapManager.dataLayers[linkedLayer], {
                            refresh: (scope.linkedLayersRefresh === 'true' || scope.linkedLayersRefresh === true) ? true : false,
                            append: (scope.linkedLayersAppend === 'true' || scope.linkedLayersAppend === true) ? true : false
                        });
                    });
                }
            }

            function reInitializeTimer() {
                stopTimer();
                
                if (vm.layer.displayLayer) {
                    refresh();
                    canceller = $interval(refresh, scope.interval || 5000);
                } else {
                    mapManager.fetchDataInBounds(vm.layer);
                }
            }
            
            function stopTimer() {
                if (canceller) {
                    $interval.cancel(canceller);
                    canceller = null;
                }
            }

            function muteDisplayOption() {
                return !scope.alwaysEnabled && mapManager.mapView.viewPort.getZoomLevel() < vm.layer.minZoomLevel;
            }

            scope.$watch(function () { return scope.interval; }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    reInitializeTimer();
                }
            });

            scope.$watch(function () { return vm.layer.displayLayer; }, function () {
                reInitializeTimer();
            });
            
            iElement.on('$destroy', function () {
                stopTimer();
            });
        }
    }
})();
