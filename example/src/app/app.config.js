'use strict';

(function () {
    angular
        .module('examples')
        .config(urlRouterConfiguration)
        .config(titleConfiguration)
        .config(authConfiguration)
        .config(gnapMapConfiguration)
        .run(handleStateChangeError)
        .run(gnapMapRun);

    var defaultPage = '/map';

    titleConfiguration.$inject = ['titleServiceProvider'];

    function titleConfiguration(titleServiceProvider) {
        titleServiceProvider.setDefaultTitle({ text: '' });
        titleServiceProvider.setSeparator('-');

        titleServiceProvider.setPrefix({ text: 'GNaP Map Examples &raquo;' });
        titleServiceProvider.setSuffix({ text: '' });
    }

    urlRouterConfiguration.$inject = ['$urlRouterProvider'];

    function urlRouterConfiguration($urlRouterProvider) {
        // when there is an empty route, redirect to the default page
        $urlRouterProvider.when('', defaultPage)
                          .when('/', defaultPage);

        // when no matching route found redirect to error 404
        $urlRouterProvider.otherwise('/notfound');
    }

    authConfiguration.$inject = ['$httpProvider'];

    function authConfiguration($httpProvider) {
        $httpProvider.interceptors.push('authenticationInterceptor');
    }
    
    gnapMapConfiguration.$inject = ['mapManagerProvider', 'layerConfigProvider', 'mapGeoDataProvider', 'mapTechGoogleProvider'];
    
    function gnapMapConfiguration(mapManagerProvider, layerConfigProvider, mapGeoDataProvider, mapTechGoogleProvider) {
        mapManagerProvider.setMapState('main.map');
        mapManagerProvider.setMapInfoState('main.map.info');
        mapManagerProvider.setTranslationLocationBase('main.map.');
        
        layerConfigProvider.setDataLayers({
            point: {
                itemType: 'point',
                resourceUri: 'points',
                minZoomLevel: 1,
                translationId: 'main.map.points',
                iconUrl: 'https://dl.dropboxusercontent.com/u/10093725/mapicons/brown/restaurant/bar.png',
                zIndex: 1,
                cache: true,
                displayLayer: true
            },
            point2: {
                itemType: 'point2',
                resourceUri: 'points2',
                minZoomLevel: 2,
                translationId: 'main.map.points2',
                zIndex: 2,
                displayLayer: true,
                hasNoDetails: true,
                cache: false,
                alwaysRefresh: true
            }
        });
        
        mapGeoDataProvider.setEndpointUri('http://localhost:9003/');
        
        // Configure the desired defaults of every map technology you're using
        mapTechGoogleProvider.setDefaults({
            zoomLevel: 8,
            center: { lat: 50.762437, lng: 4.245922 }
            //defaultStyleFunction: ...
        });
    }

    handleStateChangeError.$inject = ['$rootScope', '$state', '$location', 'sessionService', 'unhandledErrorChannel'];

    function handleStateChangeError($rootScope, $state, $location, sessionService, unhandledErrorChannel) {
        $rootScope.$on('$stateChangeError',
            function (event, toState, toParams, fromState, fromParams, error) {

                // unauthorized
                if (error.status === 401) {
                    event.preventDefault();

                    // end the current session
                    sessionService.abandonSession();

                    // go to login screen (only once!)
                    if (toState.name !== 'public.login') {
                        $location.url('/login').search({ 'redirect_state': toState.name });
                    }
                }

                // forbidden
                else if (error.status === 403) {
                    event.preventDefault();

                    // redirect to 'forbidden' error page
                    $state.go('main.forbidden');
                }

                    // any other case
                else {
                    unhandledErrorChannel.errorOccurred(error);
                }
            });
    }
    
    gnapMapRun.$inject = ['layerConfig', 'mapGeoData', 'settings'];
    
    function gnapMapRun(layerConfig, mapGeoData, settings) {
        mapGeoData.setConstructResourceUriFunction(function(dataLayer, all) {
            return all ? dataLayer.resourceUri : dataLayer.resourceUri + '/bounds';
        });
        
        layerConfig.setDataLayers({
            point2: {
                getStyleFunction: function(feature, iconUrl, layerProperties, zoomLevel) {
                    return {
                        icon: settings.iconUrl
                    };
                }
            }
        });
    }
})();
