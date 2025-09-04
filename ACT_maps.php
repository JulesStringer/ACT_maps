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
require_once plugin_dir_path( __FILE__ ) . 'layer-utils.php';
require_once plugin_dir_path( __FILE__ ) . 'map-editor-lists.php';

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
            'title' => '',
            'config' => ''
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

    if ( $atts['width'] == 'full'){
        $width = '100%';
    } else {
        $width = esc_attr($atts['width']);
    }
    if ( $atts['height'] == 'full'){
    } else {
        $height = esc_attr($atts['height']);        
    }
    $title = sanitize_text_field( $atts['title']);
    if ( empty( $title )){
        $title = strtoupper($map_id);
    }
    // Determine the URL parameter for forceshift.
    // The attribute is a string, so we need to check its value.
    $map_params = '';
    $params_array = array();
    if ( 'true' === strtolower( $atts['forceshift'] ) ) {
        $params_array[] = 'forceshift=true';
    }
    if ( strlen($atts['config']) > 0 ){
        $params_array[] = 'config='.$atts['config'];
    }
    $params_array[] = 'v=2025-09-03T14:40';
    $map_params = (count($params_array) > 0) ? ('?' . implode('&', $params_array)) : '';
    // Build the URL to the map's HTML file.
    // We use plugins_url() to get the correct, full URL to our plugin directory.
    // This is much safer and more reliable than hardcoding paths.
    $map_url = plugins_url( "maps/{$map_id}/{$map_id}.html", __FILE__ ) . $map_params;
    // Check if the HTML file actually exists on the server.
    // This adds a layer of robustness to prevent broken links.
    $map_file_path = plugin_dir_path( __FILE__ ) . "maps/{$map_id}/{$map_id}.html";
    if ( ! file_exists( $map_file_path ) ) {
        return "<p>Error: The map file for ID '{$map_id}' does not exist at '{$map_file_path}'.</p>";
    }
    if ( $map_id === 'twomaps' ) {
        $config_file_path = plugin_dir_path(__FILE__)."maps/{$map_id}/{$atts['config']}.json";
        if ( strlen($atts['config']) == 0 ){
            return "<p>Error: If ID is twomaps then config needs to be specified.</p>";
        } else if ( !file_exists( $config_file_path)){
            return "<p>Error: The map file for ID '{$atts['config']}' does not exist at '{$config_file_path}'.</p>";
        }
    }
    // Generate the iframe HTML.
    $container_id = 'act_maps_'.uniqid();
    if ( $width !== '100%'){ 
        $width .= 'px';
    }
    $style = 'width:' . esc_attr($width) . '; ';
    if ( $width !== '100%'){
        $style .= 'margin: 0 auto; overflow:hidden; ';
    }
    $output = '<div id="' . esc_attr($container_id) . '" style="'. $style. '">';
    if ( $atts['height'] !== 'full'){
        $output .= sprintf(
            '<iframe src="%s" title="%s Map" style="overflow:hidden;height:%spx;width:%s;"></iframe>',
            $map_url,
            esc_attr( $title ), // Use a title based on the ID.
            esc_attr( $height ),
            esc_attr( $width ) // The style width is also needed for the old code.
        );
    }
    $output .='</div>';
    if ( $atts['height'] == 'full'){
        error_log('$map_url '.$map_url);
        error_log('$map_url escaped '. esc_url($map_url));
        error_log('$title '.$title);
        error_log('$width '.$width);
        $output .= sprintf(
            '<script>
            document.addEventListener("DOMContentLoaded", function() {
                const mapContainer = document.getElementById("%s");
                const footer = document.querySelector("footer");
                if (!mapContainer || !footer) {
                    console.error("Map container or footer not found.");
                    return;
                }
                const containerTop = mapContainer.getBoundingClientRect().top;
                const footerHeight = footer.offsetHeight;
                const availableHeight = window.innerHeight - containerTop - footerHeight - 50;
                const iframe = document.createElement("iframe");
                iframe.src = "%s";
                iframe.title = "%s Map";
                iframe.style.width = "%s";
                iframe.style.height = availableHeight + "px";
                iframe.style.border = "none";
                iframe.style.overflow = "hidden";
                mapContainer.appendChild(iframe);
            });
            </script>',
            esc_attr($container_id),
            $map_url,
            esc_attr($title),
            esc_attr($width)
        );
        error_log('This is the code using sprintf version');
    }
    error_log('generated html: '.$output);
    return $output;
}
add_shortcode( 'act_maps', 'act_maps_shortcode' );

add_action( 'admin_menu', 'act_maps_menu' );
function act_maps_menu() {
    add_menu_page( 'ACT maps', 'ACT maps', 'read', 'act-maps', 'act_maps_admin_page', 'dashicons-list-view' ); // Top-level menu
    add_submenu_page('act-maps', 'Load impact data', 'Load impact date', 'administrator', 'act-maps-load-impact','act_maps_load_impact_page');
    $lists = get_act_map_lists(); // Get the filtered list based on user roles
    foreach ($lists as $list_id => $list_data) {
        add_submenu_page( 
            'act-maps', 
            $list_data['title'], 
            $list_data['title'], 
            $list_data['role'], 
            'act-maps-edit-' . $list_id, 
            'act_maps_edit_page' ); // Use the role for capability check on submenu    }
    }
}
function act_maps_admin_page() {
    // Top-level page content (can be empty or a welcome message)
    echo '<h2>ACT Maps Admin</h2>';
    echo '<ul>';
    echo '<li><a href="' . admin_url( 'admin.php?page=act-maps-load-impact') .'">Load impact data</a></li>';
    $lists = get_act_map_lists(); // Get the filtered list based on user roles
    foreach ($lists as $list_id => $list_data) {
        echo '<li><a href="' . admin_url( 'admin.php?page=act-maps-edit-' . $list_id ) . '">' . $list_data['title'] . '</a></li>';
    }
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
    wp_enqueue_script('act-maps-layer-utils', plugins_url('js/layer-utils.js', __FILE__), array(),'1.2', true);
    wp_enqueue_script( 'act-maps-tooltips',    plugins_url( 'table_editor/tooltips.js', __FILE__),     array('jquery'), 1.0, true);
    wp_enqueue_script( 'act-maps-tableeditor', plugins_url( 'table_editor/tableeditor.js', __FILE__ ), array('jquery','act-maps-tooltips'), '1.0', true );
    wp_enqueue_script( 'act-maps-namevalueeditor', plugins_url( 'table_editor/namevalue.js', __FILE__), array('jquery', 'act-maps-tooltips'), '1.0', true);
    wp_enqueue_script( 'act-maps-edit-area-map', plugins_url('js/edit_area_map.js' , __FILE__), array('jquery', 'act-maps-namevalueeditor'), '1.3', true);
    wp_enqueue_script( 'act_maps-edit-CC', plugins_url('editors/CC.js', __FILE__),array('jquery', 'act-maps-namevalueeditor'), '1.1', true);
    wp_enqueue_script( 'act_maps-edit-WW', plugins_url('editors/WW.js', __FILE__),array('jquery', 'act-maps-namevalueeditor'), '1.1', true);
}
function act_maps_edit_page() {
    $current_screen = get_current_screen();
    $screen_id = $current_screen->id;   
    //echo '<p>'.$screen_id,'</p>';
    if ( strpos($screen_id,'act-maps_page_act-maps-edit-' ) !== 0){
        return;
    } 
    $list_id = str_replace('act-maps_page_act-maps-edit-', '', $screen_id);
    $list_data = get_act_map_list_by_id($list_id);
    if (!$list_data) {
        echo '<h2>Screen id{'. $screen_id, '}</h2>';
        echo '<h2>List not found{'. $list_id.'}</h2>';
        return;
    }

    if (!current_user_can($list_data['role'])) {
        echo '<h2>You do not have permission to access this page.</h2>';
        return;
    }

    // Include the HTML file.  Use include or require for security reasons.
    $file_path = null; // Use a single template
    $file_path = plugin_dir_path( __FILE__ ) .'html/edit_area_map.html';
    if ( file_exists($file_path) ) {
        $css_url = plugins_url( 'css/list_manager.css', __FILE__ );
        $js_tableeditor_url = plugins_url( 'table_editor/tableeditor.js', __FILE__ );
        $js_dynamic_url = plugins_url( 'editors/' . str_replace('act-admin-', '', $_GET['page']) . '_admin.js', __FILE__ ); // Dynamic JS

        ob_start();
        include $file_path;
        $html_content = ob_get_clean();

        $html_content = str_replace('{list_manager.css}', $css_url , $html_content);

        // Replace placeholders (Title, Format, Help Text)
        $html_content = str_replace('{List Title}', esc_html($list_data['title']), $html_content);

        $html_content = str_replace('{list-id}', $list_id, $html_content);
        // Help Text (Example - adapt as needed)
        $help_text = isset($list_data['help_text']) ? $list_data['help_text'] : ''; // Get help text, or default to empty
        $html_content = str_replace('{Help Text}', $help_text, $html_content);

        echo $html_content;

    } else {
        echo '<h2>HTML file not found'. $template_file_path.'</h2>';
        error_log("HTML file not found: " . $template_file_path); // Log the error!
        return;
    }
}
?>
