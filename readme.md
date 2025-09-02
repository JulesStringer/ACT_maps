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
Creates edit_props object containing editor customisation as follows:
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
        // Column specifications for calculated and edited columns
        //
        columnspecs:{
            name: {
                header: 'Name',
                type: 'literal',
                width: '100px',
                size: 30,

            },
            carbon_cutters: {
                header: 'No. Carbon Cutters',
                type: 'text',
                checkNumber:true,
                width: '50px',
                size: 10
            },
            area_text: {
                header: 'Parish Text',
                type:'textarea',
                width: '800px',
                preventKey: function(key){
                    return key === '"';
                },
                cols: 80,
                rows: 10
            }
        },
        options: {
            norowid: true
        },
        //
        //  Columns calculated just before the layer is saved
        //
        calculated: {
            email: function(properties){
                let code = properties['code'];
                let name = properties['name'];
                return "/contact-us/?recipients=Carbon%Cutters&your-subject=" + code + "%20" + name;
            },
            planning: function(properties){
                return "https://publicaccess.teignbridge.gov.uk/online-applications/search.do?action=monthlyList";
            }
        }
    }
    return editor;
}

```

examples 

### edit_area_maps.js
Provides general purpose editing function as follows

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
