<?php
// proxy.php, located in your plugin directory on test.actionclimateteignbridge.org
// This block of code finds the WordPress root directory.
$root_dir = dirname(__FILE__);
do {
    if (file_exists($root_dir . '/wp-config.php')) {
        require_once($root_dir . '/wp-config.php');
        break;
    }
    $root_dir = dirname($root_dir);
} while ($root_dir && $root_dir !== '/' && strlen($root_dir) > 1);

// Continue only if wp-config.php was found.
if (!defined('ABSPATH')) {
    http_response_code(500);
    echo json_encode(['error' => 'WordPress environment could not be loaded.']);
    exit;
}
// Set CORS header to allow the client (the iframe) to receive the response.
//header("Access-Control-Allow-Origin: *");
// The above makes it more susceptible to DDOS attacks.
header('Content-Type: application/json');

$layer_id = isset($_GET['layer']) ? $_GET['layer'] : '';

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $layer_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid layer ID.']);
    exit;
}
// Ensure the necessary constants are defined
if (!defined('MAPDATA') || !defined('LISTS_DIR')) {
    http_response_code(500);
    echo json_encode(['error' => 'Required file path constants are not defined.']);
    exit;
}

// **New Logic:** Construct a local file path to the main domain's directory.
// This path is relative to the directory of the currently executing script.
$main_domain_root = MAPDATA;
$mapping_file_path = MAPDATA . 'layers.json';

if (!file_exists($mapping_file_path)) {
    http_response_code(500);
    echo json_encode(['error' => 'Mapping file not found on server.']);
    exit;
}

$mapping_data = json_decode(file_get_contents($mapping_file_path), true);
if (empty($mapping_data[$layer_id])) {
    http_response_code(404);
    echo json_encode(['error' => 'Layer not found in mapping file.']);
    exit;
}

$layer_info = $mapping_data[$layer_id];

if ($layer_info['location'] === 'remote') {
    if (empty($layer_info['url'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Remote URL not specified for layer.']);
        exit;
    }
    
    // Fetch from a truly remote server via a full HTTP request.
    $url = $layer_info['url'];
    $content = @file_get_contents($url);
    
    if ($content === false) {
        http_response_code(404);
        echo json_encode(['error' => 'Remote file could not be fetched.']);
    } else {
        echo $content;
    }
} else { // 'local'
    if (empty($layer_info['path'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Local path not specified for layer.']);
        exit;
    }
    
    // **New Logic:** Construct the local file path and read it directly.
    $file_path = $main_domain_root . $layer_info['path'];
    if (file_exists($file_path)) {
        echo file_get_contents($file_path);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Local file '.$file_path.' not found on server.']);
    }
}
?>
