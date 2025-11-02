const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');

// ==================== API配置 ====================
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ADMIN_BASE_URL: 'http://localhost:8081/api/admin',
  CONCURRENT_REQUESTS: 5, // 并发请求数
  REQUEST_DELAY: 100, // 每批请求之间的延迟(ms)
};

// ==================== 数据库配置 ====================
const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '123456',
  database: 'short_drama',
  charset: 'utf8mb4',
  timezone: '+08:00',
  multipleStatements: true
};

// ==================== 配置参数 ====================
const CONFIG = {
  USER_COUNT: 100,               // 生成用户数量
  AVG_COMMENTS_PER_USER: 5,      // 每用户平均评论数
  AVG_LIKES_PER_USER: 8,         // 每用户平均点赞数
  AVG_FAVORITES_PER_USER: 3,     // 每用户平均收藏数
  MIN_COMMENTS_PER_EPISODE: 3,   // 每个剧集最少评论数（减少避免API压力）
  MIN_LIKES_PER_EPISODE: 5,      // 每个剧集最少点赞数
  MIN_FAVORITES_PER_SERIES: 2,   // 每个系列最少收藏数
  VERBOSE: true,
};

// ==================== 短剧用户昵称库 ====================
const DRAMA_NICKNAMES_PREFIX = [
  '短剧迷', '追剧狂', '剧荒患者', '看剧专业户', '短剧收藏家',
  '每日追剧', '短剧达人', '剧情分析师', '短剧评论员', '深夜追剧',
  '疯狂追更', '剧不能停', '短剧推荐官', '爱看短剧的', '短剧爱好者',
  '熬夜看剧', '短剧控', '追剧小能手', '短剧品鉴师', '剧情猎人'
];

const NICKNAMES_SUFFIX = [
  '小王', '小李', '小张', '阿明', '阿华', '阿峰',
  '晓晓', '萌萌', '糖糖', '甜甜', '欣欣', '娜娜',
  '宝宝', '呆呆', '嘻嘻', '哈哈', '啦啦', '嘟嘟',
  '666', '888', '520', '999', '168', '369',
  'vip', 'pro', 'max', 'plus', 'king', 'star'
];

const SIMPLE_NICKNAMES = [
  '夜猫子', '星辰', '月光', '微风', '晨曦', '暮色',
  '随风', '清风', '落叶', '彩虹', '阳光', '海浪',
  '快乐源泉', '温柔本人', '可爱多', '甜甜圈', '棉花糖',
  '柠檬树', '草莓熊', '奶茶控', '咖啡因', '巧克力'
];

// ==================== 短剧专属评论模板 ====================
const DRAMA_COMMENT_TEMPLATES = [
  '这部短剧太上头了！完全停不下来！',
  '剧情紧凑不拖沓，节奏超好！',
  '短小精悍，每一集都是精华！',
  '演员演技在线，代入感超强！',
  '这才是短剧该有的水平！',
  '一口气刷完，意犹未尽！',
  '编剧太会写了，每集都有爆点！',
  '这部短剧绝了，强烈推荐！',
  '质量超高，短剧天花板！',
  '看完只想说：绝绝子！',
  '这个反转太惊喜了！没想到！',
  '剧情走向出人意料，爱了爱了！',
  '伏笔埋得好深啊，细节满满！',
  '前后呼应做得太好了！',
  '这集信息量好大，看得过瘾！',
  '编剧脑洞真大，创意十足！',
  '逻辑在线，不像其他短剧那么水！',
  '剧情节奏把控得很好！',
  '这个设定太有意思了！',
  '故事完整度很高，不烂尾！',
  '看哭了，太感人了😭',
  '笑死我了哈哈哈哈',
  '看得我心潮澎湃！',
  '太上头了，根本停不下来！',
  '代入感太强了，仿佛身临其境！',
  '情绪到位，演员演技炸裂！',
  '这段太虐了，心疼😭',
  '甜甜甜，甜到我了🍬',
  '爽剧！看得超爽！',
  '紧张得我都不敢看了！',
  '男主演技真的好！',
  '女主颜值演技双在线！',
  '配角也很出彩！',
  '演员选得真好，很契合角色！',
  '男主好帅，女主好美！',
  '反派演得太到位了，恨得牙痒痒！',
  '小演员演技自然，不尴尬！',
  '这个演员是谁？演得真好！',
  '制作精良，画面质感很好！',
  '短剧也可以拍得这么精致！',
  '服化道很用心！',
  '剪辑节奏舒服！',
  '配乐很搭，加分！',
  '特效做得不错！',
  '摄影师会拍！',
  '细节处理得很到位！',
  '比其他短剧好太多了！',
  '终于看到一部不烂的短剧了！',
  '这才是短剧该有的样子！',
  '和某些注水剧比强太多！',
  '质量碾压一众短剧！',
  '催更催更！快更新！',
  '等得好着急啊！',
  '坐等下一集！',
  '更新太慢了，不够看！',
  '一天一集不够啊！',
  '已经追到最新了，求快更！',
  '这剧追定了！',
  '已加入追剧列表！',
  '墙裂推荐给大家！',
  '已经安利给朋友了！',
  '不看后悔系列！',
  '良心推荐，必看！',
  '这个必须五星！',
  '赶紧去看，不会失望！',
  '闭眼入，质量保证！',
  '好看！', '绝了！', '爱了！', '上头！', '精彩！',
  '赞👍', '牛！', '哇！', '可以！', '不错！', '棒！', '顶！',
  '二刷了，还是好看！',
  '又来看一遍！',
  '百看不厌！',
  '这是我第三遍看了！',
  '每次看都有新发现！',
  '前方高能！',
  '名场面来了！',
  '开虐了开虐了😭',
  '甜甜甜🍬',
  '笑死哈哈哈',
  '泪目😭',
  '啊啊啊啊！',
  'OMG！',
  '绝绝子！',
  '爆了！',
  '这波可以！',
  '神转折！',
  '节奏快，不拖沓，很爽！',
  '每集都有爆点，没有尿点！',
  '短小精悍，值得一看！',
  '虽然短但很精彩！',
  '短剧就该这样拍！',
  '浓缩的都是精华！',
  '结局不错，不烂尾！',
  '完结撒花🎉',
  '圆满大结局！',
  '结局有点意犹未尽啊！',
  '希望有第二季！',
  '剧本扎实，逻辑在线！',
  '人物塑造立体，不脸谱化！',
  '台词有水平，不尴尬！',
  '导演功力不错！',
  '完成度很高！',
  '这部短剧绝对是宝藏！',
  '熬夜也要看完！',
  '上班偷偷看，太好看了！',
  '已经推荐给全家人了！',
  '这个编剧我粉了！',
  '演员和角色太适配了！',
  '看得我热血沸腾！',
  '情节环环相扣，精彩！',
  '这个题材很新颖！',
  '短剧界的一股清流！'
];

// ==================== 工具函数 ====================

function generateDramaNickname() {
  const rand = Math.random();
  if (rand < 0.4) {
    return `${randomChoice(DRAMA_NICKNAMES_PREFIX)}${randomChoice(NICKNAMES_SUFFIX)}`;
  } else if (rand < 0.7) {
    const simple = randomChoice(SIMPLE_NICKNAMES);
    const numSuffix = Math.random() < 0.5 ? randomChoice(NICKNAMES_SUFFIX) : '';
    return `${simple}${numSuffix}`;
  } else {
    return randomChoice(SIMPLE_NICKNAMES);
  }
}

function generateUsername(index) {
  const prefixes = ['drama', 'video', 'fan', 'viewer', 'user', 'vip', 'member'];
  const middles = ['lover', 'hunter', 'fan', 'master', 'king', 'star'];
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000);
  
  if (Math.random() < 0.5) {
    const prefix = randomChoice(prefixes);
    return `${prefix}${index}_${timestamp}${random}`;
  } else {
    const prefix = randomChoice(prefixes);
    const middle = randomChoice(middles);
    return `${prefix}_${middle}${index}_${timestamp}`;
  }
}

function generateEmail(username) {
  const domains = ['gmail.com', '163.com', 'qq.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  return `${username}@${randomChoice(domains)}`;
}

async function generatePasswordHash() {
  return await bcrypt.hash('123456', 10);
}

function generateNameFields(nickname) {
  if (nickname.length <= 4) {
    return {
      firstName: nickname.substring(0, 1),
      lastName: nickname.substring(1)
    };
  } else {
    return {
      firstName: nickname.substring(0, 2),
      lastName: nickname.substring(2, Math.min(nickname.length, 10))
    };
  }
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
        deviceInfo: 'Test Script'
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
 * 发表评论
 */
async function postComment(token, episodeShortId, content) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/video/episode/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shortId: episodeShortId,
        content
      })
    });

    const result = await response.json();
    return response.ok;
  } catch (error) {
    console.error(`评论请求失败:`, error.message);
    return false;
  }
}

/**
 * 点赞剧集
 */
async function likeEpisode(token, episodeShortId) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/video/episode/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shortId: episodeShortId,
        type: 'like'
      })
    });

    const result = await response.json();
    return response.ok;
  } catch (error) {
    console.error(`点赞请求失败:`, error.message);
    return false;
  }
}

/**
 * 收藏系列
 */
async function favoriteSeries(token, episodeShortId) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/video/episode/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shortId: episodeShortId,
        type: 'favorite'
      })
    });

    const result = await response.json();
    return response.ok;
  } catch (error) {
    console.error(`收藏请求失败:`, error.message);
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

    if (CONFIG.VERBOSE && completed % 50 === 0) {
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
 * 创建用户（数据库直接插入，因为没有批量注册API）
 */
async function createUsers(connection, count) {
  console.log(`\n👥 开始创建 ${count} 个用户...`);
  const users = [];
  const passwordHash = await generatePasswordHash();
  
  for (let i = 1; i <= count; i++) {
    const username = generateUsername(i);
    const email = generateEmail(username);
    const nickname = generateDramaNickname();
    const nameFields = generateNameFields(nickname);
    
    users.push({
      email,
      username,
      firstName: nameFields.firstName,
      lastName: nameFields.lastName,
      nickname,
      passwordHash,
      password: '123456' // 保存明文密码用于登录
    });
  }
  
  // 批量插入数据库
  const values = users.map(u => 
    `('${u.email}', '${u.passwordHash}', '${u.username}', '${u.firstName}', '${u.lastName}', '${u.nickname}', 1)`
  ).join(',\n');
  
  const sql = `
    INSERT INTO users (email, password_hash, username, first_name, last_name, nickname, is_active)
    VALUES ${values}
  `;
  
  await connection.execute(sql);
  
  console.log(`✅ 用户创建完成！共 ${users.length} 个用户`);
  return users;
}

/**
 * 获取短剧剧集
 */
async function getDramaEpisodes(connection) {
  console.log('\n📺 获取短剧剧集...');
  
  const [episodes] = await connection.execute(`
    SELECT e.id, e.short_id, e.series_id, e.episode_number, s.title as series_title
    FROM episodes e
    INNER JOIN series s ON e.series_id = s.id
    WHERE e.status = 'published'
    AND s.is_active = 1
    AND s.category_id = 1
    ORDER BY e.id
  `);
  
  console.log(`✅ 找到 ${episodes.length} 个短剧剧集`);
  
  if (episodes.length === 0) {
    console.log('⚠️  警告：数据库中没有短剧剧集！');
  }
  
  return episodes;
}

/**
 * 生成评论（通过API）
 */
async function generateComments(users, episodes) {
  console.log(`\n💬 开始通过API生成评论...`);
  
  if (episodes.length === 0) {
    console.log('⚠️  跳过评论生成');
    return 0;
  }

  const tasks = [];
  
  console.log(`📋 策略：确保每个剧集都有评论，然后随机分配额外评论`);
  
  // 阶段1：确保每个剧集至少有评论
  const minCommentsPerEpisode = CONFIG.MIN_COMMENTS_PER_EPISODE;
  console.log(`  阶段1: 为每个剧集至少生成 ${minCommentsPerEpisode} 条评论`);
  
  for (const episode of episodes) {
    const shuffledUsers = shuffleArray(users);
    const commentersCount = Math.min(minCommentsPerEpisode, users.length);
    
    for (let i = 0; i < commentersCount; i++) {
      const user = shuffledUsers[i];
      const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await postComment(token, episode.short_id, content);
      });
    }
  }
  
  // 阶段2：随机分配额外评论
  const targetTotal = Math.floor(users.length * CONFIG.AVG_COMMENTS_PER_USER);
  const remaining = targetTotal - tasks.length;
  
  if (remaining > 0) {
    console.log(`  阶段2: 随机分配额外的 ${remaining} 条评论`);
    
    for (let i = 0; i < remaining; i++) {
      const user = randomChoice(users);
      const episode = randomChoice(episodes);
      const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await postComment(token, episode.short_id, content);
      });
    }
  }
  
  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '评论进度');
  
  console.log(`✅ 评论生成完成！总计: ${result.total}, 成功: ${result.succeeded}, 失败: ${result.failed}`);
  console.log(`   平均每剧集 ${Math.floor(result.succeeded / episodes.length)} 条评论`);
  
  return result.succeeded;
}

/**
 * 生成点赞（通过API）
 */
async function generateLikes(users, episodes) {
  console.log(`\n❤️  开始通过API生成点赞...`);
  
  if (episodes.length === 0) {
    console.log('⚠️  跳过点赞生成');
    return 0;
  }

  const tasks = [];
  
  console.log(`📋 策略：确保每个剧集都有点赞，然后随机分配额外点赞`);
  
  // 阶段1：确保每个剧集至少有点赞
  const minLikesPerEpisode = CONFIG.MIN_LIKES_PER_EPISODE;
  console.log(`  阶段1: 为每个剧集至少生成 ${minLikesPerEpisode} 个点赞`);
  
  for (const episode of episodes) {
    const shuffledUsers = shuffleArray(users);
    const likersCount = Math.min(minLikesPerEpisode, users.length);
    
    for (let i = 0; i < likersCount; i++) {
      const user = shuffledUsers[i];
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await likeEpisode(token, episode.short_id);
      });
    }
  }
  
  // 阶段2：随机分配额外点赞
  const targetTotal = Math.floor(users.length * CONFIG.AVG_LIKES_PER_USER);
  const remaining = targetTotal - tasks.length;
  
  if (remaining > 0) {
    console.log(`  阶段2: 随机分配额外的 ${remaining} 个点赞`);
    
    for (let i = 0; i < remaining; i++) {
      const user = randomChoice(users);
      const episode = randomChoice(episodes);
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await likeEpisode(token, episode.short_id);
      });
    }
  }
  
  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '点赞进度');
  
  console.log(`✅ 点赞生成完成！总计: ${result.total}, 成功: ${result.succeeded}, 失败: ${result.failed}`);
  console.log(`   平均每剧集 ${Math.floor(result.succeeded / episodes.length)} 个点赞`);
  
  return result.succeeded;
}

/**
 * 生成收藏（通过API）
 */
async function generateFavorites(users, episodes) {
  console.log(`\n⭐ 开始通过API生成收藏...`);
  
  if (episodes.length === 0) {
    console.log('⚠️  跳过收藏生成');
    return 0;
  }

  const tasks = [];
  
  // 按系列分组
  const seriesMap = new Map();
  for (const episode of episodes) {
    if (!seriesMap.has(episode.series_id)) {
      seriesMap.set(episode.series_id, []);
    }
    seriesMap.get(episode.series_id).push(episode);
  }
  
  const seriesIds = Array.from(seriesMap.keys());
  console.log(`📋 策略：确保每个系列都有收藏，然后随机分配额外收藏`);
  
  // 阶段1：确保每个系列至少有收藏
  const minFavoritesPerSeries = CONFIG.MIN_FAVORITES_PER_SERIES;
  console.log(`  阶段1: 为每个系列至少生成 ${minFavoritesPerSeries} 个收藏`);
  
  for (const seriesId of seriesIds) {
    const seriesEpisodes = seriesMap.get(seriesId);
    const firstEpisode = seriesEpisodes[0];
    const shuffledUsers = shuffleArray(users);
    const favoritersCount = Math.min(minFavoritesPerSeries, users.length);
    
    for (let i = 0; i < favoritersCount; i++) {
      const user = shuffledUsers[i];
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await favoriteSeries(token, firstEpisode.short_id);
      });
    }
  }
  
  // 阶段2：随机分配额外收藏
  const targetTotal = Math.floor(users.length * CONFIG.AVG_FAVORITES_PER_USER);
  const remaining = targetTotal - tasks.length;
  
  if (remaining > 0) {
    console.log(`  阶段2: 随机分配额外的 ${remaining} 个收藏`);
    
    for (let i = 0; i < remaining; i++) {
      const user = randomChoice(users);
      const seriesId = randomChoice(seriesIds);
      const seriesEpisodes = seriesMap.get(seriesId);
      const firstEpisode = seriesEpisodes[0];
      
      tasks.push(async () => {
        const token = await loginUser(user.email, user.password);
        if (!token) return false;
        return await favoriteSeries(token, firstEpisode.short_id);
      });
    }
  }
  
  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '收藏进度');
  
  console.log(`✅ 收藏生成完成！总计: ${result.total}, 成功: ${result.succeeded}, 失败: ${result.failed}`);
  console.log(`   平均每系列 ${Math.floor(result.succeeded / seriesIds.length)} 个收藏`);
  
  return result.succeeded;
}

/**
 * 显示统计
 */
async function showStatistics(connection) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 数据统计');
  console.log('='.repeat(80));
  
  const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
  console.log(`👥 总用户数: ${userCount[0].count}`);
  
  const [commentCount] = await connection.execute('SELECT COUNT(*) as count FROM comments');
  console.log(`💬 总评论数: ${commentCount[0].count}`);
  
  const [likeCount] = await connection.execute("SELECT COUNT(*) as count FROM episode_reactions WHERE reaction_type = 'like'");
  console.log(`❤️  总点赞数: ${likeCount[0].count}`);
  
  const [favoriteCount] = await connection.execute('SELECT COUNT(*) as count FROM favorites');
  console.log(`⭐ 总收藏数: ${favoriteCount[0].count}`);
  
  const [dramaEpisodes] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM episodes e
    INNER JOIN series s ON e.series_id = s.id
    WHERE s.category_id = 1 AND e.status = 'published'
  `);
  console.log(`📺 短剧剧集数: ${dramaEpisodes[0].count}`);
  
  console.log('='.repeat(80) + '\n');
}

/**
 * 显示配置
 */
function displayConfig() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 短剧数据生成配置（API版本）');
  console.log('='.repeat(80));
  console.log(`🌐 API地址: ${API_CONFIG.BASE_URL}`);
  console.log(`🏢 数据库地址: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`📚 数据库名称: ${dbConfig.database}`);
  console.log(`👥 用户数量: ${CONFIG.USER_COUNT}`);
  console.log(`💬 每用户平均评论数: ${CONFIG.AVG_COMMENTS_PER_USER}`);
  console.log(`❤️  每用户平均点赞数: ${CONFIG.AVG_LIKES_PER_USER}`);
  console.log(`⭐ 每用户平均收藏数: ${CONFIG.AVG_FAVORITES_PER_USER}`);
  console.log(`🔄 并发请求数: ${API_CONFIG.CONCURRENT_REQUESTS}`);
  console.log(`⏱️  请求延迟: ${API_CONFIG.REQUEST_DELAY}ms`);
  console.log('='.repeat(80) + '\n');
}

// ==================== 主函数 ====================

async function main() {
  let connection;
  
  try {
    console.log('\n🎬 短剧测试数据生成工具（API版本）');
    
    displayConfig();
    
    console.log('⚠️  警告：此操作将通过API向数据库插入大量测试数据！');
    console.log('⚠️  只针对短剧（category_id=1）生成数据');
    console.log('⚠️  请确保API服务正在运行（http://localhost:8080）');
    const confirmed = await askConfirmation('是否继续？(y/n): ');
    
    if (!confirmed) {
      console.log('❌ 操作已取消');
      process.exit(0);
    }
    
    console.log('\n🔗 正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    await connection.execute('SET NAMES utf8mb4');
    await connection.execute('SET CHARACTER SET utf8mb4');
    
    // 获取短剧剧集
    const episodes = await getDramaEpisodes(connection);
    
    if (episodes.length === 0) {
      console.log('\n⚠️  数据库中没有短剧剧集！');
      console.log('请确保 category_id=1 的短剧系列有已发布的剧集。');
      process.exit(0);
    }
    
    // 创建用户
    const users = await createUsers(connection, CONFIG.USER_COUNT);
    
    // 通过API生成评论
    await generateComments(users, episodes);
    
    // 通过API生成点赞
    await generateLikes(users, episodes);
    
    // 通过API生成收藏
    await generateFavorites(users, episodes);
    
    // 显示统计
    await showStatistics(connection);
    
    console.log('🎉 所有数据生成完成！\n');
    
  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭\n');
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--api-url':
      API_CONFIG.BASE_URL = args[++i];
      break;
    case '--host':
      dbConfig.host = args[++i];
      break;
    case '--port':
      dbConfig.port = parseInt(args[++i]);
      break;
    case '--user':
      dbConfig.user = args[++i];
      break;
    case '--password':
      dbConfig.password = args[++i];
      break;
    case '--database':
      dbConfig.database = args[++i];
      break;
    case '--users':
      CONFIG.USER_COUNT = parseInt(args[++i]);
      break;
    case '--comments':
      CONFIG.AVG_COMMENTS_PER_USER = parseInt(args[++i]);
      break;
    case '--likes':
      CONFIG.AVG_LIKES_PER_USER = parseInt(args[++i]);
      break;
    case '--favorites':
      CONFIG.AVG_FAVORITES_PER_USER = parseInt(args[++i]);
      break;
    case '--concurrent':
      API_CONFIG.CONCURRENT_REQUESTS = parseInt(args[++i]);
      break;
    case '--help':
      console.log(`
短剧测试数据生成工具（API版本）

使用方法:
  node generate-drama-test-data-api.js [选项]

选项:
  --api-url <URL>        API地址 (默认: http://localhost:8080/api)
  --host <主机>          数据库主机地址 (默认: localhost)
  --port <端口>          数据库端口 (默认: 3307)
  --user <用户名>        数据库用户名 (默认: root)
  --password <密码>      数据库密码 (默认: 123456)
  --database <数据库名>  数据库名称 (默认: short_drama)
  --users <数量>         生成用户数量 (默认: 100)
  --comments <数量>      每用户平均评论数 (默认: 5)
  --likes <数量>         每用户平均点赞数 (默认: 8)
  --favorites <数量>     每用户平均收藏数 (默认: 3)
  --concurrent <数量>    并发请求数 (默认: 5)
  --help                显示此帮助信息

示例:
  # 使用默认配置
  node generate-drama-test-data-api.js

  # 生成50个用户
  node generate-drama-test-data-api.js --users 50

  # 自定义API地址和并发数
  node generate-drama-test-data-api.js --api-url http://api.example.com/api --concurrent 10

注意:
  - 此脚本通过API接口生成数据，更接近真实使用场景
  - 请确保API服务正在运行
  - 可以通过 --concurrent 调整并发数以控制API压力
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

module.exports = { main };

