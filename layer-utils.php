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
    act_save_geojson_layer($destinationlayer, $target_geojson, $path, $version);

    return ['message' => 'merged layer saved'];
}
/**
 * Save or update a GeoJSON layer in MAPDATA.
 *
 * @param string $layerid   Unique identifier for the layer.
 * @param array|string $geojson The GeoJSON content (array or JSON string).
 * @param string|null $path    Default path under MAPDATA (e.g. "boundaries/parishes.json").
 * @param string|null $version Optional. Version string to use. If null, an ISO timestamp is generated.
 *
 * @return bool True on success, false on failure.
 */
function act_save_geojson_layer($layerid, $geojson, $path = null, $version = null) {
error_log('layerid '.$layerid);
error_log('path passed to act_save_geojson_layer '.$path);
    // Load MAPDATA location from wp-config
    if (!defined('MAPDATA')) {
        error_log("MAPDATA not defined in wp-config.php");
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
    if (isset($layers[$layerid]) && !empty($layers[$layerid]['path'])) {
        $path = $layers[$layerid]['path'];
    } else {
        $layers[$layerid] = [
            "location" => "local",
            "path"     => $path
        ];
        file_put_contents($layers_file, json_encode($layers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    // Ensure $geojson is JSON string
    if (is_array($geojson)) {
        $geojson = json_encode($geojson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
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
    if ($version === null) {
        $version_iso = gmdate("c");  // ISO8601 UTC (e.g. 2025-08-19T19:10:25+00:00)
        $version_iso = preg_replace('/\+00:00$/', 'Z', $version_iso); // Cleaner UTC Z suffix
    } else {
        $version_iso = $version;
    }

    // Sanitized version string for filenames (no colons, safe everywhere)
    $version_safe = preg_replace('/[^0-9A-Za-z]/', '', $version_iso); // e.g. 20250819T191025Z

    // Handle existing file (rename with version)
    if (file_exists($fullpath)) {
        $base = basename($path, ".json");
        $backup = $dir . "/" . $base . "_" . $version_safe . ".json";
        if (!rename($fullpath, $backup)) {
            error_log("Failed to backup existing file: $fullpath");
            return false;
        }
    }

    // Write new GeoJSON
    if (file_put_contents($fullpath, $geojson) === false) {
        error_log("Failed to write GeoJSON to: $fullpath");
        return false;
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

    return true;
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