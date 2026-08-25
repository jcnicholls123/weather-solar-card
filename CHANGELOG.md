# Changelog

All notable changes to Weather Solar Card are recorded here. The same notes are included with GitHub releases so HACS can show them before an update.

## 0.3.2

### Added

- Direct support for `openweathermap.get_minute_forecast` when a Home Assistant OpenWeatherMap v3.0 weather entity is selected.
- Documented OpenWeather One Call API 4.0 REST-sensor setup, including secure API-key storage and a safe polling interval.
- Persistent release notes and changelog for HACS updates.

### Fixed

- Met Office and other modern weather integrations now use Home Assistant's live `weather/subscribe_forecast` API, restoring hourly forecasts.
- Forecast subscriptions are cleaned up when the card is removed or reconfigured.
- Minute forecasts report loading and temporary failure states instead of appearing unconfigured.

## 0.3.1

- Added the repository license and corrected HACS packaging and validation.
- Added cross-platform JavaScript smoke tests.

## 0.3.0

- Initial HACS release.
- Added responsive portrait and landscape layouts, animated weather scenes, station sensors, minute precipitation, wind-unit conversion, solar position, and location-aware lunar data.
