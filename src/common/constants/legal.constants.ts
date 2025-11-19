/**
 * 法律免责声明常量 / Legal Disclaimer Constants
 * 
 * ⚠️ IMPORTANT NOTICE:
 * This system only provides technical framework and does not contain any content.
 * Users must ensure content legality and possess necessary operating qualifications.
 * Developer bears no responsibility for content legality.
 */

export const LEGAL_DISCLAIMER = {
  /**
   * 系统免责声明（通用国际版）
   * System Disclaimer (International)
   */
  SYSTEM_DISCLAIMER_INTERNATIONAL: `
This system provides only a technical framework and does not include any video content.

USERS MUST ENSURE:
1. Legal copyright or authorization for all content under applicable laws
2. All operating licenses and qualifications required by local jurisdiction
3. Compliance with all applicable laws including but not limited to:
   - Copyright and intellectual property laws
   - Data protection and privacy laws
   - Content regulation and broadcasting laws
4. Implementation of appropriate content moderation mechanisms

DEVELOPER DISCLAIMER:
The developer provides only technical services and does not participate in content operations.
The developer bears no legal responsibility for content uploaded by users or operational activities.
  `.trim(),

  /**
   * 系统免责声明（中文）
   */
  SYSTEM_DISCLAIMER_CN: `
本系统仅提供技术框架，不包含任何视频内容。

使用方必须确保：
1. 拥有所有内容的合法版权或授权（依据所在国家/地区法律）
2. 具备所在国家/地区法律法规要求的所有运营资质
3. 遵守所在国家/地区的相关法律法规，包括但不限于：
   - 著作权和知识产权法
   - 数据保护和隐私法
   - 内容监管和广播法
4. 建立完善的内容审核机制

开发者声明：
开发者仅提供技术服务，不参与内容运营。
开发者不对使用方上传的内容及运营行为承担任何法律责任。
  `.trim(),

  /**
   * 开发者声明（国际通用版）
   * Developer Statement (International)
   */
  DEVELOPER_STATEMENT: `
DEVELOPER STATEMENT / 开发者声明:

1. Provides only technical framework and implementation
   仅提供技术框架和功能实现

2. Does not participate in content selection, editing, uploading or operations
   不参与内容的选择、编辑、上传或运营

3. Bears no responsibility for content legality under any jurisdiction
   不对内容合法性承担责任（任何司法管辖区）

4. Bears no responsibility for operational behavior
   不对运营行为承担责任

5. Users are responsible for compliance with all applicable laws
   使用方负责遵守所有适用法律
  `.trim(),

  /**
   * 用户协议必要条款（国际通用）
   * Required User Terms (International)
   */
  REQUIRED_USER_TERMS: {
    contentLegality: 'User guarantees legal copyright or authorization for all uploaded content under applicable laws / 用户保证上传的所有内容拥有合法版权或授权',
    compliance: 'User agrees to comply with all applicable laws and regulations in their jurisdiction / 用户同意遵守所在司法管辖区的所有相关法律法规',
    liability: 'User bears full legal responsibility for content legality / 用户对内容合法性承担全部法律责任',
    indemnification: 'User is responsible for ensuring all content and operations comply with applicable laws / 用户负责确保所有内容和运营符合适用法律',
  },

  /**
   * 通用运营资质要求（因国家/地区而异）
   * General Operating Qualifications (Varies by Country/Region)
   */
  REQUIRED_QUALIFICATIONS: {
    general: [
      'Business registration / 营业执照或商业注册',
      'Content broadcasting license (if required by local law) / 内容广播许可证（如当地法律要求）',
      'Copyright authorization for all content / 所有内容的版权授权',
      'Data protection compliance certification (e.g., GDPR, CCPA) / 数据保护合规认证',
    ],
    china: [
      'ICP备案 (ICP Filing)',
      '信息网络传播视听节目许可证 (Online Audio-Video Program Transmission License)',
      '网络文化经营许可证 (Online Culture Business License)',
    ],
    eu: [
      'GDPR Compliance / GDPR合规',
      'Content Provider License (if applicable) / 内容提供商许可证',
      'Copyright Directive Compliance / 版权指令合规',
    ],
    us: [
      'DMCA Compliance / DMCA合规',
      'FCC Regulations Compliance (if applicable) / FCC法规合规',
      'State Business License / 州商业许可证',
    ],
  },

  /**
   * 相关法律法规（国际通用）
   * Relevant Laws and Regulations (International)
   */
  RELEVANT_LAWS: {
    international: [
      'Berne Convention for the Protection of Literary and Artistic Works / 伯尔尼公约',
      'WIPO Copyright Treaty / WIPO版权条约',
      'Universal Copyright Convention / 世界版权公约',
    ],
    china: [
      '《中华人民共和国著作权法》 (Copyright Law of PRC)',
      '《中华人民共和国网络安全法》 (Cybersecurity Law of PRC)',
      '《个人信息保护法》 (Personal Information Protection Law)',
      '《互联网视听节目服务管理规定》 (Internet Audio-Video Program Service Regulations)',
    ],
    eu: [
      'GDPR (General Data Protection Regulation)',
      'Copyright Directive (EU) 2019/790',
      'Digital Services Act (DSA)',
      'Audiovisual Media Services Directive (AVMSD)',
    ],
    us: [
      'Digital Millennium Copyright Act (DMCA)',
      'Communications Decency Act Section 230',
      'California Consumer Privacy Act (CCPA)',
      'Children\'s Online Privacy Protection Act (COPPA)',
    ],
  },
};

/**
 * 日志记录配置
 * 用于法律追溯和证据保留
 */
export const LEGAL_LOGGING_CONFIG = {
  /**
   * 需要记录的关键操作
   */
  CRITICAL_ACTIONS: [
    'content_upload',      // 内容上传
    'content_publish',     // 内容发布
    'content_delete',      // 内容删除
    'user_register',       // 用户注册
    'admin_action',        // 管理员操作
    'content_report',      // 内容举报
  ],

  /**
   * 日志保留期限（天）
   */
  RETENTION_DAYS: 180, // 建议至少保留6个月

  /**
   * 日志必须包含的字段
   */
  REQUIRED_FIELDS: [
    'timestamp',           // 时间戳
    'userId',             // 用户ID
    'action',             // 操作类型
    'contentId',          // 内容ID（如适用）
    'ipAddress',          // IP地址
    'userAgent',          // 用户代理
    'result',             // 操作结果
  ],
};

/**
 * 内容审核要求
 */
export const CONTENT_MODERATION_REQUIREMENTS = {
  /**
   * 审核类型
   */
  MODERATION_TYPES: {
    PRE_PUBLISH: 'pre_publish',   // 发布前审核（推荐）
    POST_PUBLISH: 'post_publish', // 发布后审核
    REAL_TIME: 'real_time',       // 实时审核
  },

  /**
   * 必须审核的内容类型
   */
  CONTENT_TO_REVIEW: [
    'video',              // 视频内容
    'title',              // 标题
    'description',        // 描述
    'cover_image',        // 封面图
    'user_comment',       // 用户评论
  ],

  /**
   * 禁止的内容类型
   */
  PROHIBITED_CONTENT: [
    '色情淫秽内容',
    '暴力血腥内容',
    '政治敏感内容',
    '侵权盗版内容',
    '虚假信息',
    '违法广告',
    '赌博诈骗',
  ],
};
