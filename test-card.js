/* Minimal dependency-free smoke test for the browser card. */
const assert = require("node:assert/strict");

const registry = new Map();
global.HTMLElement = class { querySelectorAll() { return []; }
  attachShadow() {
    const card = { _innerHTML: "", _writes: 0, querySelectorAll() { return []; }, get innerHTML() { return this._innerHTML; }, set innerHTML(value) { this._innerHTML = value; this._writes++; } };
    this.shadowRoot = {
      innerHTML: "",
      querySelector(selector) { return selector === "ha-card" ? card : null; },
      _card: card,
    };
    return this.shadowRoot;
  }
};
global.customElements = {
  define(name, element) { registry.set(name, element); },
  get(name) { return registry.get(name); },
};
global.document = { createElement(name) { const Element = registry.get(name); return Element ? new Element() : {}; } };
global.window = { customCards: [] };

(async () => {
  const Card = registry.get("weather-solar-card");
  assert.ok(Card, "card custom element should be registered");
  const card = new Card();
  card.setConfig({
    weather_entity: "weather.home",
    sun_entity: "sun.sun",
    openweathermap_entity: "weather.openweathermap",
    temperature_entity: "sensor.outdoor_temperature",
    weather_alert_entity: "sensor.met_office_weather_warnings",
  });
  let forecastRequest;
  let minuteRequest;
  let unsubscribed = false;
  const forecast = [
    { datetime: "2026-08-25T14:00:00+01:00", condition: "rainy", temperature: 14, precipitation_probability: 88 },
    { datetime: "2026-08-25T15:00:00+01:00", condition: "partlycloudy", temperature: 16, precipitation_probability: 22 },
  ];
  const minuteForecast = Array.from({ length: 60 }, (_, index) => ({ precipitation: index >= 3 && index < 10 ? 0.6 : 0 }));

  card.hass = {
    config: { latitude: 51.5074, longitude: -0.1278, time_zone: "Europe/London", unit_system: { temperature: "°C", length: "km", wind_speed: "km/h", pressure: "hPa" } },
    states: {
      "weather.home": {
        state: "rainy",
        attributes: { friendly_name: "Back Garden", temperature: 15, humidity: 81, wind_speed: 11, pressure: 1008, cloud_coverage: 92 },
      },
      "sensor.outdoor_temperature": { state: "13.6", attributes: {} },
      "weather.openweathermap": { state: "rainy", attributes: {} },
      "sensor.met_office_weather_warnings": { state: "2", attributes: { entries: [
        { title: "Yellow warning of thunderstorms", summary: "Heavy rain is likely Wednesday.", link: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings?day=wednesday" },
        { title: "Yellow warning of thunderstorms Thursday", summary: "Thunderstorms are possible Thursday.", links: [{ rel: "alternate", href: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings?day=thursday" }] },
      ] } },
      "sun.sun": { state: "above_horizon", attributes: { elevation: 21.4, azimuth: 164, next_rising: "2026-08-26T05:03:00+01:00", next_setting: "2026-08-25T14:30:00+01:00" } },
    },
    connection: {
      async subscribeMessage(callback, request) {
        forecastRequest = request;
        callback({ type: "hourly", forecast });
        return () => { unsubscribed = true; };
      },
    },
    async callWS(request) {
      minuteRequest = request;
      return { response: { "weather.openweathermap": { forecast: minuteForecast } } };
    },
  };

  await new Promise((resolve) => setTimeout(resolve, 0));
  const html = card.shadowRoot._card.innerHTML;
  assert.match(html, /Back Garden/);
  assert.match(html, /14<span/);
  assert.match(html, /Rain expected in 3 minutes/);
  assert.match(html, /Hourly forecast/);
  assert.equal(typeof card._bindScrollInteractions, "function");
  const scrollListeners = {};
  const scroller = { scrollWidth:500, clientWidth:200, scrollLeft:0, classList:{ add() {}, remove() {} }, addEventListener(name, callback) { scrollListeners[name] = callback; } };
  card._bindScrollInteractions({ querySelectorAll() { return [scroller]; } });
  scrollListeners.pointerdown({ pointerType:"mouse", button:0, clientX:100, pointerId:1 });
  scrollListeners.pointermove({ clientX:60, preventDefault() {} });
  assert.equal(scroller.scrollLeft, 40);
  let wheelPrevented = false;
  scrollListeners.wheel({ deltaX:0, deltaY:30, preventDefault() { wheelPrevented = true; } });
  assert.equal(scroller.scrollLeft, 70);
  assert.equal(wheelPrevented, true);
  assert.match(html, /Swipe/);
  assert.match(html, /Sunset/);
  assert.match(html, /weather-alert yellow/);
  assert.match(html, /Yellow warning of thunderstorms/);
  assert.match(html, /2 warnings/);
  assert.match(html, /Thunderstorms are possible Thursday/);
  assert.match(html, /<details class="weather-alert/);
  assert.match(html, /weather\.metoffice\.gov\.uk/);
  card._hass.states["sensor.met_office_weather_warnings"] = { state: "off", attributes: {} };
  assert.equal(card._weatherAlert(), null);
  assert.equal(card._safeUrl("javascript:alert(1)"), "");
  card._hass.states["sensor.met_office_weather_warnings"] = { state: "2026-08-25T12:00:00+01:00", attributes: { title: "Red warning of rain" } };
  assert.equal(card._weatherAlert().severity, "red");
  card._hass.states["sensor.met_office_weather_warnings"] = { state: "2", attributes: { entries: [
    { title: "Yellow warning of thunderstorms", summary: "Heavy rain is likely Wednesday.", link: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings?day=wednesday" },
    { title: "Yellow warning of thunderstorms Thursday", summary: "Thunderstorms are possible Thursday.", links: [{ rel: "alternate", href: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings?day=thursday" }] },
  ] } };
  assert.match(html, /21\.4°/);
  assert.match(html, /sun-marker/);
  assert.doesNotMatch(html, /sun-dot/);
  assert.match(html, /Local moon/);
  assert.match(html, /(high|Below horizon)/);
  assert.match(html, /illuminated/);
  assert.match(html, /particle rain/);
  assert.equal(forecastRequest.type, "weather/subscribe_forecast");
  assert.equal(forecastRequest.entity_id, "weather.home");
  assert.equal(forecastRequest.forecast_type, "hourly");
  assert.equal(minuteRequest.domain, "openweathermap");
  assert.equal(minuteRequest.return_response, true);
  const renderWrites = card.shadowRoot._card._writes;
  card.hass = { ...card._hass, states: { ...card._hass.states, "sensor.unrelated": { state: "changed", attributes: {} } } };
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(card.shadowRoot._card._writes, renderWrites, "unrelated entity updates should not rebuild the card");
  card._hass.states["sensor.rest_minute"] = { state: "2026-08-25T14:00:00+01:00", attributes: { data: [{ precipitation: 0 }, { precipitation: 0.4 }] } };
  card.config.minute_forecast_entity = "sensor.rest_minute";
  assert.equal(card._minuteData().first, 1);
  assert.equal(card._number(null, Number(undefined)), null);
  assert.match(card._sceneClass("partlycloudy", false, 20), /partly/);
  assert.doesNotMatch(card._sceneClass("partlycloudy", false, 20), /cloudy/);
  assert.match(card._sceneClass("windy", false, 20), /windy-scene/);
  assert.match(card._windSceneClass(30, 90, "mph"), /gale reverse/);
  assert.equal(card._windSceneClass(8, 270, "mph"), "breeze");
  assert.match(card._sceneClass("fog", false, 5), /foggy/);
  assert.match(card._particles("hail"), /particle hail/);
  assert.ok(Math.abs(card._convertWind(43, "km/h", "mph") - 26.72) < .02);
  assert.ok(Math.abs(card._convertWind(20, "mph", "km/h") - 32.19) < .02);
  assert.ok(Math.abs(card._convertDistance(34.8, "km", "mi") - 21.62) < .02);
  assert.ok(Math.abs(card._convertDistance(10, "mi", "km") - 16.09) < .02);
  assert.equal(window.customCards[0].type, "weather-solar-card");
  const Editor = registry.get("weather-solar-card-editor");
  const editor = new Editor();
  editor.setConfig({ weather_entity: "weather.home" });
  const editorMarkup = editor.innerHTML;
  editor.hass = card._hass;
  assert.equal(editor.innerHTML, editorMarkup, "HA state updates should not rebuild the editor or close an open dropdown");
  const knownPosition = MOON_ASTRONOMY.position(new Date("2026-08-25T22:00:00Z"), 51.5074, -0.1278);
  const knownIllumination = MOON_ASTRONOMY.illumination(new Date("2026-08-25T22:00:00Z"));
  const knownTimes = MOON_ASTRONOMY.times(new Date("2026-08-24T23:00:00Z"), new Date("2026-08-25T23:00:00Z"), 51.5074, -0.1278);
  assert.ok(knownPosition.azimuth >= 0 && knownPosition.azimuth < 360);
  assert.ok(knownPosition.altitude >= -90 && knownPosition.altitude <= 90);
  assert.ok(knownIllumination.fraction >= 0 && knownIllumination.fraction <= 1);
  assert.ok(["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"].includes(card._moonPhaseIcon(new Date("2026-08-25T22:00:00Z"))));
  assert.ok(knownTimes.rise instanceof Date && knownTimes.set instanceof Date);
  card.disconnectedCallback();
  assert.equal(unsubscribed, true);
  console.log("Weather Solar Card smoke test passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
