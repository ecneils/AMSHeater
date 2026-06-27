/**
 * Custom Web UI for ESPHome
 *
 * Hooks into the existing web_server component (web_server_base) to serve
 * a custom HTML dashboard at the root URL (/). ECharts is served from SPIFFS
 * (auto-downloaded from CDN on first boot).
 *
 * Architecture:
 *   - Custom component registers AsyncWebHandler with existing web_server
 *   - Serves embedded HTML at GET /
 *   - Serves echarts.min.js from SPIFFS at GET /echarts.min.js
 *   - All other requests handled normally by web_server (sensor/switch/climate API)
 *   - Single port (80), no proxy needed
 *
 * Dependencies:
 *   - web_server component (built-in, uses ESP-IDF http_server on ESP32)
 *   - SPIFFS partition (defined in partitions.csv)
 *   - NO external Arduino libraries needed
 */

#include "esphome/core/component.h"
#include "esphome/core/log.h"
#include "esphome/components/web_server_base/web_server_base.h"

#include <esp_spiffs.h>
#include <esp_http_client.h>
#include <esp_ota_ops.h>

namespace esphome {
namespace custom_web_ui {

static const char *TAG = "custom_web_ui";

// CDN URL for ECharts (used for first-boot download only)
static const char *ECHARTS_CDN_URL =
    "https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js";

// ============================================================
// Embedded HTML page (stored in flash via PROGMEM)
// ECharts loaded from /echarts.min.js (served from SPIFFS)
// ============================================================
static const char PROGMEM INDEX_HTML[] = R"rawliteral(<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>AMS烘干机</title>
<script src="/echarts.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}:root{--bg:#f0f2f5;--card:#fff;--hd:#fff;--inp:#f5f7fa;--ink:#1a1a2e;--muted:#8e90a6;--rule:#e4e6ef;--shadow:0 2px 8px rgba(0,0,0,.08);--r:12px;--rs:8px;--s:6px;--ct:#22c55e;--ctb:#f0fdf4;--ch:#3b82f6;--chb:#eff6ff;--cf:#06b6d4;--cfb:#ecfeff;--cp:#eab308;--cpb:#fefce8;--ctm:#78716c;--ctb:#f5f5f4;--bgo:#3b82f6;--bgh:#2563eb;--bst:#ef4444;--bsh:#dc2626;--bem:#f59e0b;--font:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
body{font-family:var(--font);color:var(--ink);background:var(--bg);line-height:1.5;min-height:100vh}
.d{max-width:1200px;margin:0 auto;padding:16px}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--hd);border-radius:var(--r);margin-bottom:16px;box-shadow:var(--shadow);flex-wrap:wrap;gap:8px}
.hl{display:flex;align-items:center;gap:10px}
.hi{width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700}
.ht{font-size:16px;font-weight:700}.ht small{font-size:11px;font-weight:400;color:var(--muted);margin-left:6px}
.hr{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.st{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;display:flex;align-items:center;gap:4px}
.st .d{width:7px;height:7px;border-radius:50%}
.st.ok{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}.st.ok .d{background:#22c55e}
.st.er{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}.st.er .d{background:#ef4444}
.st.bz{background:#fefce8;color:#a16207;border:1px solid #fde68a}.st.bz .d{background:#eab308}
.up{font-size:11px;color:var(--muted)}
.btn{padding:5px 12px;border:none;border-radius:6px;font-size:11px;font-weight:600;font-family:var(--font);cursor:pointer;transition:all .2s}
.btn:active{transform:scale(.97)}
.bo{background:0 0;color:#555770;border:1px solid var(--rule)}.bo:hover{background:var(--inp)}
.c{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow)}
.ch{font-size:13px;font-weight:700;padding:14px 18px 10px;border-bottom:1px solid var(--rule)}
.cb{padding:14px 18px 18px}
.mg{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.sg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.sb{border-radius:var(--rs);padding:12px 14px;text-align:center;transition:transform .15s}
.sb:hover{transform:translateY(-1px)}
.sb .l{font-size:10px;font-weight:500;margin-bottom:5px;opacity:.85}
.sb .v{font-size:24px;font-weight:800;line-height:1.1}.sb .u{font-size:12px;font-weight:400;opacity:.7;margin-left:2px}
.sb.tp{background:var(--ctb);color:var(--ct)}.sb.hu{background:var(--chb);color:var(--ch)}
.sb.fn{background:var(--cfb);color:var(--cf)}.sb.pw{background:var(--cpb);color:var(--cp)}
.sb.tm{background:#f5f5f4;color:#78716c}
.gg{display:grid;gap:10px}
.gr{display:flex;gap:8px}.gr .c{flex:1}
.ctl{font-size:10px;font-weight:600;color:#555770;display:flex;align-items:center;gap:3px;margin-bottom:4px}
.c input,.c select{width:100%;padding:7px 10px;background:var(--inp);border:1px solid var(--rule);border-radius:6px;color:var(--ink);font-size:12px;font-family:var(--font);outline:none}
.c input:focus,.c select:focus{border-color:var(--bgo)}
.cti input{border-left:3px solid #f472b6}.cdi input{border-left:3px solid #38bdf8}.cri select{border-left:3px solid #a78bfa}
.hn{font-size:9px;color:var(--muted);margin-top:3px}
.ac{display:flex;gap:8px;margin-top:2px}.ac .btn{flex:1;padding:8px 14px;font-size:12px;font-weight:700;border-radius:6px}
.g{background:var(--bgo);color:#fff}.g:hover{background:var(--bgh)}
.s{background:var(--bst);color:#fff}.s:hover{background:var(--bsh)}
.db{margin-top:10px;padding-top:10px;border-top:1px dashed var(--rule)}
.dt{font-size:10px;color:var(--muted);cursor:pointer;background:0 0;border:none;font-family:var(--font)}.dt:hover{color:#555770}
.dg{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.dbb{padding:4px 10px;border:1px solid var(--rule);border-radius:6px;background:var(--inp);color:#555770;font-size:10px;cursor:pointer;font-family:var(--font)}
.dbb:hover{background:var(--card);border-color:var(--muted)}
.cg{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cx{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:14px}
.cx .cxh{font-size:12px;font-weight:600;color:#555770;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.cx .cxh .dd{width:7px;height:7px;border-radius:50%}
.cx .cxb{width:100%;height:220px}
#ts{position:fixed;top:16px;right:16px;z-index:9;display:flex;flex-direction:column;gap:6px}
.ti{padding:8px 16px;border-radius:8px;font-size:12px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:ta .3s;max-width:320px;color:#fff}
.ti.g{background:#22c55e}.ti.r{background:#ef4444}.ti.b{background:#3b82f6}.ti.y{background:#f59e0b}
@keyframes ta{from{transform:translateX(40px)}to{transform:translateX(0)}}
@media(max-width:900px){.mg,.cg{grid-template-columns:1fr}}
@media(max-width:640px){.d{padding:10px}.sg{grid-template-columns:1fr 1fr}.gr{flex-direction:column}.ac{flex-direction:column}.hdr{flex-direction:column;align-items:flex-start}.sb .v{font-size:20px}}
</style>
</head>
<body><div class="d">
<div class="hdr"><div class="hl"><div class="hi">H</div><div class="ht">AMS烘干机 <small>三绿AMS Heater</small></div></div><div class="hr"><span id="cs" class="st ok"><span class="d"></span><span id="ct">已连接</span></span><span class="up">更新: <strong id="lu">--:--:--</strong></span><button id="rf" class="btn bo">&#x27F3; 刷新</button></div></div>
<div class="mg">
<div class="c"><div class="ch">&#x1F4CA; 实时状态</div><div class="cb"><div class="sg"><div class="sb tp"><div class="l">&#x1F321; 温度</div><div class="v" id="st">--.-<span class="u">&#xB0;C</span></div></div><div class="sb hu"><div class="l">&#x1F4A7; 湿度</div><div class="v" id="sh">--.-<span class="u">%</span></div></div><div class="sb fn"><div class="l">&#x1F300; 风扇1</div><div class="v" id="sf1">--</div></div><div class="sb fn"><div class="l">&#x1F300; 风扇2</div><div class="v" id="sf2">--</div></div><div class="sb pw"><div class="l">&#x26A1; 功率</div><div class="v" id="sp">--<span class="u">%</span></div></div><div class="sb tm"><div class="l">&#x23F1; 剩余</div><div class="v" id="sr">--:--:--</div></div></div></div></div>
<div class="c"><div class="ch">&#x1F39B; 控制</div><div class="cb"><div class="gg"><div class="c"><div class="ctl">耗材类型</div><select id="cf"><option value="PLA">PLA&#x2014;50&#xB0;C</option><option value="PETG">PETG&#x2014;65&#xB0;C</option><option value="ABS">ABS&#x2014;80&#xB0;C</option><option value="TPU">TPU&#x2014;50&#xB0;C</option><option value="Nylon">Nylon&#x2014;80&#xB0;C</option></select></div><div class="gr"><div class="c cti"><div class="ctl">目标温度</div><input type="number" id="ct" value="50" min="0" max="120" step="1"><div class="hn">30&#x2013;85&#xB0;C</div></div><div class="c cdi"><div class="ctl">时长(时)</div><input type="number" id="cd" value="2" min="0.5" max="24" step="0.5"><div class="hn">0=不限</div></div><div class="c cri"><div class="ctl">刷新</div><select id="cr"><option value="1000">1s</option><option value="2000">2s</option><option value="3000">3s</option><option value="5000" selected>5s</option><option value="10000">10s</option></select></div></div><div class="ac"><button id="bg" class="g">&#x25B6; 启动</button><button id="bs" class="s">&#x25A0; 停止</button></div><button id="be" class="btn" style="background:#f59e0b;color:#fff;padding:6px;font-size:11px">&#x26A0; 紧急停止</button><div class="db"><button class="dt" id="dtg">&#x25BC; 高级</button><div class="dg" id="dgc" style="display:none"><button class="dbb" data-a="f1o">风扇1 开</button><button class="dbb" data-a="f1c">风扇1 关</button><button class="dbb" data-a="f2o">风扇2 开</button><button class="dbb" data-a="f2c">风扇2 关</button><button class="dbb" data-a="ht">加热测试</button><button class="dbb" data-a="hc">加热关</button><button class="dbb" data-a="di">&#x1F50D; 诊断</button></div></div></div></div></div></div>
<div class="cg"><div class="cx"><div class="cxh"><span class="dd" style="background:#f43f5e"></span>温度</div><div id="cht" class="cxb"></div></div><div class="cx"><div class="cxh"><span class="dd" style="background:#3b82f6"></span>湿度</div><div id="chh" class="cxb"></div></div></div>
</div><div id="ts"></div>
<script>
(function(){'use strict';
var API='';var ENT={f1:'ams-heater-c3-fan1',f2:'ams-heater-c3-fan2',r:'ams-heater-c3-heater-relay',c:'ams-heater-c3-thermostat'};
var S={},M={t:[],v:[]},H={t:[],v:[]},T={},RI=5000,RT=null;
var TP={PLA:50,PETG:65,ABS:80,TPU:50,Nylon:80};
function $(i){return document.getElementById(i)}
function p(n){return n<10?'0'+n:''+n}
function ft(d){return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())}
function ts(m,t){var c=$('ts'),e=document.createElement('div');e.className='ti '+(t||'b');e.textContent=m;c.appendChild(e);setTimeout(function(){e.style.opacity='0';e.style.transition='opacity .3s';setTimeout(function(){e.remove()},300)},2500)}
async function ef(p){var r=await fetch(API+p,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('HTTP '+r.status);return(r.headers.get('content-type')||'').indexOf('json')!==-1?r.json():r.text()}
async function ep(p,b){var o={method:'POST',signal:AbortSignal.timeout(5000)};if(b){o.headers={'Content-Type':'application/json'};o.body=JSON.stringify(b)}var r=await fetch(API+p,o);if(!r.ok)throw Error('HTTP '+r.status);return r.text()}
async function refresh(){var cs=$('cs'),ct=$('ct');try{cs.className='st bz';ct.textContent='...';var d=await ef('/sensor');if(!Array.isArray(d))return;
var m={};d.forEach(function(s){m[s.id]=s});var t=m[S.t],h=m[S.h],p=m[S.p];
if(t&&$('st')){var v=parseFloat(t.state)||0;$('st').innerHTML=v.toFixed(1)+'<span class="u">&#xB0;C</span>'}
if(h&&$('sh')){var v=parseFloat(h.state)||0;$('sh').innerHTML=v.toFixed(1)+'<span class="u">%</span>'}
if(p&&$('sp')){var v=parseFloat(p.state)||0;$('sp').innerHTML=v.toFixed(0)+'<span class="u">%</span>'}
var n=new Date(),ts=ft(n);if(t){var v=parseFloat(t.state)||0;M.t.push(ts);M.v.push(v);if(M.t.length>180){M.t.shift();M.v.shift()}}
if(h){var v=parseFloat(h.state)||0;H.t.push(ts);H.v.push(v);if(H.t.length>180){H.t.shift();H.v.shift()}}
if(window.tc)tc.setOption({xAxis:{data:M.t.slice(-60)},series:[{data:M.v.slice(-60)}]});
if(window.hc)hc.setOption({xAxis:{data:H.t.slice(-60)},series:[{data:H.v.slice(-60)}]});
cs.className='st ok';ct.textContent='已连接';$('lu')&&($('lu').textContent=ft(new Date()));
}catch(e){cs.className='st er';ct.textContent='离线'}}
async function diag(){try{var d=await ef('/sensor');if(!Array.isArray(d)||!d.length){ts('无传感器','r');return}var nm={};d.forEach(function(s){var id=s.id||'';if(id.indexOf('temp')!==-1)nm.t=id;if(id.indexOf('humid')!==-1)nm.h=id;if(id.indexOf('power')!==-1||id.indexOf('heater_power')!==-1)nm.p=id});Object.assign(S,nm);ts('检测到'+d.length+'个传感器','g')}catch(e){ts('诊断失败: '+e.message,'r')}}
function sa(ms){if(RT){clearInterval(RT)}RT=setInterval(refresh,ms||RI)}
$('rf').addEventListener('click',refresh);
$('cf').addEventListener('change',function(){$('ct').value=TP[this.value]||50});
$('cr').addEventListener('change',function(){sa(parseInt(this.value))});
$('bg').addEventListener('click',async function(){var t=parseFloat($('ct').value)||50,d=parseFloat($('cd').value)||0;if(t<30){ts('温度需&#x2265;30','r');return}
try{await ep('/switch/'+ENT.r+'/turn_on');await ep('/switch/'+ENT.f1+'/turn_on');await ep('/switch/'+ENT.f2+'/turn_on');await ep('/climate/'+ENT.c+'/control',{target_temperature:t});await ep('/climate/'+ENT.c+'/control',{mode:'heat'});ts('&#x2705; 已启动 '+t+'&#xB0;C','g')}catch(e){ts('&#x274C; '+e.message,'r')}});
$('bs').addEventListener('click',async function(){try{await ep('/climate/'+ENT.c+'/control',{mode:'off'});await ep('/switch/'+ENT.r+'/turn_off');await ep('/switch/'+ENT.f1+'/turn_off');await ep('/switch/'+ENT.f2+'/turn_off');ts('&#x2705; 已停止','g')}catch(e){ts('&#x274C; '+e.message,'r')}});
$('be').addEventListener('click',async function(){try{await ep('/climate/'+ENT.c+'/control',{mode:'off'});await ep('/switch/'+ENT.r+'/turn_off');await ep('/switch/'+ENT.f1+'/turn_off');await ep('/switch/'+ENT.f2+'/turn_off');ts('&#x1F6D1; 已紧急停止','r')}catch(e){ts('&#x274C; '+e.message,'r')}});
document.querySelectorAll('.dbb').forEach(function(b){b.addEventListener('click',async function(){var a=this.getAttribute('data-a');
try{switch(a){case'f1o':await ep('/switch/'+ENT.f1+'/turn_on');ts('风扇1 开','g');break;case'f1c':await ep('/switch/'+ENT.f1+'/turn_off');ts('风扇1 关','g');break;case'f2o':await ep('/switch/'+ENT.f2+'/turn_on');ts('风扇2 开','g');break;case'f2c':await ep('/switch/'+ENT.f2+'/turn_off');ts('风扇2 关','g');break;case'ht':await ep('/switch/'+ENT.r+'/turn_on');try{await ep('/climate/'+ENT.c+'/control',{mode:'off'})}catch(e){}ts('加热测试','b');break;case'hc':await ep('/switch/'+ENT.r+'/turn_off');ts('加热关','g');break;case'di':await diag();break}}catch(e){ts('失败: '+e.message,'r')};refresh()})});
$('dtg').addEventListener('click',function(){var d=$('dgc'),h=d.style.display==='none';d.style.display=h?'flex':'none';this.textContent=h?'&#x25B2; 收起':'&#x25BC; 高级'});
setTimeout(function(){diag();sa(5000);ts('&#x1F7E2; 已连接','g')},500);
if(window.echarts){var td=$('cht'),hd=$('chh');
if(td){window.tc=echarts.init(td,null,{renderer:'svg'});tc.setOption({tooltip:{trigger:'axis'},grid:{left:'8%',right:'4%',top:'8%',bottom:'12%'},xAxis:{type:'category',data:[],axisLabel:{color:'#8e90a6',fontSize:9}},yAxis:{type:'value',name:'&#xB0;C',nameTextStyle:{color:'#8e90a6',fontSize:10},axisLabel:{color:'#8e90a6',fontSize:9},splitLine:{lineStyle:{color:'#f0f2f5'}}},series:[{type:'line',smooth:true,symbol:'none',lineStyle:{color:'#f43f5e',width:2},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(244,63,94,.12)'},{offset:1,color:'rgba(244,63,94,.02)'}]}},data:[]}]});window.addEventListener('resize',function(){tc.resize()})}
if(hd){window.hc=echarts.init(hd,null,{renderer:'svg'});hc.setOption({tooltip:{trigger:'axis'},grid:{left:'8%',right:'4%',top:'8%',bottom:'12%'},xAxis:{type:'category',data:[],axisLabel:{color:'#8e90a6',fontSize:9}},yAxis:{type:'value',name:'%',nameTextStyle:{color:'#8e90a6',fontSize:10},axisLabel:{color:'#8e90a6',fontSize:9},splitLine:{lineStyle:{color:'#f0f2f5'}}},series:[{type:'line',smooth:true,symbol:'none',lineStyle:{color:'#3b82f6',width:2},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(59,130,246,.12)'},{offset:1,color:'rgba(59,130,246,.02)'}]}},data:[]}]});window.addEventListener('resize',function(){hc.resize()})}}
})();
</script>
</body>
</html>)rawliteral";

// ============================================================
// Custom HTTP Handler - serves our dashboard HTML and ECharts
// Inherits from AsyncWebHandler to hook into web_server
// ============================================================
class CustomWebUIHandler : public AsyncWebHandler {
 public:
  bool canHandle(AsyncWebServerRequest *request) const override {
    char buf[AsyncWebServerRequest::URL_BUF_SIZE];
    std::string url = request->url_to(buf).to_string();
    // Intercept root URL and echarts.min.js
    return url == "/" || url == "/index.html" || url == "/echarts.min.js";
  }

  void handleRequest(AsyncWebServerRequest *request) override {
    char buf[AsyncWebServerRequest::URL_BUF_SIZE];
    std::string url = request->url_to(buf).to_string();

    if (url == "/" || url == "/index.html") {
      // Serve embedded HTML dashboard
      ESP_LOGD(TAG, "Serving dashboard HTML");
      size_t len = strlen_P(INDEX_HTML);
      auto *resp = request->beginResponse(200, "text/html; charset=utf-8",
                                            (const uint8_t *)INDEX_HTML, len);
      request->send(resp);
      return;
    }

    if (url == "/echarts.min.js") {
      // Serve ECharts from SPIFFS
      this->serve_echarts_(request);
      return;
    }
  }

 protected:
  // Serve echarts.min.js from SPIFFS
  void serve_echarts_(AsyncWebServerRequest *request) {
    // Check if file exists using VFS
    FILE *f = fopen("/spiffs/echarts.min.js", "rb");
    if (!f) {
      ESP_LOGW(TAG, "echarts.min.js not found in SPIFFS");
      request->send(404, "text/plain",
                    "echarts.min.js not found - will download on next boot");
      return;
    }

    // Get file size
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    ESP_LOGD(TAG, "Serving echarts.min.js from SPIFFS (%ld bytes)", size);

    // Read file into buffer
    std::vector<uint8_t> data(size);
    size_t read_bytes = fread(data.data(), 1, size, f);
    fclose(f);

    if (read_bytes != (size_t)size) {
      ESP_LOGE(TAG, "Failed to read echarts.min.js from SPIFFS");
      request->send(500, "text/plain", "Failed to read file");
      return;
    }

    auto *resp = request->beginResponse(200, "application/javascript; charset=utf-8",
                                          data.data(), data.size());
    request->send(resp);
  }
};

// ============================================================
// CustomWebUI Component
// Manages SPIFFS init and ECharts download
// ============================================================
class CustomWebUI : public Component {
 public:
  void setup() override {
    ESP_LOGI(TAG, "Initializing Custom Web UI...");

    // 1. Mount SPIFFS and ensure echarts.min.js exists
    this->init_spiffs_();

    // 2. Register our handler with the existing web_server
    if (this->web_server_base_ == nullptr) {
      ESP_LOGE(TAG, "web_server_base is null! Check YAML configuration.");
      return;
    }

    // Create handler and register it (before auth, so root page is accessible)
    this->handler_ = new CustomWebUIHandler();
    this->web_server_base_->add_handler_without_auth(this->handler_);

    ESP_LOGI(TAG, "Custom Web UI registered with web_server");
  }

  void set_web_server(web_server_base::WebServerBase *web_server) {
    this->web_server_base_ = web_server;
  }

  float get_setup_priority() const override {
    // Must run AFTER web_server has been initialized
    return setup_priority::AFTER_WIFI + 10.0f;
  }

  void dump_config() override {
    ESP_LOGCONFIG(TAG, "Custom Web UI:");
    ESP_LOGCONFIG(TAG, "  SPIFFS: %s", this->spiffs_mounted_ ? "mounted" : "FAILED");
  }

 protected:
  web_server_base::WebServerBase *web_server_base_{nullptr};
  CustomWebUIHandler *handler_{nullptr};
  bool spiffs_mounted_{false};

  // ============================================================
  // Mount SPIFFS and download ECharts if needed
  // Uses ESP-IDF native SPIFFS API (not Arduino SPIFFS.h)
  // ============================================================
  void init_spiffs_() {
    esp_vfs_spiffs_conf_t conf = {
        .base_path = "/spiffs",
        .partition_label = NULL,       // Use default "spiffs" partition
        .max_files = 1,                // We only need echarts.min.js
        .format_if_mount_failed = true  // Auto-format on first use
    };

    esp_err_t ret = esp_vfs_spiffs_register(&conf);

    if (ret != ESP_OK) {
      if (ret == ESP_FAIL) {
        ESP_LOGE(TAG, "SPIFFS: Failed to mount or format filesystem");
      } else if (ret == ESP_ERR_NOT_FOUND) {
        ESP_LOGE(TAG, "SPIFFS: No SPIFFS partition found in partition table");
        ESP_LOGE(TAG, "SPIFFS: Make sure partitions.csv includes a 'spiffs' partition");
      } else {
        ESP_LOGE(TAG, "SPIFFS: Failed to initialize (%s)", esp_err_to_name(ret));
      }
      return;
    }

    this->spiffs_mounted_ = true;

    // Print SPIFFS info
    size_t total = 0, used = 0;
    esp_spiffs_info(NULL, &total, &used);
    ESP_LOGI(TAG, "SPIFFS: mounted. Total: %d bytes, Used: %d bytes, Free: %d bytes",
             total, used, total - used);

    // Check if echarts.min.js exists
    struct stat st;
    if (stat("/spiffs/echarts.min.js", &st) == 0 && st.st_size > 0) {
      ESP_LOGI(TAG, "SPIFFS: echarts.min.js found (%ld bytes)", (long)st.st_size);
      return;
    }

    // Not found - download from CDN
    ESP_LOGI(TAG, "SPIFFS: echarts.min.js not found, downloading from CDN...");
    this->download_echarts_();
  }

  // ============================================================
  // Download echarts.min.js from CDN to SPIFFS
  // Uses ESP-IDF native HTTP client API
  // ============================================================
  void download_echarts_() {
    ESP_LOGI(TAG, "Downloading echarts.min.js from: %s", ECHARTS_CDN_URL);

    esp_http_client_config_t config = {
        .url = ECHARTS_CDN_URL,
        .method = HTTP_METHOD_GET,
        .timeout_ms = 15000,
        .buffer_size = 1024,
        .buffer_size_tx = 512,
        .cert_pem = nullptr,       // HTTPS with default CA bundle
        .skip_cert_verify = false,
        .max_redirections = 5,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
      ESP_LOGE(TAG, "Failed to create HTTP client");
      return;
    }

    // Open file for writing
    FILE *f = fopen("/spiffs/echarts.min.js", "wb");
    if (!f) {
      ESP_LOGE(TAG, "Failed to create echarts.min.js in SPIFFS");
      esp_http_client_cleanup(client);
      return;
    }

    esp_err_t err = esp_http_client_open(client, 0);
    if (err != ESP_OK) {
      ESP_LOGE(TAG, "HTTP open failed: %s", esp_err_to_name(err));
      fclose(f);
      esp_http_client_cleanup(client);
      return;
    }

    int content_len = esp_http_client_fetch_headers(client);
    int status_code = esp_http_client_get_status_code(client);

    if (status_code != 200) {
      ESP_LOGE(TAG, "HTTP download failed: status %d", status_code);
      fclose(f);
      esp_http_client_close(client);
      esp_http_client_cleanup(client);
      remove("/spiffs/echarts.min.js");
      return;
    }

    ESP_LOGI(TAG, "Downloading echarts.min.js (%d bytes expected)...", content_len);

    // Read in chunks and write to file
    uint8_t buf[512];
    int total_written = 0;
    int bytes_read;
    unsigned long t0 = millis();

    while ((bytes_read = esp_http_client_read(client, (char *)buf, sizeof(buf))) > 0) {
      int written = (int)fwrite(buf, 1, bytes_read, f);
      if (written != bytes_read) {
        ESP_LOGE(TAG, "SPIFFS write error at offset %d", total_written);
        break;
      }
      total_written += bytes_read;
      esp_http_client_perform(client);  // Keep connection alive
    }

    unsigned long elapsed = millis() - t0;
    fclose(f);
    esp_http_client_close(client);
    esp_http_client_cleanup(client);

    if (total_written > 0) {
      ESP_LOGI(TAG, "Downloaded %d bytes in %lu ms (%.1f KB/s)",
               total_written, elapsed, total_written / (float)elapsed);
    } else {
      ESP_LOGE(TAG, "Download failed: 0 bytes written");
      remove("/spiffs/echarts.min.js");
    }
  }
};

}  // namespace custom_web_ui
}  // namespace esphome