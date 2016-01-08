# GNaP Map plugin

Adds mapping functionality to the [GNaP](http://gnap.io/) Angular framework. Manages layers of [GeoJson](http://geojson.org/) data, independent of map API. Currently only [Google Maps](https://github.com/infrabel/gnap-map-google) is publicly available, but you can [create your own](https://github.com/infrabel/gnap-map/wiki/create-map-tech-package).

## Architectural overview

TODO.

## Components

### Map manager service

The map manager coordinates between all other components. Its main purpose is to keep track of which data in which bounds has already been fetched, and only request new data when required. It also keeps track of the currently selected item and triggers some events.

#### Configuration

Configure these static settings directly on the `mapManagerProvider`, during the config phase of your module.

- `setMapState`: Set the location of the basic map state; which is navigated back to when leaving the 'info' state. *Default: main.map*
- `setInfoState`: Set the location of the 'info' sub state; which is navigated to when clicking on a POI. *Default: main.map.info*
- `setTranslationLocaionBase`: Set the location which serves as the base for some translations, for e.g. layer names. *Default: main.common*

Anywhere in your application, you may set `mapManager.settings.skipCache` if you want to completely disable its caching functionalities and always fetch all data from the server.

#### Usage

For regular usage, you should not need to call anything on the map manager: the map view will call `fetchAllDataInBounds` when required. However, you may want to *force* data for one or all layers to be refreshed, for instance after changing filters. For that, you can either call this method or the `fetchDataInBounds` method with the `refresh` option. Similarly, you may want to manually call `clearData` or `clearAllData`.

The currently selected item can and should be set on the `selected` property on the map manager, for instance on the state change to `map.info`.

Lastly, you can initiate several actions on the map view through the map manager, with the `mapView` property and its `viewPort` child property. If you want to check whether the map view supports the action, you can use the `mapManager.mapFunctionIsSupported` function and pass a reference to the desired function. Some commonly functions are `viewPort.setCenter` and `viewPort.setZoomLevel`. All functions are explained in detail in the [Map View directives](#map-view-directives) section.

#### Events

The map manager can emit the following events. Register to these on the `$rootScope` to handle them.

**`custom-shape-created`**

Emited when a shape was drawn on the map view. Parameters:

- `event` *(object)*: Default Angular event object.
- `wkt` *(string)*: The shape as [WKT](https://en.wikipedia.org/wiki/Well-known_text) in the coordinate system of the map view.
- `removeShapeFunction` *(function)*: After handling the event, if defined (if the map view supports this), call this function to remove the shape from the map view.

**`items-selected`**

When the map view supports multi-selection, this event is emited when the user has finished selecting items. Parameters:

- `event` *(object)*: Default Angular event object.
- `selectedItems` *(object)*: An object with all the selected items, grouped by their `itemType`. Each property on the object is an item type, which is again an object, with a property `ids`, which is an array containing all the id's of the selected items of that type. Be sure to check whether all these properties exist.



## Dependencies

- The Angular version of [GNaP](http://gnap.io/)
- [ui-select](https://github.com/angular-ui/ui-select)

## License

themes-gnap is licensed under [BSD (3-Clause)](http://choosealicense.com/licenses/bsd-3-clause/ "Read more about the BSD (3-Clause) License"). Refer to [LICENSE](https://github.com/infrabel/themes-gnap/blob/master/LICENSE) for more information.

The GNaP theme uses ```Ace - Responsive Admin Template``` as its base theme, which is licensed under [Extended License](https://github.com/infrabel/themes-gnap/blob/master/custom/ace/LICENSE-Ace), our license covers redistribution and usage by you. However, if you would like to show your support to the original author, you can [buy a Single application license here](https://wrapbootstrap.com/theme/ace-responsive-admin-template-WB0B30DGR?ref=cc), it's quite cheap after all.