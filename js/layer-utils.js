async function saveGeoJSON(layerId, path, geojson, version = null) {
    const formData = new FormData();

    // Add action and metadata
    formData.append("action", "act_save_geojson");
    formData.append("layerid", layerId);
    formData.append("path", path);
    if (version) formData.append("version", version);

    // Add GeoJSON as a file
    const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
    formData.append("geojson_file", blob, `${layerId}.json`);

    try {
        const response = await fetch(ajaxurl, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Layer saved:", data);
        return data;
    } catch (err) {
        console.error("⚠️ Save failed:", err);
        return null;
    }
}
async function make_merged_layer(sourcelayer, sourcekey, destinationlayer, attributes, path, reserves, version = null) {
    const formData = new FormData();
    formData.append('action', 'make_merged_layer');
    formData.append('sourcelayer', sourcelayer);
    formData.append('sourcekey', sourcekey);
    formData.append('destinationlayer', destinationlayer);
    formData.append('attributes', JSON.stringify(attributes));
    formData.append('path', path);
    formData.append('reserves', JSON.stringify(reserves));
    if (version) formData.append('version', version);

    const resp = await fetch(ajaxurl, {
        method: 'POST',
        body: formData
    });

    const data = await resp.json();
    if (!data.success) throw new Error(data.data?.message || 'server error');

    return data;
}
async function get_codes_from_geojson(layerid, codeid) {
    try {
        let codes = {};
        const response = await fetch(act_maps_params.proxy_url + "?layer=" + layerid);
        if (!response.ok) throw new Error("Failed to fetch GeoJSON");

        const geojson = await response.json();

        for(let feature of geojson.features){
            let code = feature.properties[codeid];
            codes[code] = 1;
        }
        return codes;
    } catch (err) {
        console.error("Error merging area data:", err);
        // Reject the promise
        throw err;
    }
}
