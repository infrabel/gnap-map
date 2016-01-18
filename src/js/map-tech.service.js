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
                return selectedMapTechKey || localStorageService.get('mapTech') || _defaultMapTechKey;
            }

            function setSelectedMapTechKey(key) {
                selectedMapTechKey = key;
                localStorageService.set('mapTech', key);
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
