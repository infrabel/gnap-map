/**
 * @desc Defines the module.
 */
(function () {
	'use strict';
	
    angular.module('gnapMap', [
        'gnap',
        'ui.select'
    ]);
}());

/**
 * @desc Provides the layer configuration.
 */
(function () {
    'use strict';

    angular
		.module('gnapMap')
		.provider('layerConfig', layerConfigProvider);

    function layerConfigProvider() {

        ////////// Provider

        var _dataLayers;

        /* jshint validthis:true */
        this.setDataLayers = function (dataLayers) { _dataLayers = dataLayers; };
        this.$get = layerConfigFactory;

        layerConfigFactory.$inject = ['$log'];

        ////////// Factory

        function layerConfigFactory($log) {
            return {
                setDataLayers: function (dataLayers) { _dataLayers = angular.merge(_dataLayers || {}, dataLayers) },
                getDataLayers: getDataLayers
            };

            function getDataLayers() {
                if (!_dataLayers) {
                    $log.log('No layers were configured. Use the \'setDataLayers\' function at config time, or to expand it at run time.');
                    return {};
                } else {
                    return _dataLayers;
                }
            }
        }
    }
})();

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

/**
 * @desc Provides GeoJson data from a REST endpoint - either in bounds, or all data of a given type.
 */
(function () {
    'use strict';

	angular
		.module('gnapMap')
		.provider('mapGeoData', mapGeoDataProvider);

	function mapGeoDataProvider() {

	    ////////// Provider

	    var _endpointUri = 'http://localhost/';

	    /* jshint validthis:true */
	    this.setEndpointUri = function (endpointUri) { _endpointUri = endpointUri; };
	    this.$get = mapGeoDataFactory;

        ////////// Factory

	    mapGeoDataFactory.$inject = ['$http', 'mapTech'];

	    function mapGeoDataFactory($http, mapTech) {
	        var constructResourceUriFunction = function (dataLayer, all) { return dataLayer.resourceUri + (all ? '/all' : ''); };
	        var constructParamsFunction = function (dataLayer) { return {}; };

	        ////////// Service declaration

	        return {
	            setConstructResourceUriFunction: function (func) { constructResourceUriFunction = func; }, // Should be set during run phase
	            setConstructParamsFunction: function (func) { constructParamsFunction = func; }, // Should be set during run phase
	            getInBounds: getInBounds,
	            getAll: getAll
	        };

	        ////////// Service function implementations

	        function getInBounds(dataLayer, bounds) {
	            var resourceUri = _endpointUri + constructResourceUriFunction(dataLayer);

	            var params = angular.extend({}, constructParamsFunction(dataLayer), bounds);
	            if (!mapTech.isDefaultCoordinateSystem()) {
	                params.result = mapTech.getCoordinateSystem();
	            }

	            return $http.get(resourceUri, { params: params });
	        }

	        function getAll(dataLayer) {
	            var resourceUri = _endpointUri + constructResourceUriFunction(dataLayer, true);

	            var params = {};
	            if (!mapTech.isDefaultCoordinateSystem()) {
	                params.result = mapTech.getCoordinateSystem();
	            }

	            return $http.get(resourceUri, { params: params });
	        }
	    }
	}
})();

/**
 * @desc Manages GeoJson data independently of the map view technology.
 */
 (function () {
    'use strict';

    angular
		.module('gnapMap')
		.provider('mapManager', mapManagerProvider);
    
    function mapManagerProvider() {

        ////////// Provider

        var _mapState = 'main.map';
        var _mapInfoState = 'main.map.info';
        var _translationLocationBase = 'main.common.';

        /* jshint validthis:true */
        this.setMapState = function (mapState) { _mapState = mapState; };
        this.setMapInfoState = function (mapInfoState) { _mapInfoState = mapInfoState; };
        this.setTranslationLocationBase = function (translationLocationBase) { _translationLocationBase = translationLocationBase; };
        this.$get = mapManagerFactory;

        mapManagerFactory.$inject = ['$rootScope', '$timeout', '$log', '$state', '$stateParams', 'mapGeoData', 'layerConfig'];

        ////////// Factory

        function mapManagerFactory($rootScope, $timeout, $log, $state, $stateParams, mapGeoData, layerConfig) {

            ////////// Private variables

            var dataLayers = layerConfig.getDataLayers(); // Definition of datalayers.

            var map = {};

            var selection = {
                type: null,
                position: null,
                details: null // Will contain details for the selected item, is watched
            };

            var featureToTrack = {
                type: null,
                id: null
            };

            var loadingStatus = {
                featuresLoading: 0,
                featuresAdding: 0
            };

            var settings = {
                skipCache: false
            };

            var noFunctionSetFunction = function () { $log.log('No implementation for this action was set by the selected map view!'); };
            var mapView = { // Must be set by map view during activation!
                _addGeoJsonData: noFunctionSetFunction,
                _removeGeoJsonData: noFunctionSetFunction,
                _centerOnFeature: noFunctionSetFunction,

                addCustomKml: noFunctionSetFunction,
                removeCustomKml: noFunctionSetFunction,
                showInfoWindow: noFunctionSetFunction,
                closeInfoWindow: noFunctionSetFunction,
                resizeMap: noFunctionSetFunction,
                activateDrawingMode: noFunctionSetFunction,
                getGeoJson: noFunctionSetFunction,

                viewPort: {
                    getZoomLevel: noFunctionSetFunction,
                    setZoomLevel: noFunctionSetFunction,
                    getCenter: noFunctionSetFunction,
                    getCenterWgs84: noFunctionSetFunction,
                    setCenter: noFunctionSetFunction,
                    setCenterWgs84: noFunctionSetFunction,
                    getBounds: noFunctionSetFunction,
                    getBoundsWgs84: noFunctionSetFunction,
                    setBounds: noFunctionSetFunction,
                    setBoundsWgs84: noFunctionSetFunction,
                    containsBounds: noFunctionSetFunction,
                    containsCoordinate: noFunctionSetFunction
                }
            };

            ////////// Watches and event handlers

            $rootScope.$on('refreshDetailData', refreshDetailData);

            ////////// Service interface

            return {
                dataLayers: dataLayers,
                selection: selection,

                loadingStatus: loadingStatus,

                fetchDataInBounds: fetchDataInBounds,
                fetchAllDataInBounds: fetchAllDataInBounds,

                clearData: clearData,
                clearAllData: clearAllData,

                mapFunctionIsSupported: function (func) { return func !== noFunctionSetFunction; },
                mapView: mapView,

                events: {
                    onInfoWindowClosed: onInfoWindowClosed,
                    onDataItemClicked: onDataItemClicked,
                    onCustomShapeCreated: onCustomShapeCreated,
                    onMultipleItemsSelected: onMultipleItemsSelected
                },

                setMap: setMap,
                getMap: getMap,

                settings: settings,
                config: {
                    mapState: _mapState,
                    mapInfoState: _mapInfoState,
                    translationLocationBase: _translationLocationBase
                },

                trackFeature: trackFeature
            };

            ////////// Service function implementations

            function fetchAllDataInBounds(refresh) {
                if (!mapView.viewPort.getBounds()) {
                    return;
                }
                angular.forEach(dataLayers, function (dataLayer) {
                    fetchDataInBounds(dataLayer, refresh);
                });
            }

            function clearAllData() {
                angular.forEach(dataLayers, function (dataLayer) {
                    clearData(dataLayer);
                });
            }

            function onInfoWindowClosed() {
                if ($state.is(_mapInfoState)) {
                    $state.go(_mapState);
                }
            }

            function onDataItemClicked(type, id) {
                if ($state.is(_mapInfoState)) {
                    // We're still on a previous info state: pop first!
                    $state.go(_mapState).then(function () {
                        goToInfoState(type, id);
                    });
                } else {
                    goToInfoState(type, id);
                }
            }

            function onCustomShapeCreated(wkt, removeFunction) {
                $rootScope.$emit('custom-shape-created', wkt, removeFunction);
            }

            function onMultipleItemsSelected(selectedItems) {
                $rootScope.$emit('items-selected', selectedItems);
            }

            // Use this function to track a feature after it is (re)loaded.
            function trackFeature(type, id)
            {
                featureToTrack.type = type;
                featureToTrack.id = id;
            }

            ////////// Other private functions

            /**
             * Either use as fetchDataInBounds(dataLayer:string|object[, refresh:boolean[, callbackFunction:function]]) or
             * fetchDataInBounds(dataLayer:string|object[, options:object]).
             * options should be an object which can contain three properties:
             * - refresh:boolean  If true, clears all data of this type, always reloads it for these bounds, and appends all data to the map.
             *                    If false, only loads data in case it wasn't already loaded for these bounds, and appends new data to the map.
             * - append:boolean   If true, always reloads data for these bounds even if it was already fetched, and appends new data to the map.
             * - callback:function   Call this function after data has been appended to the map.
             */
            function fetchDataInBounds(dataLayer, options, callback) {
                var refresh = (options === true);
                var append = false;
                var callbackFunction = callback;

                if (options !== null && typeof options === 'object') {
                    refresh = options.refresh;
                    append = options.append;
                    callbackFunction = options.callback;
                }

                if (!mapView.viewPort.getBounds()) {
                    return;
                }

                if (typeof dataLayer === 'string') {
                    dataLayer = dataLayers[dataLayer];
                }

                // Check whether we need to use the default shouldShowFunction
                if (typeof dataLayer.shouldShowFunction === 'undefined') {
                    dataLayer.shouldShowFunction = defaultShouldShow;
                }

                var shouldShow = dataLayer.shouldShowFunction(dataLayer, mapView.viewPort.getZoomLevel(), dataLayers);

                if (!shouldShow || refresh) {
                    clearData(dataLayer);
                }

                if (shouldShow && (!checkWhetherAlreadyFetched(dataLayer) || dataLayer.getLabelStyleFunction || append || dataLayer.moving)) {
                    loadingStatus.featuresLoading++;
                    try {
                        var fetchDataFunction = dataLayer.cache && !settings.skipCache ?
                            fetchDataInBoundsFromCacheOrServer :
                            fetchDataInBoundsFromServer;

                        fetchDataFunction(dataLayer, refresh).finally(function () {
                            loadingStatus.featuresLoading--;

                            if (typeof callbackFunction === 'function') {
                                callbackFunction();
                            }
                        });
                    } catch (ex) {
                        loadingStatus.featuresLoading--;
                    }
                }
            }

            function fetchDataInBoundsFromServer(dataLayer, refresh) {
                return mapGeoData.getInBounds(dataLayer, mapView.viewPort.getBoundsWgs84()).then(function (result) {
                    // Perform additional check - the layer might have been switched off while retrieving
                    var zoomLevel = mapView.viewPort.getZoomLevel();
                    if (dataLayer.shouldShowFunction(dataLayer, zoomLevel, dataLayers)) {
                        addToMap(result.data, refresh);
                        dataLayer._zoom = zoomLevel; // Store the zoom level at which these features were added
                    }
                });
            }

            function fetchDataInBoundsFromCacheOrServer(dataLayer, refresh) {
                if (typeof dataLayer._cache === 'undefined') {
                    /// Fetch from server and add to cache
                    return mapGeoData.getAll(dataLayer).then(function (result) {
                        dataLayer._cache = result.data;
                        var zoomLevel = mapView.viewPort.getZoomLevel();
                        // Perform additional check - the layer might have been switched off while retrieving
                        if (dataLayer.shouldShowFunction(dataLayer, zoomLevel, dataLayers)) {
                            addDataInBoundsFromCache(dataLayer._cache, dataLayer.itemType, refresh);
                            dataLayer._zoom = zoomLevel; // Store the zoom level at which these features were added
                        }
                    });
                } else {
                    return $timeout(function () { addDataInBoundsFromCache(dataLayer._cache, dataLayer.itemType, refresh); });
                }
            }

            function addDataInBoundsFromCache(data, type, refresh) {
                var geoJsonInBounds = {
                    type: 'FeatureCollection',
                    features: []
                };

                var extendedViewPortBounds = mapView.viewPort.getBounds(0.5);

                angular.forEach(data.features, function (feature) {
                    if (!feature.geometry || !feature.geometry.coordinates) {
                        throw new Error('Feature to add does not have \'geometry\' or \'geometry.coordinates\'');
                    }

                    if (mapView.viewPort.containsCoordinate(feature.geometry.coordinates, extendedViewPortBounds)) {
                        geoJsonInBounds.features.push(feature);
                    }
                });

                addToMap(geoJsonInBounds, refresh);
            }

            function defaultShouldShow(dataLayer, zoom, dataLayers) {
                return dataLayer.displayLayer && zoom >= dataLayer.minZoomLevel &&
                    (typeof dataLayer.maxZoomLevel === 'undefined' || dataLayer.maxZoomLevel === null || zoom <= dataLayer.maxZoomLevel);
            }

            function clearData(dataLayer) {
                mapView._removeGeoJsonData(dataLayer.itemType);
                dataLayer._fetchedItems = [];
            }

            function checkWhetherAlreadyFetched(dataLayer) {
                if (dataLayer.alwaysRefresh || (dataLayer.refreshOnZoomChange && dataLayer._zoom !== mapView.viewPort.getZoomLevel())) {
                    clearData(dataLayer);
                    return false;
                }

                if (!dataLayer.hasOwnProperty('_fetchedItems')) {
                    dataLayer._fetchedItems = [];
                }

                var alreadyFetched = false;

                dataLayer._fetchedItems.forEach(function (fetchedBounds) {
                    if (mapView.viewPort.isInBounds(fetchedBounds)) {
                        alreadyFetched = true;
                    }
                });

                if (alreadyFetched) {
                    return true;
                }
                else {
                    // If we got here, it means we hadn't already fetched the items in these bounds.
                    // Do so now: return false, and already add the bounds to the fetched items.
                    dataLayer._fetchedItems.push(mapView.viewPort.getBounds());

                    return false;
                }
            }

            function addToMap(data, redraw) {
                $timeout(function () {
                    loadingStatus.featuresAdding++;
                }).then(function () {
                    $timeout(function () {
                        try {
                            if (data.features === null || data.features === undefined) {
                                return;
                            }
                            var newFeatureCount = data == null ? 0 : data.features.length;
                            if (newFeatureCount > 0) {
                                var featureType = data.features[0].properties.type; // We expect every feature we add to have a 'type' property

                                mapView._addGeoJsonData(data, featureType, redraw);

                                if (featureToTrack && featureToTrack.type && featureToTrack.type === featureType && featureToTrack.id) {
                                    angular.forEach(data.features, function (feature) {
 	                                    if(feature.id && feature.type && feature.id ===  featureToTrack.type.charAt(0).toUpperCase() + featureToTrack.type.slice(1) + '_' + featureToTrack.id) {
                                            mapView._centerOnFeature(feature);
                                        }
                                    });
                                }

                                // Display info
                                $log.log('Added ' + newFeatureCount + ' ' + featureType + 's.');
                            }
                        }
                        finally {
                            loadingStatus.featuresAdding--;
                        }
                    });
                });
            }

            function goToInfoState(type, id) {
                var dataLayer = dataLayers[type];

                if (!dataLayer || dataLayer.hasNoDetails) {
                    return; // Some types may be ignored
                }

                //Check if not an integer
                if (id !== parseInt(id, 10)) {
                    var indexOfUnderScore = id.indexOf('_');
                    if (indexOfUnderScore > -1) {
                        id = parseInt(id.substr(indexOfUnderScore + 1));
                    }
                }

                var parameters = {
                    type: type,
                    id: id
                };

                $state.go(_mapInfoState, parameters);
            }

            function setMap(mmap) {
                map = mmap;
            }

            function getMap() {
                return map;
            }

            function refreshDetailData() {
                if ($state.is(_mapInfoState)) {
                    onDataItemClicked($stateParams.type, $stateParams.id);
                }
            }
        }
    }
})();

/**
 * @desc A GNaP menu item directive, to be used right before the locale selector, 
 * which allows the user to choose a registered map view technology.
 */
(function () {
    'use strict';
    
    angular
        .module('gnapMap')
        .directive('mapTechSelector', mapTechSelector);

    mapTechSelector.$inject = ['mapTech'];

    function mapTechSelector(mapTech) {
        /* jshint ignore:start */
        return {
            restrict: 'A',
            scope: {},
            link: link,
            template: "<a data-toggle=\"dropdown\" class=\"dropdown-toggle\">\n" +
            "    <span>\n" +
            "        {{mapTech.displayName}}\n" +
            "    <\/span>\n" +
            "    <i class=\"icon-caret-down\"><\/i>\n" +
            "<\/a>\n" +
            "\n" +
            "<ul class=\"user-menu pull-right dropdown-menu dropdown-default dropdown-caret dropdown-close\">\n" +
            "    <li ng-repeat=\"mapTech in mapTechList\">\n" +
            "        <a ng-click=\"setMapTech(mapTech.key)\">\n" +
            "            {{mapTech.displayName}}\n" +
            "        <\/a>\n" +
            "    <\/li>\n" +
            "<\/ul>\n" +
            ""
        };
        /* jshint ignore:end */

        function link(scope) {
            scope.mapTechList = mapTech.getAllMapTech();

            scope.mapTech = mapTech.getSelectedMapTech();

            scope.setMapTech = function (key) {
                mapTech.setSelectedMapTechKey(key);
            };
        }
    }
})();

/**
 * @desc Manages the selected map technology.
 */
(function () {
    'use strict';

    angular
		.module('gnapMap')
        .constant('defaultCoordinateSystem', 'wgs84')
		.provider('mapTech', mapTechProvider);

    function mapTechProvider() {

        ////////// Provider

        var _mapTech = {};
        var _defaultMapTechKey = null;

        /* jshint validthis:true */
        this.registerMapTech = registerMapTech;
        this.$get = mapTechFactory;

        function registerMapTech(mapTech) {
            if (isEmpty(_mapTech)) {
                _defaultMapTechKey = mapTech.key;
            }

            _mapTech[mapTech.key] = mapTech;
        }

        mapTechFactory.$inject = ['$window', '$log', 'localStorageService', 'defaultCoordinateSystem'];

        ////////// Factory

        function mapTechFactory($window, $log, localStorageService, defaultCoordinateSystem) {
            var selectedMapTechKey = null;

            return {
                getAllMapTech: getAllMapTech,
                getMapTech: getMapTech,
                getSelectedMapTech: getMapTech,
                getSelectedMapTechKey: getSelectedMapTechKey,
                setSelectedMapTechKey: setSelectedMapTechKey,
                is: is,
                isDefaultCoordinateSystem: isDefaultCoordinateSystem,
                getCoordinateSystem: getCoordinateSystem
            };

            function getAllMapTech() {
                if (isEmpty(_mapTech)) {
                    $log.log('No map technology modules were registered. Install and reference a module (e.g. gnap-map-google).');
                }
                
                return _mapTech;
            }

            function getMapTech(key) {
                if (!key) {
                    return getMapTech(getSelectedMapTechKey());
                }

                if (!_mapTech[key]) {
                    $log.log('Map technology \'' + key + '\' was not registered. Install and reference the module (gnap-map-' + key + ').');
                }

                return _mapTech[key];
            }

            function getSelectedMapTechKey() {
                return selectedMapTechKey || localStorageService.get('map-tech') || _defaultMapTechKey;
            }

            function setSelectedMapTechKey(key) {
                selectedMapTechKey = key;
                localStorageService.set('map-tech', key);
                $window.location.reload();
            }

            function is(key) {
                return getSelectedMapTechKey() === key;
            }

            function getCoordinateSystem() {
                var selectedMapTech = getMapTech();
                if (selectedMapTech) {
                    return selectedMapTech.coordinateSystem;
                }

                return defaultCoordinateSystem;
            }

            function isDefaultCoordinateSystem() {
                return getCoordinateSystem() === defaultCoordinateSystem;
            }
        }

        function isEmpty(obj) {
            for(var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    return false;
                }
            }

            return true;
        }
    }
})();

// Source: https://github.com/angular/angular.js/blob/master/src/Angular.js

/* jshint ignore:start */
(function () {
    'use strict';

    if (!angular.merge) {
        angular.merge = merge;
    }

    if (!angular.isRegExp) {
        angular.isRegExp = isRegExp;
    }

    if (!angular.isElement) {
        angular.isElement = isElement;
    }

    /**
    * @ngdoc function
    * @name angular.merge
    * @module ng
    * @kind function
    *
    * @description
    * Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
    * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
    * by passing an empty object as the target: `var object = angular.merge({}, object1, object2)`.
    *
    * Unlike {@link angular.extend extend()}, `merge()` recursively descends into object properties of source
    * objects, performing a deep copy.
    *
    * @param {Object} dst Destination object.
    * @param {...Object} src Source object(s).
    * @returns {Object} Reference to `dst`.
    */
    function merge(dst) {
        return baseExtend(dst, [].slice.call(arguments, 1), true);
    }

    /**
     * Determines if a value is a regular expression object.
     *
     * @private
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a `RegExp`.
     */
    function isRegExp(value) {
        return Object.prototype.toString.call(value) === '[object RegExp]';
    }

    /**
     * @ngdoc function
     * @name angular.isElement
     * @module ng
     * @kind function
     *
     * @description
     * Determines if a reference is a DOM element (or wrapped jQuery element).
     *
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
     */
    function isElement(node) {
        return !!(node &&
          (node.nodeName  // we are a direct element
          || (node.prop && node.attr && node.find)));  // we have an on and find method part of jQuery API
    }

    function baseExtend(dst, objs, deep) {
        var h = dst.$$hashKey;

        for (var i = 0, ii = objs.length; i < ii; ++i) {
            var obj = objs[i];
            if (!angular.isObject(obj) && !angular.isFunction(obj)) continue;
            var keys = Object.keys(obj);
            for (var j = 0, jj = keys.length; j < jj; j++) {
                var key = keys[j];
                var src = obj[key];

                if (deep && angular.isObject(src)) {
                    if (angular.isDate(src)) {
                        dst[key] = new Date(src.valueOf());
                    } else if (angular.isRegExp(src)) {
                        dst[key] = new RegExp(src);
                    } else if (src.nodeName) {
                        dst[key] = src.cloneNode(true);
                    } else if (angular.isElement(src)) {
                        dst[key] = src.clone();
                    } else {
                        if (!angular.isObject(dst[key])) dst[key] = angular.isArray(src) ? [] : {};
                        baseExtend(dst[key], [src], true);
                    }
                } else {
                    dst[key] = src;
                }
            }
        }

        setHashKey(dst, h);
        return dst;
    }


    /**
     * Set or clear the hashkey for an object.
     * @param obj object
     * @param h the hashkey (!truthy to delete the hashkey)
     */
    function setHashKey(obj, h) {
        if (h) {
            obj.$$hashKey = h;
        } else {
            delete obj.$$hashKey;
        }
    }

})();
/* jshint ignore:end */
