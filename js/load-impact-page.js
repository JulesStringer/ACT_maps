jQuery(document).ready(function($) {
    $('#load_impact_csv').on('click', function() {
        console.log('Clicked load_impact_csv');
        setupFileReader('load_impact_csv');
    });
    async function setupFileReader(id){
        if (!id) {
            id = 'restore_file';
        }
        // fire processUpload when the user uploads a file.
        document.querySelector('#' + id).addEventListener('change', handleFileUpload, false);
        // Setup file reading
        var reader = new FileReader();
        reader.onload = handleFileRead;
               function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            console.log('Reading file:', file.name);

            Papa.parse(file, {
                complete: handleParseComplete
            });
        }

        async function handleParseComplete(results) {
            // results.data is an array of rows, each row is an array of values
            const rows = results.data;

            // First row is headers, skip it
            const dataRows = rows.slice(1);

            const parishData = {};

            dataRows.forEach(fields => {
                if (!fields[0]) return; // skip empty rows

                const parish = fields[0];
                const name = fields[1];

                const row = {
                    code: parish,
                    name: name,
                    all: {
                        all: totalfields(fields, 2, 16)
                    },
                    consumption: {
                        all: totalfields(fields, 2, 4),
                        goods: fields[2],
                        services: fields[3],
                        other: fields[4]
                    },
                    food: {
                        all: totalfields(fields, 5, 6),
                        meatfish: fields[5],
                        other: fields[6]
                    },
                    housing: {
                        all: totalfields(fields, 7, 12),
                        mainsgas: fields[7],
                        electricity: fields[8],
                        oil: fields[9],
                        lpg: fields[10],
                        biomass: fields[11],
                        coal: fields[12]
                    },
                    travel: {
                        all: totalfields(fields, 13, 15),
                        flights: fields[13],
                        publictransport: fields[14],
                        privatetransport: fields[15]
                    },
                    waste: {
                        all: fields[16]
                    }
                };

                parishData[parish] = row;
            });
            console.log("Parsed Parish Data:", parishData);
            // At this point you could display something in #act-maps-load-impact-results
            // or send parishData back to the server via AJAX.
            let result = await merge_attributes_into_geoJSON('Parishes', 'ParishCarbon', parishData);
            let resp = await make_merged_layer('Parishes', 'CODE', 'ParishCarbon', result.attributes, 'impact/parishcarbon');
            console.log('Resp: ' + JSON.stringify(resp));
        }
        function totalfields(fields, start, end) {
            let sum = 0;
            for (let i = start; i <= end; i++) {
                const val = parseFloat(fields[i]);
                if (!isNaN(val)) sum += val;
            }
            return sum;
        }
    }

});
