import React, { useState } from 'react';
import {
  Shield,
  Users,
  Handshake,
  Brain,
  Target,
  Gauge,
  Briefcase,
  Building,
  Globe,
  Star,
  Play,
  ArrowRight,
  MapPin,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import handshakeImg from '../assets/images/china_africa_handshake_1787501713904.jpg';

interface TechHumanSectionProps {
  onOpenVideo: () => void;
  onOpenMission: () => void;
}

export const TechHumanSection: React.FC<TechHumanSectionProps> = ({
  onOpenVideo,
  onOpenMission,
}) => {
  const [activePin, setActivePin] = useState<'na' | 'cn'>('na');

  return (
    <section id="tech-human" className="py-16 sm:py-24 bg-[#030919] text-white relative overflow-hidden">
      {/* Background ambient lighting and star grid */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-900/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Cyber Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-[2px] bg-red-500 inline-block" />
            <span className="text-xs sm:text-sm font-extrabold text-red-500 uppercase tracking-widest">
              POURQUOI CHOISIR QIAO ?
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.18] mb-4">
            L’alliance parfaite entre<br />
            <span className="text-sky-400">technologie</span> <span className="text-white">et</span> <span className="text-red-500">expertise humaine</span>
          </h2>
          
          <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-2xl">
            QIAO combine une plateforme digitale intelligente et un réseau d'experts locaux pour vous offrir des solutions fiables, rapides et adaptées à vos besoins.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CENTRAL HOLOGRAPHIC TECH HUB WITH ROTATING BRILLIANCE CIRCLES & 3D EARTH */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-b from-[#040e24]/90 via-[#030a1b]/95 to-[#020712] border border-blue-900/40 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl mb-16 overflow-hidden backdrop-blur-md">
          
          {/* Subtle Ambient Radial Glow inside card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/15 rounded-full blur-[90px] pointer-events-none" />
          
          {/* Main 3-Column Layout: Left Features | Center Animated Holographic Orb | Right Features */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center relative z-10">
            
            {/* ----------------- LEFT FEATURES COLUMN (3 Items) ----------------- */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Feature 1: Technologie & Plateforme */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <Cpu className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Plateforme Intelligente
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      Une technologie avancée pour matcher vos besoins avec les meilleures opportunités.
                    </p>
                  </div>
                </div>
                {/* Sleek divider line */}
                <div className="h-[1px] bg-gradient-to-r from-blue-500/40 to-transparent mt-6" />
              </div>

              {/* Feature 2: Confiance & Sécurité */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Confiance & Sécurité
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      KYC rigoureux, badges vérifiés et protocoles stricts pour des transactions en toute sérénité.
                    </p>
                  </div>
                </div>
                {/* Sleek divider line */}
                <div className="h-[1px] bg-gradient-to-r from-blue-500/40 to-transparent mt-6" />
              </div>

              {/* Feature 3: Accompagnement Humain */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <Users className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Accompagnement Dédié
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      Des conseillers bilingues et experts sectoriels sur le terrain à vos côtés.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* ----------------- CENTER HOLOGRAPHIC SPHERE & 3D EARTH (6 Columns) ----------------- */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[380px] sm:min-h-[460px] my-4 lg:my-0">
              
              {/* Outer Container with Floating Motion */}
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center animate-holo-float">
                
                {/* 1. BACKGROUND GLOW CORE WITH SYNCHRONIZED HEARTBEAT GLOW */}
                <div className="absolute inset-4 rounded-full bg-radial from-sky-500/25 via-blue-700/15 to-transparent blur-xl animate-heartbeat-glow pointer-events-none" />

                {/* 1b. CARDIAC VIBRATION SHOCKWAVE RIPPLES */}
                <div className="absolute inset-4 rounded-full border border-cyan-400/50 animate-cardiac-ripple-1 pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                <div className="absolute inset-6 rounded-full border border-rose-500/40 animate-cardiac-ripple-2 pointer-events-none shadow-[0_0_20px_rgba(244,63,94,0.35)]" />

                {/* 2. ROTATING CONIC-GRADIENT LASER SHIMMER / BRILLIANCE SWEEP */}
                <div className="absolute inset-0 rounded-full p-[1px] overflow-hidden pointer-events-none animate-spin-shimmer opacity-70">
                  <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(56,189,248,0.8)_340deg,rgba(255,255,255,1)_360deg)]" />
                </div>

                {/* 3. OUTERMOST ROTATING TECH HUD RING (Clockwise Slow) */}
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none"
                >
                  <defs>
                    <linearGradient id="hudRingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="30%" stopColor="#818cf8" stopOpacity="0.4" />
                      <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Segmented Outer Tech Ring */}
                  <circle
                    cx="200"
                    cy="200"
                    r="192"
                    fill="none"
                    stroke="url(#hudRingGrad1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 8 12 8 30 10 60 12 100 15"
                    opacity="0.85"
                  />

                  {/* Precision Tick Marks */}
                  <circle
                    cx="200"
                    cy="200"
                    r="185"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="1 12"
                    opacity="0.4"
                  />

                  {/* Orbit Particle Nodes */}
                  <circle cx="200" cy="8" r="3.5" fill="#38bdf8" />
                  <circle cx="392" cy="200" r="2.5" fill="#FFFFFF" />
                  <circle cx="200" cy="392" r="3" fill="#ef4444" />
                  <circle cx="8" cy="200" r="2.5" fill="#38bdf8" />
                </svg>

                {/* 4. SECOND CONCENTRIC RING (Counter-Clockwise Medium) */}
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-5 w-[calc(100%-40px)] h-[calc(100%-40px)] animate-spin-slow-reverse pointer-events-none"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="165"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="1.2"
                    strokeDasharray="12 6 2 6"
                    opacity="0.6"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="158"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="40 80 20 60"
                    opacity="0.75"
                  />

                  {/* Glowing neon points along the circle */}
                  <circle cx="358" cy="200" r="3.5" fill="#38bdf8" />
                  <circle cx="42" cy="200" r="3" fill="#ef4444" />
                </svg>

                {/* 5. THIRD INNER FAST TECH RING (Clockwise) */}
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-10 w-[calc(100%-80px)] h-[calc(100%-80px)] animate-spin-medium pointer-events-none"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="132"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1"
                    strokeDasharray="6 14"
                    opacity="0.5"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="124"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="25 70"
                    opacity="0.8"
                  />
                  {/* Diamond node */}
                  <rect
                    x="196"
                    y="72"
                    width="8"
                    height="8"
                    fill="#38bdf8"
                    transform="rotate(45 200 76)"
                  />
                </svg>

                {/* 6. INNER GLASS EMBLEM SPHERE WITH RADIAL BRILLIANCE & HEARTBEAT VIBRATIONS */}
                <div className="absolute inset-14 rounded-full bg-[#030c20]/95 border border-blue-400/40 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center p-4 animate-heartbeat-vibration origin-center">
                  
                  {/* Digital Radial Grid Inside Emblem */}
                  <div className="absolute inset-2 rounded-full overflow-hidden opacity-25 pointer-events-none">
                    <div className="w-full h-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                  </div>

                  {/* Central Typography Logo */}
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    
                    {/* Q I Ʌ O Brand Text */}
                    <div className="text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-[0.28em] text-white flex items-center justify-center">
                      <span className="relative inline-flex items-center justify-center">
                        <span className="font-light">Q</span>
                        <span className="absolute -bottom-1 -right-0.5 w-[6px] h-[3.5px] bg-red-500 rounded-full transform rotate-45" />
                      </span>
                      <span className="mx-1.5 font-light">I</span>
                      <span className="font-normal text-white">Ʌ</span>
                      <span className="ml-1.5 font-light">O</span>
                    </div>

                    {/* — THE BRIDGE BETWEEN — */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-4 sm:w-6 h-[1px] bg-red-500" />
                      <span className="text-[8px] sm:text-[9.5px] font-medium uppercase tracking-[0.24em] text-white/80">
                        THE BRIDGE BETWEEN
                      </span>
                      <span className="w-4 sm:w-6 h-[1px] bg-sky-400" />
                    </div>

                    {/* CHINA & NORTH AFRICA */}
                    <div className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                      <span className="text-red-400 font-extrabold">
                        CHINA
                      </span>
                      <span className="text-white/60 font-light">&</span>
                      <span className="text-sky-400 font-extrabold">
                        NORTH AFRICA
                      </span>
                    </div>
                  </div>

                </div>

                {/* ================================================================= */}
                {/* 7. 3D CURVED EARTH HORIZON GRID AT BOTTOM OF SPHERE               */}
                {/* ================================================================= */}
                <div className="absolute -bottom-4 inset-x-0 h-44 pointer-events-none overflow-hidden rounded-b-3xl">
                  
                  <svg viewBox="0 0 400 180" className="w-full h-full">
                    <defs>
                      {/* Luminous Arc Gradient */}
                      <linearGradient id="bridgePhotonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
                      </linearGradient>

                      {/* Atmosphere Glow */}
                      <linearGradient id="globeAtmoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                        <stop offset="40%" stopColor="#030919" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#030919" stopOpacity="0.9" />
                      </linearGradient>

                      {/* Glow Filter */}
                      <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Earth Horizon Curvature Base Fill */}
                    <path
                      d="M -20 180 Q 200 40 420 180 Z"
                      fill="url(#globeAtmoGrad)"
                    />

                    {/* Glowing Earth Horizon Boundary Line */}
                    <path
                      d="M -20 180 Q 200 40 420 180"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                      opacity="0.8"
                      filter="url(#arcGlow)"
                    />

                    {/* Latitude Grid Lines */}
                    <path
                      d="M 10 180 Q 200 65 390 180"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                      opacity="0.4"
                    />
                    <path
                      d="M 40 180 Q 200 95 360 180"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                      opacity="0.3"
                    />

                    {/* Longitude Curved Lines */}
                    <path d="M 90 180 Q 120 70 200 40" fill="none" stroke="#38bdf8" strokeWidth="0.7" opacity="0.3" />
                    <path d="M 150 180 Q 160 60 200 40" fill="none" stroke="#38bdf8" strokeWidth="0.7" opacity="0.3" />
                    <path d="M 250 180 Q 240 60 200 40" fill="none" stroke="#38bdf8" strokeWidth="0.7" opacity="0.3" />
                    <path d="M 310 180 Q 280 70 200 40" fill="none" stroke="#38bdf8" strokeWidth="0.7" opacity="0.3" />

                    {/* Dotted Continents Simulation on Globe (North Africa & China Clusters) */}
                    <g fill="#38bdf8" opacity="0.55">
                      {/* North Africa Continent Dots */}
                      <circle cx="85" cy="125" r="1.5" />
                      <circle cx="92" cy="120" r="2" />
                      <circle cx="100" cy="115" r="2.2" />
                      <circle cx="108" cy="122" r="1.8" />
                      <circle cx="115" cy="118" r="2" />
                      <circle cx="98" cy="130" r="1.5" />
                      <circle cx="106" cy="135" r="1.5" />
                      
                      {/* Asia / China Continent Dots */}
                      <circle cx="285" cy="118" r="2" />
                      <circle cx="295" cy="112" r="2.2" />
                      <circle cx="305" cy="116" r="2" />
                      <circle cx="315" cy="122" r="1.8" />
                      <circle cx="292" cy="128" r="1.6" />
                      <circle cx="302" cy="132" r="1.5" />
                      <circle cx="310" cy="128" r="1.7" />
                    </g>

                    {/* Glowing Arc Bridge Connecting Blue Pin (North Africa) to Red Pin (China) */}
                    {/* Underlying Glow Arc */}
                    <path
                      d="M 98 120 Q 200 35 300 115"
                      fill="none"
                      stroke="url(#bridgePhotonGrad)"
                      strokeWidth="3"
                      filter="url(#arcGlow)"
                      opacity="0.9"
                    />

                    {/* Animated Flowing Photon Beam */}
                    <path
                      d="M 98 120 Q 200 35 300 115"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeDasharray="15 35"
                      className="animate-photon-flow"
                    />

                    {/* Secondary Accent Dash Line */}
                    <path
                      d="M 98 120 Q 200 35 300 115"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                      opacity="0.75"
                    />
                  </svg>

                  {/* North Africa Location Pin (Blue) with Pulsing Beacon */}
                  <div
                    onClick={() => setActivePin('na')}
                    className="absolute left-[22%] bottom-[32%] pointer-events-auto cursor-pointer flex flex-col items-center group -translate-x-1/2 z-20"
                    title="Afrique du Nord"
                  >
                    {/* Radar Pulse */}
                    <div className="absolute -inset-2 rounded-full bg-sky-500/40 animate-beacon-ping pointer-events-none" />
                    {/* Pin Marker with Heartbeat Pulse */}
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MapPin className="w-4 h-4 fill-white text-blue-600" />
                    </div>
                  </div>

                  {/* China Location Pin (Red) with Pulsing Beacon */}
                  <div
                    onClick={() => setActivePin('cn')}
                    className="absolute right-[22%] bottom-[34%] pointer-events-auto cursor-pointer flex flex-col items-center group translate-x-1/2 z-20"
                    title="Chine"
                  >
                    {/* Radar Pulse */}
                    <div className="absolute -inset-2 rounded-full bg-red-500/40 animate-beacon-ping pointer-events-none" />
                    {/* Pin Marker with Heartbeat Pulse */}
                    <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MapPin className="w-4 h-4 fill-white text-red-600" />
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* ----------------- RIGHT FEATURES COLUMN (3 Items - Matching Mockup) ----------------- */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Feature 4: Intelligence & Veille */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <Brain className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Intelligence & Veille
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      Analyses de marché, sectorielles et opportunités actualisées en temps réel.
                    </p>
                  </div>
                </div>
                {/* Sleek divider line */}
                <div className="h-[1px] bg-gradient-to-r from-blue-500/40 to-transparent mt-6" />
              </div>

              {/* Feature 5: Solutions Sur-Mesure */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <Target className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Solutions Sur-Mesure
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      Des recommandations personnalisées pour des solutions adaptées à vos objectifs et contraintes.
                    </p>
                  </div>
                </div>
                {/* Sleek divider line */}
                <div className="h-[1px] bg-gradient-to-r from-blue-500/40 to-transparent mt-6" />
              </div>

              {/* Feature 6: Gain de Temps */}
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-blue-500/50 bg-[#061533] text-sky-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:border-sky-400 transition-all">
                    <Gauge className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                      Gain de Temps
                    </h3>
                    <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                      Une plateforme centralisée pour trouver rapidement les bons experts, partenaires et opportunités.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Video & Mission Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#061533]/60 border border-blue-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md mb-16">
          {/* Video preview on left */}
          <div className="lg:col-span-5">
            <div 
              onClick={onOpenVideo}
              className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-blue-900/40"
            >
              <img
                src={handshakeImg}
                alt="Business partnership China & North Africa"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-blue-950/40 group-hover:bg-blue-950/20 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Mission Description & Action on right */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                  Une vision partagée
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                Bâtir des ponts d'excellence et de croissance durable entre deux continents.
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-light mt-2 leading-relaxed">
                Notre mission est d'accélérer les échanges économiques, technologiques et culturels en levant les barrières linguistiques et réglementaires avec une rigueur absolue.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenMission}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs sm:text-sm font-semibold shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <span>Découvrir notre mission & méthodologie</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Bottom Stats Container */}
        <div className="bg-[#040e24]/90 border border-blue-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x lg:divide-blue-900/40 text-center">
            
            {/* Stat 1 */}
            <div className="flex flex-col items-center px-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-red-400 tracking-tight">10,000+</div>
              <div className="text-sm font-bold text-white mt-1">Utilisateurs actifs</div>
              <div className="text-xs text-white/70 font-light mt-1 max-w-[200px] leading-relaxed">
                Entreprises et professionnels nous font déjà confiance.
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center px-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-sky-400 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">5,000+</div>
              <div className="text-sm font-bold text-white mt-1">Experts & prestataires</div>
              <div className="text-xs text-white/70 font-light mt-1 max-w-[200px] leading-relaxed">
                Un réseau qualifié et évalué pour vous accompagner.
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center px-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-3">
                <Building className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-red-400 tracking-tight">1,200+</div>
              <div className="text-sm font-bold text-white mt-1">Entreprises accompagnées</div>
              <div className="text-xs text-white/70 font-light mt-1 max-w-[200px] leading-relaxed">
                De la création à l'expansion, en Chine et en Afrique du Nord.
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center px-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-sky-400 flex items-center justify-center mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">20+</div>
              <div className="text-sm font-bold text-white mt-1">Pays connectés</div>
              <div className="text-xs text-white/70 font-light mt-1 max-w-[200px] leading-relaxed">
                Un pont solide entre la Chine et l'Afrique du Nord.
              </div>
            </div>

            {/* Stat 5 */}
            <div className="flex flex-col items-center px-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">98%</div>
              <div className="text-sm font-bold text-white mt-1">Taux de satisfaction</div>
              <div className="text-xs text-white/70 font-light mt-1 max-w-[200px] leading-relaxed">
                Des résultats concrets et des clients satisfaits.
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
