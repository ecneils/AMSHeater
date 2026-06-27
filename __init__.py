"""Custom Web UI component for ESPHome.

Hooks into the existing web_server_base to serve a custom HTML dashboard
at the root URL. ECharts is served from SPIFFS (auto-downloaded from CDN
on first boot). No external library dependencies needed.

Usage (in YAML):
  web_server:
    port: 80
    auth:
      username: admin
      password: !secret web_password

  custom_web_ui: {}

Pattern follows the official prometheus component approach.
"""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID
from esphome.components import web_server_base
from esphome.components.web_server_base import CONF_WEB_SERVER_BASE_ID

DEPENDENCIES = ["network"]
AUTO_LOAD = ["web_server_base"]

custom_web_ui_ns = cg.esphome_ns.namespace("custom_web_ui")
CustomWebUI = custom_web_ui_ns.class_("CustomWebUI", cg.Component)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(CustomWebUI),
        cv.GenerateID(CONF_WEB_SERVER_BASE_ID): cv.use_id(
            web_server_base.WebServerBase
        ),
    }
).extend(cv.COMPONENT_SCHEMA)


async def to_code(config):
    """Generate C++ code for the custom web UI component."""
    paren = await cg.get_variable(config[CONF_WEB_SERVER_BASE_ID])
    var = cg.new_Pvariable(config[CONF_ID], paren)
    await cg.register_component(var, config)
