/**
 * @desc Service which provides map measurement and POI data.
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