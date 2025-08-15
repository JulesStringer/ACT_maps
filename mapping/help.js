const helpsections = {
    about: {
        button: 'show_about',
        file: 'about.html',
        title: 'About',
        style: 'height:unset;',
        populate: function () {

        }
    },
    mappinghelp: {
        button: 'show_mapping_help',
        file: 'mapping_help.html',
        title: 'Mapping Help'
    }
};
function populatehelpmenu() {
    var keys = Object.keys(helpsections);
    var body = '';
    keys.forEach(function (key, i) {
        var item = helpsections[key];
        body += '<button type="button" id="' + item.button + '" ';
        body += 'onclick="show_help(\'' + key + '\');">';
        body += '+</button>' + item.title + '<br/>';
    });
    $('#helpmenu').html(body);
    body = '';
    keys.forEach(function (key, i) {
        var item = helpsections[key];
        body += '<div id="' + key + '" class="helptext" ';
        if (item.style) {
            body += 'style="' + item.style + '"';
        }
        body += '>';
        body += '</div>';
    });
    $('#helptext').html(body);
    keys.forEach(function (key, i) {
        var item = helpsections[key];
        if (item.populate) {
            item.populate();
        }
    });
}
function on_help(action) {
    var helpmenu = $('#helpmenu');
    if (!action) {
        if (helpmenu.css('display') == 'none') {
            // determine if any helptext is displayed
            var right = $('#main').css('right');
            right = parseInt(right);
            //            alert('right=' + right);
            if (right > 0) {
                action = -1;
            } else {
                action = 1;
            }
        } else {
            action = -1;
        }
    }
    if (action > 0) {
        $('#help').text('-Help');
        $('#helpmenu').css({ display: 'block' });
    } else {
        $('#help').text('+Help');
        $('#helpmenu').css({ display: 'none' });
        $('.helptext').css({ display: 'none' });
        $('#main').css({ right: '0px', left: '0px' });
        // Set button texts to +
        $('#helpmenu>button').text('+');
    }
}
function show_help(divname) {
    var item = helpsections[divname];
    if (lastfocus == divname) {
        lastfocus = null;
    } else {
        var div = $('#' + divname);
        if (div.html().length == 0) {
            $('#' + item.button).text('-');
            $('#main').css({ right: '30%', left: '0px' });
            $.ajax({
                method: 'get',
                url: item.file,
                contentType: 'text/html',
                dataType: 'html',
                success: function (data) {
                    div = $('#' + divname);
                    div.html(data);
                    div.css({ display: 'block' });
                },
                error: function (err) {
                    alert(JSON.stringify(err));
                }
            });
        } else {
            if (div.css('display') == 'none') {
                div.css({ display: 'block' });
                var button = $('#' + item.button);
                button.siblings('button').text('+');
                button.text('-');
                $('#main').css({ right: '30%', left: '0px' });
                div.siblings('div').css({ display: 'none' });
            } else {
                div.css({ display: 'none' });
                $('#' + item.button).text('+');
                $('#main').css({ right: '0%', left: '0px' });
            }
        }
    }
}
function showhelpdiv(divname) {
    var div = $('#' + divname);
    var button = $('#' + divname + '_btn');
    if (div.css('display') == 'none') {
        div.css({ display: 'block' });
        button.text('-');
        div.siblings('div').css({ display: 'none' });
        button.siblings('button').text('+');
    } else {
        div.css({ display: 'none' });
        button.text('+');
    }
}
