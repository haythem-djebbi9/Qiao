// Contrôles API des certificats QIAO Academy : délivrance à la fin de la formation, PDF, vérification publique, révocation.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… [PDF_OUT=certificat.pdf] node scripts/academy/api-certificates.mjs
// À lancer sur une base de test : le script crée une formation, une inscription et révoque puis rétablit un certificat.
import { enrollPaid } from './pay-helpers.mjs';
import { writeFileSync } from 'fs';

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');
const MEMBER = { email: 'sami.benali@qiao.tn', password: 'Qiao2026!' };
const NUMBER = /^QA-\d{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

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
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('application/pdf')) {
    return { status: res.status, type, disposition: res.headers.get('content-disposition'), pdf: Buffer.from(await res.arrayBuffer()) };
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, type, json };
}

const login = async (creds) => {
  const r = await call('POST', '/auth/login', null, creds);
  const token = r.json?.token ?? r.json?.accessToken;
  if (!token) throw new Error(`Connexion impossible (${creds.email}) : ${r.status} ${JSON.stringify(r.json)}`);
  return token;
};

const admin = await login(ADMIN);
const member = await login(MEMBER);

// Formation : une leçon texte et deux quiz (scores attendus 50 % et 100 % → moyenne 75 %)
const created = await call('POST', '/academy/admin/courses', admin, {
  title: 'Contrôle API — certificat de réussite',
  description: 'Formation créée par le script de contrôle des certificats.',
  instructor: 'Équipe QIAO',
  price: 0,
  durationMinutes: 20,
  domain: 'business',
  level: 'Débutant',
  format: 'En ligne à son rythme',
});
const courseId = created.json.id;
let detail = (await call('POST', `/academy/admin/courses/${courseId}/modules`, admin, { title: 'Module 1' })).json;
const moduleId = detail.curriculum[0].id;
await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Introduction', type: 'text', content: 'Bienvenue', durationMinutes: 5 });
await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
  title: 'Quiz 1',
  type: 'quiz',
  durationMinutes: 5,
  quiz: {
    passingScore: 50,
    questions: [
      { prompt: 'Capitale de la Tunisie ?', options: ['Tunis', 'Sfax'], answer: 0 },
      { prompt: 'Monnaie chinoise ?', options: ['Yuan', 'Dinar'], answer: 0 },
    ],
  },
});
detail = (
  await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
    title: 'Quiz 2',
    type: 'quiz',
    durationMinutes: 5,
    quiz: { passingScore: 100, questions: [{ prompt: 'Deux plus deux ?', options: ['3', '4'], answer: 1 }] },
  })
).json;
const [textLesson, quiz1, quiz2] = detail.curriculum[0].lessons;
check('formation publiée', (await call('POST', `/academy/admin/courses/${courseId}/status`, admin, { status: 'published' })).json?.status === 'published');
check('inscription du membre', (await enrollPaid(call, admin, member, { itemType: 'course', itemId: courseId })).status === 201);

// Avant la fin : pas de certificat
const early = await call('GET', `/academy/learn/${courseId}/certificate`, member);
check('certificat refusé avant la fin de la formation', early.status === 404, early.json?.message);
check('lecteur : pas encore de certificat', (await call('GET', `/academy/learn/${courseId}`, member)).json?.certificate === null);

// Fin de la formation
await call('POST', `/academy/learn/${courseId}/lessons/${textLesson.id}/complete`, member);
await call('POST', `/academy/learn/${courseId}/lessons/${quiz1.id}/quiz`, member, { answers: [0, 1] });
const last = await call('POST', `/academy/learn/${courseId}/lessons/${quiz2.id}/quiz`, member, { answers: [1] });
check('formation terminée', last.json?.status === 'completed' && last.json.progress === 100, `${last.json?.progress} ${last.json?.status}`);

const learn = (await call('GET', `/academy/learn/${courseId}`, member)).json;
const certificate = learn?.certificate;
check('certificat délivré automatiquement', certificate?.status === 'valid' && NUMBER.test(certificate.number ?? ''), certificate?.number);
check('score moyen des quiz = 75 %', certificate?.averageScore === 75 && certificate.quizzesCount === 2 && certificate.lessonsCount === 3, JSON.stringify(certificate));

const enrollments = (await call('GET', '/academy/enrollments', member)).json;
check('« Mes formations » : certificat joint', enrollments.find((e) => e.itemId === courseId)?.certificate?.number === certificate?.number);

const notifications = (await call('GET', '/notifications', member)).json;
const items = Array.isArray(notifications) ? notifications : (notifications?.items ?? []);
check('notification de fin mentionnant le certificat', items.some((n) => n.title?.includes('Formation terminée') && n.body?.includes('certificat')));

// PDF du titulaire
const pdf = await call('GET', `/academy/learn/${courseId}/certificate`, member);
check('PDF téléchargé', pdf.status === 200 && pdf.pdf?.subarray(0, 4).toString() === '%PDF', `${pdf.status} ${pdf.type} ${pdf.pdf?.length ?? 0} octets`);
check('nom de fichier avec le numéro', pdf.disposition?.includes(certificate?.number ?? '?'), pdf.disposition ?? '');
if (process.env.PDF_OUT && pdf.pdf) writeFileSync(process.env.PDF_OUT, pdf.pdf);
check('anonyme refusé sur le PDF', (await call('GET', `/academy/learn/${courseId}/certificate`, null)).status === 401);

// Vérification publique
const verified = await call('GET', `/academy/certificates/verify/${certificate.number}`, null);
check('vérification publique : valide', verified.status === 200 && verified.json?.status === 'valid' && verified.json.holderName && verified.json.courseTitle);
check(
  'vérification publique : ni score, ni e-mail, ni motif',
  verified.json && !('averageScore' in verified.json) && !('email' in verified.json) && !('revokedReason' in verified.json),
  Object.keys(verified.json ?? {}).join(', '),
);
const loose = await call('GET', `/academy/certificates/verify/${encodeURIComponent(certificate.number.toLowerCase().replace(/-/g, ' '))}`, null);
check('numéro saisi en minuscules sans tirets accepté', loose.json?.number === certificate.number);
check('numéro inconnu → 404', (await call('GET', '/academy/certificates/verify/QA-2026-AAAA-AAAA', null)).status === 404);

// Idempotence et changement de programme
await call('POST', `/academy/learn/${courseId}/lessons/${textLesson.id}/complete`, member);
check('pas de second certificat', (await call('GET', `/academy/learn/${courseId}`, member)).json?.certificate?.number === certificate.number);

// Administration : colonne Certificat, révocation, rétablissement
const learners = (await call('GET', `/academy/admin/courses/${courseId}/learners`, admin)).json;
const row = learners?.learners?.find((l) => l.user.email === MEMBER.email);
check('admin : certificat du membre visible', row?.certificate?.number === certificate.number);
check('membre refusé sur la révocation', (await call('POST', `/academy/admin/certificates/${certificate.id}/revoke`, member, { reason: 'Test' })).status === 403);
check('révocation sans motif refusée', (await call('POST', `/academy/admin/certificates/${certificate.id}/revoke`, admin, { reason: '' })).status === 400);
const revoked = await call('POST', `/academy/admin/certificates/${certificate.id}/revoke`, admin, { reason: 'Contrôle API : fraude au quiz' });
check('révocation', revoked.status === 200 && revoked.json?.status === 'revoked');
check('vérification publique : révoqué', (await call('GET', `/academy/certificates/verify/${certificate.number}`, null)).json?.status === 'revoked');
check('titulaire : PDF refusé après révocation', (await call('GET', `/academy/learn/${courseId}/certificate`, member)).status === 403);
const copy = await call('GET', `/academy/admin/certificates/${certificate.id}/pdf`, admin);
check('admin : copie PDF (mention RÉVOQUÉ)', copy.status === 200 && copy.pdf?.subarray(0, 4).toString() === '%PDF');
const audit = (await call('GET', '/academy/admin/audit?action=academy.certificate', admin)).json;
check('journal : révocation tracée avec le motif', audit?.items?.some((i) => i.action === 'academy.certificate.revoke' && i.details?.reason === 'Contrôle API : fraude au quiz'));
const after = (await call('GET', '/notifications', member)).json;
check('membre notifié de la révocation', (Array.isArray(after) ? after : (after?.items ?? [])).some((n) => n.title === 'Certificat révoqué'));

const restored = await call('POST', `/academy/admin/certificates/${certificate.id}/restore`, admin);
check('rétablissement', restored.status === 200 && restored.json?.status === 'valid');
check('titulaire : PDF de nouveau disponible', (await call('GET', `/academy/learn/${courseId}/certificate`, member)).status === 200);
check('journal : rétablissement tracé', (await call('GET', '/academy/admin/audit?action=academy.certificate.restore', admin)).json?.items?.length >= 1);

// Leçon ajoutée après coup : la formation redevient « en cours », le certificat délivré reste valide
await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Leçon ajoutée', type: 'text', content: 'Suite', durationMinutes: 5 });
const later = (await call('GET', `/academy/learn/${courseId}`, member)).json;
check('leçon ajoutée : certificat conservé', later?.enrollment?.status === 'active' && later.certificate?.status === 'valid' && later.certificate.number === certificate.number);

console.log(`\nCertificat contrôlé : ${certificate?.number}`);
console.log(failures ? `${failures} contrôle(s) en échec` : 'Tous les contrôles sont passés.');
process.exit(failures ? 1 : 0);
