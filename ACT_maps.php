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

?>