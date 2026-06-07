"""Platform for number integration."""

from __future__ import annotations

from homeassistant.components.number import (
    NumberEntity,
    NumberDeviceClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
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
    """Setup number entities from a config entry created in the integrations UI."""
    coordinator: IQStoveCoordinator = entry.runtime_data
    sensors = [IQstoveNumberEntity(coordinator, "_ledBri")]
    async_add_entities(sensors, update_before_add=True)


class IQstoveNumberEntity(CoordinatorEntity, NumberEntity):
    """Representation of a Number Entity."""

    def __init__(self, coordinator: IQStoveCoordinator, cmd):
        """Pass coordinator to CoordinatorEntity."""
        super().__init__(coordinator)
        self.cmd = cmd
        self._attr_native_max_value = 100
        self._attr_native_min_value = 0

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if self.coordinator.data and self.cmd in self.coordinator.data:
            try:
                self._attr_native_value = float(self.coordinator.data[self.cmd])
            except (ValueError, TypeError):
                pass
        self.async_write_ha_state()

    @property
    def name(self) -> str:
        """Return the name of the entity."""
        if self.cmd == "_ledBri":
            return "LED Brightness"
        return "undefined"

    @property
    def native_value(self) -> float | None:
        """Return the current value."""
        if not self.coordinator.data or self.cmd not in self.coordinator.data:
            return None
        value = self.coordinator.data[self.cmd]
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Return unit of measurement."""
        return None

    @property
    def unique_id(self) -> str:
        """Return unique id."""
        return f"{DOMAIN}-number-{self.cmd}"

    async def async_set_native_value(self, value: float) -> None:
        """Set new value."""
        self.coordinator.stove.setValue(self.cmd, int(value))
        self._attr_native_value = value
        self.async_write_ha_state()

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
