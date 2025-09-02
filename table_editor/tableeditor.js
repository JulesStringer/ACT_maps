var tableEditor_tables = {};
function table_formatDate(d, includehours) {
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
function tableEditor_checkNumber(event) {
    if (event.key >= "0" && event.key <= "9") {
        true;
    } else if (event.key == ".") {
        return true;
    } else if (event.key == "Tab" || event.key == "Enter"
        || event.key == "ArrowUp" || event.key == "ArrowDown" || event.key == "ArrowLeft" || event.key == "ArrowRight"
        || event.key == "Up" || event.key == "Down" || event.key == "Left" || event.key == "Right"
        || event.key == "Backspace" || event.key == "Delete") {
        return true;
    } else {
        event.preventDefault();
    }
    return false;
}
function tableEditor_keyup(event, tableid, rowid, colid) {
    tableEditor_tables[tableid].keyup(event, rowid, colid);
}
function tableEditor_keydown(event, tableid, rowid, colid) {
    tableEditor_tables[tableid].keydown(event, rowid, colid);
}
function tableEditor_onchange(tableid, rowid, colid) {
    tableEditor_tables[tableid].onchange(rowid, colid);
}
function tableEditor_ondelete(tableid, rowid) {
    tableEditor_tables[tableid].ondelete(rowid);
}
function tableEditor_onfocus(tableid, rowid, colid) {
    tableEditor_tables[tableid].onfocus(rowid, colid);
}
function tableEditor_onfocusout(tableid, rowid, colid) {
    tableEditor_tables[tableid].onfocusout(rowid, colid);
}
function tableEditor_on_click(tableid, rowid, colid) {
    tableEditor_tables[tableid].on_click(rowid, colid);
}
function tableEditor_addrow(tableid, noshow){
    tableEditor_tables[tableid].addrow(noshow);
}
function tableEditor_contextmenu(tableid,rowid,colid){
    var table = tableEditor_tables[tableid];
    if ( table.contextmenu ){
        table.contextmenu(rowid,colid);
    }
}
function createTableEditor(tableid, tableobj, columnspecs, saveobj, options, show) {
    var table = { id: tableid, tableobj: tableobj, columnspecs: columnspecs, saveobj: saveobj, rowids: [], colids: [] };
    tableEditor_tables[tableid] = table;
    applytooltips(tableid, columnspecs);
    table.cellkey = function (rowid, colid) {
        return table.id + '_' + rowid + '_' + colid;
    }
    table.findrow = function (rowid, offset) {
        var keys = table.rowids;
        var n;
        var nkey = -1;
        for (n = 0; n < keys.length; n++) {
            if (keys[n] == rowid) {
                nkey = n;
            }
        }
        if (nkey >= 0) {
            nkey = nkey + offset;
            if (nkey >= 0 && nkey < keys.length) {
                return keys[nkey];
            }
        }
        return rowid;
    }
    table.isInput = function (rowid, colid) {
        var column = columnspecs[colid];
        if (column &&
            (column.type == 'text' || column.type == 'select' || column.type.startsWith('date'))) {
            if (column.calculate) {
                return false;
            } else {
                if (column.enabled) {
                    var rowobj = tableobj[rowid];
                    return column.enabled(rowobj);
                } else {
                    return true;
                }
            }
        }
        return false;
    }
    table.findcolumn = function (colid, offset, rowid) {
        var keys = table.colids;
        var n;
        var nkey = -1;
        for (n = 0; n < keys.length; n++) {
            if (keys[n] == colid) {
                nkey = n;
            }
        }
        if (nkey >= 0) {
            // TODO make this skip non input fields
            while (offset != 0) {
                nkey += (offset > 0 ) ? 1 : -1;
                if ( table.isInput( rowid, colid ) ){
                    offset += (offset > 0) ? -1 : 1;
                    if (nkey >= 0 && nkey < keys.length) {
                        return keys[nkey];
                    }
                }
            }
        }
        return colid;
    }
    table.keydown = function (event, rowid, colid) {
        var column = table.columnspecs[colid];
        switch (event.key) {
            case 'Up':
            case 'ArrowUp':
                var pos = event.target.selectionStart;
                var newid = table.findrow(rowid, -1);
                var ctrl = jQuery('#' + table.cellkey(newid, colid));
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
                var ctrl = jQuery('#' + table.cellkey(newid, colid));
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
                        var ctrl = jQuery('#' + table.cellkey(rowid, newid));
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
                var ctrl = jQuery('#' + table.cellkey(rowid, colid));
                str = ctrl.val();
                if (str.length == event.target.selectionStart) {
                    var newid = table.findcolumn(colid, 1, rowid);
                    if (newid != colid) {
                        var ctrl = jQuery('#' + table.cellkey(rowid, newid));
                        ctrl.focus();
                        var newcolumn = table.columnspecs[newid];
                        if (newcolumn.type.startsWith('text')) {
                            ctrl.get(0).setSelectionRange(0, 0);
                        }
                        event.preventDefault();
                    }
                }
                break;
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
                if ( table.columnspecs[colid].preventKey) {
                    if ( table.columnspecs[colid].preventKey(event.key)){
                        event.preventDefault();
                    }
                }
                break;
        }
    }
    table.keyup = function (event, rowid, colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc.type != 'date') {
            table.onchange(rowid, colid);
        }
    }
    table.on_click = function (rowid, colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc.type == 'button') {
            var rowobj = table.tableobj[rowid];
            if (rowobj || coldesc.allowinsert) {
                if (coldesc.on_click) {
                    coldesc.on_click(rowobj);
                } else {
                    alert('Missing onbutton function ' + colid);
                }
            }
        }
    }
    table.onfocus = function (rowid, colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc.type != 'date') {
            //jQuery('.datepicker').datepicker('hide');
        } else {
            var cell = jQuery('#' + table.cellkey(rowid, colid));
            var d = cell.datepicker('getDate');
            if (!d) {
                d = new Date();
                cell.datepicker('setDate', d);
            }
            cell.datepicker('show');
        }
        if (coldesc.onfocus) {
            coldesc.onfocus(rowid);
        }
    }
    table.onfocusout = function (rowid, colid) {
        var coldesc = table.columnspecs[colid];
        // Make sure any entries are saved
//       var value = jQuery('#' + table.cellkey(rowid, colid)).val();
        if (coldesc.type != 'date') {
            table.onchange(rowid, colid);
        } else {
            var cell = jQuery('#' + table.cellkey(rowid, colid));
            cell.datepicker('hide');
        }
    }
    table.ondelete = function (rowid) {
        if (table.tableobj[rowid]) {
            if (options.ondelete) {
                options.ondelete(rowid);
            }
            delete table.tableobj[rowid];
            table.saveobj(table.tableobj);
            table.showTable();
        }
    }
    table.oncontextmenu = function (rowid, colid) {
        // TODO show menu - this probably isn't a good idea because:
        // supporting Menuitem element is deprecated by MOzilla and only implemented in Firefox
        // an implementation would replace the standard context menu
    }
    table.totalcolumn = function (colid) {
        var t = 0;
        var ids = Object.keys(table.tableobj);
        ids.forEach(function (id, i) {
            var o = table.tableobj[id];
            var v = o[colid];
            if (v !== null && v !== undefined && !Number.isNaN(v)) {
                t += v;
            }
        });
        return t;
    }
    table.hastotal = function (colid) {
        var r = false;
        if (options.totals) {
            options.totals.forEach(function (t, i) {
                if (t == colid) {
                    r = true;
                }
            });
        }
        return r;
    }
    table.enableCell = function (rowid, colid) {
        var column = table.columnspecs[colid];
        if (column.enabled) {
            var rowobj = table.tableobj[rowid];
            var en = column.enabled(rowobj, rowid);
            var cell = jQuery('#' + table.cellkey(rowid, colid));
            if (en === 'readonly') {
                cell.prop('disabled', true);
            } else if (en) {
                cell.prop('disabled', false);
                cell.css({ visibility: 'visible' });
            } else {
                cell.prop('disabled', true);
                cell.css({ visibility: 'hidden' });
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
    table.onchange = function (rowid, colid) {
        var rowobj = table.tableobj[rowid];
        var newrow = false;
        if (!rowobj) {
            rowobj = {};
            newrow = true;
        }
        var coldesc = table.columnspecs[colid];
        var value = null;
        if (coldesc.type === 'check') {
            var checked = jQuery('#' + table.cellkey(rowid, colid)).get(0).checked;
            if (checked) {
                value = true;
                rowobj[colid] = true;
            } else {
                value = false;
                rowobj[colid] = false;
            }
        } else if (coldesc.type === 'date') {
            value = jQuery('#' + table.cellkey(rowid, colid)).datepicker('getDate');
            if (value && typeof (value) === 'object') {
                value = table_formatDate(value);
                rowobj[colid] = value;
            } else {
                rowobj[colid] = null;
            }
        } else {
            value = jQuery('#' + table.cellkey(rowid, colid)).val();
            if (value && value.length > 0) {
                if (coldesc.checkNumber) {
                    value = Number(value);
                }
                rowobj[colid] = value;
            } else {
                rowobj[colid] = null;
            }
        }
        if (table.hastotal(colid)) {
            var t = table.totalcolumn(colid);
            if (coldesc.format) {
                t = coldesc.format(t);
            }
            jQuery('#' + table.cellkey('total', colid)).text(t);
        }
        if (coldesc.onchange) {
            // Allow change to proliferate
            coldesc.onchange(value, table, rowobj, rowid);
        }
        // Update calculated fields
        var colkeys = Object.keys(table.columnspecs);
        colkeys.forEach(function (col, i) {
            var column = table.columnspecs[col];
            if (column.calculate) {
                var v = column.calculate(rowobj, rowid);
                if (!Number.isNaN(v)) {
                    if (column.format) {
                        v = column.format(v);
                    }
                }
                if (v && v !== 'NaN') {
                    jQuery('#' + table.cellkey(rowid, col)).html(v);
                } else {
                    jQuery('#' + table.cellkey(rowid, col)).html('');
                }
                if (table.hastotal(col)) {
                    var t = table.totalcolumn(col);
                    if (column.format) {
                        t = column.format(t);
                    }
                    jQuery('#' + table.cellkey('total', col)).text(t);
                }
            }
            // formseditor allows calculated or context sensitive headers aka calculated headers,
            // which may include html coding for things like sub and superscripts.
            if ( typeof(column.header) === 'function'){
                var header = column.header(rowobj);
                jQuery('#header_' + table.cellkey(rowid, col)).html(header);
            }
            if ( column.units && typeof(column.units) === 'object'){ 
                if ( column.units.calculate ){
                    var units = column.units.calculate(rowobj);
                    jQuery('#units_' + table.cellkey(rowid, col)).html(units);
                }
            }
            if (column.enabled) {
                table.enableCell(rowid, col);
            }
            if (column.type === 'select' && column.picklist instanceof Function) {
                var list = column.picklist(rowobj, rowid);
                var options = '';
                if (column.prompt) {
                    options += '<option value="" >' + column.prompt + '</a>';
                }
                if (list) {
                    var v = jQuery('#' + table.cellkey(rowid, col)).val();
                    var keys = Object.keys(list);
                    keys.forEach(function (key, k) {
                        var item = list[key];
                        options += '<option value="' + key + '" ';
                        if (key === v) {
                            options += ' selected ';
                        }
                        options += '> ' + item.name + '</option > ';
                    });
                }
                jQuery('#' + table.cellkey(rowid, col)).html(options);
            }
        });
        if (coldesc.type === 'datetime-local' && newrow) {
            var ar = value.split(':');
            if (ar.length < 2) {
                newrow = false;
            } else {
                table.tableobj[rowid] = rowobj;
                table.saveobj(table.tableobj);
            }
        }else if (coldesc.type === 'datetime-local' && newrow) {
            // Stop entry of first digit in year from moving on to next field
            var ar = value.split('-');
            var y = 0;
            if (ar.length >= 2) {
                y = parseInt(ar[0]);
            }
            if (ar.length < 2 || y < 1000) {
                newrow = false;
            } else {
                table.tableobj[rowid] = rowobj;
                table.saveobj(table.tableobj);
            }
        } else if ( coldesc.type === "date" && newrow){
            if (value) {
                table.tableobj[rowid] = rowobj;
                table.saveobj(table.tableobj);
            } else {
                newrow = false;
            }
        } else {
            table.tableobj[rowid] = rowobj;
            table.saveobj(table.tableobj);
        }
        if (newrow && options && options.rowlimit) {
            var rows = Object.keys(table.tableobj);
            if (rows.length >= options.rowlimit) {
                newrow = false;
            }
        }
        if (newrow) {
            if (options.totals) {
                var id = parseInt(rowid) + 1;
                var r = table.formRow(id, null);
                jQuery(r).insertBefore('#' + tableid + '_totals');
            } else {
                var id = parseInt(rowid) + 1;
                var r = table.formRow(id, null);
                jQuery('#' + tableid).append(r);
            }
        }
    }
    table.formRow = function(rowid, rowobj){
        var body = '<tr id="' + rowid + '" >';
        var colkeys = Object.keys(table.columnspecs);
        var deletebutton = true;
        if (options.nodelete || (rowobj && rowobj._nodelete)) {
            deletebutton = false;
        }
        colkeys.forEach(function (colid, i) {
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
            if (column.calculate) {
                body += '<td id="' + table.cellkey(rowid, colid) + '" ';
                if (column.width) {
                    body += 'style="width:' + column.width + ';"';
                }
                body += '>';
                var v = column.calculate(rowobj, rowid);
                if (v) {
                    if (column.format) {
                        v = column.format(v);
                    }
                    body += v;
                }
            } else if (column.type === 'literal') {
                body += '<td id="' + table.cellkey(rowid, colid) + '" ';
                if (column.width) {
                    body += 'style="width:' + column.width + ';"';
                }
                body += '>';
                if (rowobj && rowobj[colid]) {
                    body += rowobj[colid];
                }
                body += '</td>';
            } else if (column.type === 'tooltip') {
                body += '<td>';
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
                body += '</td>';
            } else if (column.type === 'check') {
                body += '<td><input type="checkbox" id="' + table.cellkey(rowid, colid) + '" ';
                if (rowobj && rowobj[colid] && rowobj[colid] == true) {
                    body += 'checked ';
                }
                body += 'onchange="tableEditor_onchange(' + stargs + ');" ';
                if (column.width) {
                    body += 'style="width:' + column.width + ';"';
                }
                body += '/></td>';
            } else if (column.type === 'button') {
                body += '<td>';
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
                body += '</button>';
                body += '</td>';
            } else {
                body += '<td ';
                if (column.width) {
                    body += 'style="width:' + column.width + ';"';
                }
                body += 'class="input" ';
                body += '>';
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
                    if (column.helperButton) {
                        var ok = true;
                        if (column.helperButton.condition) {
                            ok = column.helperButton.condition(rowid);
                        }
                        if (ok) {
                            body += '<button type="button" onclick="' + column.helperButton.action + '(' + stargs + ');" >';
                            if (column.helperButton.text) {
                                body += column.helperButton.text;
                            }
                            body += '</button>';
                        }
                    }
                    var type = column.type;
                    if (type == 'date') {
                        type = 'text';
                    }
                    body += '<input id="' + table.cellkey(rowid, colid) + '" + type="' + type + '" ';
                    if (column.type === 'date') {
                        body += 'class="datepicker" ';
                    } else {
                        body += 'value = "';
                        if (value) {
                            body += value;
                        }
                        body += '" ';
                    }
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
            }
            body += '</td>';
        });
        if (deletebutton) {
            body += '<td>';
            body += '<button type="button" onclick="tableEditor_ondelete(\'' + table.id + '\',\'' + rowid + '\');" >Delete</button>';
            body += '</td>';
        }
        if (!options.norowid) {
            body += '<td>' + rowid + '</td>';
        }
        body += '</tr>';
        return body;
    }
    table.formHeader = function () {
        // Get column widths from first row of table
        var row = jQuery('#' + tableid).find('tr');
        var widths = [];
        row.children('td').each(function (i, col) {
            var w = jQuery(this).width();
            widths.push(w);
        });
        // Form header
        body = '<tr>';
        var colkeys = Object.keys(table.columnspecs);
        colkeys.forEach(function (key, i) {
            var column = table.columnspecs[key];
            body += '<th ';
            body += 'width="' + widths[i] + '" ';
            body += '>';
            if (column.header) {
                if (column.tooltip) {
                    body += '<span class="tooltip">';
                }
                body += column.header;
                if (column.tooltip) {
                    body += '<span class="tooltiptext" ';
                    if (column.tooltip.style) {
                        body += 'style="' + column.tooltip.style + '" ';
                    }
                    body += '>';
                    body += column.tooltip.text + '</span > ';
                    body += '</span>';
                }
            }
            body += '</th>';
        });
        // Allow for Delete button and id column
        if (!options.nodelete) {
            body += '<td style="width:50px;"></td>';
        }
        if (!options.norowid) {
            body += '<td></td>';
        }
        body += '</tr>';
        return body;
    }
    table.showHeader = function () {
        var body = table.formHeader();
        jQuery('#' + options.headerdiv).html(body);
    }
    table.addrow = function (noshow) {
        nextrow = 1;
        var rowkeys = Object.keys(table.tableobj);
        rowkeys.forEach(function (rowid, i) {
            var n = parseInt(rowid);
            if (n + 1 > nextrow) {
                nextrow = n + 1;
            }
        });
        var row = {};
        table.tableobj[nextrow] = row;
        if (!noshow) {
            table.showTable();
        }
    }
    table.showTable = function () {
        jQuery('#' + table.id).html('');
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
        if (!options.noheader) {
            body = table.formHeader();
        }
        var nextrow = 0;
        var rowcount = 0;
        if (table.tableobj) {
            var rowkeys = Object.keys(table.tableobj);
            rowkeys.forEach(function (rowid, i) {
                table.rowids.push(rowid);
                var rowobj = table.tableobj[rowid];
                body += table.formRow(rowid, rowobj);
                var n = parseInt(rowid);
                if (n + 1 > nextrow) {
                    nextrow = n + 1;
                }
                rowcount++;
            });
        }
        var rowlimit = null;
        if (options) {
            rowlimit = options.rowlimit;
        }
        if (!rowlimit || rowcount < rowlimit) {
            body += table.formRow(nextrow, null);
            table.rowids.push(nextrow);
        }
        if (options.totals) {
            body += '<tr id="' + tableid + '_totals">';
            colkeys.forEach(function (colid, i) {
                body += '<td id="' + table.cellkey('total',colid) + '">';
                if (i === 0) {
                    body += 'Totals ';
                }
                options.totals.forEach(function (tot, j) {
                    if (tot === colid) {
                        var t = table.totalcolumn(colid);
                        var column = table.columnspecs[colid];
                        if (column.format) {
                            t = column.format(t);
                        }
                        body += t;
                    }
                });
                body += '</td>';
            });
            body += '</tr>';
        }
        if (options.bodyheight) {
            body += '</div>';
        }
        jQuery('#' + table.id).html(body);
        jQuery('.datepicker').each(function(index, subelement){
            let el = jQuery(subelement);
            el.datepicker("option", "dateFormat", "dd/mm/yy");
        });
        // Enable and columns whose enable status is data dependent
        colkeys.forEach(function (colid, i) {
            var column = table.columnspecs[colid];
            if (column.enabled) {
                // Calculate for each row
                if (table.tableobj) {
                    table.rowids.forEach(function (rowid, j) {
                        table.enableCell(rowid, colid);
                    });
                }
            }
            if (column.type === 'date') {
                if (table.tableobj) {
                    table.rowids.forEach(function (rowid, j) {
                        var rowobj = table.tableobj[rowid];
                        if (rowobj && rowobj[colid]) {
                            var v = rowobj[colid];
                            var d = new Date(rowobj[colid]);
                            if (!rowobj[colid]) {
                                d = new Date();
                            }
                            jQuery('#' + table.cellkey(rowid, colid)).datepicker("setDate", d);
                        }
                    });
                }
            }
            if (column.type === 'datetime-local') {
                if (table.tableobj) {
                    table.rowids.forEach(function (rowid, j) {
                        var rowobj = table.tableobj[rowid];
                        if (rowobj && rowobj[colid]) {
                            var v = rowobj[colid];
                            var d = new Date(rowobj[colid]);
                            if (!rowobj[colid]) {
                                d = new Date();
                            }
                            var t = d.getTime() - d.getTimezoneOffset()*60*1000;
                            d = new Date(t);
                            var dstr = d.toISOString().slice(0,19);
                            jQuery('#' + table.cellkey(rowid, colid)).val(dstr);
                        }
                    });
                }
            }
        });
    }
    table.setValue = function (rowid, colid, value) {
        var column = table.columnspecs[colid];
        if (column) {
            if (column.type === 'date') {
                var d = new Date(value);
                jQuery('#' + table.cellkey(rowid, colid)).datepicker("setDate", d);
                table.onchange(rowid, colid);
            } else if (column.calculate) {
                if (column.format) {
                    value = column.format(value);
                }
                jQuery('#' + table.cellkey(rowid, colid)).text(value);
            } else {
                jQuery('#' + table.cellkey(rowid, colid)).val(value);
                table.onchange(rowid, colid);
            }
            if (table.hastotal(colid)) {
                var t = table.totalcolumn(colid);
                if (column.format) {
                    t = column.format(t);
                }
                jQuery('#' + table.cellkey('total', colid)).text(t);
            }
        } else {
            var rowobj = table.tableobj[rowid];
            if (rowobj) {
                rowobj[colid] = value;
                table.saveobj(table.tableobj);
            }
        }
    }
    table.recalculate = function () {
        var colkeys = Object.keys(table.columnspecs);
        if (table.tableobj) {
            var rowkeys = Object.keys(table.tableobj);
            rowkeys.forEach(function (rowid, i) {
                var rowobj = table.tableobj[rowid];
                colkeys.forEach(function (colid, j) {
                    var column = table.columnspecs[colid];
                    /*
                    if (column.calculate) {
                        var v = column.calculate(rowobj, rowid);
                        if (!Number.isNaN(v)) {
                            if (column.format) {
                                v = column.format(v);
                            }
                        }
                        if (v && v != 'NaN') {
                            jQuery('#' + table.cellkey(rowid, col)).html(v);
                        } else {
                            jQuery('#' + table.cellkey(rowid, col)).html('');
                        }
                        if (table.hastotal(col)) {
                            var t = table.totalcolumn(col);
                            if (column.format) {
                                t = column.format(t);
                            }
                            jQuery('#' + table.cellkey('total', col)).text(t);
                        }
                    }
                    */
                });
            });
        }
    }
    if ( show ){
        table.recalculate();
        table.showTable();
    }
    if (options.headerdiv) {
        table.showHeader();
    }
    return table;
}

function Area(obj) {
    var keys = Object.keys(obj);
    var a = 0;
    keys.forEach(function (k, i) {
        var x = obj[k];
        if (x.area) {
            a += x.area;
        }
    });
    return a;
}
function formatnumber(number, decimals, commas) {
    if (decimals > 0) {
        var div = 1;
        while (decimals > 0) {
            div *= 10;
            decimals--;
        }
        number = Math.round(number * div) / div;
    } else {
        number = Math.round(number);
    }
    if (commas) {
        return number.toLocaleString();
    } else {
        return number.toString();
    }
}
