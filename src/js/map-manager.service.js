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
                                    angular.forEach(geoJsonData.features, function (feature) {
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
