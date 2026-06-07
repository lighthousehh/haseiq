"""The Hase iQ integration."""

from __future__ import annotations

import logging

from homeassistant import config_entries
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .coordinator import IQStoveCoordinator
from .IQstove import IQstove

_LOGGER = logging.getLogger(__name__)
PLATFORMS: list[Platform] = [Platform.BINARY_SENSOR, Platform.NUMBER, Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: config_entries.ConfigEntry):
    """Set up IQ Stove from a config entry."""
    _LOGGER.debug("Starting setup for entry: %s", entry.entry_id)

    stove = IQstove(entry.data["host"], 8080)
    coordinator = IQStoveCoordinator(hass, entry, stove, 5)

    # _async_setup lädt info+state, toleriert wenn Ofen offline ist
    await coordinator._async_setup()
    # async_refresh initialisiert coordinator.data (= stove.values)
    await coordinator.async_refresh()

    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    _LOGGER.debug("Setup completed for entry: %s", entry.entry_id)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: config_entries.ConfigEntry
) -> bool:
    """Handle removal of an entry."""
    _LOGGER.debug("Starting unload for entry: %s", entry.entry_id)
    result = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if result:
        _LOGGER.debug("Successfully unloaded entry: %s", entry.entry_id)
    else:
        _LOGGER.warning("Failed to unload entry: %s", entry.entry_id)
    return result


async def async_reload_entry(
    hass: HomeAssistant, entry: config_entries.ConfigEntry
) -> None:
    """Reload config entry."""
    _LOGGER.debug("Starting reload for entry: %s", entry.entry_id)
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
    _LOGGER.info("Reloaded entry: %s", entry.entry_id)
