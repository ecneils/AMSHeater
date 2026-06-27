/**
 * Custom Web UI for ESPHome - MINIMAL TEST VERSION
 * Uses global_web_server_base to avoid Python ID resolution issues.
 * ECharts loaded from CDN for testing.
 */

#pragma once

#include "esphome/core/component.h"
#include "esphome/core/log.h"
#include "esphome/components/web_server_base/web_server_base.h"

namespace esphome {
namespace custom_web_ui {

static const char *TAG = "custom_web_ui";

static const char PROGMEM INDEX_HTML[] = R"rawliteral(<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AMS烘干机 - TEST</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:#1a1a2e;background:#f0f2f5;padding:20px}
.card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.08);max-width:800px;margin:0 auto}
h1{margin:0 0 10px;font-size:20px}
p{color:#555;margin:0}
#chart{width:100%;height:300px;margin-top:20px}
</style>
</head>
<body>
<div class="card">
<h1>AMS烘干机 - 自定义控制面板</h1>
<p>如果看到这个页面，说明 handler 拦截成功！</p>
<div id="chart"></div>
</div>
<script>
(function(){
var chart=echarts.init(document.getElementById('chart'));
chart.setOption({
  title:{text:'温度曲线',left:'center'},
  xAxis:{type:'category',data:['10:00','10:05','10:10','10:15','10:20']},
  yAxis:{type:'value',name:'°C'},
  series:[{type:'line',smooth:true,data:[25,28,32,35,38],lineStyle:{color:'#f43f5e'}}]
});
})();
</script>
</body>
</html>)rawliteral";

class CustomWebUI : public AsyncWebHandler, public Component {
 public:
  CustomWebUI() {
    ESP_LOGI(TAG, "Constructor called");
  }

  bool canHandle(AsyncWebServerRequest *request) const override {
    if (request->method() != HTTP_GET) return false;
#ifdef USE_ESP32
    char url_buf[AsyncWebServerRequest::URL_BUF_SIZE];
    request->url_to(url_buf);
    bool match = (strcmp(url_buf, "/") == 0);
    ESP_LOGD(TAG, "canHandle: url='%s' match=%s", url_buf, match ? "YES" : "NO");
    return match;
#else
    return request->url() == ESPHOME_F("/");
#endif
  }

  void handleRequest(AsyncWebServerRequest *request) override {
    ESP_LOGI(TAG, "handleRequest: serving HTML");
    size_t len = strlen_P(INDEX_HTML);
    auto *resp = request->beginResponse(200, "text/html; charset=utf-8",
                                          (const uint8_t *)INDEX_HTML, len);
    request->send(resp);
  }

  void setup() override {
    ESP_LOGI(TAG, "setup() START, priority=%.1f", this->get_setup_priority());
    auto *base = esphome::web_server_base::global_web_server_base;
    ESP_LOGI(TAG, "global_web_server_base=%p", base);
    if (base == nullptr) {
      ESP_LOGE(TAG, "global_web_server_base is NULL!");
      return;
    }
    base->init();
    base->add_handler_without_auth(this);
    ESP_LOGI(TAG, "setup() DONE");
  }

  float get_setup_priority() const override {
    return setup_priority::WIFI - 2.0f;
  }

  void dump_config() override {
    ESP_LOGCONFIG(TAG, "Custom Web UI (TEST VERSION)");
  }
};

}  // namespace custom_web_ui
}  // namespace esphome
