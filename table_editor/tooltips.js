function parentstyle(parent) {
    var style = jQuery('#' + parent).attr('style');
    if (!style && style.length == 0) {
        var newparent = jQuery('#' + ttdiv).attr('parent');
        style = parentstyle(newparent);
    }
    return style;
}
function gettooltipsparent(tooltips, ttdiv) {
    var style = jQuery('#' + ttdiv).attr('style');
    var parent = jQuery('#' + ttdiv).attr('parent');
    if (parent && parent.length > 0) {
        gettooltipsparent(tooltips, parent);
        if (!style || style.length == 0) {
            style = parentstyle(parent);
        }
    }
    jQuery('#' + ttdiv + '>li').each(function (index) {
        var ele = jQuery(this);
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
// don't use this.
function gettoolhelptips(columndesc,id){
    var idf = jQuery('#' + id);
    if ( idf.get(0) ){
        console.log(id + ' found');
        //console.log(idf.html());
    }
    idf.find('[field]').each(function(i,el){
//    idf.find('b').each(function(i,el)){
        var colid = jQuery(el).attr('field');
        console.log('Got help for : ' + colid);
        var text = jQuery(el).html();
        var subtext = jQuery(el).find('b').text();
        text = text.replace(subtext,'');
        text = text.replace("<b>",'');
        text = text.replace("</b>",'');
        text = text.replace(/\n/g,'');
        text = text.replace(/<br>/g,'').trim();
        // make everything a paragraph if not already for consistency.
        // This then means that a top margin of -20px can be used.
        if ( !text.startsWith('<p>')){
            text = '<p>' + text + '<p>';
        }
        var tooltip = {
            text: text
        };
        if ( colid && columndesc[colid]){
            columndesc[colid].tooltip = tooltip;
            console.log(colid + ' tooltip set to ' + JSON.stringify(tooltip));
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
