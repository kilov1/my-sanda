/**
 * 全站敏感词/违禁词过滤模块
 * 覆盖：注册、个人资料、发布、评论、学习资料等所有用户输入
 * 管理员账号可绕过过滤
 */

// 管理员邮箱列表（可扩展）
const ADMIN_EMAILS = ['admin@mysanda.com', 'administrator@mysanda.com'];

// 判断是否为管理员
function isAdmin() {
    if (!currentUser) return false;
    return currentUser.isAdmin === true || ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase());
}
// 设置管理员标志（由 app.js 在加载 profile 后调用）
function setCurrentUserAdmin(flag) {
    if (currentUser) currentUser.isAdmin = !!flag;
}

// 敏感词库：违禁词、色情、暴力、广告、政敏、侮辱性词汇（可自行扩展）
const SENSITIVE_WORDS = [
    // 侮辱性/脏话
    '傻逼', '傻比', '煞笔', '沙比', '草泥马', '尼玛', '你妈', '他妈', '去死', '死全家',
    '贱人', '贱货', '婊子', '骚货', '荡妇', '臭傻', '智障', '脑残', '废物', '垃圾',
    '狗逼', '狗日', '操你', '妈逼', '妈比', '傻缺', '脑残粉', '死妈',
    // 色情/低俗
    '淫荡', '色情', '黄色', '裸体', '做爱', '约炮', '一夜情', '招嫖', '卖淫', '嫖娼',
    'AV', 'av', '毛片', '黄色网站', '黄色电影', '裸聊', '约炮',
    // 赌博/博彩
    '赌博', '六合彩', '彩票', '博彩', '赌场', '赌博网站', '买马', '赌球',
    // 暴力/危险
    '暴力', '杀人', '自杀', '毒品', '冰毒', '海洛因', '枪支', '炸药', '自制炸弹',
    '跳楼', '割腕', '自残',
    // 邪教/政治敏感
    '法轮功', '邪教', '传销', '轮子',
    // 广告/诈骗/导流
    '诈骗', '骗钱', '刷单', '兼职骗', '代刷', '代练', '代购骗', '贷款骗',
    '加微信', '加qq', '加QQ', '联系微信', '联系qq', 'vx', 'VX', '微xin', 'weixin',
    '二维码', '扫码', '私聊', '私信我', '加我', '联系方式', '详询', '咨询加',
    '微信号', 'qq号', 'QQ号', '手机号联系', '电话联系我',
    // 学术违规
    '代考', '替考', '作弊', '考试答案', '包过', '保过', '论文代写', '代写论文'
];

// 外部联系方式正则（网址、微信、QQ、二维码导流）
const EXTERNAL_CONTACT_PATTERNS = [
    /https?:\/\/\S+/gi,
    /www\.\S+/gi,
    /\S+\.(com|cn|net|org|cc|top|xyz|info|wang)(\/\S*)?/gi,
    /[微vV][信xX][：:]\s*\S+/gi,
    /[wW][eE][iI][xX][iI][nN][：:]\s*\S+/gi,
    /[qQ]{2}[号]?[：:]\s*[0-9]{5,}/gi,
    /加[我]?[qQ][qQ]/gi,
    /加[我]?微信/gi,
    /二维码/gi,
    /扫码加/gi
];

/**
 * 检测文本是否包含敏感词
 * @param {string} text - 待检测文本
 * @returns {boolean} - 是否包含敏感词
 */
function containsSensitiveWord(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase().replace(/\s/g, '');
    for (const word of SENSITIVE_WORDS) {
        if (text.includes(word) || lower.includes(word.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * 检测文本是否包含外部联系方式
 * @param {string} text - 待检测文本
 * @returns {boolean} - 是否包含
 */
function containsExternalContact(text) {
    if (!text || typeof text !== 'string') return false;
    for (const pattern of EXTERNAL_CONTACT_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        if (regex.test(text)) return true;
    }
    return false;
}

/**
 * 统一内容校验入口
 * @param {string} text - 待校验文本
 * @param {Object} options - 选项 { skipAdmin: boolean, checkContact: boolean }
 * @returns {{ valid: boolean, message: string }}
 */
function validateContent(text, options = {}) {
    const { skipAdmin = true, checkContact = true } = options;

    if (!text || typeof text !== 'string') {
        return { valid: true, message: '' };
    }

    const trimmed = text.trim();
    if (!trimmed) {
        return { valid: true, message: '' };
    }

    // 管理员跳过过滤
    if (skipAdmin && isAdmin()) {
        return { valid: true, message: '' };
    }

    // 优先检测外部联系方式
    if (checkContact && containsExternalContact(trimmed)) {
        return { valid: false, message: '禁止发布外部联系方式，请遵守社区规范' };
    }

    // 敏感词检测
    if (containsSensitiveWord(trimmed)) {
        return { valid: false, message: '内容包含违规/敏感信息，请修改后重新发布' };
    }

    return { valid: true, message: '' };
}

/**
 * 注册/昵称专用校验
 */
function validateNickname(text) {
    if (!text || typeof text !== 'string') return { valid: true, message: '' };
    const trimmed = text.trim();
    if (!trimmed) return { valid: true, message: '' };
    if (isAdmin()) return { valid: true, message: '' };
    if (containsExternalContact(trimmed)) {
        return { valid: false, message: '禁止使用外部联系方式作为昵称，请遵守社区规范' };
    }
    if (containsSensitiveWord(trimmed)) {
        return { valid: false, message: '昵称包含敏感/违规词汇，请修改后重新注册' };
    }
    return { valid: true, message: '' };
}

/**
 * 个人资料专用校验
 */
function validateProfile(text) {
    if (!text || typeof text !== 'string') return { valid: true, message: '' };
    const trimmed = text.trim();
    if (!trimmed) return { valid: true, message: '' };
    if (isAdmin()) return { valid: true, message: '' };
    if (containsExternalContact(trimmed)) {
        return { valid: false, message: '禁止发布外部联系方式，请遵守社区规范' };
    }
    if (containsSensitiveWord(trimmed)) {
        return { valid: false, message: '内容包含敏感/违规信息，请修改后保存' };
    }
    return { valid: true, message: '' };
}
