<?php
// 输入验证函数
function validateInput($input, $type = 'string', $maxLength = 255) {
    switch ($type) {
        case 'int':
            return filter_var($input, FILTER_VALIDATE_INT) !== false;
        case 'float':
            return filter_var($input, FILTER_VALIDATE_FLOAT) !== false;
        case 'email':
            return filter_var($input, FILTER_VALIDATE_EMAIL) !== false;
        case 'url':
            return filter_var($input, FILTER_VALIDATE_URL) !== false;
        case 'date':
            return DateTime::createFromFormat('Y-m-d', $input) !== false;
        default:
            return is_string($input) && mb_strlen($input) <= $maxLength;
    }
}

// XSS防护
function xssClean($data) {
    if (is_array($data)) {
        return array_map('xssClean', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// SQL注入防护
function sqlEscape($db, $data) {
    if (is_array($data)) {
        return array_map(function($item) use ($db) {
            return sqlEscape($db, $item);
        }, $data);
    }
    return $db->escapeString($data);
}

// 速率限制
class RateLimiter {
    private $limit;
    private $interval;
    
    public function __construct($limit = 100, $interval = 60) {
        $this->limit = $limit;
        $this->interval = $interval;
    }
    
    public function check($key) {
        $now = time();
        $redis = new Redis();
        $redis->connect('127.0.0.1', 6379);
        
        $redis->multi();
        $redis->zRemRangeByScore($key, 0, $now - $this->interval);
        $redis->zAdd($key, $now, $now);
        $redis->expire($key, $this->interval);
        $count = $redis->zCard($key);
        $redis->exec();
        
        return $count <= $this->limit;
    }
}
?>