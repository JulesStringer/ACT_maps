// JavaScript source code
mapCurrent = null;
mapPotential = null;
dataurlbase = null;
dataurlbase2 = null;
async function getJSON(url){
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log("Response status:", response.status, response.statusText);
            //throw new Error("Failed to fetch GeoJSON");
            if ( response.status == 404 ){
                return null;
            }
            throw new Error("Failed to fetch getJSON " + response.status + ' ' + response.statusText);
        }
        let json = await response.json();

        return json;
    } catch ( err ){
        console.error("Error getting " + url + " area data:", err);
        // Reject the promise
        throw err;
    }
}
async function load_map_panel(dataurl, mapdisplay, file, layers) {
    return new Promise((resolve, reject) => {
        var url = dataurl + file + '.json';
        //var urlTemplates = dataurlbase + 'TEMPLATES';
        //var urlDictionary = dataurlbase + 'DICTIONARY';
        let urlTemplates = 'NONE';
        let urlDictionary = 'NONE';
        console.log('url: ' + url + ' ; urlTemplates: ' + urlTemplates + ' ; urlDictionary: ' + urlDictionary);
        mapdisplay.clearLayers();
        mapdisplay.loadLayers(url, urlTemplates, urlDictionary, function(err){
            if ( err ){
                console.log('load_map_panel error ' + err.toString());
                reject(err);                    
            } else {
                resolve();
            }
        }, layers);
        mapdisplay.setFadeGreyBackmap(true, 0.8);
    })
}
function createSlavedMaps(leftOptions, rightOptions, params) {
    var legendheight = params.get('legendheight');
    if (legendheight) {
        $('.control').height(parseInt(legendheight) + getScrollBarWidth());
        $('#control').height(legendheight);
    }
    $('#detail').hide();
    mapCurrent = createMapDisplay('mapCurrent', leftOptions.control, 'selected', leftOptions);
    mapCurrent.setSelectHover(false);
    mapPotential = createMapDisplay('mapPotential', rightOptions.control, 'selected', rightOptions);
    mapPotential.setSelectHover(false);
    mapCurrent.addSlave(mapPotential);
}
async function onload() {
    var url = window.location.search;
    var params = new URLSearchParams(url);
    let config_id = params.get('config');
    console.log('config_id ' + config_id);
    let config_url = '' +  config_id + '.json';
    console.log('config_url : ' + config_url);
    let config = await getJSON(config_url);
    console.log('config: ' + JSON.stringify(config));
    // TODO get parameters from general config file
    // should include topic1, topic2, title1, title2
    // 
    var forceshift = params.get('forceshift');
    if (!forceshift) {
        forceshift = false;
    }
    if ( config.title ){
        $('#title').text(config.title);
    }
    if (config.left_panel.title) {
        $('#title1').html(config.left_panel.title);
    }
    if (config.right_panel.title) {
        $('title2').html(config.right_panel.title);
    }    // Create map object
    dataurlbasein = '';
    templatebasein = '';
    dataurlbase = dataurlbasein;
    dataurlbase2 = dataurlbasein;
    var leftOptions = {
        checkboxes: false,
        dataurlbase: dataurlbasein,
        templatebase: templatebasein,
        popupdiv: 'popupCurrent',
        coorddiv: 'coordsCurrent',
        forceshift: forceshift,
        control: 'control'
    };
    var rightOptions = {
        checkboxes: false,
        dataurlbase: dataurlbasein,
        templatebase: templatebasein,
        popupdiv: 'popupPotential',
        coorddiv: 'coordsPotential',
        forceshift: forceshift
    };
    if (config.horizontal) {
        rightOptions.detailLeft = true;
    }
    var descriptionwidth = params.get('descriptionwidth');
    if (!descriptionwidth) {
        descriptionwidth = 300;
    }
    var w2 = $('#controldiv').width();
    if (parseInt(descriptionwidth) < w2) {
        descriptionwidth = w2;
    }
    $('.control_description').width(descriptionwidth);
    createSlavedMaps(leftOptions, rightOptions, params);
    mapCurrent.clearLayers();
    mapPotential.clearLayers();
    await load_map_panel(dataurlbase, mapCurrent, config.left_panel.topic);
    await load_map_panel(dataurlbase, mapPotential, config.right_panel.topic);
}
function getScrollBarWidth() {
    var $outer = $('<div>').css({ visibility: 'hidden', width: 100, overflow: 'scroll' }).appendTo('body'),
        widthWithScroll = $('<div>').css({ width: '100%' }).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
};
async function onloadvertical(dataurlbasein, templatebasein, horizontal) {
    // Resize map windows to fit frame
    var sbw = getScrollBarWidth();
    var ww = $(window).width()
    var w = ww - getScrollBarWidth();
    if (w > 600) {
        w = 600;
    }
    $('#mapCurrent').width(w);
    $('#mapCurrent').height(w);
    $('#mapPotential').width(w);
    $('#mapPotential').height(w);
    $('#control').width(w - getScrollBarWidth());
    $('#controldiv').width(w - getScrollBarWidth());
    $('#coordsCurrent').css({top: (w + $('#title1').height() -15) + 'px' });
    $('#coordsPotential').css({ top: (w + $('#title2').height() -15) +'px' });
    if (ww < 380) {
        $('#coordsCurrent').hide();
        $('#coordsPotential').hide();
    }
    await onload(dataurlbasein, templatebasein, horizontal);  
}
async function onloadcomparison(dataurl1, dataurl2, templatebasein) {
    dataurlbase = dataurl1;
    dataurlbase2 = dataurl2;
    var url = window.location.search;
    var params = new URLSearchParams(url);
    var topic = params.get('topic');
    if (!topic) {
        topic = 'layers';
    }
    $('#selected').val(topic);
    var forceshift = params.get('forceshift');
    if (!forceshift) {
        forceshift = false;
    }
    // Create map object
    var leftOptions = {
        checkboxes: true,
        dataurlbase: dataurl1,
        templatebase: templatebasein,
        popupdiv: 'popupCurrent',
        coorddiv: 'coordsCurrent',
        forceshift: forceshift,
        control: 'control'
    };
    var rightOptions = {
        checkboxes: false,
        dataurlbase: dataurl2,
        templatebase: templatebasein,
        popupdiv: 'popupPotential',
        coorddiv: 'coordsPotential',
        forceshift: forceshift,
        detailLeft: true
    };
    var descriptionwidth = params.get('descriptionwidth');
    if (!descriptionwidth) {
        descriptionwidth = 300;
    }
    var w2 = $('#controldiv').width();
    if (parseInt(descriptionwidth) < w2) {
        descriptionwidth = w2;
    }
    $('.control_description').width(descriptionwidth);
    createSlavedMaps(leftOptions, rightOptions, params);
    await load_map_panel(dataurl1, mapCurrent, topic);
    await load_map_panel(dataurl2, mapPotential, topic);
}
function onhover() {
    if ($('#hover').get(0).checked) {
        mapCurrent.setSelectHover(true);
        mapPotential.setSelectHover(true);
    } else {
        mapCurrent.setSelectHover(false);
        mapPotential.setSelectHover(false);
    }
}
function setCheckSelectHover(enable) {
    $('#hover').get(0).checked = enable;
    mapCurrent.setSelectHover(enable);
    mapPotential.setSelectHover(enable);
}
async function ontopiccomparison(topic) {
    await load_map_panel(dataurlbase, mapCurrent, topic);
    await load_map_panel(dataurlbase2, mapPotential, topic);
}