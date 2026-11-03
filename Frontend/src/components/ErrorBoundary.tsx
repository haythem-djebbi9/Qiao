import React from 'react';

/** Dernier recours : une erreur d'affichage laisse un message et un bouton de rechargement plutôt qu'une page blanche. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erreur d\'affichage :', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Une erreur est survenue</h1>
          <p className="text-sm text-slate-600">Cette page n'a pas pu s'afficher. Rechargez-la pour réessayer ; si le problème persiste, écrivez à l'équipe QIAO.</p>
          <button onClick={() => window.location.assign('/')} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
            Revenir à l'accueil
          </button>
        </div>
      </div>
    );
  }
}
