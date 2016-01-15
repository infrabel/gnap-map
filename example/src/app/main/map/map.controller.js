'use strict';

(function () {
    angular
        .module('examples')
        .controller('MainMapController', MainMapController);

    MainMapController.$inject = ['layerConfig', 'mapManager', 'settings'];

    function MainMapController(layerConfig, mapManager, settings) {
    	this.layers = layerConfig.getDataLayers();
    	this.mapManagerSettings = mapManager.settings;
    	this.settings = settings;
    }
})();
