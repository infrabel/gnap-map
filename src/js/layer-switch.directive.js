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
            scope: true,
            template: ''+
'<span ng-class="{ \'translucent\': muteDisplayOption() }" class="layer-switch">'+
'    <label ng-if="layer.iconUrl" for="{{layer.itemType}}"><img style="width: 20px" ng-src="{{layer.iconUrl}}" /></label>'+
'    <input class="ace ace-switch ace-switch-3" type="checkbox" id="{{layer.itemType}}" ng-model="layer.displayLayer" ng-change=\'fetchLayerDataInBounds()\'>'+
'    <span class="lbl"></span>'+
'    <label ng-class="{ \'text-muted\': muteDisplayOption() }" for="{{layer.itemType}}">'+
'        {{(layer.translationId || \'' + translationBase + '\' + layer.itemType + \'s\') | translate}}'+
'    </label>'+
'</span>'
        };

        function link(scope, iElement, iAttrs, controller) {
            scope.layer = mapManager.dataLayers[iAttrs.layer];
            scope.alwaysEnabled = iAttrs.alwaysEnabled;

            scope.fetchLayerDataInBounds = fetchLayerDataInBounds;
            scope.muteDisplayOption = muteDisplayOption;

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
                return !scope.alwaysEnabled && mapManager.mapView.viewPort.getZoomLevel() < scope.layer.minZoomLevel;
            }
        }
    }
})();
