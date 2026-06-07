"""Platform for sensor integration."""

from __future__ import annotations

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
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
    """Setup sensors from a config entry created in the integrations UI."""
    coordinator: IQStoveCoordinator = entry.runtime_data
    validCommands = ["appT", "appPhase", "appP", "appAufheiz"]
    sensors = [
        IQstoveSensor(coordinator, cmd)
        for cmd in coordinator.stove.Commands.state
        if cmd in validCommands
    ]
    async_add_entities(sensors, update_before_add=True)


class IQstoveSensor(CoordinatorEntity, SensorEntity):
    """Representation of a Sensor."""

    def __init__(self, coordinator: IQStoveCoordinator, cmd):
        """Pass coordinator to CoordinatorEntity."""
        super().__init__(coordinator)
        self.cmd = cmd
        if self.cmd == "appPhase":
            self.optionEnums = [
                "idle",
                "heating up",
                "burning",
                "add wood",
                "don't add wood",
            ]

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if self.coordinator.data and self.cmd in self.coordinator.data:
            self._attr_native_value = self.coordinator.data[self.cmd]
        self.async_write_ha_state()

    @property
    def name(self) -> str:
        """Return the name of the sensor."""
        if self.cmd == "appT":
            return "Temperature"
        if self.cmd == "appPhase":
            return "Phase"
        if self.cmd == "appP":
            return "Performance"
        if self.cmd == "appAufheiz":
            return "Heating up"
        if self.cmd == "appErr":
            return "Error"
        return "undefined"

    @property
    def native_value(self) -> int | float | str | None:
        """Return the state of the entity."""
        if not self.coordinator.data or self.cmd not in self.coordinator.data:
            return None
        value = self.coordinator.data[self.cmd]
        if value is None:
            return None
        if self.cmd == "appPhase":
            try:
                return self.optionEnums[int(value)]
            except (ValueError, IndexError):
                return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Return unit of measurement."""
        if self.cmd == "appT":
            return UnitOfTemperature.CELSIUS
        return None

    @property
    def state_class(self) -> str | None:
        """Return state class."""
        if self.cmd != "appPhase":
            return SensorStateClass.MEASUREMENT
        return None

    @property
    def device_class(self) -> str | None:
        """Return device class."""
        if self.cmd == "appT":
            return SensorDeviceClass.TEMPERATURE
        if self.cmd == "appPhase":
            return SensorDeviceClass.ENUM
        return None

    @property
    def options(self) -> list[str] | None:
        """Return ENUM options."""
        if self.cmd == "appPhase":
            return ["idle", "heating up", "burning", "add wood", "don't add wood"]
        return None

    @property
    def unique_id(self) -> str:
        """Return unique id."""
        return f"{DOMAIN}-sensor-{self.cmd}"

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
