# GNaP Map plugin

Adds mapping functionality to the [GNaP](http://gnap.io/) Angular framework. Manages layers of [GeoJson](http://geojson.org/) data, independent of map API. Currently only [Google Maps](https://github.com/infrabel/gnap-map-google) is publicly available, but you can [create your own](wiki/create-map-tech-package). (TODO)

## Overview

This library attempts to abstract away the visualization of GeoJson data: it can be used with multiple 'map views', like Google Maps or Bing Maps. New map views can be created with minimal effort, by implementing the expected functions. The user can even switch between different engines interactively, using an included 'map technology selector' directive.

The GeoJson data should come from a REST endpoint. Both fetching all data at once, or only fetching data in the requested bounds (viewport) are supported. The library ensures optimal performance by only rendering items which are in the current viewport once, and only fetching new data when necessary.

The library makes it easy to create and configure new layers of data, when they should be shown, and how they should be displayed. This can be configured during the Angular *config* phase, or in a *run* block in case other services must be referenced.

![GNaP Map Plugin architecture](doc/architecture_front.png)

## Who this library is for

This library can only be used together with the [GNaP framework](http://www.gnap.io) because it relies on components, packages and style used therein. It only makes sense to use this library if you primarily use at least one, but probably multiple (toggleable) layers of GeoJson data from a REST endpoint.

Don't use this library if you need to do entirely different things with a map, like only showing one or a couple of locations.

## Getting started

#### Installation

- Install this package using `npm install gnap-map` in your web project folder.
- Install a map technology, for instance [gnap-map-google](https://github.com/infrabel/gnap-map-google) by running `npm install gnap-map-google`, and following the [installation instructions](https://github.com/infrabel/gnap-map-google#installation) there.
- Reference the dist/gnap-map.css file and the dist/gnap-map.js file for the development version, or the dist/gnap-map.min.css and dist/gnap-map.min.js files for minified versions.
    - Reference them right after the GNaP css and js files. That way, they will get bundled along with GNaP in the vendor-gnap.css and vendor.js files by means of the GNaP `grunt dist` task.
    - **Note:** When installing the Google Maps technology, be sure to follow the instructions on referencing the Google Maps API in your index file.

#### Hello Worldmap

- If you hadn't already, create the state you wish to insert the map in, e.g. `main.map` (if you pick another state, you should reflect that in [the configuration](#configuring-the-map-manager)).
- Create a div with a height. Inside it, reference (one of) your installed map view directive(s), e.g.:  
    ```
    <div map-view-google style="width: 100%; height: 500px;"></div>
    ```
- Optionally, if you have installed more than one map technology/view, you can also include the 'map tech selector' directive, in the main.html view, right before the `gnap-locale-selector`, e.g.:  
    ```
    <li map-tech-selector class="light-blue"></li>
    ```

#### Configuration

Configure the [map manager](#configuring-the-map-manager), the [layers](#configuring-layers) to be used, and the [geo data service](#configuring-the-geo-data-service). You can follow the example [here](wiki/config-example). (TODO)

As a bare minimum, you'll probably want to set the center and zoom level of your map, configure at least one layer along with its style, and the endpoint of your API.

## Components

### Map manager service

The map manager coordinates between all other components. Its main purpose is to keep track of which data in which bounds has already been fetched, and only request new data when required. It also keeps track of the currently selected item and triggers some events.

#### Configuring the Map manager

Configure these static settings directly on the `mapManagerProvider`, during the config phase of your module.

- `setMapState`: Set the location of the basic map state; which is navigated back to when leaving the 'info' state. *Default: main.map*
- `setInfoState`: Set the location of the 'info' sub state; which is navigated to when clicking on a POI. *Default: main.map.info*
- `setTranslationLocaionBase`: Set the location which serves as the base for some translations, for e.g. layer names. Include the final dot. *Default: main.common.*

Anywhere in your application, you may set `mapManager.settings.skipCache` if you want to completely disable data layer caching and always fetch all data from the server.

#### Using the map manager

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

### Layer config service

Used to initially configure, and then retrieve the layer configuration.

#### Configuring layers

Two types of configuration are supported, and can be combined: *static* configuration, which is set in a `config` block and can thus only use other providers and constants, and *dynamic* configuration, which is set in a `run` block and can thus also use other services: 

- `setLayerConfig` is set **at config time**, on the `layerConfigProvider`.
- `setLayerConfigDynamic` is set **at run time**, on the service.
    - **Attention**: The dynamic layer configuration cannot be injected the `mapManager` service, since this would cause a circular reference.

There is no difference between the two: both functions take one argument, which is an object, where each property represents a layer. The property name is the key of the layer and should be the same as its `itemType` property. All layer properties are discussed [in the wiki](wiki/layer-properties). (TODO)  
Static and dynamic layers and properties are merged; so even for one layer, you can specify some static properties, and some dynamic ones (most commonly the display functions). In case a property is specified in both, the dynamic property takes precedence.

#### Using the layers service

You can access the layer configuration at any time by calling `getDataLayers()` on the service.

### Geo data service

Gets the GeoJson data for a specific layer from a REST endpoint. Either all data of the specified type (which can then be cached locally by the map manager), or only the data within the specified bounds.

Note that currently, the bounds should be passed as WGS 84 coordinates, but the returned GeoJson can be in any coordinate system as specified in the `mapTech` spec.

#### Configuring the Geo data service

There are two types of configuration: `config`-phase configuration on the provider, and configuration set during the `run`-phase, which can include other services.

##### Config-time configuration

- `setEndPointUri` on the `mapGeoDataProvider`: Set the base endpoint which the service should retrieve its data from. Should include a trailing slash. After this, the resource's uri is appended.

##### Run-time configuration

- `setConstructResourceUriFunction`: Optionally specify a function which accepts two parameters: the `dataLayer` *(object)*, and an optional `all` *(bool, optional, default false)*. Must return the uri which should be appended to the `endPointUri` which was configured in the `config` block.  
By default, the function returns the `dataLayer`'s `resourceUri` property. In case `all` was set to `true`, it appends `/all` to the uri.

- `constructParamsFunction`: Optionally specify a function which accepts a `dataLayer` parameter and returns an object which should be set as the `params` option in the `$http.get` request.  
By default, this is an empty object.  
Note, however, that the service will automatically add the following parameters:
    - WGS 84 bounds in the following format:  
    ```
    {
        "neLat": 51.04019084947656,
        "neLng": 2.904200414924617,
        "swLat": 51.02475337327745,
        "swLng": 2.8353642027664137
    }
    ```
    - If required (when different from the default wgs84), the expected output coordinate system in the following format:    
    ```
    {
        "result": "lambert72"
    }
    ```

#### Using the geo data service

You should normally not have to call anything on this service; the `mapManager` should automatically make the required calls. You may however call `getAll(dataLayer)` or `getInBounds(dataLayer, bounds)` manually.





## Dependencies

- The Angular version of [GNaP](http://gnap.io/)
- [ui-select](https://github.com/angular-ui/ui-select)

## License

themes-gnap is licensed under [BSD (3-Clause)](http://choosealicense.com/licenses/bsd-3-clause/ "Read more about the BSD (3-Clause) License"). Refer to [LICENSE](https://github.com/infrabel/themes-gnap/blob/master/LICENSE) for more information.

The GNaP theme uses ```Ace - Responsive Admin Template``` as its base theme, which is licensed under [Extended License](https://github.com/infrabel/themes-gnap/blob/master/custom/ace/LICENSE-Ace), our license covers redistribution and usage by you. However, if you would like to show your support to the original author, you can [buy a Single application license here](https://wrapbootstrap.com/theme/ace-responsive-admin-template-WB0B30DGR?ref=cc), it's quite cheap after all.