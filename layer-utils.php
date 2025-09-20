<?php

function handle_make_merged_layer() {
    if ( ! current_user_can('edit_posts') ) {
        wp_send_json_error(['message' => 'Permission denied']);
    }

    $sourcelayer      = isset($_POST['sourcelayer']) ? sanitize_text_field($_POST['sourcelayer']) : '';
    $sourcekey        = isset($_POST['sourcekey']) ? sanitize_text_field($_POST['sourcekey']) : '';
    $destinationlayer = isset($_POST['destinationlayer']) ? sanitize_text_field($_POST['destinationlayer']) : '';
    $attributes       = isset($_POST['attributes']) ? json_decode(stripslashes($_POST['attributes']), true) : [];
    $layer_options = isset($_POST['layer_options']) ? json_decode(stripslashes($_POST['layer_options']), true) : [];
    $reserves         = isset($_POST['reserves']) ? json_decode(stripslashes($_POST['reserves']), true) : [];
    $version          = isset($_POST['version']) ? sanitize_text_field($_POST['version']) : null;

    try {
        $result = make_merged_layer(
            $sourcelayer,
            $sourcekey, 
            $destinationlayer,
            $attributes,
            $layer_options,
            $reserves,
            $version
        );

        wp_send_json_success($result);
    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }  
}
add_action('wp_ajax_make_merged_layer', 'handle_make_merged_layer');
function make_merged_layer($sourcelayer, $sourcekey, $destinationlayer, $attributes, $layer_options, $reserves, $version) {
    $proxy_url = plugin_dir_url(__FILE__) . 'proxy.php?layer=' . urlencode($sourcelayer);
    $source_json = file_get_contents($proxy_url);
    if ($source_json === false) {
        throw new Exception("could not fetch source layer: $sourcelayer");
    }
error_log('$reserves: ' .var_export($reserves, true));
    $source_geojson = json_decode($source_json, true);
    if (!$source_geojson || empty($source_geojson['features'])) {
        throw new Exception("invalid geojson returned from source layer: $sourcelayer");
    }
    $path = null;
    if ( !empty($layer_options['path'])){
        $path = $layer_options['path'];
    }
    $layername = $destinationlayer;
    if ( !empty($layer_options['title'])){
        $layername = $layer_options['title'];
    }
    $target_geojson = [
        "type" => "FeatureCollection",
        "name" => $layername,
        "crs" => $source_geojson['crs'],
        "features" => []
    ];
    foreach ($source_geojson['features'] as &$feature) {
        $code = $feature['properties'][$sourcekey] ?? null;
        error_log('Code: ' . $code);
        if ($code && isset($attributes[$code])) {
            $feature['properties'] = $attributes[$code];
            $target_geojson["features"][] = $feature;
        } else if ( $reserves[$code] ){
            error_log('Trying reserve for ' . $code);
            foreach($reserves[$code] as $key){
                error_log('Trying '.$key);
                if ( $attributes[$key]){
                    error_log('Found attributes for '.$key);
                    $feature['properties'] = $attributes[$key];
                    $target_geojson["features"][] = $feature;
                    break;
                }
            }
        }
    }
error_log('destination layer: ' . $destinationlayer);
error_log('path: '.$path );
    act_save_geojson_layer($destinationlayer, $target_geojson, $path, $version, $attributes);

    return ['message' => 'merged layer saved'];
}
function make_safe_version( $version ){
    if ( isset ($version)){
        $version_iso = $version;
    } else {
        $version_iso = gmdate("c");  // ISO8601 UTC (e.g. 2025-08-19T19:10:25+00:00)
        $version_iso = preg_replace('/\+00:00$/', 'Z', $version_iso); // Cleaner UTC Z suffix
    }
    // Sanitized version string for filenames (no colons, safe everywhere)
    return preg_replace('/[^0-9A-Za-z]/', '', $version_iso); // e.g. 20250819T191025Z
}
function delete_identical_backup($new_file_path, $backup_file_path){
    // Calculate the MD5 hash for each file
    $new_file_hash = md5_file($new_file_path);
    $backup_file_hash = md5_file($backup_file_path);

    // Compare the hashes
    if ($new_file_hash === $backup_file_hash) {
        // Files are identical, so delete the backup
        unlink($backup_file_path);
        error_log("Backup file deleted as it was identical to the new file.");
    } else {
        error_log("Backup file retained as it was different from the new file.");
    }
}
/**
 * Save or update a GeoJSON layer in MAPDATA.
 *
 * @param string $layerid   Unique identifier for the layer.
 * @param array|string $geojson The GeoJSON content (array or JSON string).
 * @param string|null $path    Default path under MAPDATA (e.g. "boundaries/parishes.json").
 * @param string|null $version Optional. Version string to use. If null, an ISO timestamp is generated.
 * @param array|string|null Attributes/properties in json format
 *
 * @return bool True on success, false on failure.
 */
function act_save_geojson_layer($layerid, $geojson, $path = null, $version = null, $properties = null) {
error_log('layerid '.$layerid);
error_log('path passed to act_save_geojson_layer '.$path);
    // Load MAPDATA location from wp-config
    if (!defined('MAPDATA')) {
        error_log("MAPDATA not defined in wp-config.php");
        return false;
    }
    // Write new GeoJSON
    if ( !is_array($geojson)){
        error_log('geojson is not an array');
        return false;
    }
    $mapdata_root = rtrim(MAPDATA, '/');

    // Update layers.json in MAPDATA root if needed
    $layers_file = $mapdata_root . "/layers.json";
    $layers = [];
    if (file_exists($layers_file)) {
        $layers = json_decode(file_get_contents($layers_file), true);
        if (!is_array($layers)) {
            $layers = [];
        }
    } 

    $json_encode_options = 
                            JSON_PRETTY_PRINT |     // print human readable increases size of file
                            JSON_UNESCAPED_SLASHES; // Stop / being encoded as \/
    if (isset($layers[$layerid]) && !empty($layers[$layerid]['path'])) {
        $path = $layers[$layerid]['path'];
    } else {
        $layers[$layerid] = [
            "location" => "local",
            "path"     => $path
        ];
        file_put_contents($layers_file, json_encode($layers, $json_encode_options));
    }

    // Ensure $geojson is JSON string - enable this in live version to reduce file size
    $json_encode_options = JSON_UNESCAPED_SLASHES;
    // Check path ends with .json
    if (!str_ends_with($path, '.json')) {
        $path .= '.json';
    }
    // Ensure directory exists
    $fullpath = $mapdata_root . '/' . $path;
    $dir = dirname($fullpath);
    if (!file_exists($dir)) {
        if (!mkdir($dir, 0775, true)) {
            error_log("Failed to create directory: $dir");
            return false;
        }
    }

    // Determine version
    $version_safe = make_safe_version( $version );

    // Handle existing file (rename with version)
    if (file_exists($fullpath)) {
        $base = basename($path, ".json");
        $backup = $dir . "/" . $base . "_" . $version_safe . ".json";
        if (!rename($fullpath, $backup)) {
            error_log("Failed to backup existing file: $fullpath");
            return false;
        }
    }
    if ( write_geojson_stream($geojson, $fullpath, 2) === false){
        error_log("Failed to write GeoJSON to: $fullpath");
        if ( file_exists($fullpath)){
            $err_save = $dir . "/" . $base . "_error_" . $version_safe. ".json";
            error_log("Rolling back: renaming $fullpath to $err_save");
            if ( !rename($fullpath, $err_save)){
                error_log("Rollback failed");
            }
        }
        error_log("Rolling back: renaming $backup to $fullpath");
        if ( !rename($backup, $fullpath)){
            error_log('Rollback failed');
        }
        return false;
    }
    // Write properties if supplied
    if ($properties != null){
        // form base name
        $props_base = basename($path, ".json") . "_properties";
        $props_fullpath = $dir . '/' . $props_base . '.json';
        if ( file_exists($props_fullpath)){
            $backup_props = $dir. '/' . $props_base . "_" . $version_safe . ".json";
            if ( !rename($props_fullpath, $backup_props)){
                error_log("Failed to backup existing file: $props_fullpath");
                return false;
            }
        }
        if ( is_array($properties)){
            $properties = json_encode($properties, $json_encode_options);
        }
        error_log('Writing geojson properties: '.$props_fullpath);
        if (file_put_contents($props_fullpath, $properties) === false) {
            error_log("Failed to write GeoJSON to: $props_fullpath");
            return false;
        }
    }

    // Update versions.json
    $versions_file = $dir . "/versions.json";
    $versions = [];
    if (file_exists($versions_file)) {
        $versions = json_decode(file_get_contents($versions_file), true);
        if (!is_array($versions)) {
            $versions = [];
        }
    }
    $versions[basename($path)] = [
        "version" => $version_iso,
        "loaded"  => gmdate("c")
    ];
    file_put_contents($versions_file, json_encode($versions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    delete_identical_backup($fullpath, $backup);
    if ( $properties ){
        delete_identical_backup($props_fullpath, $backup_props);    
    }
    return true;
}
/**
 * Recursively writes coordinates to a file handle, rounding as it goes.
 *
 * This function iterates through a GeoJSON coordinate array and writes the
 * numbers to a file handle. It handles different levels of nesting
 * to support all GeoJSON geometry types.
 *
 * @param resource $handle The file handle to write to.
 * @param array $coordinates The coordinates array.
 * @param int $decimals The number of decimal places to round to.
 * @param bool $is_first_element A flag to control comma placement.
 */
function write_coordinates_stream($handle, $coordinates, $decimals, &$is_first_element) {
    if (!is_array($coordinates) || empty($coordinates)) {
        return;
    }

    $is_simple_pair = is_numeric($coordinates[0]);

    if ($is_simple_pair) {
        // It's a simple coordinate pair, e.g., [x, y]
        if (!$is_first_element) {
            fwrite($handle, ",");
        }
        fwrite($handle, "[");
        fwrite($handle, sprintf("%.{$decimals}f", $coordinates[0]));
        fwrite($handle, ",");
        fwrite($handle, sprintf("%.{$decimals}f", $coordinates[1]));
        fwrite($handle, "]");
        $is_first_element = false;
    } else {
        // It's a nested array, e.g., for LineString or Polygon
        if (!$is_first_element) {
            fwrite($handle, ",");
        }
        fwrite($handle, "[");
        $is_inner_first = true;
        foreach ($coordinates as $sub_coordinates) {
            write_coordinates_stream($handle, $sub_coordinates, $decimals, $is_inner_first);
        }
        fwrite($handle, "]");
        $is_first_element = false;
    }
}

/**
 * Writes a GeoJSON object to a file as a stream to avoid memory issues.
 *
 * This is the main function that should be called. It iterates through
 * the features and writes each one to the file as a JSON fragment,
 * handling the coordinate rounding and formatting on the fly.
 *
 * @param array $geojson The GeoJSON object as a PHP associative array.
 * @param string $output_filepath The path to the output file.
 * @param int $decimals The number of decimal places to round to.
 * @return bool True on success, false on failure.
 */
function write_geojson_stream($geojson, $output_filepath, $decimals) {
    try {
        $handle = @fopen($output_filepath, 'w');
        if ($handle === false) {
            error_log("Error: Could not open output file at " . $output_filepath);
            return false;
        }

        fwrite($handle, "{\n");

        $is_first_property = true;
        foreach ($geojson as $key => $value) {
            if ($key === 'features') {
                continue;
            }
            if (!$is_first_property) {
                fwrite($handle, ",\n");
            }
            fwrite($handle, '    ' . json_encode($key) . ':' . json_encode($value));
            $is_first_property = false;
        }

        if (!$is_first_property) {
            fwrite($handle, ",\n");
        }
        fwrite($handle, '    "features":[');

        $features_count = count($geojson['features']);
        foreach ($geojson['features'] as $index => $feature) {
            fwrite($handle, "\n    ");
            // Write the feature object header, starting with properties
            fwrite($handle, '{"type":"Feature",');
            fwrite($handle, "\n    ");
            fwrite($handle, '"properties":');

            // Write the properties (will be handled by json_encode since they're usually small)
            fwrite($handle, json_encode($feature['properties'],JSON_PRETTY_PRINT |JSON_UNESCAPED_SLASHES));

            // Write the geometry
            fwrite($handle, "\n   ");
            fwrite($handle, ',"geometry":{');
            fwrite($handle, "\n     ");
            fwrite($handle, '"type":"' . $feature['geometry']['type'] . '",');
            fwrite($handle, "\n     ");
            fwrite($handle, '"coordinates":');

            // Use a recursive helper function to handle coordinates
            $is_first_element = true;
            write_coordinates_stream($handle, $feature['geometry']['coordinates'], $decimals, $is_first_element);

            // Close the feature object
            fwrite($handle, "}\n }");

            // Add a comma if it's not the last feature
            if ($index < $features_count - 1) {
                fwrite($handle, ",\n");
            }
        }

        // Write the GeoJSON boilerplate footer
        fwrite($handle, "\n]}");

        // Close the file handle
        fclose($handle);
        return true;
    } catch(Throwable $err){
        error_log("write_geojson_stream failed: " . $err->getMessage());
        return false;
    }
}

add_action('wp_ajax_act_save_geojson', 'act_save_geojson_handler');

function act_save_geojson_handler() {
    // Required args
    $layerid = sanitize_text_field($_POST['layerid'] ?? '');
    $path    = sanitize_text_field($_POST['path'] ?? '');
    $version = sanitize_text_field($_POST['version'] ?? '');

    if (empty($layerid) ) {
        wp_send_json_error(['message' => 'Missing required parameters']);
    }

    // Ensure file uploaded
    if (empty($_FILES['geojson_file']) || $_FILES['geojson_file']['error'] !== UPLOAD_ERR_OK) {
        wp_send_json_error(['message' => 'GeoJSON file upload failed']);
    }

    // Read file contents
    $geojson = file_get_contents($_FILES['geojson_file']['tmp_name']);
    if (!$geojson) {
        wp_send_json_error(['message' => 'Failed to read uploaded file']);
    }

    // Path is a default for layer.path
    // Use your act_save_geojson_layer function
    $result = act_save_geojson_layer($layerid, $geojson, $path, $version);

    if ($result['success']) {
        wp_send_json_success([
            'message' => 'Layer saved successfully',
            'layerid' => $layerid,
            'path'    => $result['path'],
            'version' => $result['version']
        ]);
    } else {
        wp_send_json_error(['message' => $result['error'] ?? 'Unknown error']);
    }
}

?>