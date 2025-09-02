function columntotal(rows, colid) {
    var total = 0;
    for (const rowid in rows) {
        var row = rows[rowid];
        if (row[colid] && !isNaN(row[colid])) {
            total += parseFloat(row[colid]);
        }
    }
//    total = formatnumber(total, 2, false);
    return total;
}
function formtablefromcolumnspecs(divid, rows, columnspecs, totals) {
    var body = '<tr>';
    for (const key in columnspecs) {
        var col = columnspecs[key];
        body += '<th>';
        body += col.header;
        body += '</th>';
    }
    body += '</tr>';
    for (const rowid in rows) {
        body += '<tr>';
        var rowobj = rows[rowid];
        for (const colid in columnspecs) {
            var col = columnspecs[colid];
            body += '<td>';
            var val = rowobj[colid];
            if (col.calculate) {
                var val = col.calculate(rowobj, rowid);
                if (col.format) {
                    val = col.format(val);
                }
                body += val;
            } else if (col.picklist) {
                var list = col.picklist;
                if (typeof (col.picklist) == 'function') {
                    list = col.picklist(rowobj);
                }
                //if (list) {
                    var o = list[val];
                    if (o) {
                        body += o.name;
                    }
                //} else {
                //    body += val;
                //}
            } else if (val) {
                body += val;
            }
            body += '</td>';
        }
        body += '</tr>';
    }
    body += '<tr>';
    for (const colid in columnspecs) {
        body += '<td>';
        if (colid == 'name') {
            body += 'Totals';
        } else {
            var hastotal = false;
            for (const total of totals) {
                if (total === colid) {
                    hastotal = true;
                }
            }
            if (hastotal) {
                var v = columntotal(rows, colid);
                body += formatnumber(v, 2, false);
            }
        }
        body += '</td>';
    }
    body += '</tr>';
    $('#' + divid).html(body);
    var table = {
        totalcolumn: function (colid) {
            return columntotal(this.rows, colid);
        },
        rows: rows
    }
    return table;
}
function formnamevaluefromcolumnspecs(divid, row, columnspecs) {
    var body = '';
    for (const colid in columnspecs) {
        var col = columnspecs[colid];
        body += '<tr>';
        body += '<td>' + col.header + '</td>';
        body += '<td>';
        var val = row[colid];
        if (col.calculate) {
            var val = col.calculate(row);
            if (col.format) {
                val = col.format(val);
            }
            body += val;
        } else if (col.picklist) {
            var o = col.picklist[val];
            if (o) {
                body += val;
            }
        } else if (val) {
            body += val;
        }
        body += '</td>';
        body += '<td>';
        if (col.units) {
            body += col.units;
        }
        body += '</td>';
        body += '</tr>';
    }
    $('#' + divid).html(body);
}
