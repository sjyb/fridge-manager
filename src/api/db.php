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
// 从环境变量获取数据库配置 - 群晖本地数据库
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'fridge_manager';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASSWORD') ?: '';
$dbPort = getenv('DB_PORT') ?: '3306';

  try {
    // 连接MariaDB数据库
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
    $db = new PDO($dsn, $dbUser, $dbPass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 检查表是否存在，如果不存在则创建
    $tables = [
        'foods' => "CREATE TABLE IF NOT EXISTS foods (
            id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(255) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            initialQuantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(255) NOT NULL,
            position VARCHAR(255) NOT NULL,
            expiryDate VARCHAR(255) NOT NULL,
            image VARCHAR(255) DEFAULT NULL,
            status VARCHAR(255) NOT NULL,
            cooked TINYINT DEFAULT 0,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        
        'food_logs' => "CREATE TABLE IF NOT EXISTS food_logs (
            id INT NOT NULL AUTO_INCREMENT,
            action VARCHAR(255) NOT NULL,
            food VARCHAR(255) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(255) NOT NULL,
            date VARCHAR(255) NOT NULL,
            consumedRatio VARCHAR(255) DEFAULT NULL,
            remainingAmount DECIMAL(10,2) DEFAULT NULL,
            position VARCHAR(255) DEFAULT NULL,
            initialQuantity DECIMAL(10,2) DEFAULT NULL,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    ];
    
    foreach ($tables as $table => $sql) {
        $db->exec($sql);
    }

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
            $stmt->execute();
            
            $logs = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // 确保日期格式正确
                $row['date'] = date('c', strtotime($row['date'])); // ISO 8601格式
                $logs[] = $row;
            }
                
                echo json_encode($logs ?: []);
            } else {
            // 获取所有食物
            $stmt = $db->query("SELECT * FROM foods");
            
            $foods = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
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
            $stmt = $db->prepare("INSERT INTO foods (
                id, name, type, quantity, initialQuantity, unit, 
                position, expiryDate, image, status, cooked
            ) VALUES (
                :id, :name, :type, :quantity, :initialQuantity, :unit, 
                :position, :expiryDate, :image, :status, :cooked
            )");
            
            foreach ($input as $food) {
                $stmt->execute([
                    ':id' => $food['id'],
                    ':name' => $food['name'],
                    ':type' => $food['type'],
                    ':quantity' => $food['quantity'],
                    ':initialQuantity' => $food['initialQuantity'] ?? $food['quantity'],
                    ':unit' => $food['unit'],
                    ':position' => $food['position'],
                    ':expiryDate' => $food['expiryDate'],
                    ':image' => $food['image'] ?? null,
                    ':status' => $food['status'],
                    ':cooked' => $food['cooked'] ?? 0
                ]);
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
                $stmt->execute([
                    ':id' => $food['id'],
                    ':quantity' => $food['quantity']
                ]);
        }
        
        $db->exec('COMMIT');
        echo json_encode(['status' => 'success']);
    }

  // 添加操作日志
  if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $db->exec('BEGIN TRANSACTION');
    
    try {
      $stmt = $db->prepare("INSERT INTO food_logs (
          action, food, quantity, unit, date, consumedRatio, 
          remainingAmount, position, initialQuantity
      ) VALUES (
          :action, :food, :quantity, :unit, :date, :consumedRatio, 
          :remainingAmount, :position, :initialQuantity
      )");
       
       $stmt->execute([
           ':action' => $input['action'],
           ':food' => $input['food'],
           ':quantity' => $input['quantity'],
           ':unit' => $input['unit'],
           ':date' => $input['date'] ?? date('Y-m-d H:i:s'),
           ':consumedRatio' => $input['consumedRatio'] ?? null,
           ':remainingAmount' => $input['remainingAmount'] ?? null,
           ':position' => $input['position'] ?? null,
           ':initialQuantity' => $input['initialQuantity'] ?? $input['quantity']
       ]);
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

    // PDO连接会在脚本结束时自动关闭，无需显式关闭
}
?>