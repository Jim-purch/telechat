require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { DeepSeekService } = require('./services/deepseek');
const { MoonshotService } = require('./services/moonshot');
const MinimaxService = require('./services/minimax');
const UserConfigService = require('./services/userConfig');
const SessionManager = require('./services/sessionManager');
const { FileManager } = require('./utils/fileManager');
const { Logger } = require('./utils/logger');

// 初始化服务
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const deepseek = new DeepSeekService();
const moonshot = new MoonshotService();
const minimax = new MinimaxService();
const userConfigService = new UserConfigService();
const sessionManager = new SessionManager();
const fileManager = new FileManager();
const logger = new Logger();

// 设置机器人命令菜单
bot.setMyCommands([
  { command: 'start', description: '开始使用机器人' },
  { command: 'config', description: '查看当前配置' },
  { command: 'models', description: '查看可用AI模型' },
  { command: 'set_model', description: '设置AI模型' },
  { command: 'voices', description: '查看可用语音列表' },
  { command: 'set_voice', description: '设置语音ID' },
  { command: 'set_prompt', description: '设置系统提示词' },
  { command: 'set_context', description: '设置上下文条数' },
  { command: 'clear_history', description: '清除对话历史' },
  { command: 'reset_config', description: '重置为默认配置' }
]);

// 启动消息
console.log('🤖 Telegram Bot 启动中...');
console.log('📋 命令菜单已设置完成');

// 处理文本消息
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const messageText = msg.text;

  // 忽略非文本消息
  if (!messageText) {
    return;
  }

  // 处理命令消息（以/开头）
  if (messageText.startsWith('/')) {
    if (messageText === '/start') {
      bot.sendMessage(chatId, '👋 你好！我是一个AI助手机器人。\n\n发送任何消息给我，我会用语音回复你！\n\n可用命令：\n/config - 查看当前配置\n/models - 查看可用AI模型\n/set_model <model> - 设置AI模型\n/set_voice <voice_id> - 设置语音\n/set_prompt <prompt> - 设置系统提示词\n/set_context <count> - 设置上下文条数\n/reset_config - 重置配置');
    } else if (messageText === '/config') {
      const userConfig = userConfigService.getUserConfig(userId.toString());
      const configText = `📋 当前配置：\n\n🧠 AI模型: ${userConfig.model}\n🎤 语音ID: ${userConfig.voiceId}\n🤖 系统提示词: ${userConfig.systemPrompt}\n📝 上下文条数: ${userConfig.contextCount}\n🔊 语音模型: ${userConfig.voiceModel}`;
      bot.sendMessage(chatId, configText);
    } else if (messageText === '/voices') {
      try {
        const voicesData = JSON.parse(require('fs').readFileSync('./data/availableVoices.json', 'utf8'));
        const systemVoices = voicesData.voicesData.system_voice;
        
        let voicesText = '🎤 可用语音列表：\n\n';
        systemVoices.forEach((voice, index) => {
          voicesText += `${index + 1}. **${voice.voice_name}**\n`;
          voicesText += `   ID: \`${voice.voice_id}\`\n`;
          voicesText += `   描述: ${voice.description[0]}\n\n`;
        });
        
        voicesText += '💡 使用 /set_voice <voice_id> 来设置语音';
        bot.sendMessage(chatId, voicesText, { parse_mode: 'Markdown' });
      } catch (error) {
        bot.sendMessage(chatId, '❌ 获取语音列表失败');
        logger.error('获取语音列表失败:', error);
      }
    } else if (messageText.startsWith('/set_voice ')) {
      const voiceId = messageText.replace('/set_voice ', '').trim();
      userConfigService.updateUserConfig(userId.toString(), { voiceId });
      bot.sendMessage(chatId, `✅ 语音已设置为: ${voiceId}`);
    } else if (messageText.startsWith('/set_prompt ')) {
      const systemPrompt = messageText.replace('/set_prompt ', '').trim();
      userConfigService.updateUserConfig(userId.toString(), { systemPrompt });
      bot.sendMessage(chatId, `✅ 系统提示词已更新`);
    } else if (messageText.startsWith('/set_context ')) {
      const contextCount = parseInt(messageText.replace('/set_context ', '').trim());
      if (isNaN(contextCount) || contextCount < 1 || contextCount > 20) {
        bot.sendMessage(chatId, '❌ 请输入1-20之间的数字');
      } else {
        userConfigService.updateUserConfig(userId.toString(), { contextCount });
        bot.sendMessage(chatId, `✅ 上下文条数已设置为: ${contextCount}`);
      }
    } else if (messageText === '/reset_config') {
      userConfigService.resetUserConfig(userId.toString());
      bot.sendMessage(chatId, '✅ 配置已重置为默认值');
    } else if (messageText === '/clear_history') {
      sessionManager.clearUserHistory(userId.toString());
      bot.sendMessage(chatId, '✅ 对话历史已清除');
    } else if (messageText === '/models') {
      const modelsText = '🧠 可用AI模型：\n\n1. deepseek\n   - 高性能对话模型\n   - 支持中英文对话\n\n2. moonshot\n   - Kimi大模型\n   - 长文本理解能力强\n\n💡 使用 /set_model <model_name> 来切换模型';
      bot.sendMessage(chatId, modelsText, { parse_mode: 'Markdown' });
    } else if (messageText.startsWith('/set_model ')) {
      const modelName = messageText.replace('/set_model ', '').trim().toLowerCase();
      if (modelName === 'deepseek' || modelName === 'moonshot') {
        userConfigService.setUserModel(userId.toString(), modelName);
        bot.sendMessage(chatId, `✅ AI模型已切换为: ${modelName}`);
      } else {
        bot.sendMessage(chatId, '❌ 不支持的模型，请使用 /models 查看可用模型');
      }
    }
    return;
  }

  try {
    logger.info(`收到消息来自用户 ${msg.from.username || msg.from.first_name}: ${messageText}`);

    // 获取用户配置
    const userConfig = userConfigService.getUserConfig(userId.toString());

    // 添加用户消息到历史记录
    sessionManager.addUserMessage(userId.toString(), messageText);
    
    // 获取对话历史
    const conversationHistory = sessionManager.getConversationHistory(userId.toString(), userConfig.contextCount || 10);
    
    // 发送"正在思考"消息
    const thinkingMsg = await bot.sendMessage(chatId, '🤔 正在思考中...');

    // 根据用户配置选择AI服务
    let aiResponse;
    const selectedModel = userConfig.model || 'deepseek';
    
    if (selectedModel === 'moonshot') {
      // 调用Moonshot获取AI回复
      aiResponse = await moonshot.generateResponse(
        messageText,
        userId.toString(),
        userConfig.systemPrompt,
        userConfig.contextCount,
        conversationHistory
      );
    } else {
      // 调用DeepSeek获取AI回复（默认）
      aiResponse = await deepseek.generateResponse(
        messageText,
        userId.toString(),
        userConfig.systemPrompt,
        userConfig.contextCount,
        conversationHistory
      );
    }
    
    // 更新消息为"正在生成语音"
    await bot.editMessageText('🎵 正在生成语音...', {
      chat_id: chatId,
      message_id: thinkingMsg.message_id
    });

    // 调用MiniMax生成语音（使用用户自定义的声音设置）
    const audioOptions = {
      model: userConfig.voiceModel,
      voiceId: userConfig.voiceId,
      audioSetting: userConfig.audioSettings
    };
    
    const audioPath = await minimax.textToSpeech(aiResponse, audioOptions);

    // 删除状态消息
    await bot.deleteMessage(chatId, thinkingMsg.message_id);

    // 发送文本回复
    await bot.sendMessage(chatId, `💬 ${aiResponse}`);
    
    // 保存助手回复到历史记录
    sessionManager.addAssistantMessage(userId.toString(), aiResponse);

    // 发送语音文件
    await bot.sendVoice(chatId, audioPath, {
      caption: '🎤 语音回复'
    });

    // 清理临时文件
    await fileManager.deleteFile(audioPath);

    logger.info(`成功处理消息并发送回复`);

  } catch (error) {
    logger.error('处理消息时发生错误:', error);
    
    // 尝试删除状态消息
    try {
      await bot.deleteMessage(chatId, thinkingMsg.message_id);
    } catch (e) {
      // 忽略删除消息的错误
    }

    // 发送错误消息给用户
    await bot.sendMessage(chatId, '❌ 抱歉，处理您的消息时出现了错误，请稍后再试。');
  }
});

// 错误处理
bot.on('error', (error) => {
  logger.error('Telegram Bot 错误:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭机器人...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Telegram Bot 已启动并正在监听消息...');