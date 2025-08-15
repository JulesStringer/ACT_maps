function loadLayers(){
    var layers = mapdisplay.layerDefs;
    var body = '<option value="" selected>Select Layer</option>';
	if ( layers ){
		var keys = Object.keys(layers);
		keys.forEach(function(key,i){
			body += '<option value="' + key + '" >' + layers[key].name + '</option>';
		});
	}
    body += '<option value="NewLayer" >New Layer</option>';
    $('#layer').html(body);
}
function on_add() {
    $('#file').val('');
    $('#layer').val('');
    showForm(false);
}
function on_cancel() {
    hideForm();
}
function enableButtons() {
    var layer = $('#layer').val();
    var enable = true;
    var files = $('#file').get(0).files;
    if (files.length == 0) {
        enable = false;
    } else if (layer.length == 0) {
        enable = false;
    } else if (layer == 'NewLayer' ){
        enable = false;
    }
    if (enable) {
        $('#submit').prop('disabled', false);
    } else {
        $('#submit').prop('disabled', true);
    }
}
function hideForm() {
    $('#submit').prop('disabled', false);
    $('#addform').css({ visibility: 'hidden' });
    $('#delform').css({ visibility: 'hidden' });
}
function showForm() {
    $('#layer').html(loadLayers);
    $('#addform').css({ visibility: 'visible' });
    enableButtons();
}
function on_layerChanged(layer){
//    alert(layer);
    enableButtons();
    if ( $('#layer').val() == "NewLayer"){
        $('#newLayerForm').css({display:'block'});
        on_layertypeChanged('geoJSON');
    } else {
        $('#newLayerForm').css({display:'none'});
    }
}
function colorOptions(fill){
    body = '<option value="rgba(0,0,0,{alpha})" >black</option>';
    body += '<option value="rgba(255,0,0,{alpha})">red</option>';
    body += '<option value="rgba(0,255,0,{alpha})">green</option>';
    body += '<option value="rgba(0,0,255,{alpha})">blue</option>';
    body += '<option value="rgba(0,255,255,{alpha})">cyan</option>';
    body += '<option value="rgba(255,0,255,{alpha})">magenta</option>';
    body += '<option value="rgba(255,255,0,{alpha})">yellow</option>';
    body += '<option value="rgba(0,0,0,0)"';
	if ( fill ){
		body += 'selected';
	}
	body += '>clear</option>';
    if ( !fill ){
        body = body.replace(/{alpha}/g, '255');
    }
    return body;    
}
function vectorStyling(){
    var body = '<tr>';
    body += '<td style="width:60px;">Line</td>';
    body += '<td><select id="lineColour" >';
    body += colorOptions(false);
    body += '</select>';
    body += 'Width:<input type="number" id="lineWidth" value="1" />';
    body += '</td>';
    body += '</tr>';
    body += '<tr>';
    body += '<td>Fill</td>';
    body += '<td><select id="fillColour" >';
    body += colorOptions(true);
    body += '</select>';
    body += ' Transparency<select id="fillTransparency" >';
    body += '<option value="0.6" >standard (0.6)</option>';
    body += '<option value="1" >Opaque (1)</option>';
    body += '<option value="0.2" >transparent (0.2)</option>';
    body += '<option value="0.4" >Faint (0.4)</option>';
    body += '<option value="0.75" >Semi-Opaque (0.75)</option>';
    body += '</select>';
    body += '</td></tr>';
    return body;
}
function fetchVectorStyling(){
    var obj = {};
    obj.stroke = {};
    obj.fill = {};
    obj.stroke.color = $('#lineColour').val();
    obj.stroke.width = parseInt($('#lineWidth').val());
    var fc = $('#fillColour').val();
    var trans = $('#fillTransparency').val();
    fc = fc.replace('{alpha}',trans);
    obj.fill.color = fc;
    return obj;
}
function on_layertypeChanged(layer){
    var body = '<table>';
    if ( layer == 'geoJSON'){
        body += vectorStyling();
    }
    body += '</table>';
    $('#typeSpecifics').html(body);
}
function on_layerNameChanged(){
    if ( $('#layerID').val().length == 0 ){
        var nm = $('#layerName').val();
        nm = nm.replace(/ /g,'');
        $('#layerID').val(nm);
    }
}
function on_layerIDChanged(){

}
function on_addLayer(){
    var layer = {};
    layer.name = $('#layerName').val();
    var key = $('#layerID').val();
    layer.type = $('#layerType').val();
    if ( layer.type == 'geoJSON'){
        layer.style = fetchVectorStyling();
//        layer.url = '/mapping/fetchjson.php?layer=' + key;
        layer.summary = ["+layername"];
    }
    var obj = {};
    obj.key = key;
    obj.layer = layer;
    url = "/mapping/addlayer.php";
    $.ajax({
        url: url,
        data: JSON.stringify(obj),
        method: 'post',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        processData: true,
        success: function (data) {
            var key = data.key;
            var tickedLayers = mapdisplay.getCheckedLayers();
            var url = window.location.search;
            var params = new URLSearchParams(url);
            topic = params.get('topic');
            if (topic && topic.length > 0) {
                $('#topic').val(topic);
            } else {
                topic = 'base';
            }
            ontopic(topic, tickedLayers, function(){
                loadLayers();
                $('#layer').val(key);
                on_layerChanged(key);
                alert("Success");
            });
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
function on_filechange() {
    var files = $('#file').get(0).files;
    var oFile = null;
    if (files.length > 0) {
        oFile = files[0];
    }
    enableButtons();
}
var progress = null;
var timer = null;
var layer = null;
var seconds = 0;
function monitorProgress(){
    seconds++;
    $('#seconds').text(seconds);
    if ( progress ){
        $.ajax({
            url: progress,
            method: 'get',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            processData: true,
            data: Date(),
            success: function (data) {
                $('#count').text(data.count);
                $('#activity').text(data.activity);
                $('#file').text(data.file);
                $('#added').text(data.added);
            },
            error: function(err){
                clearInterval(timer);
                timer = null;
                if ( err.status == 404 ){
                    alert("Loading Complete");
                    hideForm();
                    if (layer) {
                        mapdisplay.refreshLayer(layer);
                    }
                } else {
                    alert(JSON.stringify(err));
                }
            }
        });
    }
}
function on_submit() {
    $('#submit').prop('disabled', true);
    var doc = {};
    doc.layer = $('#layer').val();
    var files = $('#file').get(0).files;
    if (doc.layer.length == 0) {
        alert("Layer must be specified");
    } else if (files.length > 0) {
        var oFile = files[0];
        var oReader = new FileReader();
        oReader.onload = function (e) {
            // file contents are now base64 encoded
            var content = e.target.result;
            //alert(content);
            var testStr = ';base64,';
            var ipos = content.indexOf(testStr) + testStr.length; 
            var fileContent = content.substr(ipos);
            if ( oFile.type == 'application/json'){
              if ( isgeoJSON(fileContent, function(msg, json){
                      if ( msg ){
                          alert(msg);
                      }
                      if ( json ){
                          doc.geojson = json;
                      }
                  })){
                  savegeoJSON(doc, function () {
                      alert("Success");
                      hideForm();
                      mapdisplay.refreshLayer(doc.layer);
                  });
              }
            } else if ( oFile.type == 'application/x-zip-compressed' ||
                        oFile.type == 'application/zip' ||
                        oFile.type == 'application/octet-stream' ||
                        oFile.type == 'multipart/x-zip'){
                if ( fileContent.length > 5000000){
                    alert("File too big - must be < 5MB");
                } else {
                    seconds = 0;
                    url = "/mapping/uploadzip.php";
                    doc.zip = fileContent;
                    doc.filename = oFile.name;
                    doc.clipto = 'TeignbridgeDistrict';
                    var tbl = '<table>';
                    tbl += '<tr><td>Second</td><td id="seconds"></td</tr>';
                    tbl += '<tr><td id="activity">Uploading</td><td id="file">' + oFile.name + '</td></tr>';
                    tbl += '<tr><td>Read</td><td id="count"></td></tr>';
                    tbl += '<tr><td>Added</td><td id="added"></td></tr>';
                    tbl += '</table>';
                    progress = null;
                    second = 0;
                    timer = setInterval(monitorProgress, 1000);
                    $('#selected').html(tbl);
                    $.ajax({
                        url: url,
                        data: JSON.stringify(doc),
                        method: 'post',
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        processData: true,
                        success: function (data) {
                            //alert(JSON.stringify(data));
                            progress = data.progress;
                            layer = data.layer;
                        },
                        error: function (err) {
                            clearInterval(timer);
                            if ( err.responseText ){
                                alert(err.responseText);
                            } else {
                                alert(JSON.stringify(err));
                            }
                        }    
                    });
                }
            } else {
                alert("Unrecognised mime type " + oFile.type);
            }
        };
        oReader.readAsDataURL(oFile);
    }
}
function onload(dataurlbasein, templatebasein, findcomboid) {
    $('#detail').hide();
    $('#newLayerForm').css({display:'none'});
    dataurlbase = dataurlbasein;
    // Create map object
    mapdisplay = createMapDisplay('map', 'control', 'selected', {
        checkboxes: true,
        dataurlbase: dataurlbasein,
        templatebase: templatebasein,
        coorddiv: 'coords'
    });
    // load topic from argument
    var url = window.location.search;
    var params = new URLSearchParams(url);
    topic = params.get('topic');
    var findlayer = params.get('findlayer');
    if (!findlayer || findlayer.length == 0) {
        findlayer = 'TeignbridgeParishes';
    }
    mapdisplay.setSelectHover(false);
    if (topic && topic.length > 0) {
        $('#topic').val(topic);
        ontopic(topic, null, function () {
            // There is a 3rd argument default id
            mapdisplay.populateCombo(findlayer, findcomboid);
            loadLayers();
        });
    } else {
        ontopic('base', null, function(){
            mapdisplay.populateCombo(findlayer, findcomboid);
            loadLayers();
        });
    }
    // If there is a help menu populate it
    if ($('#helpmenu').length > 0) {
        populatehelpmenu();
    }
}
