// Contrôles API de l'administration des événements : droits admin, publication, places, liste d'attente, présence, export, journal.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/events/api-smoke.mjs
// À lancer sur une base de test : le script crée des événements et des inscriptions.
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');
const MEMBER = { email: 'sami.benali@qiao.tn', password: 'Qiao2026!' };

let failures = 0;
const check = (label, ok, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${label}${extra ? ` — ${extra}` : ''}`);
};

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

const login = async (creds) => {
  const r = await call('POST', '/auth/login', null, creds);
  const token = r.json?.token ?? r.json?.accessToken;
  if (!token) throw new Error(`Connexion impossible (${creds.email}) : ${r.status} ${JSON.stringify(r.json)}`);
  return token;
};

const admin = await login(ADMIN);
const member = await login(MEMBER);
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const stamp = Date.now().toString(36);

// Droits
check('membre refusé sur /events/admin/overview', (await call('GET', '/events/admin/overview', member)).status === 403);
check('anonyme refusé sur /events/admin/events', (await call('GET', '/events/admin/events')).status === 401);

// Données de départ : toujours visibles (statut « published » par défaut)
const overview = await call('GET', '/events/admin/overview', admin);
check('vue d’ensemble', overview.status === 200 && overview.json.events.published >= 1, JSON.stringify(overview.json?.events));

// Création (brouillon) et validation
const invalid = await call('POST', '/events/admin/events', admin, { title: 'X' });
check('création invalide refusée (400)', invalid.status === 400);
const base = {
  title: `Webinaire test ${stamp}`,
  category: 'Webinaire',
  categoryKey: 'webinaires',
  startDate: day(20),
  endDate: null,
  time: '10:00 - 11:30 (GMT+1)',
  format: 'online',
  location: 'En ligne (Zoom)',
  country: 'Tunisie',
  onlineUrl: 'https://zoom.us/j/123456789',
  priceLabel: null,
  image: 'asset:tech_hero_digital_ai_1791120272815.jpg',
  description: 'Webinaire de contrôle créé par le script de test.',
  placements: ['events-page'],
  capacity: 2,
  details: null,
};
const created = await call('POST', '/events/admin/events', admin, base);
const id = created.json?.id;
const dated = await call('POST', '/events/admin/events', admin, { ...base, title: `Forum ${stamp} ${day(20).slice(0, 4)}` });
check("identifiant : l'année n'est pas répétée", dated.json?.id === `forum-${stamp}-${day(20).slice(0, 4)}`, dated.json?.id);
await call('DELETE', `/events/admin/events/${dated.json?.id}`, admin);
check('création en brouillon',created.status === 201 && created.json.status === 'draft' && created.json.dateRange === day(20).slice(8), JSON.stringify({ status: created.status, id }));
check('brouillon invisible publiquement', !(await call('GET', '/events')).json.some((e) => e.id === id));
check('inscription refusée sur un brouillon (404)', (await call('POST', `/events/${id}/register`, null, { fullName: 'Test', email: `x-${stamp}@test.tn`, companyRole: 'Test' })).status === 404);

// Publication
const published = await call('POST', `/events/admin/events/${id}/status`, admin, { status: 'published' });
check('publication', published.status === 200 && published.json.status === 'published');
let pub = (await call('GET', '/events')).json.find((e) => e.id === id);
check('publié visible, lien de connexion masqué', pub && pub.onlineUrl === undefined && pub.format === 'online', JSON.stringify(pub && { onlineUrl: pub.onlineUrl, format: pub.format }));

// Places et liste d'attente (jauge = 2)
const r1 = await call('POST', `/events/${id}/register`, member, { fullName: 'Sami Ben Ali', email: MEMBER.email, companyRole: 'Membre démo' });
const r2 = await call('POST', `/events/${id}/register`, null, { fullName: 'Invité Deux', email: `deux-${stamp}@test.tn`, companyRole: 'Invité' });
const r3 = await call('POST', `/events/${id}/register`, null, { fullName: 'Invité Trois', email: `trois-${stamp}@test.tn`, companyRole: 'Invité' });
check('1re inscription confirmée', r1.json?.status === 'confirmed');
check('2e inscription confirmée', r2.json?.status === 'confirmed');
check("3e inscription en liste d'attente (complet)", r3.json?.status === 'waitlisted');
check('doublon refusé (409)', (await call('POST', `/events/${id}/register`, null, { fullName: 'Invité Trois', email: `TROIS-${stamp}@test.tn`, companyRole: 'Invité' })).status === 409);
pub = (await call('GET', '/events', member)).json.find((e) => e.id === id);
check('fiche publique : complet, 1 en attente, membre inscrit', pub.isFull && pub.waitlistCount === 1 && pub.myRegistrationStatus === 'confirmed');

// Espace membre : lien de connexion réservé aux confirmés
const mine = (await call('GET', '/events/registrations/mine', member)).json.find((r) => r.event.id === id);
check('Mon espace : lien de connexion communiqué au confirmé', mine?.event.onlineUrl === base.onlineUrl);

// Jauge
check('jauge sous les confirmés refusée (400)', (await call('PATCH', `/events/admin/events/${id}`, admin, { capacity: 1 })).status === 400);
let regs = (await call('GET', `/events/admin/events/${id}/registrations`, admin)).json;
const waiting = regs.items.find((r) => r.status === 'waitlisted');
check("liste d'attente : position n° 1", waiting?.waitlistPosition === 1);
check('confirmation impossible quand complet (409)', (await call('PATCH', `/events/admin/registrations/${waiting.id}`, admin, { status: 'confirmed' })).status === 409);
check('jauge augmentée à 3', (await call('PATCH', `/events/admin/events/${id}`, admin, { capacity: 3 })).json?.capacity === 3);
check("promotion depuis la liste d'attente", (await call('PATCH', `/events/admin/registrations/${waiting.id}`, admin, { status: 'confirmed' })).json?.status === 'confirmed');

// Ajout par l'administration (complet → liste d'attente), note, présence
const added = await call('POST', `/events/admin/events/${id}/registrations`, admin, { fullName: 'Délégation CCIT', email: `ccit-${stamp}@test.tn`, companyRole: 'CCIT', adminNote: 'Invité VIP' });
check("ajout admin sur événement complet → liste d'attente", added.status === 201 && added.json.status === 'waitlisted');
const confirmedRow = regs.items.find((r) => r.status === 'confirmed');
check('pointage présent', (await call('POST', `/events/admin/registrations/${confirmedRow.id}/check-in`, admin, { present: true })).json?.checkedInAt);
check('pointage refusé en liste d’attente (400)', (await call('POST', `/events/admin/registrations/${added.json.id}/check-in`, admin, { present: true })).status === 400);

// Annulation par le membre, puis réinscription (même badge)
const cancel = await call('POST', `/events/registrations/${mine.id}/cancel`, member);
check('annulation par le membre', cancel.json?.cancelled === true);
check("annulation d'une inscription d'autrui refusée (403)", (await call('POST', `/events/registrations/${waiting.id}/cancel`, member)).status === 403);
const again = await call('POST', `/events/${id}/register`, member, { fullName: 'Sami Ben Ali', email: MEMBER.email, companyRole: 'Membre démo' });
check('réinscription après annulation (place libérée, même badge)', again.json?.status === 'confirmed' && again.json.badgeCode === r1.json.badgeCode);

// Fermeture des inscriptions
await call('PATCH', `/events/admin/events/${id}`, admin, { registrationOpen: false });
check('inscriptions fermées (409)', (await call('POST', `/events/${id}/register`, null, { fullName: 'Tardif', email: `tard-${stamp}@test.tn`, companyRole: 'Invité' })).status === 409);

// Export CSV
const csv = await call('GET', `/events/admin/events/${id}/registrations.csv`, admin);
check('export CSV', csv.status === 200 && csv.headers.get('content-type')?.includes('text/csv') && csv.text.includes('Délégation CCIT') && csv.text.includes("Liste d'attente"));

// Archivage, suppression, duplication
check('suppression refusée avec inscrits (409)', (await call('DELETE', `/events/admin/events/${id}`, admin)).status === 409);
const copy = await call('POST', `/events/admin/events/${id}/duplicate`, admin);
check('duplication en brouillon', copy.status === 201 && copy.json.status === 'draft' && copy.json.stats.confirmed === 0);
check('suppression du brouillon sans inscrits', (await call('DELETE', `/events/admin/events/${copy.json.id}`, admin)).json?.deleted === true);
check('archivage', (await call('POST', `/events/admin/events/${id}/status`, admin, { status: 'archived' })).json?.status === 'archived');
check('archivé invisible publiquement', !(await call('GET', '/events')).json.some((e) => e.id === id));
check('archivé : inscription conservée dans Mon espace', (await call('GET', '/events/registrations/mine', member)).json.some((r) => r.event.id === id));
const pastPublish = await call('POST', `/events/admin/events`, admin, { ...base, title: `Passé ${stamp}`, startDate: day(-10) });
check('publication d’un événement passé refusée (400)', (await call('POST', `/events/admin/events/${pastPublish.json.id}/status`, admin, { status: 'published' })).status === 400);
await call('DELETE', `/events/admin/events/${pastPublish.json.id}`, admin);

// Journal
const audit = (await call('GET', '/events/admin/audit', admin, undefined)).json;
const actions = new Set(audit.items.map((a) => a.action));
for (const action of [
  'events.event.create',
  'events.event.publish',
  'events.event.update',
  'events.event.close-registrations',
  'events.event.duplicate',
  'events.event.delete',
  'events.event.archive',
  'events.registration.confirm',
  'events.registration.add',
  'events.registration.checkin',
  'events.registration.cancel',
  'events.registration.export',
]) {
  check(`journal : ${action}`, actions.has(action));
}

console.log(failures === 0 ? '\nTous les contrôles sont passés.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
