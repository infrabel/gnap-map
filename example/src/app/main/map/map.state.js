'use strict';

(function () {
    angular
        .module('examples')
        .config(stateConfiguration);

    var stateSettings = {
        name: 'main.map',
        state: {
            url: '/map',
            templateUrl: 'app/main/map/map.html',
            controller: 'MainMapController as vm'
        },
        title: {
            textTranslationId: 'main.map.title'
        },
        breadcrumb: {
            titleTranslationId: 'main.map.breadcrumb'
        },
        sidebarKey: 'main.map',
        translations: 'app/main/map'
    };

    stateSettings.state.onEnter = onEnter;
    stateSettings.state.onExit = onExit;

    stateConfiguration.$inject = ['$stateProvider'];

    function stateConfiguration($stateProvider) {
        $stateProvider.state(stateSettings.name, stateSettings.state);
    }

    onEnter.$inject = ['titleService', 'breadcrumbsService', 'sidebarService'];

    function onEnter(titleService, breadcrumbsService, sidebarService) {
        titleService.appendTitle(stateSettings.title);

        breadcrumbsService.addBreadcrumb(stateSettings.breadcrumb);
        sidebarService.setSelected(stateSettings.sidebarKey);
    }

    onExit.$inject = ['titleService', 'breadcrumbsService', 'sidebarService'];

    function onExit(titleService, breadcrumbsService, sidebarService) {
        titleService.removeLastTitle();

        breadcrumbsService.removeLastBreadcrumb();
        sidebarService.clearSelected();
    }

    if (stateSettings.translations) {
        stateSettings.state.resolve = stateSettings.state.resolve || {};
        stateSettings.state.resolve.translations = refreshTranslations;
    }

    refreshTranslations.$inject = ['$translatePartialLoader', '$translate'];

    function refreshTranslations($translatePartialLoader, $translate) {
        $translatePartialLoader.addPart(stateSettings.translations);
        return $translate.refresh();
    }
})();
