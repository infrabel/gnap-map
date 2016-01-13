/**
 * @desc Factory which returns the layer configuration object for the selected mapTech.
 */
(function () {
    'use strict';

    angular
		.module('examples')
		.factory('settings', settings);
        
    var _settings = {
        iconUrl: 'https://dl.dropboxusercontent.com/u/10093725/mapicons/brown/restaurant/restaurant.png',
        useCache: true
    };

    function settings() {
        return  _settings;
    }
})();