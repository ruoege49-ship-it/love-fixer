// Love 修正机 · if love · 酒馆扩展版 1.1.0
import * as ST from '/script.js';
import * as OAI from '/scripts/openai.js';
import * as PER from '/scripts/personas.js';

if (window.__loveFixer || document.getElementById('lf_module')) {
    (window.toastr)?.info('Love 修正机已经在运行了（扩展版和酒馆助手脚本版只要开一个）', 'Love 修正机');
} else {
window.__loveFixer = 'extension';
const MOD = 'love_fixer';
const VER = '1.1.0';
const ctx = () => SillyTavern.getContext();
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const snip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const say = (m, t = 'info') => window.toastr?.[t]?.(m, 'Love 修正机');

/* ---------------- 数据 ---------------- */

const FIXES = [
    { id: 'ui_err_explain', g: 'ui', n: '报错自动解释', d: '酒馆弹红色报错时，小助手告诉你是什么意思、怎么办' },
    { id: 'ui_toast_quiet', g: 'ui', n: '屏蔽烦人提示', d: '比如“已自动选择用户设定”这类每次都弹的提示' },
    { id: 'ui_msg_buttons', g: 'ui', n: '收起少用的消息按钮', d: '翻译、朗读、生图、向量、书签不再挤在每条消息上' },
    { id: 'ui_welcome', g: 'ui', n: '打开直接进上次的聊天', d: '跳过欢迎页' },
    { id: 'ui_start_btn', g: 'ui', n: '顶栏显示修正机按钮', d: '新手引导、查问题、优化设置都在里面；新手步骤没做完会亮小红点' },
    { id: 'ui_import_guard', g: 'ui', n: '导入时安全提醒', d: '卡带脚本或正则时提醒一句；导入全局正则时提醒它会在所有卡生效' },
    { id: 'ui_hide_custom', g: 'ui', n: '隐藏你点选过的按钮', d: '点“开始点选”，点哪个藏哪个', extra: 'pick' },
    { id: 'perf_no_blur', g: 'perf', n: '关掉模糊和动画', d: '手机发烫、卡顿首选' },
    { id: 'perf_render_limit', g: 'perf', n: '只加载最近的楼层', d: '长聊天打开更快，往上翻还能再加载', extra: 'limit' },
    { id: 'perf_lazy_avatar', g: 'perf', n: '头像懒加载', d: '滑到才加载，大卡库更快' },
    { id: 'chat_draft', g: 'chat', n: '输入框草稿防丢', d: '刷新、切聊天、误触返回都不丢' },
    { id: 'chat_scroll_bottom', g: 'chat', n: '回到底部按钮', d: '往上翻时右下角出现' },
    { id: 'chat_confirm_regen', g: 'chat', n: '重新生成前确认', d: '防止误触把好回复刷掉' },
    { id: 'chat_token_count', g: 'chat', n: '每条消息显示 token', d: '用酒馆自带的计数' },
    { id: 'mob_enter_newline', g: 'mob', n: '回车换行，不直接发送', d: '发送请点发送键' },
    { id: 'mob_no_gesture', g: 'mob', n: '关掉左右滑动切回复', d: '翻页时不会误触换回复' },
    { id: 'mob_no_zoom', g: 'mob', n: '双击不缩放', d: '' },
    { id: 'mob_full_panel', g: 'mob', n: '侧边面板全屏打开', d: '小屏上不再挤成一条' },
    { id: 'mob_big_tap', g: 'mob', n: '按钮点击区域放大', d: '' },
    { id: 'chat_summary_nudge', g: 'chat', n: '聊天太长时提醒大总结', d: '发给 AI 的聊天记录超过 10 万 token 时提醒一次，每多 10 万再提醒' },
    { id: 'chat_time_remind', g: 'chat', n: '玩久了提醒休息', d: '连续在线每满两小时提醒一次' },
    { id: 'gen_retry_empty', g: 'gen', n: '空回复自动重试', d: '最多重试两次' },
    { id: 'gen_auto_continue', g: 'gen', n: '回复像被截断时自动继续', d: '实验：结尾没有收尾标点就续写一次' },
    { id: 'gen_wait_time', g: 'gen', n: '显示等了多久', d: '每条回复下面小字显示等待秒数' },
];

const GROUPS = [
    ['ui', '界面精简', 'fa-eye-slash'],
    ['perf', '后台优化', 'fa-gauge-high'],
    ['chat', '聊天', 'fa-comments'],
    ['mob', '手机端', 'fa-mobile-screen'],
    ['gen', '生成', 'fa-bolt'],
];

const BUILTINS = [
    ['stable-diffusion', '图片生成', '没接绘图就关掉'],
    ['tts', '语音朗读', ''],
    ['translate', '翻译', ''],
    ['vectors', '向量存储', '最拖后台的一项'],
    ['expressions', '表情立绘', ''],
    ['memory', '自动摘要', ''],
    ['caption', '图片识别', ''],
    ['gallery', '图库', ''],
    ['quick-reply', '快速回复', ''],
];

const PRESETS = {
    '推荐': ['ui_err_explain', 'ui_start_btn', 'chat_summary_nudge', 'ui_import_guard', 'ui_toast_quiet', 'ui_msg_buttons', 'chat_draft', 'chat_scroll_bottom', 'perf_lazy_avatar', 'mob_no_zoom'],
    '手机': ['ui_err_explain', 'ui_start_btn', 'chat_summary_nudge', 'ui_import_guard', 'ui_toast_quiet', 'ui_msg_buttons', 'chat_draft', 'chat_scroll_bottom', 'perf_lazy_avatar', 'perf_no_blur', 'perf_render_limit', 'mob_enter_newline', 'mob_no_gesture', 'mob_no_zoom', 'mob_full_panel', 'mob_big_tap'],
    '极简': ['ui_err_explain', 'ui_start_btn', 'chat_summary_nudge', 'ui_import_guard', 'ui_toast_quiet', 'ui_msg_buttons', 'ui_welcome', 'ui_hide_custom', 'chat_draft', 'chat_scroll_bottom', 'perf_lazy_avatar', 'perf_no_blur'],
    '全关': [],
};

const PRESET_INFO = {
    '推荐': '大多数人用这个：报错自动解释、收起少用的消息按钮、草稿防丢、回到底部、导入提醒、大总结提醒。',
    '手机': '推荐的全部，再加：关掉模糊和动画、只加载最近楼层、回车换行不发送、关滑动切回复、面板全屏、按钮放大。手机发烫卡顿首选。',
    '极简': '推荐的全部，再加：打开直接进上次的聊天、关掉模糊和动画、可以点选隐藏不用的按钮。',
    '全关': '修正机的修正全部关掉，酒馆恢复原样（小助手、体检这些还能用）。',
};
const isMobile = () => /android|iphone|ipad|mobile/i.test(navigator.userAgent) || innerWidth < 800;

const FONTS = [
    ['', '跟随主题', ''],
    ['LXGW WenKai', '霞鹜文楷', 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css'],
    ['Noto Serif SC', '思源宋体', 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap'],
    ['Noto Sans SC', '思源黑体', 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap'],
    ['ZCOOL KuaiLe', '站酷快乐体', 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap'],
    ['Ma Shan Zheng', '马善政楷书', 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap'],
];

// 通过酒馆自己的设置控件来改，酒馆会自己生效；关掉时还原成原来的值
const CTL = {
    ui_welcome: ['#auto_load_chat_checkbox', true],
    perf_no_blur: ['#reduced_motion', true],
    perf_render_limit: ['#chat_truncation', () => S().limit],
    chat_token_count: ['#message_token_count_enabled', true],
    mob_enter_newline: ['#send_on_enter', '-1'],
    mob_no_gesture: ['#gestures-checkbox', false],
};

const CSS_FIX = {
    ui_msg_buttons: `.mes_buttons .mes_translate,.mes_buttons .sd_message_gen,.mes_buttons .mes_narrate,.mes_buttons .mes_embed,.mes_buttons .mes_create_bookmark,.mes_buttons .mes_create_branch{display:none!important}`,
    perf_no_blur: `*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation-duration:0s!important;transition-duration:0s!important}`,
    mob_no_zoom: `html,body{touch-action:manipulation}`,
    mob_full_panel: `@media (max-width:1000px){#right-nav-panel,#left-nav-panel,#top-settings-holder .drawer-content{width:100dvw!important;max-width:100dvw!important;left:0!important;right:0!important;margin:0!important}}`,
    mob_big_tap: `@media (max-width:1000px){.mes_buttons .mes_button,.extraMesButtons .mes_button{padding:8px!important;font-size:1.1em}#leftSendForm>*,#rightSendForm>*{min-width:36px;min-height:36px;display:inline-flex;align-items:center;justify-content:center}}`,
};

const QUIET = /自动选择|临时用户设定|临时人设|已锁定用户设定|auto-?selected|temporary persona|persona (?:auto|lock)/i;

const DEF = {
    preset: '', novice: false, fixes: {}, limit: 30, hidden: [], font: '', fontCustom: '', fontSize: 0,
    orig: {}, charAvatars: {}, builtinsTouched: false,
    undo: [], favs: [], pickTab: 'all', look: { mode: 'day', night: 'bw' },
    helper: { mode: 'st', protocol: 'openai', url: '', model: '', desk: '', attach: { preset: true, regex: true, ext: false } },
};

function S() {
    const es = ctx().extensionSettings;
    if (!es[MOD]) {
        es[MOD] = structuredClone(DEF);
        PRESETS['推荐'].forEach((id) => (es[MOD].fixes[id] = true));
        es[MOD].preset = '推荐';
    }
    const s = es[MOD];
    for (const k in DEF) if (s[k] === undefined) s[k] = structuredClone(DEF[k]);
    if (s.fixes.ui_err_explain === undefined) s.fixes.ui_err_explain = true;
    if (s.fixes.ui_import_guard === undefined) s.fixes.ui_import_guard = true;
    if (s.fixes.ui_start_btn === undefined) s.fixes.ui_start_btn = true;
    if (s.fixes.chat_summary_nudge === undefined) s.fixes.chat_summary_nudge = true;
    if (!Array.isArray(s.undo)) s.undo = [];
    if (!Array.isArray(s.favs)) s.favs = [];
    s.helper = { ...DEF.helper, ...s.helper, attach: { ...DEF.helper.attach, ...(s.helper?.attach || {}) } };
    return s;
}
const save = () => ctx().saveSettingsDebounced();
const on = (id) => !!S().fixes[id];

/* ---------------- 应用修正 ---------------- */

let styleEl;
function applyCSS() {
    const s = S();
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'lf_css'; document.head.appendChild(styleEl); }
    const out = [];
    for (const id in CSS_FIX) if (on(id)) out.push(CSS_FIX[id]);
    if (on('ui_hide_custom') && s.hidden.length) out.push(s.hidden.map((x) => `${x}`).join(',') + '{display:none!important}');
    const fam = currentFontFamily();
    if (fam) out.push(`#chat .mes_text,#send_textarea{font-family:${fam}!important}#chat .mes_text :is(p,em,strong,q,li,blockquote){font-family:inherit!important}`);
    if (s.fontSize) out.push(`#chat .mes_text{font-size:${Number(s.fontSize)}px!important}`);
    styleEl.textContent = out.join('\n');
    document.body.classList.toggle('lf-novice', !!s.novice);
}

function currentFontFamily() {
    const s = S();
    if (s.font === '__custom') {
        const [name] = String(s.fontCustom || '').split('|').map((x) => x.trim());
        return name ? `"${name.replace(/"/g, '')}",serif` : '';
    }
    return s.font ? `"${s.font}",serif` : '';
}

function loadFontCss() {
    const s = S();
    let url = '';
    if (s.font === '__custom') url = String(s.fontCustom || '').split('|')[1]?.trim() || '';
    else url = FONTS.find((f) => f[0] === s.font)?.[2] || '';
    let link = document.getElementById('lf_font_link');
    if (!url) { link?.remove(); return; }
    if (!link) { link = document.createElement('link'); link.id = 'lf_font_link'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    if (link.href !== url) link.href = url;
}

function ctl(sel, flag, val) {
    const el = document.querySelector(sel);
    if (!el) return;
    const s = S();
    const cur = el.type === 'checkbox' ? el.checked : el.value;
    let target;
    if (flag) {
        if (!(sel in s.orig)) s.orig[sel] = cur;
        target = val;
    } else {
        if (!(sel in s.orig)) return;
        target = s.orig[sel];
        delete s.orig[sel];
    }
    if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === String(target))) return;
    if (el.type === 'checkbox') { if (el.checked === !!target) return save(); el.checked = !!target; }
    else { if (String(el.value) === String(target)) return save(); el.value = String(target); }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    save();
}

function applyCtl(id) {
    const m = CTL[id];
    if (!m) return;
    ctl(m[0], on(id), typeof m[1] === 'function' ? m[1]() : m[1]);
}

let lazyObs = null;
function applyLazy() {
    const fix = (root) => root.querySelectorAll?.('img:not([loading])').forEach((i) => { i.loading = 'lazy'; i.decoding = 'async'; });
    if (on('perf_lazy_avatar') && !lazyObs) {
        lazyObs = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'IMG') { if (!n.hasAttribute('loading')) n.loading = 'lazy'; } else fix(n);
        })));
        ['#rm_print_characters_block', '#chat'].forEach((sel) => {
            const el = document.querySelector(sel);
            if (el) { fix(el); lazyObs.observe(el, { childList: true, subtree: true }); }
        });
    } else if (!on('perf_lazy_avatar') && lazyObs) { lazyObs.disconnect(); lazyObs = null; }
}

const KEEP_EXT = /正则|regex|酒馆助手|tavern ?helper|slash ?runner|修正机|提示词模板|prompt ?template/i;
function markNovice() {
    ['#extensions_settings', '#extensions_settings2'].forEach((sel) => {
        const box = document.querySelector(sel);
        if (!box) return;
        [...box.children].forEach((child) => {
            const hd = child.querySelector('.inline-drawer-header');
            const txt = (hd?.textContent || child.textContent || '').slice(0, 120);
            child.classList.toggle('lf-nov-hide', !KEEP_EXT.test(txt));
        });
    });
}

// 外观：日间 / 夜间（黑与白、黑蓝深海）/ 跟随酒馆，和智库一样
function stIsDark() {
    const v = getComputedStyle(document.body).getPropertyValue('--SmartThemeBlurTintColor').trim() || getComputedStyle(document.body).backgroundColor;
    const m = v.match(/[\d.]+/g);
    if (!m || m.length < 3) return false;
    const [r, g, b] = m.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}
function applyLook() {
    const L = { mode: 'day', night: 'bw', ...(S().look || {}) };
    const night = L.mode === 'night' || (L.mode === 'auto' && stIsDark());
    document.body.classList.toggle('lf-night-bw', night && L.night !== 'sea');
    document.body.classList.toggle('lf-night-sea', night && L.night === 'sea');
    if (!document.getElementById('lf_serif_font')) {
        const l = document.createElement('link');
        l.id = 'lf_serif_font'; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap';
        document.head.appendChild(l);
    }
}
function lookHtml() {
    const L = { mode: 'day', night: 'bw', ...(S().look || {}) };
    const c = (k, v, n) => `<span class="lf-chip${L[k] === v ? ' on' : ''}" data-look="${k}:${v}">${n}</span>`;
    return `<div class="lf-grp lf-solo"><div class="lf-row lf-look" data-text="外观 日间 夜间 黑与白 黑蓝深海 跟随酒馆"><div class="lf-row-t"><b>修正机外观</b><small>和智库一套；“跟随酒馆”会在酒馆用深色主题时自动换夜间</small></div>
        <div class="lf-chips">${c('mode', 'day', '日间')}${c('mode', 'night', '夜间')}${c('mode', 'auto', '跟随酒馆')}</div>
        <div class="lf-chips">${c('night', 'bw', '夜间：黑与白')}${c('night', 'sea', '夜间：黑蓝深海')}</div></div></div>`;
}

function applyAll() {
    applyLook();
    applyCSS();
    loadFontCss();
    Object.keys(CTL).forEach(applyCtl);
    applyLazy();
    markNovice();
    toggleBottomBtn();
    mountStartBtn();
}

/* ---------------- 主面板 ---------------- */

const openGroups = new Set();

function swHtml(isOn, attrs) { return `<span class="lf-sw${isOn ? ' on' : ''}" ${attrs} role="switch" aria-checked="${isOn}"></span>`; }

function rowHtml(f) {
    let extra = '';
    if (f.extra === 'limit') {
        extra = `<div class="lf-extra"><input type="range" min="10" max="200" step="10" value="${S().limit}" class="lf-limit"><span class="lf-limit-v">${S().limit} 楼</span></div>`;
    }
    if (f.extra === 'pick') {
        extra = `<div class="lf-extra"><button class="lf-btn lf-pick">开始点选</button><button class="lf-btn lf-unhide">全部恢复（${S().hidden.length}）</button></div>`;
    }
    return `<div class="lf-row" data-text="${esc(f.n + f.d)}"><div class="lf-row-main"><div class="lf-row-t"><b>${f.n}</b>${f.d ? `<small>${f.d}</small>` : ''}</div>${swHtml(on(f.id), `data-fix="${f.id}"`)}</div>${extra}</div>`;
}

function builtinState() {
    const dis = new Set(ctx().extensionSettings.disabledExtensions || []);
    return dis;
}

let pendingDisabled = null;

function panelHtml(kind = 'ext') {
    const s = S();
    const dis = pendingDisabled || builtinState();
    const groups = GROUPS.map(([g, name, icon]) => {
        const list = FIXES.filter((f) => f.g === g);
        const cnt = list.filter((f) => on(f.id)).length;
        return `<div class="lf-grp${openGroups.has(g) ? ' open' : ''}" data-g="${g}">
            <div class="lf-gh"><i class="fa-solid ${icon}"></i><span>${name}</span><em>${cnt} / ${list.length}</em><i class="fa-solid fa-chevron-down lf-cv"></i></div>
            <div class="lf-gb">${list.map(rowHtml).join('')}</div></div>`;
    }).join('');
    const builtins = BUILTINS.map(([k, n, d]) => `<div class="lf-row" data-text="${esc(n + d)}"><div class="lf-row-main"><div class="lf-row-t"><b>${n}</b>${d ? `<small>${d}</small>` : ''}</div>${swHtml(!dis.has(k), `data-ext="${k}"`)}</div></div>`).join('');
    const h = s.helper;
    return `
    <div class="lf-sign">IF LOVE · ${VER}</div>
    ${quickOptHtml()}
    ${lookHtml()}
    <input class="text_pole lf-search" placeholder="想改哪一项？搜一下">
    <div class="lf-grp lf-solo"><div class="lf-row" data-text="新手模式"><div class="lf-row-main"><div class="lf-row-t"><b>新手模式</b><small>收起高级格式化、背景和用不上的扩展；预设、世界书、user 设定、美化、脚本、正则都留着</small></div>${swHtml(s.novice, 'data-novice')}</div></div></div>
    ${groups}
    <div class="lf-grp${openGroups.has('builtin') ? ' open' : ''}" data-g="builtin">
        <div class="lf-gh"><i class="fa-solid fa-power-off"></i><span>功能开关</span><em>用不到就停用</em><i class="fa-solid fa-chevron-down lf-cv"></i></div>
        <div class="lf-gb">${builtins}<div class="lf-extra"><button class="lf-btn lf-apply-ext"><i class="fa-solid fa-rotate"></i> 应用并重载</button></div><small class="lf-note">停用后后台也不再加载，要重载酒馆才生效</small></div>
    </div>
    <div class="lf-grp${openGroups.has('helper') ? ' open' : ''}" data-g="helper">
        <div class="lf-gh"><i class="fa-solid fa-circle-question"></i><span>小助手</span><em>点哪讲哪</em><i class="fa-solid fa-chevron-down lf-cv"></i></div>
        <div class="lf-gb">
            <div class="lf-form">
                <label>接口<select class="text_pole lf-h" data-h="mode"><option value="st"${h.mode === 'st' ? ' selected' : ''}>用酒馆当前连接</option><option value="own"${h.mode === 'own' ? ' selected' : ''}>自己填</option></select></label>
                <div class="lf-own"${h.mode === 'own' ? '' : ' hidden'}>
                    <label>格式<select class="text_pole lf-h" data-h="protocol"><option value="openai"${h.protocol === 'openai' ? ' selected' : ''}>OpenAI 兼容</option><option value="anthropic"${h.protocol === 'anthropic' ? ' selected' : ''}>Anthropic</option></select></label>
                    <label>地址<input class="text_pole lf-h" data-h="url" value="${esc(h.url)}" placeholder="https://你的接口/v1"></label>
                    <label>模型<input class="text_pole lf-h" data-h="model" value="${esc(h.model)}" placeholder="填模型名"></label>
                    <label>密钥<input class="text_pole lf-key" type="password" value="${esc(localStorage.getItem('lf_helper_key') || '')}" placeholder="保存在本机，用于请求所选接口"></label>
                </div>
                <label>答疑链接<input class="text_pole lf-h" data-h="desk" value="${esc(h.desk)}" placeholder="「新手答疑」频道链接，填了就能一键跳过去"></label>
                <div class="lf-attach"><span>提问时附带</span>
                    <label><input type="checkbox" data-att="preset"${h.attach.preset ? ' checked' : ''}>预设结构</label>
                    <label><input type="checkbox" data-att="regex"${h.attach.regex ? ' checked' : ''}>正则列表</label>
                    <label><input type="checkbox" data-att="ext"${h.attach.ext ? ' checked' : ''}>已装扩展</label>
                </div>
            </div>
        </div>
    </div>
    ${kind === 'ext' ? `<div class="lf-actions">
        <button class="lf-btn lf-open-hub"><i class="fa-solid fa-table-cells-large"></i> 全部功能</button>
        <button class="lf-btn lf-open-check"><i class="fa-solid fa-stethoscope"></i> 帮我查问题</button>
    </div>` : ''}`;
}

function quickOptHtml() {
    const s = S();
    const rec = isMobile() ? '手机' : '推荐';
    return `<div class="lf-qo">
        <div class="lf-qo-h"><b>快速优化</b><small>${isMobile() ? '你在用手机' : '你在用电脑'}，推荐「${rec}」。点一下就换，随时能换回来。</small></div>
        ${Object.keys(PRESETS).map((p) => `<div class="lf-qo-it${s.preset === p ? ' on' : ''}" data-preset="${p}">
            <span class="lf-qo-n">${p}${p === rec ? '<em>推荐</em>' : ''}${s.preset === p ? '<em class="cur">正在用</em>' : ''}</span>
            <small>${PRESET_INFO[p] || ''}</small></div>`).join('')}
        ${s.preset ? '' : '<small class="lf-muted">现在是你自己调过的设置，不属于哪个方案。</small>'}
    </div>`;
}

function renderPanel() {
    $$('.lf-pbody').forEach((box) => {
        const q = box.querySelector('.lf-search')?.value || '';
        box.innerHTML = panelHtml(box.dataset.kind || 'ext');
        if (q) { const inp = box.querySelector('.lf-search'); inp.value = q; filterPanel(q, box); }
    });
}
function filterPanel(q, box) {
    q = q.trim().toLowerCase();
    $$('.lf-grp', box).forEach((g) => {
        let any = false;
        $$('.lf-row', g).forEach((r) => {
            const hit = !q || (r.dataset.text || '').toLowerCase().includes(q);
            r.style.display = hit ? '' : 'none';
            if (hit) any = true;
        });
        g.style.display = !q || any ? '' : 'none';
        g.classList.toggle('force-open', !!q && any);
    });
}

function mountPanel() {
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!host || document.getElementById('lf_panel')) return;
    const wrap = document.createElement('div');
    wrap.id = 'lf_panel';
    wrap.innerHTML = `<div class="inline-drawer"><div class="inline-drawer-toggle inline-drawer-header"><b>Love 修正机</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div><div class="inline-drawer-content lf-pbody" id="lf_panel_body" data-kind="ext"></div></div>`;
    host.appendChild(wrap);
    renderPanel();
    bindPanel(document.getElementById('lf_panel_body'));

    // 新手模式需要跟着扩展面板变化重新标记
    const mo = new MutationObserver(() => S().novice && markNovice());
    ['#extensions_settings', '#extensions_settings2'].forEach((sel) => { const el = document.querySelector(sel); if (el) mo.observe(el, { childList: true }); });
}

function bindPanel(body) {

    body.addEventListener('input', (e) => {
        const t = e.target;
        if (t.classList.contains('lf-search')) return filterPanel(t.value, body);
        if (t.classList.contains('lf-limit')) {
            S().limit = Number(t.value);
            t.parentElement.querySelector('.lf-limit-v').textContent = `${t.value} 楼`;
            if (on('perf_render_limit')) { delete S().orig['#chat_truncation']; ctl('#chat_truncation', true, S().limit); }
            save();
        }
        if (t.classList.contains('lf-h') && t.tagName === 'INPUT') { S().helper[t.dataset.h] = t.value.trim(); save(); }
        if (t.classList.contains('lf-key')) localStorage.setItem('lf_helper_key', t.value.trim());
    });

    body.addEventListener('change', (e) => {
        const t = e.target;
        if (t.classList.contains('lf-h') && t.tagName === 'SELECT') {
            S().helper[t.dataset.h] = t.value; save();
            if (t.dataset.h === 'mode') body.querySelector('.lf-own').hidden = t.value !== 'own';
        }
        if (t.dataset.att) { S().helper.attach[t.dataset.att] = t.checked; save(); }
    });

    body.addEventListener('click', async (e) => {
        const t = e.target;
        const gh = t.closest('.lf-gh');
        if (gh) {
            const g = gh.parentElement; const k = g.dataset.g;
            g.classList.toggle('open');
            g.classList.contains('open') ? openGroups.add(k) : openGroups.delete(k);
            return;
        }
        const sw = t.closest('.lf-sw');
        if (sw) {
            const s = S();
            if (sw.dataset.fix) {
                const id = sw.dataset.fix;
                s.fixes[id] = !s.fixes[id];
                s.preset = '';
                applyCSS(); applyCtl(id); applyLazy(); toggleBottomBtn();
                if (id === 'gen_wait_time') renderAllWaits();
                if (id === 'ui_start_btn') mountStartBtn();
            } else if (sw.dataset.novice !== undefined) {
                s.novice = !s.novice; applyCSS(); markNovice();
                say(s.novice ? '新手模式已开：收起了高级格式化、背景和用不上的扩展' : '新手模式已关');
            } else if (sw.dataset.ext) {
                if (!pendingDisabled) pendingDisabled = builtinState();
                const k = sw.dataset.ext;
                pendingDisabled.has(k) ? pendingDisabled.delete(k) : pendingDisabled.add(k);
            }
            save(); renderPanel(); return;
        }
        const lk = t.closest('[data-look]');
        if (lk) { const [k, v] = lk.dataset.look.split(':'); S().look = { mode: 'day', night: 'bw', ...(S().look || {}), [k]: v }; save(); applyLook(); renderPanel(); return; }
        const chip = t.closest('[data-preset]');
        if (chip) {
            const name = chip.dataset.preset; const s = S();
            const before = new Set(FIXES.filter((f) => on(f.id)).map((f) => f.id));
            FIXES.forEach((f) => (s.fixes[f.id] = PRESETS[name].includes(f.id)));
            s.preset = name; save(); applyAll(); renderPanel();
            const opened = FIXES.filter((f) => on(f.id) && !before.has(f.id)).map((f) => f.n);
            const closed = FIXES.filter((f) => !on(f.id) && before.has(f.id)).map((f) => f.n);
            say(`换成「${name}」了。${opened.length ? `<br>打开：${opened.join('、')}` : ''}${closed.length ? `<br>关掉：${closed.join('、')}` : ''}${!opened.length && !closed.length ? '没有要改的。' : ''}`, 'success'); return;
        }
        if (t.closest('.lf-pick')) return startPick();
        if (t.closest('.lf-unhide')) { S().hidden = []; save(); applyCSS(); renderPanel(); say('点选隐藏的都恢复了'); return; }
        if (t.closest('.lf-apply-ext')) return applyBuiltins();
        if (t.closest('.lf-open-quick')) return openQuick();
        if (t.closest('.lf-open-check')) return openCheckup();
        if (t.closest('.lf-open-hub')) return openHub();
        if (t.closest('.lf-open-undo')) return openCheckup(true);
        if (t.closest('.lf-open-pick')) return openPicker();
        if (t.closest('.lf-toggle-help')) { setHelper(!helperOn); return; }
        if (t.closest('.lf-open-ask')) return openAsk();
        if (t.closest('.lf-open-gloss')) return openGlossary();
        if (t.closest('.lf-open-wiz')) return openStart();
        if (t.closest('.lf-open-guide-ext')) return openGuide('ext');
        if (t.closest('.lf-open-guide-lang')) return openGuide('lang');
    });
}

function openOptimize() {
    closeOptionsMenu();
    const w = sheet('lf_optim', '优化设置', '<div class="lf-pbody" data-kind="sheet"></div>');
    const body = w.querySelector('.lf-pbody');
    body.innerHTML = panelHtml('sheet');
    bindPanel(body);
}

async function applyBuiltins() {
    const c = ctx();
    const set = pendingDisabled || builtinState();
    const builtinKeys = new Set(BUILTINS.map((b) => b[0]));
    const others = (c.extensionSettings.disabledExtensions || []).filter((k) => !builtinKeys.has(k));
    c.extensionSettings.disabledExtensions = [...others, ...[...set].filter((k) => builtinKeys.has(k))];
    S().builtinsTouched = true;
    say('保存好了，马上重载');
    try { if (typeof ST.saveSettings === 'function') await ST.saveSettings(); else save(); } catch { save(); }
    setTimeout(() => location.reload(), 1200);
}

/* ---------------- 点选隐藏 ---------------- */

let picking = false;
const BAD_CLS = /^(lf-|open|closed|hover|active|focus|selected|disabled|displayNone|interactable|fa-lg|fa-fw|animated)/;

function cssPath(el) {
    if (!el || el === document.body) return '';
    if (el.id && !/^\d/.test(el.id)) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el; let depth = 0;
    while (cur && cur !== document.body && depth < 4) {
        if (cur.id && !/^\d/.test(cur.id)) { parts.unshift('#' + CSS.escape(cur.id)); break; }
        const cls = [...cur.classList].filter((c) => !BAD_CLS.test(c)).slice(0, 3);
        let part = cur.tagName.toLowerCase() + cls.map((c) => '.' + CSS.escape(c)).join('');
        if (!cls.length && cur.parentElement) {
            const same = [...cur.parentElement.children].filter((x) => x.tagName === cur.tagName);
            if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
        }
        parts.unshift(part);
        cur = cur.parentElement; depth++;
    }
    return parts.join(' > ').replace(/ > (#[^ ]+)/, ' $1');
}

function pickHandler(e) {
    if (!picking) return;
    if (e.target.closest('#lf_pickbar, #lf_panel, #lf_wiz')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const el = e.target.closest('.list-group-item, .menu_button, .mes_button, .drawer, .interactable, a, button, [id]') || e.target;
    const sel = cssPath(el);
    if (!sel) return;
    const s = S();
    if (!s.hidden.includes(sel)) s.hidden.push(sel);
    s.fixes.ui_hide_custom = true;
    save(); applyCSS();
    updatePickbar();
}

function updatePickbar() {
    const bar = document.getElementById('lf_pickbar');
    if (bar) bar.querySelector('span').textContent = `点选隐藏中 · 已藏 ${S().hidden.length} 个`;
}

function startPick() {
    if (picking) return;
    picking = true;
    if (helperOn) setHelper(false);
    const bar = document.createElement('div');
    bar.id = 'lf_pickbar';
    bar.innerHTML = `<span></span><button data-a="undo">撤销</button><button data-a="done">完成</button>`;
    document.body.appendChild(bar);
    updatePickbar();
    bar.addEventListener('click', (e) => {
        const a = e.target.closest('button')?.dataset.a;
        if (a === 'undo') { S().hidden.pop(); save(); applyCSS(); updatePickbar(); }
        if (a === 'done') stopPick();
    });
    document.addEventListener('click', pickHandler, true);
    say('点页面上任意按钮就把它藏起来，点“完成”结束');
}

function stopPick() {
    picking = false;
    document.removeEventListener('click', pickHandler, true);
    document.getElementById('lf_pickbar')?.remove();
    renderPanel();
}

/* ---------------- 弹层 ---------------- */

function sheet(id, title, bodyHtml) {
    document.getElementById(id)?.remove();
    const w = document.createElement('div');
    w.className = 'lf-mask';
    w.id = id;
    w.innerHTML = `<div class="lf-sheet"><div class="lf-sheet-h"><b>${title}</b><i class="fa-solid fa-xmark lf-x" title="关闭"></i></div><div class="lf-sheet-b">${bodyHtml}</div></div>`;
    document.body.appendChild(w);
    w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('.lf-x')) w.remove(); });
    return w;
}

function closeOptionsMenu() {
    const o = document.getElementById('options');
    if (o) o.style.display = 'none';
}

/* ---------------- 快捷台 ---------------- */

function chatTime(x) {
    const v = x.last_mes;
    if (typeof v === 'number') return v;
    const d = Date.parse(String(v ?? '').replace(/(\d)(am|pm)/i, '$1 $2'));
    return isNaN(d) ? 0 : d;
}
function ago(t) {
    if (!t) return '';
    try { if (window.moment) return window.moment(t).fromNow(); } catch { /* */ }
    return new Date(t).toLocaleDateString();
}
const thumb = (type, file) => `/thumbnail?type=${type}&file=${encodeURIComponent(file)}`;
const fixPath = (p) => (p && !/^(https?:|data:|\/)/.test(p) ? '/' + p : p);

async function uploadImage(file) {
    const data = await new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.onerror = j; fr.readAsDataURL(file); });
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const name = `lf_avatar_${Date.now()}.${ext}`;
    const res = await fetch('/api/files/upload', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ name, data }) });
    if (!res.ok) throw new Error('上传失败');
    const j = await res.json();
    return fixPath(j.path);
}

function applyAvatarOverride() {
    const c = ctx();
    const p = c.chatMetadata?.lf_char_avatar || '';
    $$('#chat .mes[is_user="false"]:not([is_system="true"]) .avatar img').forEach((img) => {
        if (p) {
            if (!img.dataset.lfOrig) img.dataset.lfOrig = img.getAttribute('src');
            if (img.getAttribute('src') !== p) img.setAttribute('src', p);
        } else if (img.dataset.lfOrig) {
            img.setAttribute('src', img.dataset.lfOrig);
            delete img.dataset.lfOrig;
        }
    });
}

async function writeAvatarToCard(char, path) {
    const blob = await (await fetch(path)).blob();
    const fd = new FormData();
    fd.append('avatar', blob, 'avatar.png');
    fd.append('avatar_url', char.avatar);
    const h = { ...ctx().getRequestHeaders() };
    delete h['Content-Type']; delete h['content-type'];
    const res = await fetch('/api/characters/edit-avatar', { method: 'POST', headers: h, body: fd });
    if (!res.ok) throw new Error('写入失败');
    await fetch(`/characters/${encodeURIComponent(char.avatar)}`, { cache: 'reload' }).catch(() => {});
    try { await ST.getCharacters?.(); } catch { /* */ }
    $$('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (src.includes(encodeURIComponent(char.avatar)) || src.includes(char.avatar)) img.setAttribute('src', src.replace(/[?&]lft=\d+/, '') + (src.includes('?') ? '&' : '?') + 'lft=' + Date.now());
    });
}

async function openQuick() {
    closeOptionsMenu();
    const c = ctx();
    const w = sheet('lf_quick', '快捷台', '<div class="lf-muted lf-pad">翻找中…</div>');
    const b = w.querySelector('.lf-sheet-b');
    const s = S();
    const char = c.characterId !== undefined && c.characterId !== null ? c.characters[c.characterId] : null;
    const parts = [];
    parts.push(`<div class="lf-inline"><button class="lf-btn lf-grow" id="lf_q_pick"><i class="fa-solid fa-address-book"></i> 选卡${char ? `（现在：${esc(snip(char.name, 10))}）` : ''}</button></div>`);

    if (char) {
        const cur = c.getCurrentChatId?.() || '';
        let chats = [];
        try {
            if (typeof ST.getPastCharacterChats === 'function') chats = await ST.getPastCharacterChats(c.characterId);
            else {
                const r = await fetch('/api/characters/chats', { method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ avatar_url: char.avatar }) });
                chats = Object.values(await r.json());
            }
        } catch { /* */ }
        chats = (Array.isArray(chats) ? chats : Object.values(chats || {}))
            .map((x) => ({ ...x, name: String(x.file_name || '').replace(/\.jsonl$/, ''), t: chatTime(x) }))
            .filter((x) => x.name)
            .sort((a, b2) => b2.t - a.t)
            .slice(0, 40);
        parts.push(`<div class="lf-card">
            <div class="lf-cap">当前聊天</div>
            <div class="lf-inline"><input class="text_pole" id="lf_cname" value="${esc(cur)}" placeholder="给这段故事起个名字"><button class="lf-btn" id="lf_rename">改名</button></div>
            <div class="lf-chats">${chats.map((x) => `<div class="lf-chat${x.name === cur ? ' cur' : ''}" data-chat="${esc(x.name)}"><span>${esc(x.name)}</span><small>${x.name === cur ? '当前' : esc(ago(x.t))}</small></div>`).join('') || '<div class="lf-muted">还没有聊天记录</div>'}</div>
            <div class="lf-inline"><button class="lf-btn" id="lf_newchat"><i class="fa-solid fa-plus"></i> 开新聊天</button><input class="text_pole" id="lf_jump" type="number" min="0" placeholder="跳到第几楼"><button class="lf-btn" id="lf_jumpgo">跳</button></div>
        </div>`);

        const list = s.charAvatars[char.avatar] || [];
        const sel = c.chatMetadata?.lf_char_avatar || '';
        parts.push(`<div class="lf-card">
            <div class="lf-cap">char 头像 <small>默认只改这个聊天，不动卡文件</small></div>
            <div class="lf-avs" id="lf_cavs">
                <div class="lf-av${sel ? '' : ' on'}" data-cav=""><img src="${thumb('avatar', char.avatar)}" alt=""><em>原图</em></div>
                ${list.map((p) => `<div class="lf-av${sel === p ? ' on' : ''}" data-cav="${esc(p)}"><img src="${esc(p)}" alt=""><i class="fa-solid fa-xmark lf-av-del" data-del="${esc(p)}"></i></div>`).join('')}
                <label class="lf-av lf-av-add"><i class="fa-solid fa-plus"></i><input type="file" accept="image/*" id="lf_cav_up" hidden></label>
            </div>
            ${sel ? '<div class="lf-inline"><button class="lf-btn" id="lf_cav_write">把当前这张写入卡</button></div>' : ''}
        </div>`);
    } else {
        parts.push('<div class="lf-card lf-muted">先选一张卡，这里就能切聊天、换头像</div>');
    }

    const personas = c.powerUserSettings?.personas || {};
    const curU = PER.user_avatar ?? ST.user_avatar ?? '';
    const pKeys = Object.keys(personas);
    parts.push(`<div class="lf-card">
        <div class="lf-cap">user 头像</div>
        <div class="lf-avs" id="lf_uavs">${pKeys.map((k) => `<div class="lf-av${k === curU ? ' on' : ''}" data-uav="${esc(k)}" title="${esc(personas[k])}"><img src="${thumb('persona', k)}" alt=""><em>${esc(snip(personas[k], 4))}</em></div>`).join('') || '<div class="lf-muted">还没有建 user 设定</div>'}</div>
    </div>`);

    const fontKey = s.font;
    parts.push(`<div class="lf-card">
        <div class="lf-cap">字体</div>
        <div class="lf-chips lf-scroll">${FONTS.map((f) => `<span class="lf-chip${fontKey === f[0] ? ' on' : ''}" data-font="${esc(f[0])}">${f[1]}</span>`).join('')}<span class="lf-chip${fontKey === '__custom' ? ' on' : ''}" data-font="__custom">自定义</span></div>
        <div class="lf-inline lf-fc"${fontKey === '__custom' ? '' : ' hidden'}><input class="text_pole" id="lf_fcustom" value="${esc(s.fontCustom)}" placeholder="字体名 | CSS 链接（链接可不填）"></div>
        <div class="lf-inline"><span class="lf-muted">字号</span><input type="range" min="0" max="24" step="1" id="lf_fsize" value="${s.fontSize || 0}"><span id="lf_fsize_v">${s.fontSize ? s.fontSize + 'px' : '跟随'}</span></div>
    </div>`);

    parts.push(timeCardHtml());
    b.innerHTML = parts.join('');

    b.addEventListener('click', async (e) => {
        const t = e.target;
        try {
            if (t.closest('#lf_q_pick')) { w.remove(); return openPicker(); }
            if (t.closest('#lf_q_check')) { w.remove(); return openCheckup(); }
            const chatEl = t.closest('.lf-chat');
            if (chatEl && !chatEl.classList.contains('cur')) {
                await ST.openCharacterChat?.(chatEl.dataset.chat);
                w.remove(); return;
            }
            if (t.closest('#lf_rename')) {
                const cur = c.getCurrentChatId?.() || '';
                const nn = b.querySelector('#lf_cname').value.trim().replace(/[\\/:*?"<>|]/g, '');
                if (!nn || nn === cur) return;
                if (typeof ST.renameChat === 'function') await ST.renameChat(cur, nn);
                else {
                    const r = await fetch('/api/chats/rename', { method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ is_group: false, avatar_url: char.avatar, original_file: `${cur}.jsonl`, renamed_file: `${nn}.jsonl` }) });
                    if (!r.ok) throw new Error('改名失败，可能重名了');
                    await ST.openCharacterChat?.(nn);
                }
                say('改好了', 'success');
                openQuick(); return;
            }
            if (t.closest('#lf_newchat')) { w.remove(); document.getElementById('option_start_new_chat')?.click(); return; }
            if (t.closest('#lf_jumpgo')) {
                const n = Number(b.querySelector('#lf_jump').value);
                const el = document.querySelector(`#chat .mes[mesid="${n}"]`);
                if (el) { w.remove(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
                else say('这一楼还没加载出来。往上翻点“显示更多”，或在修正机里把加载楼层调大');
                return;
            }
            const del = t.closest('.lf-av-del');
            if (del) {
                e.stopPropagation();
                const p = del.dataset.del;
                s.charAvatars[char.avatar] = (s.charAvatars[char.avatar] || []).filter((x) => x !== p);
                if (c.chatMetadata?.lf_char_avatar === p) { delete c.chatMetadata.lf_char_avatar; await c.saveMetadata?.(); applyAvatarOverride(); }
                save(); openQuick(); return;
            }
            const cav = t.closest('[data-cav]');
            if (cav) {
                const p = cav.dataset.cav;
                if (p) c.chatMetadata.lf_char_avatar = p; else delete c.chatMetadata.lf_char_avatar;
                await c.saveMetadata?.();
                applyAvatarOverride(); openQuick(); return;
            }
            if (t.closest('#lf_cav_write')) {
                const p = c.chatMetadata?.lf_char_avatar;
                if (!p) return;
                const ok = await confirmBox('把这张图写进角色卡？卡原来的头像会被替换。');
                if (!ok) return;
                await writeAvatarToCard(char, p);
                delete c.chatMetadata.lf_char_avatar; await c.saveMetadata?.();
                applyAvatarOverride(); say('已写入卡', 'success'); openQuick(); return;
            }
            const uav = t.closest('[data-uav]');
            if (uav) {
                const k = uav.dataset.uav;
                if (typeof PER.setUserAvatar === 'function') await PER.setUserAvatar(k, { toastPersonaNameChange: false });
                else await c.executeSlashCommandsWithOptions?.(`/persona ${personas[k]}`);
                openQuick(); return;
            }
            const fc = t.closest('[data-font]');
            if (fc) {
                s.font = fc.dataset.font; save(); loadFontCss(); applyCSS();
                $$('[data-font]', b).forEach((x) => x.classList.toggle('on', x === fc));
                b.querySelector('.lf-fc').hidden = s.font !== '__custom';
                return;
            }
        } catch (err) { say(String(err?.message || err), 'error'); }
    });

    b.addEventListener('change', async (e) => {
        if (e.target.id === 'lf_cav_up' && e.target.files?.[0]) {
            try {
                const p = await uploadImage(e.target.files[0]);
                (s.charAvatars[char.avatar] ||= []).push(p);
                c.chatMetadata.lf_char_avatar = p;
                save(); await c.saveMetadata?.(); applyAvatarOverride(); openQuick();
            } catch (err) { say(String(err?.message || err), 'error'); }
        }
        if (e.target.id === 'lf_fcustom') { s.fontCustom = e.target.value; save(); loadFontCss(); applyCSS(); }
    });

    b.addEventListener('input', (e) => {
        if (e.target.id === 'lf_fsize') {
            s.fontSize = Number(e.target.value) < 12 ? 0 : Number(e.target.value);
            b.querySelector('#lf_fsize_v').textContent = s.fontSize ? s.fontSize + 'px' : '跟随';
            save(); applyCSS();
        }
    });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'lf_cname') b.querySelector('#lf_rename').click(); });
}

async function confirmBox(text) {
    const c = ctx();
    try {
        if (c.callGenericPopup && c.POPUP_TYPE) return !!(await c.callGenericPopup(text, c.POPUP_TYPE.CONFIRM));
    } catch { /* */ }
    return window.confirm(text);
}

/* ---------------- 聊天修正 ---------------- */

const draftKey = () => 'lf_draft_' + (ctx().getCurrentChatId?.() || 'none');

function bindDraft() {
    const ta = document.getElementById('send_textarea');
    if (!ta || ta.dataset.lfDraft) return;
    ta.dataset.lfDraft = '1';
    ta.addEventListener('input', () => {
        if (!on('chat_draft')) return;
        const v = ta.value;
        v ? localStorage.setItem(draftKey(), v) : localStorage.removeItem(draftKey());
    });
}
function restoreDraft() {
    if (!on('chat_draft')) return;
    const ta = document.getElementById('send_textarea');
    const v = localStorage.getItem(draftKey());
    if (ta && v && !ta.value) { ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); }
}

let bottomBtn;
function toggleBottomBtn() {
    const chat = document.getElementById('chat');
    const holder = document.getElementById('sheld');
    if (!chat || !holder) return;
    if (!bottomBtn) {
        bottomBtn = document.createElement('div');
        bottomBtn.id = 'lf_tobottom';
        bottomBtn.innerHTML = '<i class="fa-solid fa-angles-down"></i>';
        bottomBtn.title = '回到底部';
        bottomBtn.addEventListener('click', () => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }));
        holder.appendChild(bottomBtn);
        chat.addEventListener('scroll', () => {
            if (!on('chat_scroll_bottom')) return bottomBtn.classList.remove('show');
            bottomBtn.classList.toggle('show', chat.scrollHeight - chat.scrollTop - chat.clientHeight > 600);
        }, { passive: true });
    }
    if (!on('chat_scroll_bottom')) bottomBtn.classList.remove('show');
}

let regenBypass = false;
function clickRegenerate() {
    regenBypass = true;
    document.getElementById('option_regenerate')?.click();
    regenBypass = false;
}

document.addEventListener('click', async (e) => {
    if (regenBypass || !on('chat_confirm_regen')) return;
    const btn = e.target.closest('#option_regenerate');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    closeOptionsMenu();
    if (await confirmBox('重新生成会换掉最后一条回复，确定吗？')) clickRegenerate();
}, true);

/* ---------------- 生成修正 ---------------- */

let genStart = 0; let retries = 0; let continued = false;

function onGenStarted(type, _params, dryRun) {
    if (dryRun || type === 'quiet') return;
    genStart = Date.now();
    if (type !== 'continue') continued = false;
}

function onMessageReceived(mesId) {
    const c = ctx();
    const msg = c.chat?.[mesId];
    if (!msg || msg.is_user || msg.is_system) return;
    const text = String(msg.mes || '').trim();
    if (genStart) {
        const w = Math.max(1, Math.round((Date.now() - genStart) / 1000));
        recordWait(w);
        if (on('gen_wait_time')) { msg.extra = msg.extra || {}; msg.extra.lf_wait = w; }
    }
    genStart = 0;
    if (on('gen_retry_empty') && !text) {
        if (retries < 2) { retries++; say(`空回复，自动重试第 ${retries} 次`); setTimeout(clickRegenerate, 400); return; }
        retries = 0; say('连续空回复，先去看看 API 连接或预设', 'warning'); return;
    }
    retries = 0;
    if (on('gen_auto_continue') && text && !continued && !/[。！？…」』”"’）)\]】~～*>》—.!?`]\s*$/.test(text)) {
        continued = true;
        setTimeout(() => document.getElementById('option_continue')?.click(), 400);
    }
}

function renderWait(mesId) {
    const el = document.querySelector(`#chat .mes[mesid="${mesId}"] .mes_block`);
    if (!el) return;
    el.querySelector('.lf-wait')?.remove();
    if (!on('gen_wait_time')) return;
    const w = ctx().chat?.[mesId]?.extra?.lf_wait;
    if (!w) return;
    const d = document.createElement('div');
    d.className = 'lf-wait';
    d.textContent = w >= 60 ? `等了 ${Math.floor(w / 60)} 分 ${w % 60} 秒` : `等了 ${w} 秒`;
    el.appendChild(d);
}
function renderAllWaits() { $$('#chat .mes[mesid]').forEach((m) => renderWait(m.getAttribute('mesid'))); }

let lastToastErr = '';
const recentErrs = [];
let lastErrAt = 0;
function logErr(kind, text) {
    text = strip(text);
    if (!text || /Love 修正机/.test(text)) return;
    recentErrs.push(`[${new Date().toLocaleTimeString()}] ${kind}：${snip(text, 300)}`);
    if (kind === '弹窗报错') lastErrAt = Date.now();
    if (recentErrs.length > 15) recentErrs.shift();
}
(function hookConsole() {
    const oe = console.error.bind(console);
    console.error = (...a) => { try { logErr('控制台', a.map((x) => (x instanceof Error ? x.message : typeof x === 'object' ? JSON.stringify(x)?.slice(0, 200) : String(x))).join(' ')); } catch { /* */ } oe(...a); };
    window.addEventListener('error', (e) => logErr('脚本错误', `${e.message} @ ${String(e.filename || '').split('/').slice(-2).join('/')}`));
    window.addEventListener('unhandledrejection', (e) => logErr('未处理错误', e.reason?.message || String(e.reason)));
})();
function patchToastr() {
    const t = window.toastr;
    if (!t || t.__lf) return;
    const oe = t.error.bind(t);
    t.error = (msg, title, opt) => { lastToastErr = `${title ?? ''} ${msg ?? ''}`.trim(); logErr('弹窗报错', lastToastErr); if (!wiz) setTimeout(() => showErrHelp(lastToastErr), 0); return oe(msg, title, opt); };
    for (const m of ['info', 'success', 'warning']) {
        const o = t[m].bind(t);
        t[m] = (msg, title, opt) => {
            if (m === 'warning') logErr('弹窗警告', `${title ?? ''} ${msg ?? ''}`);
            if (on('ui_toast_quiet') && QUIET.test(`${msg ?? ''} ${title ?? ''}`)) return window.jQuery ? window.jQuery() : null;
            return o(msg, title, opt);
        };
    }
    t.__lf = true;
}

/* ---------------- 小助手：红框讲解 ---------------- */

let helperOn = false; let helperBypass = false; let tipHit = null;
let frameEl; let tipEl; let badgeEl;

const MARK = {
    main: '预设作者写的总规矩：AI 扮演谁、怎么写、哪些不能写。破限一般也放在预设最上面这一块。排在最前，AI 把它当“法律”；但离最新消息最远，聊久了会被冲淡，所以重要规则常在尾部再强调一次。',
    nsfw: '辅助提示词槽位，酒馆固定的一个位置，很多预设拿它放额外规则，具体内容看预设作者写了什么。',
    jailbreak: '后置指令：排在聊天历史后面，是 AI 开口前最后看到的规矩之一，用来压住前面被冲淡的规则，也最容易和别的条目打架。（破限不在这里，破限一般放在预设最上面。）',
    enhanceDefinitions: '增强定义：让 AI 调用自己对知名角色的了解来补全设定，原创卡一般用不上。',
    worldInfoBefore: '世界书（角色定义之前）：酒馆固定位。所有设成“角色定义之前”的世界书条目都塞到这里，先给舞台再给演员。蓝灯条目每次都在，绿灯条目要聊天里出现关键词才进来。',
    worldInfoAfter: '世界书（角色定义之后）：紧贴角色定义，AI 会把这里当成角色的补充来读，适合关系网、隐藏设定。',
    charDescription: '角色描述：角色卡“描述”栏的内容，整个扮演的核心。上面是规矩和舞台，下面是补充和聊天。',
    charPersonality: '角色性格：角色卡“性格摘要”栏。很多卡留空，留空就什么都不发，不占 token。',
    scenario: '场景：角色卡“场景”栏，交代故事开始时角色在哪、在干什么。',
    personaDescription: 'user 设定：你在“用户设定”里写的自己的人设，告诉 AI 对面是谁。',
    dialogueExamples: '示例消息：角色卡里的对话示例。AI 学的是语气和格式，不是剧情，别往里塞故事。',
    chatHistory: '聊天历史：你们所有的聊天记录，从旧到新排。深度条目（D0、D1……）都插在这里面，从最新一条消息往回数。上下文不够时，最旧的消息先被裁掉。',
};

function depthTxt(d) {
    if (d === 0) return 'D0：插在所有聊天消息的最后，是 AI 开口前看到的最后一段话，影响最强。放太多东西会压过你自己说的话。';
    if (d === 1) return 'D1：插在你最新一条消息的前面，紧贴着它。离 AI 开口很近，状态栏格式、当前场景提醒常放这里。';
    if (d === 2) return 'D2：从最新一条消息往回数第 2 格，在上一条 AI 回复前面。适合近期要记住、但不用天天强调的内容。';
    return `D${d}：从最新一条消息往回数第 ${d} 格插进去。数字越大越靠前，越像背景资料；聊天记录不够 ${d} 条时，就挨着最早的消息。`;
}

function explainPrompt(li) {
    const id = li.dataset.pmIdentifier;
    const pm = OAI.promptManager;
    let p = null; let order = [];
    try { p = pm?.getPromptById?.(id); order = pm?.getPromptOrderForCharacter?.(pm.activeCharacter) || []; } catch { /* */ }
    const name = p?.name || li.querySelector('.completion_prompt_manager_prompt_name')?.textContent?.trim() || id;
    const enabled = order.filter((o) => o.enabled);
    const idx = enabled.findIndex((o) => o.identifier === id);
    const hist = enabled.findIndex((o) => o.identifier === 'chatHistory');
    const isOn = !!order.find((o) => o.identifier === id)?.enabled;
    const abs = Number(p?.injection_position) === 1;
    const depth = Number(p?.injection_depth ?? 4);
    const role = { system: '系统', user: '用户', assistant: 'AI' }[p?.role || 'system'] || '系统';
    const lines = [];
    if (MARK[id]) lines.push(MARK[id]);
    else if (abs) lines.push(depthTxt(depth));
    else if (hist >= 0 && idx > hist) lines.push('排在聊天历史后面，属于“尾部”：AI 开口前最后看到的东西之一，影响很强，也最容易和别的条目打架。');
    else lines.push('排在聊天历史前面，属于“前置规矩”：定基调用。离最新消息越远，聊久了越容易被冲淡。');
    if (p?.role === 'assistant' && idx === enabled.length - 1 && idx >= 0) lines.push('它以 AI 的身份发送、又排在最后，起预填充的作用：AI 会以为这是自己刚写的开头，顺着往下写。<br>注意：Gemini 3.1 Pro，还有 3.5 Flash 之后出的哈基米（3.6 Flash 起），都不适配预填了，会报“Requests ending with a model turn are not supported”。用这些模型要把预填条目关掉。3.5 Flash 本身还能用预填。');
    else if (p?.role === 'assistant') lines.push('以 AI 的身份发送：AI 会把这段当成“自己说过的话”。');
    if (p?.content && !p.marker) lines.push('内容开头：' + esc(snip(p.content, 70)));
    const tags = [isOn && idx >= 0 ? `第 ${idx + 1} / ${enabled.length} 条` : '未启用，不会发送', '发送身份 ' + role, abs ? `深度 D${depth}` : (MARK[id] ? '酒馆固定位' : '相对位置')];
    const SL = { main: '主提示', jailbreak: '后置指令', nsfw: 'NSFW 位', worldInfoBefore: '世界书', worldInfoAfter: '世界书', chatHistory: '上下文、聊天记录', dialogueExamples: '示例对话', personaDescription: 'user 人设、Persona', charDescription: '卡' };
    let slang = SL[id] || (abs ? `D${depth}、深度注入` : '');
    if (p?.role === 'assistant' && idx === enabled.length - 1 && idx >= 0) slang = '预填、prefill';
    return {
        title: name, tags, html: lines.join('<br>'), slang, topic: `预设条目「${name}」`,
        open: () => li.querySelector('.prompt-manager-inspect-action, .prompt-manager-edit-action, .fa-pencil')?.click(),
    };
}

const WI_POS = { 0: '角色定义之前', 1: '角色定义之后', 2: '作者注释顶部', 3: '作者注释底部', 4: '按深度插入', 5: '示例消息之前', 6: '示例消息之后', 7: '出口' };
function explainWI(el) {
    const name = el.querySelector('textarea[name="comment"]')?.value?.trim() || '未命名条目';
    const state = el.querySelector('select[name="entryStateSelector"]')?.value;
    const pos = el.querySelector('select[name="position"]')?.value;
    const depth = el.querySelector('input[name="depth"]')?.value;
    const lamp = state === 'constant' ? '蓝灯：常驻，每次都发给 AI。' : state === 'vectorized' ? '向量：按语义相似度自动触发。' : '绿灯：聊天里出现它的关键词才会发给 AI。';
    const where = Number(pos) === 4 ? depthTxt(Number(depth || 4)) : `放在「${WI_POS[pos] ?? '未知位置'}」。`;
    return { title: name, tags: ['世界书条目'], html: `${lamp}<br>${where}`, topic: `世界书条目「${name}」` };
}

// 设置项：按显示的名字识别，中英文界面都认。 [匹配, 标题, 人话讲解, 圈里叫法]
const TITLE_HELP = [
    [/提示词后处理|post.?processing/i, '提示词后处理', '把发给 AI 的全部内容（卡、预设、世界书、聊天记录）整理成渠道要求的格式。有的渠道只认一条系统消息，有的要求你和 AI 的消息轮流出现。<br>· <b>无</b>：不处理。<br>· <b>合并</b>：同一身份连着的几条合成一条。<br>· <b>半严格</b>：在合并的基础上，只留一条系统消息。<br>· <b>严格</b>：在半严格的基础上，第一条必须是你（用户）发的。<br>· <b>单条用户消息</b>：所有内容合成一条用户消息，最严格。<br>合并、半严格、严格会去掉“工具调用”，选带工具的版本才保留。<br><b>预设没有要求的话，选不带工具的“严格”。</b>遇到奇怪的格式报错，也可以先调这里。', '后处理'],
    [/温度|temperature/i, '温度', '控制 AI 有多随机。越高越放飞、越有创意，越低越稳、越容易复读。觉得死板就调高一点，开始胡言乱语就调低。<br>注意：Gemini 3.x、4.x 的通用模型会忽略温度、Top P、Top K，调了也不起作用。', '温度高 = 放飞，温度低 = 死板'],
    [/top ?p/i, 'Top P', '只在概率最高的那一部分词里挑。和温度二选一调就行，看不懂就别动。<br>注意：Gemini 3.x、4.x 的通用模型会忽略温度、Top P、Top K，调了也不起作用。', ''],
    [/top ?k/i, 'Top K', '只在前 K 个候选词里挑，0 是不限制。<br>注意：Gemini 3.x、4.x 的通用模型会忽略温度、Top P、Top K，调了也不起作用。', ''],
    [/top ?a/i, 'Top A', '按最高概率的比例筛候选词，很少需要动。', ''],
    [/min ?p/i, 'Min P', '把概率太低的词直接剔掉，能减少胡言乱语。', ''],
    [/频率惩罚|frequency/i, '频率惩罚', '一个词用得越多，越不想再用，专治车轱辘话。调太高用词会变别扭、生僻。<br><b>哈基米（Gemini 2.5 以后的模型）已经不支持双惩罚</b>（频率惩罚和存在惩罚），用这些模型时调这两项没用，放 0 就行。', '治复读、双惩罚'],
    [/存在惩罚|presence/i, '存在惩罚', '出现过的词和话题就少提，鼓励换新内容。<br><b>哈基米（Gemini 2.5 以后的模型）已经不支持双惩罚</b>，放 0 就行。', '双惩罚'],
    [/重复惩罚|repetition/i, '重复惩罚', '压制重复的词句，作用和频率惩罚类似。', '治复读'],
    [/上下文|context/i, '上下文长度', '一次最多给 AI 看多少 token。超出的旧聊天记录会被裁掉，AI 就“忘了”前面的事。别超过模型本身的上限，不然会报错。', '爆上下文、失忆'],
    [/回复长度|最大回复|response length|max response|max tokens/i, '回复长度', 'AI 一次最多写多少 token。回复写到一半断掉，多半是这里太小。', '截断'],
    [/流式|stream/i, '流式传输', '· <b>真流</b>：生成多少发多少，开着流式。<br>· <b>非流</b>：写完一次性发过来，关掉流式就是。<br>· <b>假流</b>：中转（反代或公益站）一边给酒馆发空消息防止超时挂断，一边让模型用非流写，写完一次性发过来。要开着流式。<br>哈基米的真流有<b>实时审查</b>，容易写到一半被截断，这时换非流或假流。', '真流、假流、非流'],
    [/多个备选|备选回复|multiple|swipes per|^n$/i, '一次生成几条', '一次生成好几条备选回复，相当于一次抽好几张卡，额度也成倍花。一般保持 1。', '抽卡'],
    [/种子|seed/i, '种子', '固定随机数。同样的输入加同样的种子会得到差不多的回复，-1 是每次随机。', ''],
    [/推理强度|reasoning effort|思考强度/i, '推理强度', '让会思考的模型想多久。越高越慢、越贵，不一定写得越好。', '思考、思维链'],
    [/思维链|思考|thought|reasoning/i, '思考过程', '会思考的模型先在心里打草稿再写正文。这一项管要不要请求或显示这段草稿，不影响正文内容。', '思维链、COT'],
    [/解锁|unlock/i, '解锁上下文', '允许把上下文拉到超过默认上限。确定模型支持再开。', ''],
    [/预填|prefill/i, '预填充', '替 AI 先写好回复的开头，AI 会以为是自己写的，顺着往下接。常用来定格式或绕过拒答。<br>注意：Gemini 3.1 Pro，还有 3.5 Flash 之后出的哈基米（3.6 Flash 起），都不适配预填了，会报“Requests ending with a model turn are not supported”。用这些模型要把预填条目关掉。3.5 Flash 本身还能用预填。', '预填、prefill'],
    [/压缩系统|squash/i, '合并系统消息', '把连在一起的几条系统消息合成一条发，有的模型更吃这一套。', ''],
    [/角色名称|名字|names/i, '名字显示', '要不要在每条消息前加上说话人的名字。多人卡建议开，单人卡看预设要求。', ''],
    [/内联图|inline image|图像|image/i, '发送图片', '允许把聊天里的图片发给能看图的模型。', ''],
    [/函数调用|function|工具调用|tool/i, '工具调用', '让模型调用插件提供的工具。不用相关插件就别开。', ''],
    [/网络搜索|web search/i, '联网搜索', '让模型回答前先上网搜。角色扮演一般用不上。', ''],
    [/系统提示|system prompt/i, '系统提示', '把预设开头的内容当成“系统指令”发给模型，模型会更当回事。', ''],
    [/引号|quotes/i, '自动加引号', '把你发的话自动包上引号。', ''],
    [/模型|model/i, '模型', '选具体用哪个模型。同一个接口下不同模型，价格和文笔差别很大。', ''],
];

function controlTitle(box, el) {
    return (box.querySelector('.range-block-title, h4, h3')?.textContent || (el.closest('label') || box.querySelector('label'))?.textContent
        || el.getAttribute('title') || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim();
}
function controlHint(box, el) {
    return (box.querySelector('.toggle-description, .range-block-description, small')?.textContent || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
}
function explainControl(el) {
    const box = el.closest('.range-block') || el.closest('label') || el;
    const title = controlTitle(box, el);
    if (el.matches('.menu_button[title]') && !el.closest('.range-block')) {
        const t = el.getAttribute('title').trim();
        return { title: snip(t, 24), tags: ['按钮'], html: `酒馆自带说明：${esc(t)}`, topic: `按钮「${t}」` };
    }
    const m = title && TITLE_HELP.find(([re]) => re.test(title));
    if (m) return { title: m[1], tags: ['设置项'], html: m[2], slang: m[3], topic: `设置「${m[1]}」` };
    const hint = controlHint(box, el);
    const t = snip(title || '这个设置', 24);
    return {
        title: t, tags: ['设置项'],
        html: hint && hint !== title ? `酒馆自带说明：${esc(snip(hint, 140))}<br>想听人话版，点“问问它”。` : '这一项还没收进讲解，点“问问它”让小助手讲。',
        topic: `设置「${t}」`,
    };
}

// 社区黑话：[词, 也叫, 解释]
const GLOSSARY = [
    ['酒馆', 'ST、SillyTavern', '就是 SillyTavern 本体，一个连 AI 玩角色扮演的前端。'],
    ['卡', '角色卡', '一张 PNG 或 JSON，存角色设定和开场白，可能还自带世界书和正则。'],
    ['人设卡 / 世界卡 / 多人卡', '', '人设卡写一个角色；世界卡写一个世界，AI 当旁白；多人卡是一张卡里有好几个角色，各个角色的设定放在世界书里：绿灯的角色条目要聊天里提到才发，蓝灯的每次都发。'],
    ['多人卡', '', '一张卡里有好几个角色。角色设定一般放在卡自带的世界书里，每个角色一条。这些条目是绿灯的话，聊天里提到这个角色才会发给 AI；是蓝灯的话，每次都会发。所以导入多人卡时，一定要选“导入卡内世界书”。'],
    ['同人卡', '', '基于已有作品的卡。'],
    ['手枪卡', '', '以成人内容为主的卡。'],
    ['前端卡', '美化卡', '自带网页界面的卡，靠正则或酒馆助手把文字渲染成界面，状态栏、开场白主页都算。'],
    ['开场白', '首条、0 楼', '卡的第一条消息。“开场白主页”是可以点按钮选开局的前端界面。'],
    ['写卡', '搓卡、捏卡', '自己写角色卡。'],
    ['预设', '', '一整套发给 AI 的规矩加参数：文风、规则、长度、温度。'],
    ['破限', 'JB、越狱', '让模型少拒绝、放开写的提示词，一般放在预设最上面。'],
    ['预填', '预填充、prefill', '替 AI 写好回复开头，AI 会顺着往下写。注意 Gemini 3.1 Pro，还有 3.5 Flash 之后出的哈基米（3.6 Flash 起），都不适配预填了；3.5 Flash 本身还能用。'],
    ['双惩罚', '频率惩罚、存在惩罚', '两个治复读的参数。哈基米从 Gemini 2.5 起就不支持了，调了也没用，放 0 就行。'],
    ['思维链', 'COT、思考', '让 AI 先打草稿、想清楚再写正文。'],
    ['小剧场', '', '回复末尾附带的番外小片段，通常是预设或正则加的。'],
    ['文风', '', '预设里规定怎么写的条目：句式、用词、描写偏好。'],
    ['八股', '八股文', 'AI 爱用的套话和陈词滥调，比如“指节泛白”“一丝”“不易察觉”。“去八股”就是用预设或正则把它们清掉。'],
    ['世界书', '', '角色卡之外的设定库，可以绑卡，也可以全局开。多人卡的各个角色也写在世界书里。'],
    ['蓝灯 / 绿灯', '', '世界书条目的状态。蓝灯常驻，每次都发；绿灯要聊天里出现关键词才发。'],
    ['正则', '', '文字替换规则。状态栏、隐藏思考、美化文字都是它做的。分三种：全局正则所有卡都生效；预设正则跟着预设走；局部正则就是角色的，只在这张卡生效。'],
    ['局部正则', '角色正则、卡内正则', '跟着角色卡走的正则，只在这张卡里生效。要打开正则面板里的“允许”开关才会生效。'],
    ['预设正则', '', '跟着预设走的正则，用这个预设时才生效。思维链折叠、格式整理常放这里，同样有“允许”开关。'],
    ['酒馆助手', 'TH', '跑脚本的扩展，很多前端卡、工具都靠它。'],
    ['状态栏', '', '回复末尾显示角色数值和状态的小界面，多是正则或脚本做的。'],
    ['楼', '楼层', '一条消息算一楼，开场白是 0 楼。'],
    ['删楼 / 隐藏楼层', '', '删楼是把消息删掉；隐藏是留着但不再发给 AI，用 /hide 命令或消息上的眼睛按钮。'],
    ['抽卡', '刷回复、swipe、重 roll', '让 AI 重新生成一条，旧的还在，左右翻能切回去。'],
    ['改楼', '', '直接编辑某条消息的内容，AI 之后按改过的接着写。'],
    ['上下文', '', '一次发给 AI 的全部内容：预设、卡、世界书、聊天记录加起来。'],
    ['token', '词符', 'AI 计算长度的单位，上下文和回复长度都按它算。'],
    ['爆上下文', '', '内容超过上下文上限，旧聊天被裁掉，严重的直接报错。'],
    ['失忆', '', '聊久了 AI 忘了前面的事，通常是旧聊天被裁掉了，可以用总结或世界书补。'],
    ['截断', '', '回复写到一半断了。多半是回复长度太小，也可能是被审查或上游掐断。哈基米开真流时有实时审查，特别容易截断，换非流或假流。'],
    ['空回', '', 'AI 回了一片空白。常见原因：被审查拦截、额度用完、上游出错。'],
    ['复读', '车轱辘话', 'AI 反复写同样的句式和情节。可以调高频率惩罚，或在预设里加要求。'],
    ['抢话', '替 user 说话', 'AI 替你写你的台词和动作。一般靠预设里的规则压住。'],
    ['OOC', '', '角色崩了，说了不像他会说的话；也指跳出剧情的场外话。'],
    ['降智', '', '模型突然变笨。可能是上下文太长、预设太乱，或被换成了便宜模型。'],
    ['拒答', '审查、道歉', '模型拒绝写，回“我不能……”。'],
    ['API', '接口', '酒馆连 AI 的通道，要填地址、密钥、模型。'],
    ['Key', '密钥', '用接口的钥匙，相当于账号密码，不要发给别人。'],
    ['反代', '中转、渠道', '不是官方直连，经第三方转发的接口。“公益站”是免费分享的中转。'],
    ['哈基米', '', 'Gemini 的昵称。'],
    ['DS', '', 'DeepSeek 的简称。'],
    ['429 / 403 / 5xx', '', '429：请求太频繁或额度用完。403：没权限，Key 错了或地区被限。500、502：上游坏了，等等再试。'],
    ['流式', '', '回复一个字一个字往外蹦，关掉就写完一次性出来。分真流、假流、非流，见下一条。'],
    ['真流 / 假流 / 非流', '', '真流：生成多少发多少，要开流式。非流：生成完一次性发给酒馆，要关流式。假流：中转（反代或公益站）一直发空消息防止酒馆超时挂断，同时让模型用非流生成，写完再一次性发过来，要开流式。哈基米的真流有实时审查，更容易被截断，被截断就换非流或假流。'],
    ['提示词后处理', '后处理', 'API 连接里的一个选项，把发给 AI 的内容整理成渠道要求的格式（合并、半严格、严格、单条用户消息）。预设没要求的话，选不带工具的“严格”。'],
    ['公益站', '', '免费分享的中转，额度有限，人一多就撞车（PVP）。'],
    ['轮询', '', '好几个 Key 轮流用，一个撞车或额度用完就换下一个。'],
    ['宏', '{{char}}、{{user}}', '会被自动替换的占位符，{{char}} 换成角色名，{{user}} 换成你的名字。'],
    ['深度', 'D0、D1、@D', '深度插入：从最新一条消息往回数，插在第几格。D0 在最后，D1 在你最新一条消息前面。'],
    ['作者注释', 'AN', '按深度插入的一段提示，常用来放当前场景、近期提醒。'],
    ['user 设定', 'Persona、user 人设', '你自己的人设和头像。'],
    ['QR', '快速回复', '输入框上方那一排快捷按钮，点一下发一段预设好的话或命令。'],
    ['大总结', '', '聊太长时，让 AI 把前文压成要点，存进世界书蓝灯条目，再把旧楼层隐藏掉。省上下文、防失忆。'],
    ['小铅笔', '', '消息上的编辑按钮，点了能直接改这一楼。'],
    ['总结', '记忆', '把很长的聊天压成摘要，省上下文、防失忆。'],
    ['PVP', '撞车', '很多人同时抢同一份额度（常见于公益站、共享 Key），抢不到就报 429。等一会儿或错峰再发。'],
    ['爆代码', '', '聊天里露出一堆代码，没变成界面。多半是没装酒馆助手或提示词模板，去社区扩展区下载。都装了、只在切换开场白时爆代码：去提示词模板，先点“重置”，再取消勾选“先处理原始内容”。'],
    ['露思考', '思维链泄露', '思考过程直接显示在正文里。多半是预设正则的允许开关没开，或者 AI 写的标签和正则对不上。'],
    ['小手机', '', '前端卡里做成手机样子的界面，聊天、朋友圈、论坛之类，靠酒馆助手或正则显示。'],
    ['MVU', '变量更新', '一些前端卡用的变量框架：AI 每次回复顺便更新好感度、状态这些数值，状态栏读它来显示。要装酒馆助手。'],
    ['更新卡', '', '作者发了新版本的卡。三种办法：角色卡界面“更多 → 更新”；直接导入新卡（会多一张同名卡），再把旧聊天“导入存档”；或者酒馆助手 → 脚本库 → 内置脚本 →“更新角色卡时更新世界书”。不管哪种，原本的世界书都要先重命名或删掉，酒馆发现重名世界书就不更新。'],
    ['存档', '聊天记录', '一段聊天的记录文件。换了新卡也能“导入存档”接着聊。'],
    ['重开', '开新档', '同一张卡开一个新聊天从头玩，旧聊天还在。'],
    ['缝合', '缝预设', '把别的预设里好用的条目复制进自己的预设。缝多了容易条目打架。'],
    ['XML 标签', '', '写人设、角色卡、世界书时，可以用 <标签>…</标签> 把一段设定包起来，比如 <user设定>…</user设定>、<林夕>…</林夕>。AI 更容易分清哪段是谁、哪段是什么。标签名中文英文都行，前后要配对。'],
    ['别滥用 Markdown', '', '写设定时别满篇 # 标题、**加粗**、- 列表。AI 会学着在回复里也冒出标题和列表，正文变得像说明书，还多花 token。用普通句子写，需要分段就用 XML 标签。'],
    ['提示词模板', 'ST-Prompt-Template', '一个扩展，让卡和预设能用模板语法（<% %>）动态生成内容。很多前端卡要它。'],
    ['NSFW / 清水', '', 'NSFW 是成人内容；清水是不含成人内容。'],
];

// 词典分两类：黑话是圈里的说法；介绍是酒馆功能和操作的说明
const INTRO = new Set(['酒馆', '开场白', '预设', '文风', '世界书', '正则', '局部正则', '预设正则', '酒馆助手', '状态栏', '上下文', 'token', 'API', 'Key',
    '429 / 403 / 5xx', '流式', '真流 / 假流 / 非流', '提示词后处理', '宏', '深度', '作者注释', 'user 设定', 'QR', '大总结', '小铅笔', '总结',
    'MVU', '更新卡', '存档', '重开', '缝合', '提示词模板', '思维链', '双惩罚', 'XML 标签', '别滥用 Markdown']);
const termKind = (t) => (INTRO.has(t) ? '介绍' : '黑话');
function glossaryText() {
    const line = ([t, a, x]) => `${t}${a ? `（也叫${a}）` : ''}：${x}`;
    return '黑话：\n' + GLOSSARY.filter(([t]) => !INTRO.has(t)).map(line).join('\n') + '\n\n介绍：\n' + GLOSSARY.filter(([t]) => INTRO.has(t)).map(line).join('\n');
}

const SPOTS = [
    { sel: '#completion_prompt_manager_list .completion_prompt_manager_prompt[data-pm-identifier]', get: explainPrompt },
    { sel: '.world_entry', get: explainWI },
    {
        sel: '.regex-script-label', get: (el) => {
            const name = el.querySelector('.regex_script_name')?.textContent?.trim() || '正则';
            const scope = el.closest('#saved_scoped_scripts') ? '局部正则（角色的）：跟着这张卡走，只在这张卡里生效。' : el.closest('#saved_preset_scripts') ? '预设正则：跟着预设走，换了预设就不生效。' : '全局正则：所有卡都生效。';
            return { title: name, tags: ['正则'], html: `把匹配到的文字替换成别的，状态栏、隐藏思考、美化文字都是它做的。<br>${scope}<br>勾“仅格式显示”只改你看到的，不改发给 AI 的；勾“仅格式提示词”正好相反。`, topic: `正则「${name}」` };
        },
    },
    {
        sel: '#extensions_settings .inline-drawer-header, #extensions_settings2 .inline-drawer-header', get: (el) => {
            const txt = el.textContent.trim();
            if (/酒馆助手|tavern ?helper|slash ?runner/i.test(txt)) return { title: '酒馆助手', tags: ['脚本'], html: '跑脚本的地方。脚本是给酒馆加功能的小程序：状态栏互动、开场白主页、各种工具都靠它。脚本分全局和角色专属两种。', topic: '酒馆助手和脚本' };
            if (/正则|regex/i.test(txt)) return { title: '正则', tags: ['正则'], html: '管理所有正则，分三种：全局正则（所有卡都生效）、预设正则（跟着预设走）、局部正则（就是角色的，只在这张卡生效）。导入卡时问你“要不要启用卡内正则”，说的就是局部正则。', topic: '正则面板' };
            if (/修正机/.test(txt)) return { title: 'Love 修正机', tags: [], html: '就是我。精简、修正、快捷台、讲解都在这里开关。', topic: 'Love 修正机' };
            return { title: snip(txt, 20), tags: ['扩展'], html: '这是一个扩展的设置面板，展开能看到它的选项。不知道它干嘛的，点“问问它”。', topic: `扩展「${snip(txt, 20)}」` };
        },
    },
    { sel: '#settings_preset_openai', t: '预设选择', x: '切换整套预设。换预设会把下面的条目、温度、长度一起换掉。' },
    { sel: '#ai-config-button > .drawer-toggle', s: '预设、破限', t: 'AI 回复配置（预设）', x: '这里管“AI 怎么写”：选预设、调温度和长度、排预设条目。新手最该认识的地方。' },
    { sel: '#sys-settings-button > .drawer-toggle', s: 'API、接口、反代', t: 'API 连接', x: '填接口地址、密钥、选模型。AI 没反应或报错，先来这里看连没连上。' },
    { sel: '#advanced-formatting-button > .drawer-toggle', t: '高级格式化', x: '文本补全模式用的格式模板。大多数人用聊天补全，基本不用动。' },
    { sel: '#WI-SP-button > .drawer-toggle', s: '蓝灯绿灯', t: '世界书', x: '角色卡之外的设定库。蓝灯条目每次都发，绿灯条目要聊天里出现关键词才发；能绑定到角色，也能全局开。' },
    { sel: '#user-settings-button > .drawer-toggle', s: '美化、主题', t: '用户设置（美化）', x: '主题、字体、颜色、布局都在这。只管好不好看，不影响 AI 写什么。' },
    { sel: '#backgrounds-button > .drawer-toggle', t: '背景', x: '换聊天背景图。' },
    { sel: '#extensions-settings-button > .drawer-toggle', t: '扩展', x: '插件的家。酒馆助手（脚本）、正则、各种插件的设置都在这里。' },
    { sel: '#persona-management-button > .drawer-toggle', s: 'user 人设、Persona', t: '用户设定', x: '你自己的人设和头像。可以存好几个，按聊天切换。' },
    { sel: '#rightNavHolder > .drawer-toggle', s: '卡', t: '角色管理', x: '选卡、导入卡、编辑卡。卡里可能自带世界书和正则，导入时会问你要不要一起开。' },
    { sel: '#options_button', t: '选项菜单', x: '开新聊天、管理聊天文件、重新生成、继续写都在这。修正机的总入口和讲解开关也在这里。' },
    { sel: '#extensionsMenuButton', t: '魔棒菜单', x: '各个插件的快捷入口，装得越多越长，可以用修正机的“点选隐藏”精简。' },
    { sel: '#send_but', t: '发送', x: '把输入框的话发出去，AI 开始写。' },
    { sel: '#mes_stop', t: '停止', x: '让 AI 停下，已经写出来的部分会保留。' },
    { sel: '#send_textarea', t: '输入框', x: '你要说的话写在这。也能输入以 / 开头的斜杠命令。' },
    { sel: '.swipe_right', s: '抽卡、刷回复', t: '换一条回复', x: '在最后一条 AI 回复上往右翻会重新生成一条，旧的还在，往左能翻回去。' },
    { sel: '.swipe_left', t: '上一条回复', x: '翻回之前生成过的版本。' },
    { sel: '.mes_edit_done', t: '保存修改', x: '把改好的内容存下来。AI 之后会按改过的往下接。' },
    { sel: '.mes_edit_cancel', t: '放弃修改', x: '不保存，恢复成改之前的样子。' },
    { sel: '.mes_edit_delete', t: '删除这条', x: '把这一楼删掉。只想不让 AI 看到的话，用眼睛图标隐藏更稳。' },
    { sel: '.mes_edit_up, .mes_edit_down', t: '上移 / 下移', x: '把这条消息在聊天里往上或往下挪一格。' },
    { sel: '.mes_edit_copy', t: '复制这条', x: '在下面复制出一条一模一样的消息。' },
    { sel: '.mes_hide, .mes_unhide', s: '隐藏楼层', t: '隐藏 / 取消隐藏', x: '隐藏后这条还在，但不再发给 AI。做完大总结后用它（或 /hide 命令）把旧楼藏起来。' },
    { sel: '.mes_edit', s: '改楼', t: '编辑消息', x: '小铅笔：点了就能直接改这一楼的内容，改完点 ✓ 保存。AI 之后会按改过的往下接，比重新抽卡更能把剧情掰回来。' },
    { sel: ['.range-block', 'label', 'input[id]', 'select[id]', 'textarea[id]', '.menu_button[title]'].map((x) => '.drawer-content ' + x).join(', '), get: explainControl },
];

function findSpot(t) {
    for (const s of SPOTS) {
        const el = t.closest(s.sel);
        if (!el) continue;
        const info = s.get ? s.get(el) : { title: s.t, tags: [], html: s.x, slang: s.s, topic: s.t };
        if (info) return { el, ...info };
    }
    return null;
}

function ensureHelperEls() {
    if (!frameEl) { frameEl = document.createElement('div'); frameEl.id = 'lf_frame'; document.body.appendChild(frameEl); }
    if (!tipEl) {
        tipEl = document.createElement('div'); tipEl.id = 'lf_tip'; document.body.appendChild(tipEl);
        tipEl.addEventListener('click', (e) => {
            const a = e.target.closest('button')?.dataset.a;
            if (!a || !tipHit) return;
            const hit = tipHit;
            if (a === 'close') return hideTip();
            if (a === 'open') {
                hideTip();
                helperBypass = true;
                try { hit.open ? hit.open() : clickReal(hit.el); } finally { helperBypass = false; }
            }
            if (a === 'ask') { hideTip(); openAsk(`讲讲这里：${hit.topic || hit.title}。我看到的说明是：${strip(hit.html)}`, true); }
        });
    }
}

// 酒馆的顶栏抽屉、按钮常常是外框里套着真正的开关，要点到里面那个才有反应
function clickReal(el) {
    const inner = el.matches('.drawer-toggle, button, a, input, select, .menu_button')
        ? el
        : el.querySelector('.drawer-toggle') || el.querySelector('.drawer-icon') || el.querySelector('.menu_button, button, a') || el;
    if (inner.matches('input[type="text"], textarea, select')) { inner.focus(); return; }
    inner.click();
}

function showTip(hit) {
    ensureHelperEls();
    tipHit = hit;
    tipEl.innerHTML = `<div class="lf-tip-t">${esc(hit.title)}</div>${hit.tags?.length ? `<div class="lf-tip-tags">${hit.tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}<div class="lf-tip-x">${hit.html}</div>${hit.slang ? `<div class="lf-tip-slang">圈里叫：${esc(hit.slang)}</div>` : ''}<div class="lf-tip-b"><button data-a="open">打开它</button><button data-a="ask">问问它</button><button data-a="close">好</button></div>`;
    frameEl.style.display = 'block'; tipEl.style.display = 'block';
    positionTip();
}

function positionTip() {
    if (!tipHit) return;
    if (!document.body.contains(tipHit.el)) return hideTip();
    const r = tipHit.el.getBoundingClientRect();
    Object.assign(frameEl.style, { left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
    const tw = Math.min(320, innerWidth - 16);
    tipEl.style.width = tw + 'px';
    const left = Math.min(Math.max(8, r.left), innerWidth - tw - 8);
    const th = tipEl.offsetHeight;
    let top = r.bottom + 12;
    if (top + th > innerHeight - 8) top = Math.max(8, r.top - th - 12);
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
}

function hideTip() {
    tipHit = null;
    if (frameEl) frameEl.style.display = 'none';
    if (tipEl) tipEl.style.display = 'none';
}

function setHelper(v) {
    helperOn = v;
    if (v && picking) stopPick();
    document.body.classList.toggle('lf-helper-on', v);
    if (!badgeEl) {
        badgeEl = document.createElement('div'); badgeEl.id = 'lf_badge';
        badgeEl.textContent = '讲解中 · 点我关闭';
        badgeEl.addEventListener('click', () => setHelper(false));
        document.body.appendChild(badgeEl);
    }
    badgeEl.style.display = v ? 'block' : 'none';
    if (!v) hideTip();
    else say('讲解已开：点酒馆里任意地方，红框框住并告诉你它是干嘛的');
    const opt = document.querySelector('#lf_opt_help span');
    if (opt) opt.textContent = v ? '关掉讲解' : '讲解：点哪讲哪';
    renderPanel();
}

document.addEventListener('click', (e) => {
    if (!helperOn || helperBypass || picking) return;
    const t = e.target;
    if (t.closest('#lf_tip, #lf_badge, .lf-mask, #lf_frame, #lf_opt_help, #lf_panel, #lf_wiz, #lf_opt_wiz')) return;
    const hit = findSpot(t);
    if (!hit) { hideTip(); return; }
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    showTip(hit);
}, true);
// 酒馆在面板外一按下就会把打开的面板收起来（回到首页）。
// 修正机自己的窗口（向导、讲解气泡、报错气泡、弹层）不算“面板外”，按下事件不让酒馆收到。
const LF_UI = '#lf_wiz, .lf-mask, #lf_tip, #lf_err, #lf_imp, #lf_nudge, #lf_badge, #lf_pickbar, #lf_tobottom';
['mousedown', 'touchstart', 'pointerdown'].forEach((t) => document.addEventListener(t, (e) => {
    if (e.target?.closest?.(LF_UI)) e.stopPropagation();
}, { capture: true, passive: true }));
window.addEventListener('scroll', () => tipHit && positionTip(), true);
window.addEventListener('resize', () => tipHit && positionTip());

/* ---------------- 小助手：问答 ---------------- */

const askLog = [];

function presetSummary() {
    const c = ctx();
    if (c.mainApi && c.mainApi !== 'openai') return '（当前不是聊天补全模式，没有预设条目结构）';
    const pm = OAI.promptManager;
    try {
        const order = (pm.getPromptOrderForCharacter(pm.activeCharacter) || []).filter((o) => o.enabled);
        const name = OAI.oai_settings?.preset_settings_openai || '';
        const lines = order.map((o, i) => {
            const p = pm.getPromptById(o.identifier) || {};
            const abs = Number(p.injection_position) === 1;
            return `${i + 1}. ${p.name || o.identifier} [${p.role || 'system'}${abs ? ` D${p.injection_depth}` : ''}${p.marker ? ' 固定位' : ''}]${p.content && !p.marker ? ' ' + snip(p.content, 60) : ''}`;
        });
        return `预设名：${name}\n${lines.join('\n')}`;
    } catch { return '（读取预设失败）'; }
}

function regexSummary() {
    const c = ctx();
    const place = { 1: '用户输入', 2: 'AI输出', 3: '斜杠命令', 5: '世界书', 6: '推理' };
    const fmt = (r, tag) => `${tag}${r.disabled ? '[停用]' : ''}${r.scriptName} /${snip(r.findRegex, 40)}/ 作用于:${(r.placement || []).map((x) => place[x] || x).join('、')}${r.markdownOnly ? ' 仅显示' : ''}${r.promptOnly ? ' 仅发给AI' : ''}`;
    const out = (c.extensionSettings.regex || []).slice(0, 30).map((r) => fmt(r, '全局 '));
    const char = c.characters?.[c.characterId];
    (char?.data?.extensions?.regex_scripts || []).slice(0, 20).forEach((r) => out.push(fmt(r, '局部 ')));
    $$('#saved_preset_scripts .regex_script_name').slice(0, 20).forEach((n) => out.push(`预设 ${n.textContent.trim()}`));
    return out.join('\n') || '（没有正则）';
}

function extSummary() {
    return $$('#extensions_settings .inline-drawer-header b, #extensions_settings2 .inline-drawer-header b').map((b) => b.textContent.trim()).filter(Boolean).join('、');
}

function buildSystem() {
    const a = S().helper.attach;
    let s = '你是酒馆（SillyTavern）的使用小助手，回答玩家关于酒馆界面、预设、世界书、正则、脚本、API 的问题。用简体中文，口语、直接，先给结论再讲原因，需要操作时分步骤。不确定就说不确定，不要编造酒馆里没有的按钮。\n'
        + '酒馆聊天补全的消息拼接顺序：预设前置条目 → 世界书(角色定义之前) → 角色描述/性格/场景/user设定 → 世界书(角色定义之后) → 示例消息 → 聊天历史 → 聊天历史之后的条目(后置指令、以AI身份发送的预填充)。深度条目插在聊天历史里，从最新一条消息往回数：D0 在所有消息之后，D1 在最新一条消息之前，D2 在倒数第二条消息之前，以此类推。';
    s += '\n\n【酒馆社区常用黑话和功能介绍】玩家可能用这些说法提问，你也可以用它们回答：\n' + glossaryText();
    s += '\n\n【常见问题速查】429：撞车（PVP），等一会儿或换渠道；524：把流式传输换成非流式；502：上游或网络问题；400：预设和模型不匹配，换预设；爆代码（聊天里露出代码）：去社区扩展区下载酒馆助手和提示词模板；都装了、切换开场白时爆代码：提示词模板里先点“重置”，再取消勾选“先处理原始内容”。提示词后处理：预设没要求就选不带工具的“严格”。流式：真流生成多少发多少（开流式）；非流写完一次性发（关流式）；假流是中转发空消息防超时、模型用非流写（开流式）；哈基米真流有实时审查容易截断，换非流或假流。更新角色卡：原本的世界书要先重命名或删掉，酒馆检测到重名世界书就不更新；更新办法：角色卡界面“更多 → 更新”，或直接导入新卡再导入存档，或酒馆助手 → 脚本库 → 内置脚本 →“更新角色卡时更新世界书”（会覆盖世界书、找不回旧版，自己改过的先备份）。不要用 WB 指代世界书，就叫世界书。预填：Gemini 3.1 Pro 和 3.6 Flash 起的哈基米（3.5 Flash 之后出的）都不适配预填，要关掉预填条目；3.5 Flash 本身还能用预填。双惩罚（频率惩罚、存在惩罚）：Gemini 2.5 以后的模型不支持，放 0。Gemini 3.x、4.x 的通用模型还会忽略温度、Top P、Top K。写人设、卡、世界书可以用 XML 标签分段，不要滥用 Markdown（AI 会学着在回复里用标题和列表）。你解决不了的问题，让玩家去社区的「新手答疑」频道问（先看「新手入门」，问完不会去「新手开帖」）。';
    s += '\n\n【看屏幕】玩家消息里如果带了【我的屏幕状态】，先根据它判断问题出在哪，直接给具体操作，一步一步说。只有在信息不够、或者你也不确定的时候，才老实说解决不了，让玩家点小助手里的“去答疑提问”，那里能帮他整理好提问再去社区的「新手答疑」频道。不要瞎猜。';
    if (a.preset) s += '\n\n【玩家当前预设结构（已启用条目，按发送顺序）】\n' + presetSummary();
    if (a.regex) s += '\n\n【玩家的正则】\n' + regexSummary();
    if (a.ext) s += '\n\n【玩家已装的扩展】\n' + extSummary();
    return s;
}

async function askAI(log = askLog, extraSys = '') {
    const h = S().helper;
    const sys = buildSystem() + extraSys;
    const msgs = log.slice(-10).map((m) => ({ role: m.role, content: m.content + (m.screen ? `\n\n【我的屏幕状态】\n${m.screen}` : '') + (m.att ? `\n\n【${m.att.label}】\n${m.att.text}` : '') }));
    if (h.mode !== 'own') {
        const c = ctx();
        if (typeof c.generateRaw !== 'function') throw new Error('这个酒馆版本不支持借用当前连接，在修正机里把接口改成“自己填”');
        const prompt = msgs.map((m) => (m.role === 'user' ? '玩家' : '小助手') + '：' + m.content).join('\n\n') + '\n\n小助手：';
        const out = c.generateRaw.length >= 2 ? await c.generateRaw(prompt, null, false, false, sys) : await c.generateRaw({ prompt, systemPrompt: sys });
        return String(out || '').trim();
    }
    return callOwn(h, localStorage.getItem('lf_helper_key') || '', sys, msgs, 1500);
}

async function callOwn(h, key, sys, msgs, max) {
    const base = (h.url || '').trim().replace(/\/+$/, '');
    if (!base || !h.model) throw new Error('先在修正机的小助手里填好地址和模型');
    if (h.protocol === 'anthropic') {
        const url = /\/messages$/.test(base) ? base : /\/v1$/.test(base) ? base + '/messages' : base + '/v1/messages';
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: h.model, max_tokens: max, system: sys, messages: msgs }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error?.message || `接口返回 ${r.status}`);
        return (j.content || []).map((x) => x.text || '').join('').trim();
    }
    const url = /\/chat\/completions$/.test(base) ? base : /\/(v\d+|openai)$/.test(base) ? base + '/chat/completions' : base + '/v1/chat/completions';
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ model: h.model, max_tokens: max, messages: [{ role: 'system', content: sys }, ...msgs] }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error?.message || `接口返回 ${r.status}`);
    return String(j.choices?.[0]?.message?.content || '').trim();
}

// 中转 / 反代地址：答疑时要看，不算隐私（密钥才是）
function apiAddr() {
    const src = q1('#chat_completion_source')?.value || '';
    const v = (src === 'custom' ? q1('#custom_api_url_text')?.value : q1('#openai_reverse_proxy')?.value) || '';
    return { addr: v.trim(), custom: src === 'custom' };
}
// 读当前屏幕状态（不含密钥，不读你正在打的字）
const PANEL_NAMES = { 'left-nav-panel': 'AI 回复配置（预设）', 'rm_api_block': 'API 连接', 'AdvancedFormatting': '高级格式化', 'WorldInfo': '世界书', 'user-settings-block': '用户设置', 'Backgrounds': '背景', 'rm_extensions_block': '扩展', 'PersonaManagement': '用户设定', 'right-nav-panel': '角色管理' };
function screenSnapshot() {
    const c = ctx();
    const o = OAI.oai_settings || {};
    const L = [];
    const ver = (q1('#version_display')?.textContent || '').trim();
    if (ver) L.push(`酒馆版本：${ver}`);
    L.push(`界面语言：${document.documentElement.lang || '未知'}；屏幕宽度：${innerWidth}px`);
    L.push(`接口：${c.mainApi === 'openai' ? '聊天补全' : c.mainApi || '未知'}；来源：${q1('#chat_completion_source')?.value || '未知'}；连接：${c.onlineStatus && c.onlineStatus !== 'no_connection' ? '已连接，模型 ' + c.onlineStatus : '未连接'}`);
    { const a = apiAddr(); if (a.addr || a.custom) L.push(`中转地址：${a.addr || '（没填）'}`); }
    if (c.mainApi === 'openai') L.push(`预设：${o.preset_settings_openai || '未知'}；上下文长度：${o.openai_max_context ?? '?'}；回复长度：${o.openai_max_tokens ?? '?'}；流式：${o.stream_openai ? '开' : '关'}；温度：${o.temp_openai ?? '?'}`);
    const ch = curChar();
    L.push(`当前角色：${ch ? ch.name : '没选'}；聊天楼层数：${c.chat?.length || 0}${chatTok.id === (c.getCurrentChatId?.() || '') && chatTok.n ? `；发给 AI 的聊天记录约 ${fmtTok(chatTok.n)} token（隐藏了 ${chatTok.hidden} 楼）` : ''}`);
    const panels = $$('.drawer-content.openDrawer').map((d) => PANEL_NAMES[d.id] || d.id).filter(Boolean);
    L.push(`打开着的面板：${panels.join('、') || '无'}`);
    const dlg = $$('dialog[open] .popup-content, #dialogue_popup:not([style*="none"]) #dialogue_popup_text').map((d) => snip(d.textContent, 200)).filter(Boolean);
    if (dlg.length) L.push(`屏幕上的弹窗：${dlg.join(' / ')}`);
    const toasts = $$('#toast-container .toast').map((t) => snip(t.textContent, 160));
    if (toasts.length) L.push(`屏幕上的提示：${toasts.join(' / ')}`);
    L.push(`局部正则允许：${allowToggle('regex_scoped_toggle').on ? '开' : '关'}；预设正则允许：${allowToggle('regex_preset_toggle').on ? '开' : '关'}`);
    L.push(`酒馆助手：${findInline(/酒馆助手|tavern ?helper|slash ?runner/i) ? '已装' : '没装'}；提示词模板：${findInline(/提示词模板|prompt ?template/i) ? '已装' : '没装'}`);
    const last = $$('#chat .mes').slice(-2).map((m) => {
        const who = m.getAttribute('is_user') === 'true' ? '玩家' : 'AI';
        const t = m.querySelector('.mes_text')?.textContent || '';
        const leak = /<%|<(div|style|script|html)\b[^>]*>/i.test(t) ? '（露出了代码）' : '';
        return `${who}${leak}：${snip(t, 260) || '（空）'}`;
    });
    if (last.length) L.push(`最后两条消息：\n${last.join('\n')}`);
    if (recentErrs.length) L.push(`最近的报错：\n${recentErrs.slice(-8).join('\n')}`);
    try { const iss = runChecks().filter((x) => x.lv !== 'ok'); if (iss.length) L.push(`体检发现：\n${iss.map((x) => `· ${x.t}${x.x ? '：' + strip(x.x) : ''}`).join('\n')}`); } catch { /* */ }
    return L.join('\n');
}

function askTemplate() {
    const c = ctx(); const o = OAI.oai_settings || {};
    const ver = (q1('#version_display')?.textContent || '').trim() || '（在用户设置最上面能看到）';
    const err = recentErrs.slice(-3).map((x) => x.replace(/^\[[^\]]+\]\s*/, '')).join('\n') || '（没有就写“无”）';
    return `【酒馆版本】${ver}
【设备】${/android|iphone|ipad|mobile/i.test(navigator.userAgent) ? '手机' : '电脑'}
【API 渠道和模型】${q1('#chat_completion_source')?.value || '?'} / ${c.onlineStatus && c.onlineStatus !== 'no_connection' ? c.onlineStatus : '未连接'}
${(() => { const a = apiAddr(); return a.addr || a.custom ? `【中转地址】${a.addr || '（没填）'}\n` : ''; })()}【预设】${o.preset_settings_openai || '?'}
【角色卡】${curChar()?.name || '?'}
【问题描述】（自己写清楚：我做了什么 → 想要什么结果 → 实际发生了什么）
【报错原文】
${err}
【已经试过】（比如：重新抽卡、换预设、刷新页面）
【截图】（看问题挑着截：报错、API 连接、预设、出问题的那条消息、AI 收到了什么、正则面板。只遮密钥，中转地址别遮，答疑的人要看地址对不对。不知道截哪里，打开“去答疑提问”看清单）`;
}

async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch { /* */ }
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* */ }
    ta.remove(); return ok;
}

let pendingScreen = '';
let pendingAtt = null;
function openScreenCheck() {
    closeOptionsMenu();
    if (errBox) errBox.style.display = 'none';
    pendingScreen = screenSnapshot();
    openAsk('帮我看看现在屏幕上是什么问题，该怎么办？', true);
}

function mdLite(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}

function renderAskLog(box) {
    box.innerHTML = askLog.map((m) => `<div class="lf-bub ${m.role === 'user' ? 'me' : 'ai'}${m.err ? ' err' : ''}">${m.role === 'user' ? esc(m.content) + (m.screen ? '<small class="lf-scr">已附带屏幕状态（不含密钥）</small>' : '') + (m.att ? `<small class="lf-scr">已附带${esc(m.att.label)}</small>` : '') : mdLite(m.content)}</div>`).join('')
        || '<div class="lf-muted lf-pad">酒馆里哪儿看不懂都可以问。开着“讲解”时，点任意地方再点“问问它”，会带着那块的说明来问。</div>';
    box.scrollTop = box.scrollHeight;
}

let asking = false;
function openAsk(prefill = '', auto = false) {
    closeOptionsMenu();
    let w = document.getElementById('lf_ask');
    if (!w) {
        w = sheet('lf_ask', '小助手', `<div class="lf-log" id="lf_log"></div>
            <div class="lf-chips lf-scroll" id="lf_qs"><span class="lf-chip">D0 和 D1 有什么区别</span><span class="lf-chip">回复老是被截断</span><span class="lf-chip">世界书为什么没触发</span><span class="lf-chip">帮我看看预设有没有打架的条目</span><span class="lf-chip lf-chip-gloss">词典</span></div>
            <div class="lf-chips" id="lf_learn"><span class="lf-chip on" data-l="screen">让小助手看屏幕</span><span class="lf-chip" data-l="check">帮我查问题</span><span class="lf-chip" data-l="menu">带我学</span><span class="lf-chip" data-l="desk">去答疑提问</span></div>
            <div class="lf-askrow"><textarea class="text_pole" id="lf_q" rows="1" placeholder="酒馆里哪儿看不懂，直接问"></textarea><button class="lf-btn" id="lf_send" title="发送"><i class="fa-solid fa-paper-plane"></i></button></div>`);
        const log = w.querySelector('#lf_log');
        const q = w.querySelector('#lf_q');
        const send = async (text) => {
            text = String(text || '').trim();
            if (!text || asking) return;
            asking = true;
            askLog.push({ role: 'user', content: text, screen: pendingScreen || undefined, att: pendingAtt || undefined });
            pendingScreen = ''; pendingAtt = null;
            q.value = '';
            renderAskLog(log);
            const wait = document.createElement('div'); wait.className = 'lf-bub ai lf-muted'; wait.textContent = '想一想…'; log.appendChild(wait); log.scrollTop = log.scrollHeight;
            try { askLog.push({ role: 'assistant', content: (await askAI()) || '（空回复）' }); }
            catch (err) { askLog.pop(); askLog.push({ role: 'user', content: text }); askLog.push({ role: 'assistant', content: '没问到：' + (err?.message || err), err: true }); }
            asking = false;
            renderAskLog(log);
        };
        w.querySelector('#lf_send').addEventListener('click', () => send(q.value));
        w.querySelector('#lf_learn').addEventListener('click', async (e) => {
            const c = e.target.closest('[data-l]'); if (!c) return;
            const k = c.dataset.l;
            if (k === 'screen') { pendingScreen = screenSnapshot(); return send('帮我看看现在屏幕上是什么问题，该怎么办？'); }
            if (k === 'check') { w.remove(); return openCheckup(); }
            if (k === 'howask') { w.remove(); openWizard('menu'); return runFlow('ask'); }
            if (k === 'desk') { w.remove(); return openAskDesk(); }
            if (k === 'tpl') {
                const ok = await copyText(askTemplate());
                const jump = ok && openDesk();
                askLog.push({ role: 'assistant', content: ok ? `提问模板已复制。${jump ? '已经帮你打开「新手答疑」，' : '去社区的「新手答疑」频道，'}粘贴进去，把【问题描述】【已经试过】自己补全，再附截图（只遮密钥，中转地址别遮），别人才好帮你。想让我帮你整理，点“去答疑提问”。先看「新手入门」，问完还不会就去「新手开帖」。${deskUrl() ? '' : '\n（在修正机设置的小助手里填上频道链接，以后复制完会直接跳过去。）'}` : '复制失败了，手动复制下面这段：\n\n' + askTemplate() });
                renderAskLog(log); return;
            }
            w.remove(); openWizard(k === 'menu' ? 'menu' : 'full');
        });
        q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(q.value); } });
        w.querySelector('#lf_qs').addEventListener('click', (e) => { const c = e.target.closest('.lf-chip'); if (!c) return; if (c.classList.contains('lf-chip-gloss')) { w.remove(); openGlossary(); return; } if (/打架/.test(c.textContent)) { w.remove(); return askPresetConflict(); } send(c.textContent); });
        w._send = send;
        renderAskLog(log);
    }
    if (prefill) auto ? w._send(prefill) : (w.querySelector('#lf_q').value = prefill);
}

function openGlossary(q = '', kind = '') {
    closeOptionsMenu();
    const w = sheet('lf_gloss', '词典', `<input class="text_pole" id="lf_gq" placeholder="搜一个听不懂的词" value="${esc(q)}">
        <div class="lf-chips" id="lf_gk"><span class="lf-chip" data-k="">全部</span><span class="lf-chip" data-k="黑话">黑话</span><span class="lf-chip" data-k="介绍">介绍</span></div>
        <small class="lf-muted">黑话是圈里的说法；介绍是酒馆功能和操作的说明。</small><div class="lf-gloss" id="lf_gl"></div>`);
    const list = w.querySelector('#lf_gl');
    let cur = kind;
    const draw = () => {
        const k = w.querySelector('#lf_gq').value.trim().toLowerCase();
        $$('#lf_gk .lf-chip', w).forEach((c) => c.classList.toggle('on', c.dataset.k === cur));
        const hits = GLOSSARY.filter(([t, a, x]) => (!cur || termKind(t) === cur) && (!k || (t + a + x).toLowerCase().includes(k)));
        list.innerHTML = hits.map(([t, a, x]) => `<div class="lf-term" data-term="${esc(t)}"><b>${esc(t)}</b><em class="lf-kind">${termKind(t)}</em>${a ? `<small>也叫 ${esc(a)}</small>` : ''}<p>${esc(x)}</p></div>`).join('')
            || `<div class="lf-muted lf-pad">词典里还没有，点下面问小助手</div><button class="lf-btn" id="lf_gask">问小助手“${esc(k)}”是什么意思</button>`;
    };
    draw();
    w.querySelector('#lf_gq').addEventListener('input', draw);
    w.querySelector('#lf_gk').addEventListener('click', (e) => { const c = e.target.closest('[data-k]'); if (!c) return; cur = c.dataset.k; draw(); });
    list.addEventListener('click', (e) => {
        if (e.target.closest('#lf_gask')) { const k = w.querySelector('#lf_gq').value.trim(); w.remove(); openAsk(`酒馆里说的“${k}”是什么意思？`, true); }
    });
}

/* ---------------- 配置向导 ---------------- */

const CHANNELS = {
    gemini: { helper: { protocol: 'openai', url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' }, name: '哈基米 Gemini', src: 'makersuite', key: '#api_key_makersuite', model: '#model_google_select', rec: ['gemini-2.5-pro', 'gemini-2.5-flash', 'pro'], where: 'Google AI Studio（aistudio.google.com）右上角的“Get API key”。' },
    claude: { helper: { protocol: 'anthropic', url: 'https://api.anthropic.com', model: 'claude-haiku-4-5' }, name: 'Claude 官方', src: 'claude', key: '#api_key_claude', model: '#model_claude_select', rec: ['sonnet-4-5', 'sonnet-4', 'opus'], where: 'Anthropic 控制台（console.anthropic.com）的 API Keys 页面。' },
    openai: { helper: { protocol: 'openai', url: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' }, name: 'OpenAI 官方', src: 'openai', key: '#api_key_openai', model: '#model_openai_select', rec: ['gpt-4.1', 'gpt-4o'], where: 'OpenAI 平台（platform.openai.com）的 API keys 页面。' },
    deepseek: { helper: { protocol: 'openai', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' }, name: 'DeepSeek', src: 'custom', key: '#api_key_custom', model: '#model_custom_select', url: '#custom_api_url_text', fixedUrl: 'https://api.deepseek.com/v1', modelId: 'deepseek-chat', rec: ['deepseek-chat'], where: 'DeepSeek 开放平台（platform.deepseek.com）注册、充值后，在左侧“API keys”新建一个。' },
    openrouter: { helper: { protocol: 'openai', url: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-chat' }, name: 'OpenRouter', src: 'openrouter', key: '#api_key_openrouter', model: '#model_openrouter_select', rec: [], where: 'OpenRouter（openrouter.ai）的 Keys 页面。' },
    custom: { helper: { protocol: 'openai', url: '', model: '' }, name: '中转 / 反代 / 公益站', src: 'custom', key: '#api_key_custom', model: '#model_custom_select', url: '#custom_api_url_text', rec: [], where: '找给你地址的人要，一般是 sk- 开头的一串。' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q1 = (sel) => (sel ? document.querySelector(sel) : null);
let wizLangAsked = false; let wiz = null; let wizCh = null; let wizTimer = null; let gTarget = null; let gFrame = null; let gRaf = 0;

function realClick(el) { if (!el) return; helperBypass = true; try { el.click(); } finally { helperBypass = false; } }

function setVal(sel, val) {
    const el = q1(sel);
    if (!el) return false;
    if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === String(val))) return false;
    if (String(el.value) === String(val)) return true;
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

function openDrawer(btnSel) {
    const d = q1(btnSel);
    if (!d) return;
    const content = d.querySelector(':scope > .drawer-content');
    if (content && content.classList.contains('openDrawer')) return;
    realClick(d.querySelector(':scope > .drawer-toggle'));
}

function findInline(re) {
    return $$('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')
        .find((d) => re.test(d.querySelector('.inline-drawer-header')?.textContent || ''));
}
function openInline(re) {
    const d = findInline(re);
    if (!d) return null;
    const c = d.querySelector('.inline-drawer-content');
    if (c && getComputedStyle(c).display === 'none') realClick(d.querySelector('.inline-drawer-header'));
    return d;
}

function guide(el) {
    gTarget = el || null;
    if (!gFrame) { gFrame = document.createElement('div'); gFrame.id = 'lf_gframe'; document.body.appendChild(gFrame); }
    cancelAnimationFrame(gRaf);
    if (!gTarget) { gFrame.style.display = 'none'; wiz?.classList.remove('lf-wtop'); return; }
    try { gTarget.scrollIntoView({ block: wiz ? 'start' : 'center', behavior: 'smooth' }); } catch { /* */ }
    clearTimeout(guide._t);
    guide._t = setTimeout(placeWiz, 500);
    const tick = () => {
        if (!gTarget || !document.body.contains(gTarget)) { gFrame.style.display = 'none'; return; }
        const r = gTarget.getBoundingClientRect();
        if (!r.width && !r.height) gFrame.style.display = 'none';
        else Object.assign(gFrame.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
        gRaf = requestAnimationFrame(tick);
    };
    tick();
}

const connected = () => { const st = ctx().onlineStatus; return !!st && st !== 'no_connection'; };
function stopPoll() { clearInterval(wizTimer); wizTimer = null; }
function poll(check, done, every = 1200) { stopPoll(); wizTimer = setInterval(() => { try { if (check()) { stopPoll(); done(); } } catch { /* */ } }, every); }

function wizSay(text, acts) {
    const log = wiz.querySelector('.lf-wlog');
    const d = document.createElement('div');
    d.className = 'lf-wmsg';
    d.innerHTML = (acts?.length ? `<div class="lf-wacts">${acts.map((a) => `<i class="fa-solid fa-check"></i> ${esc(a)}`).join('<br>')}</div>` : '') + `<div>${text}</div>`;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
}
function wizMe(text) {
    const log = wiz.querySelector('.lf-wlog');
    const d = document.createElement('div'); d.className = 'lf-wme'; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
}
function wizOpts(list) {
    const box = wiz.querySelector('.lf-wchips');
    box.innerHTML = '';
    list.forEach(([label, fn, primary]) => {
        const b = document.createElement('span');
        b.className = 'lf-chip' + (primary ? ' on' : '');
        b.textContent = label;
        b.addEventListener('click', () => { wizMe(label); box.innerHTML = ''; Promise.resolve(fn()).catch((err) => wizSay('出了点问题：' + esc(err?.message || err))); });
        box.appendChild(b);
    });
    const log = wiz.querySelector('.lf-wlog');
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
}

function openWizard(mode = 'full') {
    closeOptionsMenu();
    if (helperOn) setHelper(false);
    if (!wiz) {
        wiz = document.createElement('div');
        wiz.id = 'lf_wiz';
        wiz.innerHTML = `<div class="lf-wh"><b>小助手 · 带你做</b><span class="lf-wmin" title="收起"><i class="fa-solid fa-chevron-down"></i></span><span class="lf-wclose" title="关闭"><i class="fa-solid fa-xmark"></i></span></div>
            <div class="lf-wbody"><div class="lf-wlog"></div><div class="lf-chips lf-wchips"></div>
            <div class="lf-askrow"><input class="text_pole lf-wq" placeholder="哪里卡住了，直接问"><button class="lf-btn lf-wsend"><i class="fa-solid fa-paper-plane"></i></button></div></div>`;
        document.body.appendChild(wiz);
        wiz.querySelector('.lf-wclose').addEventListener('click', closeWizard);
        wiz.querySelector('.lf-wmin').addEventListener('click', () => wiz.classList.toggle('mini'));
        wiz.querySelector('.lf-wh b').addEventListener('click', () => wiz.classList.remove('mini'));
        const ask = () => {
            const inp = wiz.querySelector('.lf-wq'); const t = inp.value.trim(); if (!t) return;
            inp.value = ''; wizMe(t);
            if (S().helper.mode === 'own' || connected()) openAsk(t, true);
            else wizSay('API 还没连上，我暂时只能按步骤带你走。先把 API 配好，之后什么都能问。');
        };
        wiz.querySelector('.lf-wsend').addEventListener('click', ask);
        wiz.querySelector('.lf-wq').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) ask(); });
    }
    wiz.classList.remove('mini');
    wiz.querySelector('.lf-wlog').innerHTML = '';
    if (mode === 'menu') { wizMore(); return; }
    if (mode === 'blank') return;
    if (mode === 'offer') {
        if (connected()) {
            wizSay('第一次见。你的 API 已经连上了，要我教你怎么导入预设、角色卡、正则和脚本吗？');
            wizOpts([['教我导入', wizPreset, 1], ['从 API 开始配', wizStart], ['不用了', closeWizard]]);
        } else {
            wizSay('第一次见。要我帮你把酒馆配一遍吗？API、预设、角色卡、正则、脚本，一步步来。');
            wizOpts([['开始', wizStart, 1], ['以后再说', () => { wizSay('好，顶栏的“新手引导”按钮随时找我。'); setTimeout(closeWizard, 1500); }]]);
        }
        return;
    }
    wizStart();
}

function placeWiz() {
    if (!wiz || !gTarget || !document.body.contains(gTarget)) return;
    const r = gTarget.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const h = wiz.offsetHeight;
    const top = wiz.classList.contains('lf-wtop');
    const coveredBottom = r.top + Math.min(r.height, 80) > innerHeight - h;
    const coveredTop = r.top < h;
    if (!top && coveredBottom && r.top > h) wiz.classList.add('lf-wtop');
    else if (top && coveredTop && r.bottom < innerHeight - h) wiz.classList.remove('lf-wtop');
}

function closeWizard() { stopPoll(); guide(null); wiz?.remove(); wiz = null; }

function channelOpts() { return Object.entries(CHANNELS).map(([k, c]) => [c.name, () => wizPick(k)]); }

function wizStart() {
    stopPoll(); guide(null);
    if (!isChineseUI() && !wizLangAsked) {
        wizLangAsked = true;
        wizSay('先把酒馆切成<b>中文</b>吧，不然后面我框出来的按钮全是英文。');
        wizOpts([['帮我切成中文', () => switchToChinese('start'), 1], ['看图文教程', () => openGuide('lang')], ['不用，继续', wizStart]]);
        return;
    }
    if (connected()) {
        wizSay(`<b>第一步：API</b>。你的 API 已经连上了，模型是「${esc(ctx().onlineStatus)}」。<br>接下来配小助手，再导入预设、角色卡。`);
        wizOpts([['下一步：配小助手', startHelperSetup, 1], ['跳过，导入预设', wizPreset], ['重新配 API', () => { wizSay('好，重新来。你现在<b>有 API</b> 吗？'); wizOpts([['有', wizHasApi, 1], ['没有', wizNoApi]]); }]]);
        return;
    }
    wizSay('<b>第一步：配置 API</b>。我来帮你把酒馆配好。先问一句：你现在<b>有 API</b> 吗？就是能连 AI 的密钥。');
    wizOpts([['有', wizHasApi, 1], ['没有', wizNoApi], ['不知道是什么', () => {
        wizSay('API 就是酒馆连 AI 用的通道，你需要一个地址和一串密钥（Key）。酒馆本身不带 AI，必须自己接一个。');
        wizOpts([['有', wizHasApi, 1], ['没有', wizNoApi]]);
    }]]);
}

function wizHasApi() {
    wizSay('好。它是从哪个渠道来的？接口我会统一设成<b>聊天补全</b>。');
    wizOpts([...channelOpts(), ['不知道', () => {
        wizSay('看你拿到密钥的网站：aistudio.google.com 是哈基米；console.anthropic.com 是 Claude 官方；platform.deepseek.com 是 DeepSeek；别人给你一个网址加一串 sk- 开头的密钥，多半是中转或公益站。');
        wizOpts(channelOpts());
    }]]);
}

function wizNoApi() {
    wizSay('推荐先去 <b>DeepSeek</b> 弄一个：便宜、国内能直接充值、中文写得不错。<br>步骤：打开 platform.deepseek.com 注册 → 充一点钱 → 左侧“API keys”新建一个，复制下来（只显示一次）。<br>弄好回来，我按 <b>OpenAI 兼容</b>格式帮你填，不用酒馆里那个 DeepSeek 选项，兼容格式更稳。');
    wizOpts([['弄好了，帮我填', () => wizPick('deepseek'), 1], ['我有别的渠道', wizHasApi]]);
}

function ppStrict() {
    const sel = q1('#custom_prompt_post_processing');
    if (!sel) return null;
    const o = [...sel.options].find((x) => x.value === 'strict') || [...sel.options].find((x) => /严格|strict/i.test(x.textContent) && !/工具|tool|半|semi/i.test(x.textContent));
    return o ? o.value : null;
}

async function wizPick(k) {
    const ch = CHANNELS[k]; wizCh = ch;
    openDrawer('#sys-settings-button');
    await sleep(350);
    const acts = [];
    if (setVal('#main_api', 'openai')) acts.push('接口类型 → 聊天补全');
    await sleep(350);
    if (setVal('#chat_completion_source', ch.src)) acts.push('来源 → ' + (ch.src === 'custom' ? '自定义（OpenAI 兼容）' : ch.name));
    else { wizSay('没找到这个来源的选项，可能是酒馆版本比较旧。你可以在红框里手动选一下。'); guide(q1('#chat_completion_source')); }
    await sleep(450);
    if (ch.fixedUrl) {
        if (setVal(ch.url, ch.fixedUrl)) acts.push('地址 → ' + ch.fixedUrl);
        if (ch.modelId && setVal('#custom_model_id', ch.modelId)) acts.push('模型 → ' + ch.modelId);
        if (ch.src === 'custom') acts.push('格式 → OpenAI 兼容');
        if (ch.src === 'custom') { const v = ppStrict(); if (v !== null && fixSet('#custom_prompt_post_processing', v, '提示词后处理 → 严格')) acts.push('提示词后处理 → 严格（不带工具；预设有别的要求就按预设改）'); }
        wizKey(acts);
        return;
    }
    if (ch.src === 'custom') { const v = ppStrict(); if (v !== null && fixSet('#custom_prompt_post_processing', v, '提示词后处理 → 严格')) acts.push('提示词后处理 → 严格（不带工具；预设有别的要求就按预设改）'); }
    if (ch.url) {
        guide(q1(ch.url));
        wizSay('中转要一个地址，就是对方给你的网址，结尾一般带 <b>/v1</b>。填进红框里，填好告诉我。', acts);
        wizOpts([['地址填好了', wizUrlCheck, 1], ['我没有地址', () => wizSay('中转和公益站的地址要找提供的人要。没有的话，选一个官方渠道也行。')]]);
        return;
    }
    wizKey(acts);
}

function wizUrlCheck() {
    const v = (q1(CHANNELS.custom.url)?.value || '').trim();
    if (!/^https?:\/\//i.test(v)) {
        wizSay('红框里的地址要以 http:// 或 https:// 开头，再看一眼？');
        wizOpts([['改好了', wizUrlCheck, 1]]); return;
    }
    const tip = /\/v1\/?$/.test(v) ? [] : ['提醒：地址结尾通常是 /v1，没有的话连不上再回来加'];
    wizKey(['地址 → ' + snip(v, 32), ...tip]);
}

function wizKey(acts) {
    const ch = wizCh;
    guide(q1(ch.key));
    wizSay('密钥要你<b>自己填</b>，我只检查红框里是否已填写，不保存这处的密钥内容。填好点“我填好了”，我帮你点连接。<br><span class="lf-wdim">提醒：密钥相当于密码，别发给任何人；分享截图前把密钥遮住。中转地址不用遮，去答疑提问时别人要看它对不对。</span>', acts);
    wizOpts([['我填好了', wizConnect, 1], ['密钥去哪拿？', () => { wizSay(ch.where + '密钥相当于账号密码，别发给任何人。'); wizOpts([['我填好了', wizConnect, 1]]); }]]);
}

function keyLooksSaved(inp) {
    return !!inp && (inp.value.trim() || /✔|✓|saved|已保存|\*{3,}|•{3,}/i.test(inp.getAttribute('placeholder') || ''));
}

// 把酒馆的报错翻译成人话：[匹配, 是什么, 怎么办]
const ERR_RULES = [
    [/ending with a model turn|does not support assistant message prefill|conversation must end with a user message/i, '这个模型不适配预填', '预设最后一条是以 AI 身份发的预填，这个模型不收。Gemini 3.1 Pro、3.6 Flash 起的哈基米，还有新版 Claude 都是这样。去预设里把最后那条预填关掉，或者换适配这个模型的预设。'],
    [/context.{0,20}(length|window)|maximum context|too long|token.{0,20}(limit|exceed)|reduce the length|prompt is too long/i, '爆上下文', '发的内容超过模型上限了。在“AI 回复配置”把上下文长度调小，或者隐藏一些旧楼层、做个总结。'],
    [/safety|blocked|prohibited|finish_?reason.{0,10}(other|safety)|content.?filter|moderation|harm/i, '被审查拦了', '模型觉得内容越界，直接不写了（哈基米常见，真流有实时审查，更容易写到一半被截断，可以换非流或假流）。可以抽卡重来、换个破限更好的预设，或者把刚才那句话改得含蓄一点。'],
    [/\b429\b|too many requests/i, '429：撞车了（PVP）', '大家在抢同一份额度，圈里叫 PVP。等几十秒再发，错开高峰，或者换个渠道。'],
    [/\b524\b|a timeout occurred/i, '524：等太久超时了', '把“AI 回复配置”里的流式传输关掉，换成非流式再发；中转有假流的话，开着流式用假流也行。'],
    [/\b502\b|bad gateway/i, '502：上游或网络出问题', '不是你的错：中转的上游挂了，或者网络不稳。等一会儿再试，或者换个渠道。'],
    [/\b400\b|bad request/i, '400：预设和模型不匹配', '这个预设可能不适合你现在用的模型，换一个对应这个模型的预设试试。'],
    [/401|unauthori|invalid.{0,20}key|incorrect api key|api key not valid|authentication/i, '密钥不对', '检查密钥有没有复制完整、前后有没有多空格；中转的密钥找提供的人确认一下。'],
    [/403|forbidden|permission|region|location|not supported in your|unsupported_country/i, '没权限', '这个密钥没开通该模型，或者你所在的地区被限制了。官方渠道常见，换个网络或换个模型试试。'],
    [/rate.?limit|quota|exceeded your|insufficient|balance|余额|credit/i, '额度用完或太频繁', '等一会儿再发；如果一直这样，去渠道后台看看余额。'],
    [/overloaded|\b50[034]\b|service unavailable|internal server|upstream/i, '上游出问题', '不是你的错，是服务器那边忙或坏了。等一两分钟再试，或者换个模型。'],
    [/unexpected token|json|parse|invalid response/i, '返回格式不对', '多半是中转站的问题。试试在“AI 回复配置”里关掉流式传输，或者换个中转。'],
    [/404|not found|model.{0,20}(does not exist|not exist|invalid)/i, '地址或模型不对', '中转地址结尾一般是 /v1；模型名要和渠道支持的一致，从列表里选最稳。'],
    [/fetch|network|timeout|timed out|econn|enotfound|certificate|socket/i, '连不到服务器', '地址写错了，或者网络不通。官方渠道在国内常要开 VPN。'],
    [/not connected|no connection|未连接/i, '还没连 API', '先去“API 连接”连上，顶栏的“新手引导”按钮可以带你配。'],
    [/import|导入/i, '导入失败', '确认文件对不对：角色卡是 PNG 或 JSON，要原图，聊天软件转发过的图片会被压缩，里面的设定就丢了。'],
    [/empty|空回复|no response|returned no/i, '空回', 'AI 回了一片空白。常见原因：被审查、额度用完、上游出错。抽卡重来试试，连续空回就看看 API。'],
];

function explainError(text) {
    const e = String(text || '');
    const r = ERR_RULES.find(([re]) => re.test(e));
    return r ? { what: r[1], fix: r[2] } : null;
}

function diagnose(err) {
    const x = explainError(err);
    if (x) return `<b>${x.what}</b>：${x.fix}`;
    return '没连上。' + (err ? `酒馆报的是：${esc(snip(err, 90))}` : '酒馆没报具体原因，检查一下密钥和网络。');
}

const HELP_DESK = '解决不了？去社区的「新手答疑」问：先看「新手入门」，问完还不会就去「新手开帖」。';

let errBox = null; let errHideT = 0; let lastErrShown = { t: '', at: 0 };
function showErrHelp(raw) {
    if (!on('ui_err_explain')) return;
    const text = strip(raw);
    if (!text || /Love 修正机/.test(text)) return;
    if (lastErrShown.t === text && Date.now() - lastErrShown.at < 8000) return;
    lastErrShown = { t: text, at: Date.now() };
    const leakPT = text === '__leakpt__';
    const leak = leakPT ? 'pt' : text.startsWith('__leak__') ? text.slice(8) : '';
    const x = leakPT ? { what: '又爆代码了', fix: '酒馆助手和提示词模板都装了还露出代码，常见于切换开场白之后。去扩展里的「提示词模板」，先点“重置”，再把“先处理原始内容”取消勾选，然后重新切一次开场白。' } : leak ? { what: '看见爆代码了', fix: `聊天里露出了一堆代码，说明这张卡要用的扩展没装：缺${leak}。上社区的扩展区下载${leak}，装好刷新就能正常显示。` } : explainError(text);
    if (!errBox) {
        errBox = document.createElement('div');
        errBox.id = 'lf_err';
        document.body.appendChild(errBox);
        errBox.addEventListener('click', (e) => {
            const a = e.target.closest('button')?.dataset.a;
            if (a === 'ask') { errBox.style.display = 'none'; openAsk(`酒馆报错了：「${errBox.dataset.raw}」这是什么意思，我该怎么办？`, true); }
            if (a === 'close') errBox.style.display = 'none';
            if (a === 'guide') { errBox.style.display = 'none'; openGuide('ext'); }
            if (a === 'ptgo') { errBox.style.display = 'none'; openDrawer('#extensions-settings-button'); setTimeout(() => { const d = openInline(/提示词模板|prompt ?template/i); const b = d && $$('button, .menu_button, label, input', d).find((e) => /重置|reset/i.test(e.textContent || e.value || e.title || '')); guide(b || d?.querySelector('.inline-drawer-header') || null); if (d) setTimeout(() => guide(null), 9000); else say('没找到提示词模板，看看是不是没装', 'warning'); }, 450); }
            if (a === 'screen') openScreenCheck();
            if (a === 'askdesk') { errBox.style.display = 'none'; openAskDesk(); }
            if (a === 'check') { errBox.style.display = 'none'; openCheckup(); }
            if (a === 'desk') { errBox.style.display = 'none'; copyText(askTemplate()).then((ok) => { const j = ok && openDesk(); say(ok ? (j ? '提问模板已复制，粘贴到「新手答疑」就行' : '提问模板已复制，去「新手答疑」粘贴') : '复制失败了，在小助手里点“复制提问模板”', ok ? 'success' : 'warning'); }); }
        });
    }
    errBox.dataset.raw = snip(text, 300);
    errBox.innerHTML = `<div class="lf-tip-t">小助手：${x ? esc(x.what) : '看看这个报错'}</div><div class="lf-tip-x">${x ? esc(x.fix) : '这个报错我还没收录，点“问问它”，我带着报错原文去问。'}</div>${leak ? '' : `<div class="lf-err-raw">${esc(snip(text, 120))}</div>`}<div class="lf-err-help">${HELP_DESK}</div><div class="lf-tip-b">${leakPT ? '<button data-a="ptgo">带我去提示词模板</button>' : leak ? '<button data-a="guide">看安装教程</button>' : ''}<button data-a="check">帮我查问题</button><button data-a="close">知道了</button></div>`;
    errBox.style.display = 'block';
    clearTimeout(errHideT);
    errHideT = setTimeout(() => { if (errBox) errBox.style.display = 'none'; }, 25000);
}

// 爆代码：卡的前端代码直接露在聊天里，通常是没装酒馆助手或提示词模板
const leakWarned = new Set();
function checkCodeLeak() {
    if (!on('ui_err_explain')) return;
    const chatId = ctx().getCurrentChatId?.() || '';
    if (!chatId || leakWarned.has(chatId)) return;
    const mes = $$('#chat .mes .mes_text').slice(-4);
    const leaked = mes.some((m) => {
        const t = m.textContent || '';
        if (/<%[=_-]?|getvar\(|setvar\(/.test(t)) return true;
        if (/<(div|style|script|html|body|span)\b[^>]*>/i.test(t) && /<\/(div|style|script|html|body|span)>/i.test(t)) return true;
        return [...m.querySelectorAll('pre code')].some((c) => /<(html|body|style|script|div)\b/i.test(c.textContent || '') && /(<!DOCTYPE|<html|<body|<style)/i.test(c.textContent || ''));
    });
    if (!leaked) return;
    const hasTH = !!findInline(/酒馆助手|tavern ?helper|slash ?runner/i);
    const hasPT = !!findInline(/提示词模板|prompt ?template/i);
    leakWarned.add(chatId);
    if (hasTH && hasPT) { showErrHelp('__leakpt__'); return; }
    const miss = [!hasTH && '酒馆助手', !hasPT && '提示词模板'].filter(Boolean).join('和');
    showErrHelp(`__leak__${miss}`);
}

async function wizConnect() {
    const ch = wizCh;
    const inp = q1(ch.key);
    if (inp && !keyLooksSaved(inp)) { wizSay('红框里还是空的，先把密钥填进去哦。'); wizOpts([['我填好了', wizConnect, 1]]); return; }
    lastToastErr = '';
    realClick(q1('#api_button_openai'));
    wizSay('连接中…');
    const t0 = Date.now();
    poll(() => connected() || Date.now() - t0 > 20000, async () => {
        if (!connected()) {
            guide(q1(ch.key));
            wizSay(diagnose(lastToastErr));
            wizOpts([['再试一次', wizConnect, 1], ['换个渠道', wizHasApi]]);
            return;
        }
        await sleep(600);
        const sel = q1(ch.model);
        let picked = sel?.value || '';
        if (sel) {
            const opts = [...sel.options].map((o) => o.value).filter(Boolean);
            const want = ch.rec.map((r) => opts.find((v) => v.includes(r))).find(Boolean);
            if (want && want !== sel.value) { setVal(ch.model, want); picked = want; }
            if (!picked && opts[0]) { setVal(ch.model, opts[0]); picked = opts[0]; }
            guide(sel);
        }
        wizSay(`连上了。模型现在是「${esc(picked || '默认')}」，想换就在红框里改。`, ['已点击“连接”', '状态：已连接']);
        wizOpts([['下一步', wizHelperOffer, 1], ['换个渠道', wizHasApi]]);
    }, 800);
}

function wizHelperOffer() {
    const ch = wizCh;
    const cheap = ch.helper?.model;
    wizSay(`要不要<b>给小助手也配上</b>？配好以后，看不懂的地方可以直接问它，报错也能带着原文去问。<br>小助手建议用<b>便宜的模型</b>${cheap ? `（我会帮你填 ${esc(cheap)}）` : ''}，问问题用不着贵的。`);
    wizOpts([['好，帮我配', wizHelperSetup, 1], ['直接用酒馆当前连接', () => {
        S().helper.mode = 'st'; save(); renderPanel();
        wizSay('好，小助手会借用你现在连的模型来回答。注意这样花的是聊天用的那个模型的钱。');
        wizOpts([['下一步：预设', wizPreset, 1]]);
    }], ['不用', wizPreset]]);
}

function wizHelperSetup() {
    const ch = wizCh;
    const h = { ...(ch.helper || { protocol: 'openai', url: '', model: '' }) };
    if (ch.src === 'custom' && !ch.fixedUrl) h.url = (q1(ch.url)?.value || '').trim();
    const needModel = !h.model;
    wizSay(`我先帮你填好：格式 ${h.protocol === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容'}，地址 ${esc(h.url || '（待填）')}${h.model ? `，模型 ${esc(h.model)}` : ''}。<br>密钥还是要<b>你自己粘贴</b>一次（和刚才那个一样就行），会保存在本机浏览器，并用于请求选定的 AI 接口。
        <div class="lf-wform"><input type="password" class="text_pole" id="lf_wk" placeholder="粘贴密钥">${needModel ? '<input class="text_pole" id="lf_wm" placeholder="填一个便宜的模型名，带 mini、flash、haiku 的一般都便宜">' : ''}</div>`);
    wizOpts([['保存并测试', async () => {
        const key = (document.getElementById('lf_wk')?.value || '').trim();
        if (needModel) h.model = (document.getElementById('lf_wm')?.value || '').trim();
        if (!key) { wizSay('密钥还没粘贴哦。'); return wizHelperSetup(); }
        if (!h.model) { wizSay('模型名还没填。'); return wizHelperSetup(); }
        localStorage.setItem('lf_helper_key', key);
        Object.assign(S().helper, { mode: 'own', protocol: h.protocol, url: h.url, model: h.model }); save(); renderPanel();
        wizSay('测试中…');
        try {
            const out = await callOwn(S().helper, key, '你是测试助手。', [{ role: 'user', content: '只回复两个字：好的' }], 20);
            wizSay(`小助手配好了，它回了：「${esc(snip(out, 20))}」。之后在三条杠的“讲解：点哪讲哪”里点“问问它”就能用。`);
            wizOpts([['下一步：预设', wizPreset, 1]]);
        } catch (err) {
            wizSay(`没测通：${diagnose(err?.message || err)}<br>有些渠道不让网页直接请求，那就改用“酒馆当前连接”。`);
            wizOpts([['重新填', wizHelperSetup, 1], ['改用酒馆当前连接', () => { S().helper.mode = 'st'; save(); renderPanel(); wizSay('好，改成借用酒馆当前连接了。'); wizOpts([['下一步：预设', wizPreset, 1]]); }], ['先跳过', wizPreset]]);
        }
    }, 1], ['不配了', wizPreset]]);
}

function presetCount() { return q1('#settings_preset_openai')?.options.length || 0; }

async function wizPreset() {
    stopPoll();
    openDrawer('#ai-config-button');
    await sleep(400);
    guide(q1('#settings_preset_openai'));
    wizSay('预设决定 AI 怎么写：文风、规则、长度都在里面。你<b>有预设</b>吗？一般是一个 JSON 文件。');
    wizOpts([['有', wizPresetImport, 1], ['没有', () => {
        wizSay('去社区的<b>预设分区</b>找一个，比如类脑的预设区，挑评价多、最近还在更新的。下回来是一个 JSON 文件，回来我教你导入。<br>卡作者推荐了预设的话，优先用那个。');
        wizOpts([['下好了，教我导入', wizPresetImport, 1], ['先用默认的', wizCard]]);
    }]]);
}

async function wizPresetImport() {
    stopPoll();
    openDrawer('#ai-config-button');
    await sleep(350);
    const btn = q1('#import_oai_preset') || document.querySelector('#ai-config-button .fa-file-import');
    guide(btn || q1('#settings_preset_openai'));
    const n0 = presetCount();
    wizSay('点红框里的<b>导入</b>按钮，选预设的 JSON 文件。导入后在下拉框里选中它就生效了。');
    wizOpts([['导入好了', wizPresetDone, 1], ['找不到按钮', () => wizSay('在“AI 回复配置”最上面，预设下拉框旁边那排小图标里，有个带箭头的文件图标就是导入。')]]);
    poll(() => presetCount() > n0, () => { wizSay('看到新预设了，记得在下拉框里选中它。'); wizPresetDone(); });
}

async function wizPresetDone() {
    stopPoll();
    const temp = q1('#temp_openai')?.closest('.range-block');
    guide(temp || q1('#settings_preset_openai'));
    wizSay('还有一件事：<b>温度、Top P、各种惩罚这些参数别乱动</b>。预设作者是配合条目一起调好的，改了反而容易变笨、复读或胡言乱语。<br>觉得写得不对，先换预设，或者来问我，别先去拧参数。');
    wizOpts([['知道了，下一步：导入角色卡', wizCard, 1]]);
}

async function wizCard() {
    stopPoll();
    openDrawer('#rightNavHolder');
    await sleep(400);
    realClick(q1('#rm_button_characters'));
    await sleep(300);
    guide(q1('#character_import_button'));
    const n0 = ctx().characters?.length || 0;
    wizSay('点红框里的<b>导入</b>，选你下载的卡。<br>如果你只拿到了<b>一张图片</b>——那它就是角色卡哦 www，设定是藏在图片里的。直接导入那张图就行，不过要<b>原图</b>：聊天软件转发过的图片会被压缩，里面的设定就没了。<br>也可能是 JSON 文件，一样点导入。');
    wizOpts([['导入好了', wizCardAfter, 1], ['我没有卡', () => { wizSay('去社区的<b>角色卡分区</b>下载，比如类脑的角色卡区。下回来是一张图片或一个 JSON 文件，直接导入。'); wizOpts([['导入好了', wizCardAfter, 1], ['先跳过', wizRegex]]); }], ['跳过', wizRegex]]);
    poll(() => (ctx().characters?.length || 0) > n0, () => { wizSay('看到新卡了。'); wizCardAfter(); });
}

function wizCardAfter() {
    stopPoll(); guide(null);
    wizSay('导入时酒馆可能会问两件事：<br>· <b>要不要导入卡内世界书</b>：选要，那是卡作者写的设定。<b>多人卡</b>的各个角色就写在这本世界书里，不导入的话卡里就没人了。<br>· <b>要不要启用卡内正则</b>：一般选要，那是状态栏和美化。卡内正则是局部正则，只在这张卡里生效。<br>然后在角色列表里点这张卡就能开始聊。第一条消息是开场白，很多卡有好几个开场白，在第一条消息上<b>左右翻</b>就能换。');
    wizOpts([['懂了，下一步：正则', wizRegex, 1]]);
}

function regexCount() {
    const c = ctx();
    return (c.extensionSettings.regex || []).length + (c.characters?.[c.characterId]?.data?.extensions?.regex_scripts || []).length + $$('#saved_preset_scripts .regex-script-label').length;
}

async function wizRegex() {
    stopPoll();
    openDrawer('#extensions-settings-button');
    await sleep(400);
    const d = openInline(/正则|regex/i);
    await sleep(350);
    guide(q1('#import_regex') || d?.querySelector('[id*="import"]') || d?.querySelector('.inline-drawer-header'));
    const n0 = regexCount();
    wizSay('正则在“扩展”里的“正则”面板，一共分三种，导入时选放到哪一种：<br>· <b>全局正则</b>：所有卡都生效。<br>· <b>预设正则</b>：跟着预设走，用这个预设时才生效，换了预设就不生效。一般导入预设时选“导入附带的正则”就进来了。<br>· <b>局部正则</b>：就是角色的正则，跟着角色卡走，只在当前这张卡里生效。卡自带的正则导入卡时就在这里，不用另外导。<br>预设正则和局部正则上面各有一个<b>允许</b>开关，关着的话里面的正则全部不生效。<br>点红框里的“导入”，选正则文件。拿不准就问发正则的人：只给这张卡用的选局部，配合预设用的选预设，哪张卡都要用的才选全局。');
    wizOpts([['导入好了', wizScript, 1], ['跳过', wizScript]]);
    poll(() => regexCount() > n0, () => { wizSay('看到新正则了。'); wizScript(); });
}

async function wizScript() {
    stopPoll();
    openDrawer('#extensions-settings-button');
    await sleep(400);
    const d = openInline(/酒馆助手|tavern ?helper|slash ?runner/i);
    if (!d) {
        guide(null);
        wizSay('没找到酒馆助手。脚本要先装“酒馆助手”扩展：去社区扩展区找到它的地址，在扩展面板点“安装扩展程序”装上。装好后再来一次就行。');
        wizOpts([['看安装扩展的图文教程', () => openGuide('ext'), 1], ['知道了', wizAfterScript]]); return;
    }
    await sleep(500);
    const lib = $$('*', d).find((e) => !e.children.length && /^脚本库$/.test(e.textContent.trim()));
    if (lib) { realClick(lib.closest('button, a, [role="tab"], .menu_button, div') || lib); await sleep(400); }
    const imp = $$('button, .menu_button, [title], i', d).find((e) => /导入|import/i.test(e.getAttribute('title') || '') || /^导入$/.test(e.textContent.trim()) || e.classList.contains('fa-file-import'));
    guide(imp || lib || d.querySelector('.inline-drawer-header'));
    wizSay('脚本在“扩展”里的“酒馆助手”，打开“脚本库”。点“导入”选脚本的 JSON 文件，导入后<b>记得打开它的开关</b>。全局脚本所有卡都能用，角色脚本只跟着这张卡走。');
    wizOpts([['导入好了', wizAfterScript, 1], ['跳过', wizAfterScript]]);
}

function wizAfterScript() {
    guide(null);
    wizSay('基础的都配好了。还想学别的吗？世界书、预设开关、备份这些，我都能边框边带你做。');
    wizOpts([['学一下', wizMore, 1], ['不用了', wizEnd]]);
}

async function wizTeach(k) {
    stopPoll();
    const back = () => wizOpts([['还想学别的', wizMore, 1], ['结束', wizEnd]]);
    if (k === 'persona') {
        openDrawer('#persona-management-button'); await sleep(400);
        guide(q1('#create_dummy_persona') || q1('#persona-management-button > .drawer-toggle'));
        wizSay('<b>user 设定</b>就是你自己的人设。点“新建”，写名字、身份、外貌、和角色的关系，几句话就够。不写的话 AI 只知道你叫 User，也可能替你乱编。<br>可以建好几个，换卡时换着用。<br>写设定的小技巧：可以用 <b>XML 标签</b>把一段设定包起来，比如 &lt;角色名&gt;…&lt;/角色名&gt;，AI 更容易分清哪段是谁；<b>别滥用 Markdown</b>，满篇 # 标题、**加粗**、列表，AI 回复也会跟着冒出标题和列表，像说明书，还多花 token。<br>比如：&lt;user设定&gt;名字：夏夏。大学生，和{{char}}是青梅竹马。&lt;/user设定&gt;');
    } else if (k === 'send') {
        guide(q1('#send_textarea'));
        wizSay('在输入框写你要说的话或要做的事，点发送。习惯写法：<br>· 动作用星号：*推开门走进去*<br>· 说话用引号：“你好。”<br>写得越具体，AI 接得越好。只想推进剧情，也可以写一句旁白让它接。');
    } else if (k === 'swipe') {
        const last = $$('#chat .mes[is_user="false"]').pop();
        guide(last?.querySelector('.swipe_right') || last || q1('#chat'));
        wizSay('· <b>抽卡</b>：不满意就在最后一条 AI 回复上往右翻，重新生成一条，旧的还在，往左能翻回来。<br>· <b>改楼</b>：点消息上的小铅笔直接改内容，AI 之后按改过的接着写。<br>· <b>删楼</b>：三条杠里选“删除消息”，勾要删的那几条。');
    } else if (k === 'pencil') {
        const last = $$('#chat .mes[is_user="false"]').pop() || $$('#chat .mes').pop();
        const pen = last?.querySelector('.mes_edit');
        guide(pen || last || q1('#chat'));
        wizSay('<b>小铅笔</b>是改消息用的，圈里叫“改楼”。<br>1. 点消息右上角的小铅笔（有的美化收在“…”里），消息变成可以打字的框。<br>2. 直接改文字：删掉 AI 抢你说的话、修错别字、把跑偏的地方改回来都行。<br>3. 改完点 <b>✓</b> 保存，点 <b>✕</b> 放弃。<br>编辑时还有几个小按钮：上下箭头是把这条往上或往下挪，两张纸是复制，垃圾桶是删掉这一条。<br>改过之后，AI 会以为它本来就是这么写的，后面顺着改过的接，所以改楼比重新抽卡更能“掰回剧情”。<br>另外，预设条目旁边也有小铅笔，那个是改这条预设的内容、身份和插入位置；预设下拉框旁边的小铅笔是给预设改名。');
        wizOpts([['帮我打开最后一条的编辑', () => { if (pen) realClick(pen); wizSay(pen ? '打开了，改完记得点 ✓。' : '没找到可以编辑的消息，先聊两句再来。'); back(); }, 1], ['还想学别的', wizMore], ['结束', wizEnd]]);
        return;
    } else if (k === 'summary') {
        guide(q1('#send_textarea'));
        const n = ctx().chat?.length || 0;
        wizSay(`<b>大总结</b>：聊到几百楼，AI 开始失忆、回复变慢变贵的时候做一次。思路是把前面的剧情压成一段要点存起来，再把旧楼层隐藏掉，不删，只是不再发给 AI。<br>1. <b>让 AI 写总结</b>：发一句场外指令，我可以帮你填进输入框。<br>2. <b>检查并修改</b>：看总结有没有漏掉重要的人物关系和伏笔，不对就用小铅笔改。<br>3. <b>存起来</b>：复制总结，去世界书新建一条<b>蓝灯</b>条目，位置选“角色定义之后”，把总结贴进去。<br>4. <b>隐藏旧楼</b>：把已经总结过的楼层隐藏，比如输入 <code>/hide 0-200</code> 就是隐藏 0 到 200 楼。我也可以帮你隐藏。<br>5. 再聊几句，看 AI 还记不记得前面的事。<br>现在这个聊天一共 ${n} 楼。以后剧情又长了，就再做一次，把新总结追加到同一个条目里。`);
        wizOpts([
            ['帮我填总结指令', () => {
                const ta = q1('#send_textarea');
                if (ta) { ta.value = '（场外：暂停剧情，不要续写正文。请把到目前为止的剧情总结成要点：1. 主要人物和他们现在的关系；2. 按时间顺序的关键事件；3. 还没解决的伏笔和约定；4. 当前所在的地点和状态。只写总结。）'; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); }
                wizSay('填好了，检查一下就可以发送。AI 写完后，复制它的总结去世界书。');
                wizOpts([['带我去世界书', async () => { openDrawer('#WI-SP-button'); await sleep(400); guide(q1('#world_popup_new') || q1('#WI-SP-button > .drawer-toggle')); wizSay('选你这张卡绑定的世界书（没有就新建一本），点“新建条目”，状态选蓝灯，位置选“角色定义之后”，把总结贴进内容里。'); back(); }, 1], ['帮我隐藏旧楼', hideFlow], ['还想学别的', wizMore]]);
            }, 1],
            ['帮我隐藏旧楼', hideFlow],
            ['还想学别的', wizMore],
        ]);
        return;
    } else if (k === 'continue') {
        guide(q1('#options_button'));
        wizSay('三条杠菜单里：<br>· <b>继续</b>：回复写到一半断了（截断），点它让 AI 接着写。<br>· <b>重新生成</b>：整条重写，和抽卡一样。<br>· <b>开始新聊天</b>：同一张卡从头开，旧的聊天还在。<br>· <b>管理聊天文件</b>：翻以前的聊天记录。修正机的快捷台也能切换和改名。');
    } else if (k === 'wb') {
        openDrawer('#WI-SP-button'); await sleep(400);
        guide(q1('#WI-SP-button > .drawer-toggle'));
        wizSay('<b>世界书</b>是角色卡之外的设定库。卡自带的世界书导入时会一起装好，一般不用管。<br>条目分<b>蓝灯</b>（每次都发）和<b>绿灯</b>（聊到关键词才发）。想给 AI 补设定，就在这里加条目。');
    } else if (k === 'ctx') {
        openDrawer('#ai-config-button'); await sleep(400);
        guide(q1('#openai_max_context')?.closest('.range-block') || q1('#ai-config-button > .drawer-toggle'));
        wizSay('聊久了 AI <b>失忆</b>，是因为旧消息超过上下文长度被裁掉了。办法：<br>· 重要设定写进世界书，世界书不会被裁；<br>· 做一次<b>大总结</b>：把前文压成要点存进世界书，再隐藏旧楼（“常用操作”里有教）；<br>· 上下文长度别超过模型上限，超了会报错（爆上下文）。');
    } else if (k === 'cardupdate') {
        if (curChar()) { openDrawer('#rightNavHolder'); await sleep(450); }
        const dd = q1('#char-management-dropdown');
        guide(dd ? s2(dd) : null);
        wizSay('<b>更新角色卡</b>（作者发了新版本），先做一件事：<b>把原本的世界书重命名或删掉</b>。酒馆发现有同名的世界书，就不会更新它，新版的设定就进不来。<br>然后三种办法任选一种：<br>1. <b>角色卡界面 → 更多 → 更新</b>（红框就是“更多”下拉框），选新版的卡文件。<br>2. <b>直接导入新卡</b>：会多出一张同名的新卡。再在新卡里用“导入存档”把旧的聊天记录导进来。<br>3. <b>酒馆助手 → 脚本库 → 内置脚本 →“更新角色卡时更新世界书”</b>：开了以后更新卡会顺便覆盖世界书。<b>一旦覆盖就找不回旧版</b>，自己改过世界书的，务必先备份。');
        wizOpts([['带我去改世界书名字', async () => {
            openDrawer('#WI-SP-button'); await sleep(450);
            guide(q1('#world_popup_name_button') || s2('#world_editor_select'));
            wizSay('在下拉框里选这张卡原本的世界书，点红框里的<b>重命名</b>，随便加个“旧版”之类的后缀就行。想直接删掉，就点旁边的垃圾桶。改完回来更新卡。');
            wizOpts([['改好了，接着更新', () => wizTeach('cardupdate'), 1], ['还想学别的', wizMore]]);
        }, 1], ['我先备份一下', () => runFlow('backup')], ['还想学别的', wizMore], ['结束', wizEnd]]);
        return;
    } else if (k === 'theme') {
        openDrawer('#user-settings-button'); await sleep(400);
        guide(q1('#ui_preset_import_button') || q1('#themes') || q1('#user-settings-button > .drawer-toggle'));
        wizSay('<b>美化</b>在“用户设置”里。别人分享的主题是一个 JSON，点主题旁边的导入按钮装进来，再在下拉框里选中。美化只管好不好看，不影响 AI 写什么。');
    }
    back();
}

function hideFlow() {
    const n = ctx().chat?.length || 0;
    if (n < 4) { wizSay('楼层还太少，不用隐藏。'); return wizOpts([['还想学别的', wizMore, 1], ['结束', wizEnd]]); }
    const def = Math.max(1, n - 20);
    wizSay(`要隐藏到第几楼？建议留最近二三十楼不隐藏，让 AI 接得上。现在一共 ${n} 楼（从 0 开始数）。<div class="lf-wform"><input class="text_pole" id="lf_hideto" type="number" min="0" max="${n - 1}" value="${def - 1}" placeholder="隐藏 0 到第几楼"></div>`);
    wizOpts([['隐藏', async () => {
        const to = Math.floor(Number(document.getElementById('lf_hideto')?.value));
        if (!(to >= 0 && to < n)) { wizSay('楼层数不对，再填一次。'); return hideFlow(); }
        const run = ctx().executeSlashCommandsWithOptions || ctx().executeSlashCommands;
        if (!run) { wizSay(`这个酒馆版本不能替你执行，在输入框发送 <code>/hide 0-${to}</code> 就行。`); return; }
        await run(`/hide 0-${to}`);
        wizSay(`隐藏好了：0 到 ${to} 楼不会再发给 AI，消息还在，随时能用 <code>/unhide 0-${to}</code> 恢复。消息上的眼睛图标也能单条开关。`);
        wizOpts([['还想学别的', wizMore, 1], ['结束', wizEnd]]);
    }, 1], ['算了', wizMore]]);
}

/* ---------------- 小助手带你做：分步教程 ---------------- */

const lastAi = () => $$('#chat .mes[is_user="false"]:not([is_system="true"])').pop() || null;
const curChar = () => { const c = ctx(); return c.characterId !== undefined && c.characterId !== null ? c.characters?.[c.characterId] : null; };
const visible = (el) => !!el && el.offsetParent !== null;
const wiEntries = () => $$('#world_popup_entries_list .world_entry');
const newestEntry = () => {
    const list = wiEntries();
    if (!list.length) return null;
    return list.slice().sort((a, b) => Number(b.getAttribute('uid') || 0) - Number(a.getAttribute('uid') || 0))[0];
};
const s2 = (sel) => { const el = typeof sel === 'string' ? q1(sel) : sel; if (!el) return null; const n = el.nextElementSibling; return n && n.classList?.contains('select2') ? n : el; };
const editorBook = () => q1('#world_editor_select')?.selectedOptions?.[0]?.textContent?.trim() || '';
const toggleState = () => $$('#completion_prompt_manager_list .prompt-manager-toggle-action').map((e) => e.className).join('|');
function expandEntry(entry) {
    if (!entry) return;
    const c = entry.querySelector('.inline-drawer-content');
    if (c && getComputedStyle(c).display === 'none') realClick(entry.querySelector('.inline-drawer-toggle'));
}
function allowToggle(id) {
    const box = q1('#' + id);
    return { on: !!box?.checked, label: box?.closest('label') || box };
}
function closeDrawers() {
    $$('.drawer-content.openDrawer').forEach((c) => {
        if (c.classList.contains('pinnedOpen')) return;
        const t = c.closest('.drawer')?.querySelector(':scope > .drawer-toggle');
        if (t) realClick(t);
    });
}
async function openRegexPanel() { openDrawer('#extensions-settings-button'); await sleep(400); openInline(/正则|regex/i); await sleep(350); }

// 每一步：say 说明，prep 准备界面，target 要框的元素，base+wait 自动检测完成，extra 额外按钮，guard 前置条件
const FLOWS = {
    worldbook: {
        title: '做一本世界书',
        steps: [
            {
                prep: async () => { openDrawer('#WI-SP-button'); await sleep(450); },
                target: () => q1('#world_create_button'),
                say: '世界书是角色卡之外的<b>设定库</b>：地点、人物、规矩都能写进去，聊到相关的词时自动发给 AI。<br>先新建一本：点红框里的<b>新建世界书</b>，起个名字。已经有想用的，就在旁边下拉框里选它，再点“下一步”。',
                base: () => q1('#world_editor_select')?.options.length || 0,
                wait: (b) => (q1('#world_editor_select')?.options.length || 0) > b,
                ok: '新建好了。',
            },
            {
                target: () => q1('#world_popup_new'),
                say: () => `现在编辑的是「${esc(editorBook() || '这本世界书')}」。点红框里的<b>新建条目</b>。`,
                base: () => wiEntries().length,
                wait: (b) => wiEntries().length > b,
                ok: '多了一条。',
            },
            {
                prep: async () => { expandEntry(newestEntry()); await sleep(300); },
                target: () => newestEntry()?.querySelector('textarea[name="comment"]') || newestEntry(),
                say: '每个条目就是<b>一小段设定</b>。<br>· <b>标题</b>（红框）只给你自己看，方便以后找。<br>· 下面的<b>内容</b>写设定本身，一条只写一件事：一个地点、一个人物、一条规矩，写短一点更好用。',
            },
            {
                target: () => s2(newestEntry()?.querySelector('select[name="key"], textarea[name="key"]')) || newestEntry(),
                say: '<b>关键词</b>：聊天里出现这些词，这条才会发给 AI。把这条设定最可能被提到的词都写上：名字、别名、简称，每个词之间按回车。',
            },
            {
                target: () => newestEntry()?.querySelector('select[name="entryStateSelector"]'),
                say: '<b>灯</b>（红框）：<br>· <b>蓝灯</b>：常驻，每次都发。适合世界观核心、大总结。<br>· <b>绿灯</b>：出现关键词才发。适合地点、人物、物品，省 token。<br>拿不准就用绿灯。',
            },
            {
                target: () => newestEntry()?.querySelector('select[name="position"]'),
                say: '<b>位置</b>：这条插在哪。<br>· <b>角色定义之前</b>：当背景资料，最常用。<br>· <b>角色定义之后</b>：当角色的补充。<br>· <b>@D</b>：按深度插进聊天里，数字越小越靠近最新消息、影响越强，状态栏规则常放 D1。',
            },
            {
                target: () => newestEntry()?.querySelector('input[name="order"]'),
                say: '<b>顺序</b>：好几条一起触发时，数字越大越靠后、越靠近聊天，影响越强。新手保持默认就行。<br>条目里还有“不可递归”之类的选项，勾上可以防止这条被别的条目连锁触发，先不用管。',
            },
            {
                target: () => s2('#world_info'),
                say: () => `最后一步：世界书要<b>挂上</b>才会生效，有两种挂法：<br>· <b>挂到当前这张卡</b>：只有这张卡用。<br>· <b>全局开</b>：在红框“激活的世界书”里选上「${esc(editorBook())}」，所有卡都会用。`,
                extra: [['挂到当前这张卡', async (next) => {
                    if (!curChar()) { wizSay('先在角色列表里选一张卡，再来挂。'); return; }
                    openDrawer('#rightNavHolder'); await sleep(450);
                    guide(q1('#world_button'));
                    const book = editorBook();
                    wizSay(`点红框里的<b>地球图标</b>，在弹出的窗口里把“主要世界书”选成「${esc(book)}」。<br>（点一下地球如果直接打开了世界书，就长按它，或者按住 Shift 再点）`);
                    poll(() => (curChar()?.data?.extensions?.world || '') === book && !!book, () => { wizSay('挂好了。'); next(); });
                }]],
            },
            {
                target: () => null,
                say: '做好了。检查方法：聊几句、提到这条的关键词，然后用“看 AI 收到了什么”那一课，看世界书有没有被发出去。',
                next: '学完了',
            },
        ],
    },
    preset: {
        title: '预设条目开关',
        guard: () => (ctx().mainApi && ctx().mainApi !== 'openai' ? '这一课要用聊天补全模式。先在 API 连接里把接口改成“聊天补全”。' : ''),
        steps: [
            {
                prep: async () => { openDrawer('#ai-config-button'); await sleep(450); q1('#completion_prompt_manager_list')?.scrollIntoView({ block: 'center' }); await sleep(300); },
                target: () => q1('#completion_prompt_manager_list .prompt-manager-toggle-action'),
                say: '下面这一长串就是<b>预设条目</b>，从上到下按顺序拼成发给 AI 的内容。<br>每条右边的<b>开关</b>（红框）决定这条发不发。预设作者说“开某条”“关某条”，就是拨这个。试着拨一下。',
                base: toggleState,
                wait: (b) => toggleState() !== b,
                ok: '拨好了。',
            },
            {
                target: () => q1('#completion_prompt_manager_list .prompt-manager-edit-action'),
                say: '<b>小铅笔</b>：改这条的内容，还能改它用什么身份发（系统、用户、AI）和插在哪（相对位置或按深度）。<br>作者写好的条目，没把握就别改。',
            },
            {
                target: () => q1('#completion_prompt_manager_list .drag-handle'),
                say: '左边的<b>拖动手柄</b>：按住上下拖，调整顺序。越靠下离 AI 开口越近，影响越强。',
            },
            {
                target: () => q1('#update_oai_preset'),
                say: '改完一定要点<b>保存预设</b>（红框）。不然换个预设再换回来，改动就没了。',
                next: '学完了',
            },
        ],
    },
    prompt: {
        title: '看 AI 收到了什么',
        guard: () => (lastAi() ? '' : '先聊一句，有了 AI 回复再来。'),
        steps: [
            {
                target: () => { const m = lastAi(); const p = m?.querySelector('.mes_prompt'); return visible(p) ? p : m?.querySelector('.extraMesButtonsHint') || m; },
                say: '每条 AI 回复右上角的<b>“…”</b>里藏着更多按钮，先点开它。',
                wait: () => visible(lastAi()?.querySelector('.mes_prompt')),
                ok: '按钮出来了。',
            },
            {
                target: () => lastAi()?.querySelector('.mes_prompt'),
                say: '点这个<b>提示词</b>按钮（红框），会弹出这次发给 AI 的明细：<br>· 每一块占多少 token：预设、世界书、角色卡、聊天记录；<br>· 点里面的“查看提示词”能看到原文。<br>排查“预设没生效”“世界书没触发”“为什么这么贵”，都看这里。<br>只有这次打开酒馆后生成的回复才有这个按钮，旧消息没有。',
                next: '学完了',
            },
        ],
    },
    regex: {
        title: '正则面板',
        steps: [
            {
                prep: openRegexPanel,
                target: () => q1('#saved_regex_scripts'),
                say: '<b>全局正则</b>：对所有卡都生效。每条右边的开关能单独关掉，铅笔能改。',
            },
            {
                target: () => allowToggle('regex_scoped_toggle').label || q1('#saved_scoped_scripts'),
                say: () => `<b>局部正则</b>：就是角色的正则，跟着角色卡走，只在这张卡里生效。<br>上面有个<b>允许</b>开关（红框）。关着的话，局部正则全部不生效，状态栏不显示、美化失效，常常就是这里没开。<br>现在它是<b>${allowToggle('regex_scoped_toggle').on ? '开着' : '关着'}</b>的。`,
                extra: [['帮我打开允许', async (next) => { if (!allowToggle('regex_scoped_toggle').on) flipAllow('regex_scoped_toggle'); await sleep(300); wizSay(allowToggle('regex_scoped_toggle').on ? '打开了。' : '没打开，手动点一下红框里的开关。'); next(); }]],
            },
            {
                target: () => allowToggle('regex_preset_toggle').label || q1('#saved_preset_scripts'),
                say: () => `<b>预设正则</b>：跟着预设走。预设自带的思维链折叠、格式整理常在这里，同样有个<b>允许</b>开关，现在是<b>${allowToggle('regex_preset_toggle').on ? '开着' : '关着'}</b>的。`,
                extra: [['帮我打开允许', async (next) => { if (!allowToggle('regex_preset_toggle').on) flipAllow('regex_preset_toggle'); await sleep(300); wizSay(allowToggle('regex_preset_toggle').on ? '打开了。' : '没打开，手动点一下红框里的开关。'); next(); }]],
            },
            {
                target: () => null,
                say: '小提示：导入卡时点了“不启用卡内正则”也没关系，打开上面那个局部正则的允许开关就补回来了。',
                next: '学完了',
            },
        ],
    },
    think: {
        title: '思考怎么折叠',
        steps: [
            {
                prep: openRegexPanel,
                target: () => q1('#saved_preset_scripts') || q1('#saved_regex_scripts'),
                say: () => {
                    const c = ctx();
                    const re = /think|思考|思维|cot|reason|草稿/i;
                    const pick = (arr, tag) => (arr || []).filter((r) => re.test(`${r.scriptName} ${r.findRegex}`)).map((r) => `${tag}「${esc(r.scriptName)}」${r.disabled ? '（关着）' : ''}`);
                    const found = [...pick(c.extensionSettings.regex, '全局'), ...pick(curChar()?.data?.extensions?.regex_scripts, '局部'),
                        ...$$('#saved_preset_scripts .regex_script_name').filter((n) => re.test(n.textContent)).map((n) => `预设「${esc(n.textContent.trim())}」`)];
                    const presetOff = !allowToggle('regex_preset_toggle').on;
                    let tail;
                    if (found.length) tail = `我找到这些可能是管思考的正则：<br>${found.join('<br>')}${presetOff ? '<br>不过<b>预设正则的允许开关是关着的</b>，预设附带的那些不会生效。' : ''}`;
                    else tail = '没找到处理思考的正则。预设作者一般会附带一个：导入预设时选“导入附带的正则”，或者去预设的发布帖找正则文件导入。';
                    return '预设里的思维链，是预设让 AI 先写的一段思考，通常包在 &lt;thinking&gt; 之类的标签里。把它<b>折叠或藏起来</b>靠的是<b>正则</b>。<br>' + tail;
                },
                extra: [['打开预设正则的允许', async (next) => { if (!allowToggle('regex_preset_toggle').on) flipAllow('regex_preset_toggle'); await sleep(300); wizSay(allowToggle('regex_preset_toggle').on ? '打开了，抽一条新回复看看。' : '没打开，手动点一下预设正则那里的开关。'); next(); }]],
            },
            {
                target: () => null,
                say: '还是露出来的话，多半是 AI 写的标签和正则对不上（比如正则找 &lt;thinking&gt;，AI 写成了 &lt;think&gt;）。把那条回复和正则发给我，我帮你看。',
                next: '学完了',
            },
        ],
    },
    backup: {
        title: '备份和换设备',
        steps: [
            {
                guard: () => (curChar() ? '' : 'skip'),
                prep: async () => { realClick(q1('#option_select_chat')); await sleep(900); },
                target: () => q1('.exportRawChatButton'),
                say: '<b>导出聊天记录</b>：这是当前角色的聊天列表。每条右边有两个导出按钮：一个导出成可以再导入的文件，一个导出成纯文本。',
            },
            {
                prep: async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(200); if (curChar()) { openDrawer('#rightNavHolder'); await sleep(450); } },
                target: () => (curChar() ? q1('#export_button') : null),
                say: '<b>导出角色卡</b>：角色编辑页里的导出按钮（红框），选 PNG 就是一张完整的卡，可以分享或备份。',
            },
            {
                prep: async () => { openDrawer('#user-settings-button'); await sleep(450); },
                target: () => q1('#account_button'),
                say: '<b>整个备份</b>：用户设置里点<b>账户</b>（红框），在弹出的窗口里点<b>下载备份</b>，会下载一个压缩包，卡、聊天、预设、世界书、设置全在里面。换设备时，把它解压进新酒馆的 data 文件夹。',
                extra: [['帮我打开账户', async (next) => { realClick(q1('#account_button')); await sleep(800); const b = q1('.userBackupButton'); guide(b); wizSay(b ? '红框里就是下载备份。' : '账户窗口打开了，找“下载备份”。'); }]],
            },
            {
                target: () => null,
                say: '电脑上直接复制整个 <code>SillyTavern/data</code> 文件夹也是完整备份。更新酒馆、换手机、重装之前，先备份一次。',
                next: '学完了',
            },
        ],
    },
    update: {
        title: '更新酒馆和扩展',
        steps: [
            {
                prep: async () => { openDrawer('#extensions-settings-button'); await sleep(450); },
                target: () => q1('#extensions_details'),
                say: '<b>更新扩展</b>：点<b>管理扩展程序</b>（红框），有新版本的扩展旁边会出现更新按钮，点它就行。旁边勾上“在扩展程序更新时通知”，以后有更新会提醒你。',
                extra: [['帮我打开', async () => { realClick(q1('#extensions_details')); await sleep(900); const u = q1('.btn_update'); guide(u); wizSay(u ? '红框里是可以更新的扩展。' : '没看到更新按钮，说明都是最新的。'); }]],
            },
            {
                target: () => null,
                say: '<b>更新酒馆本体</b>：<br>· 电脑（Windows）：关掉酒馆，双击酒馆文件夹里的 <code>UpdateAndStart.bat</code>。<br>· 手机 Termux：先按 Ctrl+C 停掉酒馆，输入 <code>cd SillyTavern && git pull</code>，再输入 <code>bash start.sh</code> 启动。<br>更新前先做一次备份。',
                next: '学完了',
            },
        ],
    },
    profiles: {
        title: '连接配置文件',
        steps: [
            {
                prep: async () => { openDrawer('#sys-settings-button'); await sleep(450); },
                target: () => q1('#connection_profiles'),
                say: '<b>连接配置文件</b>：把一套 API 设置存起来（来源、地址、模型，还能连预设一起），以后在这个下拉框里一键切换。有好几个渠道时特别方便。',
            },
            {
                target: () => q1('#create_connection_profile'),
                say: '先把 API 连好，再点红框里的<b>新建</b>，起个名字，它就记住你现在的设置。',
            },
            {
                target: () => q1('#update_connection_profile'),
                say: '改了设置想覆盖原来那套，点<b>保存</b>图标；不要了就点垃圾桶。',
                next: '学完了',
            },
        ],
    },
    qr: {
        title: '快速回复',
        steps: [
            {
                prep: async () => { openDrawer('#extensions-settings-button'); await sleep(450); openInline(/快速回复|quick ?reply/i); await sleep(400); },
                target: () => q1('#qr--set-import'),
                say: '<b>快速回复</b>就是输入框上方那排按钮，点一下发一段写好的话或命令。别人分享的快速回复是个 JSON，点红框里的导入。',
            },
            {
                target: () => null,
                say: '导入后，在上面的“全局快速回复集”或“聊天快速回复集”里把它加上，按钮才会出现在输入框上方。',
                next: '学完了',
            },
        ],
    },
    ask: {
        title: '怎么去答疑提问',
        steps: [
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => null,
                say: '在「新手答疑」提问，别人最需要三样东西：<br>1. <b>提问模板</b>：版本、设备、渠道和模型、预设、卡、报错原文，我能帮你自动填好。<br>2. <b>截图</b>：接下来我一块一块框给你看，该截哪里。<br>3. <b>你已经试过什么</b>：省得别人让你再试一遍。<br>不用每张都截，看你的问题挑着截。截图用手机或电脑自带的截图，别对着屏幕拍照。',
                extra: [['去答疑提问', async () => { closeWizard(); openAskDesk(); }], ['帮我复制提问模板', async () => { const ok = await copyText(askTemplate()); wizSay(ok ? '复制好了，先存到备忘录里，截完图一起发。' : '复制失败了，在小助手里点“复制提问模板”。'); }]],
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => q1('#toast-container .toast-error') || q1('#toast-container .toast') || null,
                say: () => {
                    const last = recentErrs.slice(-1)[0]?.replace(/^\[[^\]]+\]\s*/, '') || '';
                    return '<b>① 报错</b>：最重要的一张。红色弹窗几秒就消失，来不及截就算了，<b>把报错文字复制下来</b>比截图更好用。'
                        + (last ? `<br>我帮你记着最近一条：<br><code>${esc(snip(last, 160))}</code>` : '<br>我这次还没记到报错。等它再报一次，或者点修正机的报错气泡，里面有原文。');
                },
                extra: [['复制报错原文', async () => {
                    const t = recentErrs.slice(-3).map((x) => x.replace(/^\[[^\]]+\]\s*/, '')).join('\n');
                    if (!t) { wizSay('还没有记到报错。'); return; }
                    wizSay((await copyText(t)) ? '复制好了。' : '复制失败了，照着上面的字抄一下也行。');
                }]],
            },
            {
                prep: async () => { closeDrawers(); openDrawer('#sys-settings-button'); await sleep(450); },
                target: () => q1('#chat_completion_source') || q1('#main_api') || q1('#sys-settings-button > .drawer-toggle'),
                say: '<b>② API 连接</b>：连不上、报 401 / 403 / 404、没反应的时候截这里。<br>截<b>接口类型、来源、模型、连接状态</b>这一片（从红框往下到“连接”按钮）。<br><b>密钥一定要遮住。中转地址不要遮</b>：答疑的人要看地址对不对，比如结尾少了 /v1、填成了网页地址、用的哪家中转。',
            },
            {
                prep: async () => { closeDrawers(); openDrawer('#ai-config-button'); await sleep(450); },
                target: () => q1('#settings_preset_openai') || q1('#ai-config-button > .drawer-toggle'),
                say: '<b>③ 预设</b>：回复被截断、空回、400、文风不对的时候截这里。<br>截<b>预设名</b>（红框），再往下滑截<b>上下文长度、回复长度、流式传输</b>那几项。<br>怀疑条目打架，就把下面的<b>条目列表</b>（开关那一串）也截一张。',
            },
            {
                prep: async () => { closeDrawers(); await sleep(250); },
                target: () => lastAi() || q1('#chat'),
                say: '<b>④ 出问题的那条消息</b>：抢话、复读、露代码、状态栏不显示、格式乱，都截这里。<br>截<b>完整的一条</b>，最好连你发的上一条一起截，别人才知道 AI 是在回什么。太长就分两张，或者用长截图。<br>聊天里有私密或成人内容的，按频道规矩打码。',
            },
            {
                target: () => { const m = lastAi(); const p = m?.querySelector('.mes_prompt'); return visible(p) ? p : m?.querySelector('.extraMesButtonsHint') || m; },
                say: '<b>⑤ AI 收到了什么</b>：世界书没触发、预设没生效、为什么这么贵，截这个最管用。<br>点这条回复右上角的“…”，再点<b>提示词</b>按钮，截弹出来的明细（每一块占多少 token）。<br>只有这次打开酒馆后生成的回复才有这个按钮。',
                extra: [['带我找这个按钮', async () => { wizSay('好，换到“看 AI 收到了什么”那一课，学完再回来。'); await sleep(300); runFlow('prompt'); }]],
            },
            {
                prep: async () => { closeDrawers(); await openRegexPanel(); },
                target: () => allowToggle('regex_scoped_toggle').label || q1('#saved_scoped_scripts') || q1('#saved_regex_scripts'),
                say: '<b>⑥ 正则和扩展</b>：状态栏、美化、思考折叠出问题时截这里。<br>截正则面板，要看得到<b>全局、预设、局部</b>三栏和两个<b>允许</b>开关。爆代码的话，再截一张扩展面板，让别人看你装了哪些扩展。',
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => null,
                say: '<b>发之前检查一遍：</b><br>· 遮住：密钥、你的真名和联系方式。<br>· <b>中转地址别遮</b>，答疑的人要看。<br>· 别发：整个设置文件、备份压缩包，里面可能带密钥。<br>· 一个帖子只问一个问题，<b>模板 + 截图 + 已经试过</b>一起发。<br>· 有人回了，照着试完回一句“好了”或者“还是不行，现在是……”，别人才好接着帮你。<br>先看「新手入门」，问完还不会就去「新手开帖」。',
                extra: [['去答疑提问', async () => { closeWizard(); openAskDesk(); }], ['复制模板并去答疑', async () => {
                    const ok = await copyText(askTemplate());
                    const j = ok && openDesk();
                    wizSay(ok ? (j ? '复制好了，已经帮你打开「新手答疑」。' : '复制好了，去「新手答疑」粘贴。（修正机设置里填上频道链接，下次会直接跳过去）') : '复制失败了，在小助手里点“复制提问模板”。');
                }]],
                next: '学完了',
            },
        ],
    },

    summary: {
        title: '做一次大总结',
        guard: () => (curChar() ? '' : '先选一张卡、进到要总结的聊天里，再来。'),
        steps: [
            {
                prep: async () => { closeDrawers(); await countChatTokens(); },
                target: () => null,
                say: () => {
                    const t = chatTok;
                    return `现在这个聊天一共 ${t.total} 楼，已经隐藏 ${t.hidden} 楼，发给 AI 的聊天记录${t.est ? '大约' : ''} <b>${fmtTok(t.n)}</b> token。<br>`
                        + '<b>超过 10 万就该做一次大总结</b>：太长了 AI 会开始失忆、复读，回复也变慢变贵。<br>'
                        + '大总结就是：让 AI 把前面的剧情压成要点 → 存进世界书（蓝灯，每次都发）→ 把旧楼隐藏起来。隐藏不是删除，消息还在，只是不再发给 AI。';
                },
            },
            {
                prep: async () => { closeDrawers(); openDrawer('#ai-config-button'); await sleep(450); const r = sumEntryRow(); r?.scrollIntoView({ block: 'center' }); await sleep(250); },
                target: () => sumEntryRow(),
                say: () => {
                    const r = sumEntryRow();
                    if (!r) return '你的预设里<b>没有大总结条目</b>，没关系，下一步我给你一段总结指令，直接发就行。';
                    const name = r.querySelector('.completion_prompt_manager_prompt_name')?.textContent?.trim() || '大总结';
                    return `你的预设自带「${esc(name)}」条目（红框）。很多预设的大总结条目平时是关着的，<b>做总结时打开，做完记得关掉</b>，不然每条回复都会写总结。<br>现在它是<b>${sumEntryOn() ? '开着' : '关着'}</b>的。`;
                },
                extra: [['帮我打开它', async () => {
                    const r = sumEntryRow();
                    if (!r) { wizSay('没找到大总结条目，跳过这步就行。'); return; }
                    if (!sumEntryOn()) { realClick(r.querySelector('.prompt-manager-toggle-action')); sumOpened = r.getAttribute('data-pm-identifier'); await sleep(300); }
                    wizSay(sumEntryOn() ? '打开了。做完总结我会提醒你关掉。' : '没打开，手动点一下红框里的开关。');
                }]],
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => q1('#send_textarea'),
                say: '<b>让 AI 写总结</b>：点“帮我填总结指令”，我把指令填进输入框，你看一眼再发送。<br>指令会要 AI 暂停剧情，按<b>人物关系、时间线、伏笔、当前状态、状态栏数值</b>来写。数值这一条很重要，不然总结完好感度之类的就丢了。',
                extra: [['帮我填总结指令', async () => {
                    const ta = q1('#send_textarea');
                    if (!ta) { wizSay('没找到输入框。'); return; }
                    ta.value = SUM_PROMPT; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
                    sumAskAt = ctx().chat?.length || 0;
                    wizSay('填好了，检查一下就点发送。AI 写完再点“下一步”。');
                }]],
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => lastAi() || q1('#chat'),
                say: '<b>检查总结</b>：看看人物关系、伏笔有没有漏，数值对不对。不对就点小铅笔直接改；漏得太多就抽卡重写一条。<br>改满意了再点“下一步”。',
            },
            {
                target: () => null,
                say: () => `<b>存进世界书</b>：点“帮我存进世界书”，我把最后一条 AI 回复（去掉思考过程）存进<b>这个聊天专用的世界书</b>，设成<b>蓝灯</b>、<b>角色定义之后</b>。只在这个聊天里生效，不会影响这张卡的别的聊天。${ctx().chatMetadata?.world_info ? `<br>这个聊天已经绑了「${esc(ctx().chatMetadata.world_info)}」，会存进这一本。` : ''}<br>想自己存也行：世界书里新建条目，状态选蓝灯，位置选“角色定义之后”，标题写“大总结 第几次”。`,
                extra: [['帮我存进世界书', async () => {
                    try {
                        const r = await saveSummaryToWB();
                        wizSay(`存好了：「${esc(r.book)}」里的「${esc(r.title)}」，蓝灯、角色定义之后。`);
                    } catch (err) { wizSay('没存成：' + esc(err?.message || err) + '<br>手动存一下：复制那条总结，去世界书新建一条蓝灯条目。'); }
                }], ['带我手动存', async () => { openDrawer('#WI-SP-button'); await sleep(450); guide(q1('#world_popup_new') || q1('#WI-SP-button > .drawer-toggle')); wizSay('选这个聊天要用的世界书，点“新建条目”，状态选蓝灯，位置选“角色定义之后”，把总结贴进内容。存好回来点“下一步”。'); }]],
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => lastAi() || q1('#chat'),
                say: '<b>删掉这两楼</b>：总结已经在世界书里了，聊天里“要求总结”和“AI 写的总结”这两楼就不用留了，删掉，免得同样的内容发给 AI 两遍。',
                extra: [['帮我删掉这两楼', async () => {
                    const c = ctx(); const ch = c.chat || []; const n = ch.length;
                    const okPair = n >= 2 && !ch[n - 1].is_user && ch[n - 2].is_user && /总结|Request/i.test(ch[n - 2].mes || '');
                    if (!okPair) { wizSay('最后两楼看起来不是“要求总结 + 总结”，我不敢乱删。手动删：三条杠里选“删除消息”，勾那两条。'); return; }
                    const run = c.executeSlashCommandsWithOptions || c.executeSlashCommands;
                    if (!run) { wizSay('这个酒馆版本不能替你执行，在输入框发送 <code>/del 2</code> 就行。'); return; }
                    await run('/del 2');
                    wizSay('删好了。');
                }]],
            },
            {
                prep: async () => { closeDrawers(); await sleep(200); },
                target: () => q1('#send_textarea'),
                say: () => {
                    const n = ctx().chat?.length || 0;
                    const def = Math.max(0, n - 11);
                    return `<b>隐藏旧楼</b>：把已经总结过的楼层藏起来，<b>留最近 10 楼左右</b>不隐藏，AI 才接得上刚才的对话。现在一共 ${n} 楼（从 0 开始数）。<div class="lf-wform"><input class="text_pole" id="lf_sumhide" type="number" min="0" max="${Math.max(0, n - 1)}" value="${def}" placeholder="隐藏 0 到第几楼"></div>以后想恢复，发送 <code>/unhide 0-楼层</code>，或者点消息上的眼睛图标。`;
                },
                extra: [['隐藏', async () => {
                    const n = ctx().chat?.length || 0;
                    const to = Math.floor(Number(document.getElementById('lf_sumhide')?.value));
                    if (!(to >= 0 && to < n)) { wizSay('楼层数不对，改一下再点。'); return; }
                    const run = ctx().executeSlashCommandsWithOptions || ctx().executeSlashCommands;
                    if (!run) { wizSay(`这个酒馆版本不能替你执行，在输入框发送 <code>/hide 0-${to}</code> 就行。`); return; }
                    await run(`/hide 0-${to}`);
                    await countChatTokens();
                    wizSay(`隐藏好了：0 到 ${to} 楼不再发给 AI。现在发给 AI 的聊天记录${chatTok.est ? '大约' : ''} ${fmtTok(chatTok.n)} token。`);
                }]],
            },
            {
                target: () => (sumOpened && sumEntryOn() ? sumEntryRow() : null),
                prep: async () => { if (sumOpened && sumEntryOn()) { openDrawer('#ai-config-button'); await sleep(450); sumEntryRow()?.scrollIntoView({ block: 'center' }); } else closeDrawers(); },
                say: () => (sumOpened && sumEntryOn() ? '<b>最后：把预设里的大总结条目关掉</b>（红框），不然之后每条回复都会写总结。' : '<b>做完了。</b>')
                    + '<br>以后每涨到 10 万 token 左右再做一次：新建一条接着存，比如“大总结 第二次”。很老的总结可以把位置改成 @D8 这样更深的地方，让 AI 更专心看最近的剧情。<br>嫌手动麻烦，也有自动的办法：有的预设自带“小总结”（每条回复后附一段摘要），社区扩展区也有自动总结、记忆表格之类的插件。',
                extra: [['帮我关掉大总结条目', async () => {
                    if (sumOpened && sumEntryOn()) { realClick(sumEntryRow()?.querySelector('.prompt-manager-toggle-action')); await sleep(300); }
                    wizSay(sumEntryOn() ? '没关掉，手动点一下红框里的开关。' : '关好了。'); sumOpened = '';
                }]],
                next: '学完了',
            },
        ],
    },
    card: {
        title: '编辑角色卡',
        guard: () => (curChar() ? '' : '先在角色列表里点一张卡，再来学。'),
        steps: [
            { prep: async () => { openDrawer('#rightNavHolder'); await sleep(450); }, target: () => q1('#description_textarea'), say: '<b>描述</b>：角色的核心设定，改完自动保存。<br>写设定的小技巧：可以用 <b>XML 标签</b>把一段设定包起来，比如 &lt;角色名&gt;…&lt;/角色名&gt;，AI 更容易分清哪段是谁；<b>别滥用 Markdown</b>，满篇 # 标题、**加粗**、列表，AI 回复也会跟着冒出标题和列表，像说明书，还多花 token。' },
            { target: () => q1('#firstmessage_textarea'), say: '<b>开场白</b>：每个新聊天的第一条消息。' },
            { target: () => q1('.open_alternate_greetings'), say: '<b>备用开场白</b>：可以写好几个开局，聊天时在第一条消息上左右翻切换。' },
            { target: () => q1('#world_button'), say: '<b>地球图标</b>：这张卡绑定的世界书，点开能看、能换。' },
            { target: () => q1('#export_button'), say: '<b>导出</b>：存成 PNG 分享或备份。想换头像，点一下头像就能换。', next: '学完了' },
        ],
    },
};

async function runFlow(name, i = 0) {
    const flow = FLOWS[name];
    stopPoll();
    if (i === 0 && flow.guard) { const g = flow.guard(); if (g) { guide(null); wizSay(g); return wizOpts([['学别的', wizMore, 1], ['结束', wizEnd]]); } }
    if (i >= flow.steps.length) { guide(null); wizSay(`「${flow.title}」学完了。`); return wizOpts([['再学一个', wizMore, 1], ['结束', wizEnd]]); }
    const st = flow.steps[i];
    if (st.guard && st.guard() === 'skip') return runFlow(name, i + 1);
    const next = () => runFlow(name, i + 1);
    try { if (st.prep) await st.prep(); } catch { /* */ }
    let el = null;
    try { el = st.target ? st.target() : null; } catch { /* */ }
    guide(el);
    const text = typeof st.say === 'function' ? st.say() : st.say;
    wizSay(`<span class="lf-wstep">${flow.title} · ${i + 1} / ${flow.steps.length}</span>${text}${st.target && !el ? '<br><span class="lf-wdim">（这一步没找到对应的位置，可能是酒馆版本不同，照文字找一下）</span>' : ''}`);
    const opts = [[st.next || '下一步', next, 1]];
    (st.extra || []).forEach(([label, fn]) => opts.push([label, () => Promise.resolve(fn(next)).then(() => { if (wiz && !wiz.querySelector('.lf-wchips').children.length) wizOpts(opts); })]));
    if (i > 0) opts.push(['上一步', () => runFlow(name, i - 1)]);
    opts.push(['不学了', wizMore]);
    wizOpts(opts);
    if (st.wait) {
        const base = st.base ? st.base() : null;
        poll(() => st.wait(base), () => { wizSay(st.ok || '好了。'); next(); });
    }
}

function wizMore() {
    stopPoll(); guide(null);
    wizSay('想学哪一类？我会边框边带你做。');
    wizOpts([
        ['基础操作', () => {
            wizSay('基础操作：');
            wizOpts([['写我的 user 设定', () => wizTeach('persona')], ['怎么发第一句话', () => wizTeach('send')], ['抽卡、改楼、删楼', () => wizTeach('swipe')], ['小铅笔怎么用', () => wizTeach('pencil')], ['继续和重新生成', () => wizTeach('continue')], ['返回', wizMore]]);
        }, 1],
        ['预设和正则', () => {
            wizSay('预设和正则：');
            wizOpts([['预设条目开关', () => runFlow('preset')], ['看 AI 收到了什么', () => runFlow('prompt')], ['正则面板', () => runFlow('regex')], ['思考怎么折叠', () => runFlow('think')], ['返回', wizMore]]);
        }],
        ['世界书和卡', () => {
            wizSay('世界书和卡：');
            wizOpts([['做一本世界书', () => runFlow('worldbook')], ['编辑角色卡', () => runFlow('card')], ['怎么做大总结', () => runFlow('summary')], ['怎么更新角色卡', () => wizTeach('cardupdate')], ['AI 失忆怎么办', () => wizTeach('ctx')], ['返回', wizMore]]);
        }],
        ['维护和设置', () => {
            wizSay('维护和设置：');
            wizOpts([['备份和换设备', () => runFlow('backup')], ['更新酒馆和扩展', () => runFlow('update')], ['连接配置文件', () => runFlow('profiles')], ['快速回复', () => runFlow('qr')], ['怎么换美化', () => wizTeach('theme')], ['返回', wizMore]]);
        }],
        ['图文教程', () => {
            wizSay('图文教程：');
            wizOpts([['去答疑提问', () => { closeWizard(); openAskDesk(); }, 1], ['怎么去答疑提问', () => runFlow('ask')], ['怎么安装扩展', () => openGuide('ext')], ['怎么切成中文', () => openGuide('lang')], ['返回', wizMore]]);
        }],
        ['重新配置 API', wizStart],
        ['不学了', wizEnd],
    ]);
}

function wizEnd() {
    stopPoll(); guide(null);
    wizSay('都配好了。以后遇到解决不了的问题，去社区的<b>「新手答疑」</b>问（先看「新手入门」）。<br>要再来一次吗？');
    wizOpts([
        ['再来一次', wizStart],
        ['只重新配 API', wizStart],
        ['只教导入', wizPreset],
        ['带我学别的', wizMore],
        ['结束，开始聊天', () => { wizSay('去玩吧。之后有看不懂的，打开三条杠里的“讲解”，点哪讲哪。'); setTimeout(closeWizard, 2200); }],
    ]);
}

/* ---------------- 图文教程 ---------------- */

// 截图来自最新版酒馆的真实界面（默认主题），红框是标注
const GUIDE_IMG = Object.fromEntries(Object.entries({"lang1": "img/lang1.webp", "lang2": "img/lang2.webp", "lang3": "img/lang3.webp", "step1": "img/step1.webp", "step2": "img/step2.webp", "step3": "img/step3.webp", "step4": "img/step4.webp", "step5": "img/step5.webp"}).map(([k, p]) => [k, new URL(`./${p}`, import.meta.url).href]));

const GUIDES = {
    lang: {
        title: '把酒馆切成中文',
        pages: [
            ['lang1', '点顶栏的“用户设置”', '就是那个带齿轮的小人图标。', '#user-settings-button > .drawer-toggle', ''],
            ['lang2', '在 Language 里选“简体中文”', '用户设置最上面有个 Language（语言）下拉框，点开选「简体中文 (Chinese) (Simplified)」。', '#ui_language_select', '#user-settings-button'],
            ['lang3', '页面会自动刷新', '刷新后整个酒馆就是中文了。第一次打开酒馆时弹出的欢迎窗口里也有同一个语言选项，在那里选也一样。', '', ''],
        ],
    },
    ext: {
        title: '怎么安装扩展',
        pages: [
            ['step1', '点顶栏的“扩展程序”', '积木形状的图标，所有扩展都住在这里。', '#extensions-settings-button > .drawer-toggle', ''],
            ['step2', '点“安装扩展程序”', '扩展面板最上面那排按钮里，带云朵下载箭头的那个。', '#third_party_extension_button', '#extensions-settings-button'],
            ['step3', '粘贴地址，点“给所有人安装”', '把扩展的 Git 地址粘进输入框，一般是从社区帖子里复制的 GitHub 链接。下面的“分支或标签名”不用填。点“给所有人安装”；没有这个按钮的话，点“只给我安装”也一样。GitHub 连不上，就用帖子里给的镜像地址。', '', ''],
            ['step4', '第三方提醒：点“Yes, install it”', '不是官方扩展会弹这个英文提醒，意思是“第三方扩展可能有风险，确定要装吗”。确认来源可信就点 Yes。勾上“Don\'t show this warning again”，以后就不再问。', '', ''],
            ['step5', '看到“扩展程序安装成功”就好了', '新版酒馆会自动加载，老版本刷新一下页面。装好的扩展出现在扩展面板里，点它的标题展开设置。<br>实在装不上：把扩展下载成 zip，解压后整个文件夹放进 <code>SillyTavern/data/default-user/extensions/</code>，再重启酒馆。', '', ''],
        ],
    },
};

function switchToChinese(resume = '') {
    try { localStorage.setItem('language', 'zh-cn'); if (resume) localStorage.setItem('lf_wiz_resume', resume); } catch { /* */ }
    say('切换中，马上刷新');
    setTimeout(() => location.reload(), 600);
}
const isChineseUI = () => /^zh/i.test(document.documentElement.lang || localStorage.getItem('language') || '');

function openGuide(key, start = 0) {
    closeOptionsMenu();
    const g = GUIDES[key];
    if (!g) return;
    let i = start;
    const w = sheet('lf_guide', g.title, '<div class="lf-gd"></div>');
    const box = w.querySelector('.lf-gd');
    const draw = () => {
        const [img, t, x, target] = g.pages[i];
        const last = i === g.pages.length - 1;
        box.innerHTML = `<div class="lf-gd-no">${g.title} · ${i + 1} / ${g.pages.length}</div>
            <img class="lf-gd-img" src="${GUIDE_IMG[img]}" alt="${esc(t)}">
            <div class="lf-gd-t">${esc(t)}</div><div class="lf-gd-x">${x}</div>
            ${key === 'lang' && !isChineseUI() ? '<button class="lf-btn lf-gd-zh">直接帮我切成中文</button>' : ''}
            <div class="lf-gd-nav"><button class="lf-btn" data-a="prev"${i ? '' : ' disabled'}>上一步</button>${target ? '<button class="lf-btn" data-a="open">帮我打开</button>' : ''}<button class="lf-btn lf-gd-next" data-a="next">${last ? '完成' : '下一步'}</button></div>
            <div class="lf-gd-dots">${g.pages.map((_, k) => `<span class="${k === i ? 'on' : ''}" data-k="${k}"></span>`).join('')}</div>`;
    };
    draw();
    box.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        const dot = e.target.closest('[data-k]');
        if (dot) { i = Number(dot.dataset.k); return draw(); }
        if (e.target.closest('.lf-gd-zh')) return switchToChinese();
        if (a === 'prev' && i > 0) { i--; draw(); }
        if (a === 'next') { if (i < g.pages.length - 1) { i++; draw(); } else w.remove(); }
        if (a === 'open') {
            const [, , , target, drawer] = g.pages[i];
            w.remove();
            if (drawer) { openDrawer(drawer); await sleep(450); }
            const el = q1(target);
            if (!el) { say('没找到这个位置，可能是酒馆版本不同'); return; }
            if (!drawer && target.endsWith('.drawer-toggle')) { guide(el); setTimeout(() => guide(null), 6000); return; }
            guide(el); setTimeout(() => guide(null), 8000);
        }
    });
}

/* ---------------- 修过的设置：都记一笔，可以还原 ---------------- */

function undoList() { const s = S(); if (!Array.isArray(s.undo)) s.undo = []; return s.undo; }
const ctlVal = (el) => (el.type === 'checkbox' ? el.checked : el.value);

// 改酒馆自己的一个控件，并记下原来的值
function fixSet(sel, val, label) {
    const el = q1(sel);
    if (!el) return false;
    const prev = ctlVal(el);
    let ok;
    if (el.type === 'checkbox') { if (el.checked !== !!val) realClick(el); ok = el.checked === !!val; }
    else ok = setVal(sel, val);
    if (ok && String(prev) !== String(ctlVal(el))) {
        const u = undoList();
        u.push({ sel, prev, now: ctlVal(el), label, at: Date.now() });
        if (u.length > 60) u.shift();
        save();
    }
    return ok;
}
function flipAllow(id) {
    const name = id === 'regex_preset_toggle' ? '预设正则允许' : '局部正则允许';
    return fixSet('#' + id, true, `打开${name}`);
}

async function undoOne(i) {
    const u = undoList();
    const it = u[i];
    if (!it) return false;
    const el = q1(it.sel);
    if (el) {
        if (el.type === 'checkbox') { if (el.checked !== !!it.prev) realClick(el); }
        else setVal(it.sel, it.prev);
    }
    u.splice(i, 1); save();
    return !!el;
}
async function undoAll() {
    let n = 0;
    while (undoList().length) { if (await undoOne(undoList().length - 1)) n++; await sleep(120); }
    return n;
}

/* ---------------- 一键体检 ---------------- */

// 常见模型的上下文上限（token），只用来提醒，不准的话以渠道说明为准
const CTX_LIMIT = [
    [/deepseek/i, 128000, 'DeepSeek'],
    [/gemini/i, 1048576, 'Gemini'],
    [/claude/i, 200000, 'Claude'],
    [/gpt-4\.1/i, 1047576, 'GPT-4.1'],
    [/gpt-5/i, 400000, 'GPT-5'],
    [/gpt-4o|gpt-4-turbo|o[134]-?mini|\bo3\b/i, 128000, 'GPT-4o 这一档'],
    [/qwen|kimi|moonshot|glm/i, 128000, '这个模型'],
];

function curModel() {
    try { const m = OAI.getChatCompletionModel?.(); if (m) return String(m); } catch { /* */ }
    const st = ctx().onlineStatus;
    return st && st !== 'no_connection' ? String(st) : '';
}

function cardScripts(ch) {
    const e = ch?.data?.extensions || {};
    let th = e.tavern_helper;
    if (Array.isArray(th)) th = Object.fromEntries(th.filter((x) => Array.isArray(x) && x.length === 2));
    let list = th?.scripts || e.TavernHelper_scripts || [];
    if (!Array.isArray(list)) list = [];
    return list.flatMap((x) => (x?.type === 'folder' ? (x.scripts || x.value || []) : [x])).filter(Boolean);
}

function cardNeeds(ch) {
    const d = ch?.data || {};
    const regex = d.extensions?.regex_scripts || [];
    const scripts = cardScripts(ch);
    const text = [d.first_mes, ...(d.alternate_greetings || []), d.description, ...regex.map((r) => r.replaceString)].join('\n');
    let book = '';
    try { book = JSON.stringify(d.character_book?.entries || '').slice(0, 400000); } catch { /* */ }
    const needPT = /<%[=_-]?/.test(text) || /<%[=_-]?/.test(book);
    const needTH = scripts.length > 0 || /<!DOCTYPE|<html\b|<body\b|<script\b/i.test(text) || /getvar\(|setvar\(|TavernHelper|triggerSlash|getChatMessages/.test(text);
    let blob = '';
    try { blob = JSON.stringify(scripts).slice(0, 600000); } catch { /* */ }
    const risky = /\bfetch\s*\(|XMLHttpRequest|WebSocket|\beval\s*\(|new Function\s*\(|localStorage\.(clear|removeItem)|document\.cookie/.test(blob)
        || regex.some((r) => /<script\b/i.test(String(r.replaceString || '')));
    return { regex, scripts, needPT, needTH, risky };
}

// 只报能确定的：内容一模一样的已开条目、全局和局部重复的正则。
// 名字相同、人称、字数这类要读懂意思的，交给小助手（会看否定句和作者用意）。
function promptRowOn(id) {
    const row = q1(`#completion_prompt_manager_list [data-pm-identifier="${CSS.escape(id)}"]`);
    if (!row) return null;
    const tg = row.querySelector('.prompt-manager-toggle-action');
    if (!tg) return null;
    return /toggle-on/.test(tg.className) ? true : /toggle-off/.test(tg.className) ? false : null;
}
function presetFullText() {
    const pm = OAI.promptManager;
    const order = (pm.getPromptOrderForCharacter(pm.activeCharacter) || []).filter((o) => o.enabled && promptRowOn(o.identifier) !== false);
    let total = 0;
    const out = [];
    order.forEach((o, i) => {
        const p = pm.getPromptById(o.identifier) || {};
        if (p.marker) { out.push(`${i + 1}. [固定位] ${p.name || o.identifier}`); return; }
        const body = String(p.content || '').trim().slice(0, 900);
        if (total > 16000) { out.push(`${i + 1}. ${p.name || o.identifier}（太长，省略）`); return; }
        total += body.length;
        out.push(`${i + 1}. 「${p.name || o.identifier}」[${p.role || 'system'}${Number(p.injection_position) === 1 ? ` D${p.injection_depth}` : ''}]\n${body}`);
    });
    return `预设：${OAI.oai_settings?.preset_settings_openai || ''}\n` + out.join('\n\n');
}
function askPresetConflict() {
    if (!hasAI()) { say('要先接上 API，小助手才能读预设', 'warning'); return; }
    let text = '';
    try { text = presetFullText(); } catch { say('读不到预设条目，要在聊天补全模式下用', 'warning'); return; }
    pendingAtt = { label: '开着的预设条目全文', text };
    openAsk('帮我读一遍预设，看开着的条目之间有没有真的打架（比如人称、字数、文风要求互相矛盾）。注意：名字相同的条目、作者故意拆开写的、否定句（比如“不要用第三人称”）、给不同场合准备的可选条目，都不算打架。只列你有把握的，说清楚是哪两条、哪句话冲突；没发现就直说没问题。', true);
}
function presetConflicts() {
    const out = [];
    const c = ctx();
    if (c.mainApi && c.mainApi !== 'openai') return out;
    let ps = [];
    try {
        const pm = OAI.promptManager;
        const order = (pm.getPromptOrderForCharacter(pm.activeCharacter) || []).filter((o) => o.enabled && promptRowOn(o.identifier) !== false);
        ps = order.map((o) => pm.getPromptById(o.identifier)).filter((p) => p && !p.marker);
    } catch { return out; }
    const byText = {};
    ps.forEach((p) => { const t = String(p.content || '').replace(/\s+/g, ''); if (t.length >= 20) (byText[t] ||= []).push(p.name || p.identifier); });
    const same = Object.values(byText).filter((a) => a.length > 1);
    if (same.length) out.push(`这几组条目都开着，而且<b>内容一字不差</b>，会把同样的话发两遍：${same.slice(0, 4).map((a) => a.map((n) => `「${esc(n)}」`).join(' 和 ')).join('；')}。故意的（比如头尾各强调一次）就不用管。`);
    const g = (c.extensionSettings.regex || []).filter((r) => !r.disabled);
    const l = (curChar()?.data?.extensions?.regex_scripts || []).filter((r) => !r.disabled);
    const dup = l.filter((r) => g.some((x) => x.findRegex && x.findRegex === r.findRegex && x.replaceString === r.replaceString));
    if (dup.length && allowToggle('regex_scoped_toggle').on) out.push(`全局正则和局部正则里有 ${dup.length} 条完全一样，同一段字会被处理两次：${dup.slice(0, 3).map((r) => `「${esc(r.scriptName)}」`).join('')}`);
    return out;
}

// 每一项：lv 严重程度（bad / warn / tip），t 标题，x 说明，fix [按钮文字, 执行]
function runChecks() {
    const c = ctx();
    const o = OAI.oai_settings || {};
    const out = [];
    const add = (lv, t, x, fix) => out.push({ lv, t, x, fix });
    if (c.mainApi && c.mainApi !== 'openai') {
        add('bad', '接口不是聊天补全', '现在是“' + esc(c.mainApi) + '”。大多数预设和卡都是按聊天补全写的，换成聊天补全，预设条目才会出现。',
            ['帮我换成聊天补全', () => (fixSet('#main_api', 'openai', '接口 → 聊天补全') ? '换好了，记得重新点一下连接。' : '没换成，去 API 连接里手动选“聊天补全”。')]);
    }
    if (!connected()) add('bad', 'API 没连上', '先把 API 连好，不然 AI 不会回复。', ['带我配', () => { setTimeout(() => openWizard(), 50); return ''; }]);
    if (c.mainApi === 'openai' || !c.mainApi) {
        const max = Number(o.openai_max_context) || 0;
        const resp = Number(o.openai_max_tokens) || 0;
        const model = curModel();
        const lim = model && CTX_LIMIT.find(([re]) => re.test(model));
        const ctxErr = recentErrs.some((e) => /context.{0,20}(length|window)|maximum context|too long|token.{0,20}(limit|exceed)|reduce the length|prompt is too long/i.test(e));
        if (ctxErr) {
            add('bad', '刚才报了内容超长', `渠道说这次发的内容超过了模型能收的量${lim ? `（${lim[2]} 大约 ${lim[1]}）` : ''}。上下文长度只是上限，设大没关系，真正超了才报错：把上下文长度调到模型上限以内，或者隐藏旧楼、做大总结。`,
                lim && max > lim[1] ? ['帮我调到上限以内', () => (fixSet('#openai_max_context', Math.floor(lim[1] * 0.9), '上下文长度 → 上限以内') ? `调成 ${Math.floor(lim[1] * 0.9)} 了。` : '没调成，去 AI 回复配置里手动拉一下。')] : undefined);
        } else if (max && max < 8000) {
            add('warn', '上下文太小', `上下文只有 ${max}，预设、卡、世界书一放就满了，AI 很快失忆。一般 3 万以上比较舒服。`,
                ['帮我调到 32000', () => (fixSet('#openai_max_context', 32000, '上下文长度 → 32000') ? '调好了。' : '没调成。可能要先勾“解锁上下文”，或者手动拉一下。')]);
        }
        if (resp && resp < 400) {
            add('warn', '回复长度太小', `回复长度只有 ${resp}，AI 写到一半就会被截断。会思考的模型更要留够。`,
                ['帮我调到 2000', () => (fixSet('#openai_max_tokens', 2000, '回复长度 → 2000') ? '调好了。' : '没调成，去 AI 回复配置里手动改。')]);
        }
        if (o.stream_openai && recentErrs.some((e) => /\b524\b|timeout|timed out/i.test(e))) {
            add('warn', '流式开着又超时了', '最近出现过 524 / 超时。有的中转站流式容易断，关掉流式试试。',
                ['帮我关掉流式', () => (fixSet('#stream_toggle', false, '流式传输 → 关') ? '关好了，再发一次试试。' : '没找到开关，去 AI 回复配置里手动关。')]);
        }
    }
    const ch = curChar();
    if (ch) {
        const need = cardNeeds(ch);
        const hasTH = !!findInline(/酒馆助手|tavern ?helper|slash ?runner/i);
        const hasPT = !!findInline(/提示词模板|prompt ?template/i);
        const miss = [need.needTH && !hasTH && '酒馆助手', need.needPT && !hasPT && '提示词模板'].filter(Boolean);
        if (miss.length) add('bad', `这张卡要用的扩展没装：${miss.join('、')}`, '不装的话聊天里会露出一堆代码（爆代码），界面也出不来。', ['看安装教程', () => { setTimeout(() => openGuide('ext'), 50); return ''; }]);
        if (need.regex.length && !allowToggle('regex_scoped_toggle').on) {
            add('bad', '局部正则的允许开关关着', `这张卡带了 ${need.regex.length} 条局部正则（状态栏、美化之类），开关关着全都不生效。`,
                ['帮我打开', () => (flipAllow('regex_scoped_toggle') ? '打开了，抽一条新回复看看。' : '没打开，去正则面板手动点一下。')]);
        }
        const n = c.chat?.length || 0;
        const hidden = (c.chat || []).filter((m) => m.is_system).length;
        const tk = chatTok.id && chatTok.id === (c.getCurrentChatId?.() || '') ? chatTok.n : 0;
        const goSum = ['带我做大总结', () => { setTimeout(() => { openWizard('menu'); runFlow('summary'); }, 50); return ''; }];
        if (tk >= 100000) add('warn', `聊天记录${chatTok.est ? '大约' : ''} ${fmtTok(tk)} token 了`, '发给 AI 的聊天记录超过 10 万 token，AI 容易失忆、复读，回复也更慢更贵。做一次大总结：旧剧情存进世界书，再隐藏旧楼。', goSum);
        else if (!tk && n > 300 && hidden < n / 3) add('warn', `聊了 ${n} 楼还没做大总结`, '楼层太多会变慢、变贵，旧剧情也会被裁掉。做一次大总结，把旧楼隐藏起来。', goSum);
    } else add('tip', '还没选卡', '在角色列表里选一张卡就能开始聊。', ['打开选卡', () => { setTimeout(openPicker, 50); return ''; }]);
    const pd = String(c.powerUserSettings?.persona_description || '').trim();
    if (!pd) add('warn', '还没写 user 设定', '不写的话 AI 只知道你叫 ' + esc(c.name1 || 'User') + '，可能会替你乱编身份。几句话就够：名字、身份、外貌、和角色的关系。', ['带我写', () => { openWizard('menu'); setTimeout(() => wizTeach('persona'), 300); return ''; }]);
    if (q1('#saved_preset_scripts .regex-script-label') && !allowToggle('regex_preset_toggle').on) {
        add('warn', '预设正则的允许开关关着', '当前预设带了正则（常见的是思维链折叠、格式整理），开关关着就不生效，思考过程可能会露出来。',
            ['帮我打开', () => (flipAllow('regex_preset_toggle') ? '打开了。' : '没打开，去正则面板手动点一下。')]);
    }
    if ((q1('#chat_completion_source')?.value || '') === 'custom') {
        const v = ppStrict(); const cur = q1('#custom_prompt_post_processing')?.value;
        if (v !== null && cur !== v && !/tool/i.test(cur || '')) add('warn', '提示词后处理建议选“严格”', '用中转时，预设没有特别要求的话，提示词后处理选不带工具的“严格”，能避开很多格式报错。预设作者要求别的，就按预设来。',
            ['帮我改成严格', () => (fixSet('#custom_prompt_post_processing', v, '提示词后处理 → 严格') ? '改好了。' : '没改成，去 API 连接里手动选。')]);
    }
    {
        const model = curModel();
        const isGem = /gemini/i.test(model) || (q1('#chat_completion_source')?.value || '') === 'makersuite';
        const lastTxt = String(lastAi()?.querySelector('.mes_text')?.textContent || '').trim();
        const cut = lastTxt && !/[。！？…」』”"’）)\]】~～*>》—.!?`]\s*$/.test(lastTxt);
        if (isGem && OAI.oai_settings?.stream_openai && (cut || recentErrs.some((e) => /safety|blocked|prohibited|finish_?reason|empty|空回/i.test(e)))) {
            add('warn', '哈基米开着真流，容易被截断', '谷歌对真流有实时审查，回复容易写到一半被掐掉或空回。换成非流（关掉流式），或者用中转的假流（开着流式）。',
                ['帮我关掉流式（非流）', () => (fixSet('#stream_toggle', false, '流式传输 → 关（非流）') ? '关好了，再抽一条看看。' : '没找到开关，去 AI 回复配置里手动关。')]);
        }
    }
    {
        const model = curModel();
        const o2 = OAI.oai_settings || {};
        if (/gemini[-_ ]?(3\.1[-_ ]?pro|3\.[6-9]|[4-9](\.\d+)?\b)/i.test(model)) {
            try {
                const pm = OAI.promptManager;
                const order = (pm.getPromptOrderForCharacter(pm.activeCharacter) || []).filter((x) => x.enabled && promptRowOn(x.identifier) !== false);
                const last = order.length ? pm.getPromptById(order[order.length - 1].identifier) : null;
                if (last && last.role === 'assistant' && !last.marker) {
                    add('bad', `${esc(model)} 不适配预填`, `预设最后一条「${esc(last.name || last.identifier)}」是以 AI 身份发的预填。Gemini 3.1 Pro 和 3.6 Flash 起的哈基米都不适配预填了，会直接报 400（Requests ending with a model turn are not supported）。把这条关掉，或者换适配新模型的预设。`,
                        ['帮我关掉这条', () => { const row = q1(`#completion_prompt_manager_list [data-pm-identifier="${CSS.escape(last.identifier)}"] .prompt-manager-toggle-action`); if (!row) return '没找到这条的开关，去预设里手动关。'; realClick(row); return '关掉了。'; }]);
                }
            } catch { /* */ }
        }
        if (/gemini/i.test(model) && (Number(o2.freq_pen_openai) || Number(o2.pres_pen_openai))) {
            add('tip', '哈基米已经取消了双惩罚', `现在频率惩罚是 ${o2.freq_pen_openai ?? 0}、存在惩罚是 ${o2.pres_pen_openai ?? 0}。Gemini 2.5 以后的模型不支持这两个参数，调了也没用，放 0 就行。`,
                ['帮我都归零', () => { const a = fixSet('#freq_pen_openai', 0, '频率惩罚 → 0'); const b = fixSet('#pres_pen_openai', 0, '存在惩罚 → 0'); return a || b ? '归零了。' : '没找到这两项，去 AI 回复配置里手动改。'; }]);
        }
    }
    const gOn = (c.extensionSettings.regex || []).filter((r) => !r.disabled).length;
    if (gOn > 40) add('tip', `全局正则开了 ${gOn} 条`, '全局正则对每张卡、每条消息都跑一遍，太多会卡。只给某张卡用的，改成局部正则。');
    presetConflicts().forEach((x) => add('tip', '有重复发送的内容', x));
    return out;
}

function openCheckup(focusUndo = false) {
    closeOptionsMenu();
    countChatTokens().then(() => { const b = document.querySelector('#lf_check [data-a="again"]'); if (b && chatTok.n >= 100000) b.click(); }).catch(() => {});
    const w = sheet('lf_check', '帮我查问题', '<div class="lf-ck"></div>');
    const box = w.querySelector('.lf-ck');
    const ICON = { bad: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation', tip: 'fa-circle-info' };
    let list = [];
    const draw = () => {
        list = runChecks();
        const bad = list.filter((x) => x.lv === 'bad').length;
        const head = `<div class="lf-ck-stage"><span class="lf-hub-no">①</span><b>先自动体检了一遍</b><button class="lf-btn" data-a="again"><i class="fa-solid fa-rotate"></i> 重查</button></div>`
            + (list.length ? `<div class="lf-ck-sum">发现 <b>${list.length}</b> 处${bad ? `，其中 <b>${bad}</b> 处要先修` : ''}。带红色按钮的点一下就修好，改过的都能在最下面还原。` : '<div class="lf-ck-sum">常见问题都没有。还不对的话，往下看 ②。');
        const items = list.map((x, i) => `<div class="lf-ck-it lv-${x.lv}"><i class="fa-solid ${ICON[x.lv]}"></i><div><b>${esc(x.t)}</b><p>${x.x || ''}</p><div class="lf-ck-b">${x.fix ? `<button class="lf-btn lf-ck-fix" data-i="${i}">${esc(x.fix[0])}</button>` : ''}<button class="lf-btn" data-ask="${i}">问问它</button></div></div></div>`).join('');
        const u = undoList();
        const undo = `<div class="lf-card lf-ck-undo"><div class="lf-cap">修过的设置 <small>修正机替你改的，都能还原</small></div>${u.length ? u.slice().reverse().map((it, k) => `<div class="lf-ck-u"><span>${esc(it.label || it.sel)}<small>${esc(ago(it.at))} · 原来是 ${esc(String(it.prev))}</small></span><button class="lf-btn" data-undo="${u.length - 1 - k}">还原</button></div>`).join('') + '<button class="lf-btn lf-ck-undoall"><i class="fa-solid fa-rotate-left"></i> 全部还原</button>' : '<div class="lf-muted">还没改过。</div>'}</div>`;
        const deep = (ctx().mainApi || 'openai') === 'openai' ? `<div class="lf-card"><div class="lf-cap">条目之间有没有打架？</div><div class="lf-muted">体检只报能确定的问题。人称、字数、文风这些要读懂意思才判断得了（比如“不要用第三人称”不算要求第三人称），交给小助手读一遍。</div><div class="lf-inline"><button class="lf-btn lf-grow" data-a="deep"><i class="fa-solid fa-book-open-reader"></i> 让小助手读一遍预设${hasAI() ? '' : '（要先接 API）'}</button></div></div>` : '';
        const more = `<div class="lf-card lf-ck-more"><div class="lf-cap">还没解决？接着往下</div>
            <div class="lf-hub-s" data-a="screen"><span class="lf-hub-no">②</span><span class="lf-shot-t"><b>让小助手看屏幕</b><small>${hasAI() ? '它读一遍屏幕状态和报错，直接告诉你怎么办' : '要先接上 API；没接的话直接看 ③'}</small></span><i class="fa-solid fa-chevron-right lf-hub-go"></i></div>
            <div class="lf-hub-arrow"><i class="fa-solid fa-arrow-down"></i> 还没解决</div>
            <div class="lf-hub-s" data-a="howask"><span class="lf-hub-no">③</span><span class="lf-shot-t"><b>去答疑提问</b><small>去「新手答疑」问人：帮你写好提问、告诉你截哪里</small></span><i class="fa-solid fa-chevron-right lf-hub-go"></i></div>
        </div>`;
        box.innerHTML = `${head}</div>${items}${more}${deep}${undo}`;
        if (focusUndo) { focusUndo = false; setTimeout(() => box.querySelector('.lf-ck-undo')?.scrollIntoView({ block: 'start' }), 50); }
    };
    draw();
    box.addEventListener('click', async (e) => {
        const t = e.target;
        const fx = t.closest('.lf-ck-fix');
        if (fx) {
            const it = list[Number(fx.dataset.i)];
            if (!it?.fix) return;
            const msg = await it.fix[1]();
            if (msg === '') { w.remove(); return; }
            if (!document.body.contains(w)) return;
            if (msg) say(msg, /没/.test(msg) ? 'warning' : 'success');
            await sleep(300); draw(); renderPanel(); return;
        }
        const ask = t.closest('[data-ask]');
        if (ask) { const it = list[Number(ask.dataset.ask)]; w.remove(); openAsk(`体检说：${it.t}。${strip(it.x)} 这是什么意思，我该怎么办？`, true); return; }
        const ud = t.closest('[data-undo]');
        if (ud) { await undoOne(Number(ud.dataset.undo)); say('还原了', 'success'); draw(); renderPanel(); return; }
        if (t.closest('.lf-ck-undoall')) {
            if (!(await confirmBox(`把修正机改过的 ${undoList().length} 处设置全部还原？`))) return;
            const n = await undoAll(); say(`还原了 ${n} 处`, 'success'); draw(); renderPanel(); return;
        }
        const a = t.closest('[data-a]')?.dataset.a;
        if (a === 'again') draw();
        if (a === 'deep') { if (!hasAI()) return say('要先接上 API，小助手才能读预设', 'warning'); w.remove(); askPresetConflict(); }
        if (a === 'screen') { w.remove(); openScreenCheck(); }
        if (a === 'howask') { w.remove(); openAskDesk(); }
    });
}

/* ---------------- 导入时安全提醒 ---------------- */

let knownChars = null; let knownGRegex = null; let impBox = null;

function importWarn(ch) {
    if (!ch) return;
    const need = cardNeeds(ch);
    const hasTH = !!findInline(/酒馆助手|tavern ?helper|slash ?runner/i);
    const hasPT = !!findInline(/提示词模板|prompt ?template/i);
    const miss = [need.needTH && !hasTH && '酒馆助手', need.needPT && !hasPT && '提示词模板'].filter(Boolean);
    const scopedOff = need.regex.length && !allowToggle('regex_scoped_toggle').on;
    const lines = [];
    if (need.regex.length) lines.push(`带了 <b>${need.regex.length} 条正则</b>：卡内正则是局部正则，只在这张卡里生效，不会影响别的卡。${scopedOff ? '<br>现在<b>局部正则的允许开关是关着的</b>，状态栏和美化不会显示。' : ''}`);
    if (need.scripts.length) lines.push(`带了 <b>${need.scripts.length} 个脚本</b>：脚本会在网页里运行代码，能改界面、读写变量。<b>来源不明的卡先别开脚本</b>，确认是作者原帖下的再开。${need.risky ? '<br><b>这张卡的脚本里有联网或执行代码的写法</b>，更要确认来源。' : ''}`);
    if (miss.length) lines.push(`要用<b>${miss.join('和')}</b>，你还没装。不装会爆代码。`);
    const same = (ctx().characters || []).filter((x) => x !== ch && x.avatar !== ch.avatar && String(x.name || '').trim() === String(ch.name || '').trim());
    if (same.length) lines.unshift(`你已经有一张同名的「${esc(ch.name)}」，看起来是在<b>更新卡</b>：原本的世界书要先<b>重命名或删掉</b>，酒馆发现重名世界书就不会更新。旧聊天可以在新卡里“导入存档”接着聊。`);
    if (!lines.length) return;
    if (!impBox) {
        impBox = document.createElement('div');
        impBox.id = 'lf_imp';
        document.body.appendChild(impBox);
        impBox.addEventListener('click', (e) => {
            const a = e.target.closest('button')?.dataset.a;
            if (!a) return;
            if (a === 'allow') { flipAllow('regex_scoped_toggle'); say(allowToggle('regex_scoped_toggle').on ? '局部正则的允许开关打开了' : '没打开，去正则面板手动点一下', 'info'); }
            if (a === 'guide') openGuide('ext');
            if (a === 'upd') { openWizard('menu'); wizTeach('cardupdate'); }
            impBox.style.display = 'none';
        });
    }
    impBox.innerHTML = `<div class="lf-tip-t">小助手：${same.length && lines.length === 1 ? `你像是在更新「${esc(snip(ch.name, 16))}」` : `「${esc(snip(ch.name, 16))}」带了这些东西`}</div><div class="lf-tip-x">${lines.join('<br>')}</div><div class="lf-tip-b">${scopedOff ? '<button data-a="allow">打开局部正则允许</button>' : ''}${miss.length ? '<button data-a="guide">看安装教程</button>' : ''}${same.length ? '<button data-a="upd">怎么更新卡</button>' : ''}<button data-a="close">知道了</button></div>`;
    impBox.style.display = 'block';
}

function watchImports() {
    const c = ctx();
    const avs = new Set((c.characters || []).map((x) => x.avatar));
    if (!knownChars || !knownChars.size) knownChars = avs;
    else if (avs.size) {
        const fresh = [...avs].filter((a) => !knownChars.has(a));
        knownChars = avs;
        if (fresh.length && fresh.length <= 2 && on('ui_import_guard')) { const av = fresh[fresh.length - 1]; setTimeout(() => queueNudge('imp' + av, () => importWarn(ctx().characters.find((x) => x.avatar === av))), 1500); }
    }
    const gr = (c.extensionSettings.regex || []).map((r) => r.id || r.scriptName);
    if (!knownGRegex) knownGRegex = new Set(gr);
    else {
        const nw = gr.filter((x) => !knownGRegex.has(x));
        knownGRegex = new Set(gr);
        if (nw.length && on('ui_import_guard')) say(`刚加了 ${nw.length} 条<b>全局正则</b>，它们会在所有卡里生效。只给一张卡用的，导入时应该选“局部”；配合预设用的选“预设”。`, 'warning');
    }
}

/* ---------------- 时间记录 ---------------- */

const TIME_KEY = 'lf_time';
const sessionStart = Date.now();
let sessionOn = 0;
const today = () => new Date().toLocaleDateString('sv');
function timeData() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(TIME_KEY) || '{}') || {}; } catch { /* */ }
    if (d.day !== today()) d = { day: today(), on: 0, n: 0, sum: 0, max: 0, prev: d.day ? { day: d.day, on: d.on || 0, n: d.n || 0, sum: d.sum || 0 } : null };
    return d;
}
function timeSave(d) { try { localStorage.setItem(TIME_KEY, JSON.stringify(d)); } catch { /* */ } }
function recordWait(sec) { const d = timeData(); d.n++; d.sum += sec; d.max = Math.max(d.max || 0, sec); timeSave(d); }
function dur(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return `${sec} 秒`;
    const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60);
    return h ? `${h} 小时 ${m} 分` : `${m} 分钟`;
}
function tickTime() {
    if (document.hidden) return;
    const d = timeData(); d.on += 30; timeSave(d);
    sessionOn += 30;
    if (on('chat_time_remind') && sessionOn % 7200 === 0) say(`已经连续玩了 ${dur(sessionOn)}，起来喝口水、动一动吧`, 'info');
}
function timeCardHtml() {
    const d = timeData();
    const avg = d.n ? Math.round(d.sum / d.n) : 0;
    return `<div class="lf-card">
        <div class="lf-cap">时间 <small>只记在这台设备上</small></div>
        <div class="lf-time">
            <div><b>${dur(sessionOn || (Date.now() - sessionStart) / 1000)}</b><small>这次在线</small></div>
            <div><b>${dur(d.on)}</b><small>今天在线</small></div>
            <div><b>${d.n}</b><small>今天收到回复</small></div>
            <div><b>${d.n ? dur(avg) : '—'}</b><small>平均每条等</small></div>
            <div><b>${d.n ? dur(d.max) : '—'}</b><small>最久等了</small></div>
            <div><b>${d.n ? dur(d.sum) : '—'}</b><small>今天一共等</small></div>
        </div>
        ${d.prev ? `<div class="lf-muted">上次（${esc(d.prev.day)}）：在线 ${dur(d.prev.on)}，收到 ${d.prev.n} 条回复${d.prev.n ? `，平均每条等 ${dur(d.prev.sum / d.prev.n)}` : ''}</div>` : ''}
    </div>`;
}

function startWatchers() {
    setInterval(tickTime, 30000);
    setTimeout(() => { watchImports(); setInterval(() => { watchImports(); mountStartBtn(); flushNudge(); if (S().look?.mode === 'auto') applyLook(); }, 2500); }, 3000);
}

/* ---------------- 新手答疑直达 ---------------- */

const deskUrl = () => { const u = String(S().helper.desk || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; };
function openDesk() {
    const u = deskUrl();
    if (!u) return false;
    try { window.open(u, '_blank', 'noopener'); return true; } catch { return false; }
}

/* ---------------- 选卡 ---------------- */

function openPicker() {
    closeOptionsMenu();
    const c = ctx(); const s = S();
    const tagList = c.tags || [];
    const tagMap = c.tagMap || {};
    const chars = (c.characters || []).map((ch, i) => ({ i, ch, name: String(ch.name || ''), t: Number(ch.date_last_chat) || 0, tags: (tagMap[ch.avatar] || []).map((id) => tagList.find((x) => x.id === id)?.name).filter(Boolean) }));
    const used = {};
    chars.forEach((x) => x.tags.forEach((n) => (used[n] = (used[n] || 0) + 1)));
    const topTags = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([n]) => n);
    const cur = c.characterId !== undefined && c.characterId !== null ? Number(c.characterId) : -1;
    const w = sheet('lf_pick', `选卡 <small class="lf-muted">${chars.length} 张</small>`, `<input class="text_pole" id="lf_pq" placeholder="搜卡名、作者、标签">
        <div class="lf-chips lf-scroll" id="lf_ptabs"><span class="lf-chip" data-tab="all">全部</span><span class="lf-chip" data-tab="recent">最近聊过</span><span class="lf-chip" data-tab="fav"><i class="fa-solid fa-star"></i> 收藏 ${s.favs.length || ''}</span>${topTags.map((n) => `<span class="lf-chip" data-tab="tag:${esc(n)}"># ${esc(n)}</span>`).join('')}</div>
        <div class="lf-pgrid" id="lf_pg"></div>`);
    const grid = w.querySelector('#lf_pg');
    const q = w.querySelector('#lf_pq');
    let tab = s.pickTab || 'all';
    if (tab.startsWith('tag:') && !topTags.includes(tab.slice(4))) tab = 'all';
    const draw = () => {
        $$('#lf_ptabs .lf-chip', w).forEach((x) => x.classList.toggle('on', x.dataset.tab === tab));
        const k = q.value.trim().toLowerCase();
        const fav = new Set(s.favs);
        let list = chars.filter((x) => {
            if (tab === 'recent' && !x.t) return false;
            if (tab === 'fav' && !fav.has(x.ch.avatar)) return false;
            if (tab.startsWith('tag:') && !x.tags.includes(tab.slice(4))) return false;
            if (!k) return true;
            return `${x.name} ${x.ch.data?.creator || ''} ${x.tags.join(' ')}`.toLowerCase().includes(k);
        });
        list.sort(tab === 'recent' ? (a, b) => b.t - a.t : (a, b) => (fav.has(b.ch.avatar) - fav.has(a.ch.avatar)) || (b.t - a.t) || a.name.localeCompare(b.name, 'zh'));
        const more = list.length - 120;
        list = list.slice(0, 120);
        grid.innerHTML = list.map((x) => `<div class="lf-pc${x.i === cur ? ' cur' : ''}" data-ci="${x.i}">
            <img src="${thumb('avatar', x.ch.avatar)}" loading="lazy" decoding="async" alt="">
            <i class="fa-${fav.has(x.ch.avatar) ? 'solid' : 'regular'} fa-star lf-pstar" data-fav="${esc(x.ch.avatar)}" title="收藏"></i>
            <b>${esc(x.name)}</b><small>${x.i === cur ? '正在聊' : x.t ? esc(ago(x.t)) : '还没聊过'}</small></div>`).join('')
            + (more > 0 ? `<div class="lf-muted lf-pad lf-pmore">还有 ${more} 张，搜一下更快</div>` : '')
            || `<div class="lf-muted lf-pad">${tab === 'fav' ? '还没收藏。点卡片右上角的星星收藏。' : '没找到。'}</div>`;
    };
    draw();
    q.addEventListener('input', draw);
    w.querySelector('#lf_ptabs').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (!t) return; tab = t.dataset.tab; s.pickTab = tab; save(); draw(); });
    grid.addEventListener('click', async (e) => {
        const st = e.target.closest('[data-fav]');
        if (st) {
            e.stopPropagation();
            const a = st.dataset.fav;
            s.favs = s.favs.includes(a) ? s.favs.filter((x) => x !== a) : [...s.favs, a];
            save(); draw();
            const fc = w.querySelector('[data-tab="fav"]'); if (fc) fc.innerHTML = `<i class="fa-solid fa-star"></i> 收藏 ${s.favs.length || ''}`;
            return;
        }
        const card = e.target.closest('[data-ci]');
        if (!card) return;
        const i = Number(card.dataset.ci);
        if (i === cur) { w.remove(); return; }
        w.remove();
        try {
            if (typeof ST.selectCharacterById === 'function') { await ST.selectCharacterById(i); return; }
        } catch { /* */ }
        const el = q1(`#rm_print_characters_block .character_select[chid="${i}"]`);
        if (el) realClick(el); else say('没切过去，去角色列表里点一下这张卡', 'warning');
    });
}

/* ---------------- 答疑台：帮你把问题问清楚 ---------------- */

// [键, 名字, 提示, 对应“怎么去答疑提问”教程的第几步, 识别小助手建议的关键词]
const SHOTS = [
    ['err', '报错原文', '红色弹窗几秒就没了，复制文字比截图好用', 1, /报错|弹窗|错误/],
    ['api', 'API 连接', '接口类型、来源、模型、连接状态。只遮密钥，中转地址别遮', 2, /API|连接|渠道|密钥/i],
    ['preset', '预设和长度设置', '预设名、上下文长度、回复长度、流式', 3, /预设|长度|流式/],
    ['msg', '出问题的那条消息', '整条截，连上一条一起', 4, /消息|回复|楼/],
    ['prompt', 'AI 收到了什么', '提示词明细，每块占多少 token', 5, /提示词|收到|明细|token/i],
    ['regex', '正则和扩展面板', '三栏正则、两个允许开关、装了哪些扩展', 6, /正则|扩展/],
];

const deskLog = [];
let deskDraft = '';
let deskRec = new Set();
const deskDone = new Set();
let deskAsking = false;

const hasAI = () => { const h = S().helper; return h.mode === 'own' ? !!(h.url && h.model) : connected(); };

function composeSys() {
    return '\n\n【这次的任务：帮玩家写去答疑的提问】玩家要去社区「新手答疑」频道提问。你的任务是帮他把问题问清楚，不是替他去问。'
        + '\n1. 先看【我的屏幕状态】和报错，判断大概是哪类问题（连不上、报错、截断或空回、爆代码、正则或状态栏、世界书、预设或文风、其他）。如果你很有把握能直接解决，先用一两句话给出办法，再问他要不要继续写提问。'
        + '\n2. 一个好提问要四样：做了什么操作、想要什么结果、实际发生了什么、已经试过什么。屏幕状态里看得出来的不要再问。缺的每次最多问两个，问得具体、给选项，比如“是一直这样，还是换了预设之后才这样？”。语气轻松，别审问。'
        + '\n3. 信息够了，或者玩家说“直接写”，就输出最终结果，严格按这个格式，前面最多一句话：'
        + '\n【提问草稿】\n（一句话标题，概括问题）\n【酒馆版本】…\n【设备】…\n【API 渠道和模型】…\n【中转地址】…（用中转才有，照抄，不要遮）\n【预设】…\n【角色卡】…\n【问题描述】我做了… → 想要… → 实际…\n【报错原文】…\n【已经试过】…\n【要截的图】\n- 从这几样里挑 2 到 4 样最相关的：报错原文、API 连接、预设和长度设置、出问题的那条消息、AI 收到了什么（提示词明细）、正则和扩展面板'
        + '\n已知信息照抄下面这份，不要改动；玩家没说过的经历不要编，不知道就写“（待补充）”。绝对不要让玩家贴密钥。中转地址要保留（已知信息里有就照抄），答疑的人要靠它判断地址填得对不对。'
        + '\n【已知信息】\n' + askTemplate();
}

function parseDraft(text) {
    const i = text.indexOf('【提问草稿】');
    if (i < 0) return null;
    const j = text.indexOf('【要截的图】', i);
    const body = text.slice(i + 6, j > i ? j : undefined).trim();
    const shots = j > i ? text.slice(j + 6) : '';
    return { pre: text.slice(0, i).trim(), body, rec: SHOTS.filter((x) => x[4].test(shots)).map((x) => x[0]) };
}

function openAskDesk() {
    closeOptionsMenu();
    if (errBox) errBox.style.display = 'none';
    if (!deskDraft) deskDraft = askTemplate();
    const ai = hasAI();
    const w = sheet('lf_desk', '去答疑提问', `
        <div class="lf-card">
            <div class="lf-cap">小助手帮你问清楚 <small>${ai ? '会读屏幕状态和报错，不读密钥' : '还没接 API'}</small></div>
            <div class="lf-log lf-dk-log"></div>
            ${ai ? `<div class="lf-chips lf-dk-chips"><span class="lf-chip on" data-d="start">${deskLog.length ? '重新开始' : '开始整理'}</span><span class="lf-chip" data-d="final">信息够了，直接写</span></div>
            <div class="lf-askrow"><textarea class="text_pole" id="lf_dq" rows="1" placeholder="说说遇到了什么，比如：换了预设之后一直空回"></textarea><button class="lf-btn" id="lf_dsend" title="发送"><i class="fa-solid fa-paper-plane"></i></button></div>`
            : '<div class="lf-inline"><button class="lf-btn lf-grow" data-d="wiz"><i class="fa-solid fa-wand-magic"></i> 带我接 API</button></div>'}
        </div>
        <div class="lf-card">
            <div class="lf-cap">提问草稿 <small>已经填好能自动读到的，可以直接改</small></div>
            <textarea class="text_pole lf-dk-draft" spellcheck="false"></textarea>
            <div class="lf-inline"><button class="lf-btn lf-grow" data-d="reset"><i class="fa-solid fa-rotate"></i> 重填</button><button class="lf-btn lf-grow" data-d="copy"><i class="fa-solid fa-copy"></i> 复制</button><button class="lf-btn lf-grow lf-ck-fix" data-d="go"><i class="fa-solid fa-arrow-up-right-from-square"></i> 复制并去答疑</button></div>
            ${deskUrl() ? '' : '<small class="lf-muted">在修正机设置的小助手里填上「新手答疑」链接，就能一键跳过去。</small>'}
        </div>
        <div class="lf-card">
            <div class="lf-cap">要截的图 <small>不用全截，挑相关的；★ 是小助手建议的</small></div>
            <div class="lf-shots"></div>
        </div>
        <div class="lf-card lf-dk-tips">
            <div class="lf-cap">发之前看一眼</div>
            <div class="lf-muted">· 只遮密钥、真名和联系方式。<b>中转地址别遮</b>，答疑的人要看<br>· 别发设置文件和备份压缩包，里面可能带密钥<br>· 一个帖子只问一个问题，草稿 + 截图一起发<br>· 有人回了，照着试完回一句“好了”或“还是不行，现在是……”<br>· 先看「新手入门」，问完还不会就去「新手开帖」</div>
        </div>`);
    const log = w.querySelector('.lf-dk-log');
    const draft = w.querySelector('.lf-dk-draft');
    const shots = w.querySelector('.lf-shots');
    draft.value = deskDraft;
    draft.addEventListener('input', () => { deskDraft = draft.value; });

    const drawLog = () => {
        log.innerHTML = deskLog.map((m) => {
            if (m.role === 'user') return `<div class="lf-bub me">${esc(m.content)}${m.screen ? '<small class="lf-scr">已附带屏幕状态（不含密钥）</small>' : ''}</div>`;
            const d = m.err ? null : parseDraft(m.content);
            return `<div class="lf-bub ai${m.err ? ' err' : ''}">${d ? mdLite(d.pre || '整理好了。') + '<small class="lf-scr">草稿已经填进下面，可以直接改</small>' : mdLite(m.content)}</div>`;
        }).join('') + (deskAsking ? '<div class="lf-bub ai lf-muted">想一想…</div>' : '')
            || `<div class="lf-muted lf-pad">${ai ? '点“开始整理”，我先看一眼屏幕和报错，再问你几句，最后把提问写好。' : '接上 API 以后，我能看着报错帮你把问题问清楚。现在先用下面这份模板，自动读到的已经填好了。'}</div>`;
        log.scrollTop = log.scrollHeight;
    };
    const drawShots = () => {
        shots.innerHTML = SHOTS.map(([k, n, x]) => `<div class="lf-shot${deskDone.has(k) ? ' done' : ''}${deskRec.has(k) ? ' rec' : ''}">
            <span class="lf-shot-ck" data-ck="${k}"><i class="fa-solid fa-check"></i></span>
            <span class="lf-shot-t"><b>${deskRec.has(k) ? '★ ' : ''}${n}</b><small>${x}</small></span>
            ${k === 'err' ? '<button class="lf-btn" data-cperr="1">复制</button>' : `<button class="lf-btn" data-goto="${k}">带我去</button>`}</div>`).join('');
    };
    drawLog(); drawShots();

    const send = async (text, opts = {}) => {
        text = String(text || '').trim();
        if (!text || deskAsking) return;
        deskLog.push({ role: 'user', content: text, screen: opts.screen || undefined });
        deskAsking = true; drawLog();
        try {
            const out = (await askAI(deskLog.filter((m) => !m.err), composeSys())) || '（空回复）';
            deskLog.push({ role: 'assistant', content: out });
            const d = parseDraft(out);
            if (d) {
                deskDraft = d.body; if (document.body.contains(draft)) draft.value = d.body;
                if (d.rec.length) deskRec = new Set(d.rec);
            }
        } catch (err) { deskLog.push({ role: 'assistant', content: '没问到：' + (err?.message || err) + '\n可以先用下面的模板，自己把【问题描述】补上。', err: true }); }
        deskAsking = false;
        if (document.body.contains(w)) { drawLog(); drawShots(); }
    };
    const q = w.querySelector('#lf_dq');
    w.querySelector('#lf_dsend')?.addEventListener('click', () => { const t = q.value; q.value = ''; send(t); });
    q?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); const t = q.value; q.value = ''; send(t); } });

    w.querySelector('.lf-sheet-b').addEventListener('click', async (e) => {
        const t = e.target;
        const d = t.closest('[data-d]')?.dataset.d;
        if (d === 'start') {
            deskLog.length = 0; deskRec = new Set();
            return send('我想去「新手答疑」提问，帮我看看出了什么问题，再帮我把提问整理好。', { screen: screenSnapshot() });
        }
        if (d === 'final') return send('信息就这些了，直接帮我写提问草稿。');
        if (d === 'wiz') { w.remove(); return openWizard(); }
        if (d === 'reset') { deskDraft = askTemplate(); draft.value = deskDraft; say('重新填好了'); return; }
        if (d === 'copy' || d === 'go') {
            const ok = await copyText(draft.value);
            const j = ok && d === 'go' && openDesk();
            say(ok ? (j ? '复制好了，粘贴到「新手答疑」就行' : d === 'go' ? '复制好了。还没填答疑链接，自己去「新手答疑」粘贴' : '复制好了') : '复制失败了，长按草稿手动复制', ok ? 'success' : 'warning');
            return;
        }
        const ck = t.closest('[data-ck]');
        if (ck) { const k = ck.dataset.ck; deskDone.has(k) ? deskDone.delete(k) : deskDone.add(k); return drawShots(); }
        if (t.closest('[data-cperr]')) {
            const txt = recentErrs.slice(-3).map((x) => x.replace(/^\[[^\]]+\]\s*/, '')).join('\n');
            if (!txt) return say('还没记到报错。等它再报一次再来');
            const ok = await copyText(txt);
            if (ok) { deskDone.add('err'); drawShots(); }
            return say(ok ? '报错原文复制好了' : '复制失败了', ok ? 'success' : 'warning');
        }
        const go = t.closest('[data-goto]');
        if (go) {
            const st = SHOTS.find((x) => x[0] === go.dataset.goto);
            deskDone.add(st[0]);
            w.remove();
            openWizard('menu');
            await runFlow('ask', st[3]);
            wizOpts([['截好了，回去写提问', () => { closeWizard(); openAskDesk(); }, 1], ['下一张', () => runFlow('ask', st[3] + 1)], ['不截了', () => { closeWizard(); openAskDesk(); }]]);
        }
    });
}

/* ---------------- 大总结：token 统计、提醒、存世界书 ---------------- */

const SUM_PROMPT = '<Request：暂停角色扮演，本回合不要续写正文，只写总结。请把到目前为止的剧情做一次大总结：\n1. 人物：出场人物的身份，彼此现在的关系和态度变化；\n2. 时间线：按时间顺序写关键事件，每件一两句；\n3. 伏笔和约定：还没解决的悬念、承诺、计划；\n4. 当前状态：现在的时间、地点、正在做什么；状态栏里的数值（好感度、属性等）照抄最新的；\n5. 重要细节：称呼、口癖、关键物品、设定上的特殊约定。\n用客观的陈述写，不要描写和对白，不要漏掉重要转折。>';
const SUM_RE = /大总结|总结全文|总结前文|全文总结|剧情总结/;
let sumOpened = '';
let sumAskAt = 0;
let chatTok = { id: '', n: 0, est: true, total: 0, hidden: 0 };
let tokTimer = 0;

const fmtTok = (n) => (n >= 10000 ? `${(n / 10000).toFixed(1)} 万` : String(n));
function estTokens(t) {
    const cjk = (t.match(/[぀-ヿ㐀-鿿豈-﫿가-힯]/g) || []).length;
    return Math.round(cjk + (t.length - cjk) / 3.5);
}
async function countChatTokens() {
    const c = ctx();
    const all = c.chat || [];
    const live = all.filter((m) => !m.is_system);
    const text = live.map((m) => m.mes || '').join('\n');
    let n = 0; let est = true;
    try {
        if (typeof c.getTokenCountAsync === 'function' && text.length < 1200000) { n = Number(await c.getTokenCountAsync(text)) || 0; est = !n; }
    } catch { /* */ }
    if (!n) n = estTokens(text);
    chatTok = { id: c.getCurrentChatId?.() || '', n, est, total: all.length, hidden: all.length - live.length };
    return chatTok;
}
function scheduleTokCount(delay = 4000) {
    clearTimeout(tokTimer);
    tokTimer = setTimeout(async () => { try { await countChatTokens(); summaryNudge(); } catch { /* */ } }, delay);
}

let nudgeBox = null;
/* 自己弹出来的提醒排队：一次只弹一个；向导、弹层开着，AI 正在写，或者已经有气泡时先等着 */
const nudgeQ = [];
function busyForNudge() {
    if (wiz || document.querySelector('.lf-mask') || genStart || picking) return true;
    return ['#lf_err', '#lf_imp', '#lf_nudge'].some((sel) => q1(sel)?.style.display === 'block');
}
function queueNudge(key, fn) {
    if (nudgeQ.some((x) => x.key === key)) return;
    nudgeQ.push({ key, fn });
    flushNudge();
}
function flushNudge() {
    if (!nudgeQ.length || busyForNudge()) return;
    try { nudgeQ.shift().fn(); } catch { /* */ }
}
function showNudge(title, html, buttons) {
    if (!nudgeBox) {
        nudgeBox = document.createElement('div');
        nudgeBox.id = 'lf_nudge';
        document.body.appendChild(nudgeBox);
        nudgeBox.addEventListener('click', (e) => {
            const i = e.target.closest('button')?.dataset.i;
            if (i === undefined) return;
            nudgeBox.style.display = 'none';
            nudgeBox._fns?.[Number(i)]?.();
        });
    }
    nudgeBox._fns = buttons.map((b) => b[1]);
    nudgeBox.innerHTML = `<div class="lf-tip-t">${title}</div><div class="lf-tip-x">${html}</div><div class="lf-tip-b">${buttons.map((b, i) => `<button data-i="${i}"${i === buttons.length - 1 ? ' data-a="close"' : ''}>${esc(b[0])}</button>`).join('')}</div>`;
    nudgeBox.style.display = 'block';
}

function summaryNudge() {
    if (!on('chat_summary_nudge') || !chatTok.id || chatTok.n < 100000) return;
    const key = 'lf_sumnudge_' + chatTok.id;
    const lvl = Math.floor(chatTok.n / 100000);
    if (Number(localStorage.getItem(key) || 0) >= lvl) return;
    queueNudge('sum', () => {
        localStorage.setItem(key, String(lvl));
        showNudge('小助手：该做大总结了', `这个聊天发给 AI 的聊天记录${chatTok.est ? '大约' : ''}有 <b>${fmtTok(chatTok.n)}</b> token 了（${chatTok.total} 楼，隐藏了 ${chatTok.hidden} 楼）。超过 10 万 AI 容易失忆、复读，回复也更慢更贵。做一次大总结，把旧剧情存进世界书，再隐藏旧楼。`,
            [['带我做', () => { openWizard('menu'); runFlow('summary'); }], ['以后再说', null]]);
    });
}

function showVersionNote() {
    S().seenVer = VER; save();
    showNudge(`Love 修正机更新到 ${VER}`, '· 顶栏多了一个<b>修正机按钮</b>（路线图标），新手引导、帮我查问题、优化设置都在里面<br>· <b>帮我查问题</b>：先自动体检、能一键修，不行再让小助手看屏幕，最后帮你写好提问去答疑<br>· <b>快速优化</b>：手机、电脑各有推荐方案，点一下就换<br>· 导入卡时的安全提醒、聊天超过 10 万 token 提醒做大总结（带教程）',
        [['打开看看', openHub], ['知道了', null]]);
}

function sumEntryRow() {
    return $$('#completion_prompt_manager_list .completion_prompt_manager_prompt[data-pm-identifier]')
        .find((r) => SUM_RE.test(r.querySelector('.completion_prompt_manager_prompt_name')?.textContent || '')) || null;
}
function sumEntryOn() {
    const r = sumEntryRow();
    const id = r?.getAttribute('data-pm-identifier');
    if (!id) return false;
    const dom = promptRowOn(id);
    if (dom !== null) return dom;
    try { const pm = OAI.promptManager; return !!pm.getPromptOrderForCharacter(pm.activeCharacter).find((o) => o.identifier === id)?.enabled; } catch { return false; }
}

async function saveSummaryToWB() {
    const c = ctx();
    const chat = c.chat || [];
    let idx = chat.length - 1;
    while (idx >= 0 && (chat[idx].is_user || chat[idx].is_system)) idx--;
    if (idx < 0) throw new Error('没找到 AI 写的总结');
    const text = String(chat[idx].mes || '').replace(/<(think|thinking)>[\s\S]*?<\/\1>/gi, '').trim();
    if (text.length < 30) throw new Error('最后一条 AI 回复太短，不像总结');
    const WI = await import('/scripts/world-info.js');
    let book = c.chatMetadata?.world_info || '';
    if (!book) {
        const who = (curChar()?.name || '聊天').replace(/[\\/:*?"<>|]/g, '');
        book = `大总结-${who}-${today()}`;
        const names = WI.world_names || [];
        if (!names.includes(book)) {
            const ok = await WI.createNewWorldInfo(book, { interactive: false });
            if (ok === false) throw new Error('新建世界书失败');
        }
        c.chatMetadata.world_info = book;
        await c.saveMetadata?.();
    }
    const data = await WI.loadWorldInfo(book);
    if (!data || !data.entries) throw new Error('读不到世界书「' + book + '」');
    const count = Object.values(data.entries).filter((e) => /^大总结/.test(e.comment || '')).length;
    const from = sumAskAt ? sumAskAt - 1 : idx - 1;
    const title = `大总结 第${count + 1}次（到 ${Math.max(0, from)} 楼）`;
    const e = WI.createWorldInfoEntry(book, data);
    if (!e) throw new Error('新建条目失败');
    Object.assign(e, { comment: title, content: text, constant: true, selective: false, position: 1, order: 100 + count, key: [], disable: false });
    await WI.saveWorldInfo(book, data, true);
    try { await WI.updateWorldInfoList?.(); } catch { /* */ }
    return { book, title };
}

/* ---------------- 新手引导：顶栏按钮 + 任务清单 ---------------- */

function guessChannel() {
    const src = q1('#chat_completion_source')?.value || '';
    const url = q1('#custom_api_url_text')?.value || '';
    if (src === 'custom' && /deepseek/i.test(url)) return CHANNELS.deepseek;
    return Object.values(CHANNELS).find((x) => x.src === src && !x.fixedUrl) || CHANNELS.custom;
}
function startHelperSetup() { wizCh = guessChannel(); wizHelperOffer(); }

const presetName = () => String(OAI.oai_settings?.preset_settings_openai || '');
// [键, 名字, 说明, 做完了没, 带我做, 可选]
const START_STEPS = () => [
    ['lang', '切成中文', '后面框出来的按钮才看得懂', () => isChineseUI(), () => openWizard(), false],
    ['api', '连上 API', '酒馆本身不带 AI，要接一个', () => connected(), () => openWizard(), false],
    ['helper', '配好小助手', '看不懂、报错时能直接问它', () => hasAI(), () => { openWizard('blank'); startHelperSetup(); }, true],
    ['preset', '导入预设', '决定 AI 怎么写：文风、规则、长度', () => !!presetName() && !/^default$/i.test(presetName()), () => { openWizard('blank'); wizPreset(); }, false],
    ['card', '导入角色卡', '一张图片或一个 JSON', () => (ctx().characters || []).some((x) => !/seraphina/i.test(`${x.avatar} ${x.name}`)), () => { openWizard('blank'); wizCard(); }, false],
    ['script', '装酒馆助手', '很多前端卡、状态栏要用它，不装会爆代码', () => !!findInline(/酒馆助手|tavern ?helper|slash ?runner/i), () => { openWizard('blank'); wizScript(); }, true],
    ['regex', '认识正则', '全局、预设、局部三种，和两个允许开关', () => !!S().learned?.regex, () => { S().learned = { ...(S().learned || {}), regex: true }; save(); openWizard('blank'); runFlow('regex'); }, true],
    ['persona', '写 user 设定', '告诉 AI 你是谁，不写它会乱编', () => !!String(ctx().powerUserSettings?.persona_description || '').trim(), () => { openWizard('blank'); wizTeach('persona'); }, false],
    ['chat', '发出第一句话', '动作用星号，说话用引号', () => (ctx().chat || []).some((m) => m.is_user && !m.is_system), () => { openWizard('blank'); wizTeach('send'); }, false],
];
function startProgress() {
    const st = START_STEPS();
    const must = st.filter((x) => !x[5]);
    const ok = (x) => { try { return !!x[3](); } catch { return false; } };
    return { st, ok, done: st.filter(ok).length, mustLeft: must.filter((x) => !ok(x)).length };
}

function openStart() {
    closeOptionsMenu();
    const w = sheet('lf_start', '新手引导', '<div class="lf-st"></div>');
    const box = w.querySelector('.lf-st');
    const draw = () => {
        const { st, ok, done } = startProgress();
        const next = st.find((x) => !ok(x) && !x[5]) || st.find((x) => !ok(x));
        box.innerHTML = `<div class="lf-st-head"><div class="lf-st-bar"><i style="width:${Math.round(done / st.length * 100)}%"></i></div><span>完成 ${done} / ${st.length}</span></div>
            ${next ? `<button class="lf-btn lf-ck-fix lf-st-go" data-k="${next[0]}"><i class="fa-solid fa-play"></i> 下一步：${esc(next[1])}</button>` : '<div class="lf-ck-sum">都做完了，可以开始玩了。之后看不懂的，开“讲解”点哪讲哪；出问题了点“帮我查问题”。</div>'}
            <div class="lf-card lf-st-list">${st.map((x, i) => `<div class="lf-st-it${ok(x) ? ' done' : ''}">
                <span class="lf-st-no">${ok(x) ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
                <span class="lf-shot-t"><b>${esc(x[1])}${x[5] ? '<em>可选</em>' : ''}</b><small>${esc(x[2])}</small></span>
                <button class="lf-btn" data-k="${x[0]}">${ok(x) ? '再看看' : '带我做'}</button></div>`).join('')}</div>
            <div class="lf-inline"><button class="lf-btn lf-grow" data-a="hub"><i class="fa-solid fa-table-cells-large"></i> 全部功能</button><button class="lf-btn lf-grow" data-a="learn"><i class="fa-solid fa-graduation-cap"></i> 带我学别的</button></div>
            <div class="lf-inline"><button class="lf-btn lf-grow" data-a="hide"><i class="fa-solid fa-eye-slash"></i> 收起顶栏这个按钮</button></div>
            <small class="lf-muted">收起后，三条杠菜单里的“Love 修正机”还能打开；优化设置的「界面精简」里能把按钮开回来。</small>`;
    };
    draw();
    box.addEventListener('click', (e) => {
        const k = e.target.closest('[data-k]')?.dataset.k;
        if (k) { const it = START_STEPS().find((x) => x[0] === k); w.remove(); it?.[4](); return; }
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'hub') { w.remove(); openHub(); }
        if (a === 'all') { w.remove(); openWizard(); }
        if (a === 'learn') { w.remove(); openWizard('menu'); }
        if (a === 'hide') { S().fixes.ui_start_btn = false; save(); mountStartBtn(); renderPanel(); w.remove(); say('收起了。三条杠菜单里的“Love 修正机”还能打开'); }
    });
}

function mountStartBtn() {
    let b = document.getElementById('lf_start_btn');
    if (!on('ui_start_btn')) { b?.remove(); return; }
    if (!b) {
        b = document.createElement('div');
        b.id = 'lf_start_btn';
        b.title = 'Love 修正机：所有功能和新手引导';
        b.innerHTML = '<div class="drawer-icon fa-solid fa-route fa-fw interactable" tabindex="0"></div><span class="lf-dot"></span>';
        b.addEventListener('click', (e) => { e.stopPropagation(); openHub(); });
        const bar = document.getElementById('top-settings-holder');
        const right = document.getElementById('rightNavHolder');
        if (bar && right && right.parentElement === bar) bar.insertBefore(b, right);
        else if (bar) bar.appendChild(b);
        else { b.classList.add('lf-float'); document.body.appendChild(b); }
    }
    try { b.classList.toggle('todo', startProgress().mustLeft > 0); } catch { /* */ }
}

/* ---------------- 总入口：顶栏按钮打开，所有功能都在这 ---------------- */

async function openFixerSettings() {
    openDrawer('#extensions-settings-button');
    await sleep(450);
    const d = q1('#lf_panel .inline-drawer');
    const c = d?.querySelector('.inline-drawer-content');
    if (c && getComputedStyle(c).display === 'none') realClick(d.querySelector('.inline-drawer-header'));
    await sleep(250);
    d?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function openHub() {
    closeOptionsMenu();
    if (helperOn) setHelper(false);
    const { st, ok, done, mustLeft } = startProgress();
    const next = st.find((x) => !ok(x) && !x[5]) || st.find((x) => !ok(x));
    const d = timeData();
    const tk = chatTok.id && chatTok.id === (ctx().getCurrentChatId?.() || '') ? chatTok.n : 0;
    const errNow = lastErrAt && Date.now() - lastErrAt < 15 * 60 * 1000;
    const acts = {
        check: () => openCheckup(),
        optim: openOptimize,
        help: () => setHelper(!helperOn),
        ask: () => openAsk(),
        gloss: () => openGlossary(),
        learn: () => openWizard('menu'),
        quick: openQuick,
        sum: () => { openWizard('menu'); runFlow('summary'); },
    };
    const tile = (k, ic, n, ds, bd = '') => `<div class="lf-hub-t${bd ? ' rec' : ''}" data-go="${k}"><i class="fa-solid ${ic}"></i><b>${esc(n)}</b><small>${esc(ds)}</small>${bd ? `<em>${esc(bd)}</em>` : ''}</div>`;
    const startCard = mustLeft
        ? `<div class="lf-card lf-hub-first">
            <div class="lf-hub-badge">第一次用？先做这个</div>
            <div class="lf-cap">新手引导 <small>完成 ${done} / ${st.length}</small></div>
            <div class="lf-muted">还差 ${mustLeft} 步就能正常聊天了，我会把要点的地方用红框框出来。<b>下面的功能以后慢慢用，不急。</b></div>
            <div class="lf-st-bar"><i style="width:${Math.round(done / st.length * 100)}%"></i></div>
            <div class="lf-inline"><button class="lf-btn lf-grow lf-ck-fix lf-st-go" data-next="${next[0]}"><i class="fa-solid fa-play"></i> 下一步：${esc(next[1])}</button><button class="lf-btn" data-go="steps">全部步骤</button></div>
        </div>`
        : `<div class="lf-hub-done"><i class="fa-solid fa-circle-check"></i><span>新手引导做完了${next ? `（还有可选的：${esc(next[1])}）` : ''}</span><button class="lf-btn" data-go="steps">再看看</button></div>`;
    const w = sheet('lf_hub', 'Love 修正机', `${startCard}
        <div class="lf-hub-big">
            <div class="lf-hub-bt${errNow ? ' hot' : ''}" data-go="check"><i class="fa-solid fa-stethoscope"></i><b>帮我查问题</b><small>报错、没反应、回复不对劲</small>${errNow ? '<em>刚才有报错</em>' : ''}</div>
            <div class="lf-hub-bt" data-go="optim"><i class="fa-solid fa-sliders"></i><b>优化设置</b><small>一键优化，手机、电脑各有方案</small></div>
        </div>
        <div class="lf-hub-g"><div class="lf-hub-gt">看不懂？</div><div class="lf-hub-hint">界面上哪儿不认识，先开“讲解”点它。</div><div class="lf-hub-grid">
            ${tile('help', 'fa-circle-question', helperOn ? '关掉讲解' : '讲解', '开了以后点哪讲哪', helperOn ? '' : '先看这个')}
            ${tile('ask', 'fa-comment-dots', '问小助手', '直接打字问，什么都能问')}
            ${tile('gloss', 'fa-book-open', '词典', '黑话和功能介绍：破限、蓝灯绿灯、假流')}
            ${tile('learn', 'fa-graduation-cap', '带我学', '世界书、正则、备份、图文教程')}
        </div></div>
        <div class="lf-hub-g"><div class="lf-hub-gt">平时聊天</div><div class="lf-hub-grid">
            ${tile('quick', 'fa-bolt', '快捷台', '选卡、切聊天、换头像字体')}
            ${tile('sum', 'fa-layer-group', '做大总结', tk >= 100000 ? `已经约 ${fmtTok(tk)} token` : 'AI 开始失忆的时候', tk >= 100000 ? '该做了' : '')}
        </div></div>
        <div class="lf-hub-foot">${tk ? `这个聊天约 ${fmtTok(tk)} token · ` : ''}今天在线 ${dur(d.on)}${d.n ? ` · 平均每条等 ${dur(d.sum / d.n)}` : ''}<span>IF LOVE · ${VER}</span></div>`);
    w.querySelector('.lf-sheet-b').addEventListener('click', (e) => {
        const nx = e.target.closest('[data-next]');
        if (nx) { const it = START_STEPS().find((x) => x[0] === nx.dataset.next); w.remove(); it?.[4](); return; }
        const g = e.target.closest('[data-go]')?.dataset.go;
        if (!g) return;
        w.remove();
        if (g === 'steps') return openStart();
        acts[g]?.();
    });
}

/* ---------------- 三条杠菜单 ---------------- */

function mountOptions() {
    const box = document.querySelector('#options .options-content');
    if (!box || document.getElementById('lf_opt_hub')) return;
    const mk = (id, icon, text, fn) => {
        const a = document.createElement('a');
        a.id = id;
        a.innerHTML = `<i class="fa-lg fa-solid ${icon}"></i><span>${text}</span>`;
        a.addEventListener('click', () => { closeOptionsMenu(); fn(); });
        return a;
    };
    box.prepend(
        mk('lf_opt_hub', 'fa-route', 'Love 修正机', openHub),
        mk('lf_opt_help', 'fa-circle-question', helperOn ? '关掉讲解' : '讲解：点哪讲哪', () => setHelper(!helperOn)),
    );
}

/* ---------------- 启动 ---------------- */

let applied = false;
function boot() {
    if (applied) return;
    applied = true;
    applyAll();
    startWatchers();
    bindDraft();
    restoreDraft();
    applyAvatarOverride();
    renderAllWaits();
    const resume = localStorage.getItem('lf_wiz_resume');
    if (resume) { localStorage.removeItem('lf_wiz_resume'); wizLangAsked = true; setTimeout(() => openWizard(), 1500); }
    else if (S().wizardAsked && S().seenVer !== VER) setTimeout(() => queueNudge('ver', showVersionNote), 3500);
    else if (!S().wizardAsked) { S().wizardAsked = true; S().seenVer = VER; save(); setTimeout(() => { openWizard(); say('顶栏多了一个修正机按钮（路线图标）：新手引导、查问题、优化设置都在里面'); }, 1800); }
}

jQuery(async () => {
    S();
    patchToastr();
    mountPanel();
    mountOptions();
    const { eventSource, event_types: E } = ctx();
    eventSource.on(E.APP_READY, boot);
    setTimeout(boot, document.getElementById('send_textarea') && ctx().characters?.length ? 600 : 4000);
    eventSource.on(E.CHAT_CHANGED, () => { scheduleTokCount(2500); bindDraft(); restoreDraft(); applyAvatarOverride(); renderAllWaits(); hideTip(); setTimeout(checkCodeLeak, 1500); });
    eventSource.on(E.MESSAGE_SENT, () => localStorage.removeItem(draftKey()));
    eventSource.on(E.GENERATION_STARTED, onGenStarted);
    eventSource.on(E.MESSAGE_RECEIVED, (id) => { onMessageReceived(id); scheduleTokCount(); });
    eventSource.on(E.CHARACTER_MESSAGE_RENDERED, (id) => { renderWait(id); applyAvatarOverride(); setTimeout(checkCodeLeak, 800); });
    if (E.MORE_MESSAGES_LOADED) eventSource.on(E.MORE_MESSAGES_LOADED, () => { applyAvatarOverride(); renderAllWaits(); });
});

}
