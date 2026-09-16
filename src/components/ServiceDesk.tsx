import React, { useState, useMemo } from 'react';
import { IncidentTicket, IncidentPriority, IncidentStatus, Employee } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  MessageSquare, 
  User, 
  Tag, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  History,
  Printer,
  FileText,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  X,
  Download
} from 'lucide-react';
import { IncidentsMonthlyReportModal } from './IncidentsMonthlyReportModal';
import { generateIncidentsPDF } from '../utils/pdfGenerator';

interface Props {
  incidents: IncidentTicket[];
  employees: Employee[];
  onAddIncident: (ticket: Omit<IncidentTicket, 'id' | 'codigo'>) => void;
  onUpdateIncidentStatus: (id: string, newStatus: IncidentStatus, solucion?: string) => void;
  onUpdateIncident?: (ticket: IncidentTicket) => void;
  onDeleteIncident?: (id: string) => void;
  onAddEmployee?: (newEmpData: Omit<Employee, 'id' | 'saldoHoras'>) => Employee;
  onDeleteEmployee?: (id: string) => void;
}

export const ServiceDesk: React.FC<Props> = ({
  incidents,
  employees,
  onAddIncident,
  onUpdateIncidentStatus,
  onUpdateIncident,
  onDeleteIncident,
  onAddEmployee,
  onDeleteEmployee,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTecnico, setFilterTecnico] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDownloadingDirectPDF, setIsDownloadingDirectPDF] = useState(false);
  const [techToastMessage, setTechToastMessage] = useState<string | null>(null);

  // Technician management modals
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [isManageTechModalOpen, setIsManageTechModalOpen] = useState(false);
  const [newTechForm, setNewTechForm] = useState({
    nombre: '',
    tecnicoCode: '',
    cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
    email: '',
  });
  const [techFormError, setTechFormError] = useState<string | null>(null);
  
  // New ticket modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'ENPS' as IncidentTicket['categoria'],
    prioridad: 'media' as IncidentPriority,
    tecnicoAsignado: employees[0]?.tecnicoCode || 'DQuevedo',
    reportadoPor: 'Control Técnico / Cabina',
  });

  // Resolve modal
  const [resolvingTicket, setResolvingTicket] = useState<IncidentTicket | null>(null);
  const [solucionText, setSolucionText] = useState('');

  // Edit ticket modal
  const [editingTicket, setEditingTicket] = useState<IncidentTicket | null>(null);
  const [editFormData, setEditFormData] = useState<{
    titulo: string;
    descripcion: string;
    categoria: IncidentTicket['categoria'];
    prioridad: IncidentPriority;
    estado: IncidentStatus;
    tecnicoAsignado: string;
    reportadoPor: string;
    fechaReporte: string;
    horaReporte: string;
    solucionAplicada: string;
  }>({
    titulo: '',
    descripcion: '',
    categoria: 'General',
    prioridad: 'media',
    estado: 'abierto',
    tecnicoAsignado: '',
    reportadoPor: '',
    fechaReporte: '',
    horaReporte: '',
    solucionAplicada: '',
  });

  // Delete ticket confirmation modal
  const [deletingTicket, setDeletingTicket] = useState<IncidentTicket | null>(null);

  const stats = useMemo(() => {
    const total = incidents.length;
    const abiertos = incidents.filter((i) => i.estado === 'abierto').length;
    const enProgreso = incidents.filter((i) => i.estado === 'en_progreso').length;
    const resueltos = incidents.filter((i) => i.estado === 'resuelto' || i.estado === 'cerrado').length;
    const criticos = incidents.filter((i) => i.prioridad === 'critica' && i.estado !== 'resuelto' && i.estado !== 'cerrado').length;
    return { total, abiertos, enProgreso, resueltos, criticos };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchStatus = filterStatus === 'all' || inc.estado === filterStatus;
      const matchPriority = filterPriority === 'all' || inc.prioridad === filterPriority;
      const matchTecnico = filterTecnico === 'all' || inc.tecnicoAsignado === filterTecnico;
      const matchSearch = searchTerm === '' ||
        inc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.tecnicoAsignado.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchPriority && matchTecnico && matchSearch;
    });
  }, [incidents, filterStatus, filterPriority, filterTecnico, searchTerm]);

  const handleSaveNewTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    setTechFormError(null);

    const nombreClean = newTechForm.nombre.trim();
    if (!nombreClean) {
      setTechFormError('El nombre del técnico es obligatorio.');
      return;
    }

    // Auto-generate code if empty
    let code = newTechForm.tecnicoCode.trim();
    if (!code) {
      const parts = nombreClean.split(/\s+/);
      if (parts.length >= 2) {
        code = parts[0][0].toUpperCase() + parts[parts.length - 1];
      } else {
        code = parts[0];
      }
    }

    // Check if code already exists
    if (employees.some((emp) => emp.tecnicoCode.toLowerCase() === code.toLowerCase())) {
      setTechFormError(`Ya existe un técnico con el código "${code}". Por favor especifica otro.`);
      return;
    }

    const email = newTechForm.email.trim() || `${code.toLowerCase()}@comunica.ec`;
    const cargo = newTechForm.cargo.trim() || 'Analista de Sistemas y Multimedia Broadcasting 2';

    if (onAddEmployee) {
      onAddEmployee({
        nombre: nombreClean,
        tecnicoCode: code,
        cargo,
        email,
      });
    }

    // Auto-select in the new ticket form
    setFormData((prev) => ({ ...prev, tecnicoAsignado: code }));

    // Reset and close
    setNewTechForm({
      nombre: '',
      tecnicoCode: '',
      cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
      email: '',
    });
    setIsAddTechModalOpen(false);

    setTechToastMessage(`¡Técnico ${code} (${nombreClean}) agregado exitosamente a la Mesa de Servicios!`);
    setTimeout(() => setTechToastMessage(null), 4500);
  };

  const handleQuickDownloadPDF = () => {
    try {
      setIsDownloadingDirectPDF(true);
      generateIncidentsPDF('all', incidents, 'all');
      setTechToastMessage('¡PDF institucional de incidencias generado y descargado con éxito!');
      setTimeout(() => setTechToastMessage(null), 4500);
    } catch (err) {
      console.error('Error generating quick PDF:', err);
    } finally {
      setIsDownloadingDirectPDF(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;

    const now = new Date();
    onAddIncident({
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      prioridad: formData.prioridad,
      estado: 'abierto',
      tecnicoAsignado: formData.tecnicoAsignado,
      reportadoPor: formData.reportadoPor,
      fechaReporte: now.toISOString().split('T')[0],
      horaReporte: now.toTimeString().slice(0, 5),
    });

    setFormData({
      titulo: '',
      descripcion: '',
      categoria: 'ENPS',
      prioridad: 'media',
      tecnicoAsignado: employees[0]?.tecnicoCode || 'DQuevedo',
      reportadoPor: 'Control Técnico / Cabina',
    });
    setIsNewModalOpen(false);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    onUpdateIncidentStatus(resolvingTicket.id, 'resuelto', solucionText.trim() || 'Incidencia solucionada por el técnico asignado.');
    setResolvingTicket(null);
    setSolucionText('');
  };

  const handleOpenEditModal = (ticket: IncidentTicket) => {
    setEditingTicket(ticket);
    setEditFormData({
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      categoria: ticket.categoria,
      prioridad: ticket.prioridad,
      estado: ticket.estado,
      tecnicoAsignado: ticket.tecnicoAsignado,
      reportadoPor: ticket.reportadoPor,
      fechaReporte: ticket.fechaReporte,
      horaReporte: ticket.horaReporte,
      solucionAplicada: ticket.solucionAplicada || '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket || !editFormData.titulo.trim()) return;

    const updated: IncidentTicket = {
      ...editingTicket,
      titulo: editFormData.titulo.trim(),
      descripcion: editFormData.descripcion.trim(),
      categoria: editFormData.categoria,
      prioridad: editFormData.prioridad,
      estado: editFormData.estado,
      tecnicoAsignado: editFormData.tecnicoAsignado,
      reportadoPor: editFormData.reportadoPor.trim(),
      fechaReporte: editFormData.fechaReporte,
      horaReporte: editFormData.horaReporte,
    };

    if (editFormData.estado === 'resuelto' || editFormData.estado === 'cerrado') {
      if (editFormData.solucionAplicada.trim()) {
        updated.solucionAplicada = editFormData.solucionAplicada.trim();
        if (!updated.fechaSolucion) {
          updated.fechaSolucion = new Date().toISOString().replace('T', ' ').slice(0, 16);
        }
      }
    } else {
      if (!editFormData.solucionAplicada.trim()) {
        delete updated.solucionAplicada;
        delete updated.fechaSolucion;
      } else {
        updated.solucionAplicada = editFormData.solucionAplicada.trim();
      }
    }

    if (onUpdateIncident) {
      onUpdateIncident(updated);
    } else {
      onUpdateIncidentStatus(updated.id, updated.estado, updated.solucionAplicada);
    }

    setEditingTicket(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTicket) return;
    if (onDeleteIncident) {
      onDeleteIncident(deletingTicket.id);
    }
    setDeletingTicket(null);
  };

  const getPriorityBadge = (priority: IncidentPriority) => {
    switch (priority) {
      case 'critica':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800 uppercase">Crítica</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800 uppercase">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/80 text-blue-400 border border-blue-800">Media</span>;
      case 'baja':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">Baja</span>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'abierto':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>Abierto</span>;
      case 'en_progreso':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5"><Clock className="w-3 h-3" /> En progreso</span>;
      case 'resuelto':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Resuelto</span>;
      case 'cerrado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Cerrado</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Incidentes Abiertos</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.abiertos}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Requieren atención técnica</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>En Tratamiento</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{stats.enProgreso}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Con técnico asignado en labores</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Resueltos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.resueltos}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Solventados satisfactoriamente</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Alta / Crítica</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.criticos}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Impactan emisión o continuidad</p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por código, descripción o sistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="en_progreso">En progreso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <select
            value={filterTecnico}
            onChange={(e) => setFilterTecnico(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
            title="Filtrar por técnico asignado"
          >
            <option value="all">Todos los técnicos ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.tecnicoCode}>
                {emp.tecnicoCode} ({emp.nombre.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsManageTechModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition shrink-0 shadow-sm"
            title="Administrar técnicos asignados (DQuevedo, Fmalla y agregar nuevos)"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Técnicos ({employees.length})</span>
          </button>

          <button
            id="btn-print-incidents-monthly"
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-cyan-800/80 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 text-xs font-semibold transition shrink-0 shadow-sm"
            title="Abrir vista de impresión y generación oficial del informe mensual en PDF"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimir / PDF Mensual</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDownloadPDF}
            disabled={isDownloadingDirectPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-semibold transition shrink-0 shadow-sm"
            title="Descargar de inmediato el PDF institucional con todas las incidencias y firmas"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isDownloadingDirectPDF ? 'Generando...' : 'Descargar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Reportar Incidencia</span>
          </button>
        </div>
      </div>

      {/* Floating alert/toast for technician actions */}
      {techToastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-100 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{techToastMessage}</span>
          </div>
          <button
            onClick={() => setTechToastMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-500 text-sm">
            No se encontraron tickets con los criterios de búsqueda actuales.
          </div>
        ) : (
          filteredIncidents.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-zinc-950 border border-zinc-850 hover:border-zinc-750 p-4 sm:p-5 rounded-xl transition duration-150 shadow-md flex flex-col md:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {ticket.codigo}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
                    {ticket.categoria}
                  </span>
                  {getPriorityBadge(ticket.prioridad)}
                  {getStatusBadge(ticket.estado)}
                  <span className="text-xs text-zinc-500 ml-auto md:ml-2">
                    {ticket.fechaReporte} a las {ticket.horaReporte}
                  </span>
                </div>

                <h4 className="text-base font-semibold text-white">
                  {ticket.titulo}
                </h4>

                <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                  {ticket.descripcion}
                </p>

                {ticket.solucionAplicada && (
                  <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-xs text-emerald-200">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Solución aplicada:
                    </div>
                    <p className="text-zinc-300">{ticket.solucionAplicada}</p>
                    {ticket.fechaSolucion && (
                      <p className="text-[10px] text-emerald-500/80 mt-1">
                        Resuelto en: {ticket.fechaSolucion}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    Asignado a: <strong className="text-zinc-200">{ticket.tecnicoAsignado}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    Reportado por: <span className="text-zinc-300">{ticket.reportadoPor}</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-end md:items-end gap-2 shrink-0 self-end md:self-start">
                {ticket.estado === 'abierto' && (
                  <button
                    type="button"
                    onClick={() => onUpdateIncidentStatus(ticket.id, 'en_progreso')}
                    className="w-full justify-center px-3 py-1.5 rounded-lg border border-amber-800 bg-amber-950/50 hover:bg-amber-900 text-amber-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tomar caso</span>
                  </button>
                )}

                {ticket.estado === 'en_progreso' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResolvingTicket(ticket);
                      setSolucionText('');
                    }}
                    className="w-full justify-center px-3 py-1.5 rounded-lg border border-emerald-800 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar resuelto</span>
                  </button>
                )}

                {ticket.estado === 'resuelto' && (
                  <button
                    type="button"
                    onClick={() => onUpdateIncidentStatus(ticket.id, 'cerrado')}
                    className="w-full justify-center px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cerrar ticket</span>
                  </button>
                )}

                {/* Management buttons: Modificar & Eliminar */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(ticket)}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 hover:border-cyan-800/80 text-zinc-300 hover:text-cyan-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                    title="Modificar datos, estado o solución de esta incidencia"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Modificar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingTicket(ticket)}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:bg-red-950/40 hover:border-red-800/70 text-zinc-400 hover:text-red-400 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                    title="Eliminar incidencia del registro"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Incident Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              Reportar Nueva Incidencia en Mesa de Servicios
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Registra una falla o requerimiento para el equipo técnico de broadcasting o TI.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Título corto de la falla *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Falla de video en PC-Cliente de Prompter"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Sistema o Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ENPS">ENPS</option>
                    <option value="K2 / Nexio">K2 / Nexio</option>
                    <option value="LegalRec">LegalRec</option>
                    <option value="Orad / Gráficos">Orad / Gráficos</option>
                    <option value="Provys">Provys</option>
                    <option value="Internet / Enlaces">Internet / Enlaces</option>
                    <option value="Audio / Video">Audio / Video</option>
                    <option value="Prompter">Prompter</option>
                    <option value="Zoom">Zoom</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="baja">Baja - Mantenimiento</option>
                    <option value="media">Media - Falla menor</option>
                    <option value="alta">Alta - Afecta transmisión</option>
                    <option value="critica">Crítica - Salida de aire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-300">Técnico Asignado</label>
                    <button
                      type="button"
                      onClick={() => setIsAddTechModalOpen(true)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                    >
                      <Plus size={11} /> + Nuevo Técnico
                    </button>
                  </div>
                  <select
                    value={formData.tecnicoAsignado}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddTechModalOpen(true);
                      } else {
                        setFormData({ ...formData, tecnicoAsignado: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.tecnicoCode}>
                        {emp.tecnicoCode} ({emp.nombre})
                      </option>
                    ))}
                    <option value="__add_new__" className="text-cyan-400 font-bold bg-zinc-950">
                      + Agregar nuevo técnico...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Reportado por</label>
                  <input
                    type="text"
                    value={formData.reportadoPor}
                    onChange={(e) => setFormData({ ...formData, reportadoPor: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción detallada</label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Síntomas observados, programa afectado, hora estimada de inicio del problema..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  Generar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              Resolver Ticket: {resolvingTicket.codigo}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ingresa la acción o solución técnica realizada para cerrar este incidente.
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Solución aplicada</label>
                <textarea
                  rows={3}
                  required
                  value={solucionText}
                  onChange={(e) => setSolucionText(e.target.value)}
                  placeholder="Ej: Se reinició el servicio de base de datos y se verificó recepción correcta de señal..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
                >
                  Confirmar Resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Incident Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingTicket(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Edit3 size={16} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Modificar Incidencia: <span className="font-mono text-cyan-400">{editingTicket.codigo}</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5">
              Actualiza los detalles técnicos, estado, responsable o solución de este reporte.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Título corto de la falla *</label>
                <input
                  type="text"
                  required
                  value={editFormData.titulo}
                  onChange={(e) => setEditFormData({ ...editFormData, titulo: e.target.value })}
                  placeholder="Ej: Falla de video en PC-Cliente de Prompter"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Sistema o Categoría</label>
                  <select
                    value={editFormData.categoria}
                    onChange={(e) => setEditFormData({ ...editFormData, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ENPS">ENPS</option>
                    <option value="K2 / Nexio">K2 / Nexio</option>
                    <option value="LegalRec">LegalRec</option>
                    <option value="Orad / Gráficos">Orad / Gráficos</option>
                    <option value="Provys">Provys</option>
                    <option value="Internet / Enlaces">Internet / Enlaces</option>
                    <option value="Audio / Video">Audio / Video</option>
                    <option value="Prompter">Prompter</option>
                    <option value="Zoom">Zoom</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Prioridad</label>
                  <select
                    value={editFormData.prioridad}
                    onChange={(e) => setEditFormData({ ...editFormData, prioridad: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="baja">Baja - Mantenimiento</option>
                    <option value="media">Media - Falla menor</option>
                    <option value="alta">Alta - Afecta transmisión</option>
                    <option value="critica">Crítica - Salida de aire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Estado del Ticket</label>
                  <select
                    value={editFormData.estado}
                    onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Técnico Asignado</label>
                  <select
                    value={editFormData.tecnicoAsignado}
                    onChange={(e) => setEditFormData({ ...editFormData, tecnicoAsignado: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.tecnicoCode}>
                        {emp.tecnicoCode} ({emp.nombre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Reportado por</label>
                  <input
                    type="text"
                    value={editFormData.reportadoPor}
                    onChange={(e) => setEditFormData({ ...editFormData, reportadoPor: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha Reporte</label>
                  <input
                    type="date"
                    value={editFormData.fechaReporte}
                    onChange={(e) => setEditFormData({ ...editFormData, fechaReporte: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Hora Reporte</label>
                  <input
                    type="time"
                    value={editFormData.horaReporte}
                    onChange={(e) => setEditFormData({ ...editFormData, horaReporte: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción detallada</label>
                <textarea
                  rows={3}
                  value={editFormData.descripcion}
                  onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                  placeholder="Síntomas observados, programa afectado, hora estimada de inicio del problema..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {(editFormData.estado === 'resuelto' || editFormData.estado === 'cerrado' || editFormData.solucionAplicada) && (
                <div className="p-3 bg-zinc-900/60 border border-emerald-900/40 rounded-xl space-y-2">
                  <label className="block text-xs font-medium text-emerald-400">
                    Solución aplicada / Acciones técnicas
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.solucionAplicada}
                    onChange={(e) => setEditFormData({ ...editFormData, solucionAplicada: e.target.value })}
                    placeholder="Detalle del procedimiento técnico efectuado para dar solución a la falla..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
                >
                  <Check size={14} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Incident Confirmation Modal */}
      {deletingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setDeletingTicket(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ¿Eliminar Incidencia?
                </h3>
                <span className="font-mono text-xs text-red-400 font-semibold">
                  {deletingTicket.codigo}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el ticket:
            </p>
            <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl mb-4 text-xs text-zinc-200">
              <div className="font-semibold text-white mb-0.5">{deletingTicket.titulo}</div>
              <div className="text-[11px] text-zinc-400">
                {deletingTicket.categoria} • Reportado: {deletingTicket.fechaReporte} • {deletingTicket.tecnicoAsignado}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mb-5">
              Esta acción no se puede deshacer. Se removerá del registro local y se actualizará automáticamente con Google Drive si la sincronización está activa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => setDeletingTicket(null)}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
              >
                <Trash2 size={14} />
                <span>Eliminar Incidencia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Técnico */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddTechModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Registrar Nuevo Técnico
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5">
              Ingresa los datos del profesional para asignarle tickets y gestión en la Mesa de Servicios.
            </p>

            {techFormError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{techFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Darwin Quevedo / Carlos Benítez"
                  value={newTechForm.nombre}
                  onChange={(e) => {
                    const val = e.target.value;
                    let suggestedCode = newTechForm.tecnicoCode;
                    if (!newTechForm.tecnicoCode || newTechForm.tecnicoCode.length <= 4) {
                      const parts = val.trim().split(/\s+/);
                      if (parts.length >= 2) {
                        suggestedCode = parts[0][0]?.toUpperCase() + parts[parts.length - 1];
                      }
                    }
                    setNewTechForm({
                      ...newTechForm,
                      nombre: val,
                      tecnicoCode: suggestedCode,
                    });
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Código de Técnico <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: DQuevedo / CBenitez"
                    value={newTechForm.tecnicoCode}
                    onChange={(e) => setNewTechForm({ ...newTechForm, tecnicoCode: e.target.value.replace(/\s+/g, '') })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Identificador en tickets</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@comunica.ec"
                    value={newTechForm.email}
                    onChange={(e) => setNewTechForm({ ...newTechForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Cargo Institucional
                </label>
                <input
                  type="text"
                  value={newTechForm.cargo}
                  onChange={(e) => setNewTechForm({ ...newTechForm, cargo: e.target.value })}
                  placeholder="Analista de Sistemas y Multimedia Broadcasting 2"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsAddTechModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  <span>Guardar Técnico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gestionar Técnicos Asignados */}
      {isManageTechModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsManageTechModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Users size={16} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Técnicos Asignados en Mesa de Servicios
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Por requerimiento institucional, los técnicos predeterminados son <strong>DQuevedo</strong> y <strong>Fmalla</strong>. Puedes registrar técnicos adicionales en cualquier momento.
            </p>

            <div className="space-y-2 mb-5 max-h-64 overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isDefault = emp.tecnicoCode === 'DQuevedo' || emp.tecnicoCode === 'Fmalla';
                return (
                  <div
                    key={emp.id}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          {emp.tecnicoCode}
                        </span>
                        <span className="text-sm font-semibold text-zinc-100">
                          {emp.nombre}
                        </span>
                        {isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Oficial
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {emp.cargo} • {emp.email}
                      </div>
                    </div>

                    {!isDefault && onDeleteEmployee && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Deseas remover al técnico ${emp.tecnicoCode} (${emp.nombre})?`)) {
                            onDeleteEmployee(emp.id);
                            setTechToastMessage(`Técnico ${emp.tecnicoCode} removido.`);
                            setTimeout(() => setTechToastMessage(null), 3000);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                        title="Eliminar técnico adicional"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => {
                  setIsManageTechModalOpen(false);
                  setIsAddTechModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>+ Agregar Nuevo Técnico</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageTechModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Incidents Printable / PDF Report Modal */}
      <IncidentsMonthlyReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        incidents={incidents}
        employees={employees}
      />
    </div>
  );
};
