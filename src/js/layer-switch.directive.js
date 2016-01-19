/**
 * @desc A directive to toggle a layer on or off.
 */
(function () {
    'use strict';

    angular
        .module('gnapMap')
        .directive('layerSwitch', layerSwitch);

    layerSwitch.$inject = ['mapManager'];

    function layerSwitch(mapManager) {

        var translationBase = mapManager.config.translationLocationBase;

        return {
            restrict: 'AE',
            link: link,
            scope: {
                layer: '@',
                linkedLayers: '@',
                alwaysEnabled: '=?',
                hideIcon: '=?',
                hideLabel: '=?'
            },
            template: ''+
'<span ng-class="{ \'translucent\': vm.muteDisplayOption() }" class="layer-switch">'+
'    <label ng-if="vm.layer.iconUrl && !hideIcon" for="{{vm.layer.itemType}}"><img style="width: 20px" ng-src="{{vm.layer.iconUrl}}" /></label>'+
'    <input class="ace ace-switch ace-switch-3" type="checkbox" id="{{vm.layer.itemType}}" ng-model="vm.layer.displayLayer" ng-change=\'vm.fetchLayerDataInBounds()\'>'+
'    <span class="lbl"></span>'+
'    <label ng-hide="hideLabel" ng-class="{ \'text-muted\': vm.muteDisplayOption() }" for="{{vm.layer.itemType}}">'+
'        {{(vm.layer.translationId || \'' + translationBase + '\' + vm.layer.itemType + \'s\') | translate}}'+
'    </label>'+
'</span>'
        };

        function link(scope, iElement, iAttrs, controller) {
            var vm = scope.vm = {};
            vm.layer = mapManager.dataLayers[scope.layer];
            vm.fetchLayerDataInBounds = fetchLayerDataInBounds;
            vm.muteDisplayOption = muteDisplayOption;

            ////////// Scope method implementations

            function fetchLayerDataInBounds() {
                mapManager.fetchDataInBounds(scope.layer);

                if (iAttrs.linkedLayers) {
                    angular.forEach(iAttrs.linkedLayers.split(','), function (linkedLayer) {
                        mapManager.fetchDataInBounds(mapManager.dataLayers[linkedLayer]);
                    });
                }
            }

            function muteDisplayOption() {
                return !scope.alwaysEnabled && mapManager.mapView.viewPort.getZoomLevel() < vm.layer.minZoomLevel;
            }
        }
    }
})();
