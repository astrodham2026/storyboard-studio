<?php
/**
 * Storyboard Studio - Lightweight PHP Backend Saver
 * Compatible with PHP 7.4+, standard Linux/Windows Web Hosts, MariaDB/MySQL or File JSON Storage.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$storageDir = __DIR__ . '/data';
if (!file_exists($storageDir)) {
    @mkdir($storageDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || empty($data['storyName'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid story payload']);
        exit;
    }
    
    $filename = 'storyboard_' . md5($data['storyName']) . '.json';
    $filepath = $storageDir . '/' . $filename;
    
    if (file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode(['status' => 'success', 'message' => 'Storyboard saved on hosting server!', 'id' => md5($data['storyName'])]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to write file to disk']);
    }
} elseif ($method === 'GET') {
    $id = isset($_GET['id']) ? preg_replace('/[^a-f0-9]/', '', $_GET['id']) : '';
    if (!$id) {
        // Return list of saved stories
        $files = glob($storageDir . '/storyboard_*.json');
        $stories = [];
        foreach ($files as $file) {
            $content = json_decode(file_get_contents($file), true);
            if ($content) {
                $stories[] = [
                    'id' => md5($content['storyName']),
                    'storyName' => $content['storyName'] ?? 'Untitled',
                    'sceneCount' => count($content['scenes'] ?? [])
                ];
            }
        }
        echo json_encode(['status' => 'success', 'stories' => $stories]);
        exit;
    }
    
    $filepath = $storageDir . '/storyboard_' . $id . '.json';
    if (file_exists($filepath)) {
        echo file_get_contents($filepath);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Storyboard not found']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Unsupported method']);
}
