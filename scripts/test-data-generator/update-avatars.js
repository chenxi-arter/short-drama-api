const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// ==================== 配置 ====================
const API_CONFIG = {
  BASE_URL: 'https://iloveuwss.com/api',  // 修改为你的测试环境
  CONCURRENT_REQUESTS: 5, // 并发请求数
  REQUEST_DELAY: 100, // 每批请求之间的延迟(ms)
};

const CONFIG = {
  VERBOSE: true,
};

// ==================== 头像URL库 ====================
// 在这里配置你想要使用的头像链接
const AVATAR_URLS = [
  'https://ui-avatars.com/api/?name=Drama+Fan&size=200&background=FF6B6B&color=fff',
  'https://ui-avatars.com/api/?name=Video+Lover&size=200&background=4ECDC4&color=fff',
  'https://ui-avatars.com/api/?name=Series+Hunter&size=200&background=45B7D1&color=fff',
  'https://ui-avatars.com/api/?name=Movie+Star&size=200&background=FFA07A&color=fff',
  'https://ui-avatars.com/api/?name=Drama+King&size=200&background=98D8C8&color=fff',
  'https://ui-avatars.com/api/?name=Binge+Watcher&size=200&background=F7DC6F&color=333',
  'https://ui-avatars.com/api/?name=Night+Owl&size=200&background=BB8FCE&color=fff',
  'https://ui-avatars.com/api/?name=Series+Pro&size=200&background=85C1E2&color=fff',
  'https://ui-avatars.com/api/?name=Drama+Master&size=200&background=F8B88B&color=fff',
  'https://ui-avatars.com/api/?name=Video+VIP&size=200&background=ABEBC6&color=333',
  'https://ui-avatars.com/api/?name=Fan+Club&size=200&background=FAD7A0&color=333',
  'https://ui-avatars.com/api/?name=Movie+Buff&size=200&background=D7BDE2&color=fff',
  'https://ui-avatars.com/api/?name=Drama+Queen&size=200&background=A9DFBF&color=333',
  'https://ui-avatars.com/api/?name=Series+Fan&size=200&background=F9E79F&color=333',
  'https://ui-avatars.com/api/?name=Watch+Party&size=200&background=AED6F1&color=333',
  'https://ui-avatars.com/api/?name=Drama+Addict&size=200&background=FADBD8&color=333',
  'https://ui-avatars.com/api/?name=Viewer+Pro&size=200&background=D5F4E6&color=333',
  'https://ui-avatars.com/api/?name=Mega+Fan&size=200&background=FCF3CF&color=333',
  'https://ui-avatars.com/api/?name=Stream+King&size=200&background=EBDEF0&color=333',
  'https://ui-avatars.com/api/?name=VIP+Member&size=200&background=E8DAEF&color=333',
];

// ==================== 工具函数 ====================

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// ==================== API请求函数 ====================

/**
 * 用户登录获取token
 */
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/email-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        deviceInfo: 'Avatar Update Script'
      })
    });

    const result = await response.json();
    if (response.ok && result.access_token) {
      return result.access_token;
    } else {
      console.error(`登录失败 [${email}]:`, result.message || '未知错误');
      return null;
    }
  } catch (error) {
    console.error(`登录请求失败 [${email}]:`, error.message);
    return null;
  }
}

/**
 * 更新用户头像
 */
async function updateAvatar(token, photoUrl) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/update-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        photo_url: photoUrl
      })
    });

    const result = await response.json();
    return response.ok;
  } catch (error) {
    console.error(`更新头像请求失败:`, error.message);
    return false;
  }
}

/**
 * 批量处理任务（支持并发控制）
 */
async function processBatch(tasks, concurrency, description) {
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const total = tasks.length;

  for (let i = 0; i < total; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(task => task()));
    
    succeeded += results.filter(r => r).length;
    failed += results.filter(r => !r).length;
    completed += batch.length;

    if (CONFIG.VERBOSE && (completed % 20 === 0 || completed === total)) {
      console.log(`  ${description}: ${completed}/${total} (成功: ${succeeded}, 失败: ${failed})`);
    }

    // 延迟避免API压力过大
    if (i + concurrency < total) {
      await delay(API_CONFIG.REQUEST_DELAY);
    }
  }

  return { total, succeeded, failed };
}

// ==================== 主要功能 ====================

/**
 * 加载用户数据
 */
async function loadUsers() {
  const filePath = path.join(__dirname, 'generated-users.json');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.users || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ 未找到用户数据文件: generated-users.json');
      console.error('   请先运行 generate.js 生成用户数据');
    } else {
      console.error('❌ 读取用户数据失败:', error.message);
    }
    return [];
  }
}

/**
 * 更新所有用户头像
 */
async function updateAllAvatars(users) {
  console.log(`\n🖼️  开始更新用户头像...`);
  console.log(`📋 头像库包含 ${AVATAR_URLS.length} 个头像`);
  
  const tasks = users.map(user => async () => {
    // 登录获取token
    const token = await loginUser(user.email, user.password);
    if (!token) return false;
    
    // 随机选择一个头像
    const avatarUrl = randomChoice(AVATAR_URLS);
    
    // 更新头像
    return await updateAvatar(token, avatarUrl);
  });

  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '更新进度');
  
  console.log(`\n✅ 头像更新完成！`);
  console.log(`   总计: ${result.total}`);
  console.log(`   成功: ${result.succeeded}`);
  console.log(`   失败: ${result.failed}`);
  
  return result;
}

/**
 * 更新指定数量的用户头像
 */
async function updateRandomAvatars(users, count) {
  console.log(`\n🖼️  开始随机更新 ${count} 个用户头像...`);
  console.log(`📋 头像库包含 ${AVATAR_URLS.length} 个头像`);
  
  // 随机选择用户
  const shuffled = [...users].sort(() => Math.random() - 0.5);
  const selectedUsers = shuffled.slice(0, Math.min(count, users.length));
  
  const tasks = selectedUsers.map(user => async () => {
    // 登录获取token
    const token = await loginUser(user.email, user.password);
    if (!token) return false;
    
    // 随机选择一个头像
    const avatarUrl = randomChoice(AVATAR_URLS);
    
    // 更新头像
    return await updateAvatar(token, avatarUrl);
  });

  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '更新进度');
  
  console.log(`\n✅ 头像更新完成！`);
  console.log(`   总计: ${result.total}`);
  console.log(`   成功: ${result.succeeded}`);
  console.log(`   失败: ${result.failed}`);
  
  return result;
}

/**
 * 显示配置
 */
function displayConfig() {
  console.log('\n' + '='.repeat(80));
  console.log('🖼️  用户头像批量更新工具');
  console.log('='.repeat(80));
  console.log(`🌐 API地址: ${API_CONFIG.BASE_URL}`);
  console.log(`🎨 头像库数量: ${AVATAR_URLS.length}`);
  console.log(`🔄 并发请求数: ${API_CONFIG.CONCURRENT_REQUESTS}`);
  console.log(`⏱️  请求延迟: ${API_CONFIG.REQUEST_DELAY}ms`);
  console.log('='.repeat(80) + '\n');
}

// ==================== 主函数 ====================

async function main() {
  try {
    console.log('\n🎬 短剧用户头像更新工具');
    
    displayConfig();
    
    // 加载用户数据
    console.log('📂 正在加载用户数据...');
    const users = await loadUsers();
    
    if (users.length === 0) {
      process.exit(1);
    }
    
    console.log(`✅ 加载了 ${users.length} 个用户`);
    
    // 询问模式
    console.log('\n请选择更新模式：');
    console.log('  1. 更新所有用户头像');
    console.log('  2. 随机更新指定数量用户');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const mode = await new Promise(resolve => {
      rl.question('\n请输入选项 (1/2): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (mode === '1') {
      console.log(`\n⚠️  警告：将为 ${users.length} 个用户更新头像`);
      const confirmed = await askConfirmation('是否继续？(y/n): ');
      
      if (!confirmed) {
        console.log('❌ 操作已取消');
        rl.close();
        process.exit(0);
      }
      
      rl.close();
      await updateAllAvatars(users);
      
    } else if (mode === '2') {
      const count = await new Promise(resolve => {
        rl.question(`\n请输入要更新的用户数量 (1-${users.length}): `, answer => {
          resolve(parseInt(answer.trim()));
        });
      });
      
      if (isNaN(count) || count < 1 || count > users.length) {
        console.log('❌ 无效的数量');
        rl.close();
        process.exit(1);
      }
      
      console.log(`\n⚠️  警告：将为 ${count} 个随机用户更新头像`);
      const confirmed = await askConfirmation('是否继续？(y/n): ');
      
      if (!confirmed) {
        console.log('❌ 操作已取消');
        rl.close();
        process.exit(0);
      }
      
      rl.close();
      await updateRandomAvatars(users, count);
      
    } else {
      console.log('❌ 无效的选项');
      rl.close();
      process.exit(1);
    }
    
    console.log('\n🎉 头像更新任务完成！\n');
    
  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--api-url':
      API_CONFIG.BASE_URL = args[++i];
      break;
    case '--concurrent':
      API_CONFIG.CONCURRENT_REQUESTS = parseInt(args[++i]);
      break;
    case '--help':
      console.log(`
用户头像批量更新工具

使用方法:
  node update-avatars.js [选项]

配置:
  在脚本开头的 AVATAR_URLS 数组中配置你想使用的头像链接
  
  API_CONFIG.BASE_URL              API地址 (默认: https://iloveuwss.com/api)
  API_CONFIG.CONCURRENT_REQUESTS   并发请求数 (默认: 5)

命令行参数:
  --api-url <URL>        API地址
  --concurrent <数量>    并发请求数
  --help                显示此帮助信息

示例:
  # 使用默认配置
  node update-avatars.js

  # 连接不同的API
  node update-avatars.js --api-url https://your-api.com/api

  # 自定义并发数
  node update-avatars.js --concurrent 10

说明:
  - 此脚本会读取 generated-users.json 文件
  - 请确保先运行 generate.js 生成用户数据
  - 可以选择更新所有用户或随机更新指定数量的用户
  - 头像URL从配置的 AVATAR_URLS 数组中随机选择
  - 请在脚本开头修改 AVATAR_URLS 数组来自定义头像
      `);
      process.exit(0);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, updateAllAvatars, updateRandomAvatars };

