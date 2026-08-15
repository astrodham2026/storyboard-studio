<?php
/**
 * Storyboard Studio - Persistent Cloud Storage API
 * Compatible with PHP 7.4+, standard Linux/cPanel hosting, MySQL/MariaDB or File Storage.
 * Persists all stories directly on the website server so data is accessible anywhere on promptee.site.
 */

ini_set('memory_limit', '512M');
ini_set('post_max_size', '128M');
ini_set('upload_max_filesize', '128M');

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

$allStoriesFile = $storageDir . '/stories_all.json';
$backupFile     = $storageDir . '/stories_backup.json';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    if (!$input || strlen($input) === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Empty request payload']);
        exit;
    }
    
    $data = json_decode($input, true);
    
    if (!$data) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload format']);
        exit;
    }
    
    $action = $data['action'] ?? 'save_all';
    
    if ($action === 'save_all' && isset($data['stories']) && is_array($data['stories'])) {
        $stories = $data['stories'];
        $json = json_encode($stories, JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
        
        $saved = file_put_contents($allStoriesFile, $json, LOCK_EX);
        if ($saved !== false) {
            @file_put_contents($backupFile, $json, LOCK_EX);
            echo json_encode(['status' => 'success', 'message' => 'All content auto-saved on promptee.site server!', 'count' => count($stories)]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to write data file to server disk']);
        }
        exit;
    }
    
    if ($action === 'delete_story' && !empty($data['id'])) {
        $targetId = $data['id'];
        $existing = [];
        if (file_exists($allStoriesFile)) {
            $existing = json_decode(file_get_contents($allStoriesFile), true) ?: [];
        }
        $filtered = array_values(array_filter($existing, function($s) use ($targetId) {
            return ($s['id'] ?? '') !== $targetId;
        }));
        $json = json_encode($filtered, JSON_PRETTY_PRINT);
        file_put_contents($allStoriesFile, $json, LOCK_EX);
        @file_put_contents($backupFile, $json, LOCK_EX);
        echo json_encode(['status' => 'success', 'message' => 'Story deleted from server persistence']);
        exit;
    }
    
    // Fallback single story save
    if (isset($data['storyName'])) {
        $existing = [];
        if (file_exists($allStoriesFile)) {
            $existing = json_decode(file_get_contents($allStoriesFile), true) ?: [];
        }
        $found = false;
        $storyId = $data['id'] ?? ('story_' . time());
        $data['id'] = $storyId;
        
        foreach ($existing as $idx => $s) {
            if (($s['id'] ?? '') === $storyId) {
                $existing[$idx] = $data;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $existing[] = $data;
        }
        
        $json = json_encode($existing, JSON_PRETTY_PRINT);
        file_put_contents($allStoriesFile, $json, LOCK_EX);
        @file_put_contents($backupFile, $json, LOCK_EX);
        echo json_encode(['status' => 'success', 'message' => 'Content saved on hosting server!', 'id' => $storyId]);
        exit;
    }
    
    echo json_encode(['status' => 'error', 'message' => 'Unknown action or invalid payload']);
    exit;

} elseif ($method === 'GET') {
    if (file_exists($allStoriesFile)) {
        $content = file_get_contents($allStoriesFile);
        $stories = json_decode($content, true);
        if ($stories !== null) {
            echo json_encode(['status' => 'success', 'stories' => $stories]);
            exit;
        }
    }
    
    // Backup fallback
    if (file_exists($backupFile)) {
        $content = file_get_contents($backupFile);
        $stories = json_decode($content, true);
        if ($stories !== null) {
            echo json_encode(['status' => 'success', 'stories' => $stories]);
            exit;
        }
    }
    
    echo json_encode(['status' => 'success', 'stories' => []]);
    exit;

} else {
    echo json_encode(['status' => 'error', 'message' => 'Unsupported HTTP method']);
}
