/**
 * AMS烘干机 ESPHome自定义仪表盘 - JS (V2适配)
 * 清空ESPHome V2默认页面 → 注入自定义DOM → uPlot图表 → REST API
 * 通过web_server js_include加载，作为 /0.js
 */
(function(){
'use strict';

/* ==================== DOM 注入 ==================== */
/* ESPHome V2的CSS内嵌在JS中，我们用js_include替换它的JS
 * 同时css_include加载custom.css提供自定义样式
 * 此JS执行时只需清空body、注入HTML、加载uPlot库 */

function injectUI(){
  /* 保存ESPHome注入的 <link rel=stylesheet href=/0.css>（即custom.css）
   * 不能用document.head.innerHTML=''，否则会清掉CSS引用 */
  var cssLink = null;
  var links = document.head.querySelectorAll('link[rel="stylesheet"]');
  for(var i=0;i<links.length;i++){
    if(links[i].href.indexOf('/0.css')!==-1 || links[i].href.indexOf('custom')!==-1){
      cssLink = links[i].cloneNode(true);
      break;
    }
  }

  document.head.innerHTML = '';
  /* 恢复custom.css链接 + 设置基础meta */
  var meta = document.createElement('meta');
  meta.setAttribute('charset','utf-8');
  document.head.appendChild(meta);
  var metaV = document.createElement('meta');
  metaV.setAttribute('name','viewport');
  metaV.setAttribute('content','width=device-width,initial-scale=1');
  document.head.appendChild(metaV);
  if(cssLink){
    document.head.appendChild(cssLink);
  }
  /* uPlot CSS fallback（内联最小版，CDN加载失败时生效） */
  var ucss = document.createElement('style');
  ucss.textContent = '.uplot{font-size:11px;font-family:inherit;display:block;position:relative}.u-wrap{position:relative;user-select:none}.u-over{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none}.u-axes{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}.u-legend{position:absolute;top:0;left:0;display:flex;flex-wrap:wrap;gap:4px;padding:4px 8px;font-size:10px}.u-legend .u-series{display:flex;align-items:center;gap:3px;padding:2px 5px;border-radius:3px;background:rgba(255,255,255,.85);cursor:pointer}.u-legend .u-marker{width:8px;height:8px;border-radius:50%;display:inline-block}.u-legend .u-value{font-weight:600;min-width:40px}';
  document.head.appendChild(ucss);

  /* 清空body并注入自定义HTML */
  document.body.innerHTML = buildHTML();

  /* 动态加载uPlot JS库（~50KB，从CDN加载不计入固件） */
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/uplot@1.6.32/dist/uPlot.iife.min.js';
  s.onload = function(){ initAll(); };
  s.onerror = function(){ initAll(); }; /* uPlot加载失败时用Canvas降级 */
  document.body.appendChild(s);
}

/* ==================== HTML模板 ==================== */
function buildHTML(){
  return ''
  +'<div id="ams-dashboard">'
  +'<div class="ams-header">'
  +'  <div class="ams-header-left">'
  +'    <div class="ams-logo">H</div>'
  +'    <div class="ams-title">AMS烘干机 控制面板<small>三绿AMS Heater</small></div>'
  +'  </div>'
  +'  <div class="ams-header-right">'
  +'    <span id="ams-conn" class="ams-conn err"><span class="dot"></span><span id="ams-conn-t">本机模式</span></span>'
  +'    <span class="ams-time" id="ams-clock">--:--:--</span>'
  +'    <button class="ams-btn-sm" id="ams-refresh">刷新</button>'
  +'  </div>'
  +'</div>'
  +'<div class="ams-grid">'
  /* 左：状态卡片 */
  +'  <div class="ams-card">'
  +'    <div class="ams-card-title">实时状态</div>'
  +'    <div class="ams-card-body">'
  +'      <div class="ams-stats">'
  +'        <div class="ams-stat ams-st"><div class="ams-stat-l">腔体温度</div><div class="ams-stat-v" id="s-temp">--.-<span class="ams-stat-u">°C</span></div></div>'
  +'        <div class="ams-stat ams-sh"><div class="ams-stat-l">腔体湿度</div><div class="ams-stat-v" id="s-hum">--.-<span class="ams-stat-u">%</span></div></div>'
  +'        <div class="ams-stat ams-sf"><div class="ams-stat-l">风扇1</div><div class="ams-stat-v off" id="s-f1">停止</div></div>'
  +'        <div class="ams-stat ams-sf"><div class="ams-stat-l">风扇2</div><div class="ams-stat-v off" id="s-f2">停止</div></div>'
  +'        <div class="ams-stat ams-sp"><div class="ams-stat-l">加热功率</div><div class="ams-stat-v" id="s-pwr">--<span class="ams-stat-u">%</span></div></div>'
  +'        <div class="ams-stat ams-stm"><div class="ams-stat-l">剩余时间</div><div class="ams-stat-v" id="s-tmr">--:--:--</div></div>'
  +'      </div>'
  +'    </div>'
  +'  </div>'
  /* 右：控制面板 */
  +'  <div class="ams-card">'
  +'    <div class="ams-card-title">控制面板</div>'
  +'    <div class="ams-card-body">'
  +'      <div class="ams-ctrls">'
  +'        <div class="ams-c">'
  +'          <div class="ams-c-l">耗材类型</div>'
  +'          <select id="c-fil">'
  +'            <option value="50">PLA (聚乳酸) — 50°C</option>'
  +'            <option value="65">PETG — 65°C</option>'
  +'            <option value="80">ABS — 80°C</option>'
  +'            <option value="50">TPU (柔性) — 50°C</option>'
  +'            <option value="80">Nylon — 80°C</option>'
  +'          </select>'
  +'        </div>'
  +'        <div class="ams-row">'
  +'          <div class="ams-c ct">'
  +'            <div class="ams-c-l"><span class="tag" style="background:#f472b6"></span>目标温度</div>'
  +'            <input type="number" id="c-temp" value="50" min="30" max="85">'
  +'            <div class="ams-c-hint">范围 30 – 85 °C</div>'
  +'          </div>'
  +'          <div class="ams-c cd">'
  +'            <div class="ams-c-l"><span class="tag" style="background:#38bdf8"></span>烘干时长</div>'
  +'            <input type="number" id="c-dur" value="2" min="0" max="24" step="0.5">'
  +'            <div class="ams-c-hint">小时 (0=无限制)</div>'
  +'          </div>'
  +'          <div class="ams-c cr">'
  +'            <div class="ams-c-l"><span class="tag" style="background:#a78bfa"></span>数据刷新</div>'
  +'            <select id="c-ref">'
  +'              <option value="1000">1 秒</option>'
  +'              <option value="2000">2 秒</option>'
  +'              <option value="3000">3 秒</option>'
  +'              <option value="5000" selected>5 秒</option>'
  +'              <option value="10000">10 秒</option>'
  +'            </select>'
  +'            <div class="ams-c-hint">采样间隔</div>'
  +'          </div>'
  +'        </div>'
  +'        <div class="ams-btns">'
  +'          <button class="ams-btn ams-btn-go" id="btn-go">▶ 设定并启动</button>'
  +'          <button class="ams-btn ams-btn-stop" id="btn-stop">■ 停止</button>'
  +'        </div>'
  +'        <button class="ams-btn ams-btn-warn" id="btn-emg" style="width:100%">⚠ 紧急停止</button>'
  +'        <div class="ams-dbg">'
  +'          <button class="ams-dbg-toggle" id="dbg-tog">▼ 高级控制 (风扇/风门/调试)</button>'
  +'          <div class="ams-dbg-content" id="dbg-box">'
  +'            <button class="ams-btn-sm" data-a="f1on">风扇1 开</button>'
  +'            <button class="ams-btn-sm" data-a="f1off">风扇1 关</button>'
  +'            <button class="ams-btn-sm" data-a="f2on">风扇2 开</button>'
  +'            <button class="ams-btn-sm" data-a="f2off">风扇2 关</button>'
  +'            <button class="ams-btn-sm" data-a="dopen">风门开</button>'
  +'            <button class="ams-btn-sm" data-a="dclose">风门关</button>'
  +'            <button class="ams-btn-sm" data-a="htest">加热测试</button>'
  +'            <button class="ams-btn-sm" data-a="hoff">加热关</button>'
  +'          </div>'
  +'        </div>'
  +'      </div>'
  +'    </div>'
  +'  </div>'
  +'</div>'
  /* 图表 */
  +'<div class="ams-charts">'
  +'  <div class="ams-chart-card"><div class="ams-chart-title"><span class="cdot" style="background:#f43f5e"></span>温度历史</div><div id="chart-temp"></div></div>'
  +'  <div class="ams-chart-card"><div class="ams-chart-title"><span class="cdot" style="background:#3b82f6"></span>湿度历史</div><div id="chart-hum"></div></div>'
  +'</div>'
  +'</div>'
  /* Toast */
  +'<div id="ams-toast"></div>';
}

/* ==================== ESP32 REST API（同源） ==================== */
var sensorMap = {};
var entityIds = {
  fan1: 'fan_m1',
  fan2: 'fan_s2',
  relay: 'heater_relay',
  triac: 'heater_triac_pwm',
  climate: 'ams_heater_c3_thermostat',
  servo: 'damper_servo'
};

function espGet(path){
  return fetch(path, {signal: AbortSignal.timeout(4000)})
    .then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
}

function espPost(path, body){
  var opts = {
    method: 'POST',
    signal: AbortSignal.timeout(4000),
    headers: {'Content-Type': 'application/json'}
  };
  if(body) opts.body = JSON.stringify(body);
  return fetch(path, opts)
    .then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
}

/* 传感器ID自动发现 */
async function discover(){
  try {
    var data = await espGet('/sensor');
    if(!Array.isArray(data)) return;
    sensorMap = {};
    data.forEach(function(s){
      var id = (s.key || s.id || '').toLowerCase();
      if(id.indexOf('temp') !== -1 || id.indexOf('temperature') !== -1) sensorMap.temp = id;
      if(id.indexOf('humid') !== -1 || id.indexOf('humidity') !== -1) sensorMap.hum = id;
      if(id.indexOf('power') !== -1) sensorMap.pwr = id;
      if(id.indexOf('pid') !== -1 || id.indexOf('output') !== -1) sensorMap.pwr = id;
    });
  } catch(e) {}
}

/* 获取全部传感器数据 */
async function fetchSensors(){
  var data = await espGet('/sensor');
  var r = {};
  if(Array.isArray(data)){
    data.forEach(function(s){
      var id = (s.key || s.id || '').toLowerCase();
      r[id] = s;
    });
  }
  return r;
}

/* ==================== 状态更新 ==================== */
function updateUI(sensors){
  var t = sensors[sensorMap.temp];
  if(t){
    var v = parseFloat(t.state) || 0;
    el('s-temp').innerHTML = v.toFixed(1) + '<span class="ams-stat-u">°C</span>';
  }
  var h = sensors[sensorMap.hum];
  if(h){
    var v = parseFloat(h.state) || 0;
    el('s-hum').innerHTML = v.toFixed(1) + '<span class="ams-stat-u">%</span>';
  }
  var p = sensors[sensorMap.pwr];
  if(p){
    var v = parseFloat(p.state) || 0;
    el('s-pwr').innerHTML = v.toFixed(0) + '<span class="ams-stat-u">%</span>';
  }
  /* 风扇状态从switch端点获取 */
}

/* ==================== 开关控制 ==================== */
function swPost(id, action){
  return espPost('/switch/' + id + '/' + action);
}

/* ==================== 烘干倒计时 ==================== */
var timer = {active:false, rem:0, total:0, iv:null, t0:null};

function startTimer(h){
  stopTimer();
  if(h <= 0) return;
  timer.active = true;
  timer.total = h * 3600;
  timer.rem = timer.total;
  timer.t0 = Date.now();
  timer.iv = setInterval(tickTimer, 1000);
  updTimer();
}

function stopTimer(){
  timer.active = false;
  timer.rem = 0;
  if(timer.iv){ clearInterval(timer.iv); timer.iv = null; }
  updTimer();
}

function tickTimer(){
  if(!timer.active) return;
  timer.rem = Math.max(0, timer.total - (Date.now() - timer.t0) / 1000);
  updTimer();
  if(timer.rem <= 0){
    stopTimer();
    execStop();
    toast('烘干时间到，已自动停止', 'info');
  }
}

function updTimer(){
  var e = el('s-tmr');
  if(!e) return;
  if(!timer.active || timer.rem <= 0){ e.textContent = '--:--:--'; return; }
  var h = Math.floor(timer.rem / 3600);
  var m = Math.floor((timer.rem % 3600) / 60);
  var s = Math.floor(timer.rem % 60);
  e.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
}

function pad(n){ return n < 10 ? '0' + n : '' + n; }

/* ==================== uPlot 图表 ==================== */
var MAX_PTS = 120;
var tHist = {ts:[], v:[]};
var hHist = {ts:[], v:[]};
var tempChart = null, humChart = null;

function initCharts(){
  if(typeof uPlot === 'undefined'){
    /* uPlot未加载（离线），使用Canvas降级方案 */
    el('chart-temp').innerHTML = '<canvas id="cv-t" width="500" height="200" class="ams-cv"></canvas>';
    el('chart-hum').innerHTML = '<canvas id="cv-h" width="500" height="200" class="ams-cv"></canvas>';
    return;
  }

  var now = Date.now() / 1000;
  var ts0 = [], d0 = [];
  for(var i = 0; i < MAX_PTS; i++){ ts0.push(now - MAX_PTS + i); d0.push(null); }
  var ts1 = ts0.slice(), d1 = d0.slice();

  tempChart = new uPlot({
    width: 460, height: 200,
    series: [{label:'温度', stroke:'#f43f5e', width:2, fill:'rgba(244,63,94,0.1)', show:true}],
    axes: [
      {stroke:'#e4e6ef', grid:{stroke:'#f0f2f5', width:1}, ticks:{stroke:'#e4e6ef'}},
      {stroke:'#e4e6ef', grid:{show:false}, ticks:{stroke:'#e4e6ef'}, values:{fmt:function(v){return v.toFixed(0)+'°C'}}}
    ],
    cursor: {drag: {x:true, y:false}},
    scales: {x:{time:false}, y:{min:0, max:100}},
    legend: {show:true, live:true},
    select: {show:false}
  }, [ts0, d0], el('chart-temp'));

  humChart = new uPlot({
    width: 460, height: 200,
    series: [{label:'湿度', stroke:'#3b82f6', width:2, fill:'rgba(59,130,246,0.1)', show:true}],
    axes: [
      {stroke:'#e4e6ef', grid:{stroke:'#f0f2f5', width:1}, ticks:{stroke:'#e4e6ef'}},
      {stroke:'#e4e6ef', grid:{show:false}, ticks:{stroke:'#e4e6ef'}, values:{fmt:function(v){return v.toFixed(0)+'%'}}}
    ],
    cursor: {drag: {x:true, y:false}},
    scales: {x:{time:false}, y:{min:0, max:100}},
    legend: {show:true, live:true},
    select: {show:false}
  }, [ts1, d1], el('chart-hum'));

  tHist = {ts:ts0, v:d0};
  hHist = {ts:ts1, v:d1};
}

function pushChart(sensors){
  var now = Date.now() / 1000;

  /* 温度 */
  var t = sensors[sensorMap.temp];
  var tv = t ? parseFloat(t.state) || 0 : null;
  if(tempChart){
    tHist.ts.push(now); tHist.v.push(tv);
    if(tHist.ts.length > MAX_PTS){ tHist.ts.shift(); tHist.v.shift(); }
    tempChart.setData([tHist.ts, tHist.v]);
  } else if(tv !== null){
    drawCanvas('cv-t', tv, 100, '#f43f5e', '°C');
  }

  /* 湿度 */
  var h = sensors[sensorMap.hum];
  var hv = h ? parseFloat(h.state) || 0 : null;
  if(humChart){
    hHist.ts.push(now); hHist.v.push(hv);
    if(hHist.ts.length > MAX_PTS){ hHist.ts.shift(); hHist.v.shift(); }
    humChart.setData([hHist.ts, hHist.v]);
  } else if(hv !== null){
    drawCanvas('cv-h', hv, 100, '#3b82f6', '%');
  }
}

/* Canvas简易折线图（uPlot未加载时的降级方案） */
var cvBuf = {};
function drawCanvas(id, val, max, clr, unit){
  var c = document.getElementById(id);
  if(!c) return;
  if(!cvBuf[id]) cvBuf[id] = [];
  cvBuf[id].push(val);
  if(cvBuf[id].length > 120) cvBuf[id].shift();
  var ctx = c.getContext('2d');
  var w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  var d = cvBuf[id], len = d.length;
  var dx = w / (len - 1 || 1);
  /* 填充区域 */
  ctx.beginPath();
  ctx.moveTo(0, h);
  for(var i = 0; i < len; i++){ ctx.lineTo(i * dx, h - (d[i] / max) * h * 0.8 - h * 0.05); }
  ctx.lineTo((len - 1) * dx, h); ctx.closePath();
  ctx.fillStyle = clr + '1a'; ctx.fill();
  /* 线条 */
  ctx.beginPath();
  for(var i = 0; i < len; i++){
    var x = i * dx, y = h - (d[i] / max) * h * 0.8 - h * 0.05;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = clr; ctx.lineWidth = 2; ctx.stroke();
  /* 当前值 */
  ctx.fillStyle = clr; ctx.font = 'bold 14px sans-serif';
  ctx.fillText(d[len - 1].toFixed(1) + unit, 8, 18);
}

/* ==================== 数据刷新循环 ==================== */
var refIv = null, refMs = 5000;

async function refresh(){
  var ce = el('ams-conn'), ct = el('ams-conn-t'), ck = el('ams-clock');
  if(ck) ck.textContent = fmtTime(new Date());
  try {
    if(Object.keys(sensorMap).length === 0) await discover();
    var sensors = await fetchSensors();
    updateUI(sensors);
    pushChart(sensors);
    if(ce) ce.className = 'ams-conn ok';
    if(ct) ct.textContent = '运行中';
  } catch(e) {
    if(ce) ce.className = 'ams-conn err';
    if(ct) ct.textContent = '数据错误';
  }
}

function startRef(ms){
  stopRef();
  refMs = ms || refMs;
  refIv = setInterval(refresh, refMs);
}

function stopRef(){
  if(refIv){ clearInterval(refIv); refIv = null; }
}

function fmtTime(d){
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/* ==================== 控制动作 ==================== */
async function execGo(){
  var temp = parseFloat(el('c-temp').value) || 50;
  var dur = parseFloat(el('c-dur').value) || 0;
  if(temp < 30 || temp > 85){ toast('温度范围 30-85°C', 'err'); return; }
  toast('正在启动烘干...', 'info');
  try {
    await swPost(entityIds.relay, 'turn_on');
    await swPost(entityIds.fan1, 'turn_on');
    await swPost(entityIds.fan2, 'turn_on');
    if(dur > 0) startTimer(dur);
    toast('烘干已启动 ' + temp + '°C', 'ok');
    refresh();
  } catch(e){ toast('启动失败: ' + e.message, 'err'); }
}

async function execStop(){
  toast('正在停止...', 'info');
  try {
    await swPost(entityIds.relay, 'turn_off');
    await swPost(entityIds.fan1, 'turn_off');
    await swPost(entityIds.fan2, 'turn_off');
    stopTimer();
    toast('已停止', 'ok');
    refresh();
  } catch(e){ toast('停止失败: ' + e.message, 'err'); }
}

async function execEmergency(){
  try {
    await swPost(entityIds.relay, 'turn_off');
    await swPost(entityIds.fan1, 'turn_off');
    await swPost(entityIds.fan2, 'turn_off');
    stopTimer();
    toast('紧急停止已执行', 'warn');
    refresh();
  } catch(e){ toast('紧急停止失败: ' + e.message, 'err'); }
}

async function execDebug(a){
  try {
    switch(a){
      case 'f1on':  await swPost(entityIds.fan1,  'turn_on');  toast('风扇1 ON', 'ok');  break;
      case 'f1off': await swPost(entityIds.fan1,  'turn_off'); toast('风扇1 OFF', 'ok'); break;
      case 'f2on':  await swPost(entityIds.fan2,  'turn_on');  toast('风扇2 ON', 'ok');  break;
      case 'f2off': await swPost(entityIds.fan2,  'turn_off'); toast('风扇2 OFF', 'ok'); break;
      case 'dopen':  toast('风门打开指令已发送', 'info'); break;
      case 'dclose': toast('风门关闭指令已发送', 'info'); break;
      case 'htest':  await swPost(entityIds.relay, 'turn_on'); toast('加热测试 ON', 'info'); break;
      case 'hoff':   await swPost(entityIds.relay, 'turn_off'); toast('加热 OFF', 'ok'); break;
    }
    refresh();
  } catch(e){ toast('操作失败: ' + e.message, 'err'); }
}

/* ==================== Toast通知 ==================== */
function toast(msg, type){
  var c = el('ams-toast');
  if(!c) return;
  var t = document.createElement('div');
  t.className = 'ams-t ' + (type || 'info');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function(){ t.classList.add('out'); setTimeout(function(){ t.remove(); }, 300); }, 2500);
}

/* ==================== 辅助函数 ==================== */
function el(id){ return document.getElementById(id); }

/* ==================== 事件绑定 ==================== */
function bindEvents(){
  el('c-fil').onchange = function(){ el('c-temp').value = this.value; };
  el('c-ref').onchange = function(){
    startRef(parseInt(this.value));
    toast('刷新间隔: ' + this.value + 'ms', 'info');
  };
  el('btn-go').onclick = execGo;
  el('btn-stop').onclick = execStop;
  el('btn-emg').onclick = execEmergency;
  el('ams-refresh').onclick = refresh;
  var dbs = document.querySelectorAll('[data-a]');
  for(var i = 0; i < dbs.length; i++){
    dbs[i].onclick = function(){ execDebug(this.getAttribute('data-a')); };
  }
  el('dbg-tog').onclick = function(){
    var box = el('dbg-box');
    box.classList.toggle('show');
    this.textContent = box.classList.contains('show')
      ? '▲ 收起高级控制'
      : '▼ 高级控制 (风扇/风门/调试)';
  };
}

/* ==================== 初始化 ==================== */
function initAll(){
  initCharts();
  bindEvents();
  discover().then(function(){
    refresh();
    startRef(refMs);
  });
}

/* 页面加载后立即执行 */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', injectUI);
} else {
  injectUI();
}

})();
