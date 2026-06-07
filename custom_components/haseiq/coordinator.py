"""Manage data fetching and updates for the IQ Stove integration."""

import asyncio
from datetime import timedelta
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN
from .IQstove import IQstove, IQStoveConnectionError

_LOGGER = logging.getLogger(__name__)


class IQStoveCoordinator(DataUpdateCoordinator):
    """Class to manage the fetching of data from the IQ Stove."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        stove: IQstove,
        update_interval: int = 30,
    ) -> None:
        self.stove = stove
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN} ({entry.unique_id})",
            update_interval=timedelta(seconds=update_interval),
        )

    async def _async_setup(self):
        """Set up the coordinator. Does NOT fail if the stove is offline."""
        _LOGGER.debug("Starting stove setup...")
        try:
            await self.stove.connect()
            _LOGGER.debug("Stove connected successfully during setup")

            for cmd in self.stove.Commands.info + self.stove.Commands.state:
                self.stove.getValue(cmd)

            # Wait up to 10 s for values to arrive
            timeout = 10.0
            interval = 0.1
            elapsed = 0.0
            while (
                not self._are_values_populated(
                    self.stove.Commands.info + self.stove.Commands.state
                )
                and elapsed < timeout
            ):
                await asyncio.sleep(interval)
                elapsed += interval

            if not self._are_values_populated(
                self.stove.Commands.info + self.stove.Commands.state
            ):
                _LOGGER.warning(
                    "Stove values did not fully populate during setup "
                    "(stove may still be warming up). Continuing anyway."
                )

        except IQStoveConnectionError:
            # Stove is offline — set up succeeds, entities become unavailable.
            # _async_update_data will reconnect once the stove powers on.
            _LOGGER.warning(
                "Stove is not reachable during setup. "
                "Entities will be unavailable until the stove is switched on."
            )
        except Exception as exc:
            _LOGGER.error("Unexpected error during setup: %s", exc)
            # Only re-raise for truly unexpected errors, not connection issues
            raise

    def _are_values_populated(self, commands):
        return all(
            cmd in self.stove.values and self.stove.values[cmd] is not None
            for cmd in commands
        )

    async def _async_update_data(self):
        """Fetch data – reconnects automatically if the stove was offline."""
        try:
            if not self.stove.connected:
                _LOGGER.debug("Stove not connected, attempting reconnect...")
                await self.stove.connect()
                _LOGGER.info("Stove reconnected successfully")
                # After reconnect: also re-fetch info (e.g. after stove reboot)
                for cmd in self.stove.Commands.info:
                    self.stove.getValue(cmd)

            for cmd in self.stove.Commands.state:
                self.stove.getValue(cmd)

            _LOGGER.debug("Data update completed successfully")

        except IQStoveConnectionError as exc:
            # Stove is still off → entities stay unavailable, no error spam
            _LOGGER.debug("Stove not reachable during update (still off?): %s", exc)
            raise UpdateFailed(f"Stove not reachable: {exc}") from exc

        except Exception as exc:
            _LOGGER.error("Unexpected error during data update: %s", exc)
            raise UpdateFailed(f"Unexpected error: {exc}") from exc

        return self.stove.values
