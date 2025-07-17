<?php
/**
 * SQLite to MariaDB数据迁移脚本
 * 用于将冰箱管家应用的数据从SQLite迁移到MariaDB
 */

// 解析命令行参数
$options = getopt('', [
    'sqlite:',
    'mysql-host:',
    'mysql-port:',
    'mysql-db:',
    'mysql-user:',
    'mysql-pass:'
]);

// 验证参数
$requiredOptions = ['sqlite', 'mysql-host', 'mysql-port', 'mysql-db', 'mysql-user', 'mysql-pass'];
foreach ($requiredOptions as $option) {
    if (!isset($options[$option])) {
        die("错误: 缺少必要参数 --$option\n");
    }
}

// 数据库连接信息
$sqlitePath = $options['sqlite'];
$mysqlHost = $options['mysql-host'];
$mysqlPort = $options['mysql-port'];
$mysqlDb = $options['mysql-db'];
$mysqlUser = $options['mysql-user'];
$mysqlPass = $options['mysql-pass'];

try {
    // 连接SQLite数据库
    echo "正在连接SQLite数据库: $sqlitePath\n";
    $sqlite = new SQLite3($sqlitePath);
    $sqlite->enableExceptions(true);
    
    // 连接MariaDB数据库
    echo "正在连接MariaDB数据库: $mysqlHost:$mysqlPort/$mysqlDb\n";
    $dsn = "mysql:host=$mysqlHost;port=$mysqlPort;dbname=$mysqlDb;charset=utf8mb4";
    $mariaDb = new PDO($dsn, $mysqlUser, $mysqlPass);
    $mariaDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 开始事务
    $mariaDb->beginTransaction();
    
    // 迁移foods表数据
    echo "正在迁移foods表数据...\n";
    $sqliteStmt = $sqlite->query("SELECT * FROM foods");
    $mariaStmt = $mariaDb->prepare("INSERT IGNORE INTO foods (
        id, name, type, quantity, initialQuantity, unit, 
        position, expiryDate, image, status, cooked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $foodCount = 0;
    while ($row = $sqliteStmt->fetchArray(SQLITE3_ASSOC)) {
        $mariaStmt->execute([
            $row['id'],
            $row['name'],
            $row['type'],
            $row['quantity'],
            $row['initialQuantity'] ?? $row['quantity'],
            $row['unit'],
            $row['position'],
            $row['expiryDate'],
            $row['image'] ?? null,
            $row['status'],
            $row['cooked'] ?? 0
        ]);
        $foodCount++;
    }
    echo "成功迁移 $foodCount 条食物记录\n";
    
    // 迁移food_logs表数据
    echo "正在迁移food_logs表数据...\n";
    $sqliteStmt = $sqlite->query("SELECT * FROM food_logs");
    $mariaStmt = $mariaDb->prepare("INSERT IGNORE INTO food_logs (
        id, action, food, quantity, unit, date, consumedRatio, 
        remainingAmount, position, initialQuantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $logCount = 0;
    while ($row = $sqliteStmt->fetchArray(SQLITE3_ASSOC)) {
        $mariaStmt->execute([
            $row['id'],
            $row['action'],
            $row['food'],
            $row['quantity'],
            $row['unit'],
            $row['date'],
            $row['consumedRatio'] ?? null,
            $row['remainingAmount'] ?? null,
            $row['position'] ?? null,
            $row['initialQuantity'] ?? null
        ]);
        $logCount++;
    }
    echo "成功迁移 $logCount 条日志记录\n";
    
    // 提交事务
    $mariaDb->commit();
    echo "数据迁移完成！\n";
    
} catch (Exception $e) {
    if (isset($mariaDb)) {
        $mariaDb->rollBack();
    }
    echo "迁移失败: " . $e->getMessage() . "\n";
    exit(1);
} finally {
    if (isset($sqlite)) {
        $sqlite->close();
    }
}
?>