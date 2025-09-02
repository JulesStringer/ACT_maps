function tableEditor_attributehelp(tableid, rowid , colid){
    var table = tableEditor_tables[tableid];
    if ( table ){
        table.attributehelp(rowid, colid);
    }
}
// formseditor is dependent on tableeditor, which must be loaded first
async function createFormsEditor(tableid, tableobj, columnspecs, saveobj, options, tooltips) {
    // additional argument show is false to prevent any functions defined in createTableEditor from being called
    // so that overriding functions can take effect.
    var table = createTableEditor(tableid, tableobj,columnspecs, saveobj, options, false);
    table.helpmode = options.helpmode;
    if ( !table.helpmode ){
        table.helpmode = 'context';
    }
    table.sethelpmode = function(mode){
        table.helpmode = mode;
        //console.log('helpmode set to ' + mode + ' for table ' + tableid);
    }
    table.tooltips = tooltips;
    // none         no help
    // context      help when ? by a field is pressed
    // contextauto  help on ? and on gaining focus
    // interspersed help is interspersed with input
    //
    // overriding functions
    table.enableCell = function (rowid, colid) {
        var column = table.columnspecs[colid];
        if (column.enabled) {
            var rowobj = table.tableobj[rowid];
            var en = column.enabled(rowobj, rowid);
            var cell = $('#' + table.cellkey(rowid, colid));
            var div = $('#div_' + table.cellkey(rowid,colid));
            var help = $('#help_' + table.cellkey(rowid,colid));
            var calc = $('#calc_' + table.cellkey(rowid,colid));
            var shown = false;
            if (en === 'readonly') {
                cell.prop('disabled', true);
                help.css({ visibility: 'hidden'});
                calc.css({ visibility: 'hidden'});
            } else if (en === 'hidden'){
                cell.css({ display:'none'});
                div.css({ display: 'none' });
                help.css({ display:'none' });
                calc.css({ display:'none' });

            } else if (en) {
                cell.prop('disabled', false);
                cell.css({ visibility: 'visible', display:'inline-block' });
                div.css({ visibility: 'visible', display:'inline-block' });
                help.css({ visibility: 'visible'});
                calc.css({ visibility: 'visible'});
                shown = true;
            } else {
                cell.prop('disabled', true);
                cell.css({ visibility: 'hidden' });
                div.css({ visibility: 'hidden' });
                help.css({ visibility:'hidden' });
                calc.css({ visibility:'hidden' });
            }
            cell.children().each(function () {
                if (en === 'readonly') {
                    cell.prop('disabled', true);
                } else if (en) {
                    cell.prop('disabled', false);
                    cell.css({ visibility: 'visible' });
                } else {
                    cell.prop('disabled', true);
                    cell.css({ visibility: 'hidden' });
                }
            });
        }
    }
    table.contextmenu = function(rowid,colid){
        console.log('Got right click');
    }
    table.keydown = function (event, rowid, colid) {
        var column = table.columnspecs[colid];
        switch (event.key) {
            case 'Up':
            case 'ArrowUp':
                var pos = event.target.selectionStart;
                var newid = table.findrow(rowid, -1);
                var ctrl = $('#' + table.cellkey(newid, colid));
                ctrl.focus();
                if (column.type.startsWith('text')) {
                    ctrl.get(0).setSelectionRange(pos, pos);
                }
                event.preventDefault();
                break;
            case 'Down':
            case 'ArrowDown':
                var pos = event.target.selectionStart;
                var newid = table.findrow(rowid, 1);
                var ctrl = $('#' + table.cellkey(newid, colid));
                ctrl.focus();
                if (column.type.startsWith('text')) {
                    ctrl.get(0).setSelectionRange(pos, pos);
                }
                event.preventDefault();
                break;
            case 'Left':
            case 'ArrowLeft':
                // Should only do this if already at 0 when left pressed.
                var column = table.columnspecs[colid];
                if (typeof (event.target.selectionStart) === 'undefined') {
                    alert("Selectionstart not set");
                } else if (event.target.selectionStart == 0) {
                    var newid = table.findcolumn(colid, -1, rowid);
                    if (newid != colid) {
                        var ctrl = $('#' + table.cellkey(rowid, newid));
                        ctrl.focus();
                        var str = ctrl.val();
                        var pos = str.length;
                        var newcolumn = table.columnspecs[newid];
                        if (newcolumn.type.startsWith('text')) {
                            ctrl.get(0).setSelectionRange(pos, pos);
                        }
                        event.preventDefault();
                    }
                }
                break;
            case 'Right':
            case 'ArrowRight':
//            case 'Enter':
                var ctrl = $('#' + table.cellkey(rowid, colid));
                str = ctrl.val();
                if (str.length == event.target.selectionStart) {
                    var newid = table.findcolumn(colid, 1, rowid);
                    if (newid != colid) {
                        var ctrl = $('#' + table.cellkey(rowid, newid));
                        ctrl.focus();
                        var newcolumn = table.columnspecs[newid];
                        if (newcolumn.type.startsWith('text')) {
                            ctrl.get(0).setSelectionRange(0, 0);
                        }
                        event.preventDefault();
                    }
                }
                break;
//            case 'Left':
//            case 'ArrowLeft':
//            case 'Right':
//            case 'ArrowRight':
            case "Tab":
            case "Enter":
            case "Backspace":
            case "Delete":
                break;
            default:
                if (table.columnspecs[colid].checkNumber) {
                    if ((event.key < "0" || event.key > "9")&& event.key != ".") {
                        event.preventDefault();
                    }
                }
                break;
        }
    }
    table.keyup = function (event, rowid, colid) {
        var coldesc = table.columnspecs[colid];
        var proceed = true;
        if ( event.key == 'Delete'){
            proceed = table.ondelete(rowid);
        }
        if ( proceed ){
            if (coldesc.type != 'date') {
                table.onchange(rowid, colid);
            }
        }
    }
    table.appendunits = function(rowid, colid, rowobj, cls){
        var column = table.columnspecs[colid];
        var body = '';
        if ( column.units ) {
            body += ' <span ';
            if ( cls ){
                body += 'class="' + cls + '"';
            }
            body += 'id="units_' + table.cellkey(rowid,colid) +'" ';
            if ( typeof(column.units) === 'object'){
                if ( column.units.width ){
                    body += 'style="width:' + column.units.width+ '" ';
                }
            }
            body += '>';
            if ( typeof(column.units) !== 'object'){
                body += column.units;
            } else if ( column.units.calculate ) {
                var v = column.units.calculate(rowobj);
                body += v;
            }
            body += '</span>';
        }
        return body;
    }
    table.attributehelper = null;
    table.attributehelp = function(rowid, colid){
        if ( table.attributehelper ){
            // get header for cell
            var htext = $('#header_' + table.cellkey(rowid, colid)).text();
//            table.attributehelper(table.id, colid, htext);
        }
        if ( table.helpmode && table.helpmode.startsWith('context')){
//            console.log('Resizing attributehelp');
            var id = '#inlinehelp_' + table.cellkey(rowid, colid);
            if ( $(id).css('display') == 'block'){
                $(id).css({display:'none'});
            } else {
                $('.inlinehelp').css({display:'none'});
                // Get header and lookup tooltip
                hid= '#header_' + table.cellkey(rowid,colid);
                var hdr = $(hid).text();
                hdr = hdr.toLowerCase();
                console.log('header: ' + hdr);
                if ( table.tooltips[hdr] ){
                    console.log(' tt: ' + table.tooltips[hdr]);
                    $(id).css({display:'block'});
                    var tx = table.tooltips[hdr];
                    tx += '<button type="button" style="position:absolute;top:0px;right:0px;" ';
                    tx += 'onclick="$(\'.inlinehelp\').css({display:\'none\'});" >X</button>';
                    $(id).html(tx);
                }
            }
        }
    }
    table.addcalculatebutton = function(colid, rowid, stargs){
        var column = table.columnspecs[colid];
        var body = '';
        var ok = true;
        if (column.helperButton.condition) {
            ok = column.helperButton.condition(rowid);
        }
        if (ok) {
            body += '<span class="tooltip" role="button" onclick="' + column.helperButton.action + '(' + stargs + ');" '
            body += ' id="calc_' + table.id + '_' + rowid + '_' + colid + '" >';
            body += '<img width="12" height="12" src="images/icons8-calculator-64.png" />..';
            if (column.helperButton.text) {
                body += '<span class="tooltiptext" >';
                body += column.helperButton.text;
                body += '</span>';
            }
            body += '</span>';
        }
        return body;
    }
    table.addhelp = function(rowid, colid){
        var body = '';
        body += '<span class="tooltip" ';
        body += 'onclick="tableEditor_attributehelp(\'' + table.id + '\',\'' + rowid + '\',\'' + colid + '\');"';
        body += 'ontouchstart="tableEditor_attributehelp(\'' + table.id + '\',\'' + rowid + '\',\'' + colid + '\');"';
        body += ' id="help_' + table.id + '_' + rowid + '_' + colid + '" >...?';
        body += '</span>';
        return body;
    }
    table.adddelete = function(rowid, rowobj, tttext){
        var body = '';
        var keys = Object.keys(table.tableobj);
        var allowdelete = true;
        if ( options.nodelete ){
            allowdelete = false;
        }
        if ( keys.length < 2 ){
            allowdelete = false;
        }
        if ( rowobj && rowobj._nodelete && rowobj._nodelete !== false){
            allowdelete = false;
        }
        if ( allowdelete ){
            body += '<span class="tooltip" onclick="tableEditor_ondelete(\'' + table.id + '\',\'' + rowid + '\');" >';
            //body += '<span>&#x1f5d1;</span>';
            body += '<img width="15" height="15" src="images/icons8-trash-can-64.png" />';
            body += '<span class="tooltiptext" >' + tttext + '</span>';
            body += '</span>';
        }
        return body;
    }
    table.ontablefocus = table.onfocus;
    table.ontablefocusout = table.onfocusout;
    table.onfocus = function(rowid, colid){
        if ( table.ontablefocus ){
            table.ontablefocus(rowid, colid);
        }
    }
    table.onfocusout = function(rowid, colid){
        if ( table.helpmode && table.helpmode.startsWith('context')){
            $('#'+ colid + '_' + rowid + '_inlinehelp').css({display:'none'});
        }
        if ( table.ontablefocusout ){
            table.ontablefocusout(rowid, colid);
        }
    }
    table.formheader = function(rowid, colid, rowobj){
        var column = table.columnspecs[colid];
        var stargs = '\'' + table.id + '\',\'' + rowid + '\',\'' + colid + '\'';
        var body = '';
        body += '<div class="cell_header_block" style="position:relative;" >';
        body += '<h4 class="cell_header">';
        if (column.header) {
            if (column.helperButton) {
                body += table.addcalculatebutton(colid, rowid, stargs);
            }
            body += '<span id="header_' + table.cellkey(rowid,colid) +'" >';
            if ( typeof(column.header) === 'function'){
                body += column.header(rowobj);
            } else {
                body += column.header;
            }
            body += '</span>';
            if ( !column.nohelp ){
                body += table.addhelp(rowid, colid);
            }
        }
        body += '</h4>';
        body += '<div id="inlinehelp_' + table.cellkey(rowid, colid) + '" class="inlinehelp"';
        body += ' style="margin-top:-10px;';
        body += 'display:none;z-index:5;';
        body += '">';
        body += '</div>';
        body += '</div>';
        return body;
    }
    table.formcolumn = function(rowid,colid,rowobj,qualifier){
        var body = '';
        var column = table.columnspecs[colid];
        var stargs = '\'' + table.id + '\',\'' + rowid + '\',\'' + colid + '\'';
        var value = '';
        if (rowobj && rowobj[colid] !== null) {
            value = rowobj[colid];
        } else if (column.default) {
            value = column.default();
            if (rowobj) {
                rowobj[colid] = value;
            }
        }
        // Positions are calculated after display.
        body += '<div colid="' + colid + '" id="div_' + table.cellkey(rowid, colid) + '" ';
        body += ' class="'; 
        if ( qualifier ){
            body += 'form_qualifier" ';
        } else {
            body += 'form_cell" ';
        }
        // DO NOT SET position via style, it does a better job itself
        // trick is to use display: flex-row for rows and display:inline-block for cells
        body += ' >';
        body += table.formheader(rowid, colid, rowobj);
        body += '<div>';
        if (column.calculate) {
            body += '<span ';
            if (column.width) {
                body += 'style="width:' + column.width + ';"';
            }
            body += ' class="cell_span"';
            body += '>';
            body += '<span id="' + table.cellkey(rowid, colid) + '" >';
            var v = column.calculate(rowobj, rowid);
            if (column.format) {
                v = column.format(v);
            }
            if (v) {
                body += v;
            }
            body += '</span>';
            body += table.appendunits(rowid, colid, rowobj);
            body += '</span>';
        } else if (column.type === 'literal') {
            body += '<span id="' + table.cellkey(rowid, colid) + '" ';
            if (column.width) {
                body += 'style="width:' + column.width + ';"';
            }
            body += ' class="cell_span"';
            body += '>';
            if (rowobj && rowobj[colid]) {
                body += rowobj[colid];
            }
            body += table.appendunits(rowid, colid, rowobj);
            body += '</span>';
        } else if (column.type === 'tooltip') {
            body += '<span class="cell_span" >';
            if (rowobj) {
                if (column.gettooltip) {
                    var tooltip = column.gettooltip(rowobj, rowid);
                    if (tooltip) {
                        body += ' <span class="tooltip" >';
                        body += '?';
                        body += '<span class="tooltiptext"';
                        if (tooltip.style) {
                            body += ' style="' + tooltip.style + '"';
                        }
                        body += '>';
                        body += tooltip.text;
                        body += '</span>';
                        body += '</span>';
                    }
                }
            }
            body += '</span>';
        } else if (column.type === 'check') {
            body += '<input type="checkbox" id="' + table.cellkey(rowid, colid) + '" ';
            if (rowobj && rowobj[colid] && rowobj[colid] == true) {
                body += 'checked ';
            }
            body += 'onchange="tableEditor_onchange(' + stargs + ');" ';
            if (column.width) {
                body += 'style="width:' + column.width + ';"';
            }
            body += ' class="cell_content"';
            body += '/>';
        } else if (column.type === 'button') {
            body += '<button id="' + table.cellkey(rowid, colid) + '" ';
            body += 'onclick="tableEditor_on_click(\'' + table.id + '\',' + rowid + ',\'' + colid + '\');" ';
            if (column.width) {
                body += 'style="width:' + column.width + ';"';
            }
            body += '>';
            if (column.title) {
                body += column.title;
            } else {
                body += colid;
            }
            body += ' class="cell_content"';
            body += '</button>';
        } else {
            if (column.picklist) {
                var list = column.picklist;
                if (column.type === 'select' && list instanceof Function) {
                    list = column.picklist(rowobj, rowid);
                }
                if (list || column.prompt) {
                    body += '<select id="' + table.cellkey(rowid, colid) + '" ';
                    body += 'onchange="tableEditor_onchange(' + stargs + ');" ';
                    if (column.onfocus) {
                        body += 'onfocus="tableEditor_onfocus(' + stargs + ');" ';
                    }
                    body += ' class="cell_content"';
                    body += '>';
                    if (column.prompt) {
                        body += '<option value="" >' + column.prompt + '</option>';
                    }
                    if (list) {
                        var keys = Object.keys(list);
                        var selected = false;
                        keys.forEach(function (key, k) {
                            var used = false;
                            if (column.excludeselected) {
                                var rows = Object.keys(table.tableobj);
                                rows.forEach(function (rid, r) {
                                    var robj = table.tableobj[rid];
                                    var v = robj[colid];
                                    if (v === key) {
                                        used = true;
                                    }
                                });
                            }
                            body += '<option value="' + key + '"';
                            if (value && value.length > 0) {
                                if (key === value) {
                                    body += 'selected';
                                    selected = true;
                                }
                            } else if (column.excludeselected && used === false && selected === false) {
                                //                            body += 'selected';
                                //                            selected = true;
                                //                            table.onchange(rowid, colid);
                            }
                            body += ' >' + list[key].name + '</option>';
                        });
                    }
                    body += '</select>';
                }
            } else {
                var type = column.type;
                if (type == 'date') {
                    type = 'text';
                }
                body += '<input id="' + table.cellkey(rowid, colid) + '" + type="' + type + '" ';
                if (column.type === 'date') {
                    body += 'class="datepicker cell_content" ';
                } else {
                    body += 'value = "';
                    if (value) {
                        body += value;
                    }
                    body += '" ';
                    body += ' class="cell_content"';
                }
                body += ' placeholder="';
                if ( column.placeholder ){
                    body += column.placeholder;
                } else {
                    if ( column.type == 'date' ){
                        body += 'DATE';
                    } else if ( column.type == 'text'){
                        if ( column.checkNumber ){
                            body += 'NUMBER';
                        } else {
                            body += 'TEXT';
                        }
                    }
                }
                body += '" ';
                body += 'onchange="tableEditor_onchange(' + stargs + ');" ';
                body += 'onkeyup="tableEditor_keyup(event, ' + stargs + ');" ';
                body += 'autocomplete="off" ';
                body += 'onkeydown="tableEditor_keydown(event, ' + stargs + ');" ';
                if (column.size) {
                    body += 'size="' + column.size + '" ';
                }
                body += 'onfocus="tableEditor_onfocus(' + stargs + ');" ';
                body += 'onfocusout="tableEditor_onfocusout(' + stargs + ');" ';
                body += ' />';
            }
            body += table.appendunits(rowid, colid, rowobj, "cell_units");
        }
        body += '</div>';
        body += '</div>';
        return body;
    }
    // TODO have the structure - now determine what to do with it!
    table.formRow = function(rowid, rowobj){
        var body = '<div id="' + rowid + '" class="form_row form_row_background" >';
        var colkeys = Object.keys(table.columnspecs);
        var processed = {};
        colkeys.forEach(function (colid, i) {
            if ( !processed[colid] ){
                var column = table.columnspecs[colid];
                if ( column.qualifiers ){
                    body += '<div style="display:inline-block">';
                    body += table.formcolumn(rowid,colid,rowobj, false);
                    for(var subid of column.qualifiers){
                        body += table.formcolumn(rowid,subid,rowobj, true);
                        processed[subid] = 1;
                    }
                    body += '</div>';
                } else {
                    body += table.formcolumn(rowid,colid,rowobj, false);
                }
                processed[colid] = 1;
            }
        });
        // add in delete button
        body += '<div class="form_cell" ';
        //body += ' style="position:absolute;left:0px;top:0px;width:30px;margin-right:30px;"';
        body += ' >';
        body += table.adddelete(rowid, rowobj, 'Delete previous entry');
        body += '</div>';
        body += '</div>';
        return body;
    }
    table.sizerow = function(rowid, xlimit){
        // DO NOT set absolute positions on cells, let css sort that out.
    }
    table.limitx = null;
    table.limity = null;
    table.refreshtotals = function(){
        if ( options.totals ){
            for(var colid of options.totals) {
                var t = table.totalcolumn(colid);
                var column = table.columnspecs[colid];
                if (column.format) {
                    t = column.format(t);
                }
                $('#' + table.cellkey('total',colid)).text(t);
            }
        }
    }
    // need to initialise because user doesn't necessarily visit every field
    // and certainly not in order
    table.initialiserow = function(){
        var row = {};
        for(colid in table.columnspecs){
            var column = table.columnspecs[colid];
            if ( column.default){
                row[colid] = column.default();
            }
        }
        //console.log('Row initialised to: ' + JSON.stringify(row));
        return row;
    }
    table.addrow = async function (noshow) {
        nextrow = 1;
        var rowkeys = Object.keys(table.tableobj);
        rowkeys.forEach(function (rowid, i) {
            var n = parseInt(rowid);
            if (n + 1 > nextrow) {
                nextrow = n + 1;
            }
        });
        var row = table.initialiserow();
        table.tableobj[nextrow] = row;
        if (!noshow) {
            table.rowids.push(nextrow);
            var domrow = table.formRow(nextrow,row);
            $('#' + table.id + '_items').append(domrow);
            table.enablerowdates(nextrow);
            table.sizerow(nextrow,table.limitx);
            table.refreshtotals();
            // scroll new row into view
            var r = $('#' + table.id + '_items > #' + nextrow);
            r[0].scrollIntoView(true);
            r.find('.inlinehelp').css({display:'none'});
        }
    }
    table.ondelete = async function (rowid) {
        if (table.tableobj[rowid]) {
            // check there is at least one row
            var keys = Object.keys(table.tableobj);
            if ( keys.length < 2 ){
                alert('You can not delete the first row');
            } else if ( confirm('Delete current entry?')){
                if (options.ondelete) {
                    options.ondelete(rowid);
                }
                delete table.tableobj[rowid];
                table.saveobj(table.tableobj);
                // delete row from dom, then recalculate totals
                $('#' + table.id).find('#'+rowid).remove();
                table.refreshtotals();
                return false;
            }
        }
        return true;
    }
    table.enablerowdates = function(rowid){
        if ( table.tableobj){
            var rowobj = table.tableobj[rowid];
            var colkeys = Object.keys(table.columnspecs);
            for(var colid of colkeys) {
                var column = table.columnspecs[colid];
                if (column.enabled) {
                    table.enableCell(rowid, colid);
                }
                if (rowobj && rowobj[colid] && (column.type === 'date' || column.type === 'datetime-local')) {
                    var v = rowobj[colid];
                    var d = new Date(rowobj[colid]);
                    if (!rowobj[colid]) {
                        d = new Date();
                    }
                    var cell = $('#' + table.cellkey(rowid, colid));
                    if (column.type === 'date') {
                        cell.datepicker("setDate", d);
                    } else if ( column.type === 'datetime-local'){
                        var t = d.getTime() - d.getTimezoneOffset()*60*1000;
                        d = new Date(t);
                        var dstr = d.toISOString().slice(0,19);
                        cell.val(dstr);
                    }
                }
            }
        }
    }
    table.enabledates = function(){
        for(var rowid of table.rowids) {
            table.enablerowdates(rowid);
        }
    }
    table.settableobj = function(tableobj){
        var nextrow = 1;
        var rowcount = 0;
        var rowlimit = null;
        if (options) {
            rowlimit = options.rowlimit;
        }
        table.tableobj = tableobj;
        // populate items section
        var body = '';
        var rowkeys = Object.keys(table.tableobj);
        rowkeys.forEach(function (rowid, i) {
            table.rowids.push(rowid);
            var rowobj = table.tableobj[rowid];
            if ( rowobj._hiderow) {
                console.log('Hidden row');
            } else {
                body += table.formRow(rowid, rowobj);
            }
            var n = parseInt(rowid);
            if (n + 1 > nextrow) {
                nextrow = n + 1;
            }
            rowcount++;
        });
        if (rowcount == 0) {
            table.tableobj[nextrow] = {};
            body += table.formRow(nextrow, table.tableobj[nextrow]);
            table.rowids.push(nextrow);
            nextrow++;
        }
        $('#' + table.id + '_items').html(body);
        table.refreshtotals();
        table.enabledates();
        table.sizetable(table.limitx, table.limity);
    }
    table.addfootnote = function(footnote){
        table.footnote = footnote;
        $('#' + tableid + '_notes').html(footnote);
    }
    // Separated forming tables from showing them, so that you can form tables at the beginning
    // and then populate them without resizing or redrawing.
    table.formtable = function () {
        $('#' + table.id).html('');
        table.rowids = [];
        table.colids = [];
        var body = '';
        var colkeys = Object.keys(table.columnspecs);
        colkeys.forEach(function (key, i) {
            var column = table.columnspecs[key];
            if (!column.calculate) {
                table.colids.push(key);
            }
        });
        //var nextrow = 1;
        //var rowcount = 0;
        if (table.tableobj) {
            body += '<div class="form_items" id="' + table.id + '_items">';
            body += '</div>';
        }
        var rowlimit = null;
        var addbutton = true;
        if (options) {
            rowlimit = options.rowlimit;
            if ( options.noadd && options.noadd !== false){
                addbutton = false;
            }
            if ( rowlimit <= 1 ){
                addbutton = false;
            }
        }
        //if (!rowlimit || rowcount < rowlimit && rowcount == 0) {
        if ( addbutton ){
            body += '<button class="rounded_button form_row add_button" style="margin-bottom:0;bottom:0px;" id="' + table.id +'_add" type="button" onclick="tableEditor_addrow(\'' + table.id + '\',false);" >Add Another</button>';
        }

        if (options.totals) {
            body += '<div id="' + table.id + '_totals" class="form_row form_row_background form_total" style="margin-bottom:0;padding-top:0;bottom:10px;">';
            var tablename = table.id;
            if ( options.tablename){
                tablename = options.tablename;
            }
            colkeys.forEach(function (colid, i) {
                options.totals.forEach(function (tot, j) {
                    if (tot === colid) {
                        var column = table.columnspecs[colid];
                        body += '<div class="form_cell" colid="' + colid + '" >';
                        body += '<div class="cell_header_block">';
                        body += '<h4 class="cell_header" >' + tablename + ' Total ';
                        if ( typeof(column.header) == 'function'){
                            if ( column.headers ){
                                body += column.headers[0];
                            }
                        } else {
                            body += column.header;
                        }
                        body += '</h4>';
                        body += '</div>';
                        body += '<div>';
                        body += '<span class="cell_span">'
                        body += '<span id="' + table.cellkey('total',colid) + '">';
                        body += '</span>';
                        if ( column.units && typeof(column.units) != 'object'){
                            //body += '<span class="cell_units">';
                            body += ' ' + column.units;
                            //body += '</span>';
                        }
                        '</span>'
                        body += '</div>';
                        body += '</div>';
                    }
                });
            });
            body += '<div style="height:unset;" class="form_cell" id="' + tableid + '_notes" >';
            if ( table.footnote ){
                body += table.footnote;
            }
            body += '</div>';
        }
        $('#' + table.id).html(body);
    }
    // Showtable is for backward compatability.
    table.showTable = function(){
        table.formtable();
        table.settableobj(table.tableobj);
        if ( options.totals ){
            table.refreshtotals();
        }
    }
    table.sizeheight = function(height){
        //console.log('-------------- table.sizeheight:: height: ' + height);
        table.limity = height;
        var hfixed = 0;
        var h = 0;
        var id = table.id + '_items';
        var form_items = $('#' + id);
        if ( !height ){
            form_items.css({height: 'unset'});
        } else {
            const totals = $('#' + table.id + '_totals');
            if ( options.totals ){
                h = totals.outerHeight(true);
                hfixed += h;
            }
            var add = $('#'+table.id +'_add');
            h = 0;
            if ( add.get(0)){
                h = add.outerHeight(true);
            }
            if ( h ){
                hfixed += h;
            }
            h = height - hfixed;
            form_items.css({height: h + 'px'});
        }
    }
    table.sleep = async function(delay){
        var prom = new Promise((resolve, reject)=>{
            setTimeout(function(){
                resolve();
            }, delay)
        });
        await prom;
    }
    table.sizewidth = function(limit){
        //console.log("TABLE: " + table.id + " ------------");
        table.limitx = limit;
        // The width of the table needs to be limited otherwise in some views it
        // strays outside the form.
        $('#' + table.id).css({width: limit + 'px'});
        table.rowids.forEach(function(rowid, i){
            table.sizerow(rowid, limit);
        });
        var tid = table.id + '_totals';
        table.sizerow(tid, limit);
    }
    table.sizetable = function(width, height){
        //console.log('--------------- sizing table ' + table.id);
        table.sizewidth(width);
        table.sizeheight(height);
    }
    table.recalculate();
    table.showTable();
    if ( options.limitx){
        table.sizewidth(options.limitx);
    }
    return table;
}
function sizetables(width){
    for(var tableid in tableEditor_tables){
        var table = tableEditor_tables[tableid];
        if ( table ){
            table.sizewidth(width);
        }
    }
}
function sizetable(divid, width, height){
    var table = tableEditor_tables[divid];
    if ( table ){
        table.sizetable(width, height);
    }
}
function tablesetattributehelper(divid, helper){
    var table = tableEditor_tables[divid];
    if ( table ){
        table.attributehelper = helper;
    }
}
function tablesettooltips(divid, htool){
    var table = tableEditor_tables[divid];
    if ( table ){
        table.tooltips = htool;
    }
}
function tableaddrow(divid, noshow){
    var table = tableEditor_tables[divid];
    if ( table ){
        table.addrow(noshow);
    }
}