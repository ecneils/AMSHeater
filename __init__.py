"""Custom Web UI component for ESPHome.

Hooks into the existing web_server_base to serve a custom HTML dashboard
at the root URL. ECharts is served from SPIFFS (auto-downloaded from CDN
on first boot).

Usage (in YAML):
  web_server:
    port: 80

  custom_web_ui:
"""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID

DEPENDENCIES = ["network"]
AUTO_LOAD = ["web_server_base"]

custom_web_ui_ns = cg.esphome_ns.namespace("custom_web_ui")
CustomWebUI = custom_web_ui_ns.class_("CustomWebUI", cg.Component)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(CustomWebUI),
    }
).extend(cv.COMPONENT_SCHEMA)


async def to_code(config):
    """Generate C++ code for the custom web UI component."""
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
