import React, { useState, useMemo } from 'react';
import { IncidentTicket, Employee, IncidentPriority, IncidentStatus } from '../types';
import { 
  Printer, 
  Download, 
  X, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  FileText,
  Building2,
  ExternalLink,
  Info,
  FileCheck
} from 'lucide-react';
import { generateIncidentsPDF } from '../utils/pdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentTicket[];
  employees: Employee[];
}

export const IncidentsMonthlyReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  incidents,
  employees,
}) => {
  // Extract unique months from incidents
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    incidents.forEach((inc) => {
      const dateStr = inc.fechaReporte || (inc as any).fechaCreacion;
      if (dateStr && dateStr.length >= 7) {
        monthsSet.add(dateStr.slice(0, 7));
      }
    });
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentYearMonth);
    return Array.from(monthsSet).sort().reverse();
  }, [incidents]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0] || '2026-09';
  });
  const [selectedTecnico, setSelectedTecnico] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen) return null;

  const formatMonthName = (yearMonth: string) => {
    if (yearMonth === 'all') return 'Histórico Total';
    const [year, month] = yearMonth.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx] || month} ${year}`;
  };

  const filteredIncidents = incidents.filter((inc) => {
    const dateStr = inc.fechaReporte || (inc as any).fechaCreacion || '';
    const matchMonth = selectedMonth === 'all' || dateStr.startsWith(selectedMonth);
    const matchTecnico = selectedTecnico === 'all' || inc.tecnicoAsignado === selectedTecnico;
    const matchStatus = statusFilter === 'all' 
      || (statusFilter === 'resuelto' && (inc.estado === 'resuelto' || inc.estado === 'cerrado'))
      || (statusFilter === 'cerrado' && inc.estado === 'cerrado')
      || inc.estado === statusFilter;
    const matchPriority = priorityFilter === 'all' || inc.prioridad === priorityFilter;
    return matchMonth && matchTecnico && matchStatus && matchPriority;
  });

  // Calculate monthly stats
  const total = filteredIncidents.length;
  const resueltos = filteredIncidents.filter((i) => i.estado === 'resuelto' || i.estado === 'cerrado').length;
  const abiertos = filteredIncidents.filter((i) => i.estado === 'abierto').length;
  const enProceso = filteredIncidents.filter((i) => i.estado === 'en_progreso').length;
  const criticos = filteredIncidents.filter((i) => i.prioridad === 'critica' || i.prioridad === 'alta').length;

  const tasaResolucion = total > 0 ? ((resueltos / total) * 100).toFixed(1) : '100';

  const handleDownloadPDF = () => {
    try {
      generateIncidentsPDF(selectedMonth, incidents, selectedTecnico, statusFilter, priorityFilter);
      setNotice({
        type: 'success',
        text: '¡Informe PDF de Incidencias descargado con éxito! Listo para firma institucional.',
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
    // 1. Always download the official PDF immediately
    handleDownloadPDF();

    // 2. Trigger print dialog cleanly using a hidden iframe to bypass modal restrictions if possible
    try {
      const printableElement = document.getElementById('incidents-printable-area');
      if (printableElement) {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
        if (frameDoc) {
          frameDoc.write(`
            <!DOCTYPE html>
            <html lang="es">
              <head>
                <meta charset="UTF-8">
                <title>Informe Mensual de Incidencias - COMUNICA EP</title>
                <style>
                  @page { size: landscape; margin: 8mm; }
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; margin: 10px; font-size: 11px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
                  th, td { border: 1px solid #999; padding: 5px 6px; text-align: left; }
                  th { background: #e2e8f0; font-weight: bold; }
                  .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; max-width: 650px; margin: 35px auto 0; text-align: center; }
                  .sig-line { border-top: 1px solid #000; padding-top: 6px; font-size: 10px; font-weight: bold; }
                </style>
              </head>
              <body>
                ${printableElement.innerHTML}
              </body>
            </html>
          `);
          frameDoc.close();
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
            } catch {
              window.print();
            }
            setTimeout(() => {
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
            }, 5000);
          }, 350);
        } else {
          window.print();
        }
      } else {
        window.print();
      }
    } catch {
      window.print();
    }

    if (isIframe) {
      setNotice({
        type: 'info',
        text: 'Se descargó el PDF oficial de incidencias de inmediato. (Dentro de un visor embebido, los navegadores restringen la ventana emergente de impresión nativa; también puedes abrir la app en nueva pestaña con el botón superior).',
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDownloadStandaloneHTML = () => {
    const reportTitle = `Informe_Mensual_Incidencias_${selectedMonth}_COMUNICA_EP`;
    const printableElement = document.getElementById('incidents-printable-area');
    if (!printableElement) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #111; font-size: 11px; }
    h1, h2, h3 { margin: 0; }
    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi-card { border: 1px solid #ccc; padding: 8px; border-radius: 4px; background: #f9f9f9; }
    .kpi-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
    th { background: #e5e7eb; font-weight: bold; }
    .center { text-align: center; }
    .resuelto { color: #047857; font-weight: bold; }
    .abierto { color: #b91c1c; font-weight: bold; }
    .progreso { color: #b45309; font-weight: bold; }
    .critica { background: #fee2e2; color: #991b1b; font-weight: bold; }
    .alta { background: #ffedd5; color: #9a3412; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 40px; }
    .sig-line { border-top: 1px solid #000; padding-top: 6px; text-align: center; font-size: 10px; }
    @media print {
      @page { size: landscape; margin: 8mm; }
      body { margin: 0; }
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</head>
<body>
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
      text: 'Archivo HTML autónomo descargado.',
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
                Informe Mensual de Incidencias (Mesa de Servicio)
              </h2>
              <p className="text-xs text-zinc-400">
                Documento mensual formal de tickets atendidos, tiempo de respuesta y resoluciones técnicas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Download PDF */}
            <button
              type="button"
              id="btn-download-incidents-pdf-direct"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-950/50 cursor-pointer"
              title="Descargar directamente el archivo PDF formal diagramado"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF Oficial</span>
            </button>

            {/* Print in browser */}
            <button
              type="button"
              id="btn-print-incidents-pdf"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs transition cursor-pointer"
              title="Imprimir reporte o Guardar en PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir</span>
            </button>

            {/* Standalone HTML */}
            <button
              type="button"
              onClick={handleDownloadStandaloneHTML}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer"
              title="Descargar archivo HTML autónomo imprimible"
            >
              <FileCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Descargar HTML</span>
            </button>

            {isIframe && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-xs transition cursor-pointer"
                title="Abrir en pestaña nueva para usar Ctrl+P directamente"
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
            <span className="font-semibold text-white">Período Mensual:</span>
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
            <span>Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="resuelto">Resueltos y Cerrados</option>
              <option value="cerrado">Solo Cerrados</option>
              <option value="abierto">Abiertos (Pendientes)</option>
              <option value="en_progreso">En Progreso / Diagnóstico</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Prioridad:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Técnico:</span>
            <select
              value={selectedTecnico}
              onChange={(e) => setSelectedTecnico(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los técnicos</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.tecnicoCode}>
                  {emp.tecnicoCode} - {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-zinc-400 text-xs">
            Mostrando <strong>{filteredIncidents.length}</strong> incidentes en este informe
          </div>
        </div>

        {/* Printable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/40">
          <div
            id="incidents-printable-area"
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
                  <div className="text-xs font-bold text-zinc-600 tracking-wider">
                    COORDINACIÓN GENERAL DE COMERCIALIZACIÓN Y OPERACIONES • MESA DE SERVICIOS
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 py-1 bg-zinc-100 border border-zinc-300 rounded text-zinc-800 text-[11px] font-bold uppercase tracking-wider">
                  INFORME MENSUAL DE MESA DE SERVICIO
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
                  Registro Consolidado de Incidencias Técnicas
                </h1>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Reporte oficial de fallas técnicas reportadas en salas de control, máster de emisión, sistemas de red y servidores de noticias.
                </p>
              </div>
              <div className="text-xs text-zinc-600 text-left sm:text-right">
                <div>Fecha de Emisión: <strong>{new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div>Total Casos Auditados: <strong>{total} tickets</strong></div>
              </div>
            </div>

            {/* Summary KPI Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="border border-zinc-300 p-3 rounded-lg bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Total Incidentes</div>
                <div className="text-xl font-extrabold text-zinc-900 mt-1">{total}</div>
                <div className="text-[10px] text-zinc-500">Tickets en el período</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-emerald-50/60 border-emerald-300">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Casos Solventados</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">{resueltos}</div>
                <div className="text-[10px] text-emerald-700 font-medium">Efectividad: {tasaResolucion}%</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-amber-50/60 border-amber-300">
                <div className="text-[10px] uppercase font-bold text-amber-800">En Diagnóstico</div>
                <div className="text-xl font-extrabold text-amber-700 mt-1">{enProceso}</div>
                <div className="text-[10px] text-amber-700">En tratamiento técnico</div>
              </div>

              <div className="border border-zinc-300 p-3 rounded-lg bg-red-50/60 border-red-300">
                <div className="text-[10px] uppercase font-bold text-red-800">Prioridad Alta / Crítica</div>
                <div className="text-xl font-extrabold text-red-700 mt-1">{criticos}</div>
                <div className="text-[10px] text-red-700">Afectación directa a emisión</div>
              </div>
            </div>

            {/* Detailed Incident Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-zinc-300 text-[10px] text-zinc-800">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900">
                    <th className="border border-zinc-300 px-2 py-1.5 text-center font-bold w-20">Código</th>
                    <th className="border border-zinc-300 px-2 py-1.5 font-bold text-center w-20">Fecha</th>
                    <th className="border border-zinc-300 px-2 py-1.5 font-bold text-left w-24">Sistema</th>
                    <th className="border border-zinc-300 px-2 py-1.5 font-bold text-left">Título y Descripción</th>
                    <th className="border border-zinc-300 px-1.5 py-1.5 font-bold text-center w-16">Prioridad</th>
                    <th className="border border-zinc-300 px-1.5 py-1.5 font-bold text-center w-16">Estado</th>
                    <th className="border border-zinc-300 px-2 py-1.5 font-bold text-center w-20">Técnico</th>
                    <th className="border border-zinc-300 px-2 py-1.5 font-bold text-left">Solución Aplicada</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-zinc-300 py-8 text-center text-zinc-500 font-medium">
                        No se registraron incidentes en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc, idx) => (
                      <tr key={inc.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/80'}>
                        <td className="border border-zinc-300 px-2 py-1.5 font-mono font-bold text-zinc-900 text-center whitespace-nowrap">
                          {inc.codigo}
                        </td>
                        <td className="border border-zinc-300 px-2 py-1.5 text-center text-zinc-700 whitespace-nowrap">
                          <div>{inc.fechaReporte}</div>
                          <div className="text-[9px] text-zinc-400">{inc.horaReporte}</div>
                        </td>
                        <td className="border border-zinc-300 px-2 py-1.5 font-semibold text-zinc-800">
                          {inc.categoria}
                        </td>
                        <td className="border border-zinc-300 px-2 py-1.5 text-left">
                          <div className="font-bold text-zinc-950">{inc.titulo}</div>
                          <div className="text-[9.5px] text-zinc-600 mt-0.5 leading-tight">{inc.descripcion}</div>
                        </td>
                        <td className="border border-zinc-300 px-1.5 py-1.5 text-center font-bold uppercase whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            inc.prioridad === 'critica'
                              ? 'bg-red-100 text-red-800 font-black'
                              : inc.prioridad === 'alta'
                              ? 'bg-amber-100 text-amber-800'
                              : inc.prioridad === 'media'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {inc.prioridad}
                          </span>
                        </td>
                        <td className="border border-zinc-300 px-1.5 py-1.5 text-center font-bold whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            inc.estado === 'cerrado'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                              : inc.estado === 'resuelto'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.estado === 'en_progreso'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {inc.estado === 'cerrado' 
                              ? 'Cerrado' 
                              : inc.estado === 'resuelto' 
                              ? 'Resuelto' 
                              : inc.estado === 'en_progreso' 
                              ? 'En Curso' 
                              : 'Abierto'}
                          </span>
                        </td>
                        <td className="border border-zinc-300 px-2 py-1.5 text-center font-medium text-zinc-900 whitespace-nowrap">
                          {inc.tecnicoAsignado || 'Sin Asignar'}
                        </td>
                        <td className="border border-zinc-300 px-2 py-1.5 text-left text-zinc-700 text-[9.5px]">
                          {inc.solucionAplicada ? (
                            <span className="text-zinc-800">{inc.solucionAplicada}</span>
                          ) : (
                            <span className="italic text-zinc-400">Pendiente de resolución técnica</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Institutional Signatures Section */}
            <div className="pt-8 border-t border-zinc-300 mt-8">
              <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-8 text-center">
                CONSTANCIA Y FIRMAS DE CONFORMIDAD TÉCNICA
              </div>
              <div className="grid grid-cols-2 gap-12 max-w-2xl mx-auto text-center signatures">
                <div>
                  <div className="h-14 border-b border-zinc-400 mb-2"></div>
                  <div className="font-bold text-xs text-zinc-900">
                    Ing. Freddy Malla, Msc
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Analista de Sistemas y Multimedia Broadcasting 2
                  </div>
                  <div className="text-[9px] text-zinc-400">COMUNICA EP</div>
                </div>

                <div>
                  <div className="h-14 border-b border-zinc-400 mb-2"></div>
                  <div className="font-bold text-xs text-zinc-900">
                    Ing. Darwin Quevedo, Msc
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Jefe de Operaciones Encargado
                  </div>
                  <div className="text-[9px] text-zinc-400">COMUNICA EP</div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="text-[9px] text-zinc-400 text-center mt-8 border-t border-zinc-200 pt-3">
              Mesa de Servicio Técnico • Sistema Unificado de Operaciones • COMUNICA EP Ecuador
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
