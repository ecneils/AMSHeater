"""Custom Web UI for ESPHome.

Hooks into web_server_base via global variable to serve custom dashboard at /.

YAML:
  web_server:
    port: 80

  custom_web_ui:
"""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID

DEPENDENCIES = ["web_server"]

custom_web_ui_ns = cg.esphome_ns.namespace("custom_web_ui")
CustomWebUI = custom_web_ui_ns.class_("CustomWebUI", cg.Component)

CONFIG_SCHEMA = cv.Schema({}).extend(cv.COMPONENT_SCHEMA)

async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
