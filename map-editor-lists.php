<?php
function act_maps_user_has_list_permission($user_login, $list_id) {
    // Construct the option key used in your settings page (e.g., act-maps-edit-WW)
    $option_key = 'act-maps-edit-' . $list_id;
    $raw_editors = get_option($option_key, '');

    if (empty($raw_editors)) {
        return false;
    }

    // Convert "vicky, julesww" into an array and clean up whitespace
    $allowed_users = array_map('trim', explode(',', strtolower($raw_editors)));
//error_log('Allowwed users '. var_export($allowed_users, true));
    return in_array(strtolower($user_login), $allowed_users);
}
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
        $is_edit_user = act_maps_user_has_list_permission($user->user_login, $list_id);
//error_log(' checking user '.$user->user_login.' can access '. $list_id. ' result '. $is_edit_user);
        if ( user_can( $user, $list_data['role'] ) || $is_edit_user) { // Check user capability
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
error_log('$list_data was : ' . var_export($list_data, true));
    if (!$list_data) {
        return false; // List not found
    }

    if (!is_user_logged_in()) {
       return false; // Not logged in
    }

    $user = wp_get_current_user();
error_log('Current user is ' . $user->user_login);
    if ( act_maps_user_has_list_permission($user->user_login, $list_id)) {
error_log('act_map_check_list_access says user ' . $user->user_login. ' can access '. $list_id);
        return true;
    }
error_log('user does not have permissions');
    if (!user_can($user, $list_data['role'])) {
        return false; // Insufficient permissions
    }

    return true; // Access granted
}
?>
