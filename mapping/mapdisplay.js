var OSMapsapiKey = 'N4owPR55NcHA5TetPZqKJa8RC4hyuIpG';
function formStyleImage(image) {
    var properties = {};
    if (image.fill) {
        properties.fill = new ol.style.Fill(image.fill);
    }
    if ( image.stroke ){
        properties.stroke = new ol.style.Stroke(image.stroke);
    }
    if ( image.radius ){
        properties.radius = image.radius;
    }
    switch(image.type){
    case 'circle':
        return new ol.style.Circle(properties);
    case 'shape':
        if ( image.points ){
            properties.points = image.points;
        }
        if ( image.radius1 ){
            properties.radius1 = image.radius1;
        }
        if ( image.radius2 ){
            properties.radius2 = image.radius2;
        }
        if (image.angle ){
            properties.angle = image.angle;
        }
        if ( image.rotation ){
            properties.rotation = image.rotation;
        }
        if ( image.rotateWithView ){
            properties.rotateWithView = image.rotateWithView;
        }
        return new ol.style.RegularShape(properties);
// TODO icon
    }
    return null;
}
function setStyle(style, styleSrc) {
    if (styleSrc.stroke) {
        style.setStroke(new ol.style.Stroke(styleSrc.stroke));
    }
    if (styleSrc.fill) {
        style.setFill(new ol.style.Fill(styleSrc.fill));
    }
    if (styleSrc.image) {
        style.setImage(formStyleImage(styleSrc.image));
    }
    if (styleSrc.text) {
        var t = {};
        var keys = Object.keys(styleSrc.text);
        keys.forEach(function (key, i) {
            var v = styleSrc.text[key];
            if (key == 'text' || key == 'rotation' || key == 'textAlign' || name == 'offsetX' || name == 'offsetY' ) {
                if (!isNaN(v)) {
                    t[key] = v;
                } else if( v.startsWith('.')) {
                    if (key == 'text') {
                        t[key] = '';
                    }
                } else {
                    t[key] = v;
                }
            } else {
                t[key] = v;
            }
        });
        var ot = new ol.style.Text(t);
        style.setText(ot);
    }
}
function formStyles(layerDef) {
    var style = new ol.style.Style();
    setStyle(style, layerDef.style);
    if (layerDef.themes) {
        layerDef.themes.forEach(function (theme, i) {
            theme.cstyle = style.clone();
            setStyle(theme.cstyle, theme.style);
        });
    }
    layerDef.cstyle = style;
}   
function renderMapLegendImage(cstyle, targetDiv, extent) {
    var sourceLegend = new ol.source.Vector({ wrapX: false });
    var vectorLegend = new ol.layer.Vector({
        source: sourceLegend,
        style: cstyle
    });
    //map
    var mapLegend = new ol.Map({
        controls: [],
        layers: [
            vectorLegend
        ],
        target: targetDiv,
        view: new ol.View({
            center: ol.extent.getCenter(extent),
            zoom: 0,
            maxZoom: 2
        })
    });
    //icon feature depending on type
    var geom = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature({
        geometry: geom
    });
    vectorLegend.getSource().addFeature(feature);
}
function renderMapLegendVector(style, targetDiv) {
    var c = $('#' + targetDiv).get(0);
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.strokeStyle = null;
    ctx.fillStyle = null;
    ctx.setLineDash([]);
    if (style.stroke) {
        ctx.strokeStyle = style.stroke.color;
        ctx.lineWidth = style.stroke.width;
    }
    if (style.fill) {
        ctx.fillStyle = style.fill.color;
    }
    ctx.beginPath();
    if (style.image) {
        if (style.image.fill) {
            ctx.fillStyle = style.image.fill.color;
        }
        if (style.image.stroke) {
            ctx.strokeStyle = style.image.stroke.color;
            ctx.lineWidth = style.image.stroke.width;
        }
        switch (style.image.type) {
            case 'circle':
                ctx.arc(c.width / 2, c.height / 2, style.image.radius, 0, 2 * Math.PI, false);
                break;
        }
    } else if (style.fill) {
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.moveTo(0, c.height);
        ctx.lineTo(c.width, c.height);
        ctx.lineTo(c.width, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, c.height);
    } else {
        ctx.moveTo(0, c.height / 2);
        ctx.lineTo(c.width, c.height / 2);
    }
    ctx.fill();
    ctx.stroke();
}
function arrayTable(sp, dict, base, properties, fp, sources) {
    tbody = '<table class="atts" >';
    sp.forEach(function (a, j) {
        tbody += '<tr><td class="atts">';
        if ($.isPlainObject(a)) {
            tbody += propertiesTable(a, dict, base, properties, fp, sources);
        } else if (Array.isArray(a) ) {
            tbody += arrayTable(a, dict, base, properties, fp, sources);
        } else {
            a = formatValue(a, dict);
            tbody += a.toString();
        }
        tbody += '</td></tr>';
    });
    tbody += '</table>';
    return tbody;
}
function propertiesTable(p, dict, base, properties, fp, sources) {
    var kys = Object.keys(p);
    tbody = '<table class="atts" >';
    kys.forEach(function (ky, k) {
        var subdict = null;
        if (dict && dict.columns) {
            subdict = dict.columns[ky];
        }
        tbody += '<tr><td class="atts">';
        tbody += formatPropertyNameTooltip(ky, subdict, base, properties, fp, sources);
        tbody += '</td><td class="atts">';
        var sp = p[ky];
        if (Array.isArray(sp)) {
        } else if ($.isPlainObject(sp)) {
            tbody += propertiesTable(sp, subdict, base + '.' + ky, properties, fp, sources);
        } else {
            sp = formatValue(sp, subdict);
            tbody += sp.toString();
        }
        tbody += '</td></tr>';
    });
    tbody += '</table>';
    return tbody; 
}
function formatDate(d, includehours) {
    var str = '';
    if (d) {
        str += d.getFullYear() + '-';
        var m = d.getMonth() + 1;
        if (m < 10) {
            str += '0';
        }
        str += m;
        str += '-';
        var dy = d.getDate();
        if (dy < 10) {
            str += '0';
        }
        str += dy;
        if (includehours) {
            str += ' ';
            var h = d.getHours();
            if (h < 10) {
                str += '0';
            }
            str += h;
            str += ':';
            m = d.getMinutes();
            if (m < 10) {
                str += '0';
            }
            str += m;
        }
    }
    return str;
}
function formatValue(val, dict) {
    if (!isNaN(val)) {
        if (dict && dict.multiplier) {
            val *= dict.multiplier;
        }
        if (!Number.isInteger(val)) {
            var sign = val < 0;
            if (sign) {
                val = -val;
            }
            if (val >= 100000) {
                val = Math.round(val);
            } else if (val >= 10000) {
                val = Math.round(val * 10) / 10;
            } else if (val >= 1000) {
                val = Math.round(val * 100) / 100;
            } else if (val >= 100) {
                val = Math.round(val * 1000) / 1000;
            } else if (val >= 10) {
                val = Math.round(val * 10000) / 10000;
            } else if (val >= 1) {
                val = Math.round(val * 100000) / 100000;
            } else {
                val = Math.round(val * 1000000) / 1000000;
            }
            if (sign) {
                val = -val;
            }
        }
    } else if (typeof (val) == 'string') {
        if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:')) {
            val = '<a href="' + val + '" target="_blank">' + val + '</a>';
        }
        if (dict && dict.isdate) {
            var d = new Date(val);
            if (d && !isNaN(d)) {
                val = formatDate(d, dict.includehours);
            }
        }
    }
    return val;
}
function populateTemplateObject(p, rowid, dict) {
    var row = $('#' + rowid);
    if (p) {
        var keys = Object.keys(p);
        keys.forEach(function (key, i) {
            var subdict = null;
            if (dict && dict.columns) {
                subdict = dict.columns[key];
            }
            var cell = row.find('#' + key);
            var decimals = cell.attr('decimals');
            var val = p[key];
            if (decimals != null && val && !isNaN(val)) {
                if (decimals == 0) {
                    val = Math.round(val);
                } else {
                    var intVal = Math.floor(val);
                    var frac = val - intVal;
                    var n = decimals;
                    var unity = 1;
                    while (n > 0) {
                        frac *= 10;
                        unity *= 10;
                        n--;
                    }
                    frac = Math.round(frac);
                    if (frac == unity) {
                        intVal++;
                        frac = 0;
                    }
                    val = intVal.toString() + '.';
                    unity /= 10;
                    n = decimals;
                    while (frac < unity && n < 0) {
                        val += '0';
                        unity /= 10;
                        n--;
                    }
                    val += frac;
                }
            } else if (Array.isArray(val)) {
                populateTemplateArray(val, rowid, dict);
            } else {
                val = formatValue(val, subdict);
            }
            cell.html(val);
        });
    }
}   
function populateTemplateArray(p, rowid, dict) {
    var tbl = $('#' + rowid).find('table');
    var hdrrow = tbl.find('tr');
    var columns = [];
    hdrrow.children('th').each(function (i) {
        var col = $(this).attr('id');
        columns.push(col);
    });
    p.forEach(function (obj, i) {
        var body = '<tr>';
        columns.forEach(function (col, j) {
            var subdict = null;
            if (dict && dict.columns) {
                subdict = dict.columns[col];
            }
            body += '<td class="atts" >';
            body += formatValue(obj[col], subdict);
            body += '</td>';
        });
        body += '</tr>';
        tbl.append(body);
    });
}
function populateTemplate(p, rowid, dict) {
    if (Array.isArray(p)) {
        populateTemplateArray(p, rowid, dict);
    } else {
        populateTemplateObject(p, rowid, dict);
    }
    var style = {};
    style['border-collapse'] = 'collapse';
    style.border = '1px solid black';
    $('.atts').css(style);
}
function closemetadata() {
    $('#column-metadata').css({ visibility: 'hidden' });
}
function showColumnMetadata(localurl) {
//    alert(localurl);
//    var body = $('#' + localurl).html();
//    alert(body);
//    $('#column-metadata-body').html(body);
    $('#column-metadata').css({ visibility: 'visible' });
}
function formatPropertyName(name, dict, base) {
    var ar = name.split('_');
    var result = '';
    ar.forEach(function (word, i) {
        if (word.length > 0) {
            word = word[0].toUpperCase() + word.slice(1).toLowerCase();
            if (i > 0) {
                result += ' ';
            }
            result += word;
        }
    });
    if (dict && dict.metadata) {
        var localurl = formmetadataID(base, name);
        var link = '<a href="#' + localurl + '" onclick="opendatasourcedivs(\'' + localurl +'\' );" >';
//        var link = '<a onclick="opendatasourcedivs(\'' + localurl +'\' );" >';
        result = link + result + '</a>';
    }
    return result;
}
function formatPropertyNameTooltip(name, dict, base, properties, fp, sources) {
    var layername = properties['layerName'];
    var tooltip = formColumnMetadata(dict, name, base, layername, properties, fp, sources, true);
    var body = '';
    if (tooltip && tooltip.length > 0) {
        body += '<span class="tooltip" >';
    }
    body += formatPropertyName(name, dict, base);
    if (tooltip && tooltip.length > 0) {
        body += '<span class="tooltiptext" style="left:50px;right:unset;top:0px;bottom:unset;width:450px;">';
        body += '<table>' + tooltip + '</table>';
        body += '</span>'; 
        body += '</span>';
    }
    return body;
}
function opendatasourcedivs(localurl)
{
    fd_open_div('columndescriptions');
    fd_open_div('datasourcesused');
    fd_open_div('geometrydatasources');
    $('#column-metadata').css({ visibility: 'visible' });
    // Find localurl and bring to top of window
    var u = $('#' + localurl);
    if (u.length > 0) {
        u.get(0).scrollIntoView();
    }
}
function formatDataSource(src) {
    var tbody = "";
    if (src.name) {
        tbody += '<tr><td style="width:120px;"></td><td style="width:100%;"><strong>' + src.name + '</strong></td></tr>';
    }
    if (src.url) {
        tbody += '<tr><td>Downloaded from:</td><td>';
        if (src.url.startsWith('http://') || src.url.startsWith('https://')) {
            tbody += '<a href="' + src.url + '" + target="_blank">' + src.url + '</a>';
        } else {
            tbody += src.url;
        }
        tbody += '</td></tr>';
    }
    if (src.datadate || src.downloaddate) {
        tbody += '<tr><td>Dates</td><td><table style="border:none;"><tr>';
        if (src.datadate) {
            tbody += '<td style="border:none;">Data last updated:</td><td style="border:none;">' + src.datadate + '</td>';
        }
        if (src.downloaddate) {
            tbody += '<td style="border:none;">Downloaded:</td><td style="border:none;">' + src.downloaddate + '</td>';
        }
        tbody += '</tr></table></tr>';
    }
    if (src.licence) {
        tbody += '<tr><td>Licence</td><td><a href="' + src.licence + '" + target="_blank">' + src.licence + '</a></td></tr>';
    }
    if (src.updatefrequency) {
        tbody += '<tr><td>Update Frequency</td><td>' + src.updatefrequency + '</td></tr>';
    }
    if (src.geography) {
        tbody += '<tr><td>Geography</td><td>' + src.geography + '</td></tr>';
    }
    if (src.notes) {
        tbody += '<tr><td>Notes:</td><td>' + formSummary(src.notes, null, null);
    }
    return tbody;
}
function formColumnText(dict, layername, properties, fp, sources) {
    var tbody = "";
    if (dict.metadata) {
        if (dict.metadata.description) {
            var desc = formSummary(dict.metadata.description, layername, properties);
            if (desc[0] != '<') {
                desc = '<p>' + desc + '</p>';
            }
            tbody += desc;
        }
        if (dict.metadata.sources) {
            tbody += '<p>Sources:</p>';
            dict.metadata.sources.forEach(function (source, j) {
                sources[source.source] = fp.dictionary.sources[source.source];
                tbody += '<p>';
                if (source.layer) {
                    tbody += source.layer;
                    tbody += ' ';
                }
                if (source.source) {
                    var src = fp.dictionary.sources[source.source];
                    if (src) {
                        var key = '_datasource:' + source.source;
                        tbody += '<a href="#' + key;
                        tbody += '" onclick="opendatasourcedivs(\'' + key + '\' );">' + src.name + '</a>';
                    } else {
                        tbody += source.source;
                    }
                }
                tbody += '</p>';
            });
        }
    }
    return tbody;
}
function formmetadataID(base, prop) {
    var tbody = '_metadata:';
    if (base) {
        tbody += base + '.';
    }
    tbody += prop;
    return tbody;
}
function formColumnMetadata(dict, prop, base, layername, properties, fp, sources, noid) {
    var tbody = '';
    var p = properties[prop];
    if (dict) {
        var propn = formatPropertyName(prop, null, null);
        var coltext = formColumnText(dict, layername, properties, fp, sources);
        if ($.isPlainObject(p) || Array.isArray(p)) {
            tbody += '<tr>';
            tbody += '<th colspan="2"';
            if (!noid) {
                tbody += ' id="' + formmetadataID(base, prop) + '"';
            }
            tbody += '>';
            tbody += '<strong>' + prop + '</strong></th></tr>';
            if (coltext.length > 0) {
                tbody += '<tr><td>Description</td><td>' + coltext + '</td></tr>';
            }
        } else if (coltext.length > 0) {
            tbody += '<tr>';
            tbody += '<td';
            if (!noid) {
                tbody += ' id="' + formmetadataID(base, prop) + '"';
            }
            tbody += '>' + propn + '</td>';
            tbody += '<td>' + coltext + '</td></tr>';
        }
    }
    if ($.isPlainObject(p) && dict) {
        var subbase = '';
        if (base && base.length > 0) {
            subbase += base + '.';
        }
        subbase += prop;
        tbody += formObjectColumnMetadata(dict, prop, subbase, p, layername, properties, fp, sources);
    }
    if (Array.isArray(p) && p[0] && dict) {
        var subbase = '';
        if (base && base.length > 0) {
            subbase += base + '.';
        }
        subbase += prop;
        tbody += formObjectColumnMetadata(dict, prop, subbase, p[0], layername, properties, fp, sources);
    }
    return tbody;
}
function formObjectColumnMetadata(dict, prop, base, obj, layername, properties, fp, sources) {
    var tbody = '';
    if (dict && dict.columns) {
        var keys = Object.keys(obj);
        keys.forEach(function (key, i) {
            var subdict = null;
            if (dict && dict.columns) {
                subdict = dict.columns[key];
            }
            if (subdict) {
                tbody += formColumnMetadata(subdict, key, base, layername, properties, fp, sources,false);
            }
        });
    }
    return tbody;
}
var lastfocus = null;
function fd_open_div(divname) {
    var div = $('#' + divname);
    var btn = $('#' + divname + '_btn');
    div.css({ display: 'block' });
    btn.text('-');
}
function fd_show_div(divname, buttonname, group, groupbtn) {
    var div = $('#' + divname);
    if (lastfocus == divname) {
        lastfocus = null;
    } else {
        if (div.css('display') == 'none') {
            if (groupbtn) {
                $('.' + groupbtn).text('+');
            }
            if (group) {
                $('.' + group).css({ display: 'none' });
                lastfocus = null;
            }
            div.css({ display: 'block' });
            $('#' + buttonname).text('-');
        } else {
            div.css({ display: 'none' });
            $('#' + buttonname).text('+');
        }
    }
}
function formdivbtn(divid, title, defopen, printit, group, tooltip) {
    var tbody = ''
    if (!printit) {
        if (tooltip) {
            tbody += '<span class="tooltip" >';
        }
        tbody += '<button type="button" id="' + divid + '_btn"';
        if (group) {
            tbody += ' class="attributes_btn" ';
        }
        tbody += 'onclick="fd_show_div(\'' + divid + '\',\'' + divid + '_btn\'';
        if (group) {
            tbody += ',\'attributes\',\'attributes_btn\'';
        }
        tbody += ');" >';
        if (defopen) {
            tbody += '-';
        } else {
            tbody += '+';
        }
        tbody += '</button>' + title;
        if (tooltip) {
            tbody += tooltiphtml(tooltip);
            tbody += '</span>';
        }
        tbody += '<br/>';
    }
    tbody += '<div id="' + divid + '"';
    if (group) {
        tbody += ' class="attributes" ';
    }
    if (!defopen && !printit) {
        tbody += ' style="display:none;"';
    }
    tbody += '>';
    return tbody;
}
function featureDetails(fp, div, printit) {
    if (fp.attributeview && fp.attributeview.attributes && fp.attributeview.attributes instanceof Function) {
        return fp.attributeview.attributes(fp, div);
    }
    var properties = fp.feature.getProperties();
    var id = fp.feature.getId();
    var tbody = '</br>';
    // Add in links
    var links = fp.layerdef.links;
    if (links) {
        links.forEach(function (link, i) {
            var url = "";
            if (link.url) {
                link.url.forEach(function (a, j) {
                    if (a[0] == '.') {
                        a = a.slice(1);
                        a = properties[a];
                    }
                    url += a;
                });
                var text = url;
                if (link.text) {
                    text = "";
                    if (Array.isArray(text)) {
                        link.text.forEach(function (a, j) {
                            if (a[0] == '.') {
                                a = a.slice(1);
                                a = properties[a];
                            }
                            text += a;
                        });
                    } else {
                        text = link.text;
                    }
                }
                tbody += '<a href="' + url + '" target="_blank" >' + text + '</a></br>';
            }
        });
    }
    var tooltip = fp.tooltips['expandatts'];
    tbody += formdivbtn('attributes', 'Attributes', true, printit, true, tooltip);
    tbody += '<table class="atts" >';
    tbody += '<tr>';
    tbody += '<td class="atts" >ID</td>';
    tbody += '<td class="atts" >' + id + '</td><td></td>';
    tbody += '</tr>';
    var keys = null;
    if (fp.attributeview && fp.attributeview.attributes) {
        keys = fp.attributeview.attributes;
    } else {
        keys = Object.keys(properties);
    }
    // Sources is built from processing column metadata
    var sources = {};
    keys.forEach(function (prop, j) {
        if (prop != 'geometry') {
            var dict = null;
            if (fp.dictionary && fp.dictionary.columns) {
                dict = fp.dictionary.columns[prop];
            }
            propn = formatPropertyNameTooltip(prop, dict, null, properties, fp, sources);
            var p = properties[prop];
            if (p) {
                if ($.isPlainObject(p)) {
                } else if (Array.isArray(p)) {
                } else {
                    tbody += '<tr>';
                    tbody += '<td class="atts">' + propn + '</td>';
                    tbody += '<td class="atts">';
                    if (p) {
                        p = formatValue(p, dict);
                        tbody += p.toString();
                    }
                    tbody += '</td>';
                    tbody += '<td>';
                    if (dict && dict.units) {
                        tbody += dict.units;
                    }
                    tbody += '</td>';
                    tbody += '</tr>';
                }
            }
        }
    });
    tbody += '</table>';
    tbody += '</div>';
    keys.forEach(function (prop, j) {
        if (prop != 'geometry') {
            var dict = null;
            if (fp.dictionary && fp.dictionary.columns) {
                dict = fp.dictionary.columns[prop];
            }
            propn = formatPropertyName(prop, dict, null);
            var p = properties[prop];
            if (p) {
                var rowid = id + "_" + prop;
                if ($.isPlainObject(p)) {
                    tbody += formdivbtn(rowid, propn, false, printit, true, tooltip);
                    if (fp.templates[prop]) {
                    } else {
                        tbody += '<h2>' + propn + '</h2>';
                        tbody += propertiesTable(p, dict, prop, properties, fp, sources);
                    }
                    tbody += '</div>';
                } else if (Array.isArray(p)) {
                    tbody += formdivbtn(rowid, propn, false, printit, true, tooltip);
                    if (fp.templates[prop]) {
                    } else {
                        tbody += '<h2>' + propn + '</h2>';
                        tbody += arrayTable(p, dict, prop, properties, fp, sources);
                    }
                    tbody += '</div>';
                }
            }
        }
    });
    if (fp.measures) {
        tbody += formdivbtn('measurements', 'Measurements', false, printit, true, tooltip);

        tbody += '<h2>Measurements</h2>';
        tbody += propertiesTable(fp.measures, null, null, properties, fp, sources);
        tbody += '</div>';
    }
    if (!printit) {
        $('#' + div).html(tbody);
        tbody = '';
    }
    // Output metadata - main datasource
    var layername = properties['layerName'];
    if (fp.dictionary && fp.dictionary.layers && fp.dictionary.sources) {
        var layer = fp.dictionary.layers[layername];
        if (layer) {
            tbody += formdivbtn('geometrydatasources', 'Data Sources', false, printit, false, tooltip);
            tbody += '<h2>Geometry Data Sources</h2>';
            tbody += '<table>';
            if (layer.description) {
                var desc = formSummary(layer.description, layername, properties);
                tbody += '<tr><td>Description:</td><td>' + desc + '</td></tr>';
            }
            layer.sources.forEach(function (source, j) {
                var src = fp.dictionary.sources[source];
                if (src) {
                    tbody += formatDataSource(src);
                } else {
                    tbody += source;
                }
            });
            tbody += '</table>';
            tbody += '</div>';
        }
    }
    // Output column metadata
    tbody += formdivbtn('columndescriptions', 'Column Descriptions', false, printit, false, tooltip);
    tbody += '<h2>Column Descriptions</h2>';
    var keys = Object.keys(properties);
    tbody += '<table class="atts" >';
    keys.forEach(function (prop, i) {
        var dict = null;
        if (fp.dictionary && fp.dictionary.columns) {
            dict = fp.dictionary.columns[prop];
        }
        var p = properties[prop];
        if (p) {
            if ($.isPlainObject(p)) {
            } else if (Array.isArray(p)) {
            } else {
                tbody += formColumnMetadata(dict, prop, null, layername, properties, fp, sources,false);
            }
        }
    });
    keys.forEach(function (prop, i) {
        var dict = null;
        if (fp.dictionary && fp.dictionary.columns) {
            dict = fp.dictionary.columns[prop];
        }
        var p = properties[prop];
        if (p) {
            if ($.isPlainObject(p)) {
                tbody += formColumnMetadata(dict, prop, null, layername, properties, fp, sources,false);
            } else if (Array.isArray(p)) {
                tbody += formColumnMetadata(dict, prop, null, layername, properties, fp, sources,false);
            }
        }
    });
    tbody += '</table>';
    tbody += '</div>';
    // Output datasources used
    tbody += formdivbtn('datasourcesused', 'Data Sources Used', false, printit, false, tooltip);
    var sourcekeys = Object.keys(sources);
    if (sourcekeys.length > 0) {
        tbody += '<h2>Other datasources</h2>';
        tbody += '<table class="atts" >';
        var ssources = [];
        sourcekeys.forEach(function (key, j) {
            var src = sources[key];
            if (src) {
                src.key = key;
                ssources.push(src);
            }
        });
        ssources.sort(function (a, b) {
            if (a.priority && b.priority) {
                return a.priority - b.priority;
            } else if (a.priority) {
                return -1;
            }
            return 1;
        });
        ssources.forEach(function (src, j) {
            tbody += '<table class="atts" id="_datasource:' + src.key + '">';
            tbody += formatDataSource(src);
            tbody += '</table>';
        });
        tbody += '</table>';
    }
    tbody += '</div>';
    if (printit) {
        $('#' + div).html(tbody);
    } else {
        $('#column-metadata-body').html(tbody);
    }
    // Populate templated attributes
    var keys = Object.keys(properties);
    keys.forEach(function (prop, i) {
        if (fp.templates[prop]) {
            var dict = null;
            if (fp.dictionary && fp.dictionary.columns) {
                dict = fp.dictionary.columns[prop];
            }
            var rowid = id + "_" + prop;
            var p = properties[prop];
            if (fp.templates[prop].html) {
                $('#' + rowid).html(fp.templates[prop].html);
                populateTemplate(p, rowid, dict);
            } else {
                var url = fp.templatebase + fp.templates[prop].path;
                $.ajax({
                    url: url,
                    method: 'get',
                    dataType: 'text',
                    data: Date(),
                    processData: false,
                    contentType: 'text/html',
                    success: function (data) {
                        fp.templates[prop].html = data;
                        $('#' + rowid).html(data);
                        populateTemplate(p, rowid, dict);
                    },
                    error: function (err) {
                        if (err.status == 404) {
                            alert(url + " Not Found");
                        } else {
                            alert("Unable to load " + url + " err : " + JSON.stringify(err));
                        }
                    }
                });
            }
        }
    });
    return tbody;
}
function formSummaryElement(prop, name, properties) {
    var body = '';
    if (prop == '+layername' && name) {
        body += name;
    } else if (prop[0] == '.' && properties) {
        var elems = prop.slice(1).split('.');
        var v = properties;
        elems.forEach(function (elem, k) {
            if (v) {
                v = v[elem];
            }
        });
        if (v) {
            body += formatValue(v, null);
        }
    } else if (prop.startsWith('http://') || prop.startsWith('https://')) {
        body += '<a href="' + prop + '" target="_blank" >' + prop + '</a>';
    } else {
        body += prop;
    }
    return body;
}
function formSummary(summary, name, properties) {
    var body = '';
    if (summary && summary instanceof Function) {
        body += summary(name, properties);
    } else if (summary) {
        if (Array.isArray(summary)) {
            summary.forEach(function (prop, j) {
                if (body.length > 0) {
                    body += " ";
                }
                body += formSummaryElement(prop, name, properties)
            });
        } else {
            body += formSummaryElement(summary, name, properties)
        }
    }
    return body;
}
function closedetail() {
    $('#detail').hide();
}
function greyscale(context, fade) {
    var width = context.canvas.width;
    var height = context.canvas.height;

    var inputData = context.getImageData(0, 0, width, height).data;

    var ctx = context.canvas.getContext('2d');
    ctx.fillStyle = "rgba(0, 0, 0, 0)"
    var myImageData = ctx.createImageData(width, height);
    var d = myImageData.data;

    for (i = 0; i < inputData.length; i += 4) {

        var r = inputData[i];
        var g = inputData[i + 1];
        var b = inputData[i + 2];
        // CIE luminance for the RGB
        var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        v = 255 - (255 - v) * fade;
        d[i + 0] = v; // Red
        d[i + 1] = v; // Green
        d[i + 2] = v; // Blue
        d[i + 3] = 255; // Alpha
    }
    ctx.putImageData(myImageData, 0, 0);
}
var mapDisplays = {};
function popupcloser(mapdiv) {
    if (mapDisplays[mapdiv]) {
        var mapDisplay = mapDisplays[mapdiv];
        mapDisplay.popupcloser();
        if (mapDisplay.master) {
            mapDisplay.master.popupcloser();
        }
        mapDisplay.slaveDisplays.forEach(function (slave, i) {
            slave.popupcloser();
        });
    }
}
function on_top(id) {
    $('#' + id).animate({ scrollTop: 0 }, "fast");
}
function onlink(mapdiv, id, layerDef, fid) {
    if (mapDisplays[mapdiv]) {
        mapDisplays[mapdiv].onlink(id, layerDef, fid);
    }
}
function oncontrolgroup(mapdiv, layerName) {
    var map = mapDisplays[mapdiv];
    if (map) {
        map.oncontrolgroup(layerName);
    }
}
function getFeatureProps(mapdiv, listdiv, layerName, id) {
    if (mapDisplays[mapdiv]) {
        return mapDisplays[mapdiv].getFeatureProps(listdiv, layerName, id);
    }
    return null;
}
function layerchanged(mapdiv, layerName) {
    if (mapDisplays[mapdiv]) {
        mapDisplays[mapdiv].layerchanged(layerName);
    }
}
function layerclickChanged(mapdiv, layerName) {
    if (mapDisplays[mapdiv]) {
        mapDisplays[mapdiv].layerclickChanged(layerName);
    }
}
function onclickrow(mapdiv, id, layerDef, fid) {
    if (mapDisplays[mapdiv]) {
        mapDisplays[mapdiv].onclickrow(id, layerDef, fid);
    }
}
function control_show_div(divid, layers) {
    // divid is 3 fields delimited by :
    // first is mapdiv , second is control, third is group index
    var a = divid.split('_');
    if (a.length > 0) {
        var map = mapDisplays[a[0]];
        if (map) {
            map.control_show_div(divid, layers);
        }
    }
}
function osattribution() {
    var d = new Date();
    var year = d.getFullYear();
    return 'Contains OS data © Crown copyright ' + year
}
function createMapDisplay(mapdiv, controldiv, selecteddiv, options) {
    var mapDisplay = {};
    mapDisplay.dataurlbase = '/mapping/Teignbridge/';
    mapDisplay.templatebase = '/mapping/Templates/';
    mapDisplay.dictionary = null;
    mapDisplay.dictionaryurl = '/mapping/Teignbridge/dictionary.json';
    mapDisplay.showcheckboxes = true;
    mapDisplay.coorddiv = null;
    mapDisplay.popupdiv = 'popup';
    mapDisplay.haspopup = true;
    mapDisplay.detailLeft = false;
    mapDisplay.forceshift = false;
    mapDisplay.zoom = 10;
    var myurl = window.location.href;
    var i = myurl.indexOf('/', 9)
    mapDisplay.origin = myurl.substr(0, i);
    i = myurl.lastIndexOf('/');
    mapDisplay.referer = myurl.substr(0, i + 1);
    i = window.location.href.indexOf('localhost');
    if (i >= 0) {
        //        mapDisplay.origin = '*';
        //        mapDisplay.referer = '*';
    }
    mapDisplay.proxy = '/mapping/proxy.php';
    //    alert("Origin: " + mapDisplay.origin + " Referer: " + mapDisplay.referer);
    mapDisplay.centre = [-3.6524438129747687, 50.605];
    mapDisplay.tooltips = gettooltips('legend');
    mapDisplay.controlHeader = {
        header: true, description: 'Description', symbolWidth: 16, themeIndent: 10
    };
    mapDisplay.findLayerName = null;
    mapDisplay.autopan = true;
    mapDisplay.multiSelect = true;
    mapDisplay.onFeatureSelected = null;
    mapDisplay.noInteraction = null;
    mapDisplay.interactions = null;
    mapDisplay.summarisePoint = null;
    mapDisplay.onclick = null;
    mapDisplay.selectStyle = null;
    mapDisplay.background = 'OpenStreetMap'
    mapDisplay.srs = 3857;
    if (options) {
        if (options.checkboxes != null) {
            mapDisplay.showcheckboxes = options.checkboxes;
        }
        if (options.dataurlbase) {
            mapDisplay.dataurlbase = options.dataurlbase;
        }
        if (options.templatebase) {
            mapDisplay.templatebase = options.templatebase;
        }
        if (options.coorddiv) {
            mapDisplay.coorddiv = options.coorddiv;
        }
        if (options.popupdiv) {
            mapDisplay.popupdiv = options.popupdiv;
        }
        if (options.detailLeft) {
            mapDisplay.detailLeft = options.detailLeft;
        }
        //        if (options.haspopup) {
        //            mapDisplay.haspopup = options.haspopup;
        //        }
        if (options.forceshift) {
            mapDisplay.forceshift = options.forceshift;
        }
        if (options.zoom) {
            mapDisplay.zoom = options.zoom;
        }
        if (options.centre) {
            mapDisplay.centre = options.centre;
        }
        if (options.controlHeader) {
            var keys = Object.keys(options.controlHeader);
            keys.forEach(function (key, i) {
                mapDisplay.controlHeader[key] = options.controlHeader[key];
            });
        }
        if (options.dictionaryurl) {
            mapDisplay.dictionaryurl = options.dictionaryurl;
        }
        if (options.origin) {
            mapDisplay.origin = options.origin;
        }
        if (options.referer) {
            mapDisplay.referer = options.referer;
        }
        if (options.proxy) {
            mapDisplay.proxy = options.proxy;
        }
        if (options.autopan === false || options.autopan === true) {
            mapDisplay.autopan = options.autopan;
        }
        if (options.multiSelect === false || options.multiSelect === true) {
            mapDisplay.multiSelect = options.multiSelect;
        }
        if (options.onFeatureSelected) {
            mapDisplay.onFeatureSelected = options.onFeatureSelected;
        }
        if (options.noInteraction) {
            mapDisplay.interactions = {
                altShiftDragRotate: false,
                doubleClickZoom: false,
                keyboard: false,
                mouseWheelZoom: false,
                shiftDragZoom: false,
                dragPan: false,
                pinchRotate: false,
                pinchZoom: false,
            };
        }
        if (options.summarisePoint) {
            mapDisplay.summarisePoint = options.summarisePoint;
        }
        if (options.onclick) {
            mapDisplay.onclick = options.onclick;
        }
        if (options.selectStyle) {
            mapDisplay.selectStyle = options.selectStyle;
        }
        if (options.srs) {
            mapDisplay.srs = options.srs;
            if (mapDisplay.srs == 27700) {
                mapDisplay.background = 'OSOutdoor';
                //mapDisplay.zoom = options.zoom ? options.zoom : 3;
            }
        }
        if (options.background) {
            switch (options.background) {
                case 'OpenStreetMap':
                    mapDisplay.background = 'OpenStreetMap';
                    break;
                case 'OSRoad':
                    mapDisplay.background = 'OSRoad';
                    break;
                case 'OSLight':
                    mapDisplay.background = 'OSLight';
                    break;
                case 'OSOutdoor':
                    mapDisplay.background = 'OSOutdoor';
                    break;
            }
        }
    }
    mapDisplays[mapdiv] = mapDisplay;
    mapDisplay.greymap = false;
    mapDisplay.fade = 1.0;
    mapDisplay.master = null;
    mapDisplay.layerDefs = null;
    mapDisplay.findlayerdefn = function (layer) {
        layerdef = null;
        var keys = Object.keys(mapDisplay.layerDefs);
        keys.forEach(function (key, i) {
            var ld = mapDisplay.layerDefs[key];
            if (ld.layer == layer) {
                layerdef = ld;
            }
        });
        return layerdef;
    }
    // Paths of html templates for attributes
    mapDisplay.templates = {};
    function ostileUrlFunction(coord) {
        //console.log('coord: ' + coord);
        var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';
        var type = 'Outdoor_';
        switch (mapDisplay.background) {
            case 'OSRoad':
                type = 'Road_';
                break;
            case 'OSLight':
                type = 'Light_';
                break;
            case 'OSOutdoor':
                type = 'Outdoor_';
                break;
        }
        if (mapDisplay.srs == 27700) {
            coord[0] -= 7;
            if (coord[0] < 0) {
                coord[0] = 0;
            }
        }
        var url = serviceUrl + '/' + type + mapDisplay.srs + '/' + coord[0] + '/' + coord[1] + '/' + coord[2] + '.png?key=' + OSMapsapiKey;
        //console.log('coord: ' + coord + ' url: ' + url);
        return url;
    }
    function formOSMapLayer(type) {
        var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy'
        var ostilegrid = new ol.tilegrid.TileGrid({
            resolutions: [
                903, 902, 901, 900, 899, 898, 897, // these are to make OS zoom levels match the ol default
                896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75],
            origin: [-238375.0, 1376256.0]  // north west of shetland
        });
        if (mapDisplay.srs == 27700) {
            maplayer = new ol.source.XYZ({
                minZoom: 7,
                maxZoom: 16,
                projection: 'EPSG:27700',
                extent: [-238375.0, 0.0, 900000.0, 1376256.0],
                tileGrid: ostilegrid,
                tileUrlFunction: ostileUrlFunction,
                attributions: osattribution(),
                attributionsCollapsible: false
            });
        } else {
            maplayer = new ol.source.XYZ({
                minZoom: 7,
                maxZoom: 16,
                projection: 'EPSG:3857',
                attributions: osattribution(),
                attributionsCollapsible: false,
                url: serviceUrl + '/' + type + '_3857/{z}/{x}/{y}.png?key=' + OSMapsapiKey
            });
        }
        return maplayer;
    }
    mapDisplay.formBackgroundSource = function (type) {
        var maplayer = null;
        switch (type) {
            case 'OpenStreetMap':
                maplayer = new ol.source.OSM();
                break;
           case 'OSRoad':
                maplayer = formOSMapLayer('Road');
                break;
            case 'OSLight':
                maplayer = formOSMapLayer('Light');
                break;
            case 'OSOutdoor':
                maplayer = formOSMapLayer('Outdoor');
                break;
        }
        return maplayer;
    }
    var maplayer = mapDisplay.formBackgroundSource(mapDisplay.background);
    mapDisplay.osmLayer = new ol.layer.Tile({
        source: maplayer
    });
    var mapoptions = {
        target: mapdiv,
        layers: [
            mapDisplay.osmLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(mapDisplay.centre, 'EPSG:' + mapDisplay.srs),
            projection: 'EPSG:' + mapDisplay.srs,
            zoom: mapDisplay.zoom
        })
    };
    mapDisplay.setBackground = function (type) {
        var maplayer = mapDisplay.formBackgroundSource(type);
        mapDisplay.osmLayer.setSource(maplayer);
        mapDisplay.map.render();
    }
    if (mapDisplay.interactions) {
        mapoptions.interactions = ol.interaction.defaults(mapDisplay.interactions);
    }
    if (mapDisplay.haspopup) {
        mapDisplay.overlay = new ol.Overlay({
            element: $('#' + mapDisplay.popupdiv).get(0),
            autoPan: mapDisplay.autopan,
            autoPanAnimation: {
                duration: 250
            }
        });
        mapoptions.overlays = [mapDisplay.overlay];
    }
    mapDisplay.map = new ol.Map(mapoptions);
    mapDisplay.osmLayer.on('postrender', function (event) {
        if (mapDisplay.greymap) {
            greyscale(event.context, mapDisplay.fade);
        }
    });
    mapDisplay.getFeatureProps = function (div, layerName, id) {
        var feature = mapDisplay.getFeature(layerName, id)
        var ld = mapDisplay.findLayerDef(feature);
        var atviews = null;
        var atview = null;
        if (div) {
            var ar = div.split('_');
            if (ar.length > 1) {
                div = ar[0];
            }
            atviews = mapDisplay.getAttributeViews(div);
            atview = mapDisplay.getAttributeView(div, feature);
        }
        var properties = feature.getProperties();
        var geom = properties['geometry'];
        var measures = null;
        if (geom) {
            if (atview && atview.measures != null) {
                if (atview.measures == true) {
                    measures = geometryMeasures(geom, mapDisplay);
                }
            } else {
                measures = geometryMeasures(geom, mapDisplay);
            }
        }
        var templates = mapDisplay.templates;
        var dictionary = mapDisplay.dictionary;
        var templatebase = mapDisplay.templatebase;
        if (atviews) {
            if (atviews.templates) {
                templates = atviews.templates;
            }
            if (atviews.templatebase) {
                templatebase = atviews.templatebase;
            }
        }
        var obj = {
            feature: feature,
            layerdef: ld,
            attributeview: atview,
            templates: templates,
            templatebase: templatebase,
            measures: measures,
            dictionary: dictionary,
            tooltips: mapDisplay.tooltips
        }
        return obj;
    }
    mapDisplay.setFeatureAttribute = function (layerName, id, name, value) {
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                if (layerDef.vectorSource) {
                    // TODO get feature by id and set property
                    var feature = layerDef.vectorSource.getFeatureById(id);
                    if (feature) {
                        feature.set(name, value, false);
                    }
                }
            }
        }
    }
    mapDisplay.getFeature = function (layerName, id) {
        var feature = null;
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                feature = layerDef.vectorSource.getFeatureById(id);
            }
        }
        return feature;
    }
    mapDisplay.getFeaturesSeedIntersecting = function (layerName, geom) {
        var features = [];
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                var extent = geom.getExtent();
                layerDef.vectorSource.forEachFeature(function (f) {
                    var g = f.getGeometry();
                    var ext = g.getExtent();
                    if (ol.extent.intersects(extent, ext)) {
                        var pt = geometrySeed(g);
                        var coord = pt.getCoordinates();
                        if (coord) {
                            if (geom.intersectsCoordinate(coord)) {
                                features.push(f);
                            }
                        }
                    }
                });
            }
        }
        return features;
    }
    mapDisplay.getFeaturesIntersecting = function(layerName, coord){
        var features = [];
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                layerDef.vectorSource.forEachFeature(function (f) {
                    var g = f.getGeometry();
                    var ext = g.getExtent();
                    if (ol.extent.containsCoordinate(ext, coord)) {
                        if (g.intersectsCoordinate(coord)) {
                            features.push(f);
                        }
                    }
                });
            }
        }
        return features;
    };
    mapDisplay.getVectorSource = function (layerName) {
        var vectorSource = null;
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                vectorSource = layerDef.vectorSource;
            }
        }
        return vectorSource;
    }
    mapDisplay.getFeatures = function (layerName) {
        var features = [];
        var source = mapDisplay.getVectorSource(layerName);
        if (source) {
            // This only returns features with geometry
            //source.forEachFeature(function (f) {
            //    features.push(f);
            //});
            features = source.getFeatures();
        }
        return features;
    }
    mapDisplay.setGreyBackmap = function (enable) {
        mapDisplay.fade = 1;
        mapDisplay.greymap = enable;
        mapDisplay.map.render();
    }
    mapDisplay.setFadeGreyBackmap = function (enable, newfade) {
        mapDisplay.greymap = enable;
        mapDisplay.fade = newfade;
        mapDisplay.map.render();
    }
    mapDisplay.setMapOpacity = function (opacity) {
        mapDisplay.osmLayer.setOpacity(opacity);
        mapDisplay.map.render();
    }
    mapDisplay.seconds = 0;
    mapDisplay.fetchTimer = function () {
        mapDisplay.seconds++;
        $('#count').text(mapDisplay.seconds.toString());
    }
    mapDisplay.layerQueue = [];
    mapDisplay.slaveDisplays = [];
    mapDisplay.addSlave = function (display) {
        display.master = mapDisplay;
        mapDisplay.slaveDisplays.push(display);
    }
    mapDisplay.setView = function (view) {
        mapDisplay.map.setView(view);
    }
    mapDisplay.getView = function () {
        return mapDisplay.map.getView();
    }
    mapDisplay.map.on('moveend', function (event) {
        //$('#activity').text(mapdiv + ' : moveend event');
        var view = mapDisplay.map.getView();
        if (mapDisplay.master) {
            mapDisplay.master.setView(view);
        }
        if (mapDisplay.slaveDisplays) {
            mapDisplay.slaveDisplays.forEach(function (display, i) {
                display.setView(view);
            });
        }
    });
    if (mapDisplay.coorddiv) {
        mapDisplay.map.on('pointermove', function (e) {
            var coord = e.coordinate;
            var pt = new ol.geom.Point(coord, 'XY');
            var tx = '';
            if (mapDisplay.summarisePoint) {
                tx = mapDisplay.summarisePoint(pt,e);
            } else {
                tx = formatPoint(pt, 'EPSG:27700', mapDisplay);
            }
            $('#' + mapDisplay.coorddiv).text(tx);
        });
    }
    if (mapDisplay.onclick) {
        mapDisplay.map.on('click', function (event) {
            var coord = event.coordinate;
            var pt = new ol.geom.Point(coord, 'XY');
            mapDisplay.onclick(mapDisplay, pt);
        });
    }
    if (mapDisplay.forceshift) {
        mapDisplay.map.on('wheel', function (e) {
            if (ol.events.condition.shiftKeyOnly(e) !== true) {
                e.preventDefault();
                if (mapDisplay.haspopup) {
                    $('#' + mapDisplay.popupdiv).find('#popup-content').html('Press Shift Key to zoom the map');
                    var extent = mapDisplay.map.getView().calculateExtent();
                    var bl = ol.extent.getBottomLeft(extent);
                    var tr = ol.extent.getTopRight(extent);
                    var coord = [
                        bl[0] * 0.8 + tr[0] * 0.2,
                        (bl[1] + tr[1]) / 2
                    ];
                    mapDisplay.overlay.setPosition(coord);
                    setTimeout(function () {
                        mapDisplay.popupcloser();
                    }, 1000);
                    if (mapDisplay.master) {
                        mapDisplay.master.popupcloser();
                    }
                    mapDisplay.slaveDisplays.forEach(function (slave, i) {
                        slave.popupcloser();
                    });
                }

            }
        });
    }
    mapDisplay.popupcloser = function () {
        mapDisplay.overlay.setPosition(undefined);
        $('#' + mapDisplay.popupdiv).find('#popup-closer').get(0).blur();
        //mapDisplay.setSelectHover(false);
        return false;
    }
    mapDisplay.oncontrolgroup = function (layerName) {
        var btntext = $('#control_' + layerName + '_btn').text();
        if (btntext == '-') {
            $('.control_' + layerName).hide();
            $('#control_' + layerName + '_btn').text('+');
        } else {
            $('.control_' + layerName).show();
            $('#control_' + layerName + '_btn').text('-');
        }
    }
    mapDisplay.populateControlLayers = function (controldiv, layerDefs, nogroup) {
        var cbody = '<table>';
        var symbolWidth = mapDisplay.controlHeader.symbolWidth;
        var themeIndent = mapDisplay.controlHeader.themeIndent;
        var keys = Object.keys(layerDefs);
        keys.forEach(function (layerName, i) {
            var layerDef = layerDefs[layerName];
            if (!nogroup || layerDef.nogroup) {
                cbody += '<tr id="' + layerName + '" style="height:16px;" >';
                if (mapDisplay.showcheckboxes) {
                    cbody += '<td style="width: 20px;height:16px;" >';
                    cbody += formattooltip(mapDisplay.tooltips,'on',
                        '<input type="checkbox" id="on"  onchange="layerchanged(\'' + mapdiv + '\',\'' + layerName + '\');" />');
                    cbody += '</td><td style="width: 30px;height:16px;" >';
                    cbody += formattooltip(mapDisplay.tooltips,'clickable',
                        '<input type="checkbox" id="clickable" onchange="layerclickChanged(\'' + mapdiv + '\',\'' + layerName + '\');" />');
                    cbody += '</td>';
                }
                cbody += '<td style="width:16px;height:16px;">';
                // Each legend element is drawn as a map
                var representation = '';
                if (layerDef.style.image) {
                    representation += '<div id="' + controldiv + '_' + i + '" style="width:' + symbolWidth + 'px; height:16px;" ></div>';
                } else {
                    representation += '<canvas id="' + controldiv + '_' + i + '" width="' + symbolWidth + '" height="16" ></canvas>';
                }
                cbody += formattooltip(mapDisplay.tooltips, 'layerrep', representation);
                cbody += '</td><td class="control_description" style="width:300px;height:16px;">';
                if (layerDef.themes) {
                    cbody += formattooltip(mapDisplay.tooltips, 'expandtheme',
                        '<button type="button" id="control_' + layerName + '_btn" onclick="oncontrolgroup(\'' + mapdiv + '\',\'' + layerName + '\');">-</button>');
                }
                /*
                var tooltext = layerDef.name;
                if (mapDisplay.dictionary) {
                    var dictlayer = mapDisplay.dictionary.layers[layerName];
                    if (dictlayer && dictlayer.description) {
                        if (Array.isArray(dictlayer.description)) {
                            tooltext = '';
                            dictlayer.description.forEach(function (desc, i) {
                                if (i > 0) {
                                    tooltext += ' ';
                                }
                                tooltext += desc;
                            });
                        } else {
                            tooltext = dictlayer.description;
                        }
                    }
                }
                */
                if (layerDef.tooltip) {
                    cbody += '<span class="tooltip">' + layerDef.name;
                    cbody += '<span class="tooltiptext" style="left:0px;bottom:unset;top:30px;width:200px;zindex:9999;" >' + layerDef.tooltip + '</span></span>';
                } else {
                    cbody += formattooltip(mapDisplay.tooltips, 'description', layerDef.name);
                }
                cbody += '</td></tr>';
                if (layerDef.themes) {
                    //                cbody += '</br>';
                    //   cbody += '<table>';
                    layerDef.themes.forEach(function (theme, j) {
                        cbody += '<tr style="height:16px;position:relative;" class="control_' + layerName + '">';
                        if (mapDisplay.showcheckboxes) {
                            cbody += '<td></td><td></td>';
                        }
                        cbody += '<td style="width:' + (symbolWidth + themeIndent) + 'px;height:16px;position:relative;">';
                        cbody += '<div ';
                        if (theme.style.image) {
                            cbody += 'id = "' + controldiv + '_' + i + '_theme_' + j + '"';
                        }
                        cbody += 'style="width:' + symbolWidth + 'px; height:16px; ';
                        cbody += 'position:absolute;top:0px;left:' + (themeIndent / 2) + 'px;" >';
                        if (!theme.style.image) {
                            var themerep = '';
                            themerep += '<canvas id="' + controldiv + '_' + i + '_theme_' + j + '"';
                            themerep += ' width="' + symbolWidth + '" height="16" ></canvas>';
                            cbody += formattooltip(mapDisplay.tooltips, 'themerep', themerep);
                        }
                        cbody += '</div>';
                        cbody += '</td>';
                        cbody += '<td style="height:16px;position:relative;"  class="control_description">';
                        cbody += formattooltip(mapDisplay.tooltips, 'themedesc', theme.name);
                        cbody += '</td>';
                        cbody += '</tr>';
                    });
                }
            }
        });
        cbody += '</table>';
        return cbody;
    }
    mapDisplay.renderLegend = function (controldiv, layerDefs, nogroup) {
        var keys = Object.keys(layerDefs);
        var extent = [-8, -8, 8, 8];
        keys.forEach(function (layerName, i) {
            var layerDef = layerDefs[layerName];
            if (!nogroup || layerDef.nogroup) {
                var targetDiv = controldiv + "_" + i;
                if (layerDef.style.image) {
                    renderMapLegendImage(layerDef.cstyle, targetDiv, extent);
                } else {
                    renderMapLegendVector(layerDef.style, targetDiv);
                }
                if (layerDef.themes) {
                    layerDef.themes.forEach(function (theme, j) {
                        var div = targetDiv + "_theme_" + j;
                        if (theme.style.image) {
                            renderMapLegendImage(theme.cstyle, div, extent);
                        } else {
                            renderMapLegendVector(theme.style, div);
                        }
                    });
                }
            }
        });
    }
    mapDisplay.closethemes = function (layerDefs) {
        var keys = Object.keys(layerDefs);
        keys.forEach(function (key, i) {
            mapDisplay.oncontrolgroup(key);
        });
    }
    mapDisplay.lastfocus = null;
    mapDisplay.populateGroup = function (divid, group, layers) {
        if (divid) {
            var cbody = mapDisplay.populateControlLayers(divid, group.layerDefs, false);
            $('#' + divid).html(cbody);
            mapDisplay.renderLegend(divid, group.layerDefs);
            mapDisplay.closethemes(group.layerDefs);
        }
    }
    mapDisplay.control_show_loaded_div = function(divid){
        var buttonname = divid + '_btn';
        if (mapDisplay.lastfocus == divid) {
            mapDisplay.lastfocus = null;
        } else {
            var div = $('#' + divid);
            if (div.css('display') == 'none') {
                mapDisplay.lastfocus = null;
                div.css({ display: 'block' });
                $('#' + buttonname).text('-');
            } else {
                div.css({ display: 'none' });
                $('#' + buttonname).text('+');
            }
        }
    }
    mapDisplay.control_show_div = function (divid) {
        var a = divid.split('_');
        if (a.length > 2) {
            var group = mapDisplay.groups[a[2]];
            mapDisplay.control_show_loaded_div(divid);
        }
    }
    mapDisplay.formcontroldivbtn = function(divid, title, tooltip) {
        var tbody = '<div width="400px;">';
        tbody += '<span class="tooltip">';
        tbody += '<button type="button" id="' + divid + '_btn"';
        tbody += 'onclick="control_show_div(\'' + divid + '\', null);" >';
        tbody += '+';
        tbody += '</button>' + title;
        if (tooltip) {
            tbody += '<span class="tooltiptext" style="">' + tooltip + '</span>';
        } else {
            tbody += fieldtooltiphtml(mapDisplay.tooltips, 'expandgroup');
        }
        tbody += '</span>';
        tbody += '</div>';
        tbody += '<div id="' + divid + '" style="display:none;" ></div>';
        return tbody;
    }
    mapDisplay.controlWidths = [];
    mapDisplay.populateControl = function () {
        cbody = '';
        var symbolWidth = mapDisplay.controlHeader.symbolWidth;
        var themeIndent = mapDisplay.controlHeader.themeIndent;
        if (mapDisplay.controlHeader.header) {
            cbody += '<table>';
            cbody += '<tr>';
            if (mapDisplay.showcheckboxes) {
                cbody += '<th style="width:20px;" >On</th><th style="width:40px;" >Clickable</th>';
                mapDisplay.controlWidths.push(20);
                mapDisplay.controlWidths.push(40);
            }
            cbody += '<th style="width:' + symbolWidth + 'px;" ></th>';
            mapDisplay.controlWidths.push(symbolWidth);
            cbody += '<th id="control_description" class="control_description" style="width:300px; text-align:left;" >';
            mapDisplay.controlWidths.push(300);
            if (mapDisplay.controlHeader.description) {
                cbody += mapDisplay.controlHeader.description;
            }
            cbody += '</th>';
            cbody += '</tr>';
            cbody += '</table>';
        }
        if (mapDisplay.groups) {
            mapDisplay.groups.forEach(function (group, i) {
                var divid = mapdiv + '_control_' + i;
                // Display button that expands group
                cbody += mapDisplay.formcontroldivbtn(divid, group.name, group.tooltip);
            });
        }
        cbody += mapDisplay.populateControlLayers(controldiv, mapDisplay.layerDefs, true);
        $('#' + controldiv).html(cbody);
        if (mapDisplay.groups) {
            mapDisplay.groups.forEach(function (group, i) {
                var divid = mapdiv + '_control_' + i;
                mapDisplay.populateGroup(divid, group);
                if (group.loadimmediate) {
                    mapDisplay.control_show_loaded_div(divid);
                }
            });
        }
        mapDisplay.renderLegend(controldiv, mapDisplay.layerDefs, true);
    }
    mapDisplay.featureDetail = function (id, div, layerName, featureID) {
        var ar = id.split('_');
        var listdiv = ar[0];
        var fp = mapDisplay.getFeatureProps(listdiv, layerName, featureID);
        // Display properties table
        tbody = featureDetails(fp, div);
        return tbody;
    }
    mapDisplay.selectedDetail = null;
    mapDisplay.getSelectedDetail = function () {
        return mapDisplay.selectedDetail;
    }
    mapDisplay.onlink = function (id, layerName, featureID) {
        mapDisplay.selectedDetail = { layer: layerName, id: id, featureID: featureID };
        var fp = mapDisplay.getFeatureProps(id, layerName, featureID);
        if (fp.layerdef.onlink) {
            fp.layerdef.onlink(fp);
        } else {
            var feature = fp.feature;
            var properties = feature.getProperties();
            if (!fp.measures) {
                var geom = properties['geometry'];
                if (geom) {
                    fp.measures = geometryMeasures(geom, mapDisplay);
                }
            }
            var id = feature.getId();
            var title = "Feature Details";
            var titleexp = null;
            if (fp.attributeview && fp.attributeview.title) {
                titleexp = fp.attributeview.title;
            } else if (fp.attributeview && fp.attributeview.summary) {
                titleexp = fp.attributeview.summary;
            } else if (fp.layerdef.title) {
                titleexp = fp.layerdef.title;
            } else if (fp.layerdef.summary) {
                titleexp = fp.layerdef.summary;
            }
            title = formSummary(titleexp, fp.layerdef.name, fp.feature.getProperties());
            $('#detail-title').html(title);
            featureDetails(fp, 'detail-content');
            if (window.innerWidth < 650) {
                $('#detail').css({ width: (window.innerWidth - 50).toString() + 'px' });
            } else {
                $('#detail').css({ width: '600px' });
            }
            if (mapDisplay.detailLeft) {
                $('#detail').css({
                    left: '10px', right: 'auto'
                });
            } else {
                $('#detail').css({
                    right: '0px', left: 'auto'
                });
            }
            $('#detail').show();
        }
    }
    mapDisplay.onclickrow = function (id, layerName, featureID) {
        mapDisplay.selectedDetail = { layer: layerName, id: id, featureID: featureID };
        var html = $('#' + id + '>.featuretable').html();
        $('.featuretable').html('');
        $('.bullet').text('⯈');
        if (html && html.length > 0) {
            $('#' + id + '>.featuretable').html('');
        } else {
            // Hide other property tables
            $('#' + id + '>.bullet').text('⯅');
            mapDisplay.featureDetail(id, id + '>.featuretable', layerName, featureID);
            mapDisplay.handleClick(layerName, featureID);
        }
    }
    mapDisplay.clickHandler = null;
    mapDisplay.setClickHandler = function (handler) {
        mapDisplay.clickHandler = handler;
    }
    mapDisplay.handleClick = function (layerName, featureID) {
        if (mapDisplay.clickHandler) {
            var feature = mapDisplay.getFeature(layerName, featureID);
            if (feature) {
                mapDisplay.clickHandler(feature);
            }
        }
    }
    mapDisplay.findLayerDef = function (feature) {
        var result = null;
        if (mapDisplay.layerDefs) {
            var props = feature.getProperties();
            var layerName = props['layerName'];
            if (layerName) {
                result = mapDisplay.layerDefs[layerName];
            }
        }
        return result;
    }
    mapDisplay.getLayerID = function (feature) {
        var props = feature.getProperties();
        return props['layerName'];
    }
    mapDisplay.getAttributeView = function (div, feature) {
        var layerName = mapDisplay.getLayerID(feature);
        var attributeViews = mapDisplay.getAttributeViews(div);
        if (attributeViews) {
            return attributeViews[layerName];
        }
        return null;
    }
    mapDisplay.divAttributeViews = {};
    mapDisplay.setAttributeViews = function (div, attributeViews) {
        mapDisplay.divAttributeViews[div] = attributeViews;
    }
    mapDisplay.getAttributeViews = function (div) {
        if (div) {
            return mapDisplay.divAttributeViews[div];
        }
        return null;
    }
    mapDisplay.featuresTable = function (list, coord, usepopup, listdiv) {
        var body = "";
        if (coord) {
            var pt = new ol.geom.Point(coord, 'XY');
            body += '<p>' + formatPoint(pt, 'EPSG:27700', mapDisplay) + '</p>';
        }
        body += '<ul style="list-style:none;padding-left:1.2em;" >';
        mapDisplay.featureproperties = {};
        if (list) {
            if (listdiv == null) {
                listdiv = selecteddiv;
            }
            var attributeViews = mapDisplay.getAttributeViews(listdiv);
            list.forEach(function (feature, i) {
                var properties = feature.getProperties();
                // get layer
                var layerName = properties.layerName;
                var layerDef = mapDisplay.layerDefs[layerName];
                var id = listdiv + "_" + i;
                var summary = "";
                var attributeView = mapDisplay.getAttributeView(listdiv, feature);
                if (!layerDef) {
                    summary = 'No layerDef for layer: ' + layerName;
                } else if (attributeView && attributeView.summary) {
                    summary = formSummary(attributeView.summary, layerDef.name, properties);
                } else if (layerDef.summary) {
                    summary = formSummary(layerDef.summary, layerDef.name, properties);
                }
                var style = 'width: 1.2em;color: #0000ff';
                var args = '\'' + mapdiv + '\',\'' + id + '\',\'' + layerName + '\',';
                var fid = feature.getId();

                // TODO format id according to type
                if (isNaN(fid)) {
                    args += '\'' + fid + '\'';
                } else {
                    args += fid;
                }
                if (usepopup) {
                    body += '<li>'
                    body += '<a href="#!" onclick="onlink(' + args + ');" >';
                    body += summary;
                    body += '</a>';
                    body += '</li>';
                } else {
                    body += '<li id="' + id + '" onclick="onclickrow(' + args + ');" >'
                    body += '<span style="' + style + '" class="bullet" >⯈</span > ';
                    body += summary;
                    body += '<span class="featuretable" ></span></li>';
                }
            });
        }
        body += '</ul>';
        return body;
    }
    // Selection methods
    mapDisplay.includeLayer = function (layerName, checked) {
        var layerDef = mapDisplay.layerDefs[layerName];
        if (layerDef) {
            if (checked) {
                if (layerDef.layer) {
                    mapDisplay.map.addLayer(layerDef.layer);
                    mapDisplay.map.render();
                } else {
                    mapDisplay.addLayer(layerName, layerDef);
                }
            } else if (layerDef.layer) {
                mapDisplay.map.removeLayer(layerDef.layer);
                mapDisplay.map.render();
            }
        }
    }
    mapDisplay.layerchanged = function (layerName) {
        var checked = $('#' + controldiv).find('#' + layerName).find('#on').get(0).checked;
        mapDisplay.includeLayer(layerName, checked);
        mapDisplay.slaveDisplays.forEach(function (disp, i) {
            disp.includeLayer(layerName, checked);
        });
    }
    mapDisplay.isLayerIncluded = function (layerName) {
        return $('#' + controldiv).find('#' + layerName).find('#on').get(0).checked;
    }
    mapDisplay.clickableLayers = [];
    mapDisplay.clickableobject = {};
    mapDisplay.layerclickChanged = function (layerName) {
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                var layer = layerDef.layer;
                if (layer) {
                    if (mapDisplay.clickableobject[layerName]) {
                        delete mapDisplay.clickableobject[layerName];
                    } else {
                        mapDisplay.clickableobject[layerName] = layer;
                    }
                    var keys = Object.keys(mapDisplay.clickableobject);
                    mapDisplay.clickableLayers = [];
                    keys.forEach(function (key, i) {
                        mapDisplay.clickableLayers.push(mapDisplay.clickableobject[key]);
                    });
                }
            }
        }
        mapDisplay.slaveDisplays.forEach(function (disp, i) {
            disp.layerclickChanged(layerName);
        });
    }
    mapDisplay.setlayerClickable = function (layerName) {
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                var layer = layerDef.layer;
                if (layer) {
                    mapDisplay.clickableobject[layerName] = layer;
                    var keys = Object.keys(mapDisplay.clickableobject);
                    mapDisplay.clickableLayers = [];
                    keys.forEach(function (key, i) {
                        mapDisplay.clickableLayers.push(mapDisplay.clickableobject[key]);
                    });
                }
                layerDef.clickable = true;
                $('#' + controldiv).find('#' + layerName).find('#clickable').prop('checked', true);
            }
        }
        mapDisplay.slaveDisplays.forEach(function (disp, i) {
            disp.setlayerClickable(layerName);
        });
    }
    mapDisplay.unsetlayerClickable = function (layerName) {
        if (mapDisplay.layerDefs) {
            var layerDef = mapDisplay.layerDefs[layerName];
            if (layerDef) {
                var layer = layerDef.layer;
                if (layer) {
                    delete mapDisplay.clickableobject[layerName];
                    var keys = Object.keys(mapDisplay.clickableobject);
                    mapDisplay.clickableLayers = [];
                    keys.forEach(function (key, i) {
                        mapDisplay.clickableLayers.push(mapDisplay.clickableobject[key]);
                    });
                }
                layerDef.clickable = false;
                $('#' + controldiv).find('#' + layerName).find('#clickable').prop('checked', false);
            }
        }
        mapDisplay.slaveDisplays.forEach(function (disp, i) {
            disp.unsetlayerClickable(layerName);
        });
    }
    mapDisplay.onSelect = function (coord, list) {
        if (mapDisplay.haspopup) {
            mapDisplay.popupcloser();
        }
    }
    mapDisplay.getExtentFC = function (coll) {
        var extent = ol.extent.createEmpty();
        coll.forEach(function (f, i) {
            var ext1 = f.getGeometry().getExtent();
            ol.extent.extend(extent, ext1);
        });

        return extent;
    }
    mapDisplay.sizeSelected = function (bufferfactor) {
        var view = mapDisplay.map.getView();
        var extent = mapDisplay.getExtentFC(mapDisplay.select.getFeatures());
        if (bufferfactor > 0) {
            /*
            var size = ol.extent.getSize(extent);
            var centre = ol.extent.getCenter(extent);
            var w = size.width * (1 + bufferfactor);
            var h = size.height * (1 + bufferfactor);
            var coords = [
                [centre.x - w / 2, centre.y - h / 2],
                [centre.x + w / 2, centre.y + h / 2]
            ];
            extent = ol.extent.boundingExtent(coords);
            */
            var w = ol.extent.getWidth(extent);
            var h = ol.extent.getHeight(extent);
            var buffer = (h > w ? h : w) * bufferfactor;

            extent = ol.extent.buffer(extent, buffer);
        }
        view.fit(extent, { size: mapDisplay.map.getSize(), maxZoom: 16 });
        return extent;
    }
    mapDisplay.zoomFeature = function (feature, bufferFactor, maxZoom, bufferAdd) {
        var view = mapDisplay.map.getView();
        var geom = feature.getGeometry();
        var extent = geom.getExtent();
        if (bufferFactor > 0) {
            var w = ol.extent.getWidth(extent);
            var h = ol.extent.getHeight(extent);
            var buffer = (h > w ? h : w) * bufferFactor;
            if (bufferAdd) {
                buffer += bufferAdd;
            }
            extent = ol.extent.buffer(extent, buffer);
        }
        var opts = {
            size: mapDisplay.map.getSize()
        };
        if (maxZoom) {
            opts.maxZoom = maxZoom
        };
        view.fit(extent, opts);
        return extent;
    }
    mapDisplay.zoomoutline = function(){
        var view = new ol.View({
            center: ol.proj.fromLonLat(mapDisplay.centre, 'EPSG:' + mapDisplay.srs),
            projection: 'EPSG:' + mapDisplay.srs,
            zoom: mapDisplay.zoom
        });
        mapDisplay.map.setView(view);
    }
    mapDisplay.zoomLayer = function (layerName, bufferFactor, maxZoom, bufferAdd) {
        var view = mapDisplay.map.getView();
        var features = mapDisplay.getFeatures(layerName);
        var extent = null;
        features.forEach(function (feature, i) {
            var geom = feature.getGeometry();
            var ext = geom.getExtent();
            if (extent) {
                extent = ol.extent.extend(extent, ext);
            } else {
                extent = ext;
            }
        });
        if (bufferFactor > 0) {
            var w = ol.extent.getWidth(extent);
            var h = ol.extent.getHeight(extent);
            var buffer = (h > w ? h : w) * bufferFactor;
            if (bufferAdd) {
                buffer += bufferAdd;
            }
            extent = ol.extent.buffer(extent, buffer);
        }
        var opts = {
            size: mapDisplay.map.getSize()
        };
        if (maxZoom) {
            opts.maxZoom = maxZoom
        };
        view.fit(extent, opts);
    }
    mapDisplay.clearSelection = function () {
        if (mapDisplay.haspopup) {
            mapDisplay.popupcloser();
        }
        var list = mapDisplay.select.getFeatures();
        if (list) {
            list.clear();
        }
    }
    mapDisplay.clearSelectedList = function () {
        var list = mapDisplay.select.getFeatures();
        list.clear();
    }
    mapDisplay.selectFeatures = function (list) {
        var selectlist = mapDisplay.select.getFeatures();
        list.forEach(function (l, i) {
            selectlist.push(l);
        });
    }
    mapDisplay.modify = null;
    mapDisplay.modifyFeatures = null;
    mapDisplay.modFeature = null;
    mapDisplay.clearModify = function () {
        if (mapDisplay.modify) {
            if (mapDisplay.modifyFeatures) {
                mapDisplay.modifyFeatures.forEach(function (f2) {
                    f2.setStyle();
                });
                mapDisplay.modifyFeatures = null;
            }
            mapDisplay.map.removeInteraction(mapDisplay.modify);
            mapDisplay.modify = null;
        }
        if (mapDisplay.draw) {
            mapDisplay.map.removeInteraction(mapDisplay.draw);
            mapDisplay.draw = null;
        }
        mapDisplay.modFeature = null;
    }
    mapDisplay.modifyLayer = function (layerName, styleSrc, callback) {
        var layerDef = mapDisplay.layerDefs[layerName];
        mapDisplay.clearModify();
        var cstyle = new ol.style.Style();
        setStyle(cstyle, styleSrc);
//        feature.setStyle(cstyle);
        //feature.setStyle(layerDef.cstyle);
//        var f = [feature];
//        var id = feature.getId();
        var features = layerDef.vectorSource.features;
        mapDisplay.modifyFeatures = features;
        mapDisplay.modify = new ol.interaction.Modify({
            source: layerDef.vectorSource
        });
        mapDisplay.modFeature = null;
        mapDisplay.modify.on('modifystart', function (evt) {
//            if (callback) {
//                callback(evt.feature, 'modifystart');
//            }
            if (evt.feature) {
                if (mapDisplay.modFeature) {
                    mapDisplay.modFeature.setStyle(layerDef.cstyle);
                }
                evt.feature.setStyle(cstyle);
                mapDisplay.modFeature = evt.feature;
            }
        });
        mapDisplay.modify.on('modifyend', function (evt) {
            if (callback) {
//                var f2 = evt.features.item(0);
//                var geom = f2.getGeometry();
                callback('modifyend', evt);
            }
        });
        mapDisplay.map.addInteraction(mapDisplay.modify);
    }
    mapDisplay.modifyFeature = function (layerName, feature, styleSrc, callback) {
        var layerDef = mapDisplay.layerDefs[layerName];
        mapDisplay.clearModify();
        if (layerDef && feature) {
            var cstyle = new ol.style.Style();
            setStyle(cstyle, styleSrc);
            feature.setStyle(cstyle);
            //feature.setStyle(layerDef.cstyle);
            var f = [feature];
            var id = feature.getId();
            var features = new ol.Collection(f);
            mapDisplay.modifyFeatures = features;
            mapDisplay.modify = new ol.interaction.Modify({
                features: features
            });
            mapDisplay.modify.on('modifystart', function (evt) {
                if (callback) {
                    callback(evt.feature, 'modifystart');
                }
            });
            mapDisplay.modify.on('modifyend', function (evt) {
                if (callback) {
                    var f2 = evt.features.item(0);
                    var geom = f2.getGeometry();
                    //f2.setStyle();
                    callback('modifyend', geom);
                }
            });
            mapDisplay.map.addInteraction(mapDisplay.modify);
        } else {
            alert("mapDisplay.modifyFeature : Layer or feature not defined");
        }
    };
    mapDisplay.draw = null;
    mapDisplay.drawFeature = function (layerName, type, styleSrc, callback) {
        var layerDef = mapDisplay.layerDefs[layerName];
        mapDisplay.clearModify();
        if (mapDisplay.draw) {
            mapDisplay.map.removeInteraction(mapDisplay.draw);
            mapDisplay.draw = null;
        }
        if (layerDef) {
            var cstyle = new ol.style.Style();
            setStyle(cstyle, styleSrc);
            mapDisplay.draw = new ol.interaction.Draw({
                source: layerDef.vectorSource,
                type: type,
                style: cstyle
            });
            mapDisplay.draw.on('drawstart', function (evt) {
                if (callback) {
                    callback(evt.feature, 'drawstart');
                }
            });
            mapDisplay.draw.on('drawend', function (evt) {
                if (callback) {
                    callback(evt.feature, 'drawend');
                }
            });
            mapDisplay.map.addInteraction(mapDisplay.draw);
        } else {
            alert("mapDisplay.drawFeature : Layer not defined");
        }
    }
    mapDisplay.drawGeometry = function (type, styleSrc, callback) {
        //var layerDef = mapDisplay.layerDefs[layerName];
        mapDisplay.clearModify();
        mapDisplay.stopDrawing();
        var cstyle = new ol.style.Style();
        setStyle(cstyle, styleSrc);
        mapDisplay.draw = new ol.interaction.Draw({
            source: new ol.source.Vector(),
            type: type,
            style: cstyle
        });
        mapDisplay.draw.on('drawend', function (evt) {
            if (callback) {
                callback(evt.feature.getGeometry(), 'drawend');
            }
        });
        mapDisplay.map.addInteraction(mapDisplay.draw);
    }
    mapDisplay.stopDrawing = function () {
        if (mapDisplay.draw) {
            mapDisplay.map.removeInteraction(mapDisplay.draw);
            mapDisplay.draw = null;
        }
    }
    mapDisplay.clearSelect = function () {
        if (mapDisplay.select) {
            mapDisplay.map.removeInteraction(mapDisplay.select);
        }
        mapDisplay.select = null;
    }
    mapDisplay.setSelectHover = function (enable, screenlink, formLinks) {
        if (mapDisplay.select ) {
            mapDisplay.map.removeInteraction(mapDisplay.select);
        }
        var condition = ol.events.condition.click;
        if (screenlink !== false && screenlink !== true) {
            screenlink = enable ? false : true;
        }
        if (enable) {
            condition = ol.events.condition.pointerMove;
        }
        var options = {
            condition: condition,
            layers: function (layer) {
                return mapDisplay.clickableLayers.includes(layer);
            },
            multi: mapDisplay.multiSelect
        };
        if (mapDisplay.selectStyle) {
            options.style = mapDisplay.selectStyle;
        }
        mapDisplay.select = new ol.interaction.Select(options);
        mapDisplay.select.on('select', function (e) {
            var coord = null;
            if (e.mapBrowserEvent) {
                coord = e.mapBrowserEvent.coordinate;
            }
            var list = mapDisplay.select.getFeatures();
            if (mapDisplay.haspopup && screenlink) {
                var text = '';
                if (formLinks) {
                    text = formLinks(list);
                } else {
                    text = mapDisplay.featuresTable(list, null, true, mapDisplay.popupdiv);
                }
                if (text.length > 0 && list.getLength() > 0) {
                    $('#' + mapDisplay.popupdiv).find('#popup-content').html(text);
                    if (list && list.getLength() == 1) {
                        var f = list.item(0);
                        var g = f.getGeometry();
                        var pt = geometrySeed(g);
                        coord = pt.getCoordinates();
                    }
                    mapDisplay.overlay.setPosition(coord);
                } else {
                    mapDisplay.popupcloser();
                }
//                if (mapDisplay.select.features) {
//                    mapDisplay.select.features.clear();
//                }
            }
            if (mapDisplay.onFeatureSelected) {
                mapDisplay.onFeatureSelected(list);
            }
            if (mapDisplay.master) {
                mapDisplay.master.onSelect(coord);
            }
            mapDisplay.slaveDisplays.forEach(function (slave, i) {
                slave.onSelect(coord, list);
            });
            if (selecteddiv) {
                $('#' + selecteddiv).html(mapDisplay.featuresTable(list, null, true));
            }
            var toremove = [];
            list.forEach(function (feature, i) {
                var layerDef = mapDisplay.findLayerDef(feature);
                if (layerDef && layerDef.showselected == false) {
                    toremove.push(feature);
                }
            });
            toremove.forEach(function (feature, i) {
                list.remove(feature);
            });
        });
        mapDisplay.map.addInteraction(mapDisplay.select);
    }
    mapDisplay.saveJSONLayer = function (layerDef) {
        var url = layerDef.url;
       // var url = layerDefSource.url;
        if (!url || url.length == 0) {
            url = mapDisplay.dataurlbase + layerNameSource + '.json';
        }
        // Update layerDef.data from layerDef.vectorSource.features
        var writer = new ol.format.GeoJSON();
        layerDef.data = {
            type: 'FeatureCollection',
            crs: {
                type: 'name',
                properties: {
                    name: 'EPSG:' + mapDisplay.srs
                }
            },
            features: []
        }
        console.log(layerDef.vectorSource.getFeatures().length + ' Features on vectorsource');
        layerDef.vectorSource.forEachFeature(function (f) {
            var geojsonStr = writer.writeFeature(f);
            var feature = JSON.parse(geojsonStr);
            layerDef.data.features.push(feature);
        });
        console.log('Saving ' + layerDef.data.features.length + ' ' + url);
        $.ajax({
            method: 'PUT',
            url: url,
            data: JSON.stringify(layerDef.data),
            contentType: 'application/json',
            dataType: 'json',
            processData: true,
            success: function (data) {
                alert('Successfully updated ' + data.updated + ' features');
            },
            error: function (err) {
                alert('Error: ' + JSON.stringify(err));
            }
        });
    }
    mapDisplay.saveLayer = function (layerName) {
        var layerDef = mapDisplay.layerDefs[layerName];
        if (!layerDef) {
            alert('Layer not found ' + layerName);
            return;
        }
        if (layerDef.type && layerDef.type != 'geoJSON') {
            alert('Layer ' + layerName + ' cannot be saved - not geoJSON');
            return;
        } else {
            mapDisplay.saveJSONLayer(layerDef);
        }
    }
    mapDisplay.clearLayers = function () {
        mapDisplay.layerDefs = null;
        mapDisplay.templates = {};
        mapDisplay.clickableLayers = [];
        mapDisplay.clickableobject = {};
        var layerArray, len, layer;
        layerArray = mapDisplay.map.getLayers().getArray(),
            len = layerArray.length;
        while (len > 1) {
            layer = layerArray[len - 1];
            mapDisplay.map.removeLayer(layer);
            len = layerArray.length;
        }
    }
    mapDisplay.showFetching = function (layerName) {
        var tbl = '<table>';
        tbl += '<td><td="activity">Fetching</td><td>' + layerName + '</td></tr>';
        tbl += '<tr><td>Count</td><td id="count"></td></tr>';
        tbl += '</table>';
        $('#' + selecteddiv).html(tbl);
        mapDisplay.seconds = 0;
        mapDisplay.secondTimer = setInterval(mapDisplay.fetchTimer, 1000);
    }
    mapDisplay.clearFetching = function (layerName) {
//        $('#activity').text('Rendered ' + mapdiv + ':' + layerName);
        $('#' + selecteddiv).html('');
        clearInterval(mapDisplay.secondTimer);
        mapDisplay.secondTimer = null;
    }
    mapDisplay.fetchNextLayer = async function (layerName, layerDef) {
 //       mapDisplay.clearProgress(layerDef);
        $('#' + controldiv).find('#' + layerName).find('#on').prop('checked', true);
        var clicked = $('#' + controldiv).find('#' + layerName).find('#clickable').prop('checked');
        if (clicked) {
            mapDisplay.setlayerClickable(layerName);
        }
        if (layerDef.clickable == true) {
            $('#' + controldiv).find('#' + layerName).find('#clickable').prop('checked', true);
            mapDisplay.setlayerClickable(layerName);
        }
        /*
        if (mapDisplay.layerQueue.length > 0) {
            var ln = mapDisplay.layerQueue[0];
            var ld = mapDisplay.layerDefs[ln];
            $('#activity').text('Adding Layer ' + mapdiv + ':' + ln);
            mapDisplay.addLayer(ln, ld, callback);
            mapDisplay.layerQueue.shift();
        } else if (callback) {
            mapDisplay.map.render();
            $('#activity').text('In callback ' + mapdiv + ':' + layerName);
            callback(null);
        } else {
            mapDisplay.map.render();
            $('#activity').text('Completed ' + mapdiv + ':' + layerName);
        }
        */
    }
    mapDisplay.createVectorLayer = function (layerName, layerDef) {
        $('#activity').text('Defining ' + mapdiv + ':' + layerName);
        vectorLayer = new ol.layer.Vector({
            source: layerDef.vectorSource,
            style: function (feature, resolution) {
                var s = layerDef.cstyle;
                var t = layerDef.style;
                var properties = feature.getProperties();
                if (layerDef.themes) {
                    layerDef.themes.forEach(function (theme, i) {
                        if (theme.condition && condition_evaluate(properties, theme.condition) == true) {
                            s = theme.cstyle;
                            t = theme.style;
                        }
                    });
                }
                if (s.getText() && t && t.text ) {
                    // Style has text so need to evaluate text and rotation
                    var tstyle = s.getText();
                    if (t.text.text.startsWith('.')) {
                        var name = t.text.text.substr(1);
                        if (properties[name]) {
                            var text = properties[name].toString();
                            tstyle.setText(text);
                            //console.log('Text=' + text);
                        } else {
                            console.log('Name: ' + name + ' not found');
                        }
                    }
                    if (t.text.rotation && isNaN(t.text.rotation) && t.text.rotation.startsWith('.')) {
                        var r = t.text.rotation.substr(1);
                        if (r && isNaN(r)) {
                            r = properties[r];
                            //console.log("r=" + r);
                            r = parseFloat(r) * Math.PI / 180;
                            tstyle.setRotation(r);
                            //console.log('Rotation=' + r);
                        }
                    }
                    if (t.text.textAlign && t.text.textAlign.startsWith('.')) {
                        var a = t.text.textAlign.substr(1);
                        a = properties[a];
                        tstyle.setTextAlign(a);
                        //console.log('TextAlign=' + a);
                    }
                    if (t.text.offsetX && t.text.offsetX.startsWith('.')) {
                        var ox = t.text.offsetX.substr(1);
                        ox = properties[ox];
                        tstyle.setOffsetX(ox);
                        //console.log('OffsetX=' + ox);
                    }
                    if (t.text.offsetY && t.text.offsetY.startsWith('.')) {
                        var oy = t.text.offsetY.substr(1);
                        oy = properties[oy];
                        tstyle.setOffsetY(oy);
                        //console.log('OffsetY=' + oy);
                    }
                }
                if (layerDef.type == 'buffer') {
                    var sourcegeom = feature.getGeometry();
                    var coord = sourcegeom.getFirstCoordinate();
                    var radius = feature.get(layerDef.radius);
                    if (coord && radius) {
                        var geom = new ol.geom.Circle(coord, parseFloat(radius));
                        //console.log('Setting buffer geometry: ' + JSON.stringify(coord) + ' radius: ' + radius);
                        s.setGeometry(geom);
                    }
                }
                return [s];
            }
        });
        $('#activity').text('Defined ' + mapdiv + ':' + layerName);
        if (layerDef.minZoom) {
            vectorLayer.setMinZoom(layerDef.minZoom);
        }
        if (layerDef.maxZoom) {
            vectorLayer.setMaxZoom(layerDef.maxZoom);
        }
        if (layerDef.ZIndex) {
            vectorLayer.setZIndex(layerDef.ZIndex);
        }
        return vectorLayer;
    }
    mapDisplay.readFeatures = function (format, data, layerName, layerDef) {
        var features = format.readFeatures(data);
        var srs = data.crs.properties.name;
        features.forEach(function (feature, i) {
            var id = feature.getId();
            var props = feature.getProperties();
            if (id == null) {
                if (layerDef.IDfield) {
                    feature.setId(props[layerDef.IDfield]);
                } else if (props.OBJECTID) {
                    feature.setId(props.OBJECTID);
                } else {
                    layerDef.nextId++;
                    feature.setId(layerDef.nextId);
                }
            }
            props['layerName'] = layerName;
            feature.setProperties(props, true);
            var projection = srs;
            if (!srs && layerDef.projection) {
                projection = layerDef.projection;
            }
            if (projection != "EPSG:" + mapDisplay.srs) {
//                console.log('Transforming ' + projection + ' to EPSG:' + mapDisplay.srs);
                var geom = feature.getGeometry();
                if (geom) {
                    geom.transform(projection, "EPSG:" + mapDisplay.srs);
  //                  var coord = geom.getFirstCoordinate();

  //                  console.log('First Coord: ' + coord);
                }
            }
        });
        return features;
    }
    mapDisplay.createFormat = function (layerDef) {
        var format = null;
        if (layerDef.format) {
            switch (layerDef.format) {
                case 'EsriJSON':
                    format = new ol.format.EsriJSON();
                    break;
                case 'GeoJSON':
                    format = new ol.format.GeoJSON();
                    break;
                case 'GML32':
                    format = new ol.format.GML32();
                    break;
                case 'GML3':
                    format = new ol.format.GML3();
                    break;
                case 'GML2':
                    format = new ol.format.GML2();
                    break;
                case 'GPX':
                    format = new ol.format.GPX();
                    break;
                case 'IGC':
                    format = new ol.format.IGC();
                    break;
                case 'JSONFeature':
                    format = new ol.format.JSONFeature();
                    break;
                case 'KML':
                    format = new ol.format.KML();
                    break;
                case 'MVT':
                    format = new ol.format.MVT();
                    break;
                case 'OSMXML':
                    format = new ol.format.OSMXML();
                    break;
                case 'Polyline':
                    format = new ol.format.Polyline();
                    break;
                case 'TopoJSON':
                    format = new ol.format.TopoJSON();
                    break;
                case 'WFS':
                    format = new ol.format.WFS();
                    break;
                case 'WKT':
                    format = new ol.format.WKT();
                    break;
                default:
                    format = new ol.format.GeoJSON();
                    break;
            }
        } else {
            format = new ol.format.GeoJSON();
        }
        return format;
    }
    mapDisplay.fetchData = async function (layerName, layerDef, url) {
        mapDisplay.showFetching(layerName);
        var prom = new Promise((resolve, reject) => {
            let d = new Date();
            var options = {
                url: layerDef.proxy ? layerDef.proxy : url,
                method: layerDef.proxy ? 'post' : 'get',
                dataType: layerDef.dataType ? layerDef.dataType : 'json',
                data: layerDef.proxy ? url : 'time=' + d.getTime(),
                processData: true,
                contentType: layerDef.contentType ? layerDef.contentType : 'application/json',
                success: function (data) {
                    var features = null;
                    if (data.exceededTransferLimit) {
                        layerDef.layer = null;
                        $('#activity').text('Exceeded Transfer limit: ' + layerName);
                        var format = mapDisplay.createFormat(layerDef);
                        features = mapDisplay.readFeatures(format, data, layerName, layerDef);
                        errmsg = {
                            msg: "Transfer limit exceeded choose a smaller area",
                            layer: layerName,
                            features: features.length
                        };
                        reject(errmsg);
                    } else {
                        $('#activity').text('Reading Features ' + mapdiv + ':' + layerName);
                        var format = mapDisplay.createFormat(layerDef);
                        features = mapDisplay.readFeatures(format, data, layerName, layerDef);
                        resolve(features);
                    }
                },
                error: function (err) {
                    console.log('AJAX Error:', err);
                    console.log('Error Status:', err.status);
                    console.log('Error Text:', err.statusText);
                    console.log('Error Response Body:', err.responseText); // <--- This is the key lin
                    console.log('layerdef: ' + JSON.stringify(layerDef));
                    console.log('Fetching: ' + url);
                    reject(err);
                }
            }
            if (layerDef.cors) {
                console.log('Setting crossDomain option');
                options.crossDomain = true;
 //               options.xhrFields = { withCredentials: true };
            }
            console.log('options.url: ' + options.url);
            $.ajax(options);
        });
        var features = await (prom);
        mapDisplay.clearFetching(layerDef);
        return features;
    }
    mapDisplay.addbboxVectorLayer = async function (layerName, layerDef, callback) {
        var format = mapDisplay.createFormat(layerDef);
        layerDef.vectorSource = new ol.source.Vector({
            format: format,
            loader: function (extent, resolution, projection) {
                var projfrom = projection.getCode();
                //alert(projfrom);
                if (layerDef.projection) {
                    projto = layerDef.projection;
                    if (projfrom != projto) {
                        extent = ol.proj.transformExtent(extent, projfrom, projto);
                    }
                } else {
                    projto = projfrom;
                }
                var url = layerDef.url;
                if (layerDef.type == 'WFS') {
                    url = layerDef.url + '?service=WFS&' +
                        'version=' + layerDef.version + '&request=GetFeature&typename=' + layerDef.feature + '&' +
                        'outputFormat=GML3&srsname=' + projto + '&';
                    var ext = extent.join(',');
                    var ipos = ext.indexOf('infinity');
                    if (ipos < 0) {
                        url += 'bbox=' + extent.join(',') + ',' + projto;
                    }
                } else if (layerDef.type == 'esriJSON') {
                    url = layerDef.url;
                    var ext = extent.join(',');
                    var ipos = ext.indexOf('infinity');
                    if (ipos < 0) {
                        url += '&spatialRel=esriSpatialRelIntersects';
                        url += '&geometry=' + extent.join(',');
                        url += '&geometryType=esriGeometryEnvelope';
                        var ar = projto.split(':');
                        if (ar[0] == 'EPSG') {
                            projto = ar[1];
                        }
                        url += '&inSR=' + projto;
                        //alert(url);
                    }
                }
                mapDisplay.fetchData(layerName, layerDef, url, function (err, features) {
                    if (err) {
                        alert(JSON.stringify(err));
                        layerDef.vectorSource.removeLoadedExtent(extent);
                    } else {
                        layerDef.vectorSource.addFeatures(features);
                    }
                });
            },
            strategy: ol.loadingstrategy.bbox
        });
        var vector = mapDisplay.createVectorLayer(layerName, layerDef);
        mapDisplay.map.addLayer(vector);
        layerDef.layer = vectorLayer;
       // mapDisplay.fetchNextLayer(callback, layerName, layerDef);
    }
    mapDisplay.addVectorLayer = async function (layerName, layerDef) {
        var layerDefSource = layerDef;
        var layerNameSource = layerName;
        if (layerDef.datasource) {
            layerDefSource = mapDisplay.layerDefs[layerDef.datasource];
            layerNameSource = layerDef.datasource;
            if (!layerDefSource) {
                alert('layerDefSource not found: ' + layerDef.datasource);
            }
        }
        if (layerDefSource.vectorSource) {
            layerDef.vectorSource = layerDefSource.vectorSource;
            var vectorLayer = mapDisplay.createVectorLayer(layerName, layerDef);
            mapDisplay.map.addLayer(vectorLayer);
            layerDef.layer = vectorLayer;
            //mapDisplay.fetchNextLayer(callback, layerName, layerDef);
            return;
        }
        if (layerDef.vectorSource) {
            var vectorLayer = mapDisplay.createVectorLayer(layerName, layerDef);
            mapDisplay.map.addLayer(vectorLayer);
            layerDefSource.layer = vectorLayer;
            //mapDisplay.fetchNextLayer(callback, layerName, layerDef);
            return;
        }
        var url = layerDefSource.url;
        if (!url || url.length == 0) {
            url = mapDisplay.dataurlbase + layerNameSource + '.json';
        }
        var features = await mapDisplay.fetchData(layerNameSource, layerDefSource, url);
        if (features) {
            layerDefSource.vectorSource = new ol.source.Vector({
                features: features
            });
        } else {
            layerDefSource.vectorSource = new ol.source.Vector({});
        }
        if (layerDef.datasource) {
            layerDef.vectorSource = layerDefSource.vectorSource;
        }
        var vectorLayer = mapDisplay.createVectorLayer(layerName, layerDef);
        mapDisplay.map.addLayer(vectorLayer);
        layerDef.layer = vectorLayer;
    }

    mapDisplay.addLayer = async function (layerName, layerDef) {
        if (layerDef.strategy) {
            await mapDisplay.addbboxVectorLayer(layerName, layerDef);
        } else {
            await mapDisplay.addVectorLayer(layerName, layerDef);
        }
    }
    mapDisplay.setLayerData = function (layerDef, layerName, data) {
        var format = mapDisplay.createFormat(layerDef);
        features = mapDisplay.readFeatures(format, data, layerName, layerDef);
        layerDef.vectorSource = new ol.source.Vector({
            features: features
        });
        if (layerDef.layer) {
            layerDef.layer.setSource(layerDef.vectorSource);
        }
    }
    mapDisplay.addFeature = function (layerName, feature) {
        var layerDef = mapDisplay.layerDefs[layerName];
        if (layerDef) {
            layerDef.vectorSource.addFeature(feature);
        } else {
            alert("Layer not found " + layerName);
        }
    }
    mapDisplay.deleteFeature = function (layerName, id) {
        var layerDef = mapDisplay.layerDefs[layerName];
        if (layerDef) {
            var feature = layerDef.vectorSource.getFeatureById(id);
            if (feature) {
                layerDef.vectorSource.removeFeature(feature);
                return true;
            }
        } else {
            alert("Layer not found " + layerName);
        }
        return false;
    }
    mapDisplay.addLayerDef = function (layerDef, layerName, data) {
        if (!mapDisplay.layerDefs) {
            mapDisplay.layerDefs = {};
        }
        mapDisplay.layerDefs[layerName] = layerDef;
        layerDef.nextId = 0;
        formStyles(layerDef);
        if (controldiv) {
            mapDisplay.populateControl();
        }
        mapDisplay.setLayerData(layerDef, layerName, data);
        var vectorLayer = mapDisplay.createVectorLayer(layerName, layerDef);
        mapDisplay.map.addLayer(vectorLayer);
        layerDef.layer = vectorLayer;
    }
    mapDisplay.getCheckedLayers = function () {
        var layers = [];
        var keys = Object.keys(mapDisplay.layerDefs);
        keys.forEach(function (layerName, i) {
            if ($('#' + layerName).find('#on').prop('checked')) {
                layers.push(layerName);
            }
        });
        return layers;
    }
    mapDisplay.loadLayers = function (url, urlTemplates, urlDictionary, callback, layers) {
        var prom = new Promise(async (resolve, reject) => {
            var prom2 = new Promise((res, rej) => {
                $.ajax({
                    url: url,
                    method: 'get',
                    dataType: 'json',
                    data: Date(),
                    processData: true,
                    contentType: 'application/json',
                    success: function (data) {
                        res(data);
                    },
                    error: function (err) {
                        if (err.status == 404) {
                            alert(url + " Not Found");
                        } else {
                            alert("Unable to load " + url + " err : " + JSON.stringify(err));
                        }
                        rej(err);
                    }
                });
            });
            if (!layers) {
                layers = [];
            }
            var data = await prom2;
            //console.log('Loaded layer definitions');
            var keys = Object.keys(data);
            mapDisplay.layerDefs = {};
            for (const key of keys) {
                if (key == 'groups') {
                    mapDisplay.groups = data.groups;
                    // Read groups
                    var groupkeys = Object.keys(data.groups);
                    for (const groupkey of groupkeys) {
                        var group = data.groups[groupkey];
                        var prom2 = new Promise((res, rej) => {
                            $.ajax({
                                url: group.layers,
                                method: 'get',
                                dataType: 'json',
                                data: Date(),
                                processData: true,
                                contentType: 'application/json',
                                success: function (data) {
                                    res(data);
                                },
                                error: function (err) {
                                    var url = group.layers;
                                    if (err.status == 404) {
                                        console.log('Not found: ' + url);
                                        alert(url + " Not Found");
                                    } else {
                                        console.log('Error ' + err.toString() + ' \nloading: ' + url);
                                        alert("Unable to load " + url + " err : " + JSON.stringify(err));
                                    }
                                    rej(err);
                                }
                            });
                        });
                        group.layerDefs = await prom2;
                        var layerkeys = Object.keys(group.layerDefs);
                        layerkeys.forEach(function (layerName, i) {
                            var layerDef = group.layerDefs[layerName];
                            mapDisplay.layerDefs[layerName] = layerDef;
                            layerDef.nextId = 0;
                            formStyles(layerDef);
                            if (layerDef.on) {
                                layers.push(layerName);
                            }
                        });
                    }
                } else {
                    var layerDef = data[key];
                    mapDisplay.layerDefs[key] = layerDef;
                    layerDef.nextId = 0;
                    layerDef.nogroup = true;
                    if (layerDef.on) {
                        layers.push(key);
                    }
                    formStyles(layerDef);
                }
            }
            if (controldiv) {
                mapDisplay.populateControl(layers, callback);
            }
            //console.log('Populated controldiv');
            if (urlTemplates && urlTemplates != 'NONE') {
                prom2 = new Promise((res, rej) => {
                    // Get templates
                    $.ajax({
                        url: urlTemplates,
                        method: 'get',
                        dataType: 'json',
                        data: Date(),
                        processData: true,
                        contentType: 'application/json',
                        success: function (data) {
                            res(data);
                        },
                        error: function (err) {
                            if (err.status == 404) {
                                rej(urlTemplates + " Not Found");
                            } else {
                                rej("Unable to load " + urlTemplates + " err : " + JSON.stringify(err));
                            }
                        }
                    });
                });
                mapDisplay.templates = await prom2;
            }
            //console.log('Loaded templates');
            // Get dictionary
            if (!urlDictionary) {
                urlDictionary = mapDisplay.dictionaryurl;
            }
            if (urlDictionary && urlDictionary != 'NONE') {
                console.log('dictionary url: ' + urlDictionary);
                prom2 = new Promise((res, rej) => {
                    $.ajax({
                        url: urlDictionary,
                        method: 'get',
                        dataType: 'json',
                        data: Date(),
                        processData: true,
                        contentType: 'application/json',
                        success: function (data) {
                            console.log('Loaded dictionary');
                            res(data);
                        },
                        error: function (err) {
                            if (err.status == 404) {
                                alert(urlDictionary + " Not Found");
                            } else {
                                alert("Unable to load " + urlDictionary + " err : " + JSON.stringify(err));
                            }
                            rej(err);
                        }
                    });
                });
                mapDisplay.dictionary = await prom2;
            }
            //console.log('Loaded dictionary');
            if (layers) {
                for (const layer of layers) {
                    var layerDef = mapDisplay.layerDefs[layer];
                    if (layerDef) {
                        layerDef.on = true;
                        await mapDisplay.addLayer(layer, layerDef);
                        mapDisplay.fetchNextLayer(layer, layerDef);
                        $('#' + layer).find('#on').prop('checked', true);
                    }
                }
            }
            //console.log('rendering map');
            mapDisplay.map.render();
            resolve();
        });
        prom.then(() => {
            //console.log('calling callback');
            callback(null);
        }).catch((err) => {
            callback(err);
        });
    }
    mapDisplay.refreshLayer = function (layerName, callback) {
        var layerDef = mapDisplay.layerDefs[layerName];
        layerDef.layer = null;
        var prom = new Promise(async(resolve, reject) => {
            await mapDisplay.addLayer(layerName, layerDef);
        });
        prom.then(() => {
            callback(null);
        }).catch((err) => {
            callback(err);
        });
    }
    mapDisplay.combos = {};
    mapDisplay.populateCombo = function (layerName, comboid, defid, codeatt, nameatt, callback, titl) {
        mapDisplay.findLayerName = layerName;
        $('#' + comboid).html('');
        if (!codeatt) {
            codeatt = 'code';
        }
        if (!nameatt) {
            nameatt = 'name';
        }
        mapDisplay.combos[comboid] = {
            codeatt: codeatt
        };
        var layerDef = mapDisplay.layerDefs[layerName];
        if (layerDef) {
            var prom = new Promise(async (resolve, reject) => {
                await mapDisplay.addLayer(layerName, layerDef);
                resolve();
            });
            prom.then(() => {
                var features = mapDisplay.getFeatures(layerName);
                features = features.sort(function (a, b) {
                    var aname = a.get(nameatt);
                    var bname = b.get(nameatt);
                    return (aname < bname) ? -1 : 1;
                });
                var body = '';
                var title = layerName;
                if (layerDef.name) {
                    title = layerDef.name;
                }
                if (titl) {
                    title = titl;
                }
                body += '<option value="">Select ' + title + '</option>';
                body += '<option value="outline">Outline</option>';
                features.forEach(function (f, i) {
                    var code = f.get(codeatt);
                    body += '<option value="' + code + '" ';
                    if (defid == code) {
                        body += 'selected ';
                    }
                    body += '>' + f.get(nameatt) + '</option>';
                });
                $('#' + comboid).html(body);
                if (defid) {
                    mapDisplay.selectFoundFeature(defid);
                }
                if (callback) {
                    callback(layerName);
                }
            });
        }
    }
    mapDisplay.selectFoundFeature = function (val, comboid, bufferFactor, maxZoom) {
        var obj = mapDisplay.combos[comboid];
        if (!obj) {
            console.log(comboid + ' not found in ' + JSON.stringify(mapDisplay.combos));
        }
        var p = null;
        if (!val) {
            val = $('#' + comboid).val();
            //alert('val:' + val);
        }
        if (val == 'outline') {
            mapDisplay.zoomoutline();
        } else {
            var features = mapDisplay.getFeatures(mapDisplay.findLayerName);
            features.forEach(function (f, i) {
                if (f.get(obj.codeatt) == val) {
                    p = f;
                }
            });
            if (p) {
                mapDisplay.zoomFeature(p, bufferFactor, maxZoom);
            }
        }
    }
    mapDisplay.refreshDependentLayers = async function(layerName) {
        // refresh depends
        //var layers = mapdisplay.getCheckedLayers();
        var layers = Object.keys(mapdisplay.layerDefs);
        for (const layer of layers) {
            if (mapdisplay.layerDefs[layer].datasource == layerName) {
                var checked = mapdisplay.isLayerIncluded(layer);
                //mapdisplay.includeLayer(layerName, checked);
                var deplayerDef = mapdisplay.layerDefs[layer];
                var clickable = deplayerDef.clickable;
                mapdisplay.map.removeLayer(deplayerDef.layer);
                deplayerDef.layer = null;
                deplayerDef.vectorSource = null;
                if (checked) {
                    await mapdisplay.addLayer(layer, deplayerDef);
                }
                if (clickable) {
                    mapdisplay.setlayerClickable(layer);
                }
            }
        }
    }
    return mapDisplay;
}