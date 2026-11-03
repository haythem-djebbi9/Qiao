import React from 'react';
import { ArrowRight, Award, CheckCircle2, PlayCircle, ShoppingCart } from 'lucide-react';
import { resolveImage } from '../../lib/assets';
import { Cart, Enrollment, Order } from '../../lib/models';
import { formatDate } from '../../lib/text';
import { navigateDashboard } from '../../lib/payments';
import { MyOrders } from './MyOrders';
import { CertificateButton, ProgressBar } from './ui';

const Empty: React.FC<{ text: string; action: { label: string; onClick: () => void } }> = ({ text, action }) => (
  <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 space-y-3">
    <p>{text}</p>
    <button onClick={action.onClick} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
      {action.label}
    </button>
  </div>
);

const actionLabel = (progress: number, status: string | null) => (status === 'completed' ? 'Revoir' : progress > 0 ? 'Continuer' : 'Commencer');

/** Mon espace › Formations : formations et parcours suivis, avec la progression enregistrée leçon par leçon. */
export const MyCourses: React.FC<{
  enrollments: Enrollment[];
  cart: Cart;
  orders: Order[];
  onNavigate: (tab: string) => void;
  /** Commande ouverte au retour de la page de paiement. */
  focusOrderId?: string;
  onOrdersChanged?: () => void;
}> = ({ enrollments, cart, orders, onNavigate, focusOrderId, onOrdersChanged }) => {
  // Les formations ouvertes depuis un parcours sont présentées dans la carte du parcours.
  const visible = enrollments.filter((e) => e.source !== 'path');
  const learn = (courseId: string) => navigateDashboard(`academy/${courseId}`);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Mes formations</h2>
        {visible.length === 0 ? (
          <Empty text="Aucune formation pour le moment." action={{ label: 'Découvrir QIAO Academy', onClick: () => onNavigate('academy') }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((e) => (
              <div key={e.id} className={`bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col ${e.itemType === 'path' ? 'sm:col-span-2' : ''}`}>
                <div className="relative">
                  <img src={resolveImage(e.image)} alt={e.title} className="w-full h-28 object-cover" />
                  {e.status === 'completed' && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                      <Award className="w-3 h-3" /> Terminé
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] font-bold uppercase text-red-600">
                    {e.itemType === 'path' ? 'Parcours' : 'Formation'}
                    {e.source === 'admin' && <span className="ml-1.5 text-slate-400 normal-case font-semibold">· accès offert par QIAO</span>}
                  </div>
                  <div className="font-bold text-sm text-slate-900 leading-snug">{e.title}</div>
                  <ProgressBar value={e.progress} className="mt-3 h-2" />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Progression : {e.progress}% · inscrit le {formatDate(e.createdAt)}
                    {e.lastActivityAt && <> · dernière activité le {formatDate(e.lastActivityAt)}</>}
                  </div>

                  {e.itemType === 'course' && (
                    <>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => learn(e.itemId)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <PlayCircle className="w-4 h-4" /> {actionLabel(e.progress, e.status)}
                        </button>
                        {(e.status === 'completed' || e.certificate) && <CertificateButton courseId={e.itemId} certificate={e.certificate} />}
                      </div>
                      {e.certificate && (
                        <div className="text-[10px] text-slate-400 mt-1.5">
                          Certificat n° <span className="font-mono">{e.certificate.number}</span> · délivré le {formatDate(e.certificate.issuedAt)}
                        </div>
                      )}
                    </>
                  )}

                  {e.itemType === 'path' && (
                    <div className="mt-3 space-y-2">
                      {(e.courses ?? []).length === 0 && (
                        <p className="text-xs text-slate-500">Les formations de ce parcours seront bientôt disponibles.</p>
                      )}
                      {(e.courses ?? []).map((course, index) => (
                        <div key={course.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {course.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">{course.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <ProgressBar value={course.progress} className="h-1.5" />
                              <span className="text-[10px] text-slate-500 shrink-0">{course.progress}%</span>
                            </div>
                          </div>
                          {(course.status === 'completed' || course.certificate) && (
                            <CertificateButton courseId={course.id} certificate={course.certificate} compact className="shrink-0" />
                          )}
                          <button
                            onClick={() => learn(course.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-red-300 hover:text-red-600 text-[11px] font-bold text-slate-700 cursor-pointer shrink-0"
                          >
                            {actionLabel(course.progress, course.status)}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {cart.count > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <ShoppingCart className="w-4 h-4 text-red-600" />
            {cart.count} formation(s) dans votre panier — {cart.total} TND
          </div>
          <button onClick={() => onNavigate('academy')} className="text-xs font-bold text-red-600 hover:underline cursor-pointer inline-flex items-center gap-1">
            Finaliser ma commande <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <MyOrders orders={orders} focusId={focusOrderId} onChanged={() => onOrdersChanged?.()} />
    </div>
  );
};
