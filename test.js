// 配置项
const CONFIG = {
  fan_rated_rpm: 2000,
  refresh_interval: 3000,
  entity: {
    temp: "chamber_temp",
    humidity: "chamber_humidity",
    power: "heater_power",
    climate: "heater_pid",
    remain_time: "remaining_time_sensor"
  }
};

// 页面完全加载后执行
window.onload = function() {
  // 1. 替换整个页面为自定义仪表盘
  document.body.innerHTML = getPageHtml();

  // 2. 绑定按钮事件
  bindEvents();

  // 3. 立即刷新一次状态，然后启动定时刷新
  fetchStatus();
  window.refreshTimer = setInterval(fetchStatus, CONFIG.refresh_interval);
};

// 生成页面HTML结构
function getPageHtml() {
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
    </div>
  `;
}

// 格式化秒数为 时:分:秒
function formatTime(seconds) {
  seconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h + ':' + m + ':' + s;
}

// 读取实时状态（ESPHome原生API）
async function fetchStatus() {
  try {
    const res = await fetch('/sensor');
    const sensors = await res.json();

    function getVal(id) {
      const item = sensors.find(function(s) { return s.id === id; });
      return item ? parseFloat(item.state) : 0;
    }

    const temp = getVal(CONFIG.entity.temp);
    const hum = getVal(CONFIG.entity.humidity);
    const power = getVal(CONFIG.entity.power);
    const remain = getVal(CONFIG.entity.remain_time);

    document.getElementById('val-temp').textContent = temp.toFixed(1) + '°C';
    document.getElementById('val-hum').textContent = hum.toFixed(0) + '%';
    document.getElementById('val-power').textContent = power.toFixed(0) + '%';
    document.getElementById('val-remain').textContent = formatTime(remain);
    document.getElementById('val-fan1').textContent = power > 0 ? CONFIG.fan_rated_rpm + ' RPM' : '0 RPM';
    document.getElementById('val-fan2').textContent = power > 0 ? CONFIG.fan_rated_rpm + ' RPM' : '0 RPM';

  } catch (e) {
    console.warn('刷新数据失败:', e);
  }
}

// 绑定按钮事件
function bindEvents() {
  // 启动烘干
  document.getElementById('btn-start').addEventListener('click', async function() {
    const targetTemp = parseFloat(document.getElementById('input-temp').value);
    try {
      await fetch('/climate/' + CONFIG.entity.climate + '/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_temperature: targetTemp,
          mode: "heat"
        })
      });
      alert('烘干已启动');
    } catch (e) {
      alert('启动失败，请检查设备连接');
    }
  });

  // 停止烘干
  document.getElementById('btn-stop').addEventListener('click', async function() {
    try {
      await fetch('/climate/' + CONFIG.entity.climate + '/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: "off" })
      });
      alert('烘干已停止');
    } catch (e) {
      alert('停止失败，请检查设备连接');
    }
  });

  // 调整刷新间隔
  document.getElementById('input-refresh').addEventListener('change', function(e) {
    const sec = parseFloat(e.target.value);
    clearInterval(window.refreshTimer);
    window.refreshTimer = setInterval(fetchStatus, sec * 1000);
  });
}
