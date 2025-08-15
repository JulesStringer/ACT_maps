var epsg27700 = null;
if (epsg27700 == null) {
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
    ol.proj.proj4.register(proj4);
    epsg27700 = ol.proj.get('EPSG:27700');
}
var formatLength = function (length) {
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};
var formatArea = function (area) {
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};
function formatPoint(pt,crsname, mapdisplay) {
    var pt1 = pt.clone();
    var fromcrs = "EPSG:3857";
    if (mapdisplay) {
        fromcrs = "EPSG:" + mapdisplay.srs;
    }
    if (crsname != fromcrs) {
        pt1 = pt1.transform(fromcrs, crsname);
    }
    var coords = pt1.getCoordinates();
    var output = JSON.stringify(pt1);
    switch (crsname) {
        case 'EPSG:27700':
            output = Math.round(coords[0]) + "E " + Math.round(coords[1]) + "N";
            break;
        case 'EPSG:4326':
            if (coords[0] < 0) {
                output = (Math.round(-coords[0] * 10000) / 10000) + "&#176;W ";
            } else {
                output = (Math.round(coords[0] * 10000) / 10000) + "&#176;E ";
            }
            output += (Math.round(coords[1] * 10000) / 10000) + "&#176;N";
            break;
        default:
            output = JSON.stringify(coords);
            break;
    }
    return output;
}
function getNGR(pt, mapdisplay) {
    if (pt) {
        var pt1 = pt.clone();
        var fromcrs = "EPSG:3857";
        if (mapdisplay) {
            fromcrs = "EPSG:" + mapdisplay.srs;
        }
        var crsname = "EPSG:27700";
        if (crsname != fromcrs) {
            pt1 = pt1.transform(fromcrs, crsname);
        }
        return pt1.getCoordinates();
    }
    return null;
}
function getNGRDistance(coord1, coord2) {
    if (coord1 && coord2) {
        var x1 = coord1[0];
        var y1 = coord1[1];
        var x2 = coord2[0];
        var y2 = coord2[1];
        var xd = x1 - x2;
        var yd = y1 - y2;
        return Math.sqrt(xd * xd + yd * yd);
    }
    return null;
}
function geometryMeasures(geom, mapdisplay) {
    if (epsg27700 == null) {
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
        ol.proj.proj4.register(proj4);
        epsg27700 = ol.proj.get('EPSG:27700');
    }
    var measures = {};
    if (geom instanceof ol.geom.Polygon ) {
        var area = ol.sphere.getArea(geom);
        measures.area = formatArea(area);
        var interiorPoint = geom.getInteriorPoint();
        measures.interiorPointNGR = formatPoint(interiorPoint, "EPSG:27700", mapdisplay);
        measures.interiorLonLat = formatPoint(interiorPoint, "EPSG:4326", mapdisplay);
        measures.holes = geom.getLinearRingCount() - 1;
    } else if (geom instanceof ol.geom.LineString) {
        var length = ol.sphere.getLength(geom);
        measures.length = formatLength(length);
    } else if (geom instanceof ol.geom.Point) {
        measures.NGR = formatPoint(geom, "EPSG:27700", mapdisplay);
        measures.LonLat = formatPoint(geom, "EPSG:4326", mapdisplay);
        measures.EPSG3857 = formatPoint(geom, "EPSG:3857", mapdisplay);
    } else if (geom instanceof ol.geom.MultiPolygon) {
        var area = ol.sphere.getArea(geom);
        measures.area = formatArea(area);
        var ips = geom.getInteriorPoints().getPoints();
        var pts = [];
        ips.forEach(function (pt, i) {
            var p = {};
            p.NGR = formatPoint(pt, "EPSG:27700", mapdisplay);
            p.LonLat = formatPoint(pt, "EPSG:4326", mapdisplay);
            pts.push(p);
        });
        measures.interiorPoints = pts;
        measures.numberPolygons = geom.getPolygons().length;
    }
    return measures;
}
function geometrySeed(geom) {
    var pt = null;
    if (geom instanceof ol.geom.Polygon) {
        pt = geom.getInteriorPoint();
    } else if (geom instanceof ol.geom.MultiPolygon) {
        var ips = geom.getInteriorPoints().getPoints();
        pt = ips[0];
    } else {
        pt = new ol.geom.Point(geom.getFirstCoordinate());
    }
    return pt;
}