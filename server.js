import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/client')));

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'fridge_manager',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 初始化数据库表
async function initDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // 创建食物表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS foods (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // 创建食物日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS food_logs (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('数据库表初始化成功');
  } catch (error) {
    console.error('数据库表初始化失败:', error);
  } finally {
    connection.release();
  }
}

// API路由 - 获取所有食物
app.get('/api/foods', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM foods');
    res.json(rows);
  } catch (error) {
    console.error('获取食物数据失败:', error);
    res.status(500).json({ status: 'error', message: '获取食物数据失败' });
  }
});

// API路由 - 添加食物
app.post('/api/foods', async (req, res) => {
  try {
    const foods = req.body;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 先清空表
      await connection.execute('DELETE FROM foods');
      
      // 批量插入食物
      const sql = `
        INSERT INTO foods (
          id, name, type, quantity, initialQuantity, unit, 
          position, expiryDate, image, status, cooked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      for (const food of foods) {
        await connection.execute(sql, [
          food.id,
          food.name,
          food.type,
          food.quantity,
          food.initialQuantity || food.quantity,
          food.unit,
          food.position,
          food.expiryDate,
          food.image || null,
          food.status,
          food.cooked || 0
        ]);
      }
      
      await connection.commit();
      res.json({ status: 'success' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('保存食物数据失败:', error);
    res.status(500).json({ status: 'error', message: '保存食物数据失败' });
  }
});

// API路由 - 更新食物数量
app.patch('/api/foods/quantity', async (req, res) => {
  try {
    const updates = req.body;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const sql = 'UPDATE foods SET quantity = ? WHERE id = ?';
      
      for (const item of updates) {
        await connection.execute(sql, [item.quantity, item.id]);
      }
      
      await connection.commit();
      res.json({ status: 'success' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('更新食物数量失败:', error);
    res.status(500).json({ status: 'error', message: '更新食物数量失败' });
  }
});

// API路由 - 添加操作日志
app.post('/api/logs', async (req, res) => {
  try {
    const logData = req.body;
    const sql = `
      INSERT INTO food_logs (
        action, food, quantity, unit, date, consumedRatio, 
        remainingAmount, position, initialQuantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      logData.action,
      logData.food,
      logData.quantity,
      logData.unit,
      logData.date || new Date().toISOString(),
      logData.consumedRatio || null,
      logData.remainingAmount || null,
      logData.position || null,
      logData.initialQuantity || logData.quantity
    ]);
    
    res.json({ status: 'success', insertId: result.insertId });
  } catch (error) {
    console.error('添加操作日志失败:', error);
    res.status(500).json({ status: 'error', message: '添加操作日志失败' });
  }
});

// API路由 - 获取操作日志
app.get('/api/logs', async (req, res) => {
  try {
    const action = req.query.action;
    let query = 'SELECT * FROM food_logs ORDER BY date DESC';
    
    if (action) {
      query = 'SELECT * FROM food_logs WHERE action = ? ORDER BY date DESC';
      const [rows] = await pool.execute(query, [action]);
      res.json(rows);
    } else {
      const [rows] = await pool.execute(query);
      res.json(rows);
    }
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ status: 'error', message: '获取操作日志失败' });
  }
});

// API路由 - 清空数据库
app.delete('/api/database', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM foods');
      await connection.execute('DELETE FROM food_logs');
      await connection.commit();
      res.json({ status: 'success' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('清空数据库失败:', error);
    res.status(500).json({ status: 'error', message: '清空数据库失败' });
  }
});

// 前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
});

// 启动服务器
async function startServer() {
  await testDbConnection();
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

// 启动应用
startServer();