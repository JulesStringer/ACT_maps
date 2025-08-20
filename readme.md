# ACT maps
This plugin provides a shortcode which can be configured to display preconfigured maps:
+ WW Wildlife wardens map
##Full set of short code parameters
The full set of short code parameters are given in the following table:

|Parameter|Description|
|---------|-----------|
|ID|ID of the map type to be displayed:|
|| WW - Wildlife wardens map|
|width|width of the map panel|
|height|height of the map panel|
|title|title for the map|
|forceshift|If set the shift key needs to be held to zoom the map, This defaults to true so only needs to be set to false to turn this functionality off|

# Loading base maps
Most base mapping is derived from freely available layers from OS Open data in standard formats including shp.
Often the download package covers a larger area than is needed for our purposes.
As server space is limited we don't want to load more than is necessary.

We want mapping in geojson format for display, so a conversion is needed.
It is not practical to install the necessary conversiyer is on program on a hosting environment, and the amount of working storage for downloads is prohibitive. 
Instead I have written a utility [OpenOSLoader](https://github.com/JulesStringer/OpenOSloader) for use on a desktop or laptop, which can keep a mapbase up to date.

# Merging other data with base maps
Other data is merged with base map layers either:
+ by automated process - in which case the ls generated remotely
+ via an admin form under ACT_maps in the dashboard if user input is needed such as a csv upload
+ via an admin form under ACT_admin if user input of individual records is needed.

## Layers updated by ACT_maps data upload
Currently the following layers are updated via ACT_maps admin form:
+ ParishCarbon - which combines parish boundaries with data downloaded from https://impact-tool.org.uk/download,
  the form describes how to generate a suitable download.

# Outstanding Issues
+ Impact map type needs setting up.
+ Impact upload should use ward as well as parish data to pick up newton abbot wards so that WW boundaries can be used.

# New in this release
## 20/8/2025
+ Load impact data form added, driven by js/load-impact-page.js
+ Layer utilities js/layer-utils.js added containing make_merged_layer and merge_attributes_into_geoJSON.
+ make_merged_layer produced a combined layer from a source layer and an attributes object with matching keys and saves it to MAPDATA in a new versioned layer.
+ merge_attributes_into_geoJSON takes a source layer, code attribute name and attributes object and produces an output attributes object
containing only keys that are in the source layer.
