"""Custom Web UI component for ESPHome.

Hooks into the existing web_server to serve a custom HTML dashboard
at the root URL. ECharts is served from SPIFFS (auto-downloaded from CDN
on first boot). No external library dependencies needed.

Usage (in YAML):
  web_server:
    id: web_server
    port: 80

  custom_web_ui:
    web_server_id: web_server
"""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID

DEPENDENCIES = ["web_server"]
AUTO_LOAD = []

custom_web_ui_ns = cg.esphome_ns.namespace("custom_web_ui")
CustomWebUI = custom_web_ui_ns.class_("CustomWebUI", cg.Component)

CONF_WEB_SERVER_ID = "web_server_id"

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(CustomWebUI),
        cv.Required(CONF_WEB_SERVER_ID): cv.use_id("web_server"),
    }
).extend(cv.COMPONENT_SCHEMA)

async def to_code(config):
    """Generate C++ code for the custom web UI component."""
    var = cg.new_Pvariable(config[CONF_ID])
    ws = await cg.get_variable(config[CONF_WEB_SERVER_ID])
    cg.add(var.set_web_server(ws))
    await cg.register_component(var, config)