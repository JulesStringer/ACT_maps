// JavaScript source code
var mapdisplay = null;
var dataurlbase = null;
function loadBaseLayers(layers, callback) {
    var url = dataurlbase + 'groups.json'; // Changed from layers.json
    console.log('url: ' + url);
    //var urlTemplates = dataurlbase + 'templates.json';
    //var urlDictionary = dataurlbase + 'dictionary.json';
    var urlTemplates = null;
    var urlDictionary = 'NONE';
    mapdisplay.loadLayers(url, urlTemplates, urlDictionary, callback, layers);
    mapdisplay.setFadeGreyBackmap(false, 1.0);
}
function loadFile(file, layers, callback) {
    console.log('file: ' + file);
    var url = dataurlbase + file + '.json';
    //var urlTemplates = dataurlbase + 'templates.json';
    //var urlDictionary = dataurlbase + 'dictionary.json';
    mapdisplay.loadLayers(url, urlTemplates, 'NONE', callback, layers);
    var urlTemplates = null;
    var urlDictionary = null;
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
        default:
            alert("Not Yet Implemented :" + topicName);
            break;
    }
}
var categories = {
    all: {
        name: "All",
        subcategories: {
            all: 'All'
        }
    },
    consumption: {
        name: "Consumption",
        subcategories: {
            all: "All",
            goods: "Goods",
            services: "Services",
            other: "Other"
        }
    },
    food: {
        name: "Food & Drink",
        subcategories: {
            all: "All",
            meatfish: "Meat/Fish",
            other: "Other"
        }
    },
    housing: {
        name: "Housing",
        subcategories: {
            all: "All",
            mainsgas: "Mains Gas",
            electricity: "Electricity",
            oil: "Oil",
            lpg: "LPG",
            biomass: "Biomass",
            coal: "Coal"
        }
    },
    travel: {
        name: "Travel",
        subcategories: {
            all: "All",
            flights: "Flights",
            publictransport: "Public",
            privatetransport: "Private"
        }
    },
    waste: {
        name: "Waste",
        subcategories: {
            all: "All"
        }
    }
};
let subcat_name = 'all';
function onsubcategory(val) {
    // Theme map according to value of subcat
    var ar = val.split('.');
    var category = ar[0];
    var subcategory = ar[1];
    subcat_name = subcategory;
    // Get range of values from map
    var features = mapdisplay.getFeatures('area');
    var max = 0;
    var layerDef = mapdisplay.layerDefs['area'];
    if (layerDef) {
        for(let feature of features) {
            var properties = feature.getProperties();
            //console.log('Properties: ' + JSON.stringify(properties));
            console.log('code: ' + properties['code']);
            if ( !properties['code']) {
                console.log('Properties: ' + JSON.stringify(properties));
            }
            console.log('category: ' + category + ' properties[category] ' + JSON.stringify(properties[category])); 
            console.log(' subcategory: ' + subcategory + ' properties[category][subcategory] ' + properties[category][subcategory]);
            var value = properties[category][subcategory];
            if (value > max) {
                max = value;
            }
        }
        var cstyle = layerDef.style;
        var c = 0;
        for(let feature of features) {
            var properties = feature.getProperties();
            if (properties) {
                var s = {
                    stroke: cstyle.stroke,
                    fill: cstyle.fill
                }
                var value = properties[category][subcategory];
                var alpha = 0.5 * value / max;
                s.fill = {
                    color: 'rgba(255,0,0,' + (Math.round(alpha * 100) / 100) + ')'
                }
                var style = new ol.style.Style();
                setStyle(style, s);

                feature.setStyle(style);
            }
        }
        mapdisplay.map.renderSync();
    }
}
let category_name = 'all';
function oncategory(cat) {
    console.log('oncategory: ' + cat);
    category_name = cat;
    let category = categories[cat];
    if (category) {
        // Populate sub categories
        var body = '';
        var keys = Object.keys(category.subcategories);
        keys.forEach(function (subcat, i) {
            body += '<option value="' + cat + '.' + subcat + '" ';
            if (subcat == 'all') {
                body += 'selected';
            }
            body += '> ' + category.subcategories[subcat] + '</option > ';
        });
        $('#subcategory').html(body);
//        $('#subcategory').val('all');
        onsubcategory(cat + '.all');
    }
}
function populatecategories() {
    var keys = Object.keys(categories);
    var body = '';
    keys.forEach(function (key, i) {
        body += '<option value="' + key + '" >' + categories[key].name + '</option>';
    });
    $('#category').html(body);
    $('#category').val('all');
    oncategory('all');
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
function onfeatureselected(list) {
    var feature = null;
    if (list) {
        list.forEach(function (f, i) {
            if (i == 0) {
                feature = f;
            }
        });
    }
    if (feature) {
        $('areatooltip').css({
            display: 'block'
        });
        let properties = feature.getProperties();
        console.log('Category: ' + category);
        let tip = '';
        for(const key in properties){
            if ( key !== 'geometry'){
                let val = properties[key];
                if ( key === 'code'){
                    tip += val;
                    $('#areacode').text(val);
                }
                if ( key === 'name'){
                    if ( val.indexOf('(') > 0){
                        val = val.split('(')[0];
                    }
                    $('#areaname').text(val);
                    tip += ' ' + val;
                }
                if ( key === category_name){
                    let v = val[subcat_name];
                    if ( v ){
                        let fv = ': ' + (Math.round(v*10)/10) + ' tCO<sub>2</sub>e';
                        if ( category_name != 'all'){
                            fv = category_name + ' '+ subcat_name + fv;
                        }
                        $('#areavalue').html(fv);
                        tip += ' ' +  fv;
                    }
                }
            }
        }
        $('#areatooltip').html(tip);
    } else {
        $('areatooltip').css({
            display: 'none'
        });
        $('#areatooltip').text('');
//        $('#areacode').text('');
        var idletext = $('#idletext').text();
//        $('#areaname').text(idletext);
//        $('#areaname').text('');
//        $('#areavalue').text('');
    }
}
function summarisePoint(coord,e) {
    // Translate pt to screen coordinate
    // Move areatooltip to position
    if (!e.dragging) {
        var pt = e.pixel;
        var pos = $('#map').offset();
        pos.left += pt[0] + 10;
        pos.top += pt[1] + 10;
        $('#areatooltip').offset(pos);
    }
    return formatPoint(coord, 'EPSG:27700');
}
function onclick(mapdisp, pt) {
    var coords = pt.getCoordinates();
    var features = mapdisp.getFeaturesIntersecting("area", coords);
    if (features && features.length == 1) {
        // if there is exactly one feature select page
        var feature = features[0];
        if (feature) {
            var properties = feature.getProperties();
            var code = properties['code'];
            var name = properties['name'];
            let geography = properties['geography'];
            if ( !geography ){
                geography = 'parish';
            }
            $('#findlayer').val(code);
//            mapdisplay.zoomFeature(feature, 0.1, 25);
            // TODO show window with carbon footprint
            var urlbase = 'https://impact-tool.org.uk/footprint/footprint?geography=:geography&regionId=:regionId&footprintType=consumption&scale=per-household&showSubCategories=true';
            url = urlbase.replace(':regionId', code);
            url = url.replace(':geography',geography);
            console.log('url: ' + url);
            window.open(url, '_blank');
        }
    }
}
function onoutline() {
    $('#findlayer').val('outline');
    mapdisplay.zoomoutline();
}
function sizemap() {
    var w = window.innerWidth;
    var bw = $('body').width();
    if (w < bw) {
        $('body').width(w);
        $('#map').width(w-20);
        $('#map').height(w-20);
        $('#main').height(w + 230);
        if (w < 600) {
            $('#outlinecol').css({ display: 'none' });
        }
    }
}
function onload(dataurlbasein, templatebasein, findcomboid) {
    $('#detail').hide();
    var idletext = $('#idletext').text();
    $('#areaname').text(idletext);
    dataurlbase = dataurlbasein;
    console.log('dataurlbase: ' + dataurlbase);
    // Create map object
    var url = window.location.search;
    var params = new URLSearchParams(url);
    var forceshift = params.get('forceshift');
    if (!forceshift) {
        forceshift = false;
    }
    sizemap();
    mapdisplay = createMapDisplay('map', 'control', 'selected', {
        checkboxes: false,
        dataurlbase: dataurlbasein,
        templatebase: templatebasein,
        coorddiv: 'coords',
        onFeatureSelected: onfeatureselected,
        onclick: onclick,
        forceshift: forceshift,
        summarisePoint: summarisePoint
    });
    // load topic from argument
    var defid = null;
    ontopic('base', null, function () {
        mapdisplay.populateCombo('area', 'findlayer', '', 'code', 'name', function (layerName) {
            //alert('in callback : ' + layerName);
            mapdisplay.setlayerClickable(layerName);
            mapdisplay.setSelectHover(true, false);
            // set up categories
            populatecategories();
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