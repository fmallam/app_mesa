import React, { useState } from 'react';
import { 
  DAILY_BROADCAST_TEMPLATE, 
  BroadcastChecklistRow, 
  Employee, 
  CheckStatus 
} from '../types';
import { 
  Layers, 
  X, 
  Check, 
  Sparkles, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Sliders
} from 'lucide-react';

interface TurnFormItem {
  id: string;
  programa: string;
  hora: string;
  activo: boolean;
  tecnicoTurno: string;
  observaciones: string;
  hasSystemIssue: boolean;
  issueSystemName?: keyof BroadcastChecklistRow;
  issueStatus?: CheckStatus;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rows: Omit<BroadcastChecklistRow, 'id'>[]) => void;
  employees: Employee[];
  existingRows?: BroadcastChecklistRow[];
  initialDate?: string;
  defaultTecnico?: string;
}

export const DailyTurnsBatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  employees,
  existingRows = [],
  initialDate,
  defaultTecnico,
}) => {
  const [fecha, setFecha] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [globalTecnico, setGlobalTecnico] = useState<string>(
    defaultTecnico || employees[0]?.tecnicoCode || 'DQuevedo'
  );

  // Check if a program and hour is already registered for the selected date
  const isItemAlreadyRegistered = (hora: string, programa: string, targetFecha: string) => {
    if (!existingRows || existingRows.length === 0) return false;
    const normHItem = (hora || '').trim().toLowerCase().replace(':', 'h');
    const normPItem = (programa || '').trim().toLowerCase();

    return existingRows.some((r) => {
      if (r.fecha !== targetFecha) return false;
      const normHRow = (r.hora || '').trim().toLowerCase().replace(':', 'h');
      const normPRow = (r.programa || '').trim().toLowerCase();
      return normHRow === normHItem || normPRow === normPItem;
    });
  };

  const createInitialItems = (targetFecha: string, tech: string): TurnFormItem[] => {
    return DAILY_BROADCAST_TEMPLATE.map((tpl, idx) => {
      const alreadyReg = isItemAlreadyRegistered(tpl.hora, tpl.programa, targetFecha);
      return {
        id: `tpl-${idx}`,
        programa: tpl.programa,
        hora: tpl.hora,
        activo: !alreadyReg,
        tecnicoTurno: tech,
        observaciones: 'sin novedad',
        hasSystemIssue: false,
      };
    });
  };

  const [items, setItems] = useState<TurnFormItem[]>(() =>
    createInitialItems(initialDate || new Date().toISOString().split('T')[0], defaultTecnico || employees[0]?.tecnicoCode || 'DQuevedo')
  );

  // When modal opens or initialDate changes, reset items according to target date registration
  React.useEffect(() => {
    if (isOpen) {
      const targetDate = initialDate || new Date().toISOString().split('T')[0];
      setFecha(targetDate);
      const tech = defaultTecnico || employees[0]?.tecnicoCode || 'DQuevedo';
      setGlobalTecnico(tech);
      setItems(createInitialItems(targetDate, tech));
    }
  }, [isOpen, initialDate, defaultTecnico]);

  // When fecha changes inside the modal, update active state for existing items
  const handleDateChange = (newDate: string) => {
    setFecha(newDate);
    setItems((prev) =>
      prev.map((it) => {
        const alreadyReg = isItemAlreadyRegistered(it.hora, it.programa, newDate);
        return {
          ...it,
          activo: alreadyReg ? false : it.activo,
        };
      })
    );
  };

  if (!isOpen) return null;

  const handleUpdateItem = (index: number, patch: Partial<TurnFormItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleApplyGlobalTecnico = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        tecnicoTurno: globalTecnico,
      }))
    );
  };

  const handleResetAllObservations = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        observaciones: 'sin novedad',
        hasSystemIssue: false,
      }))
    );
  };

  const handleSelectAll = (active: boolean) => {
    setItems((prev) =>
      prev.map((item) => {
        const isReg = isItemAlreadyRegistered(item.hora, item.programa, fecha);
        if (isReg) {
          return { ...item, activo: false };
        }
        return { ...item, activo: active };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Exclude any turn that is already registered for this date to prevent duplicate daily turns
    const activeItems = items.filter(
      (it) => it.activo && !isItemAlreadyRegistered(it.hora, it.programa, fecha)
    );

    if (activeItems.length === 0) {
      return;
    }

    const rowsToInsert: Omit<BroadcastChecklistRow, 'id'>[] = activeItems.map((it) => {
      const baseRow: Omit<BroadcastChecklistRow, 'id'> = {
        programa: it.programa,
        fecha: fecha,
        hora: it.hora,
        enpsSvrPrimario: 'ok',
        enpsSvrSecundario: 'ok',
        noticiasK2Aire: 'ok',
        noticiasNexio: 'ok',
        legalrecRadio: 'ok',
        legalrecTv: 'ok',
        mosSvrPrincipal: 'ok',
        oradSrvHdvg: 'ok',
        oradMaestroPc: 'ok',
        provysSvrBdd: 'ok',
        prompterPcCliente: 'ok',
        zoomPcZoom: 'ok',
        internetEnlacePrincipal: 'ok',
        internetEnlaceSecundario: 'ok',
        observaciones: it.observaciones.trim() || 'sin novedad',
        tecnicoTurno: it.tecnicoTurno || globalTecnico,
      };

      if (it.hasSystemIssue && it.issueSystemName && it.issueStatus) {
        (baseRow as any)[it.issueSystemName] = it.issueStatus;
      }

      return baseRow;
    });

    onConfirm(rowsToInsert);
    onClose();
  };

  // Turn counts for validation
  const registeredCount = items.filter((it) => isItemAlreadyRegistered(it.hora, it.programa, fecha)).length;
  const allAlreadyRegistered = registeredCount === items.length;
  const activeCount = items.filter((it) => it.activo && !isItemAlreadyRegistered(it.hora, it.programa, fecha)).length;

  const quickObservations = [
    'sin novedad',
    'Reinicio previo de PC Prompter',
    'Alerta leve en enlace secundario',
    'Demora en ingesta de noticias K2',
    'Retraso de señal de entrada',
    'Falla temporal de audio solventada',
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-cyan-800/60 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Cargar los 7 Turnos Diarios con Novedades
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300">
                  Plantilla Oficial
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Revisa cada emisión, redacta las novedades correspondientes y asigna el técnico responsable antes de registrarlos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls */}
        <div className="px-6 py-3.5 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-zinc-300 font-medium">Fecha de Turnos:</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-300 font-medium">Analista Principal:</label>
              <select
                value={globalTecnico}
                onChange={(e) => setGlobalTecnico(e.target.value)}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.tecnicoCode}>
                    {emp.tecnicoCode}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyGlobalTecnico}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium transition"
                title="Aplica este analista a los 7 turnos"
              >
                Aplicar a todos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllObservations}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 text-[11px] transition"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
              <span>Restablecer observaciones</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectAll(activeCount < items.length)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 text-[11px] transition"
            >
              {activeCount < items.length ? 'Marcar todos' : 'Desmarcar todos'}
            </button>
          </div>
        </div>

        {/* Duplicate warning banners */}
        {allAlreadyRegistered ? (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-3 text-amber-200 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 text-sm">
                Todos los turnos ya están registrados para el día {fecha}
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                Los 7 turnos diarios de la fecha seleccionada ({fecha}) ya fueron ingresados previamente. Los turnos diarios de una misma fecha solo pueden ser ingresados una sola vez para evitar duplicados.
              </p>
              <p className="text-[11px] text-zinc-400 mt-2">
                Para registrar los turnos de otra fecha, cambia la <strong>Fecha de Turnos</strong> en la barra superior.
              </p>
            </div>
          </div>
        ) : registeredCount > 0 ? (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Se detectaron <strong>{registeredCount}</strong> turno(s) ya ingresados previamente para el <strong>{fecha}</strong>. Solo se registrarán los turnos pendientes restantes.
              </span>
            </div>
          </div>
        ) : null}

        {/* Form List of 7 Turns */}
        <form id="daily-turns-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.map((item, index) => {
            const isRegistered = isItemAlreadyRegistered(item.hora, item.programa, fecha);
            return (
              <div
                key={item.id}
                className={`rounded-xl border transition p-3.5 ${
                  isRegistered
                    ? 'bg-zinc-950/60 border-amber-900/40 opacity-70'
                    : item.activo
                    ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Active Checkbox + Program + Hour */}
                  <div className="flex items-center gap-3 min-w-[260px]">
                    <input
                      type="checkbox"
                      checked={item.activo && !isRegistered}
                      disabled={isRegistered}
                      onChange={(e) => handleUpdateItem(index, { activo: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-zinc-950 border-zinc-700 focus:ring-cyan-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-xs font-bold text-cyan-400">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      <span>{item.hora}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${isRegistered ? 'text-zinc-400 line-through' : 'text-white'}`}>
                          {item.programa}
                        </h4>
                        {isRegistered && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            Ya registrado
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">Turno #{index + 1} del día</span>
                    </div>
                  </div>

                  {/* Center / Right: Technician and Observaciones */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Technician Select */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                        Analista de Turno
                      </label>
                      <select
                        disabled={!item.activo || isRegistered}
                        value={item.tecnicoTurno}
                        onChange={(e) => handleUpdateItem(index, { tecnicoTurno: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.tecnicoCode}>
                            {emp.tecnicoCode}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Novedades / Observaciones Input */}
                    <div className="md:col-span-8">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-medium text-zinc-400">
                          Novedades / Observaciones del Turno
                        </label>
                        {item.observaciones !== 'sin novedad' && !isRegistered && (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Con novedad
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={!item.activo || isRegistered}
                        value={item.observaciones}
                        onChange={(e) => handleUpdateItem(index, { observaciones: e.target.value })}
                        placeholder={isRegistered ? 'Turno ya registrado previamente' : 'Escriba la novedad (ej: sin novedad, falla de audio, reinicio k2...)'}
                        className={`w-full px-3 py-1.5 bg-zinc-950 border rounded-lg text-xs transition focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                          item.observaciones.trim() !== 'sin novedad' && !isRegistered
                            ? 'border-amber-600/70 text-amber-200 focus:border-amber-500 font-medium'
                            : 'border-zinc-750 text-zinc-200 focus:border-cyan-500'
                        }`}
                      />

                      {/* Quick Suggestions Chips */}
                      {!isRegistered && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {quickObservations.slice(0, 4).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              disabled={!item.activo}
                              onClick={() => handleUpdateItem(index, { observaciones: tag })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                                item.observaciones === tag
                                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300 font-medium'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>
              <strong>{activeCount}</strong> de {items.length} turnos por registrar para el día <strong>{fecha}</strong>
              {registeredCount > 0 && (
                <span className="text-amber-400 ml-1.5 font-medium">
                  ({registeredCount} ya registrados)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition border border-transparent hover:border-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="daily-turns-form"
              disabled={activeCount === 0 || allAlreadyRegistered}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>
                {allAlreadyRegistered
                  ? 'Turnos ya registrados para esta fecha'
                  : activeCount === 0
                  ? 'Selecciona al menos un turno'
                  : `Guardar y Registrar los ${activeCount} Turnos`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
