<?php
// 安全配置
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

// 生成CSRF令牌
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// 验证CSRF令牌
function validateCsrfToken($token) {
    return hash_equals($_SESSION['csrf_token'], $token);
}

require_once __DIR__ . '/security.php';
// 数据库文件路径
$dbPath = __DIR__ . '/../../fridge.db';

try {
    // 连接SQLite数据库
    $db = new SQLite3($dbPath);
    $db->enableExceptions(true);

    // 创建表（如果不存在）
    $db->exec('CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        initialQuantity INTEGER NOT NULL,
        unit TEXT NOT NULL,
        position TEXT NOT NULL,
        expiryDate TEXT NOT NULL,
        image TEXT,
        status TEXT NOT NULL,
        cooked INTEGER DEFAULT 0
    )');

    // 创建操作日志表
    $db->exec('CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        food TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        date TEXT NOT NULL,
        consumedRatio TEXT,
        remainingAmount REAL
    )');

    // 获取数据
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // 设置响应头为JSON
        header('Content-Type: application/json');
        
        // 检查是否有action参数
        $action = $_GET['action'] ?? null;
        
        try {
            if ($action) {
                // 解码中文action
                $action = urldecode($action);
                // 获取特定类型的日志
                $stmt = $db->prepare("SELECT * FROM food_logs WHERE action = :action ORDER BY date DESC");
                $stmt->bindValue(':action', $action);
                $result = $stmt->execute();
                
                $logs = array();
                while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                    // 确保日期格式正确
                    $row['date'] = date('c', strtotime($row['date'])); // ISO 8601格式
                    $logs[] = $row;
                }
                
                echo json_encode($logs ?: []);
            } else {
                // 获取所有食物
                $result = $db->query("SELECT * FROM foods");
                
                $foods = array();
                while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                    $foods[] = $row;
                }
                echo json_encode($foods ?: []);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 保存或更新食物数据
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $db->exec('BEGIN TRANSACTION');
        
        // 先清空表
        $db->exec("DELETE FROM foods");
        
        // 准备插入语句
        $stmt = $db->prepare("INSERT INTO foods VALUES (
            :id, :name, :type, :quantity, :initialQuantity, :unit, 
            :position, :expiryDate, :image, :status, :cooked
        )");
        
        foreach ($input as $food) {
            foreach ($food as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->execute();
        }
        
        $db->exec('COMMIT');
        echo json_encode(['status' => 'success']);
    }

    // 清空数据库
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $db->exec('BEGIN TRANSACTION');
        $db->exec("DELETE FROM foods");
        $db->exec("DELETE FROM food_logs");
        $db->exec('COMMIT');
        echo json_encode(['status' => 'success']);
    }

    // 更新单个食物数量
    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $db->exec('BEGIN TRANSACTION');
        $stmt = $db->prepare("UPDATE foods SET quantity = :quantity WHERE id = :id");
        
        foreach ($input as $food) {
            $stmt->bindValue(':id', $food['id']);
            $stmt->bindValue(':quantity', $food['quantity']);
            $stmt->execute();
        }
        
        $db->exec('COMMIT');
        echo json_encode(['status' => 'success']);
    }

  // 添加操作日志
  if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $db->exec('BEGIN TRANSACTION');
    
    try {
      $stmt = $db->prepare("INSERT INTO food_logs (action, food, quantity, unit, date, consumedRatio, remainingAmount, position, initialQuantity) 
                           VALUES (:action, :food, :quantity, :unit, :date, :consumedRatio, :remainingAmount, :position, :initialQuantity)");
      
      $stmt->bindValue(':action', $input['action']);
      $stmt->bindValue(':food', $input['food']);
      $stmt->bindValue(':quantity', $input['quantity']);
      $stmt->bindValue(':unit', $input['unit']);
      $stmt->bindValue(':date', $input['date'] ?? date('Y-m-d H:i:s'));
      $stmt->bindValue(':consumedRatio', $input['consumedRatio'] ?? null);
      $stmt->bindValue(':remainingAmount', $input['remainingAmount'] ?? null);
      $stmt->bindValue(':position', $input['position'] ?? null);
      $stmt->bindValue(':initialQuantity', $input['initialQuantity'] ?? $input['quantity']);
      
      $stmt->execute();
      $db->exec('COMMIT');
      echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
      $db->exec('ROLLBACK');
      http_response_code(500);
      echo json_encode(['error' => $e->getMessage()]);
    }
  }

} catch (Exception $e) {
    if (isset($db)) {
        $db->exec('ROLLBACK');
    }
    file_put_contents('php://stderr', 'Database error: ' . $e->getMessage());
    // 确保返回JSON格式的错误响应
    // 确保返回JSON格式的错误响应
    if (!headers_sent()) {
      header('Content-Type: application/json');
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

// 关闭数据库连接
if (isset($db)) {
    $db->close();
}
?>