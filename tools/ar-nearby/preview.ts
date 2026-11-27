import { nearbyCardDefaults, layoutNearbyCards } from '@/features/destination-ar/nearby-card-layout';
import { bearingDegrees, distanceMeters, relativeHeading } from '@/features/location/geo';
import type { Place } from '@/features/places/service';
const googleMapsAttribution = new URL('../../assets/attribution/google-maps.png', import.meta.url).href;

const definitions = {
  heading: ['Camera heading (°)', 0, 359, 1, 0],
  fov: ['Browser field of view (°)', 35, 105, 1, 60],
  radius: ['Ring radius', 1.5, 7, 0.05, nearbyCardDefaults.radius],
  laneSpacing: ['Lane spacing', 0.1, 1, 0.01, nearbyCardDefaults.laneSpacing],
  separation: ['Same-lane separation (°)', 1, 45, 1, nearbyCardDefaults.separation],
  width: ['Card width', 0.35, 1.5, 0.01, nearbyCardDefaults.width],
  height: ['Card height', 0.2, 0.8, 0.01, nearbyCardDefaults.height],
  textScale: ['Card text scale', 0.7, 1.6, 0.05, 1],
} as const;
type Setting = keyof typeof definitions;
const entries = Object.entries(definitions) as [Setting, typeof definitions[Setting]][];
const defaults = Object.fromEntries(entries.map(([key, definition]) => [key, definition[4]])) as Record<Setting, number>;
type Fixture = { name: string; bearing: number; distance: number };

function element<T extends HTMLElement>(id: string) { return document.getElementById(id) as T; }
const phone = element('phone');
const table = element('places');
const scenarios = element<HTMLSelectElement>('scenario');
const lighting = element<HTMLSelectElement>('lighting');
const file = element<HTMLInputElement>('settings-file');
const fileStatus = element('file-status');
let settings = { ...defaults };
let mode = 'current';
let view: 'camera' | 'list' | 'detail' = 'camera';
let selected: string | null = null;
let preferred: string | null = null;
let originCaptured = true;
let scanned = true;
let announcement = '';
let fixtureScenario = scenarios.value;
let fixtures = scenarioFixtures(fixtureScenario);

function scenarioFixtures(scenario: string): Fixture[] {
  if (scenario === 'empty') return [];
  const names = ['Lakeside Café', 'Trailhead Kiosk', 'Ridge Viewpoint', 'Public Market', 'Garden Walk', 'Town Library', 'Visitor Information'];
  if (scenario === 'names') names.splice(0, 3,
    'Lakeside Community Heritage and Visitor Information Centre',
    '湖畔の自然と地域の歴史を紹介する観光案内交流センター',
    '호숫가 자연 생태와 지역 문화를 소개하는 방문자 안내 센터');
  const bearings = [-12, 3, 16, 65, 112, 210, 330];
  return names.map((name, index) => ({
    name,
    bearing: scenario === 'cluster' || scenario === 'names' ? 0 : (bearings[index] + 360) % 360,
    distance: index === 6 ? 0.4 : 95 + 45 * index,
  }));
}

function coordinate(fixture: Fixture) {
  // Use the equator as a fictional origin. This is the inverse of the shared
  // spherical distance and bearing formulas, so editable knobs use real units.
  const angle = fixture.bearing * Math.PI / 180;
  const arc = fixture.distance / 6371008.8;
  return {
    latitude: Math.asin(Math.sin(arc) * Math.cos(angle)) * 180 / Math.PI,
    longitude: Math.atan2(Math.sin(angle) * Math.sin(arc), Math.cos(arc)) * 180 / Math.PI,
  };
}

function makePlaces(): Place[] {
  return fixtures.map((fixture, index) => ({
    id: String(index), providerId: String(index), provider: 'google', name: fixture.name,
    coordinates: coordinate(fixture), attributions: [],
  }));
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, label?: string, className?: string) {
  const result = document.createElement(tag);
  if (label !== undefined) result.textContent = label;
  if (className) result.className = className;
  return result;
}

function button(label: string, click: () => void, className = '', id = label) {
  const control = node('button', label, className);
  control.type = 'button';
  control.dataset.action = id;
  control.onclick = click;
  return control;
}

const origin = { latitude: 0, longitude: 0 };
const distance = (place: Place) => distanceMeters(origin, place.coordinates);
const distanceLabel = (place: Place) => `${Math.round(distance(place))} m away`;
const proposed = () => mode === 'proposed';

function go(next: typeof view, id: string | null = null) {
  view = next;
  selected = id;
  render();
  phone.scrollTop = 0;
  phone.querySelector<HTMLElement>('h2')?.focus();
}

function showResults(id: string | null) {
  originCaptured = scenarios.value !== 'gps';
  announcement = '';
  go(id === null ? 'list' : 'detail', id);
}

function showCard(place: Place) {
  preferred = place.providerId;
  announcement = 'Place prioritized. Turn the camera toward its bearing.';
  go('camera');
}

function openMaps(place: Place) {
  announcement = `Simulated Google Maps handoff for ${place.name}.`;
  render();
}

function attribution() {
  const image = node('img', undefined, 'attribution');
  image.src = googleMapsAttribution;
  image.alt = 'Google Maps';
  return image;
}

function camera(places: Place[], cards: ReturnType<typeof layoutNearbyCards>, headingReady: boolean, hasFix: boolean) {
  phone.className = `phone camera ${lighting.value}`;
  const title = node('h2', 'Nearby places', 'camera-title');
  title.tabIndex = -1;
  const stage = node('div', undefined, 'stage');
  const message = node('p', '', 'camera-message');
  const dock = node('div', undefined, 'dock');
  const scenario = scenarios.value;
  if (!hasFix) message.textContent = 'Waiting for an accurate location…';
  else if (scenario === 'expired') message.textContent = 'Scan again for current results.';
  else if (!scanned) message.textContent = 'Scan for places within 1 km, then turn to see what’s around you.';
  else if (!places.length) message.textContent = 'No places turned up nearby.';
  else if (!headingReady) message.textContent = scenario === 'weak' ? 'Compass signal is too weak to place cards.' : 'Heading hardware is unavailable. You can still view results.';
  else message.textContent = `Camera heading ${settings.heading}°`;

  if (headingReady && hasFix) for (const card of cards) {
    const delta = relativeHeading(-card.rotation[1], settings.heading);
    if (Math.abs(delta) > settings.fov / 2) continue;
    const angle = delta * Math.PI / 180;
    const halfFov = settings.fov * Math.PI / 360;
    const layout = proposed() ? settings : nearbyCardDefaults;
    const depth = layout.radius * Math.cos(angle);
    const focal = 50 / Math.tan(halfFov);
    const control = button(card.place.name, () => showResults(card.place.providerId), 'floating', `card-${card.place.providerId}`);
    control.replaceChildren(node('strong', card.place.name), node('small', distanceLabel(card.place)));
    control.style.left = `${50 + Math.tan(angle) * focal}%`;
    control.style.top = `calc(50% - ${card.position[1] * focal / depth}cqw)`;
    control.style.width = `${layout.width * focal / depth}cqw`;
    control.style.height = `${layout.height * focal / depth}cqw`;
    control.style.setProperty('--card-text', `${2.65 * (proposed() ? settings.textScale : 1)}cqw`);
    control.style.setProperty('--card-yaw', `${-delta}deg`);
    if (card.place.providerId === preferred) control.classList.add('preferred');
    stage.append(control);
  }
  if (places.length) dock.append(button(`View results (${places.length})`, () => showResults(null), 'primary', 'results'));
  const scan = button(scanned ? 'Scan again' : 'Scan nearby', () => {
    scanned = true;
    if (scenario === 'expired' || scenario === 'unscanned') {
      scenarios.value = 'outdoor';
      fixtureScenario = 'outdoor';
      fixtures = scenarioFixtures(fixtureScenario);
      buildTable();
    }
    announcement = 'Simulated scan complete.';
    render();
  });
  scan.disabled = !hasFix;
  dock.append(scan);
  phone.append(title, stage, node('div', undefined, 'shade'), message, dock);
}

function results(places: Place[]) {
  phone.className = `phone page ${mode}`;
  const place = places.find(item => item.providerId === selected);
  const title = node('h2', proposed() && place ? place.name : 'Nearby places');
  title.tabIndex = -1;
  const backToCamera = button('Return to AR', () => { announcement = ''; go('camera'); }, 'back', 'return');
  const top = node('header', undefined, 'page-header');
  if (proposed()) {
    top.append(place ? button('All results', () => go('list'), 'back', 'all') : backToCamera, title);
    if (place && originCaptured) top.append(node('p', distanceLabel(place), 'detail-distance'));
    if (!place && places.length) top.append(node('p', `${places.length} places found`, 'note'));
  } else {
    top.append(title, backToCamera);
    if (place) top.append(button(`View results (${places.length})`, () => go('list'), 'back', 'all'));
  }
  phone.append(top);
  if (!places.length) {
    phone.append(node('p', 'These results have expired. Return to AR to scan again.', 'notice'));
    return;
  }
  const body = node('div', undefined, 'result-body');
  const actions = (item: Place) => {
    const group = node('div', undefined, 'result-actions');
    if (originCaptured && distance(item) >= 1) {
      group.append(button('Show card in AR', () => showCard(item), proposed() ? 'primary' : '', `pin-${item.providerId}`));
    } else if (proposed()) {
      group.append(node('p', originCaptured ? 'Too close for a reliable bearing.' : 'Waiting for a usable location.', 'note'));
    }
    group.append(button('Open in Google Maps', () => openMaps(item), '', `maps-${item.providerId}`));
    return group;
  };
  if (!proposed()) {
    body.append(attribution());
    for (const item of place ? [place] : places) {
      const row = node('section', undefined, 'current-row');
      row.append(node('h3', item.name));
      if (originCaptured) row.append(node('p', distanceLabel(item), 'note'));
      row.append(actions(item));
      body.append(row);
    }
  } else if (place) {
    body.append(actions(place), attribution(), backToCamera);
  } else {
    const ordered = originCaptured ? [...places].sort((a, b) => distance(a) - distance(b)) : places;
    for (const item of ordered) {
      const row = button(item.name, () => go('detail', item.providerId), 'proposed-row', `place-${item.providerId}`);
      row.replaceChildren(node('strong', item.name));
      if (originCaptured) row.append(node('span', distanceLabel(item)));
      body.append(row);
    }
    body.append(attribution());
  }
  phone.append(body);
}

const tableStatuses = new Map<string, HTMLElement>();
function render() {
  const focusedAction = phone.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.action : undefined;
  const previousScroll = phone.scrollTop;
  const scenario = scenarios.value;
  const all = makePlaces();
  const places = scanned && scenario !== 'expired' ? all : [];
  const headingReady = scenario !== 'weak' && scenario !== 'unavailable';
  const hasFix = scenario !== 'gps';
  const layout = proposed() ? settings : nearbyCardDefaults;
  const cards = layoutNearbyCards(places, origin, preferred, layout);
  phone.replaceChildren();
  if (view === 'camera') camera(places, cards, headingReady, hasFix);
  else results(places);
  if (announcement) {
    const status = node('p', announcement, 'feedback');
    status.setAttribute('role', 'status');
    phone.append(status);
  }
  phone.scrollTop = previousScroll;
  if (focusedAction) Array.from(phone.querySelectorAll<HTMLButtonElement>('button')).find(control => control.dataset.action === focusedAction)?.focus({ preventScroll: true });
  for (const place of all) {
    const status = tableStatuses.get(place.providerId);
    if (!status) continue;
    const card = cards.find(item => item.place.providerId === place.providerId);
    const bearing = bearingDegrees(origin, place.coordinates);
    if (!places.length) status.textContent = 'No active result';
    else if (distance(place) < 1) status.textContent = 'Under 1 m';
    else if (!card) status.textContent = 'All five lanes occupied';
    else {
      const lane = [0, 1, -1, 2, -2].indexOf(Math.round(card.position[1] / layout.laneSpacing)) + 1;
      const visibility = !hasFix ? 'GPS lost' : !headingReady ? 'heading unavailable' : Math.abs(relativeHeading(bearing, settings.heading)) > settings.fov / 2 ? 'out of view' : 'in view';
      status.textContent = `Lane ${lane} · ${visibility}${place.providerId === preferred ? ' · preferred' : ''}`;
    }
  }
}

function buildTable() {
  tableStatuses.clear();
  table.replaceChildren();
  fixtures.forEach((fixture, index) => {
    const row = node('tr');
    const label = node('th', fixture.name);
    label.scope = 'row';
    row.append(label);
    for (const key of ['bearing', 'distance'] as const) {
      const cell = node('td');
      const input = node('input');
      input.type = 'number';
      input.step = 'any';
      input.min = '0';
      input.max = key === 'bearing' ? '359.99' : '1000';
      input.value = String(fixture[key]);
      input.setAttribute('aria-label', `${fixture.name} ${key}`);
      input.oninput = () => {
        if (input.value && input.validity.valid) {
          fixture[key] = input.valueAsNumber;
          render();
        }
      };
      input.onblur = () => { input.value = String(fixture[key]); };
      cell.append(input);
      row.append(cell);
    }
    const status = node('td');
    tableStatuses.set(String(index), status);
    row.append(status);
    table.append(row);
  });
}

const sliders = element('sliders');
const sliderRefresh = entries.map(([key, [label, min, max, step]]) => {
  const wrapper = node('label');
  const output = node('span');
  const input = node('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  const refresh = () => {
    input.value = String(settings[key]);
    input.disabled = key !== 'heading' && key !== 'fov' && !proposed();
    output.textContent = String(settings[key]);
  };
  input.oninput = () => { settings[key] = input.valueAsNumber; refresh(); render(); };
  wrapper.append(node('span', label), output, input);
  sliders.append(wrapper);
  return refresh;
});

const modeButtons = Array.from(element('mode').querySelectorAll<HTMLButtonElement>('button'));
for (const control of modeButtons) control.onclick = () => {
  mode = control.dataset.mode!;
  for (const candidate of modeButtons) candidate.setAttribute('aria-pressed', String(candidate === control));
  sliderRefresh.forEach(refresh => refresh());
  render();
};
scenarios.onchange = () => {
  const expired = scenarios.value === 'expired';
  if (!expired) {
    fixtureScenario = scenarios.value;
    fixtures = scenarioFixtures(fixtureScenario);
    preferred = null;
    scanned = scenarios.value !== 'unscanned';
    if (!scanned || !fixtures.length) view = 'camera';
  }
  announcement = '';
  buildTable();
  render();
};
lighting.onchange = render;
element('reset').onclick = () => {
  settings = { ...defaults };
  fixtures = scenarioFixtures(fixtureScenario);
  preferred = null;
  sliderRefresh.forEach(refresh => refresh());
  buildTable();
  render();
  fileStatus.textContent = 'App defaults restored.';
};
element('download').onclick = () => {
  const data = JSON.stringify({ version: 1, settings, scenario: scenarios.value, lighting: lighting.value,
    fixtureScenario, places: fixtures.map(({ bearing, distance }) => ({ bearing, distance })) }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const link = node('a');
  link.href = url;
  link.download = 'argala-nearby-preview.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  fileStatus.textContent = 'Preview settings downloaded.';
};
element('import').onclick = () => file.click();
file.onchange = async () => {
  const chosen = file.files?.[0];
  if (!chosen) return;
  try {
    if (chosen.size > 8192) throw new Error();
    const data = JSON.parse(await chosen.text());
    if (data.version !== 1 || !Array.from(scenarios.options).some(option => option.value === data.scenario) ||
        !Array.from(lighting.options).some(option => option.value === data.lighting)) throw new Error();
    const imported = { ...defaults };
    for (const [key, [, min, max]] of entries) {
      const value = data.settings?.[key];
      if (!Number.isFinite(value) || value < min || value > max) throw new Error();
      imported[key] = value;
    }
    if (!Array.from(scenarios.options).some(option => option.value === data.fixtureScenario)) throw new Error();
    const next = scenarioFixtures(data.fixtureScenario);
    if (!Array.isArray(data.places) || data.places.length !== next.length) throw new Error();
    for (const [index, fixture] of next.entries()) {
      const saved = data.places[index];
      if (!saved || !Number.isFinite(saved.bearing) || saved.bearing < 0 || saved.bearing > 359.99 ||
          !Number.isFinite(saved.distance) || saved.distance < 0 || saved.distance > 1000) throw new Error();
      fixture.bearing = saved.bearing;
      fixture.distance = saved.distance;
    }
    scenarios.value = data.scenario;
    lighting.value = data.lighting;
    scenarios.onchange?.(new Event('change'));
    settings = imported;
    fixtureScenario = data.fixtureScenario;
    fixtures = next;
    sliderRefresh.forEach(refresh => refresh());
    buildTable();
    render();
    fileStatus.textContent = 'Preview settings imported.';
  } catch {
    fileStatus.textContent = 'This file is not a valid Nearby Places preview settings file.';
  } finally {
    file.value = '';
  }
};
phone.addEventListener('keydown', event => {
  if (event.key === 'Escape' && view !== 'camera') go(view === 'detail' && proposed() ? 'list' : 'camera');
});
sliderRefresh.forEach(refresh => refresh());
buildTable();
render();
