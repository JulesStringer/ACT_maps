// JavaScript source code
var mapdisplay = null;
var dataurlbase = null;
function loadBaseLayers(layers, callback) {
    var url = dataurlbase + 'groups.json'; // Changed from layers.json
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    mapdisplay.setFadeGreyBackmap(false, 1.0);
}
function loadClimateDeclarations(layers, callback) {
    var url = dataurlbase + 'climatedeclarations.json';
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    //setCheckSelectHover(true);
    mapdisplay.setFadeGreyBackmap(true, 0.8);
}
function loadPopulationDensity(layers, callback) {
    var url = dataurlbase + 'populationdensity.json';
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    //setCheckSelectHover(true);
    mapdisplay.setFadeGreyBackmap(true,0.8);
}
function loadEmissionsRate(file, layers, callback) {
    var url = dataurlbase + file + '.json';
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    //setCheckSelectHover(true);
    mapdisplay.setFadeGreyBackmap(true, 0.8);
}
function loadRoadEmissions(file, layers, callback) {
    var url = dataurlbase + file + '.json';
    var urlTemplates = dataurlbase + 'templates.json';
    var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    //setCheckSelectHover(true);
    mapdisplay.setFadeGreyBackmap(true, 0.8);
}
function ontopic(topicName, layers, callback) {
    mapdisplay.clearLayers();
    setCheckSelectHover(false);
    switch (topicName) {
        case 'base':
            loadBaseLayers(layers, callback);
            break;
        case 'declarations':
            loadClimateDeclarations(layers, callback);
            break;
        case 'popdensity':
            loadPopulationDensity(layers, callback);
            break;
        case 'CO2PerDwellingCurrent':
            loadEmissionsRate('Domestic_CO2Emissions_Dwelling_Current', layers, callback);
            break;
        case 'CO2PerCapitaCurrent':
            loadEmissionsRate('Domestic_CO2Emissions_Capita_Current', layers, callback);
            break;
        case 'CO2PerDwellingPotential':
            loadEmissionsRate('Domestic_CO2Emissions_Dwelling_Potential', layers, callback);
            break;
        case 'CO2PerCapitaPotential':
            loadEmissionsRate('Domestic_CO2Emissions_Capita_Potential', layers, callback);
            break;
        case 'CO2PerHectarePotential':
            loadEmissionsRate('Domestic_CO2Emissions_Hectare_Potential', layers, callback);
            break;
        case 'CO2PerHectareCurrent':
            loadEmissionsRate('Domestic_CO2Emissions_Hectare_Current', layers, callback);
            break;
        case 'CO2PerEPCCurrent':
            loadEmissionsRate('Domestic_CO2Emissions_EPC_Current', layers, callback);
            break;
        case 'CO2PerEPCPotential':
            loadEmissionsRate('Domestic_CO2Emissions_EPC_Potential', layers, callback);
            break;
        case 'roademissions':
            loadRoadEmissions('roademissions', layers, callback);
            break;
        case 'roads_by_emissions':
            loadRoadEmissions('roads_by_emissions', layers, callback);
            break;
        case 'OA_road_emissions':
            loadRoadEmissions('OA_road_emissions', layers, callback);
            break;
        default:
            alert("Not Yet Implemented :" + topicName);
            break;
    }
}
function onload(dataurlbasein, templatebasein, findcomboid) {
    $('#detail').hide();
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
    findlayer = params.get('findlayer');
    if (!findlayer || findlayer.length == 0) {
        findlayer = 'TeignbridgeParishes';
    }
    mapdisplay.setSelectHover(false);
    var defid = null;
    if (topic && topic.length > 0) {
        $('#topic').val(topic);
        ontopic(topic, null, function () {
            mapdisplay.populateCombo(findlayer, findcomboid, defid);
        });
    } else {
        ontopic('base', null, function (findfeature) {
            mapdisplay.populateCombo(findlayer, findcomboid, defid);
        });
    }
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
function ongrey() {
    if ($('#grey').get(0).checked) {
        mapdisplay.setFadeGreyBackmap(true,0.6);
    } else {
        mapdisplay.setGreyBackmap(false);
    }
}
function on_changebackground(value) {
    //    console.log('Change background to ' + value);
    mapdisplay.setBackground(value);
}
