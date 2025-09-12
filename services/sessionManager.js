const fs = require('fs-extra');
const path = require('path');

class SessionManager {
  constructor() {
    this.sessionsFile = path.join(__dirname, '../data/sessions.json');
    this.sessions = {};
    this.loadSessions();
  }

  /**
   * 加载会话数据
   */
  loadSessions() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        this.sessions = JSON.parse(data) || {};
      }
    } catch (error) {
      console.error('加载会话数据失败:', error);
      this.sessions = {};
    }
  }

  /**
   * 保存会话数据
   */
  saveSessions() {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('保存会话数据失败:', error);
    }
  }

  /**
   * 获取用户的对话历史
   * @param {string} userId - 用户ID
   * @param {number} maxMessages - 最大消息数量（默认20条）
   * @returns {Array} 对话历史数组
   */
  getConversationHistory(userId, maxMessages = 20) {
    if (!this.sessions[userId]) {
      return [];
    }
    
    const history = this.sessions[userId].messages || [];
    // 返回最近的消息，确保是偶数个（用户-助手对）
    const recentMessages = history.slice(-maxMessages);
    
    // 如果第一条消息是助手消息，则移除它以保持用户-助手的配对
    if (recentMessages.length > 0 && recentMessages[0].role === 'assistant') {
      recentMessages.shift();
    }
    
    return recentMessages;
  }

  /**
   * 添加用户消息到历史记录
   * @param {string} userId - 用户ID
   * @param {string} message - 用户消息
   */
  addUserMessage(userId, message) {
    if (!this.sessions[userId]) {
      this.sessions[userId] = {
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    }

    this.sessions[userId].messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    this.sessions[userId].lastActivity = new Date().toISOString();
    this.saveSessions();
  }

  /**
   * 添加助手回复到历史记录
   * @param {string} userId - 用户ID
   * @param {string} response - 助手回复
   */
  addAssistantMessage(userId, response) {
    if (!this.sessions[userId]) {
      this.sessions[userId] = {
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    }

    this.sessions[userId].messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    this.sessions[userId].lastActivity = new Date().toISOString();
    this.saveSessions();
  }

  /**
   * 清除用户的对话历史
   * @param {string} userId - 用户ID
   */
  clearUserHistory(userId) {
    if (this.sessions[userId]) {
      this.sessions[userId].messages = [];
      this.sessions[userId].lastActivity = new Date().toISOString();
      this.saveSessions();
      console.log(`✅ 用户 ${userId} 的对话历史已清除`);
    }
  }

  /**
   * 获取用户会话统计信息
   * @param {string} userId - 用户ID
   * @returns {Object} 会话统计信息
   */
  getUserSessionStats(userId) {
    if (!this.sessions[userId]) {
      return {
        messageCount: 0,
        createdAt: null,
        lastActivity: null
      };
    }

    const session = this.sessions[userId];
    return {
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }

  /**
   * 清理过期的会话数据（超过30天未活动）
   */
  cleanupOldSessions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let cleanedCount = 0;
    
    for (const userId in this.sessions) {
      const lastActivity = new Date(this.sessions[userId].lastActivity);
      if (lastActivity < thirtyDaysAgo) {
        delete this.sessions[userId];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveSessions();
      console.log(`🧹 清理了 ${cleanedCount} 个过期会话`);
    }
  }
}

module.exports = SessionManager;