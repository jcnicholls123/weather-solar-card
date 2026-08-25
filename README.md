# Weather Solar Card

An animated, station-first weather card for Home Assistant. It combines a live iOS-inspired weather scene, minute precipitation, an hourly forecast, the sun's current position, sunrise/sunset, moon phase, and local weather-station measurements in one responsive card.

No cloud service or JavaScript dependency is required by the card. Your chosen Home Assistant integrations remain the source of all weather data.

## Features

- Animated day, dusk, night, cloud, rain, snow, and lightning scenes
- Distinct partly-cloudy, overcast, wind-gust, layered-fog, hail, sleet, and heavy-rain atmospheres
- Standard Home Assistant `weather.*` hourly forecasts through Home Assistant's live forecast subscription
- Local station overrides for temperature, apparent temperature, humidity, pressure, wind, UV, visibility, cloud cover, rain rate, and daily rainfall
- Next-hour rain chart from an integration-provided array or separate rain start/duration/amount sensors
- Live sun elevation and azimuth from `sun.sun`, plus sunrise and sunset
- Location-aware moon phase, illumination, altitude, azimuth, rise/set, visibility, and observer-relative orientation
- Responsive phone, tablet, and dashboard layout
- Automatic compact landscape layouts: two columns on smaller phones and three columns on larger phones/tablets
- Visual card editor for the essential settings
- Reduced-motion support

## Install

### HACS (recommended)

[![Open your Home Assistant instance and add this repository to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jcnicholls123&repository=weather-solar-card&category=plugin)

Or add it manually:

1. In HACS, open the three-dot menu and choose **Custom repositories**.
2. Enter `https://github.com/jcnicholls123/weather-solar-card`.
3. Select **Dashboard** as the category, then choose **Add**.
4. Find **Weather Solar Card** in HACS and install it.
5. Refresh Home Assistant, then add the card from the dashboard card picker.

HACS should register `/hacsfiles/weather-solar-card/weather-solar-card.js` as a module automatically.

### Manual installation

Copy `weather-solar-card.js` to:

```text
/config/www/weather-solar-card.js
```

In Home Assistant, open **Settings → Dashboards → Resources**, then add:

```text
/local/weather-solar-card.js
```

Choose **JavaScript Module**, refresh the browser, and add the card using the visual card picker or YAML.

## Starter configuration

```yaml
type: custom:weather-solar-card
name: Home
weather_entity: weather.home
sun_entity: sun.sun
```

## Full weather-station example

Entity names vary by station and integration. Replace these examples with yours.

```yaml
type: custom:weather-solar-card
name: Home
weather_entity: weather.home
sun_entity: sun.sun

# Live station measurements override attributes from weather.home
temperature_entity: sensor.weather_station_temperature
apparent_temperature_entity: sensor.weather_station_feels_like
humidity_entity: sensor.weather_station_humidity
pressure_entity: sensor.weather_station_pressure
wind_speed_entity: sensor.weather_station_wind_speed
wind_bearing_entity: sensor.weather_station_wind_direction
rain_rate_entity: sensor.weather_station_rain_rate
daily_rain_entity: sensor.weather_station_rain_today
uv_index_entity: sensor.weather_station_uv_index
visibility_entity: sensor.weather_station_visibility
cloud_coverage_entity: sensor.weather_station_cloud_cover

# Optional native phase data. The card calculates it if omitted.
moon_phase_entity: sensor.moon_phase
moon_illumination_entity: sensor.moon_illumination

# Optional location overrides. Normally inherited from Home Assistant.
# latitude: 51.5074
# longitude: -0.1278
# time_zone: Europe/London

# Optional minute precipitation source; see below.
minute_forecast_entity: sensor.precipitation_next_hour

# Or use the HA OpenWeatherMap integration in v3.0 mode directly.
# openweathermap_entity: weather.openweathermap

forecast_type: hourly
hours_to_show: 12
show_minute_forecast: true
show_forecast: true
show_solar: true
show_details: true
animate: true
```

## Minute precipitation

Accurate “rain in 8 minutes, lasting 17 minutes” data cannot be inferred from a normal hourly forecast or a physical rain gauge. It needs a nowcast integration for your location. The card accepts either format below.

The Met Office integration supplies hourly forecasts and next-hour rain probability, but not 60 individual one-minute values. You can keep Met Office as `weather_entity` and use a separate minute source only for this panel.

### OpenWeather One Call API 4.0

Home Assistant's built-in OpenWeatherMap integration currently documents its minute action for v3.0 mode. For a One Call 4.0 subscription, expose the official 1-minute timeline as a REST sensor instead.

Store the API key in `secrets.yaml`:

```yaml
openweathermap_api_key: YOUR_API_KEY
```

Then add this to `configuration.yaml`:

```yaml
rest:
  - resource: https://api.openweathermap.org/data/4.0/onecall/timeline/1min
    scan_interval: 600
    params:
      lat: "{{ state_attr('zone.home', 'latitude') }}"
      lon: "{{ state_attr('zone.home', 'longitude') }}"
      appid: !secret openweathermap_api_key
    sensor:
      - name: OpenWeather Minute Forecast
        unique_id: openweather_minute_forecast
        value_template: "{{ now().isoformat() }}"
        json_attributes:
          - data
```

Restart Home Assistant, then configure the card with:

```yaml
weather_entity: weather.met_office_dartford
minute_forecast_entity: sensor.openweather_minute_forecast
```

This polls every ten minutes—about 144 calls per day. OpenWeather's One Call 4.0 plan includes 1,000 free calls per day but enables paid overage, so set the account's daily call limit to 1,000 before use.

### Home Assistant OpenWeatherMap v3.0 mode

If your Home Assistant OpenWeatherMap integration is already configured in `v3.0` mode, the card can call its native minute action directly without a template or REST sensor:

```yaml
weather_entity: weather.met_office_dartford
openweathermap_entity: weather.openweathermap
```

### Array format

Set `minute_forecast_entity` to any entity whose attributes contain `forecast`, `minutes`, or `data`. The selected attribute must be an array with up to 60 entries. Each entry may be:

```yaml
# Plain intensities
forecast: [0, 0, 0.1, 0.4, 0.7, 0.2, 0]

# Or objects; precipitation, intensity, or value is accepted
forecast:
  - precipitation: 0
  - precipitation: 0.2
  - precipitation: 0.8
```

Values are treated as relative precipitation intensity for the graph. The card finds the first and last wet minute and creates the natural-language headline.

### Separate sensors

If your template or nowcast integration exposes individual values:

```yaml
rain_start_minutes_entity: sensor.rain_start_in_minutes
rain_duration_minutes_entity: sensor.rain_duration_minutes
expected_rain_entity: sensor.rain_expected_next_hour
```

The expected-rain sensor is used for both the graph intensity and the headline amount. Keep its unit consistent with `precipitation_unit`.

## All options

| Option | Default | Purpose |
| --- | --- | --- |
| `weather_entity` | `weather.home` | Condition, fallback measurements, and hourly forecast |
| `sun_entity` | `sun.sun` | Solar elevation, azimuth, next rising and next setting |
| `name` | entity name | Heading above the current temperature |
| `forecast_type` | `hourly` | Home Assistant forecast type |
| `hours_to_show` | `12` | Number of forecast periods |
| `minute_forecast_entity` | — | Entity containing a minute intensity array |
| `openweathermap_entity` | — | Optional HA OpenWeatherMap v3.0 weather entity for its native minute action |
| `rain_start_minutes_entity` | — | Minutes until rain starts |
| `rain_duration_minutes_entity` | — | Expected rain duration in minutes |
| `expected_rain_entity` | — | Expected precipitation amount |
| `temperature_entity` | — | Station air temperature |
| `apparent_temperature_entity` | — | Station feels-like temperature |
| `humidity_entity` | — | Relative humidity |
| `pressure_entity` | — | Atmospheric pressure |
| `wind_speed_entity` | — | Current wind speed |
| `wind_bearing_entity` | — | Wind direction in degrees |
| `rain_rate_entity` | — | Current rainfall per hour |
| `daily_rain_entity` | — | Accumulated rainfall today |
| `uv_index_entity` | — | UV index |
| `visibility_entity` | — | Visibility distance |
| `cloud_coverage_entity` | — | Cloud coverage percentage |
| `moon_phase_entity` | calculated | Moon phase label |
| `moon_illumination_entity` | calculated | Illuminated percentage |
| `latitude` | HA location | Optional observer latitude override |
| `longitude` | HA location | Optional observer longitude override |
| `time_zone` | HA timezone | Optional local-time override for lunar and solar times |
| `temperature_unit` | `auto` | Display/unit fallback override |
| `wind_speed_unit` | `auto` | Converts wind readings to `mph` when selected |
| `precipitation_unit` | `auto` | Display/unit fallback override |
| `show_minute_forecast` | `true` | Show next-hour precipitation |
| `show_forecast` | `true` | Show hourly forecast |
| `show_solar` | `true` | Show solar path and times |
| `show_details` | `true` | Show station measurement tiles |
| `animate` | `true` | Enable weather particles |

## Notes

- Home Assistant's location and timezone settings determine all displayed local times.
- `sun.sun` is built into Home Assistant. Keep the Home location accurate for correct solar data.
- Lunar illumination and phase are calculated locally from the current time. Home Assistant latitude, longitude, and timezone provide local altitude, azimuth, horizon visibility, moonrise/moonset, and observer-relative disk orientation. Optional card-level location values override the HA defaults.
- A configured moon phase or illumination entity overrides that specific calculated value; local position and rise/set calculations still continue.
- If hourly forecast stays empty, confirm that the selected weather integration supports hourly forecasts.
- Browser-level reduced-motion settings turn off particle motion automatically.
- The visual card editor includes a **Use mph** toggle. It converts weather-entity or station-sensor readings from km/h, m/s, knots, or ft/s; switching it off returns to Home Assistant's native unit. YAML users can set `wind_speed_unit: mph` directly.

## Development

The card intentionally ships as one browser-ready ES module. Validate it with:

```powershell
node --check weather-solar-card.js
```

The local lunar-position calculations use the SunCalc/Meeus astronomical approach. Attribution and license details are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Release history is maintained in [CHANGELOG.md](CHANGELOG.md). GitHub release descriptions use the same notes so HACS shows what changed before an update.
