// Name value table editor
var namevalueEditor_tables = {};
function namevalue_formatDate(d, includehours) {
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

function namevalueEditor_checkNumber(event) {
    if (event.key >= "0" && event.key <= "9") {
        true;
    } else if (event.key == ".") {
        return true;
    } else if (event.key == '-') {
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
function namevalueEditor_keyup(event, tableid, colid) {
    namevalueEditor_tables[tableid].keyup(event, colid);
}
function namevalueEditor_keydown(event, tableid, colid) {
    namevalueEditor_tables[tableid].keydown(event, colid);
}
function namevalueEditor_takeydown(event, tableid, colid) {
    namevalueEditor_tables[tableid].takeydown(event, colid);
}
function namevalueEditor_onchange(tableid, colid) {
    namevalueEditor_tables[tableid].onchange(colid);
}
function namevalueEditor_onfocus(tableid, colid) {
    namevalueEditor_tables[tableid].onfocus(colid);
}
function namevalueEditor_onfocusout(tableid, colid) {
    namevalueEditor_tables[tableid].onfocusout(colid);
}

function createNameValueEditor(tableid, rowobj, rowid, columnspecs, saveobj, options) {
    var table = {
        id: tableid, rowobj: rowobj, rowid: rowid, columnspecs: columnspecs, saveobj: saveobj, colids: [],
        widths: [200, 200, 80, 10]
    };
    if (options && options.rowid) {
        table.rowid = options.rowid;
    }
    if (options && options.widths) {
        var i;
        for (i = 0; i < 4 && i < options.widths.length; i++) {
            table.widths[i] = options.widths[i];
        }
    }
    table.colids = Object.keys(columnspecs);
    applytooltips(tableid, columnspecs);
    namevalueEditor_tables[tableid] = table;
    table.cellkey = function (colid) {
        return table.id + '_' + colid;
    }
    table.rowkey = function (colid) {
        return table.id + '_row_' + colid;
    }
    table.isInput = function (colid) {
        var column = columnspecs[colid];
        if (column &&
            (column.type == 'text' || column.type == 'select' || column.type.startsWith('date') ||
             column.type == 'textarea')) {
            if (column.calculate) {
                return false;
            } else {
                if (column.enabled) {
                    return column.enabled(rowobj);
                } else {
                    return true;
                }
            }
        }
        return false;
    }
    table.findcolumn = function (colid, offset) {
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
                nkey += (offset > 0) ? 1 : -1;
                if (table.isInput(colid)) {
                    offset += (offset > 0) ? -1 : 1;
                    if (nkey >= 0 && nkey < keys.length) {
                        return keys[nkey];
                    }
                }
            }
        }
        return colid;
    }
    table.keydown = function (event, colid) {
        var column = table.columnspecs[colid];
        switch (event.key) {
            case 'Up':
            case 'ArrowUp':
                var pos = event.target.selectionStart;
                var newid = table.findcolumn(colid, -1);
                var ctrl = jQuery('#' + table.cellkey(newid));
                ctrl.focus();
                if (column.type.startsWith('text')) {
                    ctrl.get(0).setSelectionRange(pos, pos);
                }
                event.preventDefault();
                break;
            case 'Down':
            case 'ArrowDown':
                var pos = event.target.selectionStart;
                var newid = table.findcolumn(colid, 1);
                var ctrl = jQuery('#' + table.cellkey(newid));
                ctrl.focus();
                if (column.type.startsWith('text')) {
                    ctrl.get(0).setSelectionRange(pos, pos);
                }
                event.preventDefault();
                break;
            case 'Left':
            case 'ArrowLeft':
                // Should only do this if already at 0 when left pressed.
                if (event.target.selectionStart == 0) {
                    event.preventDefault();
                }
                break;
            case 'Right':
            case 'ArrowRight':
                var ctrl = jQuery('#' + table.cellkey(colid));
                str = ctrl.val();
                if (str.length == event.target.selectionStart) {
                    event.preventDefault();
                }
                break;
            case "Tab":
            case "Enter":
            //            case "ArrowUp":
            //            case "ArrowDown":
            //            case "Up":
            //            case "Down":
            case "Backspace":
            case "Delete":
                break;
            default:
                if (table.columnspecs[colid].checkNumber) {
                    if ((event.key < "0" || event.key > "9") && event.key != "." && event.key != "-") {
                        event.preventDefault();
                    }
                }
                break;
        }
    }
    table.takeydown = function (event, colid) {
        var column = table.columnspecs[colid];
        switch (event.key) {
            case 'Up':
            case 'ArrowUp':
                var pos = event.target.selectionStart;
                var ctrl = jQuery('#' + table.cellkey(colid));
                var v = ctrl.val();
                var ipos = v.indexOf('\n');
                if (ipos > pos || ipos < 0) {
                    var newid = table.findcolumn(colid, -1);
                    var ctrl = jQuery('#' + table.cellkey(newid));
                    ctrl.focus();
                    if (column.type.startsWith('text')) {
                        ctrl.get(0).setSelectionRange(pos, pos);
                    }
                    event.preventDefault();
                }
                break;
            case 'Down':
            case 'ArrowDown':
                var pos = event.target.selectionStart;
                var ctrl = jQuery('#' + table.cellkey(colid));
                var v = ctrl.val();
                var ipos = v.lastIndexOf('\n');
                if (ipos < pos) {
                    var newid = table.findcolumn(colid, 1);
                    var ctrl = jQuery('#' + table.cellkey(newid));
                    ctrl.focus();
                    if (column.type.startsWith('text')) {
                        ctrl.get(0).setSelectionRange(pos, pos);
                    }
                    event.preventDefault();
                }
                break;
            case 'Left':
            case 'ArrowLeft':
                // Should only do this if already at 0 when left pressed.
                if (event.target.selectionStart == 0) {
                    event.preventDefault();
                }
                break;
            case 'Right':
            case 'ArrowRight':
                var ctrl = jQuery('#' + table.cellkey(colid));
                str = ctrl.val();
                if (str.length == event.target.selectionStart) {
                    event.preventDefault();
                }
                break;
        }
    }
    table.keyup = function (event, colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc.type != 'date') {
            table.onchange(colid);
        }
    }
    table.onfocus = function (colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc.type != 'date') {
            //jQuery('.datepicker').datepicker('hide');
        } else {
            var cell = jQuery('#' + table.cellkey(colid));
            var d = cell.datepicker('getDate');
            if (!d) {
                d = new Date();
                cell.datepicker('setDate', d);
            }
            cell.datepicker('show');
        }
        if (coldesc.onfocus) {
            coldesc.onfocus(null,colid);
        }
    }
    table.onfocusout = function (colid) {
        var coldesc = table.columnspecs[colid];
        // Make sure any entries are saved
//       var value = jQuery('#' + table.cellkey(rowid, colid)).val();
        if (coldesc.type != 'date') {
            table.onchange(colid);
        } else {
            var cell = jQuery('#' + table.cellkey(colid));
            cell.datepicker('hide');
        }
    }
    table.oncontextmenu = function (dummy, colid) {
        // TODO show menu
    }
    table.enableCell = function (dummy, colid) {
        var column = table.columnspecs[colid];
        if (column && column.enabled) {
            var en = column.enabled(table.rowobj);
            var row = jQuery('#' + table.rowkey(colid));
            if (en) {
                row.show();
            } else {
                row.hide();
            }
       }
    }
    table.onchange = function (colid) {
        var coldesc = table.columnspecs[colid];
        if (coldesc) {
            var value = null;
            if (coldesc.type == 'date') {
                value = jQuery('#' + table.cellkey(colid)).datepicker('getDate');
                if (value && typeof (value) == 'object') {
                    value = namevalue_formatDate(value);
                }
            } else if (coldesc.type == 'checkbox') {
                value = jQuery('#' + table.cellkey(colid)).is(':checked') ? '1' : '0';
            } else {
                value = jQuery('#' + table.cellkey(colid)).val();
            }
            if (value && value.length > 0) {
                if (coldesc.checkNumber) {
                    value = Number(value);
                }
                rowobj[colid] = value;
            } else {
                rowobj[colid] = null;
            }
            if (coldesc.onchange) {
                // Allow change to proliferate
                coldesc.onchange(value, table, rowobj, null);
            }
        }
        // Update calculated fields
        var colkeys = Object.keys(table.columnspecs);
        colkeys.forEach(function (col, i) {
            var column = table.columnspecs[col];
            if (column.calculate) {
                var v = column.calculate(rowobj);
                if (column.format) {
                    v = column.format(v);
                }
                if (v && v != 'NaN') {
                    jQuery('#' + table.cellkey(col)).html(v);
                } else {
                    jQuery('#' + table.cellkey(col)).html('');
                }
            }
            if (column.enabled) {
                table.enableCell(null,col);
            }
            if (column.type == 'select' && column.picklist instanceof Function) {
                var list = column.picklist(rowobj, table.rowid);
                var options = '';
                if (column.prompt) {
                    options += '<option value="" >' + column.prompt + '</a>';
                }
                if (list) {
                    var v = jQuery('#' + table.cellkey(col)).val();
                    var keys = Object.keys(list);
                    keys.forEach(function (key, k) {
                        var item = list[key];
                        options += '<option value="' + key + '" ';
                        if (key == v) {
                            options += ' selected ';
                        }
                        options += '> ' + item.name + '</option > ';
                    });
                }
                jQuery('#' + table.cellkey(col)).html(options);
            }
        });
        table.saveobj(rowobj);
    }
    table.formCell = function (rowobj, colid) {
        var body = '';
        var column = table.columnspecs[colid];
        var value = '';
        if (rowobj && rowobj[colid] != null) {
            value = rowobj[colid];
        } else if (column.default) {
            value = column.default();
            if (rowobj) {
                rowobj[colid] = value;
            }
        }
        if (column.calculate) {
            body += '<td id="' + table.cellkey(colid) + '" style="width:' + table.widths[1] + 'px;" >';
            var v = column.calculate(rowobj);
            if (v != null) {
                if (column.format) {
                    v = column.format(v);
                }
                body += v;
            }
        } else if (column.type == 'divide') {
            body += '<td class="divide" ';
            if (column.height) {
                body += 'style="height:' + column.height;
                body += ';width:' + table.widths[1] + 'px;"';
            }
            body += '></td>';
        } else if (column.type == 'literal') {
            body += '<td id="' + table.cellkey(colid);
            body += '" style="width:' + table.widths[1] + 'px;" >';
            if (rowobj && rowobj[colid]) {
                body += rowobj[colid];
            }
        } else {
            var stargs = '\'' + table.id + '\',\'' + colid + '\'';
            body += '<td class="input" style="width:' + table.widths[1] + 'px;" >';
            if (column.picklist) {
                var list = column.picklist;
                if (column.type == 'select' && list instanceof Function) {
                    list = column.picklist(rowobj, table.rowid);
                }
                if (list || column.prompt) {
                    body += '<select id="' + table.cellkey(colid) + '" ';
                    body += 'onchange="namevalueEditor_onchange(' + stargs + ');" ';
                    if (column.onfocus) {
                        body += 'onfocus="namevalueEditor_onfocus(' + stargs + ');" ';
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
                                    if (v == key) {
                                        used = true;
                                    }
                                });
                            }
                            body += '<option value="' + key + '"';
                            if (value.length > 0) {
                                if (key == value) {
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
            } else if (column.type == 'textarea') {
                body += '<textarea id="' + table.cellkey(colid) + '" ';
                body += 'onchange="namevalueEditor_onchange(' + stargs + ');" ';
                body += 'onfocus="namevalueEditor_onfocus(' + stargs + ');" ';
                body += 'onfocusout="namevalueEditor_onfocusout(' + stargs + ');" ';
                body += 'onkeydown="namevalueEditor_takeydown(event, ' + stargs + ');" ';
                body += 'onkeyup="namevalueEditor_keyup(event, ' + stargs + ');" ';
                if (column.cols) {
                    body += 'cols="' + column.cols + '" ';
                }
                if (column.rows) {
                    body += 'rows="' + column.rows + '" ';
                }
                body += '>' + value + '</textarea>';
            } else {
                if (column.helperButton) {
                    var ok = true;
                    if (column.helperButton.condition) {
                        ok = column.helperButton.condition(table.rowid);
                    }
                    if (ok) {
                        body += '<button type="button" onclick="' + column.helperButton.action + '(' + stargs + ');" >';
                        if (column.helperButton.text) {
                            body += column.helperButton.text;
                        }
                        body += '</button>';
                    }
                }
                // TODO onfocus(stdargs);
                var type = column.type;
                if (type == 'date') {
                    type = 'text';
                }
                body += '<input id="' + table.cellkey(colid) + '" + type="' + type + '" ';
                if (column.type == 'date') {
                    body += 'class="datepicker" ';
                } else if (column.type == 'checkbox') {
                    if (value) {
                        body += 'checked ';
                    }
                } else {
                    body += 'value = "' + value + '" ';
                }
                body += 'onchange="namevalueEditor_onchange(' + stargs + ');" ';
                body += 'autocomplete="off" ';
                body += 'onkeydown="namevalueEditor_keydown(event, ' + stargs + ');" ';
                body += 'onkeyup="namevalueEditor_keyup(event, ' + stargs + ');" ';
                if (column.size) {
                    body += 'size="' + column.size + '" ';
                }
                body += 'onfocus="namevalueEditor_onfocus(' + stargs + ');" ';
                body += ' />';
            }
        }
        body += '</td>';
        body += '<td style="width:' + table.widths[2] + 'px;"';
        if (column.type == 'divide') {
            body += 'class="divide" ';
        }
        body += '>';
        if (column.units) {
            body += column.units;
        }
        body += '</td>';
        body += '<td style="width:' + table.widths[3] + 'px;"';
        if (column.type == 'divide') {
            body += 'class="divide" ';
        }
        body += '>';
        if (column.tooltip) {
            body += ' <span class="tooltip" >';
            body += '?';
            body += '<span class="tooltiptext" ';
            if (column.tooltip.style) {
                body += 'style="' + column.tooltip.style + '" ';
            }
            body += '>' + column.tooltip.text + '</span>';
            body += '</span>';
        }
        body += '</td>';
        return body;
    }
    table.showTable = function () {
        table.colids = [];
        var body = '<table>';
        var colkeys = Object.keys(table.columnspecs);
        colkeys.forEach(function (key, i) {
            var column = table.columnspecs[key];
            body += '<tr id="' + table.rowkey(key) + '" ';
            if (column.type == 'divide') {
                body += 'class="divide" ';
            }
            body += '>';
            if (column.type == 'heading') {
                body += '<th colspan=4 >' + column.header + '</th>';
            } else if (column.type == 'divide') {
                body += '<td class="divide" colspan=4 ';
                if (column.height) {
                    body += 'style="height:' + column.height + '"';
                }
                body += '></td>';
            } else {
                body += '<td style="width:' + table.widths[0] + 'px;" >';
                if (column.header) {
                    body += column.header;
                }
                if (!column.calculate) {
                    table.colids.push(key);
                }
                body += '</td>';
                body += table.formCell(table.rowobj, key);
            }
            body += '</tr>';
        });
        body += '</table>';

        jQuery('#' + table.id).html(body);
        jQuery('.datepicker').each(function(index, subelement){
            let el = jQuery(subelement);
            el.datepicker("option", "dateFormat", "dd/mm/yy");
        });
        // Enable and columns whose enable status is data dependent
        colkeys.forEach(function (colid, i) {
            var column = table.columnspecs[colid];
            if (column.enabled) {
                table.enableCell(null,colid);
            }
            if (column.type == 'date') {
                if (table.rowobj) {
                    var v = table.rowobj[colid];
                    var d = new Date(rowobj[colid]);
                    jQuery('#' + table.cellkey(colid)).datepicker("setDate", d);
                }
            }
        });
    }
    table.setValue = function (colid, value) {
        var column = table.columnspecs[colid];
        if (column.type == 'date') {
            var d = new Date(value);
            jQuery('#' + table.cellkey(colid)).datepicker("setDate", d);
        } else if (column.calculate) {
            if (column.format) {
                value = column.format(value);
            }
            jQuery('#' + table.cellkey(colid)).text(value);
        } else {
            jQuery('#' + table.cellkey(colid)).val(value);
        }
    }
    table.recalculate = function () {
        var colkeys = Object.keys(table.columnspecs);
        if (table.rowobj) {
            colkeys.forEach(function (colid, j) {
                var column = table.columnspecs[colid];
                if (column.calculate) {
                    var v = column.calculate(table.rowobj);
                }
            });
        }
    }
    table.recalculate();
    table.showTable();
    return table;
}
