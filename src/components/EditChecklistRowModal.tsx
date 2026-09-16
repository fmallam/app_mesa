import React, { useState } from 'react';
import { BroadcastChecklistRow, Employee, CheckStatus } from '../types';
import { 
  X, 
  Save, 
  Trash2, 
  Clock, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MinusCircle,
  FileEdit
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  row: BroadcastChecklistRow | null;
  onSave: (rowId: string, updates: Partial<BroadcastChecklistRow>) => void;
  onDelete?: (rowId: string) => void;
  employees: Employee[];
}

export const EditChecklistRowModal: React.FC<Props> = ({
  isOpen,
  onClose,
  row,
  onSave,
  onDelete,
  employees,
}) => {
  if (!isOpen || !row) return null;

  const [observaciones, setObservaciones] = useState(row.observaciones);
  const [tecnicoTurno, setTecnicoTurno] = useState(row.tecnicoTurno);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local state for all 14 systems
  const [systems, setSystems] = useState({
    enpsSvrPrimario: row.enpsSvrPrimario,
    enpsSvrSecundario: row.enpsSvrSecundario,
    noticiasK2Aire: row.noticiasK2Aire,
    noticiasNexio: row.noticiasNexio,
    legalrecRadio: row.legalrecRadio,
    legalrecTv: row.legalrecTv,
    mosSvrPrincipal: row.mosSvrPrincipal,
    oradSrvHdvg: row.oradSrvHdvg,
    oradMaestroPc: row.oradMaestroPc,
    provysSvrBdd: row.provysSvrBdd,
    prompterPcCliente: row.prompterPcCliente,
    zoomPcZoom: row.zoomPcZoom,
    internetEnlacePrincipal: row.internetEnlacePrincipal,
    internetEnlaceSecundario: row.internetEnlaceSecundario,
  });

  const cycleStatus = (current: CheckStatus): CheckStatus => {
    switch (current) {
      case 'ok': return 'falla';
      case 'falla': return 'alerta';
      case 'alerta': return 'na';
      case 'na': return 'ok';
      default: return 'ok';
    }
  };

  const handleToggleSystem = (key: keyof typeof systems) => {
    setSystems((prev) => ({
      ...prev,
      [key]: cycleStatus(prev[key]),
    }));
  };

  const handleSetAllSystemsOk = () => {
    setSystems({
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
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(row.id, {
      observaciones: observaciones.trim() || 'sin novedad',
      tecnicoTurno,
      ...systems,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(row.id);
      onClose();
    }
  };

  const renderBadge = (status: CheckStatus) => {
    switch (status) {
      case 'ok':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800"><CheckCircle2 className="w-3 h-3" /> OK</span>;
      case 'falla':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800"><XCircle className="w-3 h-3" /> FALLA</span>;
      case 'alerta':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800"><AlertTriangle className="w-3 h-3" /> ALERTA</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"><MinusCircle className="w-3 h-3" /> N/A</span>;
    }
  };

  const systemList: { key: keyof typeof systems; label: string; group: string }[] = [
    { key: 'enpsSvrPrimario', label: 'SVR Primario', group: 'ENPS' },
    { key: 'enpsSvrSecundario', label: 'SVR Secundario', group: 'ENPS' },
    { key: 'noticiasK2Aire', label: 'K2 Aire', group: 'Noticias' },
    { key: 'noticiasNexio', label: 'Nexio', group: 'Noticias' },
    { key: 'legalrecRadio', label: 'Radio', group: 'LegalRec' },
    { key: 'legalrecTv', label: 'TV', group: 'LegalRec' },
    { key: 'mosSvrPrincipal', label: 'SVR Principal', group: 'MOS' },
    { key: 'oradSrvHdvg', label: 'SRV-HDVG', group: 'ORAD' },
    { key: 'oradMaestroPc', label: 'Maestro PC', group: 'ORAD' },
    { key: 'provysSvrBdd', label: 'SVR-BDD', group: 'Provys' },
    { key: 'prompterPcCliente', label: 'PC Cliente', group: 'Prompter' },
    { key: 'zoomPcZoom', label: 'PC-Zoom', group: 'Zoom' },
    { key: 'internetEnlacePrincipal', label: 'Enlace Principal', group: 'Internet' },
    { key: 'internetEnlaceSecundario', label: 'Enlace Secundario', group: 'Internet' },
  ];

  const quickTags = [
    'sin novedad',
    'Reinicio previo de PC Prompter',
    'Alerta leve en enlace secundario',
    'Demora en ingesta de noticias K2',
    'Retraso de señal de entrada',
    'Falla temporal de audio solventada',
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{row.programa}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-300">
                  {row.hora}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Fecha: {row.fecha}</span>
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

        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Novedades / Observaciones Field */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
              Novedades / Observaciones del Turno
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describa cualquier novedad o incidencia ocurrida en este turno (o 'sin novedad')..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 placeholder-zinc-500 resize-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-zinc-400 self-center mr-1">Rápidos:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setObservaciones(tag)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    observaciones === tag
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Técnico de Turno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Analista Responsable del Turno
              </label>
              <select
                value={tecnicoTurno}
                onChange={(e) => setTecnicoTurno(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.tecnicoCode}>
                    {emp.tecnicoCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSetAllSystemsOk}
                className="w-full px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-semibold text-emerald-400 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Poner todos los sistemas en OK</span>
              </button>
            </div>
          </div>

          {/* Systems Status Matrix Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Auditoría de Subsistemas (Clic para alternar OK / FALLA / ALERTA)
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {systemList.map((sys) => (
                <button
                  key={sys.key}
                  type="button"
                  onClick={() => handleToggleSystem(sys.key)}
                  className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-left transition flex flex-col justify-between gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {sys.group}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-200 truncate">
                    {sys.label}
                  </span>
                  <div className="mt-1">
                    {renderBadge(systems[sys.key])}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div>
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-900/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 font-medium">¿Eliminar este turno?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
