'use strict';

(function () {
    angular
        .module('examples')
        .controller('MainMapController', MainMapController);

    MainMapController.$inject = ['mapManager', 'settings'];

    function MainMapController(mapManager, settings) {
    	this.mapManagerSettings = mapManager.settings;
    	this.settings = settings;
    }
})();
