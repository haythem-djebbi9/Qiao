// Contrôles API de QIAO Academy (LMS) : droits admin, cycle de publication, progression, quiz.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/academy/<script>.mjs
// À lancer sur une base de test : le script crée des formations, des parcours, des inscriptions et un compte membre.
import { enrollPaid } from './pay-helpers.mjs';
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
  return { status: res.status, json };
}

const login = async (creds) => {
  const r = await call('POST', '/auth/login', null, creds);
  const token = r.json?.token ?? r.json?.accessToken;
  if (!token) throw new Error(`Connexion impossible (${creds.email}) : ${r.status} ${JSON.stringify(r.json)}`);
  return token;
};

const admin = await login(ADMIN);
const member = await login(MEMBER);

// Droits
check('membre refusé sur /academy/admin/overview', (await call('GET', '/academy/admin/overview', member)).status === 403);
check('anonyme refusé sur /academy/admin/overview', (await call('GET', '/academy/admin/overview', null)).status === 401);
const overview = await call('GET', '/academy/admin/overview', admin);
check('admin : vue d\'ensemble', overview.status === 200, JSON.stringify(overview.json?.courses));

// Création d'une formation en brouillon
const created = await call('POST', '/academy/admin/courses', admin, {
  title: 'Contrôle API — formation de test',
  description: 'Formation créée par le script de contrôle API.',
  instructor: 'Équipe QIAO',
  price: 42,
  durationMinutes: 30,
  domain: 'business',
  level: 'Débutant',
  format: 'En ligne à son rythme',
});
check('création formation (brouillon)', created.status === 201 && created.json?.status === 'draft', created.json?.id);
const courseId = created.json.id;
check('brouillon absent du catalogue public', !(await call('GET', '/academy/courses', null)).json.some((c) => c.id === courseId));
const publishEmpty = await call('POST', `/academy/admin/courses/${courseId}/status`, admin, { status: 'published' });
check('publication refusée sans leçon', publishEmpty.status === 400, publishEmpty.json?.message);

// Module + leçons
let detail = (await call('POST', `/academy/admin/courses/${courseId}/modules`, admin, { title: 'Module 1' })).json;
const moduleId = detail.curriculum[0].id;
detail = (await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Leçon texte', type: 'text', content: 'Bonjour', durationMinutes: 5 })).json;
const badQuiz = await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
  title: 'Quiz invalide',
  type: 'quiz',
  durationMinutes: 5,
  quiz: { passingScore: 50, questions: [{ prompt: 'Question ?', options: ['A', 'B'], answer: 5 }] },
});
check('quiz avec bonne réponse hors bornes refusé', badQuiz.status === 400, badQuiz.json?.message);
detail = (
  await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
    title: 'Quiz',
    type: 'quiz',
    durationMinutes: 5,
    quiz: { passingScore: 100, questions: [{ prompt: 'Deux plus deux ?', options: ['3', '4'], answer: 1, explanation: 'Quatre.' }] },
  })
).json;
check('2 leçons créées', detail.curriculum[0].lessons.length === 2);
const [textLesson, quizLesson] = detail.curriculum[0].lessons;
const published = await call('POST', `/academy/admin/courses/${courseId}/status`, admin, { status: 'published' });
check('publication', published.status === 200 && published.json.status === 'published');
check('formation publiée visible dans le catalogue', (await call('GET', '/academy/courses', null)).json.some((c) => c.id === courseId));
const outline = await call('GET', `/academy/courses/${courseId}`, null);
check('programme public sans contenu des leçons', outline.status === 200 && outline.json.lessonsCount === 2 && !('content' in outline.json.modules[0].lessons[0]));

// Apprenant
check('accès refusé avant inscription', (await call('GET', `/academy/learn/${courseId}`, member)).status === 403);
const enroll = await enrollPaid(call, admin, member, { itemType: 'course', itemId: courseId });
check('inscription du membre', enroll.status === 201, enroll.json?.order?.reference);
const learn = await call('GET', `/academy/learn/${courseId}`, member);
check('lecteur : mode apprenant', learn.json?.mode === 'learner' && learn.json.stats.totalLessons === 2);
check('quiz : réponse non envoyée', learn.json.modules[0].lessons[1].quiz.questions[0].answer === undefined);
const done = await call('POST', `/academy/learn/${courseId}/lessons/${textLesson.id}/complete`, member);
check('leçon texte terminée → 50 %', done.json?.progress === 50, JSON.stringify(done.json));
const cheat = await call('POST', `/academy/learn/${courseId}/lessons/${quizLesson.id}/complete`, member);
check('quiz non validable par « terminer »', cheat.status === 400);
const wrong = await call('POST', `/academy/learn/${courseId}/lessons/${quizLesson.id}/quiz`, member, { answers: [0] });
check('quiz échoué : pas de bonne réponse révélée', wrong.json?.passed === false && wrong.json.results[0].answer === null && wrong.json.progress === 50);
const right = await call('POST', `/academy/learn/${courseId}/lessons/${quizLesson.id}/quiz`, member, { answers: [1] });
check('quiz réussi → 100 %, formation terminée', right.json?.passed === true && right.json.progress === 100 && right.json.status === 'completed');

// Administration : progression visible
const learners = await call('GET', `/academy/admin/courses/${courseId}/learners`, admin);
const row = learners.json?.learners?.find((l) => l.user.email === MEMBER.email);
check('admin voit la progression du membre', row?.progress === 100 && row.completedLessons === 2, JSON.stringify(row?.lessons));

// Programme modifié : progression recalculée
detail = (await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Leçon ajoutée', type: 'text', content: 'Suite', durationMinutes: 5 })).json;
const after = (await call('GET', `/academy/admin/courses/${courseId}/learners`, admin)).json.learners.find((l) => l.user.email === MEMBER.email);
check('leçon ajoutée → progression recalculée à 67 %', after?.progress === 67 && after.status === 'active', `${after?.progress} ${after?.status}`);

// Tarifs et journal
const price = await call('PATCH', '/academy/admin/prices', admin, { changes: [{ itemType: 'course', itemId: courseId, price: 55 }] });
check('prix modifié', price.json?.updated === 1);
const audit = await call('GET', '/academy/admin/audit?action=academy.price', admin);
check('journal : changement de prix tracé', audit.json?.items?.some((i) => i.targetId === courseId && i.details.to === 55));

// Archivage : invisible, accès conservé
await call('POST', `/academy/admin/courses/${courseId}/status`, admin, { status: 'archived' });
check('archivée : absente du catalogue', !(await call('GET', '/academy/courses', null)).json.some((c) => c.id === courseId));
check('archivée : l\'inscrit garde l\'accès', (await call('GET', `/academy/learn/${courseId}`, member)).json?.mode === 'learner');
check('suppression refusée avec inscrits', (await call('DELETE', `/academy/admin/courses/${courseId}`, admin)).status === 409);

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles sont passés.');
process.exit(failures ? 1 : 0);
