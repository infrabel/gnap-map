# GNaP Map plugin

Adds mapping functionality to the [GNaP](http://gnap.io/) Angular framework. Manages layers of [GeoJson](http://geojson.org/) data, independent of map API. Currently only [Google Maps](https://github.com/infrabel/gnap-map-google) is publicly available, but you can [create your own](https://github.com/infrabel/gnap-map/wiki/create-map-tech-package).

## Architectural overview

TODO.

## Components

### MapManager service

#### Configuration

Configure these static settings directly on the `mapManagerProvider`, during the config phase of your module.

- `setMapState`: Set the location of the basic map state; which is navigated back to when leaving the 'info' state. *Default: main.map*
- `setInfoState`: Set the location of the 'info' sub state; which is navigated to when clicking on a POI. *Default: main.map.info*
- `setTranslationLocaionBase`: Set the location which serves as the base for some translations, for e.g. layer names. *Default: main.common*

#### Service interface

##### `dataLayers` *(property, array)*

A shortcut to `layerConfig.getDataLayers()`.

##### `selection` *(property, object)*

An object which should contain information about the currently selected item. These should be set when entering the `main.map.info` state. It should contain at least a `type` property, corresponding to the data layer's `itemType`. This can then be used by the `mapView`s to retrieve the selected `dataLayer`.

##### `fetchDataInBounds` *(function)*

If required, fetches and displays the GeoJson data for the specified `dataLayer` in the current viewport, either from the cache, or from the server.

**Parameters**:

Either `dataLayer` *(string or object)*, `refresh` *(optional, boolean)*, `callbackFunction` *(optional, function)* or `dataLayer` *(string or object)*, `options` *(object)*.

`dataLayer` can either be the data layer configuration entry, or its key as a string.

If the second argument is an object, then it is configured as `options`. You can also use a shortcut function call, where the second parameter is the `refresh` option, and the third parameter the `callback` function.

`options` should be an object which can contain three properties:
- `refresh` *(boolean)*: If true, clears all data of this type, always reloads it for these bounds, and appends all data to the map. If false, only loads data in case it wasn't already loaded for these bounds, and appends new data to the map.
- `append` *(boolean)*: If true, always reloads data for these bounds even if it was already fetched, and appends new data to the map.
- `callback` *(function)*: A function which will be called after data has been appended to the map.

##### `fetchAllDataInBounds` *(function)*

Calls `fetchDataInBounds` for all of the configered data layers.

**Parameters**:

- refresh *(boolean)*: Same as refresh parameter for `fetchDataInBounds`.

##### `clearData` *(function)*

Clears all the GeoJson data for the specified `dataLayer`.

**Parameters**:

- `dataLayer`



## Dependencies

- The Angular version of [GNaP](http://gnap.io/)
- [ui-select](https://github.com/angular-ui/ui-select)

## License

themes-gnap is licensed under [BSD (3-Clause)](http://choosealicense.com/licenses/bsd-3-clause/ "Read more about the BSD (3-Clause) License"). Refer to [LICENSE](https://github.com/infrabel/themes-gnap/blob/master/LICENSE) for more information.

The GNaP theme uses ```Ace - Responsive Admin Template``` as its base theme, which is licensed under [Extended License](https://github.com/infrabel/themes-gnap/blob/master/custom/ace/LICENSE-Ace), our license covers redistribution and usage by you. However, if you would like to show your support to the original author, you can [buy a Single application license here](https://wrapbootstrap.com/theme/ace-responsive-admin-template-WB0B30DGR?ref=cc), it's quite cheap after all.