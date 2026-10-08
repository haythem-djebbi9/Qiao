import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  Building2,
  Ship,
  Scale,
  Languages,
  Users,
  Truck,
  FileText,
  Sparkles,
  Calendar,
  Calculator,
  Search,
  Bell,
} from 'lucide-react';
import { Logo } from './Logo';
import { AppTab } from '../types';
import { SECTORS_LIST } from '../data/sectorsData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { NotificationList } from '../lib/models';
import { initials, timeAgo } from '../lib/text';

interface HeaderProps {
  activeTab?: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currentLang: string;
  onSelectLang: (lang: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenCalculator?: () => void;
  onOpenSearch?: () => void;
  onSelectServiceCategory?: (category: string) => void;
  onSelectSector?: (sectorId: string) => void;
}

/** Libellés de navigation traduits selon la langue choisie. */
const NAV_LABELS: Record<string, Record<string, string>> = {
  FR: { home: 'Accueil', about: 'À propos', sectors: 'Secteurs', services: 'Services', community: 'Community', academy: 'Academy', events: 'Événements', resources: 'Ressources', contact: 'Contact', login: 'Se connecter', register: 'Créer un compte' },
  EN: { home: 'Home', about: 'About', sectors: 'Sectors', services: 'Services', community: 'Community', academy: 'Academy', events: 'Events', resources: 'Resources', contact: 'Contact', login: 'Sign in', register: 'Create account' },
  ZH: { home: '首页', about: '关于我们', sectors: '行业', services: '服务', community: '社区', academy: '学院', events: '活动', resources: '资源', contact: '联系', login: '登录', register: '注册' },
  AR: { home: 'الرئيسية', about: 'من نحن', sectors: 'القطاعات', services: 'الخدمات', community: 'المجتمع', academy: 'الأكاديمية', events: 'الفعاليات', resources: 'الموارد', contact: 'اتصل بنا', login: 'تسجيل الدخول', register: 'إنشاء حساب' },
};

const NOTIFICATIONS_REFRESH_MS = 60_000;

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'home',
  onSelectTab,
  currentLang,
  onSelectLang,
  onOpenLogin,
  onOpenRegister,
  onOpenAuth,
  onOpenCalculator,
  onOpenSearch,
  onSelectServiceCategory,
  onSelectSector,
}) => {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [sectorsDropdownOpen, setSectorsDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationList>({ items: [], unreadCount: 0 });
  const isLoggedIn = !!user;
  const t = NAV_LABELS[currentLang] ?? NAV_LABELS.FR;

  const loadNotifications = useCallback(() => {
    api
      .get<NotificationList>('/notifications')
      .then(setNotifications)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications({ items: [], unreadCount: 0 });
      return;
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, NOTIFICATIONS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [user, loadNotifications]);

  // Rafraîchit la cloche à chaque ouverture du menu (nouvelles actions de l'utilisateur).
  useEffect(() => {
    if (notificationsOpen && user) loadNotifications();
  }, [notificationsOpen, user, loadNotifications]);

  const markAllRead = async () => {
    try {
      setNotifications(await api.patch<NotificationList>('/notifications/read-all'));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
    }
  };

  const openNotification = async (id: string, link: string | null, read: boolean) => {
    setNotificationsOpen(false);
    if (!read) {
      api.patch<NotificationList>(`/notifications/${id}/read`).then(setNotifications).catch(() => undefined);
    }
    if (link) onSelectTab(link as AppTab);
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    notify('Vous êtes déconnecté. À bientôt sur QIAO !', 'info');
  };

  const isLight =
    isScrolled ||
    activeTab === 'sector-detail' ||
    activeTab === 'secteurs' ||
    activeTab === 'commerce-hub' ||
    activeTab === 'about' ||
    activeTab === 'contact' ||
    activeTab === 'community' ||
    activeTab === 'academy' ||
    activeTab === 'evenements' ||
    activeTab === 'stories' ||
    activeTab === 'resources' ||
    activeTab === 'dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'FR', label: 'Français', flag: '🇫🇷' },
    { code: 'ZH', label: '中文 (Chinois)', flag: '🇨🇳' },
    { code: 'AR', label: 'العربية (Arabe)', flag: '🇹🇳' },
    { code: 'EN', label: 'English', flag: '🇬🇧' },
  ];

  const handleSelectLang = (code: string) => {
    onSelectLang(code);
    setLangDropdownOpen(false);
  };

  const handleAuth = (mode: 'login' | 'register') => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else if (mode === 'login') {
      onOpenLogin();
    } else {
      onOpenRegister();
    }
  };

  const handleNavClick = (tab: AppTab | string) => {
    onSelectTab(tab as AppTab);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setSectorsDropdownOpen(false);
    
    // Dedicated pages (Intelligence, Academy, Secteurs) and Home start at the top
    if (tab === 'intelligence' || tab === 'academy' || tab === 'secteurs' || tab === 'sector-detail') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Smooth scroll to the target section for landing page anchors
    const el = document.getElementById(tab);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLight
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5 sm:py-6 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: QIAO Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="cursor-pointer hover:opacity-95 transition-opacity shrink-0 mr-4 xl:mr-8"
        >
          <Logo variant={isLight ? 'light' : 'dark'} size="md" />
        </div>

        {/* Center/Right Navigation Menu (Clean, uncrowded, responsive) */}
        <div className="hidden lg:flex items-center gap-3.5 xl:gap-5.5 ml-auto mr-3 xl:mr-6">
          <nav className={`flex items-center gap-3 xl:gap-4.5 text-[13px] xl:text-[13.5px] font-medium ${
            isLight ? 'text-slate-800' : 'text-white/90'
          }`}>
            {/* 1. Accueil */}
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'home'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.home}
            </button>

            {/* 2. À propos */}
            <button
              onClick={() => handleNavClick('about')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'about'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.about}
            </button>

            {/* 3. Secteurs with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSectorsDropdownOpen(true)}
              onMouseLeave={() => setSectorsDropdownOpen(false)}
            >
              <button
                onClick={() => handleNavClick('secteurs')}
                className={`transition-all cursor-pointer flex items-center gap-1 py-1 whitespace-nowrap ${
                  activeTab === 'secteurs' || activeTab === 'sector-detail' || activeTab === 'commerce-hub'
                    ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                    : isLight
                    ? 'hover:text-red-600 text-slate-800'
                    : 'hover:text-white text-white/85'
                }`}
              >
                <span>{t.sectors}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    sectorsDropdownOpen ? 'rotate-180' : ''
                  } opacity-75`}
                />
              </button>

              {sectorsDropdownOpen && (
                <div
                  className={`absolute top-full left-0 w-80 rounded-2xl shadow-2xl py-3 px-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl border ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#0a1b38] border-slate-700/60 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-1 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Secteurs Clés
                    </span>
                    <button
                      onClick={() => {
                        setSectorsDropdownOpen(false);
                        handleNavClick('secteurs');
                      }}
                      className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                    >
                      Vue d'ensemble →
                    </button>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {SECTORS_LIST.map((sector) => (
                      <button
                        key={sector.id}
                        onClick={() => {
                          setSectorsDropdownOpen(false);
                          if (onSelectSector) {
                            onSelectSector(sector.id);
                          } else {
                            handleNavClick('secteurs');
                          }
                        }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                          isLight
                            ? 'text-slate-800 hover:bg-slate-50'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-red-500 font-bold">●</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs truncate">
                            {sector.title}
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              isLight ? 'text-slate-500' : 'text-white/60'
                            }`}
                          >
                            {sector.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Services with Chevron */}
            <div
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button
                onClick={() => handleNavClick('services')}
                className={`transition-colors cursor-pointer flex items-center gap-1 py-1 whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                    : isLight
                    ? 'hover:text-red-600 text-slate-800'
                    : 'hover:text-white text-white/85'
                }`}
              >
                <span>{t.services}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    servicesDropdownOpen ? 'rotate-180' : ''
                  } ${
                    activeTab === 'services'
                      ? 'text-red-600'
                      : isLight
                      ? 'text-slate-600'
                      : 'text-white/70'
                  }`}
                />
              </button>

              {servicesDropdownOpen && (
                <div className={`absolute top-full left-0 w-80 rounded-2xl shadow-2xl py-3 px-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#0a1b38] border-slate-700/60 text-white'
                }`}>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 mb-1">
                    Catalogues de Services
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Business');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Création d'entreprise</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          WFOE, Joint-Venture, Maghreb & Chine
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Logistique');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Ship className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Sourcing & Import / Export</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Usines qualifiées, inspection et fret
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Juridique');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Scale className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Conseil juridique & Fiscalité</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Contrats bilingues et conformité
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Traduction');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Languages className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Traduction & Interprétation</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Arabe, Chinois, Français, Anglais
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Recrutement');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Recrutement & RH</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Talents locaux et expatriés
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setServicesDropdownOpen(false);
                        onSelectServiceCategory?.('Logistique');
                        handleNavClick('services');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-800 hover:bg-slate-50'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Logistique & Transport</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Maritime, aérien et douane
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Community */}
            <button
              onClick={() => handleNavClick('community')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'community'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.community}
            </button>

            {/* 5b. Academy */}
            <button
              onClick={() => handleNavClick('academy')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'academy'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.academy}
            </button>

            {/* 6. Événements */}
            <button
              onClick={() => handleNavClick('evenements')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'stories' || activeTab === 'evenements'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.events}
            </button>

            {/* 7. Ressources with Chevron */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesDropdownOpen(true)}
              onMouseLeave={() => setResourcesDropdownOpen(false)}
            >
              <button
                onClick={() => handleNavClick('resources')}
                className={`transition-all cursor-pointer flex items-center gap-1 py-1 whitespace-nowrap ${
                  activeTab === 'resources' || activeTab === 'intelligence' || activeTab === 'partners'
                    ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                    : isLight
                    ? 'hover:text-red-600 text-slate-800'
                    : 'hover:text-white text-white/85'
                }`}
              >
                <span>{t.resources}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    resourcesDropdownOpen ? 'rotate-180' : ''
                  } opacity-70`}
                />
              </button>

              {resourcesDropdownOpen && (
                <div className={`absolute top-full left-0 w-80 rounded-2xl shadow-2xl py-3 px-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#0a1b38] border-slate-700/60 text-white'
                }`}>
                  <button
                    onClick={() => {
                      setResourcesDropdownOpen(false);
                      handleNavClick('analyses');
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Articles & Analyses</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        QIAO Intelligence & décryptages économiques
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setResourcesDropdownOpen(false);
                      handleNavClick('resources');
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Guides Sectoriels</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        Données exclusives Chine-Maghreb
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setResourcesDropdownOpen(false);
                      handleNavClick('stories');
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Événements & Forums</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        Forums d'affaires et sessions live
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setResourcesDropdownOpen(false);
                      onOpenCalculator?.();
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Simulateur de Droits & Taxes</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        Calculer les coûts douaniers en temps réel
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setResourcesDropdownOpen(false);
                      handleNavClick('partners');
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Pays Partenaires & Réseau</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        Chine, Algérie, Maroc, Tunisie, Libye
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 8. Contact */}
            <button
              onClick={() => handleNavClick('contact')}
              className={`transition-all cursor-pointer py-1 whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'text-red-600 font-bold border-b-2 border-red-600 pb-0.5'
                  : isLight
                  ? 'hover:text-red-600 text-slate-800'
                  : 'hover:text-white text-white/85'
              }`}
            >
              {t.contact}
            </button>

          </nav>
        </div>

        {/* Right Actions: Clean, non-cluttered, never cut off */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          
          {/* 1. Search Icon */}
          <button
            onClick={() => {
              if (onOpenSearch) {
                onOpenSearch();
              } else {
                handleNavClick('services');
              }
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-white/85 hover:text-white hover:bg-white/10'
            }`}
            title="Rechercher"
            aria-label="Recherche rapide"
          >
            <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
          </button>

          {/* 2. Language Selector: 🌐 FR */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-white'}`} />
              <span className="font-semibold">{currentLang}</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>
            {langDropdownOpen && (
              <div className={`absolute top-full right-0 mt-2 w-44 rounded-2xl shadow-2xl py-2 px-1.5 z-50 border backdrop-blur-xl ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a1b38] border-slate-700 text-white'
              }`}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLang(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                      currentLang === lang.code
                        ? 'bg-red-50 text-red-600 font-bold'
                        : isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {currentLang === lang.code && <span className="text-red-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isLoggedIn ? (
            <>
              {/* Se connecter */}
              <button
                onClick={() => handleAuth('login')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap rounded-lg ${
                  isLight
                    ? 'text-slate-700 hover:text-red-600 hover:bg-slate-100'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {t.login}
              </button>

              {/* Red Solid CTA Button: Créer un compte */}
              <button
                onClick={() => handleAuth('register')}
                className="px-3.5 xl:px-4 py-2 text-xs sm:text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {t.register}
              </button>
            </>
          ) : (
            <>
              {/* Bell Notification with unread Badge */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                    isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Notifications (${notifications.unreadCount})`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
                  {notifications.unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#07152b]">
                      {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationsOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-80 rounded-2xl shadow-2xl p-3.5 z-50 border backdrop-blur-xl ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a1b38] border-slate-700 text-white'
                  }`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/40">
                      <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">Notifications</span>
                      {notifications.unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-red-500 font-medium cursor-pointer hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 text-xs max-h-80 overflow-y-auto pr-1">
                      {notifications.items.length === 0 && (
                        <div className="text-center text-slate-400 py-4">Aucune notification pour le moment.</div>
                      )}
                      {notifications.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openNotification(item.id, item.link, item.read)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            item.read
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={`font-bold ${item.read ? 'text-slate-800' : 'text-red-500'}`}>{item.title}</div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(item.createdAt)}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{item.body}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        onSelectTab('dashboard');
                      }}
                      className="w-full mt-2 pt-2 border-t border-slate-200/40 text-[11px] font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      Voir mon espace membre →
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile with Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-colors cursor-pointer ${
                    isLight
                      ? 'hover:bg-slate-100 text-slate-800'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-white/40 ring-1 ring-red-500/60"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center ring-1 ring-red-500/60">
                      {initials(user?.fullName ?? '')}
                    </span>
                  )}
                  <span className="text-xs sm:text-[13px] font-medium tracking-tight">
                    {user?.fullName.split(' ')[0]} {user?.fullName.split(' ')[1]?.[0] ? `${user.fullName.split(' ')[1][0]}.` : ''}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {profileDropdownOpen && user && (
                  <div className={`absolute top-full right-0 mt-2 w-60 rounded-2xl shadow-2xl py-2 px-1.5 z-50 border backdrop-blur-xl ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a1b38] border-slate-700 text-white'
                  }`}>
                    <div className="px-3 py-2 border-b border-slate-200/40 mb-1">
                      <div className="font-bold text-xs">{user.fullName}</div>
                      <div className="text-[11px] text-slate-400">{user.title ?? user.company ?? 'Membre QIAO'}</div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          user.verified
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}
                      >
                        {user.verified ? 'Membre Vérifié' : 'Vérification KYC en cours'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSelectTab('dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Mon Espace Client</span>
                      <span className="text-slate-400">→</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setNotificationsOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>Mes Alertes & Rapports</span>
                      {notifications.unreadCount > 0 && (
                        <span className="px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">{notifications.unreadCount}</span>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <div className="flex lg:hidden items-center gap-2 relative">
          {langDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 rounded-2xl shadow-2xl py-2 px-1.5 z-50 border bg-white border-slate-200 text-slate-800">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLang(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl cursor-pointer ${
                    currentLang === lang.code ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {currentLang === lang.code && <span className="text-red-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
          {/* Mobile Language Switcher */}
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isScrolled
                ? 'text-slate-700 border-slate-200 bg-slate-100'
                : 'text-white border-white/20 bg-white/10'
            }`}
          >
            <span>{currentLang}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl focus:outline-none ${
              isScrolled ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-b px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl ${
          isScrolled
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#07152b] border-white/10 text-white'
        }`}>
          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.home}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`text-left px-3 py-2.5 rounded-xl font-semibold ${
                activeTab === 'about'
                  ? 'text-red-500 bg-red-500/10'
                  : isScrolled
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.about}
            </button>
            <button
              onClick={() => handleNavClick('secteurs')}
              className={`text-left px-3 py-2.5 rounded-xl font-semibold ${
                activeTab === 'secteurs' || activeTab === 'sector-detail'
                  ? 'text-red-500 bg-red-500/10'
                  : isScrolled
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              Secteurs
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              Services & Catalogue
            </button>
            <button
              onClick={() => handleNavClick('community')}
              className={`text-left px-3 py-2.5 rounded-xl font-semibold ${
                activeTab === 'community'
                  ? 'text-red-500 bg-red-500/10'
                  : isScrolled
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.community}
            </button>
            <button
              onClick={() => handleNavClick('academy')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.academy}
            </button>
            <button
              onClick={() => handleNavClick('intelligence')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              Intelligence
            </button>
            <button
              onClick={() => handleNavClick('partners')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              Partenaires &amp; Réseau
            </button>
            <button
              onClick={() => handleNavClick('resources')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.resources}
            </button>
            <button
              onClick={() => handleNavClick('evenements')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.events}
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              Comment ça marche
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`text-left px-3 py-2.5 rounded-xl ${
                isScrolled ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {t.contact}
            </button>
          </div>

          {/* Mobile Auth and Simulator Actions */}
          <div className={`pt-3 border-t flex flex-col gap-2 ${
            isScrolled ? 'border-slate-200' : 'border-white/10'
          }`}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCalculator?.();
              }}
              className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border ${
                isScrolled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Calculator className="w-4 h-4 text-red-500" />
              <span>Simulateur de Droits & Taxes</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch?.();
              }}
              className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border ${
                isScrolled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Search className="w-4 h-4 text-red-500" />
              <span>Rechercher sur QIAO</span>
            </button>
            {isLoggedIn ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`py-2.5 text-xs font-medium rounded-xl border text-center ${
                    isScrolled
                      ? 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
                      : 'border-white/20 text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  Mon espace{notifications.unreadCount > 0 ? ` (${notifications.unreadCount})` : ''}
                </button>
                <button
                  onClick={handleLogout}
                  className="py-2.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl text-center shadow-xs"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAuth('login');
                  }}
                  className={`py-2.5 text-xs font-medium rounded-xl border text-center ${
                    isScrolled
                      ? 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
                      : 'border-white/20 text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {t.login}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAuth('register');
                  }}
                  className="py-2.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl text-center shadow-xs"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
