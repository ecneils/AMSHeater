(function(){
'use strict';
var S,W={},F=0,I;
function $(i){return document.getElementById(i)}
function f(u,o){o=o||{};o.credentials='same-origin';return new Promise(function(r,j){var t=setTimeout(function(){j(1)},4000);fetch(u,o).then(function(x){clearTimeout(t);r(x)},function(e){clearTimeout(t);j(e)})})}
function j(p){return f(p).then(function(r){if(!r.ok)throw 0;return r.json()})}
function p(p){return f(p,{method:'POST'}).then(function(r){if(!r.ok)throw 0})}

async function d(){
try{var a=await j('/sensor');console.log('S:',a);if(Array.isArray(a)){S=a;a.forEach(function(e){var n=(e.name||'').toLowerCase();if(n.indexOf('temp')>-1)W.t=e.name;if(n.indexOf('humid')>-1)W.h=e.name;if(n.indexOf('power')>-1)W.p=e.name})}}catch(e){console.log('SE:',e)}
try{var a=await j('/switch');console.log('W:',a);if(Array.isArray(a)){W._=a;a.forEach(function(e){var n=(e.name||'').toLowerCase();if(n.indexOf('fan1')>-1||n.indexOf('fan_m1')>-1)W.a=e.name;if(n.indexOf('fan2')>-1||n.indexOf('fan_s2')>-1)W.b=e.name;if(n.indexOf('relay')>-1)W.r=e.name})}}catch(e){console.log('WE:',e)}
console.log('M:',W);F=1;
}

function u(){
(S||[]).forEach(function(e){if(e.name===W.t){var v=parseFloat(e.state);if(!isNaN(v))$('t').textContent=v.toFixed(1)}if(e.name===W.h){var v=parseFloat(e.state);if(!isNaN(v))$('h').textContent=v.toFixed(1)}if(e.name===W.p){var v=parseFloat(e.state);if(!isNaN(v))$('p').textContent=v.toFixed(0)}});
(W._||[]).forEach(function(e){if(e.name===W.a){var o=e.state==='ON';$('a').textContent=o?'ON':'OFF';$('a').className=o?'on':'off'}if(e.name===W.b){var o=e.state==='ON';$('b').textContent=o?'ON':'OFF';$('b').className=o?'on':'off'}});
}

async function r(){
var c=$('c'),m=$('m');
if(!F){if(m)m.textContent='连接中';if(c)c.className='s w';await d()}
try{S=await j('/sensor');W._=await j('/switch');u();if(c)c.className='s ok';if(m)m.textContent='在线';}catch(e){console.log('RE:',e);if(c)c.className='s e';if(m)m.textContent='断线'}
}

function s(k,a){var n=W[k];if(!n)return;p('/switch/'+encodeURIComponent(n)+'/'+a)}
function go(){var t=parseFloat($('i').value)||50;if(t<30||t>85)return;s('r','turn_on');s('a','turn_on');s('b','turn_on')}
function st(){s('r','turn_off');s('a','turn_off');s('b','turn_off')}

function e(){
$('f').onchange=function(){$('i').value=this.value};
$('g').onclick=go;$('x').onclick=st;
r();I=setInterval(r,5000);
}

document.body.innerHTML='<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;background:#f1f5f9;padding:8px}#x{max-width:420px;margin:auto}h1{font-size:16px;color:#1e293b;margin-bottom:8px}.s{font-size:11px;padding:2px 8px;border-radius:10px}.s.ok{background:#dcfce7;color:#166534}.s.e{background:#fee2e2;color:#991b1b}.s.w{background:#fef9c3;color:#854d0e}g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}g>div{background:#fff;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}g>div.on{color:#16a34a}g>div.off{color:#94a3b8}l{display:block;font-size:10px;color:#64748b;margin-bottom:2px}v{display:block;font-size:20px;font-weight:700}n{display:block;font-size:9px;color:#94a3b8}.c{background:#fff;border-radius:8px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,.1)}.c>div{margin-bottom:6px}l2{font-size:11px;font-weight:600;color:#334155;display:block;margin-bottom:3px}input,select{width:100%;padding:6px;border:1px solid #cbd5e1;border-radius:4px;font-size:12px}b{display:flex;gap:6px;margin-top:8px}b>button{flex:1;padding:8px;border:none;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer}b>button:first-child{background:#2563eb;color:#fff}b>button:last-child{background:#dc2626;color:#fff}</style><div id="x"><h1>AMS烘干机 <span id="c" class="s w"><span id="m">初始化</span></span></h1><g><div><l>温度</l><v id="t">--</v><n>°C</n></div><div><l>湿度</l><v id="h">--</v><n>%</n></div><div><l>功率</l><v id="p">--</v><n>%</n></div><div class="off"><l>风扇1</l><v id="a">OFF</v></div><div class="off"><l>风扇2</l><v id="b">OFF</v></div><div><l>状态</l><v id="m2">待机</v></div></g><div class="c"><div><l2>耗材</l2><select id="f"><option value="50">PLA 50°C</option><option value="65">PETG 65°C</option><option value="80">ABS 80°C</option><option value="50">TPU 50°C</option><option value="80">Nylon 80°C</option></select></div><div><l2>温度</l2><input type="number" id="i" value="50" min="30" max="85"></div><b><button id="g">启动</button><button id="x">停止</button></b></div></div>';
e();
})();
