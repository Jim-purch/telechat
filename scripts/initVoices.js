const MinimaxService = require('../services/minimax');
const UserConfigService = require('../services/userConfig');
require('dotenv').config();

/**
 * 初始化声音模型脚本
 * 获取MiniMax可用声音模型并预设中文女声
 */
async function initializeVoices() {
    console.log('🎵 开始初始化MiniMax声音模型...');
    
    try {
        const minimaxService = new MinimaxService();
        const userConfigService = new UserConfigService();
        
        // 获取所有可用声音
        console.log('📡 正在从MiniMax API获取声音模型...');
        const voicesData = await minimaxService.getVoicesFromAPI('all');
        
        console.log('✅ 成功获取声音数据:');
        console.log('📊 数据结构:', Object.keys(voicesData));
        
        // 显示系统声音
        if (voicesData.system_voice && voicesData.system_voice.length > 0) {
            console.log('\n🎤 系统声音列表:');
            voicesData.system_voice.forEach((voice, index) => {
                console.log(`${index + 1}. ${voice.voice_id} - ${voice.voice_name || '未命名'} (${voice.description || '无描述'})`);
            });
        }
        
        // 获取中文女声
        const chineseFemaleVoices = minimaxService.getChineseFemaleVoices(voicesData);
        console.log('\n👩 中文女声列表:');
        chineseFemaleVoices.forEach((voice, index) => {
            console.log(`${index + 1}. ${voice.id} - ${voice.name} (${voice.type})`);
        });
        
        // 选择默认的中文女声
        let defaultFemaleVoice = 'female-shaonv'; // 默认值
        
        // 优先选择API返回的中文女声
        const apiFemalVoices = chineseFemaleVoices.filter(v => v.type === 'system');
        if (apiFemalVoices.length > 0) {
            defaultFemaleVoice = apiFemalVoices[0].id;
            console.log(`\n✨ 选择API中的中文女声: ${apiFemalVoices[0].name} (${defaultFemaleVoice})`);
        } else {
            console.log(`\n✨ 使用默认中文女声: 少女音 (${defaultFemaleVoice})`);
        }
        
        // 更新默认配置
        const defaultConfig = userConfigService.getDefaultConfig();
        defaultConfig.voiceId = defaultFemaleVoice;
        
        console.log('\n📋 更新后的默认配置:');
        console.log('🎵 声音模型:', defaultConfig.voiceModel);
        console.log('🗣️ 声音ID:', defaultConfig.voiceId);
        console.log('💬 上下文条数:', defaultConfig.contextCount);
        console.log('🤖 系统提示词:', defaultConfig.systemPrompt.substring(0, 50) + '...');
        
        // 保存声音数据到文件（可选）
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(__dirname, '../data');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const voicesFile = path.join(dataDir, 'availableVoices.json');
        fs.writeFileSync(voicesFile, JSON.stringify({
            lastUpdated: new Date().toISOString(),
            voicesData: voicesData,
            chineseFemaleVoices: chineseFemaleVoices,
            defaultVoice: defaultFemaleVoice
        }, null, 2));
        
        console.log(`\n💾 声音数据已保存到: ${voicesFile}`);
        console.log('\n🎉 声音模型初始化完成！');
        
    } catch (error) {
        console.error('❌ 初始化声音模型失败:', error.message);
        console.error('详细错误:', error);
        
        // 使用默认配置
        console.log('\n🔄 使用默认声音配置...');
        const userConfigService = new UserConfigService();
        const defaultConfig = userConfigService.getDefaultConfig();
        console.log('默认声音ID:', defaultConfig.voiceId);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initializeVoices().then(() => {
        console.log('\n✅ 脚本执行完成');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ 脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { initializeVoices };