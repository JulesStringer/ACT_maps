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