jQuery(document).ready(function($) {
    $('#load_impact_csvs').on('click', function() {
        $('#impact_files').click();
    });
    $('#impact_files').on('change', async function(event) {
        console.log('Clicked load_files');

        const files = Array.from(event.target.files);
        if (files.length === 0) return;
console.log('Files: ' + JSON.stringify(files));
        let parishFile = files.find(f => f.name.includes('parish'));
        let wardFile   = files.find(f => f.name.includes('ward'));

        if (!parishFile || !wardFile) {
            console.error("Both parish and ward files are required");
            return;
        }
        // read source area feature - get a set of codes
        let codes = await get_codes_from_geojson('TeignbridgeArea','CODE');
        console.log('Got area codes');
        // add on old parish codes in case
//        codes['E04012122']=2; // Pre 2023 newton abbot
//        codes['E04003226']=2 // Pre 2023 ogwell
//        codes['E05011892']=2; // Ambrook use properties for Ogwell if missing
        let reserves = {
            'E04013236':['E04012122'],
            'E04013237':['E04003226','E05011892']
        }
        for(let r in reserves){
            let res = reserves[r];
            for(let code of res){
                codes[code]=1;
                console.log('Code ' + code + ' added to list');
            }
        }
        let areadata = {};
        console.log('Reading ' + parishFile);
        areadata = await parseCSVFile(parishFile, codes, areadata, {geography:'parish'});
        console.log('Got parishData');
        console.log('Reading ' + wardFile);
        areadata = await parseCSVFile(wardFile, codes, areadata, {geography:'ward'});
        console.log('Is Ambrook in  properties: ' + JSON.stringify(areadata['E05011892']));
        console.log('Got ward data');
        console.log('Read ' + Object.keys(areadata).length + ' codes matched');
        // At this point you could display something in #act-maps-load-impact-results
        // or send AreaData back to the server via AJAX.
        let resp = await make_merged_layer('TeignbridgeArea', 'CODE', 'AreaCarbon', areadata, 'impact/areacarbon',reserves);
        console.log('Resp: ' + JSON.stringify(resp));
    });
    // helper to wrap Papa.parse in a Promise
    function parseCSVFile(file, codes, areadata, assignments) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                complete: (results) => {
                    try {
                        const obj = parseToRegionData(results.data, codes, areadata, assignments);
                        resolve(obj);
                    } catch (err) {
                        reject(err);
                    }
                },
                error: reject
            });
        });
    }
    function parseToRegionData(rows, codes, areadata, assignments) {
        // First row is headers, skip it
        const dataRows = rows.slice(1);

        dataRows.forEach(fields => {
            if (!fields[0]) return; // skip empty rows

            const region = fields[0];
            if ( codes[region] ){
                const name = fields[1];

                let row = {
                    code: region,
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
                if ( assignments ){
                    for(const key in assignments){
                        row[key] = assignments[key];
                    }
                }
                areadata[region] = row;
            }
        });

        return areadata;
    }
    function totalfields(fields, start, end) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            const val = parseFloat(fields[i]);
            if (!isNaN(val)) sum += val;
        }
        return sum;
    }

});
