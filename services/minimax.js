const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MinimaxTTSService {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY;
    this.groupId = process.env.MINIMAX_GROUP_ID;
    this.baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.chat';
    
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is required');
    }
    
    if (!this.groupId) {
      throw new Error('MINIMAX_GROUP_ID environment variable is required');
    }
    
    // 确保临时目录存在
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 文本转语音
   * @param {string} text - 要转换的文本 (最大5000字符)
   * @param {Object} options - 配置选项
   * @param {string} options.voiceId - 语音ID
   * @param {string} options.model - 模型名称 (默认: speech-2.5-turbo-preview)
   * @param {number} options.speed - 语速 (0.5-2.0)
   * @param {number} options.volume - 音量 (0.0-1.0)
   * @param {number} options.pitch - 音调 (-20到20)
   * @param {string} options.languageBoost - 语言增强
   * @param {Object} options.voiceModify - 语音修改效果
   * @param {Object} options.audioSetting - 音频设置
   * @returns {Promise<string>} 生成的音频文件路径
   */
  async textToSpeech(text, options = {}) {
    try {
      // 默认配置
      const config = {
        voice_id: options.voiceId || 'female-shaonv', // 默认使用少女音
        speed: options.speed || 1.0,
        vol: options.volume || 1.0,
        pitch: options.pitch || 0,
        audio_sample_rate: options.sampleRate || 32000,
        bitrate: options.bitrate || 128000,
        format: 'mp3',
        ...options
      };

      // 构建T2A V2请求数据
      const requestData = {
        model: options.model || 'speech-2.5-turbo-preview',
        text: text,
        stream: false,
        voice_setting: {
          voice_id: config.voice_id,
          speed: config.speed,
          vol: config.vol,
          pitch: config.pitch
        },
        audio_setting: options.audioSetting || {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1
        }
      };
      
      // 添加可选参数
      if (options.languageBoost) {
        requestData.language_boost = options.languageBoost;
      }
      
      if (options.voiceModify) {
        requestData.voice_modify = options.voiceModify;
      }

      console.log('正在调用 MiniMax TTS API...');
      
      // 发送请求到T2A V2端点
      const response = await axios.post(
        `${this.baseUrl}/v1/t2a_v2?GroupId=${this.groupId}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'json',
          timeout: 60000
        }
      );

      // 处理T2A V2响应
      if (response.data && response.data.data && response.data.data.audio) {
        // 解码hex格式的音频数据
        const audioHex = response.data.data.audio;
        const audioBuffer = Buffer.from(audioHex, 'hex');
        
        // 生成唯一的文件名
        const fileName = `tts_${uuidv4()}.mp3`;
        const filePath = path.join(this.tempDir, fileName);
        
        // 保存音频文件
        await fs.writeFile(filePath, audioBuffer);
        
        console.log(`语音文件已生成: ${filePath}`);
        console.log(`📊 音频信息: ${response.data.extra_info?.audio_length}ms, ${response.data.extra_info?.audio_size} bytes`);
        return filePath;
      } else {
        throw new Error('API响应中没有音频数据');
      }

    } catch (error) {
      console.error('MiniMax TTS API 调用失败:', error.message);
      
      if (error.response) {
        console.error('响应状态:', error.response.status);
        
        // 如果响应是JSON格式的错误信息
        if (error.response.headers['content-type']?.includes('application/json')) {
          try {
            const errorData = JSON.parse(error.response.data.toString());
            console.error('错误详情:', errorData);
          } catch (e) {
            console.error('响应数据:', error.response.data.toString().substring(0, 500));
          }
        }
        
        if (error.response.status === 401) {
          throw new Error('MiniMax API 密钥无效或已过期');
        } else if (error.response.status === 429) {
          throw new Error('MiniMax API 请求频率超限，请稍后再试');
        } else if (error.response.status >= 500) {
          throw new Error('MiniMax 服务器错误，请稍后再试');
        }
      }
      
      throw new Error(`MiniMax TTS 调用失败: ${error.message}`);
    }
  }

  /**
     * 从MiniMax API获取可用的声音模型
     * @param {string} voiceType - 声音类型: 'system', 'voice_cloning', 'voice_generation', 'music_generation', 'all'
     * @returns {Promise<Object>} 声音模型数据
     */
    async getVoicesFromAPI(voiceType = 'all') {
        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/get_voice`,
                { voice_type: voiceType },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            if (response.data) {
                console.log('✅ 成功获取MiniMax声音模型');
                return response.data;
            } else {
                throw new Error('API响应中没有声音数据');
            }
        } catch (error) {
            console.error('❌ 获取MiniMax声音模型失败:', error.message);
            throw new Error(`获取声音模型失败: ${error.message}`);
        }
    }

    /**
     * 获取可用的语音类型和模型（静态配置）
     * @returns {Object} 语音类型和模型配置
     */
    getAvailableVoices() {
        return {
            models: [
                { id: 'speech-2.5-hd-preview', name: 'HD预览版 - 终极相似度，超高质量', quality: 'hd' },
                { id: 'speech-2.5-turbo-preview', name: 'Turbo预览版 - 终极价值，40种语言', quality: 'turbo' },
                { id: 'speech-02-hd', name: 'HD版 - 优秀节奏和稳定性', quality: 'hd' },
                { id: 'speech-02-turbo', name: 'Turbo版 - 增强多语言能力', quality: 'turbo' },
                { id: 'speech-01-hd', name: '丰富语音，表达情感', quality: 'hd' },
                { id: 'speech-01-turbo', name: '优秀性能和低延迟', quality: 'turbo' }
            ],
            voices: [
                { id: 'female-shaonv', name: '少女音', gender: 'female', language: 'zh' },
                { id: 'male-qn-qingse', name: '青年男声', gender: 'male', language: 'zh' },
                { id: 'female-yujie', name: '御姐音', gender: 'female', language: 'zh' },
                { id: 'male-laonian', name: '老年男声', gender: 'male', language: 'zh' },
                { id: 'female-chengshu', name: '成熟女声', gender: 'female', language: 'zh' },
                { id: 'male-qingnian', name: '青年男声2', gender: 'male', language: 'zh' },
                { id: 'Grinch', name: 'Grinch', gender: 'male', language: 'en' },
                { id: 'Wise_Woman', name: 'Wise Woman', gender: 'female', language: 'en' }
            ],
            languages: [
                'Chinese', 'Chinese,Yue', 'English', 'Arabic', 'Russian', 'Spanish', 
                'French', 'Portuguese', 'German', 'Turkish', 'Dutch', 'Ukrainian', 
                'Vietnamese', 'Indonesian', 'Japanese', 'Italian', 'Korean', 'Thai', 
                'Polish', 'Romanian', 'Greek', 'Czech', 'Finnish', 'Hindi', 'Bulgarian', 
                'Danish', 'Hebrew', 'Malay', 'Persian', 'Slovak', 'Swedish', 'Croatian', 
                'Filipino', 'Hungarian', 'Norwegian', 'Slovenian', 'Catalan', 'Nynorsk', 
                'Tamil', 'Afrikaans', 'auto'
            ]
        };
    }

    /**
     * 获取中文女声列表
     * @param {Object} voicesData - 从API获取的声音数据
     * @returns {Array} 中文女声列表
     */
    getChineseFemaleVoices(voicesData) {
        const femaleVoices = [];
        
        // 从系统声音中筛选中文女声
        if (voicesData.system_voice) {
            voicesData.system_voice.forEach(voice => {
                if (voice.voice_name && voice.voice_name.includes('女')) {
                    femaleVoices.push({
                        id: voice.voice_id,
                        name: voice.voice_name,
                        type: 'system',
                        description: voice.description
                    });
                }
            });
        }
        
        // 添加默认的中文女声
        const defaultFemaleVoices = [
            { id: 'female-shaonv', name: '少女音', type: 'default' },
            { id: 'female-yujie', name: '御姐音', type: 'default' },
            { id: 'female-chengshu', name: '成熟女声', type: 'default' }
        ];
        
        return [...femaleVoices, ...defaultFemaleVoices];
    }

  /**
   * 检查API连接状态
   * @returns {Promise<boolean>} 连接是否正常
   */
  async checkConnection() {
    try {
      const testPath = await this.textToSpeech('测试连接');
      // 检查文件是否存在且大小大于0
      const stats = await fs.stat(testPath);
      await fs.remove(testPath); // 清理测试文件
      return stats.size > 0;
    } catch (error) {
      console.error('MiniMax 连接检查失败:', error.message);
      return false;
    }
  }

  /**
   * 清理临时文件
   * @param {number} maxAge - 文件最大保留时间（毫秒），默认1小时
   */
  async cleanupTempFiles(maxAge = 3600000) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          console.log(`已清理过期临时文件: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error.message);
    }
  }
}

module.exports = MinimaxTTSService;