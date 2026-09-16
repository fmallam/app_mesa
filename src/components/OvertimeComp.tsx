import React, { useState } from 'react';
import { Employee, OvertimeLog, TimeOffDeduction, OvertimeRate } from '../types';
import { 
  Clock, 
  Plus, 
  Minus, 
  Calendar, 
  User, 
  Award, 
  FileText, 
  ArrowDownRight, 
  ArrowUpRight, 
  Percent, 
  CalendarDays, 
  AlertCircle,
  Download,
  Filter,
  CheckCircle2,
  Users,
  Trash2,
  RefreshCw,
  HardDrive,
  Pencil,
  HelpCircle,
  X,
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  UserCheck
} from 'lucide-react';
import { WorkerPinModal } from './WorkerPinModal';

interface Props {
  employees: Employee[];
  overtimeLogs: OvertimeLog[];
  timeOffDeductions: TimeOffDeduction[];
  onAddOvertime: (log: Omit<OvertimeLog, 'id' | 'creadoEn'>) => void;
  onApplyTimeOff: (deduction: Omit<TimeOffDeduction, 'id' | 'creadoEn' | 'saldoPrevio' | 'saldoRestante'>) => { success: boolean; error?: string };
  onAddEmployee: (emp: Omit<Employee, 'id' | 'saldoHoras'>) => void;
  onDeleteEmployee?: (id: string) => void;
  onUpdateOvertimeLog?: (log: OvertimeLog) => Promise<void> | void;
  onDeleteOvertimeLog?: (id: string) => Promise<void> | void;
  onDeleteTimeOffDeduction?: (id: string) => Promise<void> | void;
  onUpdateEmployeeBalance?: (employeeId: string, newBalance: number) => void;
  onRecalculateAllBalances?: () => void;
  onSyncToGoogleSheets?: () => Promise<void>;
  isGoogleConnected?: boolean;
  isSyncing?: boolean;
  onUpdateEmployeeCode?: (employeeId: string, newCode: string) => void;
  isAdmin?: boolean;
}

export const OvertimeComp: React.FC<Props> = ({
  employees,
  overtimeLogs,
  timeOffDeductions,
  onAddOvertime,
  onApplyTimeOff,
  onAddEmployee,
  onDeleteEmployee,
  onUpdateOvertimeLog,
  onDeleteOvertimeLog,
  onDeleteTimeOffDeduction,
  onUpdateEmployeeBalance,
  onRecalculateAllBalances,
  onSyncToGoogleSheets,
  isGoogleConnected = false,
  isSyncing = false,
  onUpdateEmployeeCode,
  isAdmin = true,
  sessionEmployeeId,
}) => {
  // Exclude ONLY Darwin Quevedo from bank of overtime & compensations
  // (Darwin Quevedo has an administrative/analyst role and does not accrue overtime)
  const cleanEmployees = employees.filter((emp) => {
    const isDarwin = emp.id === 'emp-1' || emp.tecnicoCode === 'DQuevedo' || (emp.nombre || '').toLowerCase() === 'darwin quevedo';
    return !isDarwin;
  });

  // When a non-admin technician is logged in, filter workers list to only themselves
  const displayedEmployees = !isAdmin && sessionEmployeeId
    ? cleanEmployees.filter((emp) => emp.id === sessionEmployeeId)
    : cleanEmployees;

  const cleanOvertimeLogs = overtimeLogs.filter((ot) => {
    const isDarwin = ot.empleadoId === 'emp-1' || (ot.empleadoNombre || '').toLowerCase() === 'darwin quevedo';
    return !isDarwin;
  });

  const cleanTimeOffDeductions = timeOffDeductions.filter((to) => {
    const isDarwin = to.empleadoId === 'emp-1' || (to.empleadoNombre || '').toLowerCase() === 'darwin quevedo';
    return !isDarwin;
  });

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>(() => {
    if (!isAdmin && sessionEmployeeId) {
      return sessionEmployeeId;
    }
    return 'all';
  });

  React.useEffect(() => {
    if (!isAdmin && sessionEmployeeId) {
      setSelectedEmployeeFilter(sessionEmployeeId);
    }
  }, [isAdmin, sessionEmployeeId]);
  const [activeSubTab, setActiveSubTab] = useState<'kardex' | 'credito' | 'debito'>('kardex');
  
  // Modals
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  const [isNewEmpModalOpen, setIsNewEmpModalOpen] = useState(false);

  // Form states
  const [otForm, setOtForm] = useState({
    empleadoId: cleanEmployees[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    horas: 4,
    recargo: '50%' as OvertimeRate,
    multiplicarFactor: true, // 50% -> x1.5, 100% -> x2.0
    motivo: '',
    aprobadoPor: 'Dirección Técnica',
  });

  // Edit Form state
  const [isEditOvertimeModalOpen, setIsEditOvertimeModalOpen] = useState(false);
  const [editOtForm, setEditOtForm] = useState<{
    id: string;
    empleadoId: string;
    fecha: string;
    horas: number;
    recargo: OvertimeRate;
    multiplicarFactor: boolean;
    motivo: string;
    aprobadoPor: string;
  } | null>(null);

  const [showCorrectionGuide, setShowCorrectionGuide] = useState(true);

  const [toForm, setToForm] = useState({
    empleadoId: cleanEmployees[0]?.id || '',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    fechaDisfrute: new Date().toISOString().split('T')[0],
    tipo: 'horas' as 'horas' | 'dias',
    cantidad: 4,
    motivo: '',
  });

  const [toError, setToError] = useState<string | null>(null);

  const [entryToDelete, setEntryToDelete] = useState<{
    rawId: string;
    rawType: 'overtime' | 'timeoff';
    empleadoNombre: string;
    deltaHoras: number;
    detalle: string;
    fecha: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);

  const [adjustingEmployee, setAdjustingEmployee] = useState<Employee | null>(null);
  const [adjustBalanceValue, setAdjustBalanceValue] = useState<string>('0');

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

  const [empForm, setEmpForm] = useState({
    nombre: '',
    cargo: 'Técnico de Operaciones Broadcast',
    tecnicoCode: '',
    email: '',
    codigoSeguridad: '',
    area: 'multimedia' as 'multimedia' | 'control_tecnico',
  });

  // Selected employee for time-off preview
  const activeEmpForTimeOff = cleanEmployees.find((e) => e.id === toForm.empleadoId) || cleanEmployees[0];
  const requiredHours = toForm.tipo === 'dias' ? toForm.cantidad * 8 : toForm.cantidad;
  const simulatedRemaining = (activeEmpForTimeOff?.saldoHoras ?? 0) - requiredHours;

  // Worker Session & Security PIN states
  const [isWorkerPinModalOpen, setIsWorkerPinModalOpen] = useState(false);
  const [activeTechnicianSession, setActiveTechnicianSession] = useState<Employee | null>(null);
  const [isSelectingTechSession, setIsSelectingTechSession] = useState(false);
  const [sessionSelectedEmpId, setSessionSelectedEmpId] = useState<string>(cleanEmployees[0]?.id || '');
  const [sessionPinInput, setSessionPinInput] = useState('');
  const [sessionPinError, setSessionPinError] = useState<string | null>(null);

  const [otPin, setOtPin] = useState('');
  const [otPinError, setOtPinError] = useState<string | null>(null);

  const [toPin, setToPin] = useState('');
  const [toPinError, setToPinError] = useState<string | null>(null);

  const [editOtPin, setEditOtPin] = useState('');
  const [editOtPinError, setEditOtPinError] = useState<string | null>(null);

  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState<string | null>(null);

  // Helper to verify a worker's PIN
  const verifyWorkerPin = (emp: Employee | undefined, pin: string): boolean => {
    if (!emp) return false;
    const clean = (pin || '').trim().toUpperCase();
    if (!clean) return false;
    if (clean === 'ADMIN-2026') return true;
    const expected = (emp.codigoSeguridad || `${emp.tecnicoCode}-2026`).trim().toUpperCase();
    return clean === expected;
  };

  const handleStartTechSession = (e: React.FormEvent) => {
    e.preventDefault();
    setSessionPinError(null);
    const emp = cleanEmployees.find((x) => x.id === sessionSelectedEmpId);
    if (!emp) return;

    if (!verifyWorkerPin(emp, sessionPinInput)) {
      setSessionPinError(`PIN incorrecto para ${emp.nombre}. Verifica tu código con el administrador.`);
      return;
    }

    setActiveTechnicianSession(emp);
    setIsSelectingTechSession(false);
    setSessionPinInput('');
    setSessionPinError(null);

    // Preselect in forms
    setOtForm((prev) => ({ ...prev, empleadoId: emp.id }));
    setToForm((prev) => ({ ...prev, empleadoId: emp.id }));
  };

  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtPinError(null);
    const emp = cleanEmployees.find((x) => x.id === otForm.empleadoId);
    if (!emp) return;

    // PIN check: Session or explicit PIN or Supervisor
    const isSessionActive = activeTechnicianSession?.id === emp.id;
    if (!isSessionActive && !verifyWorkerPin(emp, otPin)) {
      setOtPinError(`Código de seguridad incorrecto para ${emp.nombre}. Introduce el PIN único asignado a este trabajador o el PIN de supervisión.`);
      return;
    }

    let factor = 1.0;
    if (otForm.recargo === '0%') {
      factor = 1.0;
    } else if (otForm.multiplicarFactor) {
      factor = otForm.recargo === '50%' ? 1.5 : 2.0;
    }
    const horasEquivalentes = Number((otForm.horas * factor).toFixed(2));

    onAddOvertime({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      fecha: otForm.fecha,
      horasRealizadas: Number(otForm.horas),
      recargo: otForm.recargo,
      horasEquivalentes: horasEquivalentes,
      motivo: otForm.motivo || 'Horas extras autorizadas por requerimiento operativo',
      aprobadoPor: otForm.aprobadoPor,
    });

    setIsOvertimeModalOpen(false);
    setOtPin('');
    setOtPinError(null);
    setOtForm({
      empleadoId: activeTechnicianSession?.id || cleanEmployees[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      horas: 4,
      recargo: '50%',
      multiplicarFactor: true,
      motivo: '',
      aprobadoPor: 'Dirección Técnica',
    });
  };

  const handleTimeOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToError(null);
    setToPinError(null);
    const emp = cleanEmployees.find((x) => x.id === toForm.empleadoId);
    if (!emp) return;

    // PIN check: Session or explicit PIN or Supervisor
    const isSessionActive = activeTechnicianSession?.id === emp.id;
    if (!isSessionActive && !verifyWorkerPin(emp, toPin)) {
      setToPinError(`Código de seguridad incorrecto para ${emp.nombre}. No puedes solicitar permisos o libres a nombre de otro compañero.`);
      return;
    }

    const horasADescontar = toForm.tipo === 'dias' ? toForm.cantidad * 8 : toForm.cantidad;

    if (horasADescontar > emp.saldoHoras) {
      setToError(`Saldo insuficiente. El empleado tiene ${emp.saldoHoras}h disponibles y solicita ${horasADescontar}h.`);
      return;
    }

    const result = onApplyTimeOff({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      fechaSolicitud: toForm.fechaSolicitud,
      fechaDisfrute: toForm.fechaDisfrute,
      tipo: toForm.tipo,
      cantidadSolicitada: toForm.cantidad,
      horasDescontadas: horasADescontar,
      motivo: toForm.motivo || 'Permiso con cargo a horas extras compensadas',
      estado: 'aprobado',
    });

    if (result.success) {
      setIsTimeOffModalOpen(false);
      setToPin('');
      setToPinError(null);
      setToForm({
        empleadoId: activeTechnicianSession?.id || cleanEmployees[0]?.id || '',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        fechaDisfrute: new Date().toISOString().split('T')[0],
        tipo: 'horas',
        cantidad: 4,
        motivo: '',
      });
    } else {
      setToError(result.error || 'Error al procesar el descuento.');
    }
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(null);
    if (!empForm.nombre || !empForm.tecnicoCode) return;

    const n = (empForm.nombre || '').toLowerCase();
    const c = (empForm.tecnicoCode || '').toLowerCase();
    if ((n === 'darwin quevedo' && c === 'dquevedo') || c === 'dquevedo') {
      setEmpError('El trabajador Darwin Quevedo no aplica para el registro de horas extras por ser Analista.');
      return;
    }

    const newEmpCode = empForm.codigoSeguridad?.trim() || `${empForm.tecnicoCode.replace(/\s+/g, '')}-2026`;

    const newEmp = onAddEmployee({
      nombre: empForm.nombre.trim(),
      cargo: empForm.cargo.trim() || 'Técnico de Operaciones Broadcast',
      tecnicoCode: empForm.tecnicoCode.replace(/\s+/g, ''),
      email: empForm.email.trim() || `${empForm.tecnicoCode.toLowerCase()}@comunica.ec`,
      codigoSeguridad: newEmpCode,
      area: empForm.area,
    });

    if (newEmp && newEmp.id) {
      setOtForm((prev) => ({ ...prev, empleadoId: newEmp.id }));
      setToForm((prev) => ({ ...prev, empleadoId: newEmp.id }));
      setSelectedEmployeeFilter(newEmp.id);
    }

    setEmpForm({
      nombre: '',
      cargo: 'Técnico de Operaciones Broadcast',
      tecnicoCode: '',
      email: '',
      codigoSeguridad: '',
      area: 'multimedia',
    });
    setEmpError(null);
    setIsNewEmpModalOpen(false);
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete || !onDeleteEmployee) return;
    try {
      setIsDeletingEmployee(true);
      if (selectedEmployeeFilter === employeeToDelete.id) {
        setSelectedEmployeeFilter('all');
      }
      await onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  const handleOpenEditOvertime = (ot: OvertimeLog) => {
    const expectedFactor = ot.recargo === '0%' ? 1.0 : ot.recargo === '50%' ? 1.5 : 2.0;
    const hasFactor = ot.recargo === '0%' ? false : Math.abs(ot.horasEquivalentes - (ot.horasRealizadas * expectedFactor)) < 0.05;

    setEditOtPin('');
    setEditOtPinError(null);
    setEditOtForm({
      id: ot.id,
      empleadoId: ot.empleadoId,
      fecha: ot.fecha,
      horas: ot.horasRealizadas,
      recargo: ot.recargo,
      multiplicarFactor: hasFactor,
      motivo: ot.motivo,
      aprobadoPor: ot.aprobadoPor,
    });
    setIsEditOvertimeModalOpen(true);
  };

  const handleEditOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditOtPinError(null);
    if (!editOtForm || !onUpdateOvertimeLog) return;

    const emp = cleanEmployees.find((x) => x.id === editOtForm.empleadoId);
    if (!emp) return;

    const isSessionActive = activeTechnicianSession?.id === emp.id;
    if (!isSessionActive && !verifyWorkerPin(emp, editOtPin)) {
      setEditOtPinError(`Código de seguridad incorrecto para ${emp.nombre}. Solo el titular o el supervisor pueden modificar este registro.`);
      return;
    }

    let factor = 1.0;
    if (editOtForm.recargo === '0%') {
      factor = 1.0;
    } else if (editOtForm.multiplicarFactor) {
      factor = editOtForm.recargo === '50%' ? 1.5 : 2.0;
    }
    const horasEquivalentes = Number((editOtForm.horas * factor).toFixed(2));

    onUpdateOvertimeLog({
      id: editOtForm.id,
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      fecha: editOtForm.fecha,
      horasRealizadas: Number(editOtForm.horas),
      recargo: editOtForm.recargo,
      horasEquivalentes: horasEquivalentes,
      motivo: editOtForm.motivo || 'Horas extras autorizadas por requerimiento operativo',
      aprobadoPor: editOtForm.aprobadoPor,
      creadoEn: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    setIsEditOvertimeModalOpen(false);
    setEditOtForm(null);
    setEditOtPin('');
    setEditOtPinError(null);
  };

  const handleRequestDelete = (mov: {
    rawId: string;
    rawType: 'overtime' | 'timeoff';
    empleadoNombre: string;
    deltaHoras: number;
    detalle: string;
    fecha: string;
  }) => {
    setDeletePin('');
    setDeletePinError(null);
    setEntryToDelete(mov);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    setDeletePinError(null);

    // Find the corresponding employee to verify their PIN
    const emp = cleanEmployees.find(
      (e) => (e.nombre || '').trim().toLowerCase() === (entryToDelete.empleadoNombre || '').trim().toLowerCase()
    );

    const isSessionActive = emp && activeTechnicianSession?.id === emp.id;
    if (!isSessionActive && !verifyWorkerPin(emp, deletePin)) {
      setDeletePinError(`Código de seguridad incorrecto. Debes ingresar el PIN único de ${entryToDelete.empleadoNombre} o el PIN maestro (ADMIN-2026).`);
      return;
    }

    setIsDeleting(true);
    try {
      if (entryToDelete.rawType === 'overtime') {
        if (onDeleteOvertimeLog) {
          await onDeleteOvertimeLog(entryToDelete.rawId);
        }
      } else {
        if (onDeleteTimeOffDeduction) {
          await onDeleteTimeOffDeduction(entryToDelete.rawId);
        }
      }
      setEntryToDelete(null);
      setDeletePin('');
      setDeletePinError(null);
    } catch (err) {
      console.error('Error al ejecutar la eliminación:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Kardex unified rows
  const unifiedKardex = React.useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      rawType: 'overtime' | 'timeoff';
      fecha: string;
      empleadoId: string;
      empleadoNombre: string;
      tipo: 'ABONO_EXTRA' | 'DESCUENTO_LIBRE';
      detalle: string;
      recargo?: string;
      horasRealizadas?: number;
      deltaHoras: number; // positive or negative
      autorizado: string;
      rawOvertime?: OvertimeLog;
      rawTimeOff?: TimeOffDeduction;
    }> = [];

    cleanOvertimeLogs.forEach((ot) => {
      list.push({
        id: `ot-${ot.id}`,
        rawId: ot.id,
        rawType: 'overtime',
        fecha: ot.fecha,
        empleadoId: ot.empleadoId,
        empleadoNombre: ot.empleadoNombre,
        tipo: 'ABONO_EXTRA',
        detalle: ot.motivo,
        recargo: ot.recargo,
        horasRealizadas: ot.horasRealizadas,
        deltaHoras: ot.horasEquivalentes,
        autorizado: ot.aprobadoPor,
        rawOvertime: ot,
      });
    });

    cleanTimeOffDeductions.forEach((to) => {
      list.push({
        id: `to-${to.id}`,
        rawId: to.id,
        rawType: 'timeoff',
        fecha: to.fechaDisfrute,
        empleadoId: to.empleadoId,
        empleadoNombre: to.empleadoNombre,
        tipo: 'DESCUENTO_LIBRE',
        detalle: `${to.motivo} (${to.cantidadSolicitada} ${to.tipo === 'dias' ? 'días' : 'horas'} de permiso)`,
        deltaHoras: -to.horasDescontadas,
        autorizado: 'Aprobado',
        rawTimeOff: to,
      });
    });

    return list
      .filter((item) => selectedEmployeeFilter === 'all' || item.empleadoId === selectedEmployeeFilter)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [cleanOvertimeLogs, cleanTimeOffDeductions, selectedEmployeeFilter]);

  const handleExportKardexCSV = () => {
    const headers = ['FECHA', 'TRABAJADOR', 'TIPO_MOVIMIENTO', 'DETALLE', 'RECARGO', 'HORAS_EFECTIVAS', 'DELTA_SALDO_HORAS', 'AUTORIZACION'];
    const rows = unifiedKardex.map((k) => [
      k.fecha,
      `"${k.empleadoNombre}"`,
      k.tipo === 'ABONO_EXTRA' ? 'ABONO (HORAS EXTRAS)' : 'DESCUENTO (TIEMPO LIBRE)',
      `"${k.detalle}"`,
      k.recargo || 'N/A',
      k.horasRealizadas ?? Math.abs(k.deltaHoras),
      k.deltaHoras,
      `"${k.autorizado}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kardex_horas_extras_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Banco de Horas Extras y Compensación de Tiempo
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Gestiona de forma centralizada las horas extras trabajadas al 50% (ordinarias/nocturnas) y al 100% (extraordinarias/feriados), y deduce automáticamente el saldo cuando los técnicos solicitan horas o días libres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onSyncToGoogleSheets && (
            <button
              id="btn-sync-overtime-sheets"
              type="button"
              onClick={onSyncToGoogleSheets}
              disabled={isSyncing || !isGoogleConnected}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                isGoogleConnected
                  ? 'border-emerald-700/80 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
              title={
                isGoogleConnected
                  ? 'Sincronizar y actualizar todas las horas extras y descansos con el documento de Google Sheets'
                  : 'Conecta tu cuenta de Google Drive en la barra superior para sincronizar con Google Sheets'
              }
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Actualizar en Google Sheets'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsWorkerPinModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-800/70 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 text-xs font-medium transition cursor-pointer"
              title="Ver y configurar los códigos únicos PIN de los técnicos para autorizar registros"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Códigos de Seguridad</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsNewEmpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Nuevo Trabajador</span>
            </button>
          )}

          <button
            id="btn-timeoff-modal"
            type="button"
            onClick={() => {
              setToError(null);
              setToPin('');
              setToPinError(null);
              if (selectedEmployeeFilter !== 'all' && cleanEmployees.some((e) => e.id === selectedEmployeeFilter)) {
                setToForm((prev) => ({ ...prev, empleadoId: selectedEmployeeFilter }));
              } else if (!cleanEmployees.some((e) => e.id === toForm.empleadoId) && cleanEmployees.length > 0) {
                setToForm((prev) => ({ ...prev, empleadoId: cleanEmployees[0].id }));
              }
              setIsTimeOffModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-800/80 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 text-xs font-semibold transition"
          >
            <Minus className="w-4 h-4" />
            <span>Descontar Tiempo Libre</span>
          </button>

          <button
            id="btn-overtime-modal"
            type="button"
            onClick={() => {
              setOtPin('');
              setOtPinError(null);
              if (selectedEmployeeFilter !== 'all' && cleanEmployees.some((e) => e.id === selectedEmployeeFilter)) {
                setOtForm((prev) => ({ ...prev, empleadoId: selectedEmployeeFilter }));
              } else if (!cleanEmployees.some((e) => e.id === otForm.empleadoId) && cleanEmployees.length > 0) {
                setOtForm((prev) => ({ ...prev, empleadoId: cleanEmployees[0].id }));
              }
              setIsOvertimeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Acreditar Horas Extras</span>
          </button>
        </div>
      </div>

      {/* Worker Active Identity Bar */}
      <div className="p-3.5 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${activeTechnicianSession ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
            {activeTechnicianSession ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <span>Identificación de Seguridad:</span>
              {activeTechnicianSession ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/70 px-2 py-0.5 rounded-md">
                  <UserCheck className="w-3 h-3" />
                  {activeTechnicianSession.nombre} ({activeTechnicianSession.tecnicoCode})
                </span>
              ) : (
                <span className="text-zinc-400 font-normal">
                  Ningún técnico identificado en esta terminal
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {activeTechnicianSession 
                ? 'Tus acciones de horas extras y tiempo libre están autenticadas con tu PIN personal.' 
                : 'Se solicitará el PIN único de cada trabajador al agregar, pedir libres o eliminar registros.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTechnicianSession ? (
            <button
              type="button"
              onClick={() => {
                setActiveTechnicianSession(null);
                setSessionPinInput('');
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 text-xs font-medium transition cursor-pointer"
            >
              Cerrar Sesión Técnica
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSessionPinError(null);
                setSessionPinInput('');
                setIsSelectingTechSession(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ingresar mi PIN de Técnico</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal / Popover: Iniciar Sesión Técnica con PIN */}
      {isSelectingTechSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Identificación de Técnico</h3>
                  <p className="text-[11px] text-zinc-400">Verifica tu código único de trabajador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectingTechSession(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartTechSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Selecciona tu Usuario de Técnico
                </label>
                <select
                  value={sessionSelectedEmpId}
                  onChange={(e) => setSessionSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {cleanEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.tecnicoCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tu Código Único de Seguridad (PIN)
                </label>
                <input
                  type="password"
                  required
                  value={sessionPinInput}
                  onChange={(e) => setSessionPinInput(e.target.value)}
                  placeholder="Ej: FM-2026"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-center font-mono tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Si olvidaste tu PIN, consúltalo con tu supervisor o actualízalo en "Mi PIN Personal".
                </span>
              </div>

              {sessionPinError && (
                <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{sessionPinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSelectingTechSession(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  Validar e Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Balances Grid */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              Saldos Disponibles por Trabajador
            </h3>
            {onRecalculateAllBalances && (
              <button
                type="button"
                onClick={onRecalculateAllBalances}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition shadow-sm cursor-pointer"
                title="Recalcula el saldo acumulado sumando todas las horas extras y restando los descansos en el Kardex"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>Cuadrar con Kardex</span>
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            Jornada laboral base: 1 día libre = 8 horas acumuladas
          </span>
        </div>

        {cleanEmployees.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
            <User className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-200">No hay trabajadores registrados en el banco de horas extras</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Utiliza el botón superior &quot;Nuevo Trabajador&quot; para registrar un técnico y comenzar a gestionar sus horas extras y compensaciones.
            </p>
            <button
              type="button"
              onClick={() => setIsNewEmpModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Registrar Nuevo Trabajador</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedEmployees.map((emp) => {
              const diasEquivalentes = Number((emp.saldoHoras / 8).toFixed(1));
              const isSelected = selectedEmployeeFilter === emp.id;
              const isOfficial = emp.tecnicoCode === 'Fmalla';
              const empNombreLower = (emp.nombre || '').toLowerCase();
              const empLogsCount = overtimeLogs.filter(
                (ot) => ot.empleadoId === emp.id || (ot.empleadoNombre && ot.empleadoNombre.toLowerCase() === empNombreLower)
              ).length;

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeFilter(isSelected ? 'all' : emp.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-cyan-500 ring-1 ring-cyan-500/50'
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-zinc-100 truncate">{emp.nombre}</h4>
                      <p className="text-[11px] text-zinc-400 truncate">{emp.cargo}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold">
                        {emp.tecnicoCode}
                      </span>
                      {onDeleteEmployee && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToDelete(emp);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                          title={`Retirar al trabajador ${emp.nombre} del banco de horas extras`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Saldo acumulado</span>
                      {onUpdateEmployeeBalance && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustingEmployee(emp);
                            setAdjustBalanceValue(String(emp.saldoHoras));
                          }}
                          className="p-1 text-zinc-400 hover:text-cyan-300 rounded hover:bg-zinc-800 transition cursor-pointer"
                          title="Ajustar saldo o poner en 0h"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {emp.saldoHoras} <span className="text-xs font-normal text-zinc-400">horas</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-xs px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
                      ~ {diasEquivalentes} días libres
                    </span>
                    {emp.saldoHoras > 0 && empLogsCount === 0 && onUpdateEmployeeBalance && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateEmployeeBalance(emp.id, 0);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900 transition font-semibold cursor-pointer shadow-sm"
                        title="El kardex no contiene horas registradas. Haz clic para restablecer el saldo a 0."
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Poner en 0h</span>
                      </button>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2 text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Filtrando kardex de este trabajador
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* Kardex & Movement History Table */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-2xl space-y-4">
        {showCorrectionGuide && (
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-cyan-200">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300 font-semibold block mb-0.5">¿Cómo corregir o anular un dato mal ingresado?</strong>
                <p className="text-zinc-300 leading-relaxed">
                  Si cometiste una equivocación al ingresar una hora extra o un descanso compensatorio, puedes corregirlo directamente desde la columna <span className="font-semibold text-white">Acciones</span> en la tabla:
                  haz clic en <span className="inline-flex items-center text-cyan-300 font-semibold gap-0.5 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800"><Pencil className="w-3 h-3 inline" /> Editar</span> para corregir horas, fecha, recargo o motivo de una hora extra, o en <span className="inline-flex items-center text-red-400 font-semibold gap-0.5 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800"><Trash2 className="w-3 h-3 inline" /> Eliminar</span> para retirar el registro. El saldo del trabajador se recalculará automáticamente y se sincronizará con Google Sheets.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCorrectionGuide(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-900 transition"
              title="Ocultar sugerencia"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Kardex de Movimientos (Abonos de Horas vs Deducciones de Tiempo Libre)
            </h3>
            {selectedEmployeeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedEmployeeFilter('all')}
                className="text-xs text-cyan-400 hover:underline"
              >
                (Ver todos)
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportKardexCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Kardex CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider bg-zinc-900/60">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Trabajador</th>
                <th className="py-2.5 px-3">Tipo Operación</th>
                <th className="py-2.5 px-3">Detalle / Motivo</th>
                <th className="py-2.5 px-3 text-center">Tasa / Recargo</th>
                <th className="py-2.5 px-3 text-right">Impacto en Saldo</th>
                <th className="py-2.5 px-3 text-right">Autorización</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {unifiedKardex.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No existen movimientos registrados para el filtro actual.
                  </td>
                </tr>
              ) : (
                unifiedKardex.map((mov) => {
                  const isCredit = mov.tipo === 'ABONO_EXTRA';
                  return (
                    <tr key={mov.id} className="hover:bg-zinc-900/40 font-mono transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 font-sans">{mov.fecha}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium font-sans text-zinc-200">
                        {mov.empleadoNombre}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            Abono Horas Extras
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-semibold">
                            <ArrowDownRight className="w-3 h-3 text-amber-400" />
                            Descuento Tiempo Libre
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-zinc-300 max-w-xs truncate">
                        {mov.detalle}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {mov.recargo ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-zinc-300 text-[11px]">
                            {mov.recargo}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap">
                        {isCredit ? (
                          <span className="text-emerald-400">+{mov.deltaHoras}h</span>
                        ) : (
                          <span className="text-amber-400">{mov.deltaHoras}h</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans text-zinc-400 whitespace-nowrap">
                        {mov.autorizado}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {mov.rawType === 'overtime' && mov.rawOvertime && onUpdateOvertimeLog && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditOvertime(mov.rawOvertime!)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700 text-zinc-400 hover:text-cyan-300 transition"
                              title="Corregir datos de esta hora extra"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(mov)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title={mov.rawType === 'overtime' ? 'Eliminar hora extra y restar del saldo' : 'Anular deducción y reintegrar horas'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Acreditar Horas Extras */}
      {isOvertimeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Acreditar Horas Extras a Trabajador
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Registra las horas trabajadas en exceso y selecciona el tipo de recargo correspondiente.
            </p>

            <form onSubmit={handleOvertimeSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Trabajador Titular</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOvertimeModalOpen(false);
                      setIsNewEmpModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Registrar nuevo
                  </button>
                </div>
                <select
                  required
                  value={otForm.empleadoId}
                  onChange={(e) => setOtForm({ ...otForm, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {cleanEmployees.length === 0 && (
                    <option value="">No hay trabajadores registrados</option>
                  )}
                  {cleanEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.tecnicoCode}) — Saldo actual: {emp.saldoHoras}h
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Ejecución</label>
                  <input
                    type="date"
                    required
                    value={otForm.fecha}
                    onChange={(e) => setOtForm({ ...otForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Horas Reales Trabajadas</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={otForm.horas}
                    onChange={(e) => setOtForm({ ...otForm, horas: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Recargo</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    otForm.recargo === '0%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="recargo"
                      value="0%"
                      checked={otForm.recargo === '0%'}
                      onChange={() => setOtForm({ ...otForm, recargo: '0%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 0%</div>
                      <div className="text-[10px] text-zinc-400">Sin recargo / Ordinaria (1:1)</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    otForm.recargo === '50%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="recargo"
                      value="50%"
                      checked={otForm.recargo === '50%'}
                      onChange={() => setOtForm({ ...otForm, recargo: '50%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 50%</div>
                      <div className="text-[10px] text-zinc-400">Jornada nocturna / suplementaria</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    otForm.recargo === '100%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="recargo"
                      value="100%"
                      checked={otForm.recargo === '100%'}
                      onChange={() => setOtForm({ ...otForm, recargo: '100%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 100%</div>
                      <div className="text-[10px] text-zinc-400">Fines de semana / feriados</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Multiplier toggle option */}
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-medium text-zinc-200">Calcular tiempo compensatorio con factor</div>
                  <div className="text-[11px] text-zinc-500">
                    {otForm.recargo === '0%'
                      ? '1 hora trabajada = 1.0h de tiempo libre (compensación 1 a 1 directa)'
                      : otForm.recargo === '50%'
                      ? '1 hora trabajada = 1.5h de tiempo libre'
                      : '1 hora trabajada = 2.0h de tiempo libre'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={otForm.recargo === '0%' ? false : otForm.multiplicarFactor}
                  disabled={otForm.recargo === '0%'}
                  onChange={(e) => setOtForm({ ...otForm, multiplicarFactor: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-zinc-800 border-zinc-700 disabled:opacity-40 cursor-pointer"
                />
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Total a acreditar al trabajador:</span>
                <strong className="text-base font-mono">
                  +{(() => {
                    let factor = 1.0;
                    if (otForm.recargo === '0%') factor = 1.0;
                    else if (otForm.multiplicarFactor) factor = otForm.recargo === '50%' ? 1.5 : 2.0;
                    return (otForm.horas * factor).toFixed(1);
                  })()} horas
                </strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo / Tarea realizada</label>
                <input
                  type="text"
                  required
                  value={otForm.motivo}
                  onChange={(e) => setOtForm({ ...otForm, motivo: e.target.value })}
                  placeholder="Ej: Transmisión especial de elecciones / Cobertura cadena"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Aprobado por</label>
                <input
                  type="text"
                  value={otForm.aprobadoPor}
                  onChange={(e) => setOtForm({ ...otForm, aprobadoPor: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Worker PIN authorization requirement */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Código Único del Trabajador (PIN) *</span>
                  </label>
                  {activeTechnicianSession?.id === otForm.empleadoId && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                      ✓ Autenticado en sesión activa
                    </span>
                  )}
                </div>

                {activeTechnicianSession?.id === otForm.empleadoId ? (
                  <p className="text-[11px] text-zinc-400">
                    Estás identificado como <strong className="text-white">{activeTechnicianSession.nombre}</strong>. No es necesario volver a ingresar el PIN.
                  </p>
                ) : (
                  <div>
                    <input
                      type="password"
                      required
                      value={otPin}
                      onChange={(e) => setOtPin(e.target.value)}
                      placeholder="Ingresa el PIN único de este técnico o PIN de supervisión"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-mono text-center tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Protección contra registros a nombres de otros trabajadores. Código supervisor: <code className="text-amber-400">ADMIN-2026</code>
                    </span>
                  </div>
                )}

                {otPinError && (
                  <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{otPinError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOvertimeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
                >
                  Acreditar al Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Descontar Tiempo Libre (Horas o Días) */}
      {isTimeOffModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Minus className="w-5 h-5 text-amber-400" />
              Solicitud y Descuento de Tiempo Libre
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Deduce horas o días libres del saldo acumulado del trabajador de acuerdo a lo que solicita.
            </p>

            {toError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{toError}</span>
              </div>
            )}

            <form onSubmit={handleTimeOffSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Trabajador Solicitante</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimeOffModalOpen(false);
                      setIsNewEmpModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Registrar nuevo
                  </button>
                </div>
                <select
                  required
                  value={toForm.empleadoId}
                  onChange={(e) => setToForm({ ...toForm, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {cleanEmployees.length === 0 && (
                    <option value="">No hay trabajadores disponibles</option>
                  )}
                  {cleanEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.tecnicoCode}) — Saldo Disponible: {emp.saldoHoras}h (~{(emp.saldoHoras / 8).toFixed(1)} días)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Modalidad de Permiso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setToForm({ ...toForm, tipo: 'horas', cantidad: 4 })}
                    className={`p-3 rounded-xl border text-left transition ${
                      toForm.tipo === 'horas'
                        ? 'bg-amber-950/40 border-amber-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">Por Horas</div>
                    <div className="text-[10px] text-zinc-400">Salidas tempranas o permisos parciales</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToForm({ ...toForm, tipo: 'dias', cantidad: 1 })}
                    className={`p-3 rounded-xl border text-left transition ${
                      toForm.tipo === 'dias'
                        ? 'bg-amber-950/40 border-amber-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">Día(s) Completo(s)</div>
                    <div className="text-[10px] text-zinc-400">1 día = 8 horas de deducción</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    {toForm.tipo === 'dias' ? 'Cantidad de Días' : 'Cantidad de Horas'}
                  </label>
                  <input
                    type="number"
                    step={toForm.tipo === 'dias' ? '0.5' : '1'}
                    min="0.5"
                    required
                    value={toForm.cantidad}
                    onChange={(e) => setToForm({ ...toForm, cantidad: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Goce / Permiso</label>
                  <input
                    type="date"
                    required
                    value={toForm.fechaDisfrute}
                    onChange={(e) => setToForm({ ...toForm, fechaDisfrute: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Real time simulation balance banner */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                simulatedRemaining < 0
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}>
                <div>
                  <span className="text-zinc-400">Saldo actual: </span>
                  <strong>{activeEmpForTimeOff?.saldoHoras ?? 0}h</strong>
                  <span className="mx-2">➔</span>
                  <span className="text-zinc-400">Descontará: </span>
                  <strong className="text-amber-400">-{requiredHours}h</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Quedará en: </span>
                  <strong className={simulatedRemaining < 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {simulatedRemaining}h
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo del Permiso</label>
                <input
                  type="text"
                  required
                  value={toForm.motivo}
                  onChange={(e) => setToForm({ ...toForm, motivo: e.target.value })}
                  placeholder="Ej: Asuntos personales / Cita médica / Trámites"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Worker PIN authorization requirement */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Código Único del Trabajador (PIN) *</span>
                  </label>
                  {activeTechnicianSession?.id === toForm.empleadoId && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                      ✓ Autenticado en sesión activa
                    </span>
                  )}
                </div>

                {activeTechnicianSession?.id === toForm.empleadoId ? (
                  <p className="text-[11px] text-zinc-400">
                    Estás identificado como <strong className="text-white">{activeTechnicianSession.nombre}</strong>. Solicitud protegida con tu código.
                  </p>
                ) : (
                  <div>
                    <input
                      type="password"
                      required
                      value={toPin}
                      onChange={(e) => setToPin(e.target.value)}
                      placeholder="Ingresa el PIN único del solicitante o PIN de supervisión"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-mono text-center tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Evita que se soliciten o descuenten libres en cuentas que no te corresponden.
                    </span>
                  </div>
                )}

                {toPinError && (
                  <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{toPinError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTimeOffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={simulatedRemaining < 0}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow"
                >
                  Confirmar Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Añadir Nuevo Trabajador */}
      {isNewEmpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              Registrar Nuevo Trabajador
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ingresa los datos para incorporarlo al sistema de turnos broadcast y control de horas extras.
            </p>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={empForm.nombre}
                  onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })}
                  placeholder="Ej: Marco Benalcázar"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Código de Turno *</label>
                  <input
                    type="text"
                    required
                    value={empForm.tecnicoCode}
                    onChange={(e) => setEmpForm({ ...empForm, tecnicoCode: e.target.value })}
                    placeholder="Ej: MBenalcazar"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={empForm.cargo}
                    onChange={(e) => setEmpForm({ ...empForm, cargo: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  placeholder="usuario@comunica.gob.ec"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Área Operativa *</label>
                <select
                  value={empForm.area}
                  onChange={(e) => setEmpForm({ ...empForm, area: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="multimedia">Multimedia (Checklist Sistemas, IPs, Horas)</option>
                  <option value="control_tecnico">Control Técnico (Checklist Satelital / Transmisión, Horas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Código Único de Seguridad (PIN) *
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">Requerido para autorizaciones</span>
                </label>
                <input
                  type="text"
                  value={empForm.codigoSeguridad}
                  onChange={(e) => setEmpForm({ ...empForm, codigoSeguridad: e.target.value.toUpperCase() })}
                  placeholder={empForm.tecnicoCode ? `${empForm.tecnicoCode.toUpperCase()}-2026` : 'Ej: MB-2026'}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Este código único personal evitará que otros usuarios alteren las horas de este técnico. Si se deja en blanco se generará automáticamente.
                </span>
              </div>

              {empError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{empError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewEmpModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Modificar / Corregir Horas Extras */}
      {isEditOvertimeModalOpen && editOtForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-cyan-400" />
              Corregir Registro de Horas Extras
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Modifica los datos erróneos. El saldo del trabajador se recalculará automáticamente y se sincronizará con Google Sheets.
            </p>

            <form onSubmit={handleEditOvertimeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Trabajador</label>
                <select
                  required
                  value={editOtForm.empleadoId}
                  onChange={(e) => setEditOtForm({ ...editOtForm, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {cleanEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.tecnicoCode}) - Saldo actual: {emp.saldoHoras}h
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Ejecución</label>
                  <input
                    type="date"
                    required
                    value={editOtForm.fecha}
                    onChange={(e) => setEditOtForm({ ...editOtForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Horas Reales Trabajadas</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={editOtForm.horas}
                    onChange={(e) => setEditOtForm({ ...editOtForm, horas: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Recargo</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    editOtForm.recargo === '0%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="edit_recargo"
                      value="0%"
                      checked={editOtForm.recargo === '0%'}
                      onChange={() => setEditOtForm({ ...editOtForm, recargo: '0%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 0%</div>
                      <div className="text-[10px] text-zinc-400">Sin recargo / Ordinaria (1:1)</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    editOtForm.recargo === '50%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="edit_recargo"
                      value="50%"
                      checked={editOtForm.recargo === '50%'}
                      onChange={() => setEditOtForm({ ...editOtForm, recargo: '50%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 50%</div>
                      <div className="text-[10px] text-zinc-400">Jornada nocturna / suplementaria</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    editOtForm.recargo === '100%' 
                      ? 'bg-blue-950/40 border-cyan-500 text-white shadow-sm' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="edit_recargo"
                      value="100%"
                      checked={editOtForm.recargo === '100%'}
                      onChange={() => setEditOtForm({ ...editOtForm, recargo: '100%' })}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-sm">Al 100%</div>
                      <div className="text-[10px] text-zinc-400">Fines de semana / feriados</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Multiplier toggle option */}
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-medium text-zinc-200">Calcular tiempo compensatorio con factor</div>
                  <div className="text-[11px] text-zinc-500">
                    {editOtForm.recargo === '0%'
                      ? '1 hora trabajada = 1.0h de tiempo libre (compensación 1 a 1 directa)'
                      : editOtForm.recargo === '50%'
                      ? '1 hora trabajada = 1.5h de tiempo libre'
                      : '1 hora trabajada = 2.0h de tiempo libre'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editOtForm.recargo === '0%' ? false : editOtForm.multiplicarFactor}
                  disabled={editOtForm.recargo === '0%'}
                  onChange={(e) => setEditOtForm({ ...editOtForm, multiplicarFactor: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-zinc-800 border-zinc-700 disabled:opacity-40 cursor-pointer"
                />
              </div>

              <div className="bg-cyan-950/30 border border-cyan-900/50 p-3 rounded-xl text-xs text-cyan-300 flex items-center justify-between">
                <span>Total a acreditar corregido:</span>
                <strong className="text-base font-mono text-cyan-400">
                  +{(() => {
                    let factor = 1.0;
                    if (editOtForm.recargo === '0%') factor = 1.0;
                    else if (editOtForm.multiplicarFactor) factor = editOtForm.recargo === '50%' ? 1.5 : 2.0;
                    return (editOtForm.horas * factor).toFixed(1);
                  })()} horas
                </strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo / Tarea realizada</label>
                <input
                  type="text"
                  required
                  value={editOtForm.motivo}
                  onChange={(e) => setEditOtForm({ ...editOtForm, motivo: e.target.value })}
                  placeholder="Ej: Transmisión especial de elecciones / Cobertura cadena"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Worker PIN authorization for Edit */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN Único del Trabajador o Supervisor *</span>
                  </label>
                  {activeTechnicianSession?.id === editOtForm.empleadoId && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                      ✓ Sesión verificada
                    </span>
                  )}
                </div>

                {activeTechnicianSession?.id === editOtForm.empleadoId ? (
                  <p className="text-[11px] text-zinc-400">
                    Estás identificado como titular de este registro.
                  </p>
                ) : (
                  <div>
                    <input
                      type="password"
                      required
                      value={editOtPin}
                      onChange={(e) => setEditOtPin(e.target.value)}
                      placeholder="PIN único del titular o supervisor (ADMIN-2026)"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-mono text-center tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {editOtPinError && (
                  <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{editOtPinError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOvertimeModalOpen(false);
                    setEditOtForm(null);
                    setEditOtPin('');
                    setEditOtPinError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md"
                >
                  Guardar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Confirmación de Eliminación (Sin window.confirm para compatibilidad total con iframe) */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-900/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {entryToDelete.rawType === 'overtime'
                    ? '¿Eliminar Registro de Horas Extras?'
                    : '¿Anular Compensatorio de Tiempo Libre?'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Confirma si deseas retirar este movimiento del registro y actualizar los saldos.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Trabajador:</span>
                <strong className="text-zinc-200">{entryToDelete.empleadoNombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fecha del movimiento:</span>
                <span className="text-zinc-300 font-mono">{entryToDelete.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Detalle:</span>
                <span className="text-zinc-300 max-w-[200px] truncate text-right">{entryToDelete.detalle}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Impacto en Saldo:</span>
                {entryToDelete.rawType === 'overtime' ? (
                  <strong className="text-red-400 font-mono text-sm">-{entryToDelete.deltaHoras} horas</strong>
                ) : (
                  <strong className="text-emerald-400 font-mono text-sm">+{Math.abs(entryToDelete.deltaHoras)} horas</strong>
                )}
              </div>
            </div>

            {/* Worker PIN requirement for Deletion */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Autorización con PIN de {entryToDelete.empleadoNombre} *</span>
              </label>
              <input
                type="password"
                required
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value)}
                placeholder="Ingresa el PIN único del titular o supervisor"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-mono text-center tracking-widest text-cyan-300 focus:outline-none focus:border-red-400"
              />
              <span className="text-[10px] text-zinc-500 block">
                Solo el trabajador titular o el supervisor pueden eliminar este movimiento.
              </span>
              {deletePinError && (
                <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{deletePinError}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px] text-red-300 leading-relaxed">
              {entryToDelete.rawType === 'overtime'
                ? `Al confirmar, se descontarán ${entryToDelete.deltaHoras}h del saldo acumulado del trabajador y se sincronizará automáticamente la hoja de cálculo en Google Sheets.`
                : `Al confirmar, se reintegrarán ${Math.abs(entryToDelete.deltaHoras)}h al saldo del trabajador y se sincronizará automáticamente en Google Sheets.`}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setEntryToDelete(null);
                  setDeletePin('');
                  setDeletePinError(null);
                }}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar Registro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Ajustar Saldo Manualmente */}
      {adjustingEmployee && onUpdateEmployeeBalance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-cyan-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Ajustar Saldo de Horas</h3>
                  <p className="text-xs text-zinc-400">{adjustingEmployee.nombre} ({adjustingEmployee.tecnicoCode})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingEmployee(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Saldo Acumulado (Horas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={adjustBalanceValue}
                    onChange={(e) => setAdjustBalanceValue(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                    placeholder="0.0"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-zinc-500">horas</span>
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdjustBalanceValue('0')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-red-400 hover:text-red-300 text-xs font-medium transition cursor-pointer"
                >
                  Poner a 0.0 h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const empNombreLower = (adjustingEmployee.nombre || '').toLowerCase();
                    const abonos = overtimeLogs
                      .filter((ot) => ot.empleadoId === adjustingEmployee.id || (ot.empleadoNombre && ot.empleadoNombre.toLowerCase() === empNombreLower))
                      .reduce((sum, ot) => sum + (Number(ot.horasEquivalentes) || 0), 0);
                    const deducciones = timeOffDeductions
                      .filter((to) => to.empleadoId === adjustingEmployee.id || (to.empleadoNombre && to.empleadoNombre.toLowerCase() === empNombreLower))
                      .reduce((sum, to) => sum + (Number(to.horasDescontadas) || 0), 0);
                    const saldoNeto = Math.max(0, Number((abonos - deducciones).toFixed(2)));
                    setAdjustBalanceValue(String(saldoNeto));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition cursor-pointer"
                >
                  Calcular según Kardex
                </button>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
                El valor guardado se aplicará inmediatamente a la ficha del trabajador y actualizará su equivalencia en días libres (~{(Number(adjustBalanceValue || 0) / 8).toFixed(1)} días).
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingEmployee(null)}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(adjustBalanceValue);
                  const finalVal = isNaN(val) ? 0 : Math.max(0, val);
                  onUpdateEmployeeBalance(adjustingEmployee.id, finalVal);
                  setAdjustingEmployee(null);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md cursor-pointer"
              >
                Guardar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Confirmar Retiro de Trabajador */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-950/70 border border-red-800/80 text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Retirar Trabajador</h3>
                  <p className="text-xs text-zinc-400">Banco de Horas Extras</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={isDeletingEmployee}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                ¿Estás seguro de que deseas retirar a este trabajador del sistema?
              </p>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Nombre:</span>
                  <span className="font-semibold text-zinc-200">{employeeToDelete.nombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Código Técnico:</span>
                  <span className="font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">{employeeToDelete.tecnicoCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Cargo:</span>
                  <span className="text-zinc-300 truncate max-w-[200px]">{employeeToDelete.cargo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Saldo pendiente:</span>
                  <span className="font-mono font-bold text-emerald-400">{employeeToDelete.saldoHoras} horas</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-[11px] text-red-300 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Al retirar al trabajador, se removerá su tarjeta de saldos y todos sus registros de horas extras y compensaciones en el Kardex local.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={isDeletingEmployee}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmployee}
                disabled={isDeletingEmployee}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDeletingEmployee ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Retirando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Retirar Trabajador</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Códigos de Seguridad (PIN) de Trabajadores */}
      <WorkerPinModal
        isOpen={isWorkerPinModalOpen}
        onClose={() => setIsWorkerPinModalOpen(false)}
        employees={cleanEmployees}
        onUpdateEmployeeCode={onUpdateEmployeeCode || ((id, code) => {})}
        isAdmin={isAdmin}
      />
    </div>
  );
};
