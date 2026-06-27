"""Custom Web UI component for ESPHome.

Serves a custom HTML dashboard directly at the ESP32's root URL.
The HTML is embedded in flash memory. API calls are transparently
proxied to the ESPHome web_server running on port 8080.

Usage (in YAML):
  external_components:
    - source: custom_components
      components: [custom_web_ui]

  custom_web_ui:
    port: 80

  web_server:
    port: 8080
    cors: "*"
"""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID

DEPENDENCIES = ["web_server"]
AUTO_LOAD = []

custom_web_ui_ns = cg.esphome_ns.namespace("custom_web_ui")
CustomWebUI = custom_web_ui_ns.class_("CustomWebUI", cg.Component)

CONF_PORT = "port"

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(CustomWebUI),
        cv.Optional(CONF_PORT, default=80): cv.port,
    }
).extend(cv.COMPONENT_SCHEMA)


async def to_code(config):
    """Generate C++ code for the custom web UI component."""
    var = cg.new_Pvariable(config[CONF_ID])
    cg.add(var.set_port(config[CONF_PORT]))
    await cg.register_component(var, config)