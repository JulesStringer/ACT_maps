# ACT maps
This plugin provides a shortcode which can be configured to display preconfigured maps:
+ WW Wildlife wardens map
##Full set of short code parameters
The full set of short code parameters are given in the following table:

|Parameter|Description|
|---------|-----------|
|ID|ID of the map type to be displayed:
 WW - Wildlife wardens map|
|width|width of the map panel|
|||
|height|height of the map panel|
|||
|title|title for the map|
|forceshift|If set the shift key needs to be held to zoom the map, This defaults to true so only needs to be set to false to turn this functionality off|

# Loading maps
Most mapping is derived from freely available layers from OS Open data in standard formats including shp.
Often the download package covers a larger area than is needed for our purposes.
As server space is limited we don't want to load more than is necessary.

We want mapping in geojson format for display, so a conversion is needed.
It is not practical to install the necessary conversion program on a hosting environment, and the amount of working storage for downloads is prohibitive. 
Instead I have written a utility [OpenOSLoader](https://github.com/JulesStringer/OpenOSloader) for use on a desktop or laptop, which can keep a mapbase up to date.
