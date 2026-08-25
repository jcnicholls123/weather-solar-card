# Changelog

All notable changes to Weather Solar Card are recorded here. The same notes are included with GitHub releases so HACS can show them before an update.

## 0.3.8

### Added

- The hourly forecast can now be grabbed and dragged with a desktop mouse.
- Vertical mouse-wheel movement scrolls the hourly strip horizontally when more forecast hours are available.
- Added a visual-editor toggle and YAML `visibility_unit` option for converting visibility between kilometres and miles.

### Fixed

- In wide three-column layouts, the animated sun and sky glow now sit beside the current temperature instead of hiding behind the Sun & Moon panel.
- The animated night moon is constrained to the hero column on desktop while retaining its live astronomical position.

## 0.3.7

### Improved

- Desktop measurement tiles now wrap into a responsive four- or five-column grid, keeping rainfall and the full local-moon tile visible without hidden horizontal scrolling.
- Compact landscape cards retain their touch-friendly horizontal metric strip.

### Fixed

- Missing cloud-coverage attributes no longer render as `NaN%`; the tile is hidden until a valid value is available.

## 0.3.6

### Added

- Weather-alert banners can now be tapped to expand the complete warning summary and open the original Met Office warning.
- RSS sensors containing an `entries` array are supported directly, including multiple simultaneous warnings and alternate links.

### Fixed

- Numeric RSS sensor states no longer produce the generic “Weather warning” fallback when detailed entries are available.

## 0.3.5

### Fixed

- Entity-picker dropdowns in the visual card editor now stay open while Home Assistant state updates arrive.
- The editor updates picker data in place instead of rebuilding every control and stealing focus.

## 0.3.4

### Added

- Clear-night icons in the hourly forecast now show the astronomically calculated moon phase for that forecast time instead of a generic crescent.
- Optional weather-alert banners can read Home Assistant Feedreader event entities or normal sensors, infer Met Office yellow, amber, and red severity, and open the source warning safely.
- Added visual-editor selectors for an alert/RSS entity, an optional active-state entity, and a show-alerts toggle.

### Fixed

- The solar-path sun marker is now a true circular HTML marker at every responsive width, with a layered radial surface and glow instead of a stretched SVG ellipse.

## 0.3.3

### Added

- Sunrise and sunset now appear as timed events in the hourly forecast strip when they fall within the displayed period.
- The hourly forecast has smooth touch swiping, hour snapping, contained overscroll, and a visible swipe cue on mobile.

### Fixed

- Mobile dashboards no longer jump back to the top of the card when unrelated Home Assistant entities update.
- The card now skips identical renders and opts out of browser scroll anchoring while retaining live weather, station, solar, lunar, and forecast updates.

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
