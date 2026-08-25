/*
 * Weather Solar Card for Home Assistant
 * A dependency-free Lovelace custom card with local weather-station support.
 */

const CARD_VERSION = "0.3.0";
const DEFAULTS = {
  name: "",
  weather_entity: "weather.home",
  sun_entity: "sun.sun",
  forecast_type: "hourly",
  hours_to_show: 12,
  show_minute_forecast: true,
  show_solar: true,
  show_details: true,
  show_forecast: true,
  animate: true,
  temperature_unit: "auto",
  wind_speed_unit: "auto",
  precipitation_unit: "auto",
};

const CONDITION_LABELS = {
  "clear-night": "Clear night",
  cloudy: "Cloudy",
  fog: "Foggy",
  hail: "Hail",
  lightning: "Lightning",
  "lightning-rainy": "Thunderstorms",
  partlycloudy: "Partly cloudy",
  pouring: "Heavy rain",
  rainy: "Rain",
  snowy: "Snow",
  "snowy-rainy": "Sleet",
  sunny: "Sunny",
  windy: "Windy",
  "windy-variant": "Windy",
  exceptional: "Unusual weather",
};

const ICONS = {
  droplet: '<svg viewBox="0 0 24 24"><path d="M12 2S5.5 9.3 5.5 14.1a6.5 6.5 0 0 0 13 0C18.5 9.3 12 2 12 2Z"/></svg>',
  wind: '<svg viewBox="0 0 24 24"><path d="M3 8h11.5a3 3 0 1 0-2.7-4.3M3 12h16a2.5 2.5 0 1 1-2.3 3.5M3 16h8"/></svg>',
  gauge: '<svg viewBox="0 0 24 24"><path d="M4.9 19a9 9 0 1 1 14.2 0M12 13l4-4M7 17h.01M17 17h.01M6 12h.01M18 12h.01M12 7h.01"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
  uv: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  cloud: '<svg viewBox="0 0 24 24"><path d="M6.5 18h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.1A3.5 3.5 0 0 0 6.5 18Z"/></svg>',
  sunrise: '<svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 2v4M4.2 6.2l2.4 2.4M19.8 6.2l-2.4 2.4M2 14h2M20 14h2"/></svg>',
  sunset: '<svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 2v4M4.2 6.2l2.4 2.4M19.8 6.2l-2.4 2.4M2 14h2M20 14h2"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></svg>',
};

const styles = `
  :host { display:block; container-type:inline-size; --wsc-text:#fff; --wsc-muted:rgba(255,255,255,.72); font-family:var(--paper-font-body1_-_font-family, -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif); }
  * { box-sizing:border-box; }
  ha-card { overflow:hidden; color:var(--wsc-text); border:0; background:#3679b8; min-height:620px; position:relative; isolation:isolate; }
  .scene { position:absolute; inset:0; z-index:-3; overflow:hidden; background:linear-gradient(180deg,#3f92d5 0%,#6ab4e5 52%,#aacde3 100%); transition:background 1.2s ease; }
  .scene.night { background:linear-gradient(180deg,#071329 0%,#122c50 58%,#344a63 100%); }
  .scene.sunset { background:linear-gradient(180deg,#2d5792 0%,#c27273 58%,#f3a66b 100%); }
  .scene.cloudy { background:linear-gradient(180deg,#687989 0%,#8a9aa5 55%,#b4bdc3 100%); }
  .scene.rainy { background:linear-gradient(180deg,#293d52 0%,#4b6070 58%,#73818a 100%); }
  .scene.snowy { background:linear-gradient(180deg,#7796ad 0%,#aabdc9 60%,#d6e1e6 100%); }
  .scene::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.2)); pointer-events:none; }
  .stars { position:absolute; inset:0; opacity:0; transition:opacity 1s; background-image:radial-gradient(#fff 0.8px,transparent 1px),radial-gradient(#fff 0.6px,transparent .8px); background-size:61px 61px,97px 97px; background-position:7px 11px,31px 19px; }
  .night .stars { opacity:.55; animation:twinkle 4s ease-in-out infinite alternate; }
  .glow { position:absolute; width:280px; height:280px; border-radius:50%; top:-125px; right:-80px; background:radial-gradient(circle,rgba(255,239,177,.34),transparent 67%); filter:blur(2px); }
  .sun-orb { position:absolute; top:48px; right:52px; width:54px; height:54px; border-radius:50%; opacity:0; transform:scale(.8); background:radial-gradient(circle at 38% 35%,#fffbd1 0 8%,#ffe47a 32%,#ffc84d 72%); box-shadow:0 0 22px rgba(255,224,108,.85),0 0 70px rgba(255,221,94,.45); transition:opacity 1.2s,transform 1.2s; }
  .sunny-day .sun-orb { opacity:.95; transform:scale(1); animation:sunPulse 4s ease-in-out infinite alternate; }
  .sky-moon { --moon-flip:1; position:absolute; top:var(--moon-y,52px); left:var(--moon-x,calc(100% - 72px)); width:48px; height:48px; border-radius:50%; background:#eeeedb; box-shadow:0 0 22px rgba(242,242,211,.5); opacity:0; transform:translate(-50%,-50%) rotate(var(--moon-tilt,0deg)) scale(.7) scaleX(var(--moon-flip)); transition:opacity 1.2s,transform 1.2s,top 1.2s,left 1.2s; overflow:hidden; }
  .night .sky-moon { opacity:.9; transform:translate(-50%,-50%) rotate(var(--moon-tilt,0deg)) scale(1) scaleX(var(--moon-flip)); }.night.has-clouds .sky-moon{opacity:.58;filter:blur(.5px)}
  .sky-moon::after { content:""; position:absolute; inset:-2px; border-radius:50%; background:#102849; transform:translateX(52px); }
  .sky-moon.new::after{transform:translateX(0)}.sky-moon.crescent::after{transform:translateX(13px)}.sky-moon.quarter::after{transform:translateX(25px)}.sky-moon.gibbous::after{transform:translateX(38px)}.sky-moon.full::after{transform:translateX(52px)}
  .sky-moon.waning{--moon-flip:-1}.night .sky-moon.below{opacity:0}
  .cloud-layer { position:absolute; inset:0; opacity:0; transition:opacity 1s; }
  .has-clouds .cloud-layer { opacity:1; }
  .cloud-shape { position:absolute; width:260px; height:72px; border-radius:60%; background:rgba(255,255,255,.14); filter:blur(16px); animation:drift 24s linear infinite; }
  .cloud-shape:nth-child(1){top:9%;left:-40%;}.cloud-shape:nth-child(2){top:29%;left:-65%;animation-delay:-11s;animation-duration:32s;transform:scale(.72)}.cloud-shape:nth-child(3){top:14%;right:9%;width:220px;opacity:.85;animation:cloudBreathe 9s ease-in-out infinite alternate}
  .wind-layer,.fog-layer { position:absolute; inset:0; opacity:0; transition:opacity 1s; overflow:hidden; }
  .windy-scene .wind-layer { opacity:.88; }
  .wind-streams { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .wind-stream { fill:none; stroke:rgba(226,245,255,.68); stroke-width:1.35; vector-effect:non-scaling-stroke; stroke-linecap:round; stroke-dasharray:11 24 3 31; filter:drop-shadow(0 0 2px rgba(205,238,255,.38)); animation:windFlow 2.8s linear infinite; }
  .wind-stream:nth-child(2){animation-delay:-1.1s;animation-duration:3.6s;opacity:.7}.wind-stream:nth-child(3){animation-delay:-2.4s;animation-duration:3.1s;opacity:.85}.wind-stream:nth-child(4){animation-delay:-.6s;animation-duration:4.2s;opacity:.55}.wind-stream:nth-child(5){animation-delay:-3s;animation-duration:3.4s;opacity:.72}
  .wind-leaf { position:absolute; left:-8%; width:12px; height:7px; border-radius:90% 10% 90% 10%; background:#b58a52; box-shadow:0 0 4px rgba(27,46,57,.38); animation:leafTumble 5.4s linear infinite; }
  .wind-leaf.l1{top:24%;animation-delay:-1.2s}.wind-leaf.l2{top:55%;animation-delay:-3.9s;animation-duration:6.1s;background:#769061;transform:scale(.75)}.wind-leaf.l3{top:76%;animation-delay:-2.4s;animation-duration:4.8s;background:#9b7145;transform:scale(.6)}
  .foggy .fog-layer { opacity:.8; }
  .fog-band { position:absolute; left:-20%; width:140%; height:76px; border-radius:50%; background:rgba(235,243,246,.2); filter:blur(18px); animation:fogDrift 12s ease-in-out infinite alternate; }
  .fog-band:nth-child(1){top:18%}.fog-band:nth-child(2){top:43%;animation-delay:-5s;opacity:.75}.fog-band:nth-child(3){top:68%;animation-delay:-9s;opacity:.6}
  .particles { position:absolute; inset:0; overflow:hidden; opacity:.85; }
  .particle { position:absolute; top:-12%; animation:fall linear infinite; }
  .particle.rain { width:1.5px; height:20px; border-radius:2px; background:linear-gradient(transparent,rgba(205,233,255,.9)); transform:rotate(8deg); }
  .particle.snow { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,.8); filter:blur(.3px); animation-name:snowfall; }
  .particle.hail { width:5px; height:7px; border-radius:50%; background:rgba(239,248,255,.95); box-shadow:0 0 4px rgba(255,255,255,.55); }
  .lightning { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(circle at 67% 22%,rgba(225,239,255,.72),rgba(166,205,240,.18) 23%,transparent 52%); }
  .lightning svg { position:absolute; top:7%; left:50%; width:38%; height:52%; overflow:visible; filter:drop-shadow(0 0 5px #d8ecff) drop-shadow(0 0 13px rgba(191,220,255,.8)); }
  .lightning-bolt { fill:none; stroke:#f8fbff; stroke-width:1.15; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:500; stroke-dashoffset:500; opacity:0; }
  .lightning-bolt.secondary { stroke-width:.65; }
  .storm .lightning { animation:skyFlash 8s infinite; }
  .storm .lightning-bolt.main { animation:boltFlash 8s infinite; }.storm .lightning-bolt.secondary { animation:boltFlashSecondary 8s infinite; }
  .content { padding:22px 22px 18px; display:grid; gap:15px; }
  .hero { min-height:225px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding-top:8px; text-shadow:0 2px 12px rgba(0,0,0,.18); }
  .location { font-size:16px; font-weight:600; letter-spacing:.01em; opacity:.95; }
  .temperature { font-size:84px; line-height:.98; font-weight:200; letter-spacing:-5px; margin:4px 0 2px; }
  .condition { font-size:20px; font-weight:500; }
  .high-low { font-size:15px; margin-top:3px; color:var(--wsc-muted); }
  .summary { margin:0; padding:13px 15px; border-radius:17px; background:rgba(15,31,50,.18); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.14); font-size:14px; line-height:1.35; }
  .panel { border-radius:20px; background:rgba(15,31,50,.22); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.14); overflow:hidden; box-shadow:0 14px 30px rgba(0,0,0,.08); }
  .panel-title { height:38px; padding:12px 14px 8px; color:rgba(255,255,255,.63); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:flex; align-items:center; gap:7px; }
  .panel-title svg { width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
  .minute-copy { padding:0 14px 8px; font-size:17px; font-weight:600; }
  .minute-chart { height:82px; display:flex; align-items:flex-end; gap:2px; padding:7px 14px 3px; position:relative; }
  .minute-chart::before { content:""; position:absolute; left:14px; right:14px; bottom:3px; border-bottom:1px solid rgba(255,255,255,.18); }
  .rain-bar { flex:1; min-width:2px; border-radius:3px 3px 0 0; background:linear-gradient(#7dd4ff,#3ba8ec); opacity:.88; transition:height .5s; }
  .minute-axis { display:flex; justify-content:space-between; padding:3px 14px 11px; color:rgba(255,255,255,.58); font-size:10px; }
  .hourly { display:flex; overflow-x:auto; padding:4px 7px 13px; scrollbar-width:none; scroll-snap-type:x proximity; }
  .hourly::-webkit-scrollbar{display:none}.hour { min-width:64px; display:grid; justify-items:center; gap:6px; padding:5px 2px; scroll-snap-align:start; font-size:12px; }
  .hour-time { font-weight:600; }.hour-icon { font-size:25px; height:31px; filter:drop-shadow(0 2px 3px rgba(0,0,0,.12)); }.hour-pop { color:#85d7ff; font-size:10px; min-height:12px; }.hour-temp { font-size:15px; font-weight:600; }
  .solar-body { padding:0 14px 13px; }
  .solar-chart { height:115px; position:relative; overflow:hidden; }
  .solar-chart svg { width:100%; height:100%; overflow:visible; }
  .solar-path { fill:none; stroke:rgba(255,255,255,.27); stroke-width:1.4; stroke-dasharray:4 4; }
  .solar-horizon { stroke:rgba(255,255,255,.18); stroke-width:1; }
  .solar-progress { fill:none; stroke:rgba(255,225,123,.9); stroke-width:2; }
  .sun-dot { fill:#ffe47d; filter:drop-shadow(0 0 8px rgba(255,222,104,.9)); }
  .solar-times { display:flex; justify-content:space-between; margin-top:-2px; font-size:12px; color:var(--wsc-muted); }
  .solar-times b { display:block; color:#fff; font-size:14px; margin-top:3px; }
  .solar-center { text-align:center; position:absolute; left:0; right:0; bottom:5px; font-size:11px; color:var(--wsc-muted); }.solar-center strong{display:block;color:#fff;font-size:16px;margin-bottom:1px;}
  .details { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .metric { min-height:108px; border-radius:18px; padding:12px 13px; background:rgba(15,31,50,.22); backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,.13); }
  .metric-label { color:rgba(255,255,255,.62); text-transform:uppercase; font-size:10px; font-weight:700; letter-spacing:.07em; display:flex; gap:6px; align-items:center; }
  .metric-label svg { width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
  .metric-value { font-size:27px; font-weight:400; margin-top:10px; white-space:nowrap; }.metric-note{color:var(--wsc-muted);font-size:11px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .moon { display:flex; gap:11px; align-items:center; }.moon-disc { --moon-flip:1; flex:0 0 auto; width:38px; height:38px; border-radius:50%; position:relative; overflow:hidden; background:#e7e8d7; box-shadow:0 0 12px rgba(238,240,209,.35); transform:rotate(var(--moon-tilt,0deg)) scaleX(var(--moon-flip)); }
  .moon-disc::after{content:"";position:absolute;inset:-2px;border-radius:50%;background:#52627a;transform:translateX(42px)}
  .moon-disc.new::after{transform:translateX(0)}.moon-disc.crescent::after{transform:translateX(10px)}.moon-disc.quarter::after{transform:translateX(20px)}.moon-disc.gibbous::after{transform:translateX(30px)}.moon-disc.full::after{transform:translateX(42px)}.moon-disc.waning{--moon-flip:-1}
  .moon-metric { grid-column:1/-1; min-height:132px; }
  .moon-metric .moon { align-items:flex-start; margin-top:8px; }
  .moon-copy { min-width:0; overflow:hidden; }
  .moon-position { color:var(--wsc-muted); font-size:10px; line-height:1.3; margin-top:3px; white-space:normal; overflow-wrap:anywhere; }
  .error { margin:16px; padding:14px; background:var(--error-color,#db4437); border-radius:12px; color:white; }
  @keyframes drift { from{transform:translateX(0)}to{transform:translateX(calc(100vw + 420px))} }
  @keyframes fall { to{transform:translate(55px,115vh) rotate(8deg)} }
  @keyframes snowfall { to{transform:translate(35px,115vh) rotate(360deg)} }
  @keyframes skyFlash { 0%,63%,68%,100%{opacity:0}63.5%{opacity:.24}64.1%{opacity:.05}64.7%{opacity:.52}66%{opacity:.08}67%{opacity:.3} }
  @keyframes boltFlash { 0%,63%,68%,100%{opacity:0;stroke-dashoffset:500}63.25%{opacity:1;stroke-dashoffset:500}64.55%{opacity:1;stroke-dashoffset:0}65.2%{opacity:.08;stroke-dashoffset:0}65.5%{opacity:1;stroke-dashoffset:0}67%{opacity:0;stroke-dashoffset:0} }
  @keyframes boltFlashSecondary { 0%,64%,68%,100%{opacity:0;stroke-dashoffset:500}64.35%{opacity:.9;stroke-dashoffset:500}65.4%{opacity:.9;stroke-dashoffset:0}66.2%{opacity:.12;stroke-dashoffset:0}66.5%{opacity:.85;stroke-dashoffset:0}67.4%{opacity:0;stroke-dashoffset:0} }
  @keyframes twinkle { from{opacity:.35}to{opacity:.66} }
  @keyframes sunPulse { from{box-shadow:0 0 20px rgba(255,224,108,.8),0 0 60px rgba(255,221,94,.38)}to{box-shadow:0 0 30px rgba(255,232,132,.95),0 0 88px rgba(255,221,94,.55)} }
  @keyframes windFlow { from{stroke-dashoffset:0}to{stroke-dashoffset:-69} }
  @keyframes leafTumble { 0%{transform:translate(-5vw,0) rotate(0deg);opacity:0}12%{opacity:.8}45%{transform:translate(48vw,-22px) rotate(410deg)}70%{transform:translate(78vw,18px) rotate(690deg);opacity:.9}100%{transform:translate(116vw,-10px) rotate(980deg);opacity:0} }
  @keyframes fogDrift { from{transform:translateX(-4%) scaleY(.9)}to{transform:translateX(5%) scaleY(1.15)} }
  @keyframes cloudBreathe { from{transform:translate(-7px,-3px) scale(.92)}to{transform:translate(10px,5px) scale(1.08)} }
  @container (min-width:560px) and (max-width:699px) {
    ha-card { min-height:0; }
    .content { grid-template-columns:.82fr 1.18fr; grid-template-rows:190px auto auto auto auto; align-items:stretch; gap:11px; padding:16px; }
    .hero { min-height:0; grid-column:1; grid-row:1; padding:0; }
    .temperature { font-size:72px; }
    .summary { grid-column:1; grid-row:2; display:flex; align-items:center; padding:10px 12px; }
    .minute-panel { grid-column:2; grid-row:1/3; }
    .forecast-panel { grid-column:1/3; grid-row:3; }
    .solar-panel { grid-column:1/3; grid-row:4; }
    .details { grid-column:1/3; grid-row:5; display:flex; overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none; padding-bottom:1px; }
    .details::-webkit-scrollbar { display:none; }
    .metric { flex:1 0 145px; min-height:98px; scroll-snap-align:start; }
    .moon-metric { flex-basis:245px; min-height:118px; }
    .hour { min-width:68px; }
  }
  @container (min-width:700px) {
    ha-card { min-height:0; }
    .content { grid-template-columns:.8fr 1.15fr 1fr; grid-template-rows:210px auto auto auto; align-items:stretch; gap:12px; padding:18px; }
    .hero { min-height:0; grid-column:1; grid-row:1; padding:0; }
    .temperature { font-size:78px; }
    .summary { grid-column:1; grid-row:2; display:flex; align-items:center; padding:11px 13px; }
    .minute-panel { grid-column:2; grid-row:1/3; }
    .solar-panel { grid-column:3; grid-row:1/3; }
    .forecast-panel { grid-column:1/4; grid-row:3; }
    .details { grid-column:1/4; grid-row:4; display:flex; overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none; padding-bottom:1px; }
    .details::-webkit-scrollbar { display:none; }
    .metric { flex:1 0 150px; min-height:100px; scroll-snap-align:start; }
    .moon-metric { flex-basis:245px; min-height:118px; }
    .hour { min-width:72px; }
  }
  @media (prefers-reduced-motion:reduce){ .particle,.cloud-shape,.stars,.lightning,.lightning-bolt,.sun-orb,.wind-stream,.wind-leaf,.fog-band{animation:none!important}.particles,.wind-leaf{display:none} }
`;

// Location-aware lunar calculations adapted from the BSD-2-Clause SunCalc
// project (mourner/suncalc), based on Jean Meeus' Astronomical Algorithms.
// See THIRD_PARTY_NOTICES.md. Kept inline so the HA card remains dependency-free.
const MOON_ASTRONOMY = (() => {
  const PI = Math.PI;
  const rad = PI / 180;
  const dayMs = 86400000;
  const hourMs = 3600000;

  const toDays = (date) => date.valueOf() / dayMs - 0.5 + 2440588 - 2451545;
  const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(rad * 23.4397) - Math.tan(b) * Math.sin(rad * 23.4397), Math.cos(l));
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(rad * 23.4397) + Math.cos(b) * Math.sin(rad * 23.4397) * Math.sin(l));
  const altitude = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
  const astroRefraction = (h) => {
    const safe = Math.max(0, h);
    return 0.0002967 / Math.tan(safe + 0.00312536 / (safe + 0.08901179));
  };
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) => M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + PI;
  const sunCoords = (d) => {
    const L = eclipticLongitude(solarMeanAnomaly(d));
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
  };
  const moonCoords = (d) => {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.22935 * d);
    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);
    const dist = 385001 - 20905 * Math.cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist };
  };

  const position = (date, lat, lng) => {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    const h = altitude(H, phi, c.dec);
    const pa = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(c.dec) - Math.sin(c.dec) * Math.cos(H));
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(c.dec) * Math.cos(phi));
    return {
      altitude: (h + astroRefraction(h)) / rad,
      azimuth: (az / rad + 540) % 360,
      distance: c.dist,
      parallacticAngle: pa / rad,
    };
  };

  const illumination = (date) => {
    const d = toDays(date);
    const s = sunCoords(d);
    const m = moonCoords(d);
    const sunDistance = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sunDistance * Math.sin(phi), m.dist - sunDistance * Math.cos(phi));
    const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    const waxing = angle < 0;
    return {
      fraction: (1 + Math.cos(inc)) / 2,
      phase: 0.5 + 0.5 * inc * (waxing ? -1 : 1) / PI,
      angle: angle / rad,
      waxing,
    };
  };

  const moonHeight = (date, lat, lng) => position(date, lat, lng).altitude - 0.133;
  const refineCrossing = (timestamp, lat, lng) => {
    for (let i = 0; i < 2; i++) {
      const h = moonHeight(new Date(timestamp), lat, lng);
      const dh = (moonHeight(new Date(timestamp + 30000), lat, lng) - moonHeight(new Date(timestamp - 30000), lat, lng)) / 60000;
      if (!Number.isFinite(dh) || Math.abs(dh) < 1e-8) break;
      timestamp -= h / dh;
    }
    return new Date(timestamp);
  };

  const times = (start, end, lat, lng) => {
    const hours = Math.max(1, (end - start) / hourMs);
    let h0 = moonHeight(start, lat, lng);
    let rise;
    let set;
    let highest = h0;
    for (let i = 1; i <= hours; i += 2) {
      const h1 = moonHeight(new Date(start.valueOf() + i * hourMs), lat, lng);
      const h2 = moonHeight(new Date(start.valueOf() + Math.min(i + 1, hours) * hourMs), lat, lng);
      highest = Math.max(highest, h1, h2);
      const a = (h0 + h2) / 2 - h1;
      const b = (h2 - h0) / 2;
      const xe = -b / (2 * a);
      const discriminant = b * b - 4 * a * h1;
      let roots = 0;
      let x1 = 0;
      let x2 = 0;
      const ye = (a * xe + b) * xe + h1;
      if (discriminant >= 0 && Number.isFinite(xe)) {
        const dx = Math.sqrt(discriminant) / (Math.abs(a) * 2);
        x1 = xe - dx;
        x2 = xe + dx;
        if (Math.abs(x1) <= 1) roots++;
        if (Math.abs(x2) <= 1) roots++;
        if (x1 < -1) x1 = x2;
      }
      if (roots === 1) {
        if (h0 < 0) rise = i + x1;
        else set = i + x1;
      } else if (roots === 2) {
        rise = i + (ye < 0 ? x2 : x1);
        set = i + (ye < 0 ? x1 : x2);
      }
      if (rise !== undefined && set !== undefined) break;
      h0 = h2;
    }
    const result = {};
    if (rise !== undefined) result.rise = refineCrossing(start.valueOf() + rise * hourMs, lat, lng);
    if (set !== undefined) result.set = refineCrossing(start.valueOf() + set * hourMs, lat, lng);
    if (rise === undefined && set === undefined) {
      result.alwaysUp = highest > 0;
      result.alwaysDown = highest <= 0;
    }
    return result;
  };

  return { position, illumination, times };
})();

class WeatherSolarCard extends HTMLElement {
  setConfig(config) {
    if (!config) throw new Error("Configuration is required");
    this.config = { ...DEFAULTS, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${styles}</style><ha-card><div class="content"><div class="hero">Loading weather…</div></div></ha-card>`;
    if (this._hass) {
      this._forecastEntity = null;
      const weather = this._hass.states[this.config.weather_entity];
      if (weather) {
        this._loadForecast();
        this._render(weather);
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.config || !this.shadowRoot) return;
    const weather = hass.states[this.config.weather_entity];
    if (!weather) {
      this._renderError(`Entity not found: ${this.config.weather_entity}`);
      return;
    }
    if (this._forecastEntity !== this.config.weather_entity) {
      this._forecastEntity = this.config.weather_entity;
      this._loadForecast();
    }
    this._render(weather);
  }

  getCardSize() { return 8; }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find((id) => id.startsWith("weather.")) || "weather.home";
    return { type: "custom:weather-solar-card", weather_entity: entity, sun_entity: "sun.sun" };
  }

  static getConfigElement() { return document.createElement("weather-solar-card-editor"); }

  async _loadForecast() {
    if (!this._hass?.callWS || !this.config.show_forecast) return;
    try {
      const result = await this._hass.callWS({
        type: "weather/get_forecasts",
        forecast_type: this.config.forecast_type || "hourly",
        entity_ids: [this.config.weather_entity],
      });
      this._forecast = result?.[this.config.weather_entity]?.forecast || [];
      const weather = this._hass.states[this.config.weather_entity];
      if (weather) this._render(weather);
    } catch (err) {
      console.warn("Weather Solar Card: forecast unavailable", err);
      this._forecast = [];
    }
  }

  _state(id, fallback = null) {
    if (!id) return fallback;
    const entity = this._hass.states[id];
    if (!entity || ["unknown", "unavailable", "none", ""].includes(entity.state)) return fallback;
    return entity.state;
  }

  _number(id, fallback = null) {
    const state = this._state(id, fallback);
    if (state == null || state === "") return fallback;
    const value = Number(state);
    return Number.isFinite(value) ? value : fallback;
  }

  _render(weather) {
    const a = weather.attributes || {};
    const condition = weather.state || "cloudy";
    const units = this._units(a);
    const temp = this._number(this.config.temperature_entity, Number(a.temperature));
    const apparent = this._number(this.config.apparent_temperature_entity, Number(a.apparent_temperature));
    const humidity = this._number(this.config.humidity_entity, Number(a.humidity));
    const pressure = this._number(this.config.pressure_entity, Number(a.pressure));
    const windRaw = this._number(this.config.wind_speed_entity, Number(a.wind_speed));
    const wind = this._convertWind(windRaw, units.windSource, units.wind);
    const windBearing = this._number(this.config.wind_bearing_entity, Number(a.wind_bearing));
    const cloud = this._number(this.config.cloud_coverage_entity, Number(a.cloud_coverage));
    const visibility = this._number(this.config.visibility_entity, Number(a.visibility));
    const uv = this._number(this.config.uv_index_entity, null);
    const rainRate = this._number(this.config.rain_rate_entity, null);
    const dailyRain = this._number(this.config.daily_rain_entity, null);
    const forecast = (this._forecast?.length ? this._forecast : a.forecast || []).slice(0, Math.max(1, this.config.hours_to_show));
    const now = new Date();
    const sun = this._sunData(now);
    const isNight = sun.elevation != null ? sun.elevation < -2 : condition === "clear-night";
    const sceneClass = this._sceneClass(condition, isNight, sun.elevation);
    const high = this._forecastExtreme(forecast, "temperature", "max");
    const low = this._forecastExtreme(forecast, "templow", "min") ?? this._forecastExtreme(forecast, "temperature", "min");
    const minute = this._minuteData();
    const summary = this._summary(condition, temp, apparent, wind, rainRate, minute, units.precipitation, units.wind);
    const particles = this.config.animate ? this._particles(condition) : "";
    const location = this.config.name || a.friendly_name || "Weather";

    this.shadowRoot.querySelector("ha-card").innerHTML = `
      <div class="scene ${sceneClass}">
        <div class="stars"></div><div class="glow"></div><div class="sun-orb"></div><div class="sky-moon ${this._moonClass(sun.moon.phase)}${sun.moon.altitude != null && sun.moon.altitude <= 0 ? " below" : ""}" style="${this._moonSkyStyle(sun.moon)}"></div>
        <div class="cloud-layer"><i class="cloud-shape"></i><i class="cloud-shape"></i><i class="cloud-shape"></i></div>
        <div class="wind-layer"><svg class="wind-streams" viewBox="0 0 100 100" preserveAspectRatio="none"><path class="wind-stream" d="M-12 18 C10 5 24 31 48 18 S82 8 112 22"/><path class="wind-stream" d="M-18 36 C8 20 29 48 55 34 S87 25 116 39"/><path class="wind-stream" d="M-10 55 C16 42 31 67 58 53 S88 45 114 59"/><path class="wind-stream" d="M-20 73 C7 58 27 84 50 71 S83 63 118 76"/><path class="wind-stream" d="M-14 89 C14 77 33 96 61 86 S92 82 114 92"/></svg><i class="wind-leaf l1"></i><i class="wind-leaf l2"></i><i class="wind-leaf l3"></i></div>
        <div class="fog-layer"><i class="fog-band"></i><i class="fog-band"></i><i class="fog-band"></i></div>
        <div class="particles">${particles}</div><div class="lightning"><svg viewBox="0 0 100 160"><path class="lightning-bolt main" d="M61 2 42 57 59 53 34 111 48 104 31 157 76 85 57 91 83 40 64 44Z"/><path class="lightning-bolt secondary" d="M57 88 77 105 68 105 84 128M45 56 25 76 36 75 22 96"/></svg></div>
      </div>
      <div class="content">
        <section class="hero">
          <div class="location">${this._escape(location)}</div>
          <div class="temperature">${this._temperature(temp, units.temperature)}</div>
          <div class="condition">${this._escape(CONDITION_LABELS[condition] || this._title(condition))}</div>
          <div class="high-low">${high != null ? `H:${Math.round(high)}°` : ""}${high != null && low != null ? " &nbsp;" : ""}${low != null ? `L:${Math.round(low)}°` : ""}</div>
        </section>
        <p class="summary">${this._escape(summary)}</p>
        ${this.config.show_minute_forecast ? this._minutePanel(minute, units.precipitation) : ""}
        ${this.config.show_forecast ? this._forecastPanel(forecast, units) : ""}
        ${this.config.show_solar ? this._solarPanel(sun) : ""}
        ${this.config.show_details ? this._details({ humidity, pressure, wind, windBearing, cloud, visibility, uv, rainRate, dailyRain, apparent, units, now, isNight }) : ""}
      </div>`;
  }

  _units(a) {
    const length = this._hass.config?.unit_system?.length || "km";
    const weatherWindUnit = a.wind_speed_unit || this._hass.config?.unit_system?.wind_speed || "km/h";
    const stationWindUnit = this.config.wind_speed_entity ? this._hass.states[this.config.wind_speed_entity]?.attributes?.unit_of_measurement : null;
    return {
      temperature: this.config.temperature_unit === "auto" ? (a.temperature_unit || this._hass.config?.unit_system?.temperature || "°C") : this.config.temperature_unit,
      windSource: stationWindUnit || weatherWindUnit,
      wind: this.config.wind_speed_unit === "auto" ? (stationWindUnit || weatherWindUnit) : this.config.wind_speed_unit,
      pressure: a.pressure_unit || this._hass.config?.unit_system?.pressure || "hPa",
      visibility: a.visibility_unit || length,
      precipitation: this.config.precipitation_unit === "auto" ? (a.precipitation_unit || (length === "mi" ? "in" : "mm")) : this.config.precipitation_unit,
    };
  }

  _sceneClass(condition, isNight, elevation) {
    const classes = [];
    if (isNight) classes.push("night");
    else if (elevation != null && elevation < 7) classes.push("sunset");
    if (!isNight && ["sunny", "partlycloudy"].includes(condition)) classes.push("sunny-day");
    if (condition === "partlycloudy") classes.push("partly", "has-clouds");
    if (["cloudy", "fog", "windy-variant"].includes(condition)) classes.push("cloudy", "has-clouds");
    if (["windy", "windy-variant"].includes(condition)) classes.push("windy-scene");
    if (condition === "fog") classes.push("foggy");
    if (["rainy", "pouring", "hail", "lightning-rainy"].includes(condition)) classes.push("rainy", "has-clouds");
    if (["snowy", "snowy-rainy"].includes(condition)) classes.push("snowy", "has-clouds");
    if (["lightning", "lightning-rainy"].includes(condition)) classes.push("storm");
    return classes.join(" ");
  }

  _particles(condition) {
    const type = condition === "hail" ? "hail" : (["snowy", "snowy-rainy"].includes(condition) ? "snow" : (["rainy", "pouring", "lightning-rainy"].includes(condition) ? "rain" : null));
    if (!type) return "";
    const count = type === "rain" ? (condition === "pouring" ? 72 : 48) : type === "hail" ? 42 : 30;
    return Array.from({ length: count }, (_, i) => {
      const left = (i * 37 + 11) % 101;
      const delay = -((i * 0.43) % 7);
      const duration = type === "rain" ? 0.75 + (i % 6) * 0.09 : type === "hail" ? 1.15 + (i % 5) * .13 : 5 + (i % 7) * 0.65;
      const opacity = 0.35 + (i % 5) * 0.12;
      return `<i class="particle ${type}" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;opacity:${opacity}"></i>`;
    }).join("");
  }

  _summary(condition, temp, apparent, wind, rainRate, minute, precipitationUnit, windUnit) {
    if (rainRate > 0) return `${CONDITION_LABELS[condition] || "Rain"} now, falling at ${this._round(rainRate, 1)} ${precipitationUnit || ""}/h.`;
    const bits = [`${CONDITION_LABELS[condition] || this._title(condition)} conditions`];
    if (temp != null && apparent != null && Math.abs(temp - apparent) >= 2) bits.push(`feels like ${Math.round(apparent)}°`);
    if (wind != null && this._convertWind(wind, windUnit, "km/h") >= 25) bits.push("with strong winds");
    return `${bits.join(", ")}.`;
  }

  _minuteData() {
    const entityId = this.config.minute_forecast_entity;
    const entity = entityId ? this._hass.states[entityId] : null;
    let values = [];
    if (entity) {
      const raw = entity.attributes?.forecast || entity.attributes?.minutes || entity.attributes?.data || [];
      if (Array.isArray(raw)) values = raw.slice(0, 60).map((x) => Number(typeof x === "object" ? (x.precipitation ?? x.intensity ?? x.value ?? 0) : x) || 0);
    }
    const start = this._number(this.config.rain_start_minutes_entity, null);
    const duration = this._number(this.config.rain_duration_minutes_entity, null);
    const amount = this._number(this.config.expected_rain_entity, null);
    if (!values.length && start != null) {
      values = Array.from({ length: 60 }, (_, i) => i >= start && i < start + (duration || 10) ? (amount || 1) : 0);
    }
    if (!values.length) values = Array(60).fill(0);
    while (values.length < 60) values.push(0);
    const first = values.findIndex((v) => v > 0);
    const last = values.reduce((found, v, i) => v > 0 ? i : found, -1);
    const rainingNow = values[0] > 0;
    let headline = "No precipitation expected in the next hour.";
    if (rainingNow) {
      const stop = values.findIndex((v, i) => i > 0 && v <= 0);
      headline = stop > 0 ? `Rain ending in about ${stop} minutes.` : "Rain continuing for at least the next hour.";
    } else if (first >= 0) {
      const length = Math.max(1, last - first + 1);
      headline = `Rain expected in ${first} minute${first === 1 ? "" : "s"}, lasting about ${length} minutes${amount != null ? ` (${this._round(amount, 1)} expected)` : ""}.`;
    }
    return { values, first, last, rainingNow, headline, hasSource: Boolean(entity || start != null) };
  }

  _minutePanel(data, precipitationUnit) {
    const max = Math.max(...data.values, 0.1);
    const bars = data.values.map((v) => `<i class="rain-bar" style="height:${Math.max(v > 0 ? 4 : 1, (v / max) * 66)}px;opacity:${v > 0 ? .9 : .08}"></i>`).join("");
    const note = data.hasSource ? data.headline : "No minute-by-minute source configured.";
    return `<section class="panel minute-panel"><div class="panel-title">${ICONS.droplet} Next-hour precipitation</div><div class="minute-copy">${this._escape(note)}</div><div class="minute-chart">${bars}</div><div class="minute-axis"><span>Now</span><span>15 min</span><span>30 min</span><span>45 min</span><span>60 min · ${this._escape(precipitationUnit)}</span></div></section>`;
  }

  _forecastPanel(forecast, units) {
    if (!forecast.length) return `<section class="panel forecast-panel"><div class="panel-title">Hourly forecast</div><div class="minute-copy">Forecast is loading or unavailable.</div></section>`;
    const items = forecast.map((f, i) => {
      const date = new Date(f.datetime);
      const label = i === 0 ? "Now" : date.toLocaleTimeString([], { hour: "numeric" });
      const pop = Number(f.precipitation_probability);
      return `<div class="hour"><div class="hour-time">${this._escape(label)}</div><div class="hour-icon">${this._conditionIcon(f.condition)}</div><div class="hour-pop">${Number.isFinite(pop) && pop > 0 ? `${Math.round(pop)}%` : ""}</div><div class="hour-temp">${Math.round(Number(f.temperature))}°</div></div>`;
    }).join("");
    return `<section class="panel forecast-panel"><div class="panel-title">Hourly forecast</div><div class="hourly">${items}</div></section>`;
  }

  _sunData(now) {
    const entity = this._hass.states[this.config.sun_entity];
    const a = entity?.attributes || {};
    const rising = a.next_rising ? new Date(a.next_rising) : null;
    const setting = a.next_setting ? new Date(a.next_setting) : null;
    return {
      state: entity?.state,
      elevation: Number.isFinite(Number(a.elevation)) ? Number(a.elevation) : null,
      azimuth: Number.isFinite(Number(a.azimuth)) ? Number(a.azimuth) : null,
      rising,
      setting,
      moon: this._moonData(now),
    };
  }

  _solarPanel(sun) {
    const x = Math.max(8, Math.min(92, sun.azimuth == null ? 50 : ((sun.azimuth - 75 + 360) % 360) / 210 * 100));
    const y = sun.elevation != null && sun.elevation < 0 ? 95 : 90 - Math.sin((x / 100) * Math.PI) * 67;
    const progress = sun.elevation != null && sun.elevation < 0 ? 0 : Math.round(x);
    const sunrise = sun.rising ? this._time(sun.rising) : "—";
    const sunset = sun.setting ? this._time(sun.setting) : "—";
    return `<section class="panel solar-panel"><div class="panel-title">${ICONS.sunrise} Sun & moon</div><div class="solar-body"><div class="solar-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="solar-path" d="M3 89 Q50 3 97 89"/><line class="solar-horizon" x1="0" y1="89" x2="100" y2="89"/><path class="solar-progress" pathLength="100" stroke-dasharray="${progress} 100" d="M3 89 Q50 3 97 89"/><circle class="sun-dot" cx="${x}" cy="${y}" r="2.7"/></svg><div class="solar-center"><strong>${sun.elevation == null ? "—" : `${this._round(sun.elevation, 1)}°`}</strong>Elevation · ${sun.azimuth == null ? "—" : `${Math.round(sun.azimuth)}° ${this._bearing(sun.azimuth)}`}</div></div><div class="solar-times"><span>Sunrise<b>${sunrise}</b></span><span style="text-align:right">Sunset<b>${sunset}</b></span></div></div></section>`;
  }

  _moonData(now) {
    const lat = Number(this.config.latitude ?? this._hass.config?.latitude);
    const lng = Number(this.config.longitude ?? this._hass.config?.longitude);
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const illumination = MOON_ASTRONOMY.illumination(now);
    const position = hasLocation ? MOON_ASTRONOMY.position(now, lat, lng) : {};
    let moonTimes = {};
    if (hasLocation) {
      const window = this._localDayWindow(now);
      const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}:${window.start.toISOString()}`;
      if (this._moonTimesCache?.key === cacheKey) moonTimes = this._moonTimesCache.value;
      else {
        moonTimes = MOON_ASTRONOMY.times(window.start, window.end, lat, lng);
        this._moonTimesCache = { key: cacheKey, value: moonTimes };
      }
    }
    const phases = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    const entityPhase = this._state(this.config.moon_phase_entity, null);
    const entityFraction = this._number(this.config.moon_illumination_entity, null);
    return {
      phase: entityPhase ? entityPhase.replaceAll("_", " ") : phases[Math.round(illumination.phase * 8) % 8],
      fraction: entityFraction ?? illumination.fraction * 100,
      phaseValue: illumination.phase,
      waxing: entityPhase ? entityPhase.includes("waxing") : illumination.waxing,
      altitude: position.altitude,
      azimuth: position.azimuth,
      distance: position.distance,
      tilt: position.parallacticAngle == null ? 0 : -(illumination.angle - position.parallacticAngle),
      rise: moonTimes.rise,
      set: moonTimes.set,
      alwaysUp: moonTimes.alwaysUp,
      alwaysDown: moonTimes.alwaysDown,
      locationAware: hasLocation,
    };
  }

  _localDayWindow(now) {
    const timeZone = this.config.time_zone || this._hass.config?.time_zone;
    if (!timeZone) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    }
    try {
      const parts = this._zonedParts(now, timeZone);
      const tomorrow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
      return {
        start: this._zonedMidnight(parts.year, parts.month, parts.day, timeZone),
        end: this._zonedMidnight(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), timeZone),
      };
    } catch (_) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    }
  }

  _zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }).formatToParts(date);
    return Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
  }

  _zonedMidnight(year, month, day, timeZone) {
    const target = Date.UTC(year, month - 1, day);
    let guess = target;
    for (let i = 0; i < 2; i++) {
      const p = this._zonedParts(new Date(guess), timeZone);
      const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      guess += target - represented;
    }
    return new Date(guess);
  }

  _details(d) {
    const metrics = [];
    if (d.apparent != null) metrics.push(this._metric("uv", "Feels like", `${Math.round(d.apparent)}°`, "Compared with actual temperature"));
    if (d.humidity != null) metrics.push(this._metric("droplet", "Humidity", `${Math.round(d.humidity)}%`, d.humidity > 75 ? "Very humid" : d.humidity < 35 ? "Dry air" : "Comfortable range"));
    if (d.wind != null) metrics.push(this._metric("wind", "Wind", `${this._round(d.wind, 1)} ${d.units.wind}`, d.windBearing != null ? `${Math.round(d.windBearing)}° ${this._bearing(d.windBearing)}` : "Current speed"));
    if (d.pressure != null) metrics.push(this._metric("gauge", "Pressure", `${Math.round(d.pressure)} ${d.units.pressure}`, "Station pressure"));
    if (d.uv != null) metrics.push(this._metric("uv", "UV index", this._round(d.uv, 1), this._uvLabel(d.uv)));
    if (d.visibility != null) metrics.push(this._metric("eye", "Visibility", `${this._round(d.visibility, 1)} ${d.units.visibility}`, "Current visibility"));
    if (d.cloud != null) metrics.push(this._metric("cloud", "Cloud cover", `${Math.round(d.cloud)}%`, d.cloud > 80 ? "Overcast" : d.cloud > 30 ? "Broken clouds" : "Mostly clear"));
    if (d.rainRate != null || d.dailyRain != null) metrics.push(this._metric("droplet", "Rainfall", d.rainRate != null ? `${this._round(d.rainRate, 1)} ${d.units.precipitation}/h` : `${this._round(d.dailyRain, 1)} ${d.units.precipitation}`, d.dailyRain != null ? `${this._round(d.dailyRain, 1)} ${d.units.precipitation} today` : "Current rate"));
    const moon = this._moonData(d.now);
    const moonPosition = moon.locationAware ? (moon.altitude > 0 ? `${this._round(moon.altitude, 1)}° high · ${Math.round(moon.azimuth)}° ${this._bearing(moon.azimuth)}` : `Below horizon · ${Math.round(moon.azimuth)}° ${this._bearing(moon.azimuth)}`) : "Add a Home Assistant location for local position";
    const moonEvents = moon.alwaysUp ? "Above the horizon all day" : moon.alwaysDown ? "Below the horizon all day" : `${moon.rise ? `↑ ${this._time(moon.rise)}` : "↑ —"} · ${moon.set ? `↓ ${this._time(moon.set)}` : "↓ —"}`;
    const moonMetric = `<div class="metric moon-metric"><div class="metric-label">${ICONS.compass} Local moon</div><div class="moon"><div class="moon-disc ${this._moonClass(moon.phase)}" style="--moon-tilt:${this._round(moon.tilt, 1)}deg"></div><div class="moon-copy"><div class="metric-value" style="font-size:17px">${this._escape(this._title(moon.phase))}</div><div class="metric-note">${Math.round(moon.fraction)}% illuminated</div><div class="moon-position">${this._escape(moonPosition)}</div><div class="moon-position">${this._escape(moonEvents)}</div></div></div></div>`;
    if (d.isNight) metrics.unshift(moonMetric); else metrics.push(moonMetric);
    return `<section class="details">${metrics.join("")}</section>`;
  }

  _metric(icon, label, value, note) { return `<div class="metric"><div class="metric-label">${ICONS[icon] || ""} ${this._escape(label)}</div><div class="metric-value">${this._escape(String(value))}</div><div class="metric-note">${this._escape(note || "")}</div></div>`; }
  _temperature(value, unit) { return value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)}<span style="font-size:.48em;vertical-align:top;letter-spacing:0">°</span>`; }
  _forecastExtreme(forecast, key, mode) { const values = forecast.map((f) => Number(f[key])).filter(Number.isFinite); return values.length ? Math[mode](...values) : null; }
  _conditionIcon(c) { return ({ sunny:"☀️", "clear-night":"🌙", partlycloudy:"🌤️", cloudy:"☁️", rainy:"🌧️", pouring:"🌧️", lightning:"🌩️", "lightning-rainy":"⛈️", snowy:"🌨️", "snowy-rainy":"🌨️", fog:"🌫️", windy:"💨", "windy-variant":"🌬️", hail:"🌨️" })[c] || "☁️"; }
  _bearing(deg) { return ["N","NE","E","SE","S","SW","W","NW"][Math.round(((deg % 360) + 360) % 360 / 45) % 8]; }
  _uvLabel(v) { return v < 3 ? "Low" : v < 6 ? "Moderate" : v < 8 ? "High" : v < 11 ? "Very high" : "Extreme"; }
  _convertWind(value, fromUnit, toUnit) { if (value == null || !Number.isFinite(Number(value))) return value; const factors = { "km/h":1/3.6, mph:.44704, "m/s":1, kn:.514444, kt:.514444, "ft/s":.3048 }; const normalize = (unit) => { const u = String(unit || "").toLowerCase().replace(/\s/g, ""); if (["km/h","kph","kmh"].includes(u)) return "km/h"; if (["mph","mi/h","mih"].includes(u)) return "mph"; if (["m/s","mps","ms"].includes(u)) return "m/s"; if (["kn","kt","kts","knot","knots"].includes(u)) return "kn"; if (["ft/s","fps"].includes(u)) return "ft/s"; return u; }; const from = factors[normalize(fromUnit)]; const to = factors[normalize(toUnit)]; return from && to ? Number(value) * from / to : Number(value); }
  _moonClass(phase) { const p = String(phase || "").toLowerCase(); const shape = p.includes("new") ? "new" : p.includes("crescent") ? "crescent" : p.includes("quarter") ? "quarter" : p.includes("gibbous") ? "gibbous" : "full"; return `${shape}${p.includes("waning") ? " waning" : ""}`; }
  _moonSkyStyle(moon) { if (moon.altitude == null || moon.azimuth == null) return ""; const x = 50 - Math.sin(moon.azimuth * Math.PI / 180) * 42; const y = 76 - Math.max(0, Math.min(80, moon.altitude)) * .78; return `--moon-x:${this._round(x, 1)}%;--moon-y:${this._round(y, 1)}%;--moon-tilt:${this._round(moon.tilt || 0, 1)}deg`; }
  _time(d) { const options = { hour: "2-digit", minute: "2-digit" }; const timeZone = this.config.time_zone || this._hass.config?.time_zone; if (timeZone) options.timeZone = timeZone; try { return d.toLocaleTimeString([], options); } catch (_) { delete options.timeZone; return d.toLocaleTimeString([], options); } }
  _round(v, places = 0) { const f = 10 ** places; return Math.round(Number(v) * f) / f; }
  _title(s) { return String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
  _escape(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]); }
  _renderError(message) { this.shadowRoot.querySelector("ha-card").innerHTML = `<div class="error"><strong>Weather Solar Card</strong><br>${this._escape(message)}</div>`; }
}

class WeatherSolarCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...DEFAULTS, ...config }; this._render(); }
  set hass(hass) { this._hass = hass; if (this._config) this._render(); }
  _render() {
    if (!this._config) return;
    this.innerHTML = `<style>.editor{display:grid;gap:12px;padding:8px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}ha-textfield{width:100%}.toggles{display:grid;grid-template-columns:1fr 1fr;gap:8px}label{display:flex;align-items:center;gap:8px}</style><div class="editor">
      <ha-textfield label="Card name" data-key="name" value="${this._escape(this._config.name || "")}"></ha-textfield>
      <ha-entity-picker label="Weather entity" data-key="weather_entity" value="${this._escape(this._config.weather_entity || "")}" allow-custom-entity></ha-entity-picker>
      <ha-entity-picker label="Sun entity" data-key="sun_entity" value="${this._escape(this._config.sun_entity || "sun.sun")}" allow-custom-entity></ha-entity-picker>
      <div class="row"><ha-textfield label="Hours to show" data-key="hours_to_show" type="number" value="${this._config.hours_to_show}"></ha-textfield><ha-textfield label="Forecast type" data-key="forecast_type" value="${this._escape(this._config.forecast_type)}"></ha-textfield></div>
      <ha-entity-picker label="Minute precipitation entity" data-key="minute_forecast_entity" value="${this._escape(this._config.minute_forecast_entity || "")}" allow-custom-entity></ha-entity-picker>
      <div class="toggles"><label><ha-switch data-key="use_mph" ${this._config.wind_speed_unit === "mph" ? "checked" : ""}></ha-switch>Use mph</label>${["show_minute_forecast","show_forecast","show_solar","show_details","animate"].map((k) => `<label><ha-switch data-key="${k}" ${this._config[k] ? "checked" : ""}></ha-switch>${this._title(k)}</label>`).join("")}</div>
    </div>`;
    this.querySelectorAll("ha-entity-picker").forEach((el) => { el.hass = this._hass; });
    this.querySelectorAll("[data-key]").forEach((el) => el.addEventListener("change", (ev) => this._changed(ev)));
  }
  _changed(ev) { const key = ev.currentTarget.dataset.key; let value = ev.currentTarget.checked ?? ev.detail?.value ?? ev.currentTarget.value; if (key === "hours_to_show") value = Number(value); const config = key === "use_mph" ? { ...this._config, wind_speed_unit: value ? "mph" : "auto" } : { ...this._config, [key]: value }; if (key !== "use_mph" && (value === "" || value == null)) delete config[key]; this._config = config; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })); }
  _title(s) { return String(s).replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
  _escape(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]); }
}

if (!customElements.get("weather-solar-card")) customElements.define("weather-solar-card", WeatherSolarCard);
if (!customElements.get("weather-solar-card-editor")) customElements.define("weather-solar-card-editor", WeatherSolarCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-solar-card",
  name: "Weather Solar Card",
  description: "Animated local-station weather, minute precipitation, sun path and moon phase.",
  preview: true,
  documentationURL: "https://github.com/jcnicholls123/weather-solar-card",
});

console.info(`%c WEATHER-SOLAR-CARD %c v${CARD_VERSION} `, "color:white;background:#397fbd;font-weight:700", "color:#397fbd;background:white");
