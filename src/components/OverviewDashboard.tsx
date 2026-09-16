import React from 'react';
import { BroadcastChecklistRow, IncidentTicket, Employee, OvertimeLog, TimeOffDeduction, ActiveTab } from '../types';
import { 
  Tv, 
  AlertCircle, 
  Clock, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  FileSpreadsheet, 
  HelpCircle,
  Database,
  Workflow,
  CheckCircle2
} from 'lucide-react';

interface Props {
  checklistRows: BroadcastChecklistRow[];
  incidents: IncidentTicket[];
  employees: Employee[];
  overtimeLogs: OvertimeLog[];
  timeOffDeductions: TimeOffDeduction[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export const OverviewDashboard: React.FC<Props> = ({
  checklistRows,
  incidents,
  employees,
  overtimeLogs,
  timeOffDeductions,
  onNavigateTab,
}) => {
  const activeIncidents = incidents.filter((i) => i.estado !== 'cerrado' && i.estado !== 'resuelto');
  const overtimeEmployees = employees.filter((emp) => {
    const isDarwin = emp.id === 'emp-1' || emp.tecnicoCode === 'DQuevedo' || (emp.nombre || '').toLowerCase() === 'darwin quevedo';
    return !isDarwin;
  });
  const totalBalanceHoras = Number(overtimeEmployees.reduce((acc, curr) => acc + (Number(curr.saldoHoras) || 0), 0).toFixed(2));
  const totalHorasExtrasRegistradas = Number(overtimeLogs.reduce((acc, curr) => acc + (Number(curr.horasEquivalentes) || 0), 0).toFixed(2));
  const totalHorasCanjeadas = Number(timeOffDeductions.reduce((acc, curr) => acc + (Number(curr.horasDescontadas) || 0), 0).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Centralized Solution Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            Arquitectura Centralizada de Operaciones Broadcast & TI
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Todo el control operativo de Comunica EP en un solo lugar
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Has reemplazado las hojas de cálculo aisladas por un sistema unificado donde el <strong className="text-white">Checklist de Transmisión</strong>, la <strong className="text-white">Mesa de Incidencias</strong> y el <strong className="text-white">Banco de Horas Extras</strong> trabajan de forma interconectada y en tiempo real.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Checklist */}
        <div
          onClick={() => onNavigateTab('checklist')}
          className="group bg-zinc-950 border border-zinc-850 hover:border-cyan-500/60 p-5 rounded-xl transition cursor-pointer shadow-lg relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-cyan-400 transition">
              Abrir planilla <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h3 className="font-semibold text-white text-base mb-1">Checklist Broadcasting</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Auditoría de ENPS, K2 Aire, Nexio, MOS, Orad, Provys, Prompter, Zoom y Enlaces redundantes.
          </p>
          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Registros cargados:</span>
            <strong className="text-white font-mono">{checklistRows.length} turnos</strong>
          </div>
        </div>

        {/* Card 2: Incidents */}
        <div
          onClick={() => onNavigateTab('incidencias')}
          className="group bg-zinc-950 border border-zinc-850 hover:border-red-500/60 p-5 rounded-xl transition cursor-pointer shadow-lg relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-red-400 transition">
              Ver mesa de ayuda <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h3 className="font-semibold text-white text-base mb-1">Mesa de Servicios (Helpdesk)</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Registro, priorización, asignación a técnicos y bitácora de soluciones para incidencias de emisión.
          </p>
          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Tickets en gestión:</span>
            <strong className="text-amber-400 font-mono font-bold">{activeIncidents.length} pendientes</strong>
          </div>
        </div>

        {/* Card 3: Overtime & Compensatory Time */}
        <div
          onClick={() => onNavigateTab('horas_extras')}
          className="group bg-zinc-950 border border-zinc-850 hover:border-emerald-500/60 p-5 rounded-xl transition cursor-pointer shadow-lg relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-emerald-400 transition">
              Ver saldos y kardex <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h3 className="font-semibold text-white text-base mb-1">Horas Extras y Compensación</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Control de horas al 50% y 100%, con descuento automático al solicitar horas o días libres.
          </p>
          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Saldo global disponible:</span>
            <strong className="text-emerald-400 font-mono font-bold">{totalBalanceHoras} horas</strong>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{overtimeLogs.length} reg. (+{totalHorasExtrasRegistradas}h)</span>
            <span>{timeOffDeductions.length} canjes (-{totalHorasCanjeadas}h)</span>
          </div>
        </div>
      </div>

      {/* Live Balance Summary per Worker */}
      {overtimeEmployees.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Estado en Tiempo Real del Banco de Horas por Técnico
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('horas_extras')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gestionar horas extras</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {overtimeEmployees.map((emp) => {
              const empLogsCount = overtimeLogs.filter(
                (l) => l.empleadoId === emp.id || (l.empleadoNombre && l.empleadoNombre.toLowerCase() === emp.nombre.toLowerCase())
              ).length;
              const empDeductionsCount = timeOffDeductions.filter(
                (d) => d.empleadoId === emp.id || (d.empleadoNombre && d.empleadoNombre.toLowerCase() === emp.nombre.toLowerCase())
              ).length;

              return (
                <div
                  key={emp.id}
                  onClick={() => onNavigateTab('horas_extras')}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-white truncate">{emp.nombre}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{emp.tecnicoCode}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                      <span>{empLogsCount} registros</span>
                      <span>•</span>
                      <span>{empDeductionsCount} canjes</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {emp.saldoHoras}h
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-zinc-500">
                      disponible
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* How it centralizes everything (Explicación para el usuario) */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          ¿Cómo funciona esta solución centralizada en el día a día?
        </h3>
        <p className="text-xs text-zinc-400 mb-6">
          A diferencia de llevar múltiples archivos de Excel que se desincronizan, este sistema unifica los tres flujos de trabajo de una empresa de comunicación:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
              Operación y Turnos
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              El operador de turno verifica cada programa (Noticiero Matinal, Central, etc.) marcando con un clic el estado de cada componente. Si algo falla, se detecta visualmente de inmediato.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-[10px]">2</span>
              Mesa de Incidencias
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Cualquier anomalía técnica en ENPS, Orad o los enlaces se documenta como un ticket formal con prioridad, técnico asignado y registro de la solución técnica aplicada para auditoría.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">3</span>
              Banco de Tiempo y RRHH
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Si un técnico extiende su jornada o acude en fin de semana (50% o 100%), sus horas quedan acreditadas en su balance. Cuando pide permisos o días libres, el sistema descuenta su saldo con precisión matemática.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
