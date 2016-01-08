'use strict';

(function () {
    angular
        .module('gnapMap')
        .directive('mapTechSelector', mapTechSelector);

    mapTechSelector.$inject = ['mapTech'];

    function mapTechSelector(mapTech) {
        /* jshint ignore:start */
        return {
            restrict: 'A',
            scope: {},
            link: link,
            template: "<a data-toggle=\"dropdown\" class=\"dropdown-toggle\">\n" +
            "    <span>\n" +
            "        {{mapTech.displayName}}\n" +
            "    <\/span>\n" +
            "    <i class=\"icon-caret-down\"><\/i>\n" +
            "<\/a>\n" +
            "\n" +
            "<ul class=\"user-menu pull-right dropdown-menu dropdown-default dropdown-caret dropdown-close\">\n" +
            "    <li ng-repeat=\"mapTech in mapTechList\">\n" +
            "        <a ng-click=\"setMapTech(mapTech.key)\">\n" +
            "            {{mapTech.displayName}}\n" +
            "        <\/a>\n" +
            "    <\/li>\n" +
            "<\/ul>\n" +
            ""
        };
        /* jshint ignore:end */

        function link(scope) {
            scope.mapTechList = mapTech.getAllMapTech();

            scope.mapTech = mapTech.getSelectedMapTech();

            scope.setMapTech = function (key) {
                mapTech.setSelectedMapTechKey(key);
            };
        }
    }
})();
