// JavaScript source code
var mapdisplay = null;
var dataurlbase = null;
function loadBaseLayers(layers, callback) {
    var url = dataurlbase + 'groups.json'; // Changed from layers.json
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    var urlTemplates = dataurlbase + 'TEMPLATES';
    var urlDictionary = dataurlbase + 'DICTIONARY';
    console.log('url: ' + url + ' urlTemplates: ' + urlTemplates + ' urlDictionary: ' + urlDictionary);
    mapdisplay.loadLayers(url, 'NONE', 'NONE', callback, layers);
    mapdisplay.setFadeGreyBackmap(false, 1.0);
}
function ontopic(topicName, layers, callback) {
    mapdisplay.clearLayers();
    setCheckSelectHover(false);
    switch (topicName) {
        case 'base':
            loadBaseLayers(layers, callback);
            break;
        default:
            alert("Not Yet Implemented :" + topicName);
            break;
    }
}
function onlegend() {
    var control = $('#control');
    var visible = control.css('visibility');
    if (visible == 'visible') {
        control.css({ visibility: 'hidden' });
    } else {
        control.css({ visibility: 'visible' });
    }
}
function showfeaturedetail(feature) {
    var properties = feature.getProperties();
    var body = '';
    if (properties.layerName == 'WWAreas') {
        $('#areacode').text(properties['code']);
        $('#areaname').text(properties['parish']);
        var wardens = properties['wardens'];
        var str = '';
        if (!wardens) {
            str += 'No Wardens';
        } else if (wardens == 1) {
            str += '1 Warden';
        } else {
            str += wardens + ' Wardens';
        }
        $('#wardens').text(str);
        var email = properties['email'];
        if (email) {
            $('#email').text('Contact ' + properties['parish'] + ' wardens');
            $('#email').attr('href', email);
            //$('#emailspan').css({ display: 'visible' });
            $('#emailspan').show();
            //            $('#emailspan').text(email);
        } else {
            $('#email').text('');
            $('#email').attr('href', '');
            $('#emailspan').css({ display: 'none' });
            $('#emailspan').hide();
        }
        $('#planning').attr('href', properties.planning);
        if ( properties['parish_text']){
            $('#parish_text').text(properties['parish_text']);
        } else {
            $('#parish_text').text('');
        }
    }
}
function onfeatureselected(list) {
    var feature = null;
    if (list) {
        list.forEach(function (f, i) {
            feature = f;
        });
    }
    if (feature) {
        showfeaturedetail(feature);
        $('#actiontext').show();
    } else {
        $('#areacode').text('');
        var idletext = $('#idletext').text();
        $('#areaname').text(idletext);
        $('#wardens').text('');
        $('#parish_text').html('');
        $('#email').text('');
        $('#email').attr('href', '');
        $('#emailspan').hide();
        $('#actiontext').hide();
    }
}
function onclick(mapdisp, pt) {
    var coords = pt.getCoordinates();
    var features = mapdisp.getFeaturesIntersecting("WWAreas", coords);
    if (features && features.length == 1) {
        // if there is exactly one feature select page
        var feature = features[0];
        if (feature) {
            var properties = feature.getProperties();
            var code = properties['code'];
            $('#findlayer').val(code);
            mapdisplay.zoomFeature(feature, 0.1, 25);
            mapdisplay.setSelectHover(false, false);
            showfeaturedetail(feature);
            //$('#unlocktext').show();
            //$('#locktext').hide();
            var str = $('#unlocktext').text();
            $('#actiontext').text(str);
        }
    }
}
function onoutline() {
    $('#findlayer').val('outline');
    mapdisplay.zoomoutline();
    mapdisplay.setSelectHover(true, false);
    var str = $('#locktext').text();
    $('#actiontext').text(str);
}
function onload(dataurlbasein, templatebasein, findcomboid) {
    $('#detail').hide();
    var idletext = $('#idletext').text();
    $('#areaname').text(idletext);
    var str = $('#locktext').text();
    $('#actiontext').text(str);
    dataurlbase = dataurlbasein;
    // Create map object
    var url = window.location.search;
    var params = new URLSearchParams(url);
    var forceshift = params.get('forceshift');
    if (!forceshift) {
        forceshift = false;
    }
    console.log('dataurlbase: ' + dataurlbase);
    mapdisplay = createMapDisplay('map', 'control', 'selected', {
        checkboxes: false,
        dataurlbase: dataurlbase,
        templatebase: dataurlbase + 'TEMPLATEBASE',
        dictionaryurl:dataurlbase + 'DICTIONARYURL',
        coorddiv: 'coords',
        onFeatureSelected: onfeatureselected,
        onclick: onclick,
        forceshift: forceshift
    });
    // load topic from argument
    var defid = null;
    layers = ['WWAreas','Rivers'];
    ontopic('base', layers, function () {
        mapdisplay.populateCombo('WWAreas', 'findlayer', '', 'code', 'parish', function (layerName) {
            //alert('in callback : ' + layerName);
            mapdisplay.setlayerClickable(layerName);
            mapdisplay.setSelectHover(true, false);
        });
    });
    // If there is a help menu populate it
    if ($('#helpmenu').length > 0) {
        populatehelpmenu();
    }
}
function on_findlayerchange(val, comboid) {
    // Do I need to get current combo value
    mapdisplay.selectFoundFeature(val, comboid);
}
function onhover() {
    if ($('#hover').get(0).checked) {
        mapdisplay.setSelectHover(true);
    } else {
        mapdisplay.setSelectHover(false);
    }
}
function setCheckSelectHover(enable) {
    var hover = $('#hover').get(0);
    if (hover) {
        hover.checked = enable;
        mapdisplay.setSelectHover(enable);
    }
}
function on_print() {
    var topic = $('#topic').val();
    var detail = mapdisplay.getSelectedDetail();
    if (detail) {
        var url = '/mapping/printLayout.html?topic=' + topic + '&layer=' + detail.layer + '&featureID=' + detail.featureID;
        var layers = mapdisplay.getCheckedLayers();
        url += '&layers=' + JSON.stringify(layers);
        var view = mapdisplay.getView();
//        url += '&view=' + JSON.stringify(view);
//        var centre = view.getCentre();
//        var zoom = view.getZoom();
//        url += '&centre=' + JSON.stringify(centre) + '&zoom=' + zoom;
        //        alert(url);
        var w = window.open(url, "printdetail");
    }
}