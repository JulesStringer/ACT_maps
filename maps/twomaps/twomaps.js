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
                let keys = Object.keys(mapdisplay.layerDefs);

                mapdisplay.zoomLayer(keys[0], 0.1, 25);
                resolve();
            }
        }, layers);
        mapdisplay.setFadeGreyBackmap(true, 0.8);
        console.log('mapdisplay.onclick ', mapdisplay.onclick);
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
    mapCurrent.setSelectHover(false, null, epc_table);
    mapPotential = createMapDisplay('mapPotential', rightOptions.control, 'selected', rightOptions);
    mapPotential.setSelectHover(false, null, epc_table);
    mapCurrent.addSlave(mapPotential);
}
function epc_table(list, mapdiv, listdiv){
    let body = '<table>';
    body += '<tr><th colspan="3">tCO<sub>2</sub>e per EPC/yr</th></tr>';
    body += '<tr><td>Area</td><td>Current</td><td>Potential</td></tr>';
    // have to use foreach because list isn't a conventional array!
    list.forEach(function(f,i){
        let p = f.getProperties();
        console.log('p was ',p);
        let id = listdiv + "_" + i;
        let args = `'${mapdiv}','${id}','${p.layerName}',`;
        let fid = f.getId();
        fid = isNaN(fid) ? `'${fid}'` : fid;
        args += fid;
        body += `<tr><td><a href="#!" onclick="onlink(${args});" >${p.name}</a></td>`;
        body += `<td>${p['co2-emissions-current'].mean.toFixed(2)}</td>`;
        body += `<td>${p['co2-emissions-potential'].mean.toFixed(2)}</td></tr>`;
    });
    body += '</table>';
    return body;
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
        //popupdiv: '',
        coorddiv: 'coordsCurrent',
        forceshift: forceshift,
        control: 'control'
    };
    var rightOptions = {
        checkboxes: false,
        dataurlbase: dataurlbasein,
        templatebase: templatebasein,
        popupdiv: 'popupPotential',
        //popupdiv: '',
        coorddiv: 'coordsPotential',
        forceshift: forceshift
    };
    //if ( window.innerWidth < 1000 ){
    //    leftOptions.haspopup = false;
    //    rightOptions.haspopup = false;
    //}
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
function onhover() {
    if ($('#hover').get(0).checked) {
        // epc_table removed from the following to debug why list isn't an array of features
        mapCurrent.setSelectHover(true, null, epc_table);
        mapPotential.setSelectHover(true, null, epc_table);
    } else {
        mapCurrent.setSelectHover(false, null, epc_table);
        mapPotential.setSelectHover(false, null, epc_table);
    }
}
function setCheckSelectHover(enable) {
    $('#hover').get(0).checked = enable;
    mapCurrent.setSelectHover(enable, null, epc_table);
    mapPotential.setSelectHover(enable, null, epc_table);
}
async function ontopiccomparison(topic) {
    await load_map_panel(dataurlbase, mapCurrent, topic);
    await load_map_panel(dataurlbase2, mapPotential, topic);
}
function on_show_control(){
    let control = $('.control-scroll');
    if ( control.css('display') === 'none'){
        control.css({display:'block'});
        $('#control-button').text('Hide Legend');
    } else {
        control.css({display:'none'});
        $('#control-button').text('Show Legend');
    }
}