// JavaScript source code
function isgeoJSON(fileContent, callback){
    var ok = true;
    try{
        var decoded = atob(fileContent);
        var json = JSON.parse(decoded);
        if ( !json.features || json.features.length == 0){
            if ( callback ){
                callback("File doesn't contain any features");
            }
            ok = false;
        } else if ( !json.type || json.type != 'FeatureCollection'){
            if ( callback ){
                callback("File isn't geojson");
            }
            ok = false;
        } else if ( !json.crs ){
            if ( callback ){
                callback("No spatial reference system");
            }
            ok = false;
        }

        if ( ok ){
            callback(null, json);
        }
    }catch(err){
        if ( callback ){
            callback('Not a json file: ' + JSON.stringify(err));
        }
        ok = false;
    }
    return ok;    
}
function savegeoJSON(doc, callback) {
    url = "/mapping/uploadjson.php";
    $.ajax({
        url: url,
        data: JSON.stringify(doc),
        method: 'post',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        processData: true,
        success: function (data) {
            if (callback) {
                callback(data);
            }
        },
        error: function (err) {
            if ( err.responseText ){
                alert(err.responseText);
            } else {
                alert(JSON.stringify(err));
            }
        }
    });
}
// TODO upload zipped shp files
