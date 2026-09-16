import React from 'react';
import { ActiveTab, GoogleAccessPolicy, TechnicianSession } from '../types';
import { 
  Tv, 
  AlertCircle, 
  Clock, 
  LayoutDashboard, 
  RotateCcw,
  Shield, 
  Radio,
  Network,
  User,
  LogOut,
  UserCheck,
  ChevronDown
} from 'lucide-react';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openIncidentsCount: number;
  onResetData: () => void;
  onOpenAccessControl?: () => void;
  accessPolicy?: GoogleAccessPolicy;
  currentUserEmail?: string | null;
  isAdmin?: boolean;
  session: TechnicianSession | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  openIncidentsCount,
  onResetData,
  onOpenAccessControl,
  accessPolicy,
  currentUserEmail,
  isAdmin = false,
  session,
  onOpenLoginModal,
  onLogout,
}) => {
  const isSuperAdmin = isAdmin || session?.isAdmin || session?.area === 'todas';
  const isMultimedia = isSuperAdmin || session?.area === 'multimedia';
  const isControlTecnico = isSuperAdmin || session?.area === 'control_tecnico';

  return (
    <header className="border-b border-zinc-800/90 bg-black/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 py-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 font-black text-sm shadow-inner">
              EP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">COMUNICA EP</span>
                <span className="text-[10px] text-zinc-500 font-mono">| BROADCASTING</span>
              </div>
              <p className="text-[10px] text-zinc-400">Sistema Centralizado de Operaciones</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            {session ? (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-750 text-cyan-300 font-medium flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>{session.tecnicoCode || session.nombre}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-xs px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-semibold"
              >
                Iniciar Turno
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher filtered by user area and role */}
        <nav className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-850 rounded-xl overflow-x-auto w-full md:w-auto">
          {/* Resumen Dashboard: Visible to all */}
          <button
            type="button"
            onClick={() => onSelectTab('resumen')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Resumen</span>
          </button>

          {/* Checklist Sistemas: Multimedia & Admin */}
          {isMultimedia && (
            <button
              id="tab-checklist"
              type="button"
              onClick={() => onSelectTab('checklist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span>Checklist Sistemas</span>
            </button>
          )}

          {/* Control Técnico Checklist: Control Técnico & Admin */}
          {isControlTecnico && (
            <button
              id="tab-control-tecnico"
              type="button"
              onClick={() => onSelectTab('control_tecnico')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'control_tecnico'
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Control Técnico</span>
            </button>
          )}

          {/* Gestión de IPs: Multimedia & Admin */}
          {isMultimedia && (
            <button
              id="tab-gestion-ips"
              type="button"
              onClick={() => onSelectTab('gestion_ips')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'gestion_ips'
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gestión de IPs</span>
            </button>
          )}

          {/* Mesa de Servicios: Visible in Admin & Multimedia */}
          {(isSuperAdmin || isMultimedia) && (
            <button
              id="tab-incidencias"
              type="button"
              onClick={() => onSelectTab('incidencias')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'incidencias'
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Mesa de Servicios</span>
              {openIncidentsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-950 text-red-300 border border-red-800 text-[10px] flex items-center justify-center font-bold">
                  {openIncidentsCount}
                </span>
              )}
            </button>
          )}

          {/* Horas Extras & Compensación: Always visible, filtered inside */}
          <button
            id="tab-horas-extras"
            type="button"
            onClick={() => onSelectTab('horas_extras')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'horas_extras'
                ? 'bg-zinc-900 text-white shadow-sm border border-zinc-750'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isSuperAdmin ? 'Horas Extras & Compensación' : 'Mis Horas Extras & Compensación'}
            </span>
          </button>
        </nav>

        {/* Right side actions & User Session Badge */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-white leading-tight flex items-center gap-1.5">
                  {session.tecnicoCode || session.nombre}
                  {session.isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-mono font-bold">
                      ADMIN
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">
                  {session.area === 'todas'
                    ? 'Supervisión Total'
                    : session.area === 'control_tecnico'
                    ? 'Control Técnico'
                    : 'Multimedia'}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="ml-2 p-1 text-zinc-400 hover:text-cyan-300 rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Cambiar de turno o usuario"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Cerrar turno"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              id="btn-nav-iniciar-turno"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Iniciar Turno</span>
            </button>
          )}

          {isSuperAdmin && onOpenAccessControl && (
            <button
              id="btn-nav-access-control"
              type="button"
              onClick={onOpenAccessControl}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-amber-600/80 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 transition shadow-sm cursor-pointer"
              title="Panel de Control de Acceso (Solo Administradores)"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">Seguridad</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={onResetData}
              title="Restablecer datos de ejemplo (Solo Admin)"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
