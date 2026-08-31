// ===== 工具函数 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date();

// 本地存储封装
const Store = {
get(key, def) {
try { return JSON.parse(localStorage.getItem('kaogong_' + key)) || def; }
catch(e) { return def; }
},
set(key, val) { localStorage.setItem('kaogong_' + key, JSON.stringify(val)); },
};

// 考试倒计时日期（可修改）
let examDate = Store.get('examDate', '2026-12-05');

// ===== 页面导航 =====
function navigate(page) {
$$('.page').forEach(p => p.classList.remove('active'));
$('#page-' + page).classList.add('active');
$$('.nav-item').forEach(n => n.classList.remove('active'));
const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
if (navItem) navItem.classList.add('active');
renderPage(page);
window.scrollTo(0, 0);
}

// ===== 渲染各页面 =====
function renderPage(page) {
const el = $('#page-' + page);
if (el.dataset.rendered === '1') return; // 已渲染则跳过

switch(page) {
case 'yanyu': renderStudyPage(el, '言语理解', '🗣️', { quiz: true, quizData: QuizData.idioms, idiomBoard: true, formulas: null }); break;
case 'luoji': renderStudyPage(el, '逻辑判断', '🧩', { quiz: false, quizData: null, idiomBoard: false, formulas: 'logic' }); break;
case 'shuliang': renderStudyPage(el, '数量关系', '🔢', { quiz: false, quizData: null, idiomBoard: false, formulas: 'shuliang' }); break;
case 'ziliao': renderStudyPage(el, '资料分析', '📊', { quiz: false, quizData: null, idiomBoard: false, formulas: 'ziliao', baihuafen: true }); break;
case 'zhengzhi': renderStudyPage(el, '政治理论', '🏛️', { quiz: true, quizData: QuizData.politics, idiomBoard: false, formulas: null }); break;
case 'changshi': renderStudyPage(el, '常识判断', '🌍', { quiz: true, quizData: QuizData.commonsense, idiomBoard: false, formulas: null }); break;
case 'shenlun': renderShenlun(el); break;
case 'zonghe': renderZonghe(el); break;
case 'plan': renderPlan(el); break;
case 'calendar': renderCalendar(el); break;
case 'wrong': renderWrong(el); break;
case 'stats': renderStats(el); break;
}
el.dataset.rendered = '1';
}

// 学习类页面通用渲染
function renderStudyPage(el, title, icon, opts) {
let html = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>${icon} ${title}</h2>
<button class="btn-primary" style="margin-left:auto;padding:6px 14px;font-size:12px;" onclick="openPomodoro('${opts.quiz ? 'study' : 'study'}')">🍅 番茄钟</button>
</div>`;

// 番茄钟圆环
html += `
<div class="page-section tomato-section">
<h3>🍅 今日番茄钟</h3>
<div class="tomato-ring-container">
<svg viewBox="0 0 200 200">
<circle cx="100" cy="100" r="85" class="ring-bg"/>
<circle cx="100" cy="100" r="85" class="ring-progress" id="ring-${title}"/>
</svg>
<div class="ring-label">
<div class="ring-number" id="ringNum-${title}">0</div>
<div class="ring-text">个番茄</div>
</div>
</div>
<button class="tomato-btn" onclick="openPomodoro('${title}')">开始专注</button>
</div>`;

// 每日进度
const progress = getDailyProgress(title);
html += `
<div class="page-section">
<h3>📊 每日学习进度</h3>
<div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
<div class="progress-text">今日完成 <strong>${progress}%</strong> | 目标：4个番茄钟 / 或完成练习</div>
</div>`;

// 待办事项
html += `
<div class="page-section">
<h3>✅ 待办事项</h3>
<div class="todo-input-row">
<input class="todo-input" id="todoInput-${title}" placeholder="添加今日待办..." onkeypress="if(event.key==='Enter')addTodo('${title}')">
<button class="btn-add" onclick="addTodo('${title}')">添加</button>
</div>
<div id="todoList-${title}"></div>
</div>`;

// 题库（如果有）
if (opts.quiz) {
html += `
<div class="page-section">
<h3>📝 每日练习</h3>
<button class="btn-primary btn-full" onclick="startQuiz('${title}', '${opts.quizData === QuizData.idioms ? 'idioms' : opts.quizData === QuizData.politics ? 'politics' : 'commonsense'}')">开始答题（10题）</button>
</div>`;
}

// 成语辨析板块（言语理解专属）
if (opts.idiomBoard) {
html += `<div class="page-section"><h3>📚 成语辨析知识库</h3>`;
IdiomKnowledge.forEach(item => {
html += `<div class="idiom-pair"><div class="idiom-words">${item.word}</div><div class="idiom-desc">${item.desc}</div></div>`;
});
html += `</div>`;
}

// 公式板块
if (opts.formulas === 'shuliang') {
html += `<div class="page-section"><h3>📐 数量关系公式</h3>`;
FormulaData.shuliang.forEach(f => {
html += `<div class="formula-card"><div class="formula-title">${f.title}</div><div class="formula-body">${f.body.replace(/\n/g,'<br>')}</div></div>`;
});
html += `</div>`;
}
if (opts.formulas === 'ziliao') {
html += `<div class="page-section"><h3>📐 资料分析公式</h3>`;
FormulaData.ziliao.forEach(f => {
html += `<div class="formula-card"><div class="formula-title">${f.title}</div><div class="formula-body">${f.body.replace(/\n/g,'<br>')}</div></div>`;
});
html += `</div>`;
}
if (opts.formulas === 'logic') {
html += `<div class="page-section"><h3>🧠 逻辑判断技巧</h3>`;
LogicTips.forEach(f => {
html += `<div class="formula-card"><div class="formula-title">${f.title}</div><div class="formula-body">${f.body.replace(/\n/g,'<br>')}</div></div>`;
});
html += `</div>`;
}

// 百化分练习（资料分析专属）
if (opts.baihuafen) {
html += `
<div class="page-section">
<h3>🔢 百化分每日练习</h3>
<button class="btn-primary btn-full" onclick="startBaihuafen()">开始今日百化分练习</button>
</div>`;
}

el.innerHTML = html;
renderTodos(title);
updateTomatoRing(title);
}

// 申论页面
function renderShenlun(el) {
const quote = ShenlunQuotes[Math.floor(Math.random() * ShenlunQuotes.length)];
el.innerHTML = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>✍️ 申论</h2>
<button class="btn-primary" style="margin-left:auto;padding:6px 14px;font-size:12px;" onclick="openPomodoro('shenlun')">🍅 番茄钟</button>
</div>
<div class="page-section">
<h3>📊 今日学习进度</h3>
<div class="progress-bar"><div class="progress-bar-fill" style="width:${getDailyProgress('申论')}%"></div></div>
<div class="progress-text">今日完成 <strong>${getDailyProgress('申论')}%</strong></div>
</div>
<div class="page-section">
<h3>✅ 待办事项</h3>
<div class="todo-input-row">
<input class="todo-input" id="todoInput-申论" placeholder="添加今日待办..." onkeypress="if(event.key==='Enter')addTodo('申论')">
<button class="btn-add" onclick="addTodo('申论')">添加</button>
</div>
<div id="todoList-申论"></div>
</div>
<div class="page-section">
<h3>📝 小题练习</h3>
<button class="btn-primary btn-full" onclick="startQuiz('申论', 'commonsense')">开始小题练习（10题）</button>
<div class="hint-text">涵盖归纳概括、综合分析、提出对策等题型</div>
</div>
<div class="page-section">
<h3>🏆 今日大作文金句</h3>
<div class="golden-sentence">
<div class="gs-topic">【${quote.topic}】</div>
<div class="gs-text">${quote.text}</div>
</div>
<button class="btn-secondary btn-full" onclick="refreshQuote(this)">🔄 换一句</button>
</div>
`;
renderTodos('申论');
}

// 综合运用页面
function renderZonghe(el) {
el.innerHTML = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>🔗 综合运用</h2>
</div>
<div class="zonghe-grid">
<div class="zonghe-card" onclick="navigate('yanyu')">
<span class="zc-icon">🗣️</span><h4>言语理解</h4>
</div>
<div class="zonghe-card" onclick="navigate('luoji')">
<span class="zc-icon">🧩</span><h4>逻辑判断</h4>
</div>
<div class="zonghe-card" onclick="navigate('shuliang')">
<span class="zc-icon">🔢</span><h4>数量关系</h4>
</div>
<div class="zonghe-card" onclick="navigate('ziliao')">
<span class="zc-icon">📊</span><h4>资料分析</h4>
</div>
<div class="zonghe-card" onclick="navigate('zhengzhi')">
<span class="zc-icon">🏛️</span><h4>政治理论</h4>
</div>
<div class="zonghe-card" onclick="navigate('changshi')">
<span class="zc-icon">🌍</span><h4>常识判断</h4>
</div>
<div class="zonghe-card" onclick="navigate('shenlun')">
<span class="zc-icon">✍️</span><h4>申论</h4>
</div>
<div class="zonghe-card" onclick="showAllFormulas()">
<span class="zc-icon">📐</span><h4>全部公式速查</h4>
</div>
</div>
`;
}

// 今日计划
function renderPlan(el) {
el.innerHTML = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>📋 今日计划</h2>
</div>
<div class="page-section">
<h3>🕐 学习时间设置</h3>
<div class="time-input-row">
<div class="time-input-group">
<label>开始时间</label>
<input type="time" id="startTime" value="${Store.get('startTime','08:00')}" onchange="Store.set('startTime',this.value)">
</div>
<div class="time-input-group">
<label>结束时间</label>
<input type="time" id="endTime" value="${Store.get('endTime','22:00')}" onchange="Store.set('endTime',this.value)">
</div>
</div>
</div>
<div class="page-section">
<h3>📝 今日待办清单</h3>
<div class="todo-input-row">
<input class="todo-input" id="todoInput-plan" placeholder="添加计划..." onkeypress="if(event.key==='Enter')addTodo('plan')">
<button class="btn-add" onclick="addTodo('plan')">添加</button>
</div>
<div id="todoList-plan"></div>
</div>
<div class="page-section">
<h3>📊 今日各模块进度</h3>
${['言语理解','逻辑判断','数量关系','资料分析','政治理论','常识判断','申论'].map(m => `
<div style="margin-bottom:8px;">
<strong style="font-size:12px;">${m}</strong>
<div class="progress-bar"><div class="progress-bar-fill" style="width:${getDailyProgress(m)}%"></div></div>
</div>
`).join('')}
</div>
`;
renderTodos('plan');
}

// 打卡日历
function renderCalendar(el) {
const currentMonth = Store.get('calMonth', new Date().getMonth());
const currentYear = Store.get('calYear', new Date().getFullYear());
const checkins = Store.get('checkins', {}); // {date: {time: minutes}}

let html = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>📅 打卡日历</h2>
</div>
<div class="page-section">
<h3>📍 每日打卡</h3>
<div class="countdown-set">
<label>开始学习时间：</label><input type="time" value="${Store.get('startTime','08:00')}" onchange="Store.set('startTime',this.value)">
</div>
<div class="countdown-set">
<label>结束学习时间：</label><input type="time" value="${Store.get('endTime','22:00')}" onchange="Store.set('endTime',this.value)">
</div>
<button class="btn-primary btn-full" id="checkinBtnCal" onclick="doCheckin()">📍 今日打卡（每日限一次）</button>
<div class="hint-text">打卡时间：${checkins[today()] ? checkins[today()].time : '尚未打卡'}</div>
</div>
<div class="page-section">
<div class="calendar-header">
<span class="month-nav" onclick="changeMonth(-1)">‹</span>
<span class="current-month">${currentYear}年${currentMonth+1}月</span>
<span class="month-nav" onclick="changeMonth(1)">›</span>
</div>
<div class="calendar-grid" id="calGrid"></div>
</div>
`;
el.innerHTML = html;
renderCalGrid(currentMonth, currentYear);
}

function renderCalGrid(month, year) {
const grid = $('#calGrid');
if (!grid) return;
const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const checkins = Store.get('checkins', {});
const today_date = today();

let html = '';
['日','一','二','三','四','五','六'].forEach(d => {
html += `<div class="cal-day-header">${d}</div>`;
});
for (let i = 0; i < firstDay; i++) html += `<div></div>`;
for (let d = 1; d <= daysInMonth; d++) {
const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const isChecked = !!checkins[dateStr];
const isToday = dateStr === today_date;
const cls = `cal-day${isChecked ? ' checked' : ''}${isToday ? ' today' : ''}`;
html += `<div class="${cls}">${d}${isChecked ? '<br>✓' : ''}</div>`;
}
grid.innerHTML = html;
}

function changeMonth(delta) {
let m = Store.get('calMonth', new Date().getMonth());
let y = Store.get('calYear', new Date().getFullYear());
m += delta;
if (m > 11) { m = 0; y++; }
if (m < 0) { m = 11; y--; }
Store.set('calMonth', m);
Store.set('calYear', y);
renderCalendar($('#page-calendar'));
$('#page-calendar').dataset.rendered = '1';
renderCalendar($('#page-calendar'));
}

// 错题本
function renderWrong(el) {
const wrongs = Store.get('wrongs', []);
const cats = ['全部', '言语理解', '政治理论', '常识判断', '申论'];
const currentFilter = Store.get('wrongFilter', '全部');
let html = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>❌ 错题本</h2>
</div>
<div class="wrong-filter">
${cats.map(c => `<span class="filter-btn ${c===currentFilter?'active':''}" onclick="filterWrong('${c}')">${c}</span>`).join('')}
</div>
<div class="page-section">
<h3>📷 拍照/上传错题</h3>
<label class="upload-btn">
📷 拍照或从相册选择
<input type="file" accept="image/*" capture="camera" style="display:none;" onchange="uploadWrongImage(event)">
</label>
<div class="hint-text">支持拍照或从相册上传图片，自动添加到错题本</div>
</div>
<div id="wrongList"></div>
`;
el.innerHTML = html;
renderWrongList();
}

function renderWrongList() {
const wrongs = Store.get('wrongs', []);
const filter = Store.get('wrongFilter', '全部');
const list = $('#wrongList');
if (!list) return;
let filtered = wrongs;
if (filter !== '全部') filtered = wrongs.filter(w => w.cat === filter);

if (filtered.length === 0) {
list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span>暂无错题，继续加油！</div>`;
return;
}
list.innerHTML = filtered.map((w, i) => `
<div class="wrong-item">
<span class="wrong-del" onclick="deleteWrong(${wrongs.indexOf(w)})">🗑️</span>
<div class="wrong-cat">${w.cat}</div>
${w.image ? `<img src="${w.image}" style="max-width:100%;border-radius:8px;margin:6px 0;">` : ''}
<div class="wrong-q">${w.q}</div>
<div class="wrong-a">正确答案：${w.a}<br>${w.exp || ''}</div>
</div>
`).join('');
}

function filterWrong(cat) {
Store.set('wrongFilter', cat);
renderWrong($('#page-wrong'));
$('#page-wrong').dataset.rendered = '1';
renderWrong($('#page-wrong'));
}

function deleteWrong(idx) {
const wrongs = Store.get('wrongs', []);
wrongs.splice(idx, 1);
Store.set('wrongs', wrongs);
renderWrongList();
}

function uploadWrongImage(e) {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = function(ev) {
const wrongs = Store.get('wrongs', []);
wrongs.unshift({
cat: Store.get('wrongFilter', '全部') === '全部' ? '言语理解' : Store.get('wrongFilter', '全部'),
q: '图片上传错题',
a: '',
exp: '',
image: ev.target.result,
date: today()
});
Store.set('wrongs', wrongs);
renderWrongList();
};
reader.readAsDataURL(file);
}

// 学习统计
function renderStats(el) {
const pomoStats = Store.get('pomoStats', {}); // {date: count}
const checkins = Store.get('checkins', {});
const dates = Object.keys(pomoStats).sort();
const totalPomos = dates.reduce((s, d) => s + (pomoStats[d] || 0), 0);
const studyDays = dates.length;
const avgPomos = studyDays > 0 ? (totalPomos / studyDays).toFixed(1) : 0;

// 近7天数据
const last7 = [];
for (let i = 6; i >= 0; i--) {
const d = new Date();
d.setDate(d.getDate() - i);
const ds = d.toISOString().slice(0,10);
last7.push({ date: ds.slice(5), count: pomoStats[ds] || 0 });
}

const maxCount = Math.max(...last7.map(d => d.count), 1);

let html = `
<div class="page-header">
<span class="back-btn" onclick="navigate('home')">‹</span>
<h2>📈 学习统计</h2>
</div>
<div class="stats-row">
<div class="stat-card"><div class="stat-value">${totalPomos}</div><div class="stat-label">累计番茄钟</div></div>
<div class="stat-card"><div class="stat-value">${studyDays}</div><div class="stat-label">学习天数</div></div>
<div class="stat-card"><div class="stat-value">${avgPomos}</div><div class="stat-label">日均番茄</div></div>
<div class="stat-card"><div class="stat-value">${Object.keys(checkins).length}</div><div class="stat-label">打卡天数</div></div>
</div>
<div class="page-section">
<h3>📊 近7天番茄钟</h3>
<div style="display:flex;align-items:flex-end;gap:8px;height:140px;padding:10px 4px;">
${last7.map(d => `
<div style="flex:1;text-align:center;">
<div style="background:var(--primary-green);border-radius:4px 4px 0 0;height:${d.count/maxCount*100}px;min-height:4px;transition:height 0.5s;"></div>
<div style="font-size:9px;color:var(--text-light);margin-top:4px;">${d.date}</div>
<div style="font-size:11px;font-weight:700;color:var(--dark-green);">${d.count}</div>
</div>
`).join('')}
</div>
</div>
<div class="page-section">
<h3>⚙️ 数据管理</h3>
<button class="btn-secondary btn-full" onclick="resetDaily()">🔄 重置今日数据</button>
<button class="btn-secondary btn-full" style="margin-top:8px;" onclick="resetAll()">⚠️ 清空所有数据</button>
<div class="hint-text">数据保存在本地浏览器中，不会上传服务器</div>
</div>
`;
el.innerHTML = html;
}

// ===== 番茄钟 =====
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let currentModule = '';

function openPomodoro(module) {
currentModule = module;
$('#pomodoroModal').classList.add('active');
updateTodayPomoCount();
}

function closePomodoro() {
$('#pomodoroModal').classList.remove('active');
pauseTimer();
}

function startTimer() {
if (timerRunning) return;
timerRunning = true;
$('#timerStart').textContent = '暂停';
timerInterval = setInterval(() => {
timerSeconds--;
if (timerSeconds <= 0) {
completePomodoro();
return;
}
updateTimerDisplay();
}, 1000);
}

function pauseTimer() {
timerRunning = false;
$('#timerStart').textContent = '开始';
clearInterval(timerInterval);
}

function resetTimer() {
pauseTimer();
timerSeconds = 25 * 60;
updateTimerDisplay();
}

function updateTimerDisplay() {
const m = Math.floor(timerSeconds / 60);
const s = timerSeconds % 60;
$('#timerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function completePomodoro() {
pauseTimer();
timerSeconds = 25 * 60;
updateTimerDisplay();

// 记录
const pomoStats = Store.get('pomoStats', {});
pomoStats[today()] = (pomoStats[today()] || 0) + 1;
Store.set('pomoStats', pomoStats);

// 更新模块进度
updateModuleProgress(currentModule, 25); // 每个番茄钟贡献25%
updateTodayPomoCount();
updateHomeProgress();

alert('🎉 完成一个番茄钟！休息一下吧~');
}

function updateTodayPomoCount() {
const pomoStats = Store.get('pomoStats', {});
$('#todayPomos').textContent = pomoStats[today()] || 0;
}

// ===== 待办事项 =====
function addTodo(module) {
const input = $(`#todoInput-${module}`);
if (!input || !input.value.trim()) return;
const todos = Store.get(`todos_${module}`, []);
todos.push({ text: input.value.trim(), done: false });
Store.set(`todos_${module}`, todos);
input.value = '';
renderTodos(module);
updateHomeProgress();
}

function toggleTodo(module, idx) {
const todos = Store.get(`todos_${module}`, []);
todos[idx].done = !todos[idx].done;
Store.set(`todos_${module}`, todos);
renderTodos(module);
updateModuleProgress(module, null);
updateHomeProgress();
}

function deleteTodoItem(module, idx) {
const todos = Store.get(`todos_${module}`, []);
todos.splice(idx, 1);
Store.set(`todos_${module}`, todos);
renderTodos(module);
}

function renderTodos(module) {
const list = $(`#todoList-${module}`);
if (!list) return;
const todos = Store.get(`todos_${module}`, []);
if (todos.length === 0) {
list.innerHTML = '<div class="empty-state" style="padding:14px;">📝 暂无待办，添加一个吧！</div>';
return;
}
list.innerHTML = todos.map((t, i) => `
<div class="todo-item">
<span class="todo-check ${t.done?'checked':''}" onclick="toggleTodo('${module}',${i})">${t.done?'✓':''}</span>
<span class="todo-text ${t.done?'done':''}">${t.text}</span>
<span class="todo-delete" onclick="deleteTodoItem('${module}',${i})">✕</span>
</div>
`).join('');
}

// ===== 模块进度 =====
function getDailyProgress(module) {
const pomoStats = Store.get('pomoStats', {});
const todos = Store.get(`todos_${module}`, []);
const totalTodos = todos.length;
const doneTodos = todos.filter(t => t.done).length;
const pomoCount = pomoStats[today()] || 0;

let progress = 0;
if (pomoCount >= 4) progress += 50;
else progress += (pomoCount / 4) * 50;
if (totalTodos > 0) {
progress += (doneTodos / totalTodos) * 50;
} else {
progress += pomoCount > 0 ? 25 : 0;
}
return Math.min(Math.round(progress), 100);
}

function updateModuleProgress(module, pomoBonus) {
// 进度由getDailyProgress动态计算
updateHomeProgress();
}

// ===== 首页更新 =====
function updateHomeProgress() {
const modules = ['yanyu','luoji','shuliang','ziliao','zhengzhi','changshi','shenlun'];
const nameMap = { yanyu:'言语理解', luoji:'逻辑判断', shuliang:'数量关系', ziliao:'资料分析', zhengzhi:'政治理论', changshi:'常识判断', shenlun:'申论' };
modules.forEach(m => {
const el = $(`#progress-${m}`);
if (el) el.textContent = `今日进度 ${getDailyProgress(nameMap[m])}%`;
});
}

// ===== 倒计时 =====
function updateCountdown() {
const exam = new Date(examDate);
const now = new Date();
const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
const banner = $('#countdownBanner');
if (banner) {
banner.innerHTML = `
<span class="cd-icon">⏰</span>
<div>
<div class="cd-text">距离国考还有</div>
<div style="font-size:11px;color:#BF360C;">目标日：${examDate}</div>
</div>
<div class="cd-days">${diff > 0 ? diff : 0}天</div>
`;
}
}

// ===== 时钟 =====
function updateClock() {
const now = new Date();
const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const t = $('#desktopTime');
const d = $('#desktopDate');
if (t) t.textContent = timeStr;
if (d) d.textContent = dateStr;
}

// ===== 每日激励 =====
function updateDailyQuote() {
const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
const quote = DailyQuotes[dayOfYear % DailyQuotes.length];
const el = $('#dailyQuote');
if (el) el.textContent = `"${quote}"`;
}

// ===== 打卡 =====
function doCheckin() {
const checkins = Store.get('checkins', {});
if (checkins[today()]) {
alert('今天已经打卡过了，每天只能打卡一次哦~ 📍');
return;
}
const now = new Date();
const startTime = Store.get('startTime', '08:00');
const endTime = Store.get('endTime', '22:00');
checkins[today()] = {
time: `${startTime} - ${endTime}`,
checkinTime: now.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}),
pomos: Store.get('pomoStats', {})[today()] || 0
};
Store.set('checkins', checkins);
alert('🎉 打卡成功！今天也要加油哦~');
renderCalendar($('#page-calendar'));
$('#page-calendar').dataset.rendered = '1';
renderCalendar($('#page-calendar'));
}

// ===== 题库 =====
function startQuiz(module, dataType) {
const data = QuizData[dataType] || QuizData.idioms;
// 随机打乱，取10题
const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 10);
let currentQ = 0;
let score = 0;
const userAnswers = [];

const container = $('#quizContainer');
$('#quizModal').classList.add('active');

function renderQuestion() {
if (currentQ >= shuffled.length) {
renderResult();
return;
}
const item = shuffled[currentQ];
container.innerHTML = `
<div style="margin-bottom:12px;">
<span class="tag tag-green">第 ${currentQ+1}/${shuffled.length} 题</span>
<span class="tag tag-orange">${dataType === 'idioms' ? '成语辨析' : dataType === 'politics' ? '政治理论' : dataType === 'commonsense' ? '常识判断' : '申论'}</span>
</div>
<div class="quiz-question">
<div class="quiz-q-text">${item.q.replace(/\n/g,'<br>')}</div>
${item.options.map((opt, i) => `<div class="quiz-option" data-idx="${i}" onclick="selectOption(${i})">${String.fromCharCode(65+i)}. ${opt}</div>`).join('')}
</div>
<button class="btn-primary btn-full" id="quizSubmit" onclick="submitAnswer()" disabled>提交答案</button>
`;
}

window.selectOption = function(idx) {
$$('.quiz-option').forEach(o => o.classList.remove('selected'));
document.querySelector(`.quiz-option[data-idx="${idx}"]`).classList.add('selected');
$('#quizSubmit').disabled = false;
window._currentAnswer = idx;
};

window.submitAnswer = function() {
const item = shuffled[currentQ];
const selected = window._currentAnswer;
const isCorrect = selected === item.answer;
if (isCorrect) score++;

// 保存到错题本（如果答错）
if (!isCorrect) {
const wrongs = Store.get('wrongs', []);
wrongs.unshift({
cat: dataType === 'idioms' ? '言语理解' : dataType === 'politics' ? '政治理论' : dataType === 'commonsense' ? '常识判断' : '申论',
q: item.q,
a: String.fromCharCode(65 + item.answer) + '. ' + item.options[item.answer],
exp: item.explanation,
date: today()
});
Store.set('wrongs', wrongs);
}

// 显示解析
container.innerHTML = `
<div class="quiz-question">
<div class="quiz-q-text">${item.q.replace(/\n/g,'<br>')}</div>
${item.options.map((opt, i) => `<div class="quiz-option ${i === item.answer ? 'correct' : (i === selected ? 'wrong' : '')}">${String.fromCharCode(65+i)}. ${opt}</div>`).join('')}
</div>
<div class="page-section" style="border-left:4px solid var(--primary-green);">
<h3>📖 答案解析</h3>
<div style="font-size:12px;line-height:1.7;color:var(--text-medium);">
<strong>正确答案：${String.fromCharCode(65+item.answer)}</strong><br>
${item.explanation}
</div>
</div>
<button class="btn-primary btn-full" onclick="nextQuestion()">${currentQ < shuffled.length-1 ? '下一题' : '查看结果'}</button>
${isCorrect ? '<div style="text-align:center;color:#4CAF50;margin-top:8px;font-weight:700;">✅ 回答正确！</div>' : '<div style="text-align:center;color:#EF5350;margin-top:8px;font-weight:700;">❌ 已加入错题本</div>'}
`;
}

window.nextQuestion = function() {
currentQ++;
renderQuestion();
};

function renderResult() {
container.innerHTML = `
<div style="text-align:center;padding:20px;">
<div style="font-size:50px;margin-bottom:10px;">${score >= 7 ? '🎉' : score >= 4 ? '👍' : '💪'}</div>
<h2 style="color:var(--dark-green);margin-bottom:8px;">练习完成！</h2>
<div style="font-size:36px;font-weight:800;color:var(--primary-green);margin:14px 0;">${score}/${shuffled.length}</div>
<div style="font-size:14px;color:var(--text-medium);margin-bottom:20px;">
正确率：${Math.round(score/shuffled.length*100)}%
</div>
<div class="progress-bar"><div class="progress-bar-fill" style="width:${score/shuffled.length*100}%"></div></div>
<div style="margin-top:16px;">
<button class="btn-primary" onclick="closeQuiz();startQuiz('${module}','${dataType}')">🔄 再做一遍</button>
<button class="btn-secondary" onclick="closeQuiz()" style="margin-left:10px;">关闭</button>
</div>
</div>
`;
// 更新模块进度
updateModuleProgress(module);
};

renderQuestion();
}

// 百化分练习
function startBaihuafen() {
const shuffled = [...BaihuafenData].sort(() => Math.random() - 0.5).slice(0, 10);
let currentQ = 0;
let score = 0;

const container = $('#quizContainer');
$('#quizModal').classList.add('active');

function renderBF() {
if (currentQ >= shuffled.length) {
container.innerHTML = `
<div style="text-align:center;padding:20px;">
<h2 style="color:var(--dark-green);margin-bottom:14px;">百化分练习完成！</h2>
<div style="font-size:36px;font-weight:800;color:var(--primary-green);">${score}/${shuffled.length}</div>
<button class="btn-primary btn-full" style="margin-top:16px;" onclick="closeQuiz();startBaihuafen()">🔄 再来一组</button>
<button class="btn-secondary btn-full" style="margin-top:8px;" onclick="closeQuiz()">关闭</button>
</div>
`;
return;
}
const item = shuffled[currentQ];
container.innerHTML = `
<div style="margin-bottom:10px;">
<span class="tag tag-green">百化分 ${currentQ+1}/${shuffled.length}</span>
</div>
<div class="baihuafen-item">
<div class="bf-question">${item.q}</div>
<input type="text" id="bfAnswer" placeholder="输入答案" style="width:120px;border:1.5px solid #C8E6C9;border-radius:8px;padding:8px 12px;font-size:14px;text-align:center;">
</div>
<button class="btn-primary btn-full" onclick="submitBF('${item.a.replace(/'/g,"\\'")}')">提交</button>
`;
setTimeout(() => $('#bfAnswer')?.focus(), 100);
}

window.submitBF = function(correct) {
const input = $('#bfAnswer');
const userAns = input.value.trim().replace(/\s/g,'');
const correctAns = correct.replace(/\s/g,'');
const isCorrect = userAns === correctAns || userAns === correctAns.replace('%','');
if (isCorrect) score++;

container.innerHTML = `
<div class="baihuafen-item">
<div class="bf-question">${shuffled[currentQ].q}</div>
<div style="font-size:16px;font-weight:700;color:${isCorrect?'var(--primary-green)':'#EF5350'};">
${isCorrect ? '✅ 正确！' : '❌ 正确答案：' + correct}
</div>
</div>
<button class="btn-primary btn-full" onclick="nextBF()">${currentQ < shuffled.length-1 ? '下一题' : '查看结果'}</button>
`;
};

window.nextBF = function() {
currentQ++;
renderBF();
};

renderBF();
}

// 申论换金句
function refreshQuote(btn) {
const quote = ShenlunQuotes[Math.floor(Math.random() * ShenlunQuotes.length)];
const section = btn.closest('.page-section');
section.querySelector('.golden-sentence').innerHTML = `
<div class="gs-topic">【${quote.topic}】</div>
<div class="gs-text">${quote.text}</div>
`;
}

// 关闭弹窗
function closeQuiz() {
$('#quizModal').classList.remove('active');
}

// ===== 重置数据 =====
function resetDaily() {
if (!confirm('确定要重置今日数据吗？')) return;
const modules = ['言语理解','逻辑判断','数量关系','资料分析','政治理论','常识判断','申论','plan'];
modules.forEach(m => Store.set(`todos_${m}`, []));
// 不清空番茄钟和打卡记录（跨日自动处理）
updateHomeProgress();
alert('今日数据已重置！');
location.reload();
}

function resetAll() {
if (!confirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！')) return;
localStorage.clear();
alert('所有数据已清空！');
location.reload();
}

// ===== 公式速查 =====
function showAllFormulas() {
$('#page-zonghe').dataset.rendered = '0';
renderZonghe($('#page-zonghe'));
}

// ===== 初始化 =====
function init() {
// 导航绑定
$$('.nav-item').forEach(item => {
item.addEventListener('click', () => navigate(item.dataset.page));
});

// 模块卡片点击
$$('.module-card').forEach(card => {
card.addEventListener('click', () => {
const target = card.dataset.target;
// 映射到正确的页面名
const map = { yanyu:'yanyu', luoji:'luoji', shuliang:'shuliang', ziliao:'ziliao', zhengzhi:'zhengzhi', changshi:'changshi', shenlun:'shenlun' };
navigate(map[target] || target);
});
});

// 番茄钟按钮
$('#timerStart').addEventListener('click', () => {
if (timerRunning) pauseTimer();
else startTimer();
});
$('#timerReset').addEventListener('click', resetTimer);

// 首页打卡
$('#desktopCheckin').addEventListener('click', doCheckin);

// 倒计时设置 - 允许修改
const savedExam = Store.get('examDate', null);
if (savedExam) examDate = savedExam;

// 初始化时钟
updateClock();
setInterval(updateClock, 1000);
updateCountdown();
updateDailyQuote();
updateHomeProgress();

// 初始渲染首页
renderPage('home');

// 检查今日是否已打卡（更新按钮状态）
const checkins = Store.get('checkins', {});
if (checkins[today()]) {
$('#desktopCheckin').textContent = '✅ 已打卡';
$('#desktopCheckin').classList.add('checked');
}
}

document.addEventListener('DOMContentLoaded', init);
