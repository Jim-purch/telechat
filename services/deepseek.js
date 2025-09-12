const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = 'deepseek-chat';
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY 环境变量未设置');
    }
  }

  /**
   * 生成AI回复
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID（可选）
   * @param {string} systemPrompt - 自定义系统提示词（可选）
   * @param {number} contextCount - 上下文条数（可选）
   * @param {Array} conversationHistory - 对话历史（可选）
   * @returns {Promise<string>} AI回复文本
   */
  async generateResponse(message, userId = null, systemPrompt = null, contextCount = 10, conversationHistory = []) {
    try {
      // 使用自定义系统提示词或默认提示词
      const defaultSystemPrompt = '你是一个友善、有帮助的AI助手。请用简洁、自然的中文回复用户的问题。回复长度控制在200字以内，适合语音播报。';
      const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
      
      // 限制对话历史长度
      const limitedHistory = conversationHistory.slice(-contextCount * 2); // 每轮对话包含用户和助手消息
      
      // 构建消息数组
      const messages = [
        {
          role: 'system',
          content: finalSystemPrompt
        },
        ...limitedHistory,
        {
          role: 'user',
          content: message
        }
      ];
      
      if (userId) {
        console.log(`为用户 ${userId} 生成回复，使用 ${limitedHistory.length} 条历史消息`);
      }

      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60秒超时
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const aiReply = response.data.choices[0].message.content.trim();
        
        // 限制回复长度
        const maxLength = parseInt(process.env.MAX_MESSAGE_LENGTH) || 4000;
        if (aiReply.length > maxLength) {
          return aiReply.substring(0, maxLength) + '...';
        }
        
        return aiReply;
      } else {
        throw new Error('DeepSeek API 返回了无效的响应格式');
      }

    } catch (error) {
      console.error('DeepSeek API 调用失败:', error.message);
      
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
        
        if (error.response.status === 401) {
          throw new Error('DeepSeek API 密钥无效或已过期');
        } else if (error.response.status === 429) {
          throw new Error('DeepSeek API 请求频率超限，请稍后再试');
        } else if (error.response.status >= 500) {
          throw new Error('DeepSeek 服务器错误，请稍后再试');
        }
      }
      
      throw new Error(`DeepSeek API 调用失败: ${error.message}`);
    }
  }

  /**
   * 检查API连接状态
   * @returns {Promise<boolean>} 连接是否正常
   */
  async checkConnection() {
    try {
      await this.generateResponse('测试连接');
      return true;
    } catch (error) {
      console.error('DeepSeek 连接检查失败:', error.message);
      return false;
    }
  }
}

module.exports = { DeepSeekService };