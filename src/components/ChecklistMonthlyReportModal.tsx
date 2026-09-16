import React, { useState, useMemo } from 'react';
import { BroadcastChecklistRow, Employee } from '../types';
import { 
  Printer, 
  Download, 
  FileText, 
  X, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MinusCircle,
  CheckCheck,
  ShieldCheck,
  ExternalLink,
  Info,
  FileCheck
} from 'lucide-react';
import { generateChecklistPDF } from '../utils/pdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rows: BroadcastChecklistRow[];
  employees: Employee[];
}

export const ChecklistMonthlyReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rows,
  employees,
}) => {
  // Extract all available Year-Month values from data (e.g., '2026-09')
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    rows.forEach((r) => {
      if (r.fecha && r.fecha.length >= 7) {
        monthsSet.add(r.fecha.slice(0, 7));
      }
    });
    // Ensure current month is present
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentYearMonth);
    return Array.from(monthsSet).sort().reverse();
  }, [rows]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0] || '2026-09';
  });
  const [selectedTecnico, setSelectedTecnico] = useState<string>('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const checklistAnalysts = useMemo(() => {
    const matched = employees.filter(
      (emp) => emp.tecnicoCode === 'Fmalla' || emp.tecnicoCode === 'DQuevedo' || emp.cargo.toLowerCase().includes('broadcasting')
    );
    return matched.length > 0 ? matched : employees;
  }, [employees]);

  if (!isOpen) return null;

  const formatMonthName = (yearMonth: string) => {
    if (yearMonth === 'all') return 'Histórico Completo';
    const [year, month] = yearMonth.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx] || month} ${year}`;
  };

  // Filter rows for the report
  const filteredRows = rows.filter((r) => {
    const matchMonth = selectedMonth === 'all' || r.fecha.startsWith(selectedMonth);
    const matchTecnico = selectedTecnico === 'all' || r.tecnicoTurno === selectedTecnico;
    return matchMonth && matchTecnico;
  });

  // Calculate monthly stats
  const totalTurnos = filteredRows.length;
  let totalVerificaciones = 0;
  let totalOk = 0;
  let totalAlertas = 0;
  let totalFallas = 0;

  const systemKeys: (keyof BroadcastChecklistRow)[] = [
    'enpsSvrPrimario', 'enpsSvrSecundario',
    'noticiasK2Aire', 'noticiasNexio',
    'legalrecRadio', 'legalrecTv',
    'mosSvrPrincipal',
    'oradSrvHdvg', 'oradMaestroPc',
    'provysSvrBdd', 'prompterPcCliente', 'zoomPcZoom',
    'internetEnlacePrincipal', 'internetEnlaceSecundario'
  ];

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
    systemKeys.forEach((key) => {
      const val = r[key];
      if (val === 'falla') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'falla' });
      } else if (val === 'alerta') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'alerta' });
      }
    });
    return issues;
  };

  filteredRows.forEach((r) => {
    systemKeys.forEach((key) => {
      totalVerificaciones++;
      const val = r[key];
      if (val === 'ok') totalOk++;
      else if (val === 'alerta') totalAlertas++;
      else if (val === 'falla') totalFallas++;
    });
  });

  const operatividad = totalVerificaciones > 0 
    ? ((totalOk / totalVerificaciones) * 100).toFixed(1) 
    : '100';

  // Rows with observations or subsystem warnings (Only real novelties)
  const rowsWithNovelties = filteredRows.filter((r) => {
    const hasObs = isRealNovelty(r.observaciones);
    const hasSystemIssue = systemKeys.some((k) => r[k] === 'falla' || r[k] === 'alerta');
    return hasObs || hasSystemIssue;
  });

  const handleDownloadPDF = () => {
    try {
      generateChecklistPDF(selectedMonth, rows, employees, selectedTecnico);
      setNotice({
        type: 'success',
        text: '¡PDF Oficial descargado con éxito! Puedes abrirlo para visualizarlo o imprimirlo directamente.',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setNotice({
        type: 'info',
        text: 'Descargando formato alternativo...',
      });
      handleDownloadStandaloneHTML();
    }
  };

  const handlePrint = () => {
    // 1. Always download the official PDF directly as the primary guarantee
    handleDownloadPDF();

    // 2. Try browser native print if supported
    try {
      window.print();
    } catch (err) {
      console.warn('Native window.print() not available or blocked in sandbox:', err);
    }

    if (isIframe) {
      setNotice({
        type: 'info',
        text: 'Se descargó el PDF institucional automáticamente. (Los navegadores bloquean la ventana de impresión directa dentro del visor embebido; para imprimir directo con Ctrl+P abre la app en pestaña nueva con el botón superior).',
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDownloadStandaloneHTML = () => {
    const reportTitle = `Reporte_Mensual_Checklist_${selectedMonth}_COMUNICA_EP`;
    const printableElement = document.getElementById('checklist-printable-area');
    if (!printableElement) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #111; font-size: 11px; }
    h1, h2, h3 { margin: 0; }
    svg { display: inline-block !important; vertical-align: middle !important; }
    @media print {
      @page { size: landscape; margin: 8mm; }
      body { margin: 0; background: #fff !important; }
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</head>
<body class="bg-white text-zinc-900 p-4">
  ${printableElement.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice({
      type: 'success',
      text: 'Archivo HTML autónomo descargado. Se abrirá con el diálogo de impresión listo.',
    });
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="print-modal-card bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Toolbar - Hidden during print */}
        <div className="no-print px-5 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Informe Mensual de Checklist Broadcast
              </h2>
              <p className="text-xs text-zinc-400">
                Genera el documento formal mensual listo para firma institucional, archivo o exportación a PDF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Direct PDF Download */}
            <button
              type="button"
              id="btn-download-checklist-pdf-direct"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-950/50 cursor-pointer"
              title="Descargar directamente el archivo PDF formal diagramado"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF Oficial</span>
            </button>

            {/* Print In Browser */}
            <button
              type="button"
              id="btn-print-checklist-pdf"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs transition cursor-pointer"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir</span>
            </button>

            {/* Standalone HTML */}
            <button
              type="button"
              onClick={handleDownloadStandaloneHTML}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer"
              title="Descargar archivo HTML con auto-impresión"
            >
              <FileCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Descargar HTML</span>
            </button>

            {isIframe && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-xs transition cursor-pointer"
                title="Abrir en pestaña nueva para usar Ctrl+P del navegador sin restricciones de iframe"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva Pestaña</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice feedback banner */}
        {notice && (
          <div className={`no-print px-5 py-2.5 border-b text-xs flex items-center justify-between gap-2 ${
            notice.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
              : 'bg-amber-950/80 border-amber-800 text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{notice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-zinc-400 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Controls - Hidden during print */}
        <div className="no-print px-5 py-3 bg-zinc-950 border-b border-zinc-850 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">Seleccionar Período (Mes):</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthName(ym)} ({ym})
                </option>
              ))}
              <option value="all">Todo el Histórico Acumulado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400" />
            <span>Analista Responsable:</span>
            <select
              value={selectedTecnico}
              onChange={(e) => setSelectedTecnico(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los analistas de turno</option>
              {checklistAnalysts.map((emp) => (
                <option key={emp.id} value={emp.tecnicoCode}>
                  {emp.tecnicoCode}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-zinc-400 text-xs">
            Mostrando <strong>{filteredRows.length}</strong> turnos para este informe
          </div>
        </div>

        {/* Printable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/40">
          <div
            id="checklist-printable-area"
            className="printable-document bg-white text-zinc-900 p-6 sm:p-10 rounded-xl shadow-xl border border-zinc-200 mx-auto max-w-5xl"
            style={{ minHeight: '800px' }}
          >
            {/* Institution Header */}
            <div className="border-b-2 border-zinc-900 pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-zinc-950 text-cyan-400 border border-zinc-800 flex items-center justify-center font-black text-xl tracking-wider shrink-0">
                  EP
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black tracking-wide text-zinc-900 uppercase">
                    EMPRESA PÚBLICA DE COMUNICACIÓN DEL ECUADOR - COMUNICA EP
                  </div>
                  <div className="text-xs font-bold text-zinc-600 tracking-wider uppercase">
                    Coordinación General de Comercialización y Operaciones
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 py-1 bg-zinc-100 border border-zinc-300 rounded text-zinc-800 text-[11px] font-bold uppercase tracking-wider">
                  INFORME MENSUAL
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">
                  Período: <strong className="text-zinc-900">{formatMonthName(selectedMonth)}</strong>
                </div>
              </div>
            </div>

            {/* Document Title & Meta */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h1 className="text-lg font-extrabold text-zinc-950 uppercase tracking-tight">
                  Checklist y Monitoreo de Sistemas de Transmisión
                </h1>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Consolidado mensual de verificación técnica previa a emisión para ENPS, Noticias K2/Nexio, LegalRec, Orad, Provys, Prompter, Zoom y Enlaces de Datos.
                </p>
              </div>
              <div className="text-xs text-zinc-600 text-left sm:text-right">
                <div>Fecha de Emisión: <strong>{new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div>Filtro Técnico: <strong>{selectedTecnico === 'all' ? 'Personal Completo' : selectedTecnico}</strong></div>
              </div>
            </div>

            {/* Summary KPI Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="border border-zinc-300 p-3 rounded-lg bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Turnos Auditados</div>
                <div className="text-xl font-extrabold text-zinc-900 mt-1">{totalTurnos}</div>
                <div className="text-[10px] text-zinc-500">Emisiones programadas</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-emerald-50/60 border-emerald-300">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Tasa de Operatividad</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">{operatividad}%</div>
                <div className="text-[10px] text-emerald-700 font-medium">{totalOk} verificaciones OK</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-amber-50/60 border-amber-300">
                <div className="text-[10px] uppercase font-bold text-amber-800">Alertas Preventivas</div>
                <div className="text-xl font-extrabold text-amber-700 mt-1">{totalAlertas}</div>
                <div className="text-[10px] text-amber-700">Sub-sistemas en alerta</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-red-50/60 border-red-300">
                <div className="text-[10px] uppercase font-bold text-red-800">Fallas Críticas</div>
                <div className="text-xl font-extrabold text-red-700 mt-1">{totalFallas}</div>
                <div className="text-[10px] text-red-700">Intervenciones inmediatas</div>
              </div>
            </div>

            {/* Convenciones / Leyenda de Estados matching user image */}
            <div className="mb-4 px-3.5 py-2.5 bg-zinc-950 text-white rounded-lg border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Convención de Estados:
              </span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 size={14} className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Normal / OK</span>
                </span>
                <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <XCircle size={14} className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Falla Crítica</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <AlertTriangle size={14} className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Observación / Alerta</span>
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                  <MinusCircle size={14} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>No Aplica</span>
                </span>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-zinc-300 text-[10px] text-zinc-800">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900">
                    <th className="border border-zinc-300 px-2 py-1.5 text-left font-bold">Programa</th>
                    <th className="border border-zinc-300 px-1.5 py-1.5 font-bold">Fecha</th>
                    <th className="border border-zinc-300 px-1.5 py-1.5 font-bold">Hora</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="ENPS Primario">ENPS 1</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="ENPS Secundario">ENPS 2</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="K2 Aire">K2</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Nexio">Nexio</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Legalrec Radio">L.Radio</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Legalrec TV">L.TV</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="MOS Server">MOS</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Orad HDVG">HDVG</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Orad Maestro">Maestro</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Provys BDD">Provys</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Prompter Cliente">Prompt</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Zoom PC">Zoom</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Internet Primario">Net 1</th>
                    <th className="border border-zinc-300 px-1 py-1.5 font-bold" title="Internet Secundario">Net 2</th>
                    <th className="border border-zinc-300 px-2 py-1.5 text-left font-bold">Observaciones</th>
                    <th className="border border-zinc-300 px-1.5 py-1.5 font-bold">Téc.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={19} className="border border-zinc-300 py-6 text-center text-zinc-500 font-medium">
                        No se registraron turnos en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, idx) => (
                      <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/80'}>
                        <td className="border border-zinc-300 px-2 py-1 font-semibold text-zinc-950 text-left">
                          {r.programa}
                        </td>
                        <td className="border border-zinc-300 px-1 py-1 whitespace-nowrap text-center text-zinc-700">
                          {r.fecha}
                        </td>
                        <td className="border border-zinc-300 px-1 py-1 font-mono text-center text-zinc-800">
                          {r.hora}
                        </td>
                        {systemKeys.map((key) => {
                          const status = r[key];
                          return (
                            <td
                              key={key}
                              className={`border border-zinc-300 p-1 text-center align-middle ${
                                status === 'ok'
                                  ? 'bg-emerald-50/50'
                                  : status === 'falla'
                                  ? 'bg-red-100'
                                  : status === 'alerta'
                                  ? 'bg-amber-100'
                                  : 'bg-zinc-50/50'
                              }`}
                              title={
                                status === 'ok'
                                  ? 'Normal / OK'
                                  : status === 'falla'
                                  ? 'Falla Crítica'
                                  : status === 'alerta'
                                  ? 'Observación / Alerta'
                                  : 'No Aplica'
                              }
                            >
                              <div className="flex items-center justify-center">
                                {status === 'ok' ? (
                                  <CheckCircle2 size={13} className="w-3.5 h-3.5 text-emerald-600" />
                                ) : status === 'falla' ? (
                                  <XCircle size={13} className="w-3.5 h-3.5 text-red-600" />
                                ) : status === 'alerta' ? (
                                  <AlertTriangle size={13} className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <MinusCircle size={13} className="w-3.5 h-3.5 text-zinc-400" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="border border-zinc-300 px-2 py-1 text-left text-zinc-700 max-w-[150px] truncate">
                          {r.observaciones || 'sin novedad'}
                        </td>
                        <td className="border border-zinc-300 px-1.5 py-1 text-center font-semibold text-zinc-900 whitespace-nowrap">
                          {r.tecnicoTurno}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen de Novedades Reportadas (Solo Novedades) Section */}
            <div className="mb-8 border border-zinc-300 rounded-xl p-4 bg-zinc-50 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-250 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Resumen de Novedades Reportadas en la Transmisión (Solo Novedades)
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  rowsWithNovelties.length > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {rowsWithNovelties.length === 1 
                    ? '1 novedad reportada' 
                    : `${rowsWithNovelties.length} novedades reportadas`}
                </span>
              </div>

              {rowsWithNovelties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse bg-white rounded-lg overflow-hidden border border-zinc-300">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300 text-left">
                        <th className="py-2 px-2.5 w-[85px] border-r border-zinc-300 text-center">FECHA</th>
                        <th className="py-2 px-2 w-[60px] border-r border-zinc-300 text-center">HORA</th>
                        <th className="py-2 px-2.5 w-[140px] border-r border-zinc-300">PROGRAMA / EMISIÓN</th>
                        <th className="py-2 px-2.5 w-[170px] border-r border-zinc-300">SUBSISTEMAS CON FALLA / ALERTA</th>
                        <th className="py-2 px-3 border-r border-zinc-300">DETALLE DE LA NOVEDAD U OBSERVACIÓN</th>
                        <th className="py-2 px-2 w-[85px] text-center">TÉCNICO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-250 text-zinc-800">
                      {rowsWithNovelties.map((r, idx) => {
                        const issues = getSubsystemIssues(r);
                        return (
                          <tr key={r.id || idx} className="hover:bg-amber-50/50 transition">
                            <td className="py-2 px-2.5 font-mono text-[10px] text-center border-r border-zinc-200 text-zinc-700">
                              {r.fecha}
                            </td>
                            <td className="py-2 px-2 font-mono text-[10px] font-semibold text-center border-r border-zinc-200 text-zinc-800">
                              {r.hora}
                            </td>
                            <td className="py-2 px-2.5 font-semibold text-zinc-900 border-r border-zinc-200">
                              {r.programa}
                            </td>
                            <td className="py-2 px-2.5 border-r border-zinc-200">
                              {issues.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {issues.map((iss, i) => (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        iss.type === 'falla'
                                          ? 'bg-red-100 text-red-800 border border-red-300'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}
                                    >
                                      {iss.label}: {iss.type.toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-zinc-400 italic text-[10px]">Subsistemas OK</span>
                              )}
                            </td>
                            <td className="py-2 px-3 border-r border-zinc-200 text-zinc-900">
                              {r.observaciones && isRealNovelty(r.observaciones) ? (
                                <span className="font-medium text-amber-950 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200">
                                  {r.observaciones}
                                </span>
                              ) : (
                                <span className="text-zinc-500 italic">
                                  {issues.length > 0 ? 'Falla detectada en subsistema' : 'Sin novedad'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-zinc-900 whitespace-nowrap">
                              {r.tecnicoTurno}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-3 px-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold">Sin novedades técnicas registradas en este periodo.</span>
                    <span className="text-emerald-800 ml-1">
                      Todas las emisiones y los 14 subsistemas operaron con total normalidad, sin fallas ni alertas reportadas.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Institutional Signatures Section */}
            <div className="pt-8 border-t border-zinc-300 mt-8">
              <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-8 text-center">
                CONSTANCIA Y FIRMAS DE RESPONSABILIDAD TÉCNICA
              </div>
              <div className="grid grid-cols-2 gap-12 max-w-2xl mx-auto text-center signatures">
                <div>
                  <div className="h-14 border-b border-zinc-400 mb-2"></div>
                  <div className="font-bold text-xs text-zinc-900">
                    Ing. Freddy Malla
                  </div>
                  <div className="text-[10px] text-zinc-600 font-medium">
                    Analista de Sistemas y Multimedia Broadcasting 2
                  </div>
                  <div className="text-[9px] text-zinc-500 font-medium">COMUNICA EP</div>
                </div>

                <div>
                  <div className="h-14 border-b border-zinc-400 mb-2"></div>
                  <div className="font-bold text-xs text-zinc-900">
                    Ing. Darwin Quevedo, Msc
                  </div>
                  <div className="text-[10px] text-zinc-600 font-medium">
                    Analista de Sistemas y Multimedia Broadcasting 2
                  </div>
                  <div className="text-[9px] text-zinc-600 font-semibold">Jefe de Operaciones Encargado</div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="text-[9px] text-zinc-400 text-center mt-8 border-t border-zinc-200 pt-3">
              Documento oficial generado por el Sistema Unificado de Operaciones y Broadcasting • COMUNICA EP • Registro Institucional
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
