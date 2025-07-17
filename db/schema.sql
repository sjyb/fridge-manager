-- 创建数据库
CREATE DATABASE IF NOT EXISTS fridge_manager;

-- 使用数据库
USE fridge_manager;

-- 创建食物表
CREATE TABLE IF NOT EXISTS foods (
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  initialQuantity INT NOT NULL,
  unit VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  expiryDate VARCHAR(255) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  status VARCHAR(255) NOT NULL,
  cooked TINYINT DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建食物日志表
CREATE TABLE IF NOT EXISTS food_logs (
  id INT NOT NULL AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  food VARCHAR(255) NOT NULL,
  quantity FLOAT NOT NULL,
  unit VARCHAR(255) NOT NULL,
  date VARCHAR(255) NOT NULL,
  consumedRatio VARCHAR(255) DEFAULT NULL,
  remainingAmount FLOAT DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建初始用户
CREATE USER IF NOT EXISTS 'fridge_user'@'%' IDENTIFIED BY 'fridge_password';
GRANT ALL PRIVILEGES ON fridge_manager.* TO 'fridge_user'@'%';
FLUSH PRIVILEGES;
