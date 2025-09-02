<?php
function get_act_map_lists() {
    /* Path of lists maintained by ACT_admin */
// TODO when plugin is registered add specific roles for each list and add role to maintainer of list.
    $lists = array(
        'WW' => array(
            'title' => 'WW Areas',
            'role' => 'manage_options', // Custom role
            'path' => MAPDATA . '/WW/WildlifeWardenArea.json',
        ),
        'CC' => array(
            'title' => 'CC Areas',
            'role' => 'manage_options', // Custom role
            'path' => MAPDATA . '/CC/CarbonCutterArea.json',
        )
    );
    $user = wp_get_current_user(); // Get the current user

    $filtered_lists = array();
    foreach ($lists as $list_id => $list_data) {
        if ( user_can( $user, $list_data['role'] ) ) { // Check user capability
            $filtered_lists[$list_id] = $list_data;
        }
    }

    return $filtered_lists;
}

function get_act_map_list_by_id($list_id) {
    $lists = get_act_map_lists(); // Now uses the filtered list.
    return isset($lists[$list_id]) ? $lists[$list_id] : null;
}
function act_map_check_list_access($list_id) {
    $list_data = get_act_map_list_by_id($list_id);

    if (!$list_data) {
        return false; // List not found
    }

    if (!is_user_logged_in()) {
       return false; // Not logged in
    }

    $user = wp_get_current_user();
    if (!user_can($user, $list_data['role'])) {
        return false; // Insufficient permissions
    }

    return true; // Access granted
}
?>
