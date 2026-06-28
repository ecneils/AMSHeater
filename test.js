/**
 * AMS烘干机 ESPHome自定义仪表盘 - JS (V2修复版)
 * 修复: 1)实体ID用object_id而非id 2)兼容旧浏览器fetch 3)增加诊断功能
 */
(function(){
'use strict';

/* ========== 工具函数 ========== */
function el(id){ return document.getElementById(id); }
function pad(n){ return n<10?'0'+n:''+n; }

/* 带超时的fetch（兼容旧浏览器） */
function fetchTimeout(url, opts, ms){
  ms = ms || 5000;
  opts = opts || {};
  return new Promise(function(resolve, reject){
    var timer = setTimeout(function(){ reject(new Error('TIMEOUT')); }, ms);
    fetch(url, opts).then(function(r){ clearTimeout(timer); resolve(r); }, function(e){ clearTimeout(timer); reject(e); });
  });
}

function espGet(path){ return fetchTimeout(path,{},5000).then(function(r){ if(!r.ok) throw new Error('HTTP'+r.status); return r.json(); }); }
function espPost(path){ return fetchTimeout(path,{method:'POST'},5000).then(function(r){ if(!r.ok) throw new Error('HTTP'+r.status); return r.text(); }); }

/* ========== 实体发现与管理 ========== */
var allEntities = {};   /* domain -> {object_id: entity} */
var sensorMap = {};     /* temp/hum/pwr -> object_id */
var switchMap = {};     /* fan1/fan2/relay -> object_id */
var climateId = null;
var servoId = null;
var discoveryDone = false;

/* 从name猜测object_id（ESPHome规则：slugify name） */
function slugify(name){
  if(!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').replace(/_+/g,'_');
}

/* 尝试从多种字段获取标识符 */
function getId(e){
  return e.object_id || e.id || e.key || e.entity_id || slugify(e.name) || '';
}

/* 传感器发现 */
async function discover(){
  try {
    var data = await espGet('/sensor');
    if(!Array.isArray(data)){ console.warn('/sensor 返回非数组:', data); return; }
    allEntities.sensor = {};
    data.forEach(function(s){
      var id = getId(s).toLowerCase();
      allEntities.sensor[id] = s;
      /* 匹配温度传感器 */
      if(id.indexOf('temp')!==-1 || id.indexOf('chamber_temp')!==-1 || (s.name||'').toLowerCase().indexOf('temp')!==-1)
        sensorMap.temp = id;
      /* 匹配湿度传感器 */
      if(id.indexOf('humid')!==-1 || id.indexOf('chamber_hum')!==-1 || (s.name||'').toLowerCase().indexOf('humid')!==-1)
        sensorMap.hum = id;
      /* 匹配功率 */
      if(id.indexOf('power')!==-1 || id.indexOf('pid')!==-1 || id.indexOf('output')!==-1 || (s.name||'').toLowerCase().indexOf('power')!==-1)
        sensorMap.pwr = id;
    });
    console.log('[发现] 传感器:', Object.keys(allEntities.sensor));
    console.log('[映射] sensorMap:', sensorMap);
  } catch(e) { console.error('传感器发现失败:', e.message); }

  /* 发现开关 */
  try {
    var data = await espGet('/switch');
    if(!Array.isArray(data)) return;
    allEntities.switch = {};
    data.forEach(function(s){
      var id = getId(s).toLowerCase();
      allEntities.switch[id] = s;
      if(id.indexOf('fan1')!==-1 || id.indexOf('fan_m1')!==-1 || (s.name||'').toLowerCase().indexOf('fan1')!==-1) switchMap.fan1 = id;
      if(id.indexOf('fan2')!==-1 || id.indexOf('fan_s2')!==-1 || (s.name||'').toLowerCase().indexOf('fan2')!==-1) switchMap.fan2 = id;
      if(id.indexOf('relay')!==-1 || id.indexOf('heater')!==-1 || (s.name||'').toLowerCase().indexOf('relay')!==-1) switchMap.relay = id;
    });
    console.log('[发现] 开关:', Object.keys(allEntities.switch));
    console.log('[映射] switchMap:', switchMap);
  } catch(e) { console.error('开关发现失败:', e.message); }

  /* 发现climate */
  try {
    var data = await espGet('/climate');
    if(Array.isArray(data) && data.length>0){
      climateId = getId(data[0]);
      allEntities.climate = {};
      data.forEach(function(c){ allEntities.climate[getId(c)] = c; });
      console.log('[发现] Climate:', climateId);
    }
  } catch(e) {}

  /* 发现servo */
  try {
    var data = await espGet('/servo');
    if(Array.isArray(data) && data.length>0){
      servoId = getId(data[0]);
      console.log('[发现] Servo:', servoId);
    }
  } catch(e) {}

  discoveryDone = true;
}

/* ========== 状态更新 ========== */
function updateUI(){
  var sensors = allEntities.sensor || {};

  /* 温度 */
  var t = sensors[sensorMap.temp];
  if(t && t.state!==undefined && t.state!=='unknown' && t.state!=='unavailable'){
    var v = parseFloat(t.state);
    if(!isNaN(v)) el('s-temp').innerHTML = v.toFixed(1) + '<span class="ams-stat-u">°C</span>';
  }
  /* 湿度 */
  var h = sensors[sensorMap.hum];
  if(h && h.state!==undefined && h.state!=='unknown' && h.state!=='unavailable'){
    var v = parseFloat(h.state);
    if(!isNaN(v)) el('s-hum').innerHTML = v.toFixed(1) + '<span class="ams-stat-u">%</span>';
  }
  /* 功率 */
  var p = sensors[sensorMap.pwr];
  if(p && p.state!==undefined && p.state!=='unknown' && p.state!=='unavailable'){
    var v = parseFloat(p.state);
    if(!isNaN(v)) el('s-pwr').innerHTML = v.toFixed(0) + '<span class="ams-stat-u">%</span>';
  }

  /* 风扇状态 */
  var sw = allEntities.switch || {};
  var f1 = sw[switchMap.fan1];
  if(f1){
    var on = f1.state==='ON' || f1.state===true || f1.value===true;
    el('s-f1').textContent = on ? '运转' : '停止';
    el('s-f1').className = on ? 'ams-stat-v' : 'ams-stat-v off';
  }
  var f2 = sw[switchMap.fan2];
  if(f2){
    var on = f2.state==='ON' || f2.state===true || f2.value===true;
    el('s-f2').textContent = on ? '运转' : '停止';
    el('s-f2').className = on ? 'ams-stat-v' : 'ams-stat-v off';
  }
}

/* ========== 刷新数据 ========== */
async function refresh(){
  var ce = el('ams-conn'), ct = el('ams-conn-t'), ck = el('ams-clock');
  if(ck) ck.textContent = fmtTime(new Date());

  if(!discoveryDone){
    if(ct) ct.textContent = '发现中...';
    if(ce) ce.className = 'ams-conn wait';
    await discover();
  }

  try {
    /* 刷新传感器 */
    var sData = await espGet('/sensor');
    if(Array.isArray(sData)){
      allEntities.sensor = {};
      sData.forEach(function(e){ allEntities.sensor[getId(e).toLowerCase()] = e; });
    }
    /* 刷新开关 */
    var swData = await espGet('/switch');
    if(Array.isArray(swData)){
      allEntities.switch = {};
      swData.forEach(function(e){ allEntities.switch[getId(e).toLowerCase()] = e; });
    }
    updateUI();
    pushChart();
    if(ce) ce.className = 'ams-conn ok';
    if(ct) ct.textContent = '运行中';
  } catch(e) {
    console.error('刷新失败:', e.message);
    if(ce) ce.className = 'ams-conn err';
    if(ct) ct.textContent = '数据错误(' + e.message + ')';
  }
}

/* ========== 控制动作 ========== */
async function swAction(which, action){
  var id = switchMap[which];
  if(!id) throw new Error(which + ' 未发现');
  return espPost('/switch/' + id + '/' + action);
}

async function execGo(){
  var temp = parseFloat(el('c-temp').value) || 50;
  var dur = parseFloat(el('c-dur').value) || 0;
  if(temp<30 || temp>85){ toast('温度范围 30-85°C','err'); return; }
  toast('正在启动...','info');
  try {
    await swAction('relay','turn_on');
    await swAction('fan1','turn_on');
    await swAction('fan2','turn_on');
    if(dur>0) startTimer(dur);
    toast('已启动 ' + temp + '°C','ok');
    setTimeout(refresh, 500);
  } catch(e){ toast('启动失败: ' + e.message,'err'); console.error(e); }
}

async function execStop(){
  toast('正在停止...','info');
  try {
    await swAction('relay','turn_off');
    await swAction('fan1','turn_off');
    await swAction('fan2','turn_off');
    stopTimer();
    toast('已停止','ok');
    setTimeout(refresh, 500);
  } catch(e){ toast('停止失败: ' + e.message,'err'); console.error(e); }
}

async function execEmergency(){
  try {
    await swAction('relay','turn_off');
    await swAction('fan1','turn_off');
    await swAction('fan2','turn_off');
    stopTimer();
    toast('紧急停止已执行','warn');
    setTimeout(refresh, 500);
  } catch(e){ toast('紧急停止失败: ' + e.message,'err'); }
}

async function execDebug(a){
  try {
    switch(a){
      case 'f1on':  await swAction('fan1','turn_on');  toast('风扇1 ON','ok'); break;
      case 'f1off': await swAction('fan1','turn_off'); toast('风扇1 OFF','ok'); break;
      case 'f2on':  await swAction('fan2','turn_on');  toast('风扇2 ON','ok'); break;
      case 'f2off': await swAction('fan2','turn_off'); toast('风扇2 OFF','ok'); break;
      case 'dopen':  toast('风门打开指令','info'); break;
      case 'dclose': toast('风门关闭指令','info'); break;
      case 'htest':  await swAction('relay','turn_on'); toast('加热测试 ON','info'); break;
      case 'hoff':   await swAction('relay','turn_off'); toast('加热 OFF','ok'); break;
      case 'diag':   runDiagnostics(); break;
    }
    setTimeout(refresh, 500);
  } catch(e){ toast('操作失败: ' + e.message,'err'); }
}

/* ========== 诊断功能 ========== */
function runDiagnostics(){
  var lines = [];
  lines.push('=== 传感器 (' + Object.keys(allEntities.sensor||{}).length + ') ===');
  for(var k in (allEntities.sensor||{})){
    var s = allEntities.sensor[k];
    lines.push(k + ' = ' + s.state + ' (' + (s.name||'') + ')');
  }
  lines.push('=== 开关 (' + Object.keys(allEntities.switch||{}).length + ') ===');
  for(var k in (allEntities.switch||{})){
    var s = allEntities.switch[k];
    lines.push(k + ' = ' + s.state + ' (' + (s.name||'') + ')');
  }
  lines.push('=== 映射 ===');
  lines.push('temp=' + (sensorMap.temp||'未匹配'));
  lines.push('hum=' + (sensorMap.hum||'未匹配'));
  lines.push('pwr=' + (sensorMap.pwr||'未匹配'));
  lines.push('fan1=' + (switchMap.fan1||'未匹配'));
  lines.push('fan2=' + (switchMap.fan2||'未匹配'));
  lines.push('relay=' + (switchMap.relay||'未匹配'));
  console.log(lines.join('\n'));
  toast(lines.slice(0,6).join(' | '), 'info');
}

/* ========== 烘干计时 ========== */
var timer={active:false,rem:0,total:0,iv:null,t0:null};
function startTimer(h){ stopTimer(); if(h<=0)return; timer.active=true; timer.total=h*3600; timer.rem=timer.total; timer.t0=Date.now(); timer.iv=setInterval(tickTimer,1000); updTimer(); }
function stopTimer(){ timer.active=false; timer.rem=0; if(timer.iv){clearInterval(timer.iv);timer.iv=null} updTimer(); }
function tickTimer(){ if(!timer.active)return; timer.rem=Math.max(0,timer.total-(Date.now()-timer.t0)/1000); updTimer(); if(timer.rem<=0){stopTimer();execStop();toast('烘干时间到，已自动停止','info');} }
function updTimer(){ var e=el('s-tmr'); if(!e)return; if(!timer.active||timer.rem<=0){e.textContent='--:--:--';return;} var h=Math.floor(timer.rem/3600),m=Math.floor((timer.rem%3600)/60),s=Math.floor(timer.rem%60); e.textContent=pad(h)+':'+pad(m)+':'+pad(s); }

/* ========== uPlot 图表 ========== */
var MAX_PTS=120;
var tHist={ts:[],v:[]}, hHist={ts:[],v:[]};
var tempChart=null, humChart=null;

function initCharts(){
  if(typeof uPlot==='undefined'){
    el('chart-temp').innerHTML='<canvas id="cv-t" width="500" height="200" class="ams-cv"></canvas>';
    el('chart-hum').innerHTML='<canvas id="cv-h" width="500" height="200" class="ams-cv"></canvas>';
    return;
  }
  var now=Date.now()/1000;
  var ts0=[],d0=[];
  for(var i=0;i<MAX_PTS;i++){ts0.push(now-MAX_PTS+i);d0.push(null);}
  var ts1=ts0.slice(),d1=d0.slice();
  tempChart=new uPlot({width:460,height:200,series:[{label:'温度',stroke:'#f43f5e',width:2,fill:'rgba(244,63,94,0.1)',show:true}],axes:[{stroke:'#e4e6ef',grid:{stroke:'#f0f2f5',width:1},ticks:{stroke:'#e4e6ef'}},{stroke:'#e4e6ef',grid:{show:false},ticks:{stroke:'#e4e6ef'},values:{fmt:function(v){return v.toFixed(0)+'°C'}}}],cursor:{drag:{x:true,y:false}},scales:{x:{time:false},y:{min:0,max:100}},legend:{show:true,live:true},select:{show:false}},[ts0,d0],el('chart-temp'));
  humChart=new uPlot({width:460,height:200,series:[{label:'湿度',stroke:'#3b82f6',width:2,fill:'rgba(59,130,246,0.1)',show:true}],axes:[{stroke:'#e4e6ef',grid:{stroke:'#f0f2f5',width:1},ticks:{stroke:'#e4e6ef'}},{stroke:'#e4e6ef',grid:{show:false},ticks:{stroke:'#e4e6ef'},values:{fmt:function(v){return v.toFixed(0)+'%'}}}],cursor:{drag:{x:true,y:false}},scales:{x:{time:false},y:{min:0,max:100}},legend:{show:true,live:true},select:{show:false}},[ts1,d1],el('chart-hum'));
  tHist={ts:ts0,v:d0}; hHist={ts:ts1,v:d1};
}

function pushChart(){
  var now=Date.now()/1000;
  var sensors=allEntities.sensor||{};
  var t=sensors[sensorMap.temp];
  var tv=t?parseFloat(t.state)||0:null;
  if(tempChart){ tHist.ts.push(now);tHist.v.push(tv); if(tHist.ts.length>MAX_PTS){tHist.ts.shift();tHist.v.shift();} tempChart.setData([tHist.ts,tHist.v]); }
  else if(tv!==null) drawCanvas('cv-t',tv,100,'#f43f5e','°C');
  var h=sensors[sensorMap.hum];
  var hv=h?parseFloat(h.state)||0:null;
  if(humChart){ hHist.ts.push(now);hHist.v.push(hv); if(hHist.ts.length>MAX_PTS){hHist.ts.shift();hHist.v.shift();} humChart.setData([hHist.ts,hHist.v]); }
  else if(hv!==null) drawCanvas('cv-h',hv,100,'#3b82f6','%');
}

/* Canvas降级 */
var cvBuf={};
function drawCanvas(id,val,max,clr,unit){
  var c=document.getElementById(id); if(!c)return;
  if(!cvBuf[id])cvBuf[id]=[];
  cvBuf[id].push(val);
  if(cvBuf[id].length>120)cvBuf[id].shift();
  var ctx=c.getContext('2d'),w=c.width,h=c.height;
  ctx.clearRect(0,0,w,h);
  var d=cvBuf[id],len=d.length,dx=w/(len-1||1);
  ctx.beginPath();ctx.moveTo(0,h);
  for(var i=0;i<len;i++)ctx.lineTo(i*dx,h-(d[i]/max)*h*.8-h*.05);
  ctx.lineTo((len-1)*dx,h);ctx.closePath();ctx.fillStyle=clr+'1a';ctx.fill();
  ctx.beginPath();
  for(var i=0;i<len;i++){var x=i*dx,y=h-(d[i]/max)*h*.8-h*.05;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
  ctx.strokeStyle=clr;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=clr;ctx.font='bold 14px sans-serif';ctx.fillText(d[len-1].toFixed(1)+unit,8,18);
}

/* ========== Toast ========== */
function toast(msg,type){
  var c=el('ams-toast');if(!c)return;
  var t=document.createElement('div');
  t.className='ams-t '+(type||'info');t.textContent=msg;
  c.appendChild(t);
  setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove();},300);},3000);
}

/* ========== 刷新循环 ========== */
var refIv=null,refMs=5000;
function startRef(ms){stopRef();refMs=ms||refMs;refIv=setInterval(refresh,refMs);}
function stopRef(){if(refIv){clearInterval(refIv);refIv=null;}}
function fmtTime(d){return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());}

/* ========== DOM注入 ========== */
function injectUI(){
  var cssLink=null;
  var links=document.head.querySelectorAll('link[rel="stylesheet"]');
  for(var i=0;i<links.length;i++){ if(links[i].href.indexOf('/0.css')!==-1||links[i].href.indexOf('custom')!==-1){cssLink=links[i].cloneNode(true);break;} }
  document.head.innerHTML='';
  var m1=document.createElement('meta');m1.setAttribute('charset','utf-8');document.head.appendChild(m1);
  var m2=document.createElement('meta');m2.setAttribute('name','viewport');m2.setAttribute('content','width=device-width,initial-scale=1');document.head.appendChild(m2);
  if(cssLink)document.head.appendChild(cssLink);
  var ucss=document.createElement('style');
  ucss.textContent='.uplot{font-size:11px;font-family:inherit;display:block;position:relative}.u-wrap{position:relative;user-select:none}.u-over{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none}.u-axes{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}.u-legend{position:absolute;top:0;left:0;display:flex;flex-wrap:wrap;gap:4px;padding:4px 8px;font-size:10px}.u-legend .u-series{display:flex;align-items:center;gap:3px;padding:2px 5px;border-radius:3px;background:rgba(255,255,255,.85);cursor:pointer}.u-legend .u-marker{width:8px;height:8px;border-radius:50%;display:inline-block}.u-legend .u-value{font-weight:600;min-width:40px}';
  document.head.appendChild(ucss);
  document.body.innerHTML=buildHTML();
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/uplot@1.6.32/dist/uPlot.iife.min.js';
  s.onload=function(){initAll();};
  s.onerror=function(){initAll();};
  document.body.appendChild(s);
}

function buildHTML(){
  return '<div id="ams-dashboard">'
+'<div class="ams-header"><div class="ams-header-left"><div class="ams-logo">H</div><div class="ams-title">AMS烘干机 控制面板<small>三绿AMS Heater</small></div></div>'
+'<div class="ams-header-right"><span id="ams-conn" class="ams-conn err"><span class="dot"></span><span id="ams-conn-t">初始化...</span></span><span class="ams-time" id="ams-clock">--:--:--</span><button class="ams-btn-sm" id="ams-refresh">刷新</button></div></div>'
+'<div class="ams-grid">'
+'<div class="ams-card"><div class="ams-card-title">实时状态</div><div class="ams-card-body"><div class="ams-stats">'
+'<div class="ams-stat ams-st"><div class="ams-stat-l">腔体温度</div><div class="ams-stat-v" id="s-temp">--.-<span class="ams-stat-u">°C</span></div></div>'
+'<div class="ams-stat ams-sh"><div class="ams-stat-l">腔体湿度</div><div class="ams-stat-v" id="s-hum">--.-<span class="ams-stat-u">%</span></div></div>'
+'<div class="ams-stat ams-sf"><div class="ams-stat-l">风扇1</div><div class="ams-stat-v off" id="s-f1">停止</div></div>'
+'<div class="ams-stat ams-sf"><div class="ams-stat-l">风扇2</div><div class="ams-stat-v off" id="s-f2">停止</div></div>'
+'<div class="ams-stat ams-sp"><div class="ams-stat-l">加热功率</div><div class="ams-stat-v" id="s-pwr">--<span class="ams-stat-u">%</span></div></div>'
+'<div class="ams-stat ams-stm"><div class="ams-stat-l">剩余时间</div><div class="ams-stat-v" id="s-tmr">--:--:--</div></div>'
+'</div></div></div>'
+'<div class="ams-card"><div class="ams-card-title">控制面板</div><div class="ams-card-body"><div class="ams-ctrls">'
+'<div class="ams-c"><div class="ams-c-l">耗材类型</div><select id="c-fil"><option value="50">PLA — 50°C</option><option value="65">PETG — 65°C</option><option value="80">ABS — 80°C</option><option value="50">TPU — 50°C</option><option value="80">Nylon — 80°C</option></select></div>'
+'<div class="ams-row">'
+'<div class="ams-c ct"><div class="ams-c-l"><span class="tag" style="background:#f472b6"></span>目标温度</div><input type="number" id="c-temp" value="50" min="30" max="85"><div class="ams-c-hint">30-85°C</div></div>'
+'<div class="ams-c cd"><div class="ams-c-l"><span class="tag" style="background:#38bdf8"></span>烘干时长</div><input type="number" id="c-dur" value="2" min="0" max="24" step="0.5"><div class="ams-c-hint">小时(0=无限制)</div></div>'
+'<div class="ams-c cr"><div class="ams-c-l"><span class="tag" style="background:#a78bfa"></span>数据刷新</div><select id="c-ref"><option value="1000">1秒</option><option value="2000">2秒</option><option value="3000">3秒</option><option value="5000" selected>5秒</option><option value="10000">10秒</option></select><div class="ams-c-hint">采样间隔</div></div>'
+'</div>'
+'<div class="ams-btns"><button class="ams-btn ams-btn-go" id="btn-go">▶ 设定并启动</button><button class="ams-btn ams-btn-stop" id="btn-stop">■ 停止</button></div>'
+'<button class="ams-btn ams-btn-warn" id="btn-emg" style="width:100%">⚠ 紧急停止</button>'
+'<div class="ams-dbg"><button class="ams-dbg-toggle" id="dbg-tog">▼ 高级控制/诊断</button><div class="ams-dbg-content" id="dbg-box">'
+'<button class="ams-btn-sm" data-a="f1on">风扇1开</button><button class="ams-btn-sm" data-a="f1off">风扇1关</button>'
+'<button class="ams-btn-sm" data-a="f2on">风扇2开</button><button class="ams-btn-sm" data-a="f2off">风扇2关</button>'
+'<button class="ams-btn-sm" data-a="htest">加热测试</button><button class="ams-btn-sm" data-a="hoff">加热关</button>'
+'<button class="ams-btn-sm" data-a="diag" style="background:#f0fdf4;color:#16a34a;border-color:#bbf7d0">🔍 诊断</button>'
+'</div></div>'
+'</div></div></div>'
+'</div>'
+'<div class="ams-charts">'
+'<div class="ams-chart-card"><div class="ams-chart-title"><span class="cdot" style="background:#f43f5e"></span>温度历史</div><div id="chart-temp"></div></div>'
+'<div class="ams-chart-card"><div class="ams-chart-title"><span class="cdot" style="background:#3b82f6"></span>湿度历史</div><div id="chart-hum"></div></div>'
+'</div>'
+'</div>'
+'<div id="ams-toast"></div>';
}

/* ========== 事件绑定 ========== */
function bindEvents(){
  el('c-fil').onchange=function(){el('c-temp').value=this.value;};
  el('c-ref').onchange=function(){startRef(parseInt(this.value));toast('刷新间隔已改','info');};
  el('btn-go').onclick=execGo;
  el('btn-stop').onclick=execStop;
  el('btn-emg').onclick=execEmergency;
  el('ams-refresh').onclick=refresh;
  var dbs=document.querySelectorAll('[data-a]');
  for(var i=0;i<dbs.length;i++){dbs[i].onclick=function(){execDebug(this.getAttribute('data-a'));};}
  el('dbg-tog').onclick=function(){
    var box=el('dbg-box');box.classList.toggle('show');
    this.textContent=box.classList.contains('show')?'▲ 收起':'▼ 高级控制/诊断';
  };
}

/* ========== 初始化 ========== */
function initAll(){
  initCharts();
  bindEvents();
  refresh();
  startRef(refMs);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',injectUI);
}else{
  injectUI();
}

})();
