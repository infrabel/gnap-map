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
