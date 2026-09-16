import React, { useState, useMemo } from 'react';
import { 
  BroadcastChecklistRow, 
  CheckStatus, 
  Employee,
  DAILY_BROADCAST_TEMPLATE,
  ESTABLISHED_HOURS
} from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MinusCircle, 
  Plus, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Tv, 
  Check, 
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Printer,
  Layers,
  Pencil,
  Trash2,
  Edit3,
  AlertCircle,
  X
} from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { ChecklistMonthlyReportModal } from './ChecklistMonthlyReportModal';
import { DailyTurnsBatchModal } from './DailyTurnsBatchModal';
import { EditChecklistRowModal } from './EditChecklistRowModal';

interface Props {
  rows: BroadcastChecklistRow[];
  onAddRow: (row: Omit<BroadcastChecklistRow, 'id'>) => void;
  onAddMultipleRows?: (rows: Omit<BroadcastChecklistRow, 'id'>[]) => void;
  onUpdateCellStatus: (rowId: string, field: keyof BroadcastChecklistRow, newStatus: CheckStatus) => void;
  onUpdateRow?: (rowId: string, updates: Partial<BroadcastChecklistRow>) => void;
  onDeleteRow?: (rowId: string) => void;
  onCleanDuplicates?: () => void;
  employees: Employee[];
}

export const BroadcastChecklist: React.FC<Props> = ({
  rows,
  onAddRow,
  onAddMultipleRows,
  onUpdateCellStatus,
  onUpdateRow,
  onDeleteRow,
  onCleanDuplicates,
  employees,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedTecnico, setSelectedTecnico] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDailyBatchModalOpen, setIsDailyBatchModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BroadcastChecklistRow | null>(null);
  const [rowToDelete, setRowToDelete] = useState<BroadcastChecklistRow | null>(null);
  const [inlineEditingRowId, setInlineEditingRowId] = useState<string | null>(null);
  const [inlineObsValue, setInlineObsValue] = useState<string>('');

  // Checklist Analysts: Freddy Malla & Darwin Quevedo (Analistas de Sistemas y Multimedia Broadcasting 2)
  const checklistAnalysts = useMemo(() => {
    const matched = employees.filter(
      (emp) => emp.tecnicoCode === 'Fmalla' || emp.tecnicoCode === 'DQuevedo' || emp.cargo.toLowerCase().includes('broadcasting')
    );
    return matched.length > 0 ? matched : employees;
  }, [employees]);

  // Form State
  const [formData, setFormData] = useState({
    programa: 'Noticiero Matinal',
    fecha: new Date().toISOString().split('T')[0],
    hora: '07h00',
    observaciones: 'sin novedad',
    tecnicoTurno: checklistAnalysts[0]?.tecnicoCode || 'DQuevedo',
  });

  const [isCustomProgram, setIsCustomProgram] = useState(false);
  const [customProgramName, setCustomProgramName] = useState('');
  const [isCustomHour, setIsCustomHour] = useState(false);
  const [customHourValue, setCustomHourValue] = useState('');

  // Check if single turn currently being entered in the modal is a duplicate for that date
  const isDuplicateSingleTurn = useMemo(() => {
    const finalProgram = isCustomProgram 
      ? (customProgramName.trim() || 'Emisión Especial') 
      : formData.programa;
    const finalHour = isCustomHour 
      ? (customHourValue.trim() || formData.hora) 
      : formData.hora;

    if (!formData.fecha || !finalHour || !finalProgram) return false;

    const normH = (finalHour || '').trim().toLowerCase().replace(':', 'h');
    const normP = (finalProgram || '').trim().toLowerCase();

    return rows.some((r) => {
      if (r.fecha !== formData.fecha) return false;
      const rH = (r.hora || '').trim().toLowerCase().replace(':', 'h');
      const rP = (r.programa || '').trim().toLowerCase();
      return rH === normH || rP === normP;
    });
  }, [rows, formData.fecha, formData.hora, formData.programa, isCustomProgram, customProgramName, isCustomHour, customHourValue]);

  // Overall duplicate turns detected in the current checklist table
  const duplicateRowsCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    rows.forEach((r) => {
      const key = `${r.fecha}_${(r.hora || '').trim().toLowerCase().replace(':', 'h')}_${(r.programa || '').trim().toLowerCase()}`;
      if (seen.has(key)) {
        count++;
      } else {
        seen.add(key);
      }
    });
    return count;
  }, [rows]);

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(rows.map((r) => r.fecha)));
    return dates.sort().reverse();
  }, [rows]);

  const SYSTEM_NAMES: Record<string, string> = {
    enpsSvrPrimario: 'ENPS Primario',
    enpsSvrSecundario: 'ENPS Secundario',
    noticiasK2Aire: 'Noticias K2 Aire',
    noticiasNexio: 'Noticias Nexio',
    legalrecRadio: 'LegalRec Radio',
    legalrecTv: 'LegalRec TV',
    mosSvrPrincipal: 'MOS Principal',
    oradSrvHdvg: 'ORAD HDVG',
    oradMaestroPc: 'ORAD Maestro PC',
    provysSvrBdd: 'Provys BDD',
    prompterPcCliente: 'Prompter PC',
    zoomPcZoom: 'Zoom PC',
    internetEnlacePrincipal: 'Internet Principal',
    internetEnlaceSecundario: 'Internet Secundario',
  };

  const systemKeysList: (keyof BroadcastChecklistRow)[] = [
    'enpsSvrPrimario', 'enpsSvrSecundario',
    'noticiasK2Aire', 'noticiasNexio',
    'legalrecRadio', 'legalrecTv',
    'mosSvrPrincipal',
    'oradSrvHdvg', 'oradMaestroPc',
    'provysSvrBdd', 'prompterPcCliente', 'zoomPcZoom',
    'internetEnlacePrincipal', 'internetEnlaceSecundario'
  ];

  const isRealNovelty = (obs?: string) => {
    if (!obs) return false;
    const clean = obs.trim().toLowerCase();
    return (
      clean !== '' &&
      clean !== 'sin novedad' &&
      clean !== 'sin novedades' &&
      clean !== 'sin novedad.' &&
      clean !== 's/n' &&
      clean !== 'ninguna' &&
      clean !== 'ninguno' &&
      clean !== 'ok' &&
      clean !== 'normal' &&
      clean !== '-' &&
      clean !== 'ningun'
    );
  };

  const getSubsystemIssues = (r: BroadcastChecklistRow) => {
    const issues: { label: string; type: 'falla' | 'alerta' }[] = [];
    systemKeysList.forEach((key) => {
      const val = r[key];
      if (val === 'falla') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'falla' });
      } else if (val === 'alerta') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'alerta' });
      }
    });
    return issues;
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchDate = selectedDate === 'all' || r.fecha === selectedDate;
      const matchTecnico = selectedTecnico === 'all' || r.tecnicoTurno === selectedTecnico;
      const matchSearch = searchTerm === '' || 
        r.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tecnicoTurno.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDate && matchTecnico && matchSearch;
    });
  }, [rows, selectedDate, selectedTecnico, searchTerm]);

  const checklistNovelties = useMemo(() => {
    return filteredRows.filter((r) => {
      const hasObs = isRealNovelty(r.observaciones);
      const hasSystemIssue = systemKeysList.some((k) => r[k] === 'falla' || r[k] === 'alerta');
      return hasObs || hasSystemIssue;
    });
  }, [filteredRows]);

  const cycleStatus = (current: CheckStatus): CheckStatus => {
    switch (current) {
      case 'ok': return 'falla';
      case 'falla': return 'alerta';
      case 'alerta': return 'na';
      case 'na': return 'ok';
      default: return 'ok';
    }
  };

  const renderStatusBadge = (status: CheckStatus, onClick?: () => void) => {
    switch (status) {
      case 'ok':
        return (
          <button
            type="button"
            onClick={onClick}
            title="OK - Clic para cambiar"
            className="w-7 h-7 mx-auto rounded flex items-center justify-center bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 hover:scale-110 hover:border-emerald-400 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        );
      case 'falla':
        return (
          <button
            type="button"
            onClick={onClick}
            title="FALLA - Clic para cambiar"
            className="w-7 h-7 mx-auto rounded flex items-center justify-center bg-red-950/90 border border-red-500/80 text-red-400 hover:scale-110 hover:border-red-400 transition cursor-pointer animate-pulse"
          >
            <XCircle className="w-4 h-4" />
          </button>
        );
      case 'alerta':
        return (
          <button
            type="button"
            onClick={onClick}
            title="ALERTA / OBSERVACIÓN - Clic para cambiar"
            className="w-7 h-7 mx-auto rounded flex items-center justify-center bg-amber-950/80 border border-amber-500/80 text-amber-400 hover:scale-110 hover:border-amber-400 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        );
      case 'na':
        return (
          <button
            type="button"
            onClick={onClick}
            title="NO APLICA - Clic para cambiar"
            className="w-7 h-7 mx-auto rounded flex items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-500 hover:scale-110 hover:border-zinc-500 transition cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
        );
    }
  };

  const handleImportSheetsRows = (newRows: Omit<BroadcastChecklistRow, 'id'>[]) => {
    if (onAddMultipleRows) {
      onAddMultipleRows(newRows);
    } else {
      newRows.forEach((r) => onAddRow(r));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'PROGRAMA', 'FECHA', 'HORA',
      'ENPS_PRIMARIO', 'ENPS_SECUNDARIO',
      'K2_AIRE', 'NEXIO',
      'LEGALREC_RADIO', 'LEGALREC_TV',
      'MOS_PRINCIPAL',
      'ORAD_SRV_HDVG', 'ORAD_MAESTRO',
      'PROVYS_BDD', 'PROMPTER', 'ZOOM',
      'INTERNET_PRINCIPAL', 'INTERNET_SECUNDARIO',
      'OBSERVACIONES', 'TECNICO'
    ];

    const csvRows = filteredRows.map((r) => [
      `"${r.programa}"`,
      r.fecha,
      r.hora,
      r.enpsSvrPrimario,
      r.enpsSvrSecundario,
      r.noticiasK2Aire,
      r.noticiasNexio,
      r.legalrecRadio,
      r.legalrecTv,
      r.mosSvrPrincipal,
      r.oradSrvHdvg,
      r.oradMaestroPc,
      r.provysSvrBdd,
      r.prompterPcCliente,
      r.zoomPcZoom,
      r.internetEnlacePrincipal,
      r.internetEnlaceSecundario,
      `"${r.observaciones}"`,
      r.tecnicoTurno,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_broadcasting_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProgramSelect = (val: string) => {
    if (val === '__custom__') {
      setIsCustomProgram(true);
      setCustomProgramName('');
    } else {
      setIsCustomProgram(false);
      // Auto-set the established hour from the schedule template
      const templateItem = DAILY_BROADCAST_TEMPLATE.find((item) => item.programa === val);
      const matchingHour = templateItem ? templateItem.hora : formData.hora;
      setIsCustomHour(false);
      setFormData((prev) => ({
        ...prev,
        programa: val,
        hora: matchingHour,
      }));
    }
  };

  const handleHourSelect = (val: string) => {
    if (val === '__custom__') {
      setIsCustomHour(true);
      setCustomHourValue('');
    } else {
      setIsCustomHour(false);
      setFormData((prev) => ({
        ...prev,
        hora: val,
      }));
    }
  };

  const handleOpenDailyBatchModal = () => {
    setIsModalOpen(false);
    setIsDailyBatchModalOpen(true);
  };

  const handleConfirmDailyBatch = (newBatchRows: Omit<BroadcastChecklistRow, 'id'>[]) => {
    if (onAddMultipleRows) {
      onAddMultipleRows(newBatchRows);
    } else {
      newBatchRows.forEach((r) => onAddRow(r));
    }
  };

  const handleStartInlineEdit = (row: BroadcastChecklistRow) => {
    setInlineEditingRowId(row.id);
    setInlineObsValue(row.observaciones);
  };

  const handleSaveInlineObs = (rowId: string) => {
    if (onUpdateRow) {
      onUpdateRow(rowId, { observaciones: inlineObsValue.trim() || 'sin novedad' });
    }
    setInlineEditingRowId(null);
  };

  const handleSaveRowModal = (rowId: string, updates: Partial<BroadcastChecklistRow>) => {
    if (onUpdateRow) {
      onUpdateRow(rowId, updates);
    }
    setEditingRow(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateSingleTurn) {
      return;
    }

    const finalProgram = isCustomProgram 
      ? (customProgramName.trim() || 'Emisión Especial') 
      : formData.programa;
    const finalHour = isCustomHour 
      ? (customHourValue.trim() || formData.hora) 
      : formData.hora;

    onAddRow({
      programa: finalProgram,
      fecha: formData.fecha,
      hora: finalHour,
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
      observaciones: formData.observaciones || 'sin novedad',
      tecnicoTurno: formData.tecnicoTurno,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Official Header Banner like the image */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xl">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">COMUNICA</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-bold border border-cyan-700/50">EP</span>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                EMPRESA PÚBLICA DE COMUNICACIÓN DEL ECUADOR
              </p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <div className="inline-block px-3 py-1 rounded-md bg-blue-950/70 border border-blue-800/60 text-blue-300 text-xs font-semibold tracking-wider uppercase mb-1">
              REPORTE SISTEMAS BROADCASTING 2026
            </div>
            <p className="text-xs text-zinc-400">
              Monitoreo continuo de continuidad de emisión y salas de control
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="search-checklist"
                type="text"
                placeholder="Buscar programa u observación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/70 w-52 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id="filter-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-zinc-200">Todas las fechas</option>
                {availableDates.map((d) => (
                  <option key={d} value={d} className="bg-zinc-900 text-zinc-200">{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id="filter-tecnico"
                value={selectedTecnico}
                onChange={(e) => setSelectedTecnico(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-zinc-200">Todos los analistas</option>
                {checklistAnalysts.map((emp) => (
                  <option key={emp.id} value={emp.tecnicoCode} className="bg-zinc-900 text-zinc-200">
                    {emp.tecnicoCode}
                  </option>
                ))}
              </select>
            </div>

            {(selectedDate !== 'all' || selectedTecnico !== 'all' || searchTerm !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('all');
                  setSelectedTecnico('all');
                  setSearchTerm('');
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 hover:bg-zinc-800 rounded transition"
              >
                <RotateCcw className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-google-sheets-sync"
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-850 bg-emerald-950/40 hover:bg-emerald-900/60 text-xs font-medium text-emerald-300 transition"
              title="Importar o vincular con Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            <button
              id="export-checklist-csv"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              id="btn-print-checklist-monthly"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-800/70 bg-cyan-950/40 hover:bg-cyan-900/60 text-xs font-semibold text-cyan-300 transition shadow-sm"
              title="Generar informe mensual para impresión y descarga en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imprimir / PDF Mensual</span>
            </button>

            <button
              id="btn-load-7-daily-turns"
              type="button"
              onClick={() => setIsDailyBatchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-700/80 bg-gradient-to-r from-teal-950/60 to-cyan-950/60 hover:from-teal-900/80 hover:to-cyan-900/80 text-xs font-semibold text-teal-300 transition shadow-sm"
              title="Cargar y redactar las novedades de los 7 turnos diarios de la plantilla oficial"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Cargar 7 Turnos Diarios</span>
            </button>

            <button
              id="btn-new-checklist-row"
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legend & quick helper */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 bg-zinc-950/60 border border-zinc-900 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 font-medium">Convenciones de estado (haz clic en cualquier celda para alternar):</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Normal / OK</span>
          <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> Falla Crítica</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Observación / Alerta</span>
          <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-zinc-500" /> No Aplica</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500">
          {duplicateRowsCount > 0 && onCleanDuplicates && (
            <button
              type="button"
              onClick={onCleanDuplicates}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[11px] font-semibold hover:bg-amber-900/80 transition"
              title="Eliminar turnos duplicados conservando un solo registro por fecha y programa"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Limpiar {duplicateRowsCount} duplicados</span>
            </button>
          )}
          <span>Mostrando {filteredRows.length} de {rows.length} registros</span>
        </div>
      </div>

      {/* The Spreadsheet / Grid matching user Excel sheet */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              {/* Category super-headers */}
              <tr className="bg-cyan-950/60 text-cyan-200 border-b border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                <th colSpan={3} className="py-2.5 px-3 border-r border-zinc-800 text-left bg-zinc-950">
                  Emisión
                </th>
                <th colSpan={2} className="py-2.5 px-2 border-r border-zinc-800">
                  ENPS
                </th>
                <th colSpan={2} className="py-2.5 px-2 border-r border-zinc-800">
                  Sistema Noticias
                </th>
                <th colSpan={2} className="py-2.5 px-2 border-r border-zinc-800">
                  LegalRec
                </th>
                <th colSpan={1} className="py-2.5 px-2 border-r border-zinc-800">
                  MOS
                </th>
                <th colSpan={2} className="py-2.5 px-2 border-r border-zinc-800">
                  ORAD
                </th>
                <th colSpan={1} className="py-2.5 px-2 border-r border-zinc-800">
                  Provys
                </th>
                <th colSpan={1} className="py-2.5 px-2 border-r border-zinc-800">
                  Prompter
                </th>
                <th colSpan={1} className="py-2.5 px-2 border-r border-zinc-800">
                  Zoom
                </th>
                <th colSpan={2} className="py-2.5 px-2 border-r border-zinc-800">
                  Internet
                </th>
                <th colSpan={3} className="py-2.5 px-3 bg-zinc-950 text-right">
                  Control / Acciones
                </th>
              </tr>

              {/* Specific column headers */}
              <tr className="bg-zinc-900/90 text-zinc-300 border-b border-zinc-800 font-medium text-[10px]">
                <th className="py-2 px-3 text-left border-r border-zinc-800 whitespace-nowrap min-w-[130px]">PROGRAMA</th>
                <th className="py-2 px-2 border-r border-zinc-800 whitespace-nowrap min-w-[85px]">FECHA</th>
                <th className="py-2 px-2 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">HORA</th>

                {/* ENPS */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[60px]" title="Servidor Primario">SVR PRIMARIO</th>
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[60px]" title="Servidor Secundario">SVR SECUNDARIO</th>

                {/* SISTEMA NOTICIAS */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[55px]">K2 AIRE</th>
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[55px]">NEXIO</th>

                {/* LEGALREC */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[50px]">RADIO</th>
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[50px]">TV</th>

                {/* MOS */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">SVR PRINCIPAL</th>

                {/* ORAD */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">SRV-HDVG</th>
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">MAESTRO PC</th>

                {/* PROVYS */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[60px]">SVR-BDD</th>

                {/* PROMPTER */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[60px]">PC-CLIENTE</th>

                {/* ZOOM */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[60px]">PC-ZOOM</th>

                {/* INTERNET */}
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">ENLACE PRINCIPAL</th>
                <th className="py-2 px-1 border-r border-zinc-800 whitespace-nowrap min-w-[65px]">ENLACE SECUNDARIO</th>

                {/* META & ACTIONS */}
                <th className="py-2 px-3 text-left border-r border-zinc-800 whitespace-nowrap min-w-[210px]">NOVEDADES / OBSERVACIONES</th>
                <th className="py-2 px-3 text-center border-r border-zinc-800 whitespace-nowrap min-w-[95px]">TECNICO-TURNO</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[80px]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-8 text-center text-zinc-500">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-900/50 transition duration-75 text-zinc-300 font-mono"
                  >
                    <td className="py-2 px-3 text-left font-sans font-medium text-zinc-100 border-r border-zinc-850">
                      {row.programa}
                    </td>
                    <td className="py-2 px-2 border-r border-zinc-850 text-zinc-400 whitespace-nowrap">
                      {row.fecha}
                    </td>
                    <td className="py-2 px-2 border-r border-zinc-850 text-zinc-200 font-semibold whitespace-nowrap">
                      {row.hora}
                    </td>

                    {/* ENPS */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.enpsSvrPrimario, () =>
                        onUpdateCellStatus(row.id, 'enpsSvrPrimario', cycleStatus(row.enpsSvrPrimario))
                      )}
                    </td>
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.enpsSvrSecundario, () =>
                        onUpdateCellStatus(row.id, 'enpsSvrSecundario', cycleStatus(row.enpsSvrSecundario))
                      )}
                    </td>

                    {/* SISTEMA NOTICIAS */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.noticiasK2Aire, () =>
                        onUpdateCellStatus(row.id, 'noticiasK2Aire', cycleStatus(row.noticiasK2Aire))
                      )}
                    </td>
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.noticiasNexio, () =>
                        onUpdateCellStatus(row.id, 'noticiasNexio', cycleStatus(row.noticiasNexio))
                      )}
                    </td>

                    {/* LEGALREC */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.legalrecRadio, () =>
                        onUpdateCellStatus(row.id, 'legalrecRadio', cycleStatus(row.legalrecRadio))
                      )}
                    </td>
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.legalrecTv, () =>
                        onUpdateCellStatus(row.id, 'legalrecTv', cycleStatus(row.legalrecTv))
                      )}
                    </td>

                    {/* MOS */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.mosSvrPrincipal, () =>
                        onUpdateCellStatus(row.id, 'mosSvrPrincipal', cycleStatus(row.mosSvrPrincipal))
                      )}
                    </td>

                    {/* ORAD */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.oradSrvHdvg, () =>
                        onUpdateCellStatus(row.id, 'oradSrvHdvg', cycleStatus(row.oradSrvHdvg))
                      )}
                    </td>
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.oradMaestroPc, () =>
                        onUpdateCellStatus(row.id, 'oradMaestroPc', cycleStatus(row.oradMaestroPc))
                      )}
                    </td>

                    {/* PROVYS */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.provysSvrBdd, () =>
                        onUpdateCellStatus(row.id, 'provysSvrBdd', cycleStatus(row.provysSvrBdd))
                      )}
                    </td>

                    {/* PROMPTER */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.prompterPcCliente, () =>
                        onUpdateCellStatus(row.id, 'prompterPcCliente', cycleStatus(row.prompterPcCliente))
                      )}
                    </td>

                    {/* ZOOM */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.zoomPcZoom, () =>
                        onUpdateCellStatus(row.id, 'zoomPcZoom', cycleStatus(row.zoomPcZoom))
                      )}
                    </td>

                    {/* INTERNET */}
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.internetEnlacePrincipal, () =>
                        onUpdateCellStatus(row.id, 'internetEnlacePrincipal', cycleStatus(row.internetEnlacePrincipal))
                      )}
                    </td>
                    <td className="py-1 px-1 border-r border-zinc-850">
                      {renderStatusBadge(row.internetEnlaceSecundario, () =>
                        onUpdateCellStatus(row.id, 'internetEnlaceSecundario', cycleStatus(row.internetEnlaceSecundario))
                      )}
                    </td>

                    {/* METADATA: NOVEDADES / OBSERVACIONES */}
                    <td className="py-1.5 px-3 text-left font-sans text-xs border-r border-zinc-850">
                      {inlineEditingRowId === row.id ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <input
                            type="text"
                            autoFocus
                            value={inlineObsValue}
                            onChange={(e) => setInlineObsValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineObs(row.id);
                              if (e.key === 'Escape') setInlineEditingRowId(null);
                            }}
                            className="w-full px-2 py-1 bg-zinc-950 border border-cyan-500 rounded text-xs text-white focus:outline-none placeholder-zinc-500"
                            placeholder="Escribe la novedad..."
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineObs(row.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                            title="Guardar novedad (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingRowId(null)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                            title="Cancelar (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 group">
                          <span
                            onClick={() => handleStartInlineEdit(row)}
                            className={`cursor-pointer hover:underline truncate max-w-[240px] block ${
                              row.observaciones === 'sin novedad' ? 'text-zinc-400' : 'text-amber-300 font-semibold'
                            }`}
                            title="Clic para editar novedad rápidamente"
                          >
                            {row.observaciones}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartInlineEdit(row)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                            title="Editar novedad"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* TECNICO-TURNO */}
                    <td className="py-2 px-3 text-center font-sans font-semibold text-zinc-300 border-r border-zinc-850">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
                        {row.tecnicoTurno}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    <td className="py-1 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-300 transition"
                          title="Editar turno completo y novedades"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteRow && (
                          <button
                            type="button"
                            onClick={() => setRowToDelete(row)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-900/60 text-zinc-500 hover:text-red-400 transition"
                            title="Eliminar este turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Novedades Reportadas en Emisión (Solo Novedades) */}
      <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/70 p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Resumen de Novedades Reportadas en Emisión</span>
                <span className="text-xs text-amber-400/90 font-medium">(Solo Novedades)</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Consolidado exclusivo de turnos con novedades técnicas, observaciones o fallas registradas en los 14 subsistemas.
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            checklistNovelties.length > 0
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
          }`}>
            {checklistNovelties.length === 1
              ? '1 turno con novedades'
              : `${checklistNovelties.length} turnos con novedades`}
          </span>
        </div>

        {checklistNovelties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-400 text-[10.5px] font-semibold border-b border-zinc-800 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-[95px]">Fecha</th>
                  <th className="py-2.5 px-2 w-[70px]">Hora</th>
                  <th className="py-2.5 px-3 w-[170px]">Programa / Emisión</th>
                  <th className="py-2.5 px-3 w-[220px]">Subsistemas con Falla / Alerta</th>
                  <th className="py-2.5 px-4">Detalle de la Novedad u Observación</th>
                  <th className="py-2.5 px-3 w-[100px] text-center">Técnico</th>
                  <th className="py-2.5 px-2 w-[55px] text-center">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {checklistNovelties.map((r) => {
                  const issues = getSubsystemIssues(r);
                  return (
                    <tr key={r.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {r.fecha}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] font-semibold text-zinc-200 whitespace-nowrap">
                        {r.hora}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-100">
                        {r.programa}
                      </td>
                      <td className="py-2.5 px-3">
                        {issues.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {issues.map((iss, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  iss.type === 'falla'
                                    ? 'bg-red-950/80 text-red-300 border border-red-800/70'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/70'
                                }`}
                              >
                                {iss.label}: {iss.type.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">Subsistemas OK</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-200">
                        {r.observaciones && isRealNovelty(r.observaciones) ? (
                          <span className="text-amber-200 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50 inline-block font-medium">
                            {r.observaciones}
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic">
                            {issues.length > 0 ? 'Falla detectada en subsistema' : 'Sin novedad'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-zinc-300 whitespace-nowrap">
                        {r.tecnicoTurno}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingRow(r)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 transition"
                          title="Editar novedad y turno"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-3 px-4 rounded-lg bg-zinc-900/50 border border-zinc-850 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-zinc-300">
              <span className="font-semibold text-emerald-300">Sin novedades reportadas:</span>
              <span className="text-zinc-400 ml-1.5">
                Todos los turnos de la lista actual tienen sus subsistemas en estado normal y sus observaciones en "sin novedad".
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal to add new checklist record */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              Nuevo Registro de Transmisión
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Crea un nuevo turno de emisión. Todos los sistemas se inicializarán en estado normal (OK) listos para auditar.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Shortcut to load all 7 daily turns */}
              <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cargar Plantilla Diaria Completa</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Inserta los 7 turnos establecidos del día ({DAILY_BROADCAST_TEMPLATE.map((p) => p.hora).join(', ')})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDailyBatchModal}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap transition shadow"
                  title="Configurar y redactar novedades de los 7 turnos diarios antes de cargarlos"
                >
                  Configurar 7 Turnos
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Programa (Listado de plantilla establecida)
                </label>
                <select
                  value={isCustomProgram ? '__custom__' : formData.programa}
                  onChange={(e) => handleProgramSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                >
                  {DAILY_BROADCAST_TEMPLATE.map((tpl) => (
                    <option key={tpl.programa} value={tpl.programa}>
                      {tpl.programa} ({tpl.hora})
                    </option>
                  ))}
                  <option value="__custom__">+ Otro programa / Emisión extraordinaria...</option>
                </select>

                {isCustomProgram && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customProgramName}
                      onChange={(e) => setCustomProgramName(e.target.value)}
                      placeholder="Escribe el nombre del programa..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-cyan-600/70 rounded-lg text-sm text-white focus:outline-none placeholder-zinc-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Hora de Inicio</label>
                  <select
                    value={isCustomHour ? '__custom__' : formData.hora}
                    onChange={(e) => handleHourSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
                  >
                    {ESTABLISHED_HOURS.map((h) => {
                      const matching = DAILY_BROADCAST_TEMPLATE.find((t) => t.hora === h);
                      return (
                        <option key={h} value={h}>
                          {h} {matching ? `- ${matching.programa}` : ''}
                        </option>
                      );
                    })}
                    <option value="__custom__">+ Otra hora (personalizada)...</option>
                  </select>

                  {isCustomHour && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        value={customHourValue}
                        onChange={(e) => setCustomHourValue(e.target.value)}
                        placeholder="Ej: 06h30, 22h00"
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-cyan-600/70 rounded-lg text-sm text-white focus:outline-none placeholder-zinc-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Analista de Turno</label>
                <select
                  value={formData.tecnicoTurno}
                  onChange={(e) => setFormData({ ...formData, tecnicoTurno: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {checklistAnalysts.map((emp) => (
                    <option key={emp.id} value={emp.tecnicoCode}>
                      {emp.tecnicoCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Observaciones / Novedades</label>
                <input
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="sin novedad o detalle técnico"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Warning when duplicate turn is detected */}
              {isDuplicateSingleTurn && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Turno ya registrado para esta fecha:</span>{' '}
                    Ya existe un turno ingresado para la fecha <strong>{formData.fecha}</strong> con esa emisión o franja horaria. Los turnos diarios de una fecha solo pueden ser ingresados una sola vez.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDuplicateSingleTurn}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600 text-white text-xs font-semibold transition shadow"
                >
                  {isDuplicateSingleTurn ? 'Turno ya registrado' : 'Registrar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheets Sync & Import Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        onImportRows={handleImportSheetsRows}
        employees={employees}
      />

      {/* Monthly Checklist Printable / PDF Report Modal */}
      <ChecklistMonthlyReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        rows={rows}
        employees={checklistAnalysts}
      />

      {/* Modal to insert 7 Daily Turns with custom Novedades / Observaciones */}
      <DailyTurnsBatchModal
        isOpen={isDailyBatchModalOpen}
        onClose={() => setIsDailyBatchModalOpen(false)}
        onConfirm={handleConfirmDailyBatch}
        employees={checklistAnalysts}
        existingRows={rows}
        initialDate={formData.fecha}
      />

      {/* In-app Confirmation Modal to reliably delete a checklist row */}
      {rowToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Turno de Emisión?</h3>
                <p className="text-xs text-zinc-400">Confirmación de borrado permanente</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 mb-4 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Programa:</span>
                <strong className="text-white font-medium">{rowToDelete.programa}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Fecha:</span>
                <span className="text-zinc-200 font-medium">{rowToDelete.fecha}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Hora:</span>
                <span className="font-mono text-cyan-400 font-bold">{rowToDelete.hora}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Técnico:</span>
                <span className="text-zinc-200">{rowToDelete.tecnicoTurno}</span>
              </div>
              {rowToDelete.observaciones && (
                <div className="pt-2 border-t border-zinc-800 text-[11px]">
                  <span className="text-zinc-400">Novedad:</span>{' '}
                  <span className="text-zinc-300 italic">{rowToDelete.observaciones}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 mb-5">
              Esta fila será eliminada del checklist y la actualización se sincronizará automáticamente con tu Google Sheet.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRowToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition border border-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = rowToDelete.id;
                  setRowToDelete(null);
                  if (onDeleteRow) {
                    onDeleteRow(id);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar turno</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to edit existing checklist row, novedades, and systems */}
      <EditChecklistRowModal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        row={editingRow}
        onSave={handleSaveRowModal}
        onDelete={onDeleteRow}
        employees={checklistAnalysts}
      />
    </div>
  );
};
