const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || '小助手';

// 内置兜底 FAQ：当未提供 qqrobot FAQ 导出文件时使用
const BUILTIN_FAQ = [
    {
        q: '怎么发图片？',
        a: '点击输入框左侧的图片按钮选择图片，或直接把图片拖进聊天窗口，即可发送。',
        keywords: ['图片', '照片', '发图', '截图']
    },
    {
        q: '怎么撤回消息？',
        a: '鼠标移到自己的消息上，点击出现的「撤回」按钮即可。撤回后其他人也会同步消失。',
        keywords: ['撤回', '收回', '撤销']
    },
    {
        q: '怎么发起私聊？',
        a: '在右侧在线成员列表中点击对方头像或昵称，即可进入私聊；再次点击「群聊」按钮返回房间。',
        keywords: ['私聊', '单聊', '私信', '单独']
    },
    {
        q: '怎么创建新房间？',
        a: '点击左侧房间列表上方的「+」按钮，输入房间名称即可创建并加入。',
        keywords: ['创建房间', '新房间', '建群', '加房间']
    },
    {
        q: '怎么置顶消息？',
        a: '鼠标移到消息上，点击「置顶」按钮，被置顶的内容会显示在聊天区顶部。',
        keywords: ['置顶', 'pin', '固定']
    },
    {
        q: '怎么导出聊天记录？',
        a: '点击右上角「⋯」菜单，选择「导出 HTML」或「导出 Markdown」，服务端会生成包含全部历史消息和待办的归档文件。',
        keywords: ['导出', '备份', '归档', '保存记录', 'markdown', 'html']
    },
    {
        q: '历史消息可以翻页加载吗？',
        a: '可以。进入房间默认加载最近 50 条，滚动到聊天区顶部会自动加载更早的历史消息。',
        keywords: ['历史', '翻页', '更早', '记录', '分页']
    },
    {
        q: '怎么搜索历史消息？',
        a: '点击右上角搜索按钮输入关键词，会同时检索当前已加载的消息和服务端全部历史（支持 SQLite FTS5 全文搜索）。',
        keywords: ['搜索', '查找', '检索', '全文']
    },
    {
        q: '怎么新建房间待办？',
        a: '点击顶部「✅」按钮打开房间待办面板，填写待办内容、负责人和截止时间后添加。负责人或创建者可以勾选完成。',
        keywords: ['待办', '任务', 'todo', '截止', '负责人']
    },
    {
        q: '怎么使用机器人？',
        a: '在房间里发送「@bot 你的问题」即可，例如「@bot 怎么导出聊天记录」。也可以让监控面板通过 Webhook 把告警推送到房间。',
        keywords: ['机器人', 'bot', '客服', '问答', 'faq']
    },
    {
        q: '怎么接入监控告警 Webhook？',
        a: '向 /api/webhook/<房间名> 发送 POST JSON（title、content、level、source 字段），告警会以机器人消息推送到该房间。如设置 WEBHOOK_TOKEN 环境变量，需要携带 x-webhook-token 请求头。',
        keywords: ['webhook', '告警', '监控', '报警', '接入']
    },
    {
        q: '怎么开启桌面通知？',
        a: '点击右上角「⋯」菜单中的通知设置，允许浏览器通知权限后，新消息会弹出桌面提醒。',
        keywords: ['通知', '提醒', '桌面通知']
    },
    {
        q: '怎么@提醒某个人？',
        a: '在输入框输入「@」会弹出在线成员列表，选择成员后发送，对方会收到高亮提醒。',
        keywords: ['@', '提醒', '艾特', '提到']
    },
    {
        q: '数据会丢失吗？',
        a: '不会。消息、房间、用户和待办都保存在服务端 SQLite 数据库中，重启服务后历史消息依然保留。',
        keywords: ['丢失', '重启', '保存', '持久化', '数据库']
    },
    {
        q: '怎么发送文件？',
        a: '点击输入框左侧的文件按钮选择文件发送；文件会显示名称和大小，点击即可下载。',
        keywords: ['文件', '发送文件', '附件', '下载']
    },
    {
        q: '怎么发起语音或视频通话？',
        a: '在私聊中点击顶部「语音」或「视频」按钮即可发起通话，对方接听后建立 WebRTC 连接。',
        keywords: ['通话', '语音', '视频', '打电话']
    }
];

const FAQ_FILES = [
    process.env.BOT_FAQ_FILE,
    path.join(__dirname, 'data', 'faq.json'),
    path.join(__dirname, 'faq.json'),
    path.join(__dirname, 'qqrobot-faq.json'),
    path.join(__dirname, 'data', 'qqrobot-faq.json')
].filter(Boolean);

function normalizeEntry(item) {
    if (!item) return null;
    if (typeof item === 'string') {
        return { q: item, a: '', keywords: [] };
    }
    const question = item.question || item.q || item.title || item.intent || '';
    const answer = item.answer || item.a || item.reply || item.content || '';
    if (!question || !answer) return null;
    let keywords = item.keywords || item.keys || [];
    if (typeof keywords === 'string') {
        keywords = keywords.split(/[,，\s]+/).filter(Boolean);
    }
    return { q: String(question), a: String(answer), keywords: keywords.map(String) };
}

function loadFaqFile(file) {
    try {
        if (!fs.existsSync(file)) return null;
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : (parsed.faqs || parsed.data || parsed.list || []);
        const entries = list.map(normalizeEntry).filter(Boolean);
        return entries.length ? entries : null;
    } catch (e) {
        console.error('加载 FAQ 失败 ' + file + ': ' + e.message);
        return null;
    }
}

let entries = BUILTIN_FAQ.map(normalizeEntry);
const loadedFiles = [];
for (const file of FAQ_FILES) {
    if (loadedFiles.length) break;
    const loaded = loadFaqFile(file);
    if (loaded) {
        entries = loaded;
        loadedFiles.push(file);
    }
}

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\s,，。！？!?、；;：:'"“”‘’()（）[\]【】<>《》\-_/\\]+/g, '');
}

function bigrams(text) {
    const map = new Map();
    for (let i = 0; i < text.length - 1; i++) {
        const gram = text.slice(i, i + 2);
        map.set(gram, (map.get(gram) || 0) + 1);
    }
    return map;
}

function overlapScore(a, b) {
    if (!a.length || !b.length) return 0;
    const ga = bigrams(a);
    const gb = bigrams(b);
    let overlap = 0;
    ga.forEach(function (count, gram) {
        if (gb.has(gram)) overlap += Math.min(count, gb.get(gram));
    });
    return (2 * overlap) / (Math.max(a.length - 1, 1) + Math.max(b.length - 1, 1));
}

function scoreEntry(query, entry) {
    const q = normalize(query);
    const question = normalize(entry.q);
    if (!q) return 0;

    let score = 0;
    if (question && q === question) score += 100;
    if (question && q.includes(question)) score += 60;
    if (question && question.includes(q) && q.length >= 2) score += 30;

    entry.keywords.forEach(function (keyword) {
        const kw = normalize(keyword);
        if (kw && q.includes(kw)) score += 12;
    });

    score += overlapScore(q, question) * 40;
    return score;
}

function answer(query) {
    const text = String(query || '').trim();
    if (!text) return null;

    if (/^(帮助|help|\?|？|菜单)$/i.test(text)) {
        return {
            question: '我能帮你做什么',
            answer: '我可以回答常见问题，也会在监控告警推送到房间时播报告警。试试提问：\n' +
                sampleQuestions(3).map(function (q) { return '· ' + q; }).join('\n')
        };
    }

    let best = null;
    let bestScore = 0;
    entries.forEach(function (entry) {
        const score = scoreEntry(text, entry);
        if (score > bestScore) {
            bestScore = score;
            best = entry;
        }
    });

    if (best && bestScore >= 20) {
        return { question: best.q, answer: best.a };
    }
    return null;
}

function sampleQuestions(count) {
    const result = [];
    const step = Math.max(1, Math.floor(entries.length / Math.max(count, 1)));
    for (let i = 0; i < entries.length && result.length < count; i += step) {
        result.push(entries[i].q);
    }
    while (result.length < Math.min(count, entries.length)) {
        result.push(entries[result.length].q);
    }
    return result;
}

module.exports = {
    name: BOT_NAME,
    faqCount: entries.length,
    faqFiles: loadedFiles,
    answer: answer,
    sampleQuestions: sampleQuestions
};
