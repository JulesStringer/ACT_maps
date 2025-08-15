// JavaScript source code
var edata = {
    data: null,
    file: null
};
function getTableData(file, options, callback) {
    var url = file;
    $.ajax({
        url: url,
        method: 'get',
        dataType: 'json',
        processData: true,
        contentType: 'application/json',
        success: function (data) {
            edata.file = file;
            edata.data = data;
            callback(options, data)
        },
        error: function (err) {
            if (err.status == 404) {
                alert("404 " + url + " not found");
            } else {
                alert(JSON.stringify(err));
            }
        }
    });
}
function formatNumber(value) {
    if (value >= 1000 || value <= -1000) {
        value = Math.round(value);
    } else if (value >= 100 || value <= -100) {
        value = Math.round(value * 10) / 10;
    } else if (value >= 10 || value <= -10) {
        value = Math.round(value * 100) / 100;
    } else if (value >= 1 || value <= -1) {
        value = Math.round(value * 1000) / 1000;
    } else {
        value = Math.round(value * 10000) / 10000;
    }
    return value;
}
function filterRow(drow, filter) {
    var result = true;
    if (filter) {
        var keys = Object.keys(filter);
        keys.forEach(function (key, j) {
            if (drow[key] != filter[key]) {
                result = false;
            }
        });
    }
    return result;
}
function populateTable(options) {
    // extract relevant matrix
    var tableData = [];
    var cols = edata.data[options.colvar];
    if (options.cols) {
        cols = options.cols;
    }
    groups = [];
    colh = [];
    var hasgroups = false;
    cols.forEach(function (col, i) {
        if ($.isPlainObject(col)) {
            hasgroups = true;
        }
    });
    var tbody = "";
    if (hasgroups) {
        tbody += '<tr><th style="border-bottom: none;"></th>';
        cols.forEach(function (col, i) {
            if (col != 'Total') {
                var col2 = col;
                if ($.isPlainObject(col)) {
                    tbody += '<th colspan="' + col.subheadings.length + '" >';
                    col2 = col.heading;
                } else {
                    tbody += '<th style="border-bottom: none;">';
                }
                tbody += col2 + '</th>';
            }
        });
        tbody += '<th style="border-bottom: none;">Total</th>';
        tbody += '</tr>';
        tbody += '<tr><th style="border-top: none;"></th>';
    } else {
        tbody += '<tr><th></th>';
    }
    cols.forEach(function (col, i) {
        if ($.isPlainObject(col)) {
            col.subheadings.forEach(function (subcol, j) {
                //alert(JSON.stringify(subcol));
                if ($.isPlainObject(subcol)) {
                    colh.push(subcol.name);
                    tbody += '<th>' + subcol.heading + '</th>';
                } else {
                    tbody += '<th>' + subcol + '</th>';
                    colh.push(subcol);
                }
            });
        }
        else if (col != 'Total') {
            if (hasgroups) {
                tbody += '<th style="border-top: none;" >';
            } else {
                tbody += '<th>';
                tbody += col;
            }
            tbody += '</th>';
            colh.push(col);
        }
    });
    colh.push('Total');
    if (hasgroups) {
        tbody += '<th style="border-top: none;"></th>';
    } else {
        tbody += '<th>Total</th>';
    }
    tbody += '</tr>';
    var rows = edata.data[options.rowvar];
    if (options.rows) {
        rows = options.rows;
    }
    var colindex = {};
    colh.forEach(function (col, i) {
        colindex[col] = i;
    });
    var rowheads = [];
    rows.forEach(function (row, i) {
        if (row != 'Total') {
            rowheads.push(row);
        }
    });
    rowheads.push('Total');
    var rowindex = {};
    rowheads.forEach(function (row, i) {
        rowindex[row] = i;
    });
    rowheads.forEach(function (row, i) {
        tbody += "<tr>";
        tbody += '<th style="text-align: left;" >';
        if ($.isPlainObject(row)){
            tbody += row.heading;
        } else {
            tbody += row;
        }
        tbody += '</th>';
        colh.forEach(function (col, j) {
            tbody += '<td id="' + options.value + '_' + i + '_' + j + '"></td>';
        });
        tbody += "</tr>";
    });
    $('#' + options.id).html(tbody);
    var columntotals = [];
    var i;
    for (i = 0; i < colh.length; i++) {
        columntotals.push(0);
    };
    var itotal = rowindex['Total'];
    // Only use data for the given year
    edata.data.data.forEach(function (drow, i) {
        // Test filter
        if (filterRow(drow, options.filter) == true) {
            var colvar = drow[options.colvar];
            var rowvar = drow[options.rowvar];
            var icol = colindex[colvar];
            var id = options.value + '_' + rowindex[rowvar] + '_' + icol;
            var value = drow[options.value];
            if (value != null) {
                $('#' + id).text(formatNumber(value));
            }
            if (rowvar != 'Total') {
                if (value) {
                    columntotals[icol] += Number(value);
                }
            }
        }
    });

    columntotals.forEach(function (tot, j) {
        var id = options.value + '_' + itotal + '_' + j;
        if ($('#' + id).text().length == 0) {
            $('#' + id).text(formatNumber(tot));
        } else {
            columntotals[j] = Number($('#' + id).text());
        }
    });
    // Form subtotals
    rowheads.forEach(function (row, i) {
        if ($.isPlainObject(row)) {
            for (j = 0; j < colh.length; j++) {
                var total = 0;
                row.total.forEach(function (name, k) {
                    var id = options.value + '_' + rowindex[name] + '_' + j;
                    var v = Number($('#' + id).text());
                    if (!isNaN(v)) {
                        total += v;
                    }
                });
                var id = options.value + '_' + i + '_' + j;
                $('#' + id).text(formatNumber(total));
            };
        }
    });
    if (options.total) {
        var total = 0;
        options.total.forEach(function (tot, i) {
            icol = colindex[tot];
            total += columntotals[icol];
        });
        var id = options.value + '_' + itotal + '_' + colindex['Total'];
        $('#' + id).text(total);
    }
}
function formTable(file, rowvar, colvar, year, value, id) {
    var options = {
        rowvar : rowvar,
        colvar: colvar,
        rows: null,
        cols: null,
        year: year,
        id: id,
        value: value
    };
    if (edata.file != file || edata.data == null) {
        getTableData(file, options, populateTable);
    } else {
        populateTable(options);
    }
}
function showTables(file) {
    // Show
    // Combobox of years
    // Table of fuel by sector for energy and emissions
    // Pie charts of fuel and sectors.
    // Time series with checkboxes for each fuel
    // Time series with checkboxes for each sector.
    // This should be a separate page.
}