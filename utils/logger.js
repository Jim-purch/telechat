const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = './logs';
    this.logFile = path.join(this.logDir, 'bot.log');
    this.errorFile = path.join(this.logDir, 'error.log');
    
    // 确保日志目录存在
    fs.ensureDirSync(this.logDir);
  }

  /**
   * 格式化时间戳
   * @returns {string} 格式化的时间字符串
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 写入日志到文件
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {string} filePath - 日志文件路径
   */
  async writeToFile(level, message, filePath) {
    try {
      const timestamp = this.getTimestamp();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
      await fs.appendFile(filePath, logEntry);
    } catch (error) {
      console.error('写入日志文件失败:', error.message);
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {...any} args - 额外参数
   */
  info(message, ...args) {
    const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
    console.log(`ℹ️  ${fullMessage}`);
    this.writeToFile('info', fullMessage, this.logFile);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {...any} args - 额外参数
   */
  warn(message, ...args) {
    const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
    console.warn(`⚠️  ${fullMessage}`);
    this.writeToFile('warn', fullMessage, this.logFile);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error|any} error - 错误对象或额外参数
   */
  error(message, error = null) {
    let fullMessage = message;
    
    if (error) {
      if (error instanceof Error) {
        fullMessage += ` - ${error.message}`;
        if (error.stack) {
          fullMessage += `\n堆栈跟踪: ${error.stack}`;
        }
      } else {
        fullMessage += ` - ${error}`;
      }
    }
    
    console.error(`❌ ${fullMessage}`);
    this.writeToFile('error', fullMessage, this.errorFile);
    this.writeToFile('error', fullMessage, this.logFile);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {...any} args - 额外参数
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
      console.log(`🐛 ${fullMessage}`);
      this.writeToFile('debug', fullMessage, this.logFile);
    }
  }

  /**
   * 记录成功日志
   * @param {string} message - 日志消息
   * @param {...any} args - 额外参数
   */
  success(message, ...args) {
    const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
    console.log(`✅ ${fullMessage}`);
    this.writeToFile('success', fullMessage, this.logFile);
  }

  /**
   * 清理旧日志文件
   * @param {number} maxAge - 文件最大保留时间（毫秒），默认7天
   * @returns {Promise<number>} 清理的文件数量
   */
  async cleanupOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const file of files) {
        // 跳过当前的主日志文件
        if (file === 'bot.log' || file === 'error.log') {
          continue;
        }
        
        const filePath = path.join(this.logDir, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.remove(filePath);
            this.info(`已清理过期日志文件: ${file}`);
            cleanedCount++;
          }
        } catch (error) {
          this.error(`处理日志文件 ${file} 时出错`, error);
        }
      }
      
      return cleanedCount;
    } catch (error) {
      this.error('清理旧日志文件失败', error);
      return 0;
    }
  }

  /**
   * 轮转日志文件
   * @param {number} maxSize - 最大文件大小（字节），默认10MB
   */
  async rotateLogFile(maxSize = 10 * 1024 * 1024) {
    try {
      const stats = await fs.stat(this.logFile);
      
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = path.join(this.logDir, `bot_${timestamp}.log`);
        
        await fs.move(this.logFile, rotatedFile);
        this.info(`日志文件已轮转: ${rotatedFile}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.error('轮转日志文件失败', error);
      }
    }
  }

  /**
   * 获取日志统计信息
   * @returns {Promise<Object>} 日志统计
   */
  async getLogStats() {
    try {
      const files = await fs.readdir(this.logDir);
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          // 忽略单个文件的错误
        }
      }
      
      return {
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      this.error('获取日志统计失败', error);
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00'
      };
    }
  }
}

module.exports = { Logger };