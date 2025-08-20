<?php
/**
 * Plugin Name: ACT Maps Plugin
 * Plugin URI:  https://sites.stringerhj.co.uk/ACT/WP_plugins/ACT_maps/html/ACT_maps.html
 * Description: A custom plugin to display predefined maps embedded in a page.
 * Version:     1.0.0
 * Author: Julian Stringer
 * Author URI:  https://your-website.com/
 * License:     GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: act-maps
 * Domain Path: /languages
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Shortcode to display a map based on a provided ID.
 *
 * @param array $atts Shortcode attributes.
 * @return string The HTML for the map iframe.
 */
function act_maps_shortcode( $atts ) {
    // Sanitize and validate the shortcode attributes.
    $atts = shortcode_atts(
        array(
            'id' => '', // Default ID is an empty string.
            'width' => '600', // Default width.
            'height' => '830', // Default height.
            'forceshift' => 'true', // Default forceshift to true
            'title' => ''
        ),
        $atts,
        'act_maps'
    );

    // Get the map ID from the attributes.
    $map_id = sanitize_text_field( $atts['id'] );
    
    // Validate that an ID has been provided.
    if ( empty( $map_id ) ) {
        return '<p>Error: Please provide a map ID for the shortcode. Example: [act_maps id="WW"]</p>';
    }

    // Sanitize width and height to ensure they are numeric.
    $width = absint( $atts['width'] );
    $height = absint( $atts['height'] );
    $title = sanitize_text_field( $atts['title']);
    if ( empty( $title )){
        $title = strtoupper($map_id);
    }
    // Determine the URL parameter for forceshift.
    // The attribute is a string, so we need to check its value.
    $forceshift_param = '';
    if ( 'true' === strtolower( $atts['forceshift'] ) ) {
        $forceshift_param = '?forceshift=true';
    }


    // Build the URL to the map's HTML file.
    // We use plugins_url() to get the correct, full URL to our plugin directory.
    // This is much safer and more reliable than hardcoding paths.
    $map_url = plugins_url( "maps/{$map_id}/{$map_id}.html", __FILE__ ) . $forceshift_param;
    // Check if the HTML file actually exists on the server.
    // This adds a layer of robustness to prevent broken links.
    $map_file_path = plugin_dir_path( __FILE__ ) . "maps/{$map_id}/{$map_id}.html";
    if ( ! file_exists( $map_file_path ) ) {
        return "<p>Error: The map file for ID '{$map_id}' does not exist at '{$map_file_path}'.</p>";
    }

    // Generate the iframe HTML.
    $iframe_html = sprintf(
        '<p><iframe src="%s" title="%s Map" width="%s" height="%s" style="overflow:hidden;width:%spx;"></iframe></p>',
        esc_url( $map_url ),
        esc_attr( $title ), // Use a title based on the ID.
        esc_attr( $width ),
        esc_attr( $height ),
        esc_attr( $width ) // The style width is also needed for the old code.
    );
    return $iframe_html;
}
add_shortcode( 'act_maps', 'act_maps_shortcode' );

add_action( 'admin_menu', 'act_maps_menu' );
function act_maps_menu() {
    add_menu_page( 'ACT maps', 'ACT maps', 'read', 'act-maps', 'act_maps_admin_page', 'dashicons-list-view' ); // Top-level menu
    add_submenu_page('act-maps', 'Load impact data', 'Load impact date', 'administrator', 'act-maps-load-impact','act_maps_load_impact_page');
}
function act_maps_admin_page() {
    // Top-level page content (can be empty or a welcome message)
    echo '<h2>ACT Maps Admin</h2>';
    echo '<ul>';
        echo '<li><a href="' . admin_url( 'admin.php?page=act-maps-load-impact') .'">Load impact data</a></li>';
    echo '</ul>';
}
function act_maps_load_impact_page() { // Callback for the single JSON page
    include plugin_dir_path(__FILE__) . 'html/load-impact-page.html'; 
}
add_action('admin_enqueue_scripts', 'act_maps_enqueue_scripts');

function act_maps_enqueue_scripts( $hook_suffix ) {
    wp_enqueue_script('act-maps-script', plugins_url('js/load-impact-page.js', __FILE__), array('jquery'), '1.0', true);
    wp_localize_script('act-maps-script', 'act_maps_params', array(
        'ajaxurl'   => admin_url('admin-ajax.php'),
        'proxy_url' => plugins_url('proxy.php', __FILE__), // 👈 full URL to proxy.php
    ));
    // enqueue in your plugin
    wp_enqueue_script(
        'papaparse',
        'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
        array(),
        '5.4.1',
        true
    );
    wp_enqueue_script('act-maps-layer-utils', plugins_url('js/layer-utils.js', __FILE__), array(),'1.0', true);
}
function handle_make_merged_layer() {
    if ( ! current_user_can('edit_posts') ) {
        wp_send_json_error(['message' => 'Permission denied']);
    }

    $sourcelayer      = isset($_POST['sourcelayer']) ? sanitize_text_field($_POST['sourcelayer']) : '';
    $sourcekey        = isset($_POST['sourcekey']) ? sanitize_text_field($_POST['sourcekey']) : '';
    $destinationlayer = isset($_POST['destinationlayer']) ? sanitize_text_field($_POST['destinationlayer']) : '';
    $attributes       = isset($_POST['attributes']) ? json_decode(stripslashes($_POST['attributes']), true) : [];
    $path             = isset($_POST['path']) ? sanitize_text_field($_POST['path']) : '';
    $version          = isset($_POST['version']) ? sanitize_text_field($_POST['version']) : null;

    try {
        $result = make_merged_layer(
            $sourcelayer,
            $sourcekey,
            $destinationlayer,
            $attributes,
            $path,
            $version
        );

        wp_send_json_success($result);
    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }
}
add_action('wp_ajax_make_merged_layer', 'handle_make_merged_layer');

function make_merged_layer($sourcelayer, $sourcekey, $destinationlayer, $attributes, $path, $version = null) {
    $proxy_url = plugin_dir_url(__FILE__) . 'proxy.php?layer=' . urlencode($sourcelayer);
    $source_json = file_get_contents($proxy_url);
    if ($source_json === false) {
        throw new Exception("could not fetch source layer: $sourcelayer");
    }

    $source_geojson = json_decode($source_json, true);
    if (!$source_geojson || empty($source_geojson['features'])) {
        throw new Exception("invalid geojson returned from source layer: $sourcelayer");
    }

    foreach ($source_geojson['features'] as &$feature) {
        $key = $feature['properties'][$sourcekey] ?? null;
        if ($key && isset($attributes[$key])) {
            $feature['properties'] = $attributes[$key];
        }
    }

    act_save_geojson_layer($destinationlayer, $path, $source_geojson, $version);

    return ['message' => 'merged layer saved'];
}
/**
 * Save or update a GeoJSON layer in MAPDATA.
 *
 * @param string $layerid   Unique identifier for the layer.
 * @param string $path      Path under MAPDATA (e.g. "boundaries/parishes.json").
 * @param array|string $geojson The GeoJSON content (array or JSON string).
 * @param string|null $version Optional. Version string to use. If null, an ISO timestamp is generated.
 *
 * @return bool True on success, false on failure.
 */
function act_save_geojson_layer($layerid, $path, $geojson, $version = null) {
    // Load MAPDATA location from wp-config
    if (!defined('MAPDATA')) {
        error_log("MAPDATA not defined in wp-config.php");
        return false;
    }
    $mapdata_root = rtrim(MAPDATA, '/');

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

    // Update layers.json in MAPDATA root
    $layers_file = $mapdata_root . "/layers.json";
    $layers = [];
    if (file_exists($layers_file)) {
        $layers = json_decode(file_get_contents($layers_file), true);
        if (!is_array($layers)) {
            $layers = [];
        }
    }
    $layers[$layerid] = [
        "location" => "local",
        "path"     => $path
    ];
    file_put_contents($layers_file, json_encode($layers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    return true;
}
add_action('wp_ajax_act_save_geojson', 'act_save_geojson_handler');

function act_save_geojson_handler() {
    // Required args
    $layerid = sanitize_text_field($_POST['layerid'] ?? '');
    $path    = sanitize_text_field($_POST['path'] ?? '');
    $version = sanitize_text_field($_POST['version'] ?? '');

    if (empty($layerid) || empty($path)) {
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

    // Use your act_save_geojson_layer function
    $result = act_save_geojson_layer($layerid, $path, $geojson, $version);

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
