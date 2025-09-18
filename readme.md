# ACT maps
This plugin provides a shortcode which can be configured to display preconfigured maps:
+ WW Wildlife wardens map
##Full set of short code parameters
The full set of short code parameters are given in the following table:

|Parameter|Description|
|---------|-----------|
|ID|ID of the map type to be displayed:|
|| WW - Wildlife wardens map|
|| CC - Carbon cutters map|
|| AreaCarbon - Impact data |
|| twomaps - Two map panels for comparative data|
|| twomapsvertical - Tow map panels for comparative data stacked vertically|
|| ALL - All Layers full screen legacy map served from stringerhj.co.uk|
|width|width of the map panel|
|height|height of the map panel|
|title|title for the map|
|forceshift|If set the shift key needs to be held to zoom the map, This defaults to true so only needs to be set to false to turn this functionality off|
|config|EPC - configure twomaps for EPC|
|      |EPC_Capita - EPC mean divided by household population mean for area|

## twomaps
This requires a configuration file in the same directory as twomaps.html
This contains:
```json
{
    "title":"Dwelling CO<sub>2</sub> Emissions per EPCs",
    "left_panel":{
        "topic":"EPC/Domestic_CO2Emissions_EPC_Current",
        "title":"Current CO<sub>e</sub> Emissions"
    },
    "right_panel":{
        "topic":"EPC/Domestic_CO2Emissions_EPC_Potential",
        "title":"Potential CO<sub>e</sub> Emissions"
    }
}

```
### title - the title for the page in the iframe

### left_panel and right_panel 
These contain definitions for the left and right panel, which are currently:
+ topic - a definition of the map display in the panel.
+ title - title used for the map panel.

# Loading base maps
Most base mapping is derived from freely available layers from OS Open data in standard formats including shp.
Often the download package covers a larger area than is needed for our purposes.
As server space is limited we don't want to load more than is necessary.

We want mapping in geojson format for display, so a conversion is needed.
It is not practical to install the necessary conversion program on a hosting environment, and the amount of working storage for downloads is prohibitive. 
Instead I have written a utility [OpenOSLoader](https://github.com/JulesStringer/OpenOSloader) for use on a desktop or laptop, which can keep a mapbase up to date.

# Merging other data with base maps
Other data is merged with base map layers either:
+ by automated process - in which case the ls generated remotely
+ via an admin form under ACT_maps in the dashboard if user input is needed such as a csv upload
+ via an admin form under ACT_admin if user input of individual records is needed.

## Layers updated by ACT_maps data upload
Currently the following layers are updated via ACT_maps admin form:
+ AreaCarbon - which combines area boundaries with data downloaded from https://impact-tool.org.uk/download,
  the form describes how to generate a suitable download.

## Layers edited by ACT_maps data editor
Currently the following layers are updated via ACT_maps admin form:
+ Wildlife Warden Areas - edits data associated with the WW map
+ Carbon Cutter Areas - edits data associated with the CC map

## Architecture for editing map data
### table_editor
Base editing functionality described in [table_editor](https://github.com/JulesStringer/table_editor).

### editors - create_edit_props
Creates edit_props object containing editor customisation. A create function (e.g. create_CC_Editor) returns
an object containing custom specific parameterisation of an editor. 
```js
function create_CC_Editor(){
    let editor = {
        //
        //  Name of property containing area code lookup value
        //
        code_field: 'code',
        //
        //  Name of property containing name of area
        //
        name_field: 'name',
        //
        //  If layer doesn't yet exist defaults geojson for geography
        //
        default_layer:{
            layer: 'TeignbridgeArea',
            //
            //  Properties to be copied from default layer to new layer
            //
            copy_fields: [
                {from:'CODE', to: 'code'},
                {from:'NAME', to: 'name'}
            ]
        },
        //
        // Default Path under which to create new map layer if not already specified in MAPDATA/layers.json 
        //
        path:'CC/CarbonCutterArea.json',
        //
        // Column specifications to be pass to createNameValueEditor 
        // for edited columns covered in table_editors
        //
        columnspecs:{ ... }
        //
        //  General options specification to pass to createNameValueEditor
        //
        options: { ... }
        //
        //  Columns calculated just before the layer is saved
        //  Each member of the calculated object is keyed by field name
        //  and is a function which returns the value of the field.
        //  These functions are applied to all rows edited or not.
        //
        calculated: {
            email: function(properties){
                return calculated email address
            }
        }
    }
}
```
examples in [editor](https://github.com/JulesStringer/ACT_maps/tree/main/editors) directory.

If the layer to edited doesn't yet exist, its geography is copied from the default_layer and some properties are
copied directly as specified in the copy_fields array.

If the layer has already been defined in the MAPDATA/layers.json file then the path is ignored, 
it is used if layers.json does not define a path.

### edit_area_maps.js
Provides general purpose editing function as follows:
1. When the form is loaded the layer is read and if necessary copied from the default layer.
2. A list of code values is formed from values already in the layer, and a lookup index to eacch feature in the layer is formed.
3. When an entry in the code list is picked its values are presented for editing
4. When the save layer button is pressed a properties object is created from current feature properties, any calculated fields are calculated and the properties object is submitted to be merged with the map geography.

## Wildlife Wardens Map
This list is driven by a predefined list of areas. To change details of an area:
1. Select the area from the list
2. The details of the area are shown with only the fields you can change editable
3. Make your changes
4. Press the submit button to write your changes back to the server.

### No. Wardens
This field should be set to the number of wardens
### Parish Text
This should be short descriptive text, typically provided by wardens for an area.

## Where do area boundaries come from?
Wildlife Warden Areas have been assigned based on a combination of parish boundaries and Newton Abbot ward boundaries.
A boundary map has been derived from data in 
[OS Boundary Line](https://www.ordnancesurvey.co.uk/products/boundary-line)
The codes that you will see are standard ONS codes, which are used to join the boundaries with other datasets.

## Carbon Cutters map
This is modelled on the Wildlife Wardens Map.

# Outstanding Issues
+ Load impact data needs an indicator that its finished successfully.
+ Impact map height=620 default
+ Impact map should shows tooltips with area and emissions total.
+ Impact data should include persons/household so can produce parish / ward graphic for exhibitions.

+ Need load forms for CC spreadsheet, Parish progress spreadsheet.

# New in this release
## 2/9/2025
+ table_editor is now a copy of the table_editor repository in github, and should be cloned from there periodically.
+ WW and CC map data editing moved from ACT_admin to better integrate with merge back end functionality, edit_area_map.js provides the editing front end, with customisation provided by edit_props objects in editors directory.
## 22/8/2025
+ Impact load Loads data from parish-all-consumption-per-household.csv and ward-all-consumption-per-household.csv to form AreaCarbon on TeignbridgeArea layer created from parishes and NA wards.
## 20/8/2025
+ Load impact data form added, driven by js/load-impact-page.js
+ Layer utilities js/layer-utils.js added containing make_merged_layer and merge_attributes_into_geoJSON.
+ make_merged_layer produces a combined layer from a source layer and an attributes object with matching keys and saves it to MAPDATA in a new versioned layer.
+ merge_attributes_into_geoJSON takes a source layer, code attribute name and attributes object and produces an output attributes object
containing only keys that are in the source layer.
