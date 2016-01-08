/**
 * @desc Factory which returns the layer configuration object for the selected mapTech.
 */
(function () {
    'use strict';

    angular
		.module('gnapMap')
		.provider('layerConfig', layerConfigProvider);

    function layerConfigProvider() {

        ////////// Provider

        var _layerConfig;

        /* jshint validthis:true */
        this.setLayerConfig = function (layerConfig) { _layerConfig = layerConfig; };
        this.$get = layerConfigFactory;

        layerConfigFactory.$inject = ['$log'];

        ////////// Factory

        function layerConfigFactory($log) {
            var _layerConfigDynamic;

            return {
                setLayerConfigDynamic: function (layers) { _layerConfigDynamic = layers; }, // Should be called during run phase
                getDataLayers: getDataLayers
            };

            function getDataLayers() {
                if (_layerConfig || _layerConfigDynamic) {
                    return angular.merge({}, _layerConfig || {}, _layerConfigDynamic || {});
                } else {
                    $log.log('No layers were configured. Use the \'setLayerConfig\' function at config time and optionally \'setLayerConfigDynamic\' at run time.');
                    return {};
                }
            }
        }
    }
})();