const fs = require('fs');
const path = require('path');

/**
 * 用户配置管理服务
 * 管理用户的个性化设置：声音模型、上下文条数、系统提示词等
 */
class UserConfigService {
    constructor() {
        this.configDir = path.join(__dirname, '../data');
        this.configFile = path.join(this.configDir, 'userConfigs.json');
        this.defaultConfig = {
            model: 'deepseek', // 默认使用deepseek模型
            voiceModel: 'speech-2.5-turbo-preview',
            voiceId: 'female-shaonv', // 默认中文女声
            contextCount: 30,
            systemPrompt: '你是一个友善、有帮助的AI助手。请用简洁明了的方式回答用户的问题。',
            audioSettings: {
                sample_rate: 32000,
                bitrate: 128000,
                format: 'mp3'
            }
        };
        this.configs = this.loadConfigs();
    }

    /**
     * 确保配置目录存在
     */
    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    /**
     * 加载所有用户配置
     * @returns {Object} 用户配置对象
     */
    loadConfigs() {
        try {
            this.ensureConfigDir();
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ 加载用户配置失败:', error.message);
        }
        return {};
    }

    /**
     * 保存所有用户配置
     */
    saveConfigs() {
        try {
            this.ensureConfigDir();
            fs.writeFileSync(this.configFile, JSON.stringify(this.configs, null, 2), 'utf8');
            console.log('✅ 用户配置已保存');
        } catch (error) {
            console.error('❌ 保存用户配置失败:', error.message);
        }
    }

    /**
     * 获取用户配置
     * @param {string} userId - 用户ID
     * @returns {Object} 用户配置
     */
    getUserConfig(userId) {
        if (!this.configs[userId]) {
            this.configs[userId] = { ...this.defaultConfig };
            this.saveConfigs();
        }
        return this.configs[userId];
    }

    /**
     * 更新用户配置
     * @param {string} userId - 用户ID
     * @param {Object} updates - 要更新的配置项
     */
    updateUserConfig(userId, updates) {
        const currentConfig = this.getUserConfig(userId);
        this.configs[userId] = { ...currentConfig, ...updates };
        this.saveConfigs();
        console.log(`✅ 用户 ${userId} 的配置已更新:`, updates);
    }

    /**
     * 设置用户声音模型
     * @param {string} userId - 用户ID
     * @param {string} voiceModel - 声音模型ID
     * @param {string} voiceId - 声音ID
     */
    setUserVoice(userId, voiceModel, voiceId) {
        this.updateUserConfig(userId, {
            voiceModel: voiceModel,
            voiceId: voiceId
        });
    }

    /**
     * 设置用户上下文条数
     * @param {string} userId - 用户ID
     * @param {number} contextCount - 上下文条数
     */
    setUserContextCount(userId, contextCount) {
        const count = Math.max(1, Math.min(50, parseInt(contextCount))); // 限制在1-50之间
        this.updateUserConfig(userId, {
            contextCount: count
        });
    }

    /**
     * 设置用户系统提示词
     * @param {string} userId - 用户ID
     * @param {string} systemPrompt - 系统提示词
     */
    setUserSystemPrompt(userId, systemPrompt) {
        if (systemPrompt && systemPrompt.trim().length > 0) {
            this.updateUserConfig(userId, {
                systemPrompt: systemPrompt.trim()
            });
        }
    }

    /**
     * 设置用户AI模型
     * @param {string} userId - 用户ID
     * @param {string} model - AI模型名称 (deepseek 或 moonshot)
     */
    setUserModel(userId, model) {
        const validModels = ['deepseek', 'moonshot'];
        if (validModels.includes(model)) {
            this.updateUserConfig(userId, {
                model: model
            });
            return true;
        }
        return false;
    }

    /**
     * 重置用户配置为默认值
     * @param {string} userId - 用户ID
     */
    resetUserConfig(userId) {
        this.configs[userId] = { ...this.defaultConfig };
        this.saveConfigs();
        console.log(`✅ 用户 ${userId} 的配置已重置为默认值`);
    }

    /**
     * 获取用户配置摘要
     * @param {string} userId - 用户ID
     * @returns {string} 配置摘要文本
     */
    getUserConfigSummary(userId) {
        const config = this.getUserConfig(userId);
        return `📋 当前配置：
` +
               `🎵 声音模型: ${config.voiceModel}
` +
               `🗣️ 声音ID: ${config.voiceId}
` +
               `💬 上下文条数: ${config.contextCount}
` +
               `🤖 系统提示词: ${config.systemPrompt.substring(0, 50)}${config.systemPrompt.length > 50 ? '...' : ''}`;
    }

    /**
     * 获取所有用户数量
     * @returns {number} 用户数量
     */
    getUserCount() {
        return Object.keys(this.configs).length;
    }

    /**
     * 获取默认配置
     * @returns {Object} 默认配置
     */
    getDefaultConfig() {
        return { ...this.defaultConfig };
    }
}

module.exports = UserConfigService;