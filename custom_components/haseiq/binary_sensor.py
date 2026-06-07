"""Platform for binary sensor integration."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import IQStoveCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
):
    """Setup binary sensors from a config entry created in the integrations UI."""
    coordinator: IQStoveCoordinator = entry.runtime_data
    sensors = [
        IQstoveBinarySensor(coordinator, cmd)
        for cmd in coordinator.stove.Commands.state
        if cmd == "appErr"
    ]
    async_add_entities(sensors, update_before_add=True)


class IQstoveBinarySensor(CoordinatorEntity, BinarySensorEntity):
    """Representation of a Binary Sensor."""

    def __init__(self, coordinator: IQStoveCoordinator, cmd):
        """Pass coordinator to CoordinatorEntity."""
        super().__init__(coordinator)
        self.cmd = cmd

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if self.coordinator.data and self.cmd in self.coordinator.data:
            self._attr_is_on = bool(int(float(self.coordinator.data[self.cmd])))
        self.async_write_ha_state()

    @property
    def name(self) -> str:
        """Return the name of the sensor."""
        if self.cmd == "appErr":
            return "Error"
        return "undefined"

    @property
    def is_on(self) -> bool | None:
        """Return the state of the entity."""
        if not self.coordinator.data or self.cmd not in self.coordinator.data:
            return None
        value = self.coordinator.data[self.cmd]
        if value is None:
            return None
        try:
            return bool(int(float(value)))
        except (ValueError, TypeError):
            return None

    @property
    def device_class(self) -> str | None:
        """Return device class."""
        if self.cmd == "appErr":
            return BinarySensorDeviceClass.PROBLEM
        return None

    @property
    def unique_id(self) -> str:
        """Return unique id."""
        return f"{DOMAIN}-binary-sensor-{self.cmd}"

    @property
    def device_info(self):
        """Return device information about this entity."""
        data = self.coordinator.data or {}
        return {
            "identifiers": {(DOMAIN, data.get("_oemser", "unknown"))},
            "manufacturer": "Hase",
            "model": "Sila Plus" if data.get("_oemdev") == "6" else None,
            "model_id": data.get("_oemdev"),
            "name": f"Stove {data.get('_oemser', 'unknown')}",
            "serial_number": data.get("_oemser"),
            "sw_version": f"Wifi {data.get('_wversion', '?')}",
            "hw_version": f"Controller {data.get('_oemver', '?')}",
        }
