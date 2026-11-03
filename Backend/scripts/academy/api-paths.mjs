// Parcours : formations rattachées, publication, accès d'un membre par le parcours, progression du parcours, accès offert.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/academy/<script>.mjs
// À lancer sur une base de test : le script crée des formations, des parcours, des inscriptions et un compte membre.
import { enrollPaid } from './pay-helpers.mjs';
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');

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
  let json = null;
  try {
    json = JSON.parse(await res.text());
  } catch {}
  return { status: res.status, json };
}
const tokenOf = (r) => r.json?.token ?? r.json?.accessToken;

const admin = tokenOf(await call('POST', '/auth/login', null, ADMIN));
const email = `apprenant.${Date.now()}@qiao.test`;
const reg = await call('POST', '/auth/register', null, {
  fullName: 'Apprenant Parcours (test)',
  email,
  password: 'TestParcours2026',
  accountType: 'individual',
  origin: 'north-africa',
  acceptTerms: true,
});
const member = tokenOf(reg) ?? tokenOf(await call('POST', '/auth/login', null, { email, password: 'TestParcours2026' }));
check('compte membre de test créé', Boolean(member), String(reg.status));

// Formation publiée : 3 leçons texte + 1 quiz (réponses 1 puis 0)
const created = await call('POST', '/academy/admin/courses', admin, {
  title: 'Contrôle parcours — formation',
  description: 'Formation créée par le script de contrôle des parcours.',
  instructor: 'Équipe QIAO',
  price: 60,
  durationMinutes: 40,
  domain: 'commerce',
  level: 'Débutant',
  format: 'En ligne à son rythme',
});
const COURSE = created.json.id;
const moduleId = (await call('POST', `/academy/admin/courses/${COURSE}/modules`, admin, { title: 'Module unique' })).json.curriculum[0].id;
for (const title of ['Leçon A', 'Leçon B', 'Leçon C']) {
  await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title, type: 'text', content: `Contenu de ${title}`, durationMinutes: 5 });
}
await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
  title: 'Quiz final',
  type: 'quiz',
  durationMinutes: 5,
  quiz: {
    passingScore: 70,
    questions: [
      { prompt: 'Question 1 ?', options: ['Non', 'Oui'], answer: 1 },
      { prompt: 'Question 2 ?', options: ['Oui', 'Non'], answer: 0 },
    ],
  },
});
check('formation de contrôle publiée', (await call('POST', `/academy/admin/courses/${COURSE}/status`, admin, { status: 'published' })).json?.status === 'published');

// Parcours en brouillon, puis publication
const draftPath = await call('POST', '/academy/admin/paths', admin, {
  title: 'Parcours Sourcing (test)',
  description: 'Parcours de contrôle : une formation rattachée.',
  price: 199,
  duration: '2h',
  courseIds: [COURSE],
});
check('parcours créé en brouillon', draftPath.status === 201 && draftPath.json.status === 'draft' && draftPath.json.coursesCount === 1);
const pathId = draftPath.json.id;
check('brouillon absent des parcours publics', !(await call('GET', '/academy/paths', null)).json.some((p) => p.id === pathId));
const pub = await call('POST', `/academy/admin/paths/${pathId}/status`, admin, { status: 'published' });
check('parcours publié', pub.json?.status === 'published');
const publicPath = (await call('GET', '/academy/paths', null)).json.find((p) => p.id === pathId);
check('parcours public avec sa formation', publicPath?.courses?.[0]?.id === COURSE);

// Membre : inscription au parcours → accès à la formation
check('formation inaccessible avant inscription', (await call('GET', `/academy/learn/${COURSE}`, member)).status === 403);
const enroll = await enrollPaid(call, admin, member, { itemType: 'path', itemId: pathId });
check('inscription au parcours', enroll.status === 201);
const summary = (await call('GET', '/academy/me', member)).json;
check('la formation du parcours compte comme acquise', summary.enrolled.includes(`course:${COURSE}`));
const buy = await call('POST', '/academy/cart', member, { itemType: 'course', itemId: COURSE });
check('achat en double refusé (incluse dans le parcours)', buy.status === 409, buy.json?.message);
const learn = await call('GET', `/academy/learn/${COURSE}`, member);
check('accès à la formation via le parcours', learn.json?.mode === 'learner' && learn.json.enrollment?.source === 'path');
const lessons = learn.json.modules.flatMap((m) => m.lessons);
for (const lesson of lessons.filter((l) => l.type !== 'quiz')) {
  await call('POST', `/academy/learn/${COURSE}/lessons/${lesson.id}/complete`, member);
}
let enrollments = (await call('GET', '/academy/enrollments', member)).json;
let pathRow = enrollments.find((e) => e.itemType === 'path' && e.itemId === pathId);
check('progression du parcours = 75 % (3/4 leçons)', pathRow?.progress === 75 && pathRow.courses?.[0]?.progress === 75, `${pathRow?.progress}`);
const quiz = lessons.find((l) => l.type === 'quiz');
const answers = [1, 0];
const quizResult = await call('POST', `/academy/learn/${COURSE}/lessons/${quiz.id}/quiz`, member, { answers });
check('quiz réussi', quizResult.json?.passed === true, `${quizResult.json?.score} %`);
enrollments = (await call('GET', '/academy/enrollments', member)).json;
pathRow = enrollments.find((e) => e.itemType === 'path' && e.itemId === pathId);
check('parcours terminé à 100 %', pathRow?.progress === 100 && pathRow.status === 'completed');

// Administration : inscrits via parcours, accès offert, retrait
const learners = (await call('GET', `/academy/admin/courses/${COURSE}/learners`, admin)).json;
const viaPath = learners.learners.find((l) => l.user.email === email);
check('admin : membre listé « via parcours »', viaPath?.source === 'path' && viaPath.viaPath === 'Parcours Sourcing (test)' && viaPath.progress === 100);
const grant = await call('POST', '/academy/admin/enrollments', admin, { email: 'sami.benali@qiao.tn', itemType: 'path', itemId: pathId });
check('accès offert à un membre', grant.status === 201);
const dup = await call('POST', '/academy/admin/enrollments', admin, { email: 'sami.benali@qiao.tn', itemType: 'path', itemId: pathId });
check('accès offert en double refusé', dup.status === 409);
const unknown = await call('POST', '/academy/admin/enrollments', admin, { email: 'inconnu@qiao.test', itemType: 'path', itemId: pathId });
check('e-mail inconnu refusé', unknown.status === 404, unknown.json?.message);
const revoke = await call('DELETE', `/academy/admin/enrollments/${grant.json.id}`, admin);
check('accès retiré', revoke.status === 200);
check('suppression du parcours refusée (inscrits)', (await call('DELETE', `/academy/admin/paths/${pathId}`, admin)).status === 409);
check('membre refusé sur l\'API admin des parcours', (await call('POST', '/academy/admin/paths', member, {})).status === 403);

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles sont passés.');
process.exit(failures ? 1 : 0);
