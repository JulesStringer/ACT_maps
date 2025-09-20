let listid;
//let geojson = null;
let features = null;
let edit_props = null;
let sourcelayer = null;
function warning(message){
    if ( message ){
        jQuery('#warning').text(message);
        jQuery('#submit').prop('disabled', true);
    } else {
        jQuery('#warning').text('');
        jQuery('#submit').prop('disabled', false);
    }
}
function create_edit_props(id){
    switch(id){
        case 'WW':
            return create_WW_Editor();
        case 'CC':
            return create_CC_Editor();
    }
    return null;
}
async function edit_area_load() {
    jQuery(document).ready(function($) { 
        $(document).ready(async function() {
            const container = $("#act-map-list-container");
            listid = container.attr('list-id');
            listid = listid.trim();
            listid = listid.replace(/ /g,'');
            console.log('listid: "' + listid + '"');
            edit_props = create_edit_props(listid);
            sourcelayer = listid;
            sourcekey = edit_props.code_field;
            //console.log('edit_props for ' + listid + ' was '+ Object.keys(edit_props));
            // get layer
            // Get layer
            try {
                geojson = await get_layer(listid);
                if ( !geojson && edit_props.default_layer){
                    console.log('Failed to get layer - getting default');
                    sourcelayer = edit_props.default_layer.layer;
                    geojson = await get_layer(sourcelayer);
                    if ( geojson ){
                        for(let f of geojson.features){
                            let properties = {};
                            for(let c of edit_props.default_layer.copy_fields){
                                properties[c.to] = f.properties[c.from];
                                if ( c.to === sourcekey ){
                                    sourcekey = c.from;
                                }
                            }
                            f.properties = properties;
                            //console.log('New properties: ' + JSON.stringify(f.properties));
                        }
                    }
                }
                // get codes list
                features = {};
                let keys = Object.keys(geojson);
                let codes = [];
                for(let feature of geojson.features){
                    keys = Object.keys(feature.properties);
                    //console.log('properties keys: ' + JSON.stringify(keys));
                    // Add field to lookup table of fields
                    let code = feature.properties[edit_props.code_field];
                    let name = feature.properties[edit_props.name_field];
                    codes.push({code:code, name:name});
                    // Put feature in lookup of features
                    features[code] = feature;
                }
                codes.sort(function(a,b){
                    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
                })
                let body = '';
                for(let codev of codes){
                    body += '<option value="' + codev.code + '" >' + codev.code + ' ' + codev.name + '</option>';
                }
                jQuery('#areas').html(body);
                // Show first one
                showarea(codes[0].code);
            } catch (error) {
                console.error("Error fetching list data:", error);
                let msg = '<p>Error fetching list data:</p>';
                msg += '<p>' + JSON.stringify(error) + '</p>';
                $('#act-maps-load-impact-results').html(msg);
                alert("An error occurred while fetching the list data.");
            }
        });
    });
}
//let feature = null;
let current_code = null;
function showarea(code){
    console.log('showarea: ' + code);
    if ( features ){
        current_code = code;
        let feature = features[code];
        if ( feature && feature.properties ){
            console.log('feature.properties: ' + JSON.stringify(feature.properties));
            table = createNameValueEditor('datatable', feature.properties, code, edit_props.columnspecs, 
                function(tableobj){
                    features[code].properties = tableobj;
                },
                edit_props.options);
        }
    }
}
function on_area(){
    // get selected area
    let code = jQuery('#areas').val();
    if ( showarea ){
        showarea(code);
    }
}
// check all emails are valid
async function on_submit(){
    try {
        let title = jQuery('#list_title').text();
        warning('Saving layer ' + listid + ' ' + title);
        console.log('Saving ' + listid + ' ' + title);
        let props = {};
        for(let code in features){
            let f = features[code];
            // Do calculated fields
            for(const key in edit_props.calculated){
                f.properties[key] = edit_props.calculated[key](f.properties);
            }
            console.log(JSON.stringify(f.properties));
            props[code] = f.properties;
        }
        // Merge with geometry in the background to avoid network traffic
        let layer_options = {
            path: edit_props.path,
            title: title
        }
        console.log('Source layer: ' + sourcelayer);
        console.log('Source key:   ' + sourcekey);
        console.log('listid    :   ' + listid);
        console.log('props     :   ' + Object.keys(props));
        console.log('layer options:' + JSON.stringify(layer_options));
        let result = await make_merged_layer(sourcelayer, sourcekey, listid, props, layer_options);
        console.log('make_merged_layer returned ' + JSON.stringify(result));
        warning(null);
        msg = '<p>Success!</p>';
        jQuery('#act-maps-load-impact-results').html(msg);
    } catch(error){
        console.error("Error saving list data:", error);
        let msg = '<p>Error fetching list data:</p>';
        msg += '<p>' + JSON.stringify(error) + '</p>';
        jQuery('#act-maps-load-impact-results').html(msg);
        alert("An error occurred while saving the list data.");  
    }
}
