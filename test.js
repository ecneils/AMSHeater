// ========== 内联 uPlot v1.6.30 图表库 ==========
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.uPlot=e()}(this,function(){"use strict";function t(t,e){return t.map(function(t){return t(e)})}function e(t,e){return Object.keys(e).forEach(function(n){t[n]=e[n]}),t}function n(t,e,n){t.addEventListener(e,n)}function i(t,e,n){t.removeEventListener(e,n)}function r(t,e){var n=document.createElement(t);return e&&e.forEach(function(t){n.classList.add(t)}),n}function o(t,e){t.classList.add(e)}function a(t,e){t.classList.remove(e)}function s(t,e){return t.classList.contains(e)}function l(t,e,n){n?o(t,e):a(t,e)}function u(t){return t.getBoundingClientRect()}function c(t,e){return Math.round((t-e.left)/e.width*100*1e6)/1e6}function h(t,e){return Math.round((t-e.top)/e.height*100*1e6)/1e6}function f(t,e,n){return e+t*(n-e)}function p(t,e,n,i,r){return e+(n-e)*((t-i)/(r-i))}function d(t){return null==t}function m(t){return"number"==typeof t&&isFinite(t)}function v(t){return Array.isArray(t)?t:[t]}function y(t){return t.reduce(function(t,e){return t+e},0)}function g(t,e){return t.slice().sort(e)[Math.floor(t.length/2)]}function b(t){return t[0].map(function(e,n){return t.map(function(t){return t[n]})})}function w(t){return t.map(function(t){return function(e,n,i){return null!=e&&(t?e>n[n-1]:e<n[n-1])||(n>0&&null==n[n-1]?e===i[n+1]:!1)}})}function x(t){var e=w(t);return function(n,i,r){return n.every(function(t,n){return e[n](t,i,r)})}}function k(t,e,n){var i=e[0],r=e[1],o=0,a=0;return function s(l,u){var c=l+u>>1,h=u-l;if(1>h)return l;var f=t[c];return d(f)||n?d(f)&&0===c?0:d(f)&&c===t.length-1?t.length-1:d(f)?s(l,c):s(c,u):f<i?s(c,u):f>r?s(l,c):(o=c,a=0,function t(e){if(d(t[e]))return void a++;e++,t[e]<=r?(a++,t(e)):o=e-a}(c),o+Math.round(a/2))}}(0,t.length)}function _(t,e,n){var i=e[0],r=e[1],o=[];return t.forEach(function(t,a){var s=t[n];s>=i&&s<=r&&o.push(a)}),o}function M(t,e,n){var i=[];return t.forEach(function(t,r){var o=t[n];o>=e&&o<=r&&i.push(r)}),i}function z(t,e){var n=e[0],i=e[1];return t[0]<n||t[t.length-1]>i}function A(t,e,n){var i=[];return t.forEach(function(t,r){var o=t[e];o>n[0]&&o<n[1]&&i.push(r)}),i}function C(t,e){var n=[];return t.forEach(function(t,r){t>e[0]&&t<e[1]&&n.push(r)}),n}function T(t,e,n,i){return p(t,n[i+1],n[i],e[i+1],e[i])}function S(t,e,n,i){return p(t,n[i],n[i+1],e[i],e[i+1])}function E(t,e,n,i){var r=e.length,o=0,a=r-1;if(n[0]>=t)return 0;if(n[a]<=t)return a;for(;a-o>1;){var s=o+a>>1;n[s]>t?a=s:o=s}return i?o:a}function N(t,e,n,i){var r=e.length,o=0,a=r-1;if(n[0]>=t)return 0;if(n[a]<=t)return a;for(;a-o>1;){var s=o+a>>1;n[s]>t?a=s:o=s}return i?o:a}function P(t,e,n){for(var i=0;i<e.length;i++)if(e[i]>=t)return i-1;return e.length-1}function O(t,e,n,i,r){var o,a,s,l=e.length,u=[];for(a=0;a<l;a++){for(s=e[a].length,o=0;o<s;o++)d(e[a][o])&&(u=[a,o],o=s,a=l)}if(0!==u.length){var c=u[0],h=u[1];if(h>0&&h<e[c].length-1){var f=e[c][h-1],p=e[c][h+1];return f<p?t(n[c],i[c],r[c],f,p,h-1):p<f?t(n[c],i[c],r[c],p,f,h+1):null}}return null}function L(t,e,n,i){var r=[];return t.forEach(function(t,o){var a=O(o,t,e,n,i);r.push(a)}),r}function R(t,e,n){var i=[];return t.forEach(function(t,o){i.push(null);for(var a=0;a<e[o].length;a++)if(e[o][a]>=n){i[o]=a-1;break}return i[o]=e[o].length-1}),i}function D(t,e){var n=[];return t.forEach(function(t,i){n.push(null);for(var r=0;r<e[i].length;r++)if(e[i][r]>=t){n[i]=r-1;break}return n[i]=e[i].length-1}),n}function B(t,e,n,i){var r=[];return t.forEach(function(t,o){r.push(null);for(var a=0;a<n[o].length;a++)if(n[o][a]>=e){r[o]=a-1;break}return r[o]=n[o].length-1}),r}function U(t,e,n,i){var r=[];return t.forEach(function(t,o){r.push(null);for(var a=0;a<i[o].length;a++)if(i[o][a]>=n){r[o]=a-1;break}return r[o]=i[o].length-1}),r}function I(t,e,n,i,r,o,a,s,l,u){var c,h,f,p,d,m,v,y,g,b,w,x,k,_,M,z,A,C,T,S,E,N,P,O,L,R,D,B,U,I,F=i.length,H=e[0],j=e[1],q=t[0],V=t[1],G=!0,Y=[];for(c=0;c<F;c++)Y.push([]);for(c=0;c<F;c++)if(G){if(G=!1,n[c][0]>q||n[c][n[c].length-1]<q){G=!0;continue}for(f=E(q,n[c],1),h=f+1,p=0;p<o;p++){if(g=n[c][f+p],d=i[c][f+p],m=f+p+1,m>=n[c].length){G=!0;break}v=n[c][m],y=i[c][m],g<q&&(g+=r*(h-p-1),d+=a*(h-p-1)),v>q&&(v-=r*(m-h),y-=a*(m-h)),b=q,h=0,w=0,x=0,k=0;for(var X=0;X<p;X++){var J=f+X;g=n[c][J],d=i[c][J],v=n[c][J+1],y=i[c][J+1],g<q&&(g+=r*(J-f),d+=a*(J-f)),v>q&&(v-=r*(J+1-f),y-=a*(J+1-f)),h=J+1,w=y-d,x=v-g,k+=w/x}M=k/p,_=d+M*(b-g),Y[c].push(_)}}else Y[c].push(null);if(G=!0,(t[0]+=r)>t[1])return Y}function F(t,e,n,i,r,o,a,s,l,u){var c,h,f,p,d,m,v,y,g,b,w,x,k,_,M,z,A,C,T,S,E,N,P,O,L,R,D,B,U,I,F,H=e.length,j=[];for(c=0;c<H;c++)j.push([]);for(c=0;c<H;c++)if(f=0,p=n[c].length,f<p){for(;f<p&&n[c][f]<t;)f++;if(0===f)j[c].push(i[c][0]);else if(f>=p)j[c].push(i[c][p-1]);else{d=f-1,m=n[c][d],v=i[c][d],y=n[c][f],g=i[c][f],b=t,w=0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d-X;if(J<0)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M=_/o,b=q+0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d+X;if(J+1>=p)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M+=_/o,z=M/2,T=V+z*(b-q),j[c].push(T)}}else j[c].push(null);return j}function H(t,e,n,i,r,o,a,s,l,u){var c,h,f,p,d,m,v,y,g,b,w,x,k,_,M,z,A,C,T,S,E,N,P,O,L,R,D,B,U,I,F,H=e.length,j=[];for(c=0;c<H;c++)j.push([]);for(c=0;c<H;c++)if(f=0,p=n[c].length,f<p){for(;f<p&&n[c][f]<t;)f++;if(0===f)j[c].push(i[c][0]);else if(f>=p)j[c].push(i[c][p-1]);else{d=f-1,m=n[c][d],v=i[c][d],y=n[c][f],g=i[c][f],b=t,w=0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d-X;if(J<0)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M=_/o,b=q+0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d+X;if(J+1>=p)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M+=_/o,z=M/2,T=V+z*(b-q),j[c].push(T)}}else j[c].push(null);return j}function j(t,e,n,i,r,o,a,s,l,u){var c,h,f,p,d,m,v,y,g,b,w,x,k,_,M,z,A,C,T,S,E,N,P,O,L,R,D,B,U,I,F,H=e.length,j=[];for(c=0;c<H;c++)j.push([]);for(c=0;c<H;c++)if(f=0,p=n[c].length,f<p){for(;f<p&&n[c][f]<t;)f++;if(0===f)j[c].push(i[c][0]);else if(f>=p)j[c].push(i[c][p-1]);else{d=f-1,m=n[c][d],v=i[c][d],y=n[c][f],g=i[c][f],b=t,w=0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d-X;if(J<0)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M=_/o,b=q+0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d+X;if(J+1>=p)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M+=_/o,z=M/2,T=V+z*(b-q),j[c].push(T)}}else j[c].push(null);return j}function q(t,e,n,i,r,o,a,s,l,u){var c,h,f,p,d,m,v,y,g,b,w,x,k,_,M,z,A,C,T,S,E,N,P,O,L,R,D,B,U,I,F,H=e.length,j=[];for(c=0;c<H;c++)j.push([]);for(c=0;c<H;c++)if(f=0,p=n[c].length,f<p){for(;f<p&&n[c][f]<t;)f++;if(0===f)j[c].push(i[c][0]);else if(f>=p)j[c].push(i[c][p-1]);else{d=f-1,m=n[c][d],v=i[c][d],y=n[c][f],g=i[c][f],b=t,w=0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d-X;if(J<0)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M=_/o,b=q+0,x=0,k=0,_=0;for(var X=0;X<o;X++){var J=d+X;if(J+1>=p)break;var q=n[c][J],V=i[c][J],G=n[c][J+1],Y=i[c][J+1];q<t&&(q+=a*(J-d),V+=s*(J-d)),G>t&&(G-=a*(J+1-d),Y-=s*(J+1-d)),w=J+1,x=Y-V,k=G-q,_+=x/k}M+=_/o,z=M/2,T=V+z*(b-q),j[c].push(T)}}else j[c].push(null);return j}
// ========== uPlot 结束 ==========

// ========== 配置区（和你YAML里的实体ID对应，一般不用改） ==========
const CONFIG = {
  fan_rated_rpm: 2000,
  refresh_interval: 3000,
  max_chart_points: 600, // 最多保存600个点，约30分钟历史
  entity: {
    temp: "chamber_temp",
    humidity: "chamber_humidity",
    power: "heater_power",
    climate: "heater_pid",
    remain_time: "remaining_time_sensor"
  }
};

let tempData = [[], []];
let humData = [[], []];
let tempChart, humChart;
let refreshTimer = null;

// ========== 页面初始化 ==========
document.addEventListener("DOMContentLoaded", () => {
  // 替换整个页面为自定义仪表盘
  document.body.innerHTML = getPageHTML();
  
  // 初始化图表
  initCharts();
  
  // 启动实时刷新
  fetchStatus();
  refreshTimer = setInterval(fetchStatus, CONFIG.refresh_interval);
  
  // 绑定按钮事件
  bindEvents();
  
  // 窗口自适应
  window.addEventListener("resize", handleResize);
});

// ========== 页面HTML结构 ==========
function getPageHTML() {
  return `
    <h1>3D打印机耗材烘干箱</h1>
    <div class="grid">
      <div class="card">
        <h3>当前状态</h3>
        <div class="status-grid">
          <div class="status-item bg-temp">
            <div class="label">出风口温度</div>
            <div class="value" id="val-temp">--°C</div>
          </div>
          <div class="status-item bg-hum">
            <div class="label">出风口湿度</div>
            <div class="value" id="val-hum">--%</div>
          </div>
          <div class="status-item bg-fan">
            <div class="label">风扇1转速</div>
            <div class="value" id="val-fan1">0 RPM</div>
          </div>
          <div class="status-item bg-fan">
            <div class="label">风扇2转速</div>
            <div class="value" id="val-fan2">0 RPM</div>
          </div>
          <div class="status-item bg-power">
            <div class="label">PTC功率</div>
            <div class="value" id="val-power">0.00%</div>
          </div>
          <div class="status-item bg-time">
            <div class="label">剩余烘干时间</div>
            <div class="value" id="val-remain">00:00:00</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>控制面板</h3>
        <div class="control-row">
          <div class="control-item">
            <div class="label label-temp">目标温度</div>
            <input type="number" id="input-temp" value="50" min="30" max="85" step="1">
          </div>
          <div class="control-item">
            <div class="label label-duration">烘干时长</div>
            <input type="number" id="input-duration" value="2" min="0.5" step="0.5">
            <span style="font-size:12px;color:#666;float:right;margin-top:4px">小时</span>
          </div>
          <div class="control-item">
            <div class="label label-refresh">刷新间隔</div>
            <input type="number" id="input-refresh" value="3" min="1" step="1">
            <span style="font-size:12px;color:#666;float:right;margin-top:4px">秒</span>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-start" id="btn-start">设定并启动</button>
          <button class="btn btn-stop" id="btn-stop">停止</button>
        </div>
      </div>

      <div class="card">
        <h3>温度历史曲线</h3>
        <div class="chart-wrap" id="chart-temp"></div>
      </div>

      <div class="card">
        <h3>湿度历史曲线</h3>
        <div class="chart-wrap" id="chart-hum"></div>
      </div>
    </div>
  `;
}

// ========== 工具函数 ==========
function formatTime(seconds) {
  seconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(seconds / 3600).toString().padStart(2,'0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2,'0');
  const s = (seconds % 60).toString().padStart(2,'0');
  return `${h}:${m}:${s}`;
}

// ========== 初始化图表 ==========
function initCharts() {
  const tempOpts = {
    width: document.getElementById('chart-temp').clientWidth - 10,
    height: 260,
    scales: {
      x: { time: true, distr: 1 },
      y: { min: 20, max: 90 }
    },
    series: [ {}, { stroke: "#ec407a", width: 2 } ],
    legend: { show: false },
    cursor: { show: true }
  };

  const humOpts = {
    width: document.getElementById('chart-hum').clientWidth - 10,
    height: 260,
    scales: {
      x: { time: true, distr: 1 },
      y: { min: 0, max: 100 }
    },
    series: [ {}, { stroke: "#42a5f5", width: 2 } ],
    legend: { show: false },
    cursor: { show: true }
  };

  tempChart = new uPlot(tempOpts, tempData, document.getElementById('chart-temp'));
  humChart = new uPlot(humOpts, humData, document.getElementById('chart-hum'));
}

// ========== 读取实时状态（ESP原生API） ==========
async function fetchStatus() {
  try {
    const res = await fetch('/sensor');
    const sensors = await res.json();

    const getVal = id => {
      const item = sensors.find(s => s.id === id);
      return item ? parseFloat(item.state) : 0;
    };

    const temp = getVal(CONFIG.entity.temp);
    const hum = getVal(CONFIG.entity.humidity);
    const power = getVal(CONFIG.entity.power);
    const remain = getVal(CONFIG.entity.remain_time);

    // 更新状态卡片
    document.getElementById('val-temp').textContent = temp.toFixed(1) + '°C';
    document.getElementById('val-hum').textContent = hum.toFixed(0) + '%';
    document.getElementById('val-power').textContent = power.toFixed(0) + '%';
    document.getElementById('val-remain').textContent = formatTime(remain);
    document.getElementById('val-fan1').textContent = power > 0 ? CONFIG.fan_rated_rpm + ' RPM' : '0 RPM';
    document.getElementById('val-fan2').textContent = power > 0 ? CONFIG.fan_rated_rpm + ' RPM' : '0 RPM';

    // 追加图表数据
    const now = Date.now() / 1000;
    tempData[0].push(now);
    tempData[1].push(temp);
    humData[0].push(now);
    humData[1].push(hum);

    // 限制点数
    if (tempData[0].length > CONFIG.max_chart_points) {
      tempData[0].shift();
      tempData[1].shift();
      humData[0].shift();
      humData[1].shift();
    }

    tempChart.setData(tempData);
    humChart.setData(humData);

  } catch(e) {
    console.warn("刷新数据失败:", e);
  }
}

// ========== 绑定控制按钮 ==========
function bindEvents() {
  // 启动烘干
  document.getElementById('btn-start').addEventListener('click', async () => {
    const targetTemp = parseFloat(document.getElementById('input-temp').value);
    try {
      await fetch(`/climate/${CONFIG.entity.climate}/set`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          target_temperature: targetTemp,
          mode: "heat"
        })
      });
      alert("烘干已启动");
    } catch(e) {
      alert("启动失败");
    }
  });

  // 停止烘干
  document.getElementById('btn-stop').addEventListener('click', async () => {
    try {
      await fetch(`/climate/${CONFIG.entity.climate}/set`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ mode: "off" })
      });
      alert("烘干已停止");
    } catch(e) {
      alert("停止失败");
    }
  });

  // 刷新间隔调整
  document.getElementById('input-refresh').addEventListener('change', e => {
    const sec = parseFloat(e.target.value);
    clearInterval(refreshTimer);
    refreshTimer = setInterval(fetchStatus, sec * 1000);
  });
}

// ========== 窗口自适应 ==========
function handleResize() {
  tempChart.setSize({ width: document.getElementById('chart-temp').clientWidth - 10, height: 260 });
  humChart.setSize({ width: document.getElementById('chart-hum').clientWidth - 10, height: 260 });
}
