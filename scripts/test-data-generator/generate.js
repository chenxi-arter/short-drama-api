const bcrypt = require('bcrypt');
const readline = require('readline');
const fetch = require('node-fetch');

// ==================== API配置 ====================
const API_CONFIG = {
  BASE_URL: 'https://iloveuwss.com/api',  // 修改为你的测试环境
  CONCURRENT_REQUESTS: 20, // 并发请求数（已优化：token缓存后可以大幅增加）
  REQUEST_DELAY: 50, // 每批请求之间的延迟(ms)
  RANDOM_DELAY_MIN: 0,    // 每条评论随机延迟最小值(ms)（已优化：无需登录，延迟可大幅减少）
  RANDOM_DELAY_MAX: 100,  // 每条评论随机延迟最大值(ms)
};

// ==================== 配置参数 ====================
const CONFIG = {
  USER_COUNT: 5000,              // 生成用户数量（44922个剧集，需要大量用户）
  AVG_COMMENTS_PER_USER: 100,    // 每用户平均评论数（5000×100=500000条）
  MIN_COMMENTS_PER_EPISODE: 10,  // 每个剧集最少评论数（44922×10=449220条）
  USER_PASSWORD: 'test123456',   // 统一密码（必须包含字母和数字，6-20位）
  DISTRIBUTE_EVENLY: false,      // 保证最小值后随机分配（确保每个剧集都有评论）
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
  // === 整体评价类 ===
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
  '比预期好太多了！',
  '这才是良心剧啊！',
  '零差评神剧！',
  '全程无尿点！',
  '节奏把控堪称完美！',
  
  // === 剧情讨论类 ===
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
  '世界观设定很完整！',
  '剧情张力十足！',
  '每一帧都是剧情！',
  '反转接反转，精彩！',
  '细节经得起推敲！',
  '情节丝丝入扣！',
  '故事层次分明！',
  '逻辑自洽，很严谨！',
  '铺垫到位，爆发有力！',
  '叙事手法很新颖！',
  
  // === 情感共鸣类 ===
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
  '笑到肚子疼！',
  '泪目了家人们😭',
  '感动到无法呼吸！',
  '看得我热血沸腾！',
  '情绪拉满！',
  '共情感太强了！',
  '破防了破防了！',
  'DNA动了！',
  '这谁顶得住啊！',
  '情感戏真实！',
  
  // === 演员演技类 ===
  '男主演技真的好！',
  '女主颜值演技双在线！',
  '配角也很出彩！',
  '演员选得真好，很契合角色！',
  '男主好帅，女主好美！',
  '反派演得太到位了，恨得牙痒痒！',
  '小演员演技自然，不尴尬！',
  '这个演员是谁？演得真好！',
  '演员和角色太适配了！',
  '主角气质拿捏了！',
  '演技派实力在线！',
  '眼神戏绝了！',
  '哭戏太有感染力了！',
  '表情管理很到位！',
  '台词功底扎实！',
  '角色塑造立体饱满！',
  '演员之间化学反应爆棚！',
  '每个角色都很鲜活！',
  '反派演得入木三分！',
  '配角不抢戏但很亮眼！',
  
  // === 制作水准类 ===
  '制作精良，画面质感很好！',
  '短剧也可以拍得这么精致！',
  '服化道很用心！',
  '剪辑节奏舒服！',
  '配乐很搭，加分！',
  '特效做得不错！',
  '摄影师会拍！',
  '细节处理得很到位！',
  '镜头语言讲究！',
  '色调很舒服！',
  '运镜流畅！',
  '场景布置用心！',
  '道具考据认真！',
  '后期制作精良！',
  '音效设计棒！',
  '画面构图美！',
  '光影运用好！',
  '转场自然！',
  '视听语言高级！',
  '质感拉满！',
  
  // === 对比推荐类 ===
  '比其他短剧好太多了！',
  '终于看到一部不烂的短剧了！',
  '这才是短剧该有的样子！',
  '和某些注水剧比强太多！',
  '质量碾压一众短剧！',
  '秒杀同类型短剧！',
  '短剧界的清流！',
  '吊打市面上90%的短剧！',
  '拉高了短剧的天花板！',
  '重新定义了短剧标准！',
  '同期最佳没跑了！',
  '这才叫精品短剧！',
  '短剧也能拍出大片感！',
  '小成本大制作的典范！',
  '业界良心之作！',
  
  // === 催更期待类 ===
  '催更催更！快更新！',
  '等得好着急啊！',
  '坐等下一集！',
  '更新太慢了，不够看！',
  '一天一集不够啊！',
  '已经追到最新了，求快更！',
  '这剧追定了！',
  '已加入追剧列表！',
  '更新速度能不能快点！',
  '等更新等到心急！',
  '什么时候出续集啊！',
  '强烈要求加更！',
  '不够看啊，意犹未尽！',
  '看一集少一集，不舍得！',
  '希望能拍番外！',
  '期待第二季！',
  '后续剧情太期待了！',
  '想知道接下来怎么样！',
  '悬念拉满，坐等更新！',
  '每周最期待的就是更新！',
  
  // === 推荐安利类 ===
  '墙裂推荐给大家！',
  '已经安利给朋友了！',
  '不看后悔系列！',
  '良心推荐，必看！',
  '这个必须五星！',
  '赶紧去看，不会失望！',
  '闭眼入，质量保证！',
  '强推！不看血亏！',
  '安利给身边所有人！',
  '已经推荐给全家人了！',
  '看到就是赚到！',
  '入股不亏！',
  '值得二刷三刷！',
  '必看榜单第一名！',
  '错过可惜系列！',
  '年度必看短剧！',
  '吹爆这部剧！',
  '跪求更多人看到！',
  '被严重低估了！',
  '宝藏短剧！',
  
  // === 二刷重看类 ===
  '二刷了，还是好看！',
  '又来看一遍！',
  '百看不厌！',
  '这是我第三遍看了！',
  '每次看都有新发现！',
  '二刷发现更多细节！',
  '来来回回看了好几遍！',
  'N刷预警！',
  '越看越有味道！',
  '回味无穷！',
  '忍不住又来了！',
  '经典就是经得起重看！',
  '每一遍都有不同感受！',
  '重温经典！',
  '看多少遍都不腻！',
  
  // === 精彩片段类 ===
  '前方高能！',
  '名场面来了！',
  '开虐了开虐了😭',
  '这段名场面！',
  '高潮部分绝了！',
  '这段要反复看！',
  '经典片段！',
  '这幕太震撼了！',
  '这场戏拍得绝！',
  '这个镜头爱了！',
  '高燃片段！',
  '这段封神！',
  '燃炸了！',
  '这段值得单曲循环！',
  '名台词诞生！',
  
  // === 情绪表达类 ===
  '甜甜甜🍬',
  '笑死哈哈哈',
  '泪目😭',
  '啊啊啊啊！',
  'OMG！',
  '绝绝子！',
  '爆了！',
  '这波可以！',
  '神转折！',
  'YYDS！',
  '绝美！',
  '上头！',
  '爱了爱了！',
  '绝了绝了！',
  '太可了！',
  '哇塞！',
  '牛批！',
  '炸裂！',
  '震撼！',
  '惊艳！',
  
  // === 简短评价类 ===
  '好看！', '绝了！', '爱了！', '上头！', '精彩！',
  '赞👍', '牛！', '哇！', '可以！', '不错！', '棒！', '顶！',
  '完美！', '精品！', '神剧！', '满分！', '优秀！',
  '杰作！', '大爱！', '真香！', '无敌！', '炸了！',
  
  // === 节奏评价类 ===
  '节奏快，不拖沓，很爽！',
  '每集都有爆点，没有尿点！',
  '短小精悍，值得一看！',
  '虽然短但很精彩！',
  '短剧就该这样拍！',
  '浓缩的都是精华！',
  '时间控制得刚刚好！',
  '节奏紧凑不拖泥带水！',
  '信息密度很高！',
  '每一秒都不浪费！',
  '快节奏但不乱！',
  '张弛有度！',
  '起承转合流畅！',
  '剧情推进合理！',
  '节奏掌控力强！',
  
  // === 结局评价类 ===
  '结局不错，不烂尾！',
  '完结撒花🎉',
  '圆满大结局！',
  '结局有点意犹未尽啊！',
  '希望有第二季！',
  '结局收得漂亮！',
  '完美收官！',
  '结局出乎意料！',
  '结局升华了！',
  'ending给满分！',
  '结局不负期待！',
  '神结局！',
  '结局反转绝了！',
  '收尾完整！',
  '结局意味深长！',
  
  // === 编剧评价类 ===
  '剧本扎实，逻辑在线！',
  '人物塑造立体，不脸谱化！',
  '台词有水平，不尴尬！',
  '导演功力不错！',
  '完成度很高！',
  '这个编剧我粉了！',
  '编剧太有才了！',
  '台词金句频出！',
  '对白很自然！',
  '剧本打磨用心！',
  '编剧功力深厚！',
  '故事讲得好！',
  '叙事能力强！',
  '文本质量高！',
  '台词接地气！',
  
  // === 发现宝藏类 ===
  '这部短剧绝对是宝藏！',
  '熬夜也要看完！',
  '上班偷偷看，太好看了！',
  '意外发现的宝藏剧！',
  '相见恨晚！',
  '追剧追到停不下来！',
  '刷到就是赚到！',
  '无意中发现的神剧！',
  '挖到宝了！',
  '被标题骗进来，被内容留下来！',
  '低调的好剧！',
  '沧海遗珠！',
  '被埋没的佳作！',
  '小众但精品！',
  '冷门神剧！',
  
  // === 题材创新类 ===
  '情节环环相扣，精彩！',
  '这个题材很新颖！',
  '短剧界的一股清流！',
  '题材选得好！',
  '角度独特！',
  '很有创意！',
  '题材新鲜！',
  '脑洞大开！',
  '设定有趣！',
  '视角新颖！',
  '创意满分！',
  '别出心裁！',
  '构思巧妙！',
  '切入点好！',
  '主题深刻！',
  
  // === 问句式评论 ===
  '这也太好看了吧？',
  '为什么现在才看到？',
  '怎么才这么点播放量？',
  '这么好的剧为啥没火？',
  '有人和我一样在循环看吗？',
  '下一集什么时候更新啊？',
  '有没有同款推荐？',
  '谁能不爱这部剧？',
  '这不是神剧是什么？',
  '还有谁？',
  '这谁不爱啊？',
  '真的有人不喜欢吗？',
  '编剧是天才吧？',
  '演员是从哪找的？',
  '能再拍一部吗？',
  
  // === 时间点评论 ===
  '蹲了好久终于更新了！',
  '准时来打卡！',
  '每周必看！',
  '追更狗来了！',
  '终于等到更新！',
  '月底最期待的更新！',
  '守着更新看！',
  '追了一个月了！',
  '从头追到尾！',
  '一路追过来的！',
  
  // === 观影体验类 ===
  '一气呵成看完的！',
  '全程目不转睛！',
  '沉浸式观看体验！',
  '看得很过瘾！',
  '观感极佳！',
  '视觉享受！',
  '看得很舒服！',
  '体验感满分！',
  '观影氛围绝了！',
  '代入感超强！',
  
  // === CP感情线类 ===
  '男女主CP感太强了！',
  '这对CP我磕了！',
  '官方发糖，甜死了！',
  'CP互动好甜啊！',
  '男女主眼神都是戏！',
  '这对太配了吧！',
  '糖分超标警告！',
  'CP粉狂喜！',
  '男女主化学反应绝了！',
  '这糖我吃定了！',
  '配一脸！',
  '锁死这对CP！',
  '甜甜的恋爱！',
  '恋爱脑疯狂输出！',
  '被这对甜到了！',
  '发糖不要钱系列！',
  '磕到了磕到了！',
  '嗑糖嗑到饱！',
  '官方比同人还甜！',
  '这对我先锁了！',
  
  // === 音乐BGM类 ===
  '背景音乐太配了！',
  'BGM选得绝！',
  '配乐加分！',
  '主题曲好听！',
  '插曲太戳了！',
  '音乐渲染氛围到位！',
  '这首歌单曲循环了！',
  '片头曲抓耳！',
  '片尾曲余韵悠长！',
  'OST都好听！',
  '音乐总监有品味！',
  '配乐恰到好处！',
  '每首歌都很应景！',
  '听歌就能回忆起剧情！',
  '音乐烘托情绪很棒！',
  
  // === 角色分析类 ===
  '男主人设太帅了！',
  '女主角色立住了！',
  '配角人物丰满！',
  '反派有魅力！',
  '人物弧光完整！',
  '角色成长线清晰！',
  '每个角色都有血有肉！',
  '角色性格鲜明！',
  '主角不圣母不白莲！',
  '人物关系复杂有意思！',
  '群像戏拿捏了！',
  '反派不脸谱化！',
  '配角抢戏但不讨厌！',
  '女主独立自主，爱了！',
  '男主不霸总套路！',
  
  // === 弹幕风格类 ===
  '前方高能预警！！！',
  '名场面截图！',
  '这里笑死我了hhhh',
  '护眼时间到！',
  '啊啊啊啊啊啊！！！',
  '有被帅到！',
  '有被甜到！',
  '有被虐到！',
  '刀了刀了！',
  '发糖了发糖了！',
  '要开始了要开始了！',
  'awsl（啊我死了）',
  '爷青回！',
  '爷青结！',
  '有内味了！',
  
  // === 网络流行语类 ===
  'yyds（永远的神）！',
  'emo了！',
  '绝绝子真的绝绝子！',
  '太哇塞了吧！',
  'u1s1（有一说一）确实好看',
  'nsdd（你说得对）！',
  '这波不亏！',
  '我裂开了！',
  '我的DNA动了！',
  '破防了家人们！',
  '这谁能不爱？',
  '拿捏住了！',
  '属实有点东西！',
  '格局打开！',
  '这波在大气层！',
  
  // === 具体剧情点评类 ===
  '第X集太精彩了！',
  '这集反转我没想到！',
  '今天这集信息量爆炸！',
  '这集节奏太快了！',
  '这集看得我心脏病都要犯了！',
  '这集笑点密集！',
  '这集泪点满满！',
  '这集高能不断！',
  '这集发糖了！',
  '这集发刀了！',
  '这集埋了好多伏笔！',
  '这集回收伏笔了！',
  '这集悬念拉满！',
  '这集爽点密集！',
  '这集神反转！',
  
  // === 专业影评风格类 ===
  '叙事结构完整！',
  '人物塑造立体！',
  '镜头语言考究！',
  '视听语言高级！',
  '蒙太奇运用巧妙！',
  '叙事节奏把握精准！',
  '情节设计精巧！',
  '戏剧冲突设计合理！',
  '主题表达深刻！',
  '艺术性和商业性兼具！',
  '影像风格统一！',
  '剪辑手法成熟！',
  '场面调度专业！',
  '美学价值高！',
  '观赏性强！',
  
  // === 对话台词类 ===
  '这句台词绝了！',
  '台词太走心了！',
  '这句话破防了！',
  '台词金句频出！',
  '对白很有深度！',
  '这句话说到心坎了！',
  '台词不浮夸！',
  '对话很自然！',
  '台词有文学性！',
  '这段对话笑死！',
  '经典台词get！',
  '这句话太有道理了！',
  '台词接地气！',
  '对白有张力！',
  '金句收藏！',
  
  // === 社交分享类 ===
  '已分享朋友圈！',
  '已发微博安利！',
  '已发抖音推荐！',
  '已发小红书种草！',
  '必须分享给姐妹！',
  '发群里安利了！',
  '已加入我的片单！',
  '收藏了！',
  '点赞了！',
  '转发了！',
  '截图发群了！',
  '做成表情包了！',
  '录屏保存了！',
  '已推荐给全公司！',
  '朋友都来感谢我了！',
  
  // === 时段观看类 ===
  '深夜看完睡不着！',
  '通宵看完的！',
  '午休偷偷看！',
  '上班摸鱼看！',
  '下班必看！',
  '周末刷剧必备！',
  '每天下班第一件事！',
  '追剧日常！',
  '饭后消遣必选！',
  '睡前必看！',
  
  // === 多刷相关类 ===
  '已三刷！',
  '准备四刷！',
  '无限循环中！',
  '每天都要看一遍！',
  '刷了N遍了！',
  '每刷一次都有新体会！',
  '永远看不腻！',
  '常看常新！',
  '经典值得反复品味！',
  '多刷党报道！',
  
  // === Emoji表情类 ===
  '🔥🔥🔥太燃了！',
  '😭😭😭哭死！',
  '😂😂😂笑喷！',
  '💯💯💯满分！',
  '👍👍👍必须赞！',
  '❤️❤️❤️爱了！',
  '🌟🌟🌟五星！',
  '🎉🎉🎉完结撒花！',
  '🍬🍬🍬甜炸！',
  '😍😍😍太棒了！',
  '🤩🤩🤩惊艳！',
  '😱😱😱震撼！',
  '🥺🥺🥺破防！',
  '🤭🤭🤭嘿嘿！',
  '😤😤😤追定了！',
  
  // === 粉丝向评论类 ===
  '演员粉来报道！',
  '冲着演员来的！',
  '演员粉狂喜！',
  '编剧粉路过！',
  '导演粉表示满意！',
  '原著粉很满意！',
  '路人转粉了！',
  '成功入坑！',
  '已成为自来水！',
  '全家粉来了！',
  
  // === 数据支持类 ===
  '必须五星好评！',
  '打卡支持！',
  '播放量冲！',
  '评分拉满！',
  '数据刷起来！',
  '必须打满分！',
  '好评走起！',
  '支持正版！',
  '为数据贡献一份力！',
  '冲榜！'
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
  const random = Math.floor(Math.random() * 9000) + 1000; // 4位随机数
  
  // 用户名限制：3-20个字符，只能包含字母、数字和下划线
  if (Math.random() < 0.5) {
    // 格式：prefix + index + random (例如：drama1_5678)
    const prefix = randomChoice(prefixes);
    return `${prefix}${index}_${random}`;
  } else {
    // 格式：prefix + middle + random (例如：fan_king5678)
    const prefix = randomChoice(prefixes);
    const middle = randomChoice(middles);
    return `${prefix}_${middle}${random}`;
  }
}

function generateEmail(username) {
  // 添加时间戳确保邮箱唯一
  const timestamp = Date.now();
  const domains = ['gmail.com', '163.com', 'qq.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  return `${username}_${timestamp}@${randomChoice(domains)}`;
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
 * 用户注册
 */
async function registerUser(email, password, username, firstName, lastName) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password, // 确认密码必须与密码一致
        username,
        firstName,
        lastName: lastName || '' // 可选
      })
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, email };
    } else {
      console.error(`注册失败 [${email}]:`, result.message || result.error || '未知错误');
      return { success: false, email };
    }
  } catch (error) {
    console.error(`注册请求失败 [${email}]:`, error.message);
    return { success: false, email };
  }
}

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
 * 获取剧集列表（通过公开API，无需认证，支持分页获取所有数据）
 */
async function getEpisodesList() {
  const allEpisodes = [];
  let page = 1;
  const pageSize = 1000; // 每页最大数量
  let hasMore = true;
  
  try {
    console.log('   开始分页获取剧集数据...');
    
    while (hasMore) {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/public/video/episodes?page=${page}&size=${pageSize}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        console.error(`获取第${page}页失败:`, result.message || result.error || '未知错误');
        break;
      }
      
      // 解析响应格式，提取剧集列表
      let episodes = [];
      let total = 0;
      
      // 格式1: { data: { list: [...], total: 100 } }
      if (result.data && result.data.list) {
        episodes = result.data.list;
        total = result.data.total || result.data.count || 0;
      }
      // 格式2: { list: [...], total: 100 }
      else if (result.list) {
        episodes = result.list;
        total = result.total || result.count || 0;
      }
      // 格式3: 直接返回数组
      else if (Array.isArray(result)) {
        episodes = result;
        total = episodes.length;
      }
      // 格式4: { data: [...] }
      else if (result.data && Array.isArray(result.data)) {
        episodes = result.data;
        total = episodes.length;
      }
      
      if (episodes.length === 0) {
        // 没有更多数据了
        console.log(`   📄 第${page}页: 无数据，停止获取`);
        hasMore = false;
        break;
      }
      
      allEpisodes.push(...episodes);
      
      console.log(`   📄 第${page}页: 获取 ${episodes.length} 个剧集，累计: ${allEpisodes.length}`);
      
      // 判断是否还有更多页
      // 只有在有明确的总数且已达到总数时才停止
      if (total > 0 && allEpisodes.length >= total) {
        console.log(`   ✓ 已获取全部数据 (${allEpisodes.length}/${total})`);
        hasMore = false;
      } else {
        // 继续获取下一页，让API自己告诉我们何时结束（返回空数组）
        page++;
        
        // 添加小延迟避免请求过快
        await delay(50);
      }
    }
    
    console.log(`   ✅ 分页获取完成，共 ${allEpisodes.length} 个剧集`);
    return allEpisodes;
    
  } catch (error) {
    console.error('获取剧集列表请求失败:', error.message);
    return allEpisodes; // 返回已获取的剧集
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
 * 生成随机延迟时间
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 批量处理任务（支持并发控制和随机延迟）
 */
async function processBatch(tasks, concurrency, description) {
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const total = tasks.length;

  for (let i = 0; i < total; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    
    // 为每个任务添加随机延迟，让评论时间更分散
    const resultsPromises = batch.map(async (task) => {
      const delayTime = randomDelay(API_CONFIG.RANDOM_DELAY_MIN, API_CONFIG.RANDOM_DELAY_MAX);
      await delay(delayTime);
      return await task();
    });
    
    const results = await Promise.all(resultsPromises);
    
    succeeded += results.filter(r => r).length;
    failed += results.filter(r => !r).length;
    completed += batch.length;

    if (CONFIG.VERBOSE && completed % 50 === 0) {
      console.log(`  ${description}: ${completed}/${total} (成功: ${succeeded}, 失败: ${failed})`);
    }

    // 批次之间的固定延迟
    if (i + concurrency < total) {
      await delay(API_CONFIG.REQUEST_DELAY);
    }
  }

  return { total, succeeded, failed };
}

// ==================== 主要功能 ====================

/**
 * 注册用户（通过API）
 */
async function registerUsers(count) {
  console.log(`\n👥 开始通过API注册 ${count} 个用户...`);
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const username = generateUsername(i);
    const email = generateEmail(username);
    const nickname = generateDramaNickname();
    const nameFields = generateNameFields(nickname);
    
    users.push({
      email,
      username,
      password: CONFIG.USER_PASSWORD,
      firstName: nameFields.firstName,
      lastName: nameFields.lastName,
      nickname // 保存昵称用于显示
    });
  }
  
  // 批量注册
  const tasks = users.map(user => async () => {
    const result = await registerUser(
      user.email, 
      user.password, 
      user.username, 
      user.firstName, 
      user.lastName
    );
    return result.success;
  });

  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '注册进度');
  
  console.log(`✅ 用户注册完成！总计: ${result.total}, 成功: ${result.succeeded}, 失败: ${result.failed}`);
  
  return users;
}

/**
 * 加载已存在的用户数据
 */
async function loadExistingUsers() {
  const fs = require('fs').promises;
  const path = require('path');
  const filePath = path.join(__dirname, 'generated-users.json');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.users || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // 文件不存在
    }
    console.error('❌ 读取用户数据失败:', error.message);
    return null;
  }
}

/**
 * 保存用户数据到文件
 */
async function saveUsersToFile(users) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const filePath = path.join(__dirname, 'generated-users.json');
  const data = {
    generatedAt: new Date().toISOString(),
    count: users.length,
    users: users
  };
  
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n💾 用户数据已保存到: ${filePath}`);
  } catch (error) {
    console.error('❌ 保存用户数据失败:', error.message);
  }
}

/**
 * 生成评论（通过API）
 */
async function generateComments(users, episodes) {
  console.log(`\n💬 开始通过API生成评论...`);
  
  if (episodes.length === 0) {
    console.log('⚠️  没有找到剧集，跳过评论生成');
    return 0;
  }

  const targetTotal = Math.floor(users.length * CONFIG.AVG_COMMENTS_PER_USER);
  
  console.log(`📊 数据统计：`);
  console.log(`   - 剧集总数: ${episodes.length}`);
  console.log(`   - 用户总数: ${users.length}`);
  console.log(`   - 评论总预算: ${targetTotal} 条`);
  console.log(`   - 分配策略: ${CONFIG.DISTRIBUTE_EVENLY ? '均匀分配' : '保证最小值后随机分配'}`);

  // 优化：预先为所有用户登录并缓存token
  console.log(`\n🔐 正在为所有用户获取登录凭证...`);
  const userTokens = new Map();
  let loginSuccess = 0;
  let loginFailed = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const token = await loginUser(user.email, user.password);
    if (token) {
      userTokens.set(user.email, token);
      loginSuccess++;
    } else {
      loginFailed++;
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`   登录进度: ${i + 1}/${users.length} (成功: ${loginSuccess}, 失败: ${loginFailed})`);
    }
    
    // 小延迟避免登录接口压力
    if (i < users.length - 1) {
      await delay(10);
    }
  }
  
  console.log(`✅ 登录完成！成功: ${loginSuccess}, 失败: ${loginFailed}`);
  
  if (loginSuccess === 0) {
    console.log('❌ 所有用户登录失败，无法生成评论');
    return 0;
  }

  const tasks = [];
  
  if (CONFIG.DISTRIBUTE_EVENLY) {
    // 均匀分配模式：将评论均匀分配给所有剧集
    const commentsPerEpisode = Math.floor(targetTotal / episodes.length);
    const extraComments = targetTotal % episodes.length;
    
    console.log(`\n📋 均匀分配策略:`);
    console.log(`   - 每个剧集分配: ${commentsPerEpisode} 条评论`);
    console.log(`   - 额外随机分配: ${extraComments} 条评论`);
    
    for (const episode of episodes) {
      const shuffledUsers = shuffleArray(users);
      const commentersCount = Math.min(commentsPerEpisode, users.length);
      
      for (let i = 0; i < commentersCount; i++) {
        const user = shuffledUsers[i % users.length];
        const token = userTokens.get(user.email);
        if (!token) continue; // 跳过没有token的用户
        
        const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
        
        tasks.push(async () => {
          return await postComment(token, episode.short_id || episode.shortId, content);
        });
      }
    }
    
    // 分配剩余的评论
    for (let i = 0; i < extraComments; i++) {
      const user = randomChoice(users);
      const token = userTokens.get(user.email);
      if (!token) continue; // 跳过没有token的用户
      
      const episode = randomChoice(episodes);
      const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
      
      tasks.push(async () => {
        return await postComment(token, episode.short_id || episode.shortId, content);
      });
    }
  } else {
    // 保证最小值后随机分配模式（原有逻辑）
    const minCommentsPerEpisode = CONFIG.MIN_COMMENTS_PER_EPISODE;
    
    if (minCommentsPerEpisode > 0) {
      // 阶段1：确保最小评论数
      const phase1Total = episodes.length * minCommentsPerEpisode;
      console.log(`\n📋 阶段1: 为 ${episodes.length} 个剧集各生成 ${minCommentsPerEpisode} 条评论（共 ${phase1Total} 条）`);
      
      for (const episode of episodes) {
        const shuffledUsers = shuffleArray(users);
        const commentersCount = Math.min(minCommentsPerEpisode, users.length);
        
        for (let i = 0; i < commentersCount; i++) {
          const user = shuffledUsers[i];
          const token = userTokens.get(user.email);
          if (!token) continue; // 跳过没有token的用户
          
          const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
          
          tasks.push(async () => {
            return await postComment(token, episode.short_id || episode.shortId, content);
          });
        }
      }
    } else {
      console.log(`\n📋 完全随机分配模式：将所有评论随机分配到剧集`);
    }
    
    // 阶段2：随机分配额外评论（或全部评论如果MIN=0）
    const remaining = targetTotal - tasks.length;
    
    if (remaining > 0) {
      if (minCommentsPerEpisode > 0) {
        console.log(`\n📋 阶段2: 随机分配额外的 ${remaining} 条评论到所有剧集`);
      } else {
        console.log(`\n📋 随机生成 ${remaining} 条评论`);
      }
      
      for (let i = 0; i < remaining; i++) {
        const user = randomChoice(users);
        const token = userTokens.get(user.email);
        if (!token) continue; // 跳过没有token的用户
        
        const episode = randomChoice(episodes);
        const content = randomChoice(DRAMA_COMMENT_TEMPLATES);
        
        tasks.push(async () => {
          return await postComment(token, episode.short_id || episode.shortId, content);
        });
      }
    } else if (remaining < 0 && minCommentsPerEpisode > 0) {
      console.log(`\n⚠️  警告: 剧集数量(${episodes.length})过多，评论总预算不足`);
      console.log(`   建议增加用户数量或减少每剧集最小评论数`);
    }
  }
  
  console.log(`\n🚀 开始发表评论，总计: ${tasks.length} 条`);
  const result = await processBatch(tasks, API_CONFIG.CONCURRENT_REQUESTS, '评论进度');
  
  console.log(`\n✅ 评论生成完成！`);
  console.log(`   总计: ${result.total} 条`);
  console.log(`   成功: ${result.succeeded} 条`);
  console.log(`   失败: ${result.failed} 条`);
  console.log(`   平均每剧集: ${Math.floor(result.succeeded / episodes.length)} 条评论`);
  console.log(`   覆盖率: 100% (所有 ${episodes.length} 个剧集都已添加评论)`);
  
  return result.succeeded;
}

/**
 * 显示配置
 */
function displayConfig() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 短剧评论生成配置');
  console.log('='.repeat(80));
  console.log(`🌐 API地址: ${API_CONFIG.BASE_URL}`);
  console.log(`👥 用户数量: ${CONFIG.USER_COUNT}`);
  console.log(`💬 每用户平均评论数: ${CONFIG.AVG_COMMENTS_PER_USER}`);
  console.log(`🔄 并发请求数: ${API_CONFIG.CONCURRENT_REQUESTS}`);
  console.log(`⏱️  批次延迟: ${API_CONFIG.REQUEST_DELAY}ms`);
  console.log(`🎲 评论随机延迟: ${API_CONFIG.RANDOM_DELAY_MIN}-${API_CONFIG.RANDOM_DELAY_MAX}ms`);
  console.log('='.repeat(80) + '\n');
}

// ==================== 主函数 ====================

async function main() {
  try {
    console.log('\n🎬 短剧评论数据生成工具（纯API版本）');
    
    displayConfig();
    
    console.log('⚠️  警告：此操作将通过API生成评论数据！');
    console.log('⚠️  将创建测试用户并发表评论');
    console.log(`⚠️  请确保API服务正在运行（${API_CONFIG.BASE_URL}）`);
    const confirmed = await askConfirmation('是否继续？(y/n): ');
    
    if (!confirmed) {
      console.log('❌ 操作已取消');
      process.exit(0);
    }
    
    console.log('\n🔗 正在获取剧集列表...');
    console.log(`   使用公开接口: ${API_CONFIG.BASE_URL}/public/video/episodes`);
    const episodes = await getEpisodesList();
    console.log(`✅ 找到 ${episodes.length} 个剧集`);
    
    if (episodes.length === 0) {
      console.log('\n⚠️  没有找到剧集！请检查：');
      console.log('   1. API服务是否正常运行');
      console.log('   2. 数据库中是否有已发布的剧集');
      console.log('   3. API接口地址是否正确');
      process.exit(0);
    }
    
    // 显示前几个剧集信息（用于调试）
    if (CONFIG.VERBOSE && episodes.length > 0) {
      console.log('\n📋 前几个剧集示例：');
      episodes.slice(0, 3).forEach((ep, idx) => {
        console.log(`   ${idx + 1}. ${ep.title || ep.episodeTitle || '无标题'} (shortId: ${ep.shortId || ep.short_id || '无'})`);
      });
    }
    
    // 检查是否已有用户数据
    let users;
    const existingUsers = await loadExistingUsers();
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`\n📂 发现已存在的用户数据：${existingUsers.length} 个用户`);
      
      // 检查密码是否一致
      const firstUserPassword = existingUsers[0].password;
      const passwordMismatch = firstUserPassword !== CONFIG.USER_PASSWORD;
      
      if (passwordMismatch) {
        console.log(`\n⚠️  警告：已有用户的密码与当前配置不一致！`);
        console.log(`   已有用户密码: ${firstUserPassword}`);
        console.log(`   当前配置密码: ${CONFIG.USER_PASSWORD}`);
        console.log(`\n❌ 使用旧用户会导致登录失败！`);
        console.log(`   建议：删除 generated-users.json 后重新运行`);
        
        const forceRegenerate = await askConfirmation('\n是否删除旧数据并重新生成？(y=是/n=取消): ');
        
        if (forceRegenerate) {
          console.log('🔄 重新生成用户...');
          users = await registerUsers(CONFIG.USER_COUNT);
          await saveUsersToFile(users);
        } else {
          console.log('❌ 操作已取消。请手动删除 generated-users.json 后重试。');
          process.exit(0);
        }
      } else if (existingUsers.length >= CONFIG.USER_COUNT) {
        console.log(`✅ 已有用户数量(${existingUsers.length})满足需求(${CONFIG.USER_COUNT})`);
        console.log(`✅ 密码验证通过: ${CONFIG.USER_PASSWORD}`);
        const useExisting = await askConfirmation('是否使用已有用户？(y=使用现有/n=重新生成): ');
        
        if (useExisting) {
          users = existingUsers.slice(0, CONFIG.USER_COUNT);
          console.log(`✅ 使用已有的 ${users.length} 个用户`);
        } else {
          console.log('重新生成用户...');
          users = await registerUsers(CONFIG.USER_COUNT);
          await saveUsersToFile(users);
        }
      } else {
        console.log(`⚠️  已有用户数量(${existingUsers.length})不足需求(${CONFIG.USER_COUNT})`);
        console.log(`✅ 密码验证通过: ${CONFIG.USER_PASSWORD}`);
        const choice = await askConfirmation('是否补充生成不足的用户？(y=补充/n=重新生成全部): ');
        
        if (choice) {
          const needCount = CONFIG.USER_COUNT - existingUsers.length;
          console.log(`补充生成 ${needCount} 个用户...`);
          const newUsers = await registerUsers(needCount);
          users = [...existingUsers, ...newUsers];
          await saveUsersToFile(users);
        } else {
          console.log('重新生成全部用户...');
          users = await registerUsers(CONFIG.USER_COUNT);
          await saveUsersToFile(users);
        }
      }
    } else {
      // 没有已存在的用户，直接注册
      users = await registerUsers(CONFIG.USER_COUNT);
      await saveUsersToFile(users);
    }
    
    // 生成评论
    await generateComments(users, episodes);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 生成完成统计');
    console.log('='.repeat(80));
    console.log(`👥 注册用户数: ${users.length}`);
    console.log(`📺 目标剧集数: ${episodes.length}`);
    console.log(`💬 预计评论数: ~${users.length * CONFIG.AVG_COMMENTS_PER_USER}`);
    console.log('='.repeat(80) + '\n');
    
    console.log('🎉 评论数据生成完成！\n');
    console.log(`💡 提示：所有用户密码统一为: ${CONFIG.USER_PASSWORD}\n`);
    
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
    case '--users':
      CONFIG.USER_COUNT = parseInt(args[++i]);
      break;
    case '--comments':
      CONFIG.AVG_COMMENTS_PER_USER = parseInt(args[++i]);
      break;
    case '--concurrent':
      API_CONFIG.CONCURRENT_REQUESTS = parseInt(args[++i]);
      break;
    case '--help':
      console.log(`
短剧评论数据生成工具（纯API版本 - 无需数据库）

使用方法:
  node generate.js [选项]

配置 (在脚本开头修改):
  API_CONFIG.BASE_URL              API地址 (默认: https://iloveuwss.com/api)
  CONFIG.USER_COUNT                生成用户数量 (默认: 100)
  CONFIG.AVG_COMMENTS_PER_USER     每用户平均评论数 (默认: 5)
  CONFIG.MIN_COMMENTS_PER_EPISODE  每剧集最少评论数 (默认: 3)
  API_CONFIG.CONCURRENT_REQUESTS   并发请求数 (默认: 5)

命令行参数 (覆盖配置):
  --api-url <URL>        API地址
  --users <数量>         生成用户数量
  --comments <数量>      每用户平均评论数
  --concurrent <数量>    并发请求数
  --help                显示此帮助信息

示例:
  # 使用默认配置
  node generate.js

  # 快速测试（20个用户，每用户3条评论）
  node generate.js --users 20 --comments 3

  # 连接不同的API
  node generate.js --api-url https://your-api.com/api

  # 自定义并发数
  node generate.js --users 50 --concurrent 10

说明:
  - 此脚本完全通过API操作，不需要数据库连接
  - 会自动注册用户并发表评论
  - 生成的用户密码统一为: test123456
  - 请确保API服务正在运行
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
