function create_WW_Editor(){
    let editor = {
        code_field: 'code',
        name_field: 'parish',
        columnspecs:{
            parish: {
                header: 'Name',
                type: 'literal',
                width: '100px',
                size: 30,

            },
            wardens: {
                header: 'No. Wardens',
                type: 'text',
                checkNumber:true,
                width: '50px',
                size: 10
            },
            parish_text: {
                header: 'Parish Text',
                type:'textarea',
                width: '800px',
                preventKey: function(key){
                    return key === '"';
                },
                cols: 80,
                rows: 10
            }
        },
        options: {
            norowid: true,
            widths:[100, 800, 0, 0]
        },
        //
        //  Columns calculated just before the layer is saved
        //
        calculated: {
            email: function(properties){
                let code = properties['code'];
                let name = properties['parish'];
                return "/contact-us/?recipients=Wildlife Warden Scheme&your-subject=" + code + "%20" + name;
            },
            // Working link from before install on test.actionclimateteignbridge.org
            // https://test.actionclimateteignbridge.org/contact-us/?recipients=Wildlife%20Warden%20Scheme&your-subject=E05011898%20Bushell
            //
            planning: function(properties){
                return "https://publicaccess.teignbridge.gov.uk/online-applications/search.do?action=monthlyList";
            }
        }
    }
    return editor;
}