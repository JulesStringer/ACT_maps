function parentstyle(parent) {
    var style = $('#' + parent).attr('style');
    if (!style && style.length == 0) {
        var newparent = $('#' + ttdiv).attr('parent');
        style = parentstyle(newparent);
    }
    return style;
}
function gettooltipsparent(tooltips, ttdiv) {
    var style = $('#' + ttdiv).attr('style');
    var parent = $('#' + ttdiv).attr('parent');
    if (parent && parent.length > 0) {
        gettooltipsparent(tooltips, parent);
        if (!style || style.length == 0) {
            style = parentstyle(parent);
        }
    }
    $('#' + ttdiv + '>li').each(function (index) {
        var ele = $(this);
        var text = ele.html();
        var tstyle = ele.attr('style');
        var tooltip = {
            text: text
        };
        if (tstyle && tstyle.length > 0) {
            tooltip.style = tstyle;
        } else if (style && style.length > 0) {
            tooltip.style = style;
        }
        var field = ele.attr('field');
        tooltips[field] = tooltip;
    });
    return tooltips;
}
function gettooltips(tableid) {
    var tooltips = {};
    var ttdiv = tableid + '_tooltips';
    gettooltipsparent(tooltips, ttdiv);
    return tooltips;
}
function applytooltips(tableid, columnspecs) {
    var tooltips = gettooltips(tableid);
    var keys = Object.keys(tooltips);
    keys.forEach(function (key, i) {
        var tooltip = tooltips[key];
        if (columnspecs[key]) {
            columnspecs[key].tooltip = tooltip;
        }
    });
}
function tooltiphtml(tooltip) {
    var body = '<span class="tooltiptext" ';
    if (tooltip.style) {
        body += 'style="' + tooltip.style + '" ';
    }
    body += '>';
    body += tooltip.text + '</span > ';
    body += '</span>';
    return body;
}
function fieldtooltiphtml(tooltips, field) {
    var tooltip = tooltips[field];
    if (tooltip) {
        return tooltiphtml(tooltip);
    }
    return '';
}
function formattooltip(tooltips, field, text) {
    var tooltip = tooltips[field];
    var body = '';
    if (tooltip) {
        var body = '<span class="tooltip">';
        body += text;
        body += tooltiphtml(tooltip);
    } else {
        body += text;
    }
    return body;
}
function thwithtooltip(cls, width, tooltips, field, title) {
    var body = '<th';
    if (cls) {
        body += ' class="' + cls + '"';
    }
    if (width) {
        body += ' style="width:' + width + 'px;"';
    }
    body += '>';
    body += formattooltip(tooltips, field, title);
    return body;
}
