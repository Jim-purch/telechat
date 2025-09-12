const fs = require('fs-extra');
const path = require('path');

class FileManager {
  constructor() {
    this.tempDir = process.env.TEMP_DIR || './temp';
    // 确保临时目录存在
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * 删除文件
   * @param {string} filePath - 要删除的文件路径
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteFile(filePath) {
    try {
      await fs.remove(filePath);
      console.log(`文件已删除: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`删除文件失败 ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件大小
   * @param {string} filePath - 文件路径
   * @returns {Promise<number>} 文件大小（字节）
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      console.error(`获取文件大小失败 ${filePath}:`, error.message);
      return 0;
    }
  }

  /**
   * 创建临时文件路径
   * @param {string} extension - 文件扩展名（包含点号）
   * @returns {string} 临时文件路径
   */
  createTempFilePath(extension = '.tmp') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const fileName = `temp_${timestamp}_${random}${extension}`;
    return path.join(this.tempDir, fileName);
  }

  /**
   * 清理临时目录中的旧文件
   * @param {number} maxAge - 文件最大保留时间（毫秒），默认1小时
   * @returns {Promise<number>} 清理的文件数量
   */
  async cleanupTempFiles(maxAge = 3600000) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.remove(filePath);
            console.log(`已清理过期临时文件: ${file}`);
            cleanedCount++;
          }
        } catch (error) {
          console.error(`处理文件 ${file} 时出错:`, error.message);
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('清理临时文件失败:', error.message);
      return 0;
    }
  }

  /**
   * 获取临时目录信息
   * @returns {Promise<Object>} 目录信息
   */
  async getTempDirInfo() {
    try {
      const files = await fs.readdir(this.tempDir);
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          console.error(`获取文件信息失败 ${file}:`, error.message);
        }
      }
      
      return {
        path: this.tempDir,
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      console.error('获取临时目录信息失败:', error.message);
      return {
        path: this.tempDir,
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00'
      };
    }
  }

  /**
   * 复制文件
   * @param {string} src - 源文件路径
   * @param {string} dest - 目标文件路径
   * @returns {Promise<boolean>} 复制是否成功
   */
  async copyFile(src, dest) {
    try {
      await fs.copy(src, dest);
      console.log(`文件已复制: ${src} -> ${dest}`);
      return true;
    } catch (error) {
      console.error(`复制文件失败 ${src} -> ${dest}:`, error.message);
      return false;
    }
  }

  /**
   * 移动文件
   * @param {string} src - 源文件路径
   * @param {string} dest - 目标文件路径
   * @returns {Promise<boolean>} 移动是否成功
   */
  async moveFile(src, dest) {
    try {
      await fs.move(src, dest);
      console.log(`文件已移动: ${src} -> ${dest}`);
      return true;
    } catch (error) {
      console.error(`移动文件失败 ${src} -> ${dest}:`, error.message);
      return false;
    }
  }
}

module.exports = { FileManager };