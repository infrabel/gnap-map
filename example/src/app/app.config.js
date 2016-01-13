'use strict';

(function () {
    angular
        .module('examples')
        .config(urlRouterConfiguration)
        .config(titleConfiguration)
        .config(authConfiguration)
        .config(gnapMapConfiguration)
        .run(handleStateChangeError);

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
    
    gnapMapConfiguration.$inject = ['mapManagerProvider', 'layerConfigProvider', 'mapGeoDataProvider'];
    
    function gnapMapConfiguration(mapManagerProvider, layerConfigProvider, mapGeoDataProvider) {
        mapManagerProvider.setMapState('main.map');
        mapManagerProvider.setMapInfoState('main.map.info');
        mapManagerProvider.setTranslationLocationBase('main.map.');
        
        layerConfigProvider.setLayerConfig({
            point: {
                itemType: 'point',
                resourceUri: 'points',
                minZoomLevel: 5,
                translationId: 'main.map.points',
                zIndex: 1,
                cache: true
            },
            point2: {
                itemType: 'point2',
                resourceUri: 'points2',
                minZoomLevel: 6,
                translationId: 'main.map.points2',
                zIndex: 2
            }
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
})();
