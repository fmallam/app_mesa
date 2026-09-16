import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  BroadcastChecklistRow, 
  IncidentTicket, 
  Employee, 
  OvertimeLog, 
  TimeOffDeduction, 
  ActiveTab,
  CheckStatus,
  IncidentStatus,
  GoogleAccessPolicy,
  ControlTecnicoRow,
  Ipv4Network,
  IpAssignment,
  TechnicianSession
} from './types';
import { 
  INITIAL_CHECKLIST_ROWS, 
  INITIAL_INCIDENTS, 
  INITIAL_EMPLOYEES, 
  INITIAL_OVERTIME_LOGS, 
  INITIAL_TIMEOFF_DEDUCTIONS,
  DEFAULT_ACCESS_POLICY,
  INITIAL_CONTROL_TECNICO_ROWS,
  INITIAL_IPV4_NETWORKS,
  INITIAL_IP_ASSIGNMENTS
} from './mockData';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { BroadcastChecklist } from './components/BroadcastChecklist';
import { ServiceDesk } from './components/ServiceDesk';
import { OvertimeComp } from './components/OvertimeComp';
import { ControlTecnicoChecklist } from './components/ControlTecnicoChecklist';
import { IpManagement } from './components/IpManagement';
import { LoginModal } from './components/LoginModal';
import { GoogleDriveSyncBar } from './components/GoogleDriveSyncBar';
import { AccessControlModal } from './components/AccessControlModal';
import { UnauthorizedAccessScreen } from './components/UnauthorizedAccessScreen';
import { initAuth } from './lib/googleAuth';
import { 
  findOrCreateComunicaSheet, 
  appendChecklistRowToDrive, 
  appendMultipleChecklistRowsToDrive,
  appendIncidentToDrive, 
  appendOvertimeToDrive,
  syncAllRowsToDrive,
  syncAllIncidentsToDrive,
  syncAllOvertimeToDrive,
  syncAllEmployeesToDrive,
  syncAllControlTecnicoToDrive,
  syncAllIpManagementToDrive,
  extractSpreadsheetId,
  ensureSpreadsheetTabsAndHeaders,
  shareSpreadsheetWithAuthorizedTeam,
  readAllFromDriveSpreadsheet,
  CHECKLIST_SPREADSHEET_KEY 
} from './lib/driveSheetsService';
import { 
  getCentralState, 
  pushCentralState, 
  addChecklistRowsCentrally,
  addOvertimeLogCentrally,
  addTimeOffDeductionCentrally,
  addEmployeeCentrally,
  deleteEmployeeCentrally,
  updateEmployeeCodeCentrally,
  markSheetsSyncedCentrally,
  linkCentralSpreadsheet,
  addControlTecnicoRowCentrally,
  deleteControlTecnicoRowCentrally,
  saveNetworksCentrally,
  saveIpAssignmentsCentrally,
  CentralStateData 
} from './lib/centralStateService';
import { 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  ExternalLink, 
  X 
} from 'lucide-react';

interface SyncToast {
  type: 'syncing' | 'success' | 'error' | 'warning';
  message: string;
  sheetUrl?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('checklist');

  // Google Workspace Authentication state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('comunica_google_access_token');
  });

  // Google Access Policy & Security state
  const [accessPolicy, setAccessPolicy] = useState<GoogleAccessPolicy>(() => {
    try {
      const saved = localStorage.getItem('comunica_access_policy');
      return saved ? JSON.parse(saved) : DEFAULT_ACCESS_POLICY;
    } catch {
      return DEFAULT_ACCESS_POLICY;
    }
  });
  const [isAccessControlModalOpen, setIsAccessControlModalOpen] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);

  // Sync access policy to local storage and central state
  useEffect(() => {
    localStorage.setItem('comunica_access_policy', JSON.stringify(accessPolicy));
    if (!isRemoteUpdatingRef.current) {
      pushCentralState({ accessPolicy });
    }
  }, [accessPolicy]);

  const [syncToast, setSyncToast] = useState<SyncToast | null>(null);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persistent States
  const [checklistRows, setChecklistRows] = useState<BroadcastChecklistRow[]>(() => {
    try {
      const saved = localStorage.getItem('comunica_checklist_rows');
      const loaded: BroadcastChecklistRow[] = saved ? JSON.parse(saved) : INITIAL_CHECKLIST_ROWS;
      const updated = loaded.map((r) => {
        if (
          r.programa &&
          r.programa.trim().toLowerCase() === 'noticiero central' &&
          (r.hora === '13h00' || r.hora === '13:00')
        ) {
          return { ...r, hora: '12h30' };
        }
        return r;
      });
      localStorage.setItem('comunica_checklist_rows', JSON.stringify(updated));
      return updated;
    } catch {
      return INITIAL_CHECKLIST_ROWS;
    }
  });

  const [incidents, setIncidents] = useState<IncidentTicket[]>(() => {
    try {
      const saved = localStorage.getItem('comunica_incidents');
      return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
    } catch {
      return INITIAL_INCIDENTS;
    }
  });

  // Sanitize employees to ensure only official technicians DQuevedo and Fmalla are default
  // and eliminate test users, deleted entries, and temporary records
  const sanitizeEmployees = (emps: Employee[]): Employee[] => {
    if (!Array.isArray(emps) || emps.length === 0) return INITIAL_EMPLOYEES;
    const unwantedCodes = ['CAlvarado', 'JMendoza', 'flopez'];

    let deletedCodes: string[] = [];
    try {
      deletedCodes = JSON.parse(localStorage.getItem('comunica_deleted_employee_codes') || '[]');
    } catch {
      deletedCodes = [];
    }

    let cleaned = emps
      .filter((emp) => {
        if (!emp) return false;
        if (unwantedCodes.includes(emp.tecnicoCode)) return false;
        if (deletedCodes.includes(emp.tecnicoCode)) return false;
        const n = (emp.nombre || '').trim().toLowerCase();
        const code = (emp.tecnicoCode || '').trim().toLowerCase();
        if (n === 'test' || code === 'test') return false;
        return true;
      })
      .map((emp) => {
        if (emp.tecnicoCode === 'DQuevedo') {
          return {
            ...emp,
            nombre: 'Darwin Quevedo',
            cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
            email: 'dquevedo@comunica.ec',
            saldoHoras: 0,
            codigoSeguridad: emp.codigoSeguridad || 'DQ-2026',
          };
        }
        if (emp.tecnicoCode === 'Fmalla' && (!emp.nombre.includes('Freddy') || emp.nombre.includes('Fabricio'))) {
          return {
            ...emp,
            nombre: 'Freddy Malla',
            cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
            email: 'fmalla@comunica.ec',
            codigoSeguridad: emp.codigoSeguridad || 'FM-2026',
          };
        }
        return {
          ...emp,
          codigoSeguridad: emp.codigoSeguridad || `${(emp.tecnicoCode || 'EMP').toUpperCase()}-2026`,
        };
      });

    if (!cleaned.some((e) => e.tecnicoCode === 'DQuevedo')) {
      cleaned.unshift({
        id: 'emp-1',
        nombre: 'Darwin Quevedo',
        cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
        tecnicoCode: 'DQuevedo',
        email: 'dquevedo@comunica.ec',
        saldoHoras: 0,
        codigoSeguridad: 'DQ-2026',
      });
    }
    if (!cleaned.some((e) => e.tecnicoCode === 'Fmalla')) {
      let isDeleted = false;
      try {
        const deletedCodes = JSON.parse(localStorage.getItem('comunica_deleted_employee_codes') || '[]');
        isDeleted = deletedCodes.includes('Fmalla');
      } catch {
        isDeleted = false;
      }
      if (!isDeleted) {
        cleaned.push({
          id: 'emp-2',
          nombre: 'Freddy Malla',
          cargo: 'Analista de Sistemas y Multimedia Broadcasting 2',
          tecnicoCode: 'Fmalla',
          email: 'fmalla@comunica.ec',
          saldoHoras: 0,
          codigoSeguridad: 'FM-2026',
        });
      }
    }
    return cleaned;
  };

  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>(() => {
    try {
      const saved = localStorage.getItem('comunica_overtime_logs');
      const loaded: OvertimeLog[] = saved ? JSON.parse(saved) : INITIAL_OVERTIME_LOGS;
      const cleaned = loaded.filter((ot) => {
        const empName = (ot.empleadoNombre || '').toLowerCase();
        const empId = (ot.empleadoId || '').toLowerCase();
        const isDarwin = empName === 'darwin quevedo' || empId === 'emp-1' || empId === 'dquevedo';
        return !isDarwin;
      });
      localStorage.setItem('comunica_overtime_logs', JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return INITIAL_OVERTIME_LOGS;
    }
  });

  const [timeOffDeductions, setTimeOffDeductions] = useState<TimeOffDeduction[]>(() => {
    try {
      const saved = localStorage.getItem('comunica_timeoff_deductions');
      const loaded: TimeOffDeduction[] = saved ? JSON.parse(saved) : INITIAL_TIMEOFF_DEDUCTIONS;
      const cleaned = loaded.filter((to) => {
        const empName = (to.empleadoNombre || '').toLowerCase();
        const empId = (to.empleadoId || '').toLowerCase();
        const isDarwin = empName === 'darwin quevedo' || empId === 'emp-1' || empId === 'dquevedo';
        return !isDarwin;
      });
      localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return INITIAL_TIMEOFF_DEDUCTIONS;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('comunica_employees');
      const loaded = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
      const sanitized = sanitizeEmployees(loaded);

      // Cargar logs guardados para cuadrar saldo si el usuario borró todo
      const savedLogs = localStorage.getItem('comunica_overtime_logs');
      const currentLogs: OvertimeLog[] = savedLogs ? JSON.parse(savedLogs) : INITIAL_OVERTIME_LOGS;
      const savedDeductions = localStorage.getItem('comunica_timeoff_deductions');
      const currentDeductions: TimeOffDeduction[] = savedDeductions ? JSON.parse(savedDeductions) : INITIAL_TIMEOFF_DEDUCTIONS;

      const synced = sanitized.map((emp) => {
        const n = (emp.nombre || '').toLowerCase();
        const empLogs = currentLogs.filter(
          (ot) => ot.empleadoId === emp.id || (ot.empleadoNombre && ot.empleadoNombre.toLowerCase() === n)
        );
        const empDeds = currentDeductions.filter(
          (to) => to.empleadoId === emp.id || (to.empleadoNombre && to.empleadoNombre.toLowerCase() === n)
        );

        // Si no existen horas extras registradas para este empleado, su saldo debe ser 0
        if (empLogs.length === 0) {
          return { ...emp, saldoHoras: 0 };
        }

        // Si existen movimientos, el saldo debe ser igual a abonos - deducciones
        const abonos = empLogs.reduce((acc, ot) => acc + (Number(ot.horasEquivalentes) || 0), 0);
        const deducciones = empDeds.reduce((acc, to) => acc + (Number(to.horasDescontadas) || 0), 0);
        const saldoExacto = Math.max(0, Number((abonos - deducciones).toFixed(2)));
        return { ...emp, saldoHoras: saldoExacto };
      });

      localStorage.setItem('comunica_employees', JSON.stringify(synced));
      return synced;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  // Auto-dismiss success or warning toasts after 6 seconds
  useEffect(() => {
    if (syncToast && (syncToast.type === 'success' || syncToast.type === 'warning')) {
      const timer = setTimeout(() => {
        setSyncToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  const [pendingSheetsSync, setPendingSheetsSync] = useState<boolean>(false);
  const [lastSheetsSyncTime, setLastSheetsSyncTime] = useState<number | null>(null);

  const lastRevisionRef = React.useRef<number>(0);
  const isInitializedRef = React.useRef<boolean>(false);
  const isRemoteUpdatingRef = React.useRef<boolean>(false);
  const isAutoSyncingSheetsRef = React.useRef<boolean>(false);

  // Auto-sync local state to central server
  const saveStateCentrally = (partial: Partial<CentralStateData>) => {
    if (!isInitializedRef.current || isRemoteUpdatingRef.current) return;
    pushCentralState({ ...partial, pendingSheetsSync: true }).then((res) => {
      if (res && res.revision) {
        lastRevisionRef.current = res.revision;
      }
    });
  };

  // Sync to local storage and push to central server
  useEffect(() => {
    localStorage.setItem('comunica_checklist_rows', JSON.stringify(checklistRows));
    saveStateCentrally({ checklistRows });
  }, [checklistRows]);

  useEffect(() => {
    localStorage.setItem('comunica_incidents', JSON.stringify(incidents));
    saveStateCentrally({ incidents });
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('comunica_employees', JSON.stringify(employees));
    saveStateCentrally({ employees });
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('comunica_overtime_logs', JSON.stringify(overtimeLogs));
    saveStateCentrally({ overtimeLogs });
  }, [overtimeLogs]);

  useEffect(() => {
    localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(timeOffDeductions));
    saveStateCentrally({ timeOffDeductions });
  }, [timeOffDeductions]);

  // Background Google Sheets synchronization when central state has pending changes
  const backgroundSyncToGoogleSheets = async (token: string, data: CentralStateData) => {
    if (isAutoSyncingSheetsRef.current) return;
    isAutoSyncingSheetsRef.current = true;
    try {
      let sheetId = data.spreadsheetId || localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
      if (!sheetId) {
        const sheet = await findOrCreateComunicaSheet(token);
        sheetId = sheet.id;
      }
      if (data.checklistRows && data.checklistRows.length > 0) {
        await syncAllRowsToDrive(token, sheetId, data.checklistRows);
      }
      if (data.incidents && data.incidents.length > 0) {
        await syncAllIncidentsToDrive(token, sheetId, data.incidents);
      }
      // Always sync overtime logs and deductions (even if empty, to clear removed rows from sheets)
      await syncAllOvertimeToDrive(
        token, 
        sheetId, 
        data.overtimeLogs || [], 
        data.timeOffDeductions || [],
        data.employees || []
      );
      if (data.employees && data.employees.length > 0) {
        await syncAllEmployeesToDrive(token, sheetId, data.employees);
      }
      await markSheetsSyncedCentrally();
      setPendingSheetsSync(false);
      setLastSheetsSyncTime(Date.now());
      console.log('Google Sheets automatically kept up to date with central server.');
    } catch (err) {
      console.warn('Background sync to Google Sheets error:', err);
    } finally {
      isAutoSyncingSheetsRef.current = false;
    }
  };

  // Load and subscribe to central state from server (cross-user & cross-device)
  const loadStateFromServer = async () => {
    try {
      const data = await getCentralState();
      if (!data) return;

      if (data.pendingSheetsSync !== undefined) {
        setPendingSheetsSync(data.pendingSheetsSync);
      }
      if (data.lastSheetsSyncTime !== undefined) {
        setLastSheetsSyncTime(data.lastSheetsSyncTime);
      }

      // If revision is already applied locally, only trigger Google Sheets sync if needed
      if (data.revision && data.revision <= lastRevisionRef.current) {
        if (googleAccessToken && data.pendingSheetsSync && !isAutoSyncingSheetsRef.current) {
          backgroundSyncToGoogleSheets(googleAccessToken, data);
        }
        return;
      }

      isRemoteUpdatingRef.current = true;
      lastRevisionRef.current = data.revision || 1;

      if (data.employees) {
        const sanitized = sanitizeEmployees(data.employees);
        setEmployees(sanitized);
        localStorage.setItem('comunica_employees', JSON.stringify(sanitized));
      }
      if (data.checklistRows) {
        setChecklistRows(data.checklistRows);
        localStorage.setItem('comunica_checklist_rows', JSON.stringify(data.checklistRows));
      }
      if (data.incidents) {
        setIncidents(data.incidents);
        localStorage.setItem('comunica_incidents', JSON.stringify(data.incidents));
      }
      if (data.overtimeLogs) {
        setOvertimeLogs(data.overtimeLogs);
        localStorage.setItem('comunica_overtime_logs', JSON.stringify(data.overtimeLogs));
      }
      if (data.timeOffDeductions) {
        setTimeOffDeductions(data.timeOffDeductions);
        localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(data.timeOffDeductions));
      }
      if (data.accessPolicy) {
        setAccessPolicy(data.accessPolicy);
        localStorage.setItem('comunica_access_policy', JSON.stringify(data.accessPolicy));
      }
      if (data.spreadsheetId) {
        localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, data.spreadsheetId);
      }

      // If current user is logged in with Google and there are pending changes for Sheets, sync now
      if (googleAccessToken && data.pendingSheetsSync && !isAutoSyncingSheetsRef.current) {
        backgroundSyncToGoogleSheets(googleAccessToken, data);
      }

      setTimeout(() => {
        isRemoteUpdatingRef.current = false;
      }, 150);
    } catch (err) {
      console.warn('Error fetching central state:', err);
      isRemoteUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    getCentralState().then(async (data) => {
      if (!data || (!data.checklistRows?.length && !data.employees?.length)) {
        const res = await pushCentralState({
          employees,
          checklistRows,
          incidents,
          overtimeLogs,
          timeOffDeductions,
          accessPolicy,
          spreadsheetId: localStorage.getItem(CHECKLIST_SPREADSHEET_KEY) || null,
        });
        if (res.revision) lastRevisionRef.current = res.revision;
        isInitializedRef.current = true;
      } else {
        isRemoteUpdatingRef.current = true;
        lastRevisionRef.current = data.revision || 1;
        if (data.pendingSheetsSync !== undefined) setPendingSheetsSync(data.pendingSheetsSync);
        if (data.lastSheetsSyncTime !== undefined) setLastSheetsSyncTime(data.lastSheetsSyncTime);

        if (data.employees && data.employees.length > 0) {
          setEmployees(sanitizeEmployees(data.employees));
          localStorage.setItem('comunica_employees', JSON.stringify(data.employees));
        }
        if (data.checklistRows && data.checklistRows.length > 0) {
          setChecklistRows(data.checklistRows);
          localStorage.setItem('comunica_checklist_rows', JSON.stringify(data.checklistRows));
        }
        if (data.incidents && data.incidents.length > 0) {
          setIncidents(data.incidents);
          localStorage.setItem('comunica_incidents', JSON.stringify(data.incidents));
        }
        if (data.overtimeLogs && data.overtimeLogs.length > 0) {
          setOvertimeLogs(data.overtimeLogs);
          localStorage.setItem('comunica_overtime_logs', JSON.stringify(data.overtimeLogs));
        }
        if (data.timeOffDeductions && data.timeOffDeductions.length > 0) {
          setTimeOffDeductions(data.timeOffDeductions);
          localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(data.timeOffDeductions));
        }
        if (data.accessPolicy) {
          setAccessPolicy(data.accessPolicy);
          localStorage.setItem('comunica_access_policy', JSON.stringify(data.accessPolicy));
        }
        if (data.spreadsheetId) {
          localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, data.spreadsheetId);
        }

        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
          isInitializedRef.current = true;
        }, 200);
      }
    });

    const interval = setInterval(loadStateFromServer, 2500);
    const handleFocus = () => loadStateFromServer();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [googleAccessToken]);

  // Si no existen horas extras registradas para un trabajador (o se borraron todas), su saldo se ajusta a 0 automáticamente
  useEffect(() => {
    setEmployees((prevEmps) => {
      let hasChanges = false;
      const updated = prevEmps.map((emp) => {
        const n = (emp.nombre || '').toLowerCase();
        const code = (emp.tecnicoCode || '').toLowerCase();
        if (n.includes('darwin') || n.includes('quevedo') || code === 'dquevedo') {
          if (emp.saldoHoras !== 0) {
            hasChanges = true;
            return { ...emp, saldoHoras: 0 };
          }
          return emp;
        }

        const empLogs = overtimeLogs.filter(
          (ot) => ot.empleadoId === emp.id || (ot.empleadoNombre && ot.empleadoNombre.toLowerCase() === n)
        );

        // Si se borraron todas las horas extras de este empleado, su saldo DEBE ser 0
        if (empLogs.length === 0 && emp.saldoHoras !== 0) {
          hasChanges = true;
          return { ...emp, saldoHoras: 0 };
        }

        return emp;
      });

      return hasChanges ? updated : prevEmps;
    });
  }, [overtimeLogs]);

  // Handlers for Broadcast Checklist
  const handleAddChecklistRow = async (newRowData: Omit<BroadcastChecklistRow, 'id'>) => {
    // Validate that this turn is not duplicate for this date
    const normHNew = (newRowData.hora || '').trim().toLowerCase().replace(':', 'h');
    const normPNew = (newRowData.programa || '').trim().toLowerCase();
    const isDuplicate = checklistRows.some((r) => {
      if (r.fecha !== newRowData.fecha) return false;
      const rH = (r.hora || '').trim().toLowerCase().replace(':', 'h');
      const rP = (r.programa || '').trim().toLowerCase();
      return rH === normHNew || rP === normPNew;
    });

    if (isDuplicate) {
      setSyncToast({
        type: 'warning',
        message: `El turno de "${newRowData.programa}" (${newRowData.hora}) para el ${newRowData.fecha} ya existe. Los turnos diarios de una fecha solo pueden ser ingresados una sola vez.`,
      });
      return;
    }

    const newRow: BroadcastChecklistRow = {
      ...newRowData,
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    // 1. Atomically register on central server so all other accounts (admin & technicians) instantly see it
    const centralRes = await addChecklistRowsCentrally([newRow]);
    if (centralRes.success && centralRes.state?.checklistRows) {
      setChecklistRows(centralRes.state.checklistRows);
      localStorage.setItem('comunica_checklist_rows', JSON.stringify(centralRes.state.checklistRows));
      if (centralRes.revision) lastRevisionRef.current = centralRes.revision;
    } else {
      setChecklistRows((prev) => [newRow, ...prev]);
    }

    // 2. Automatically sync to Google Drive & Sheets if connected
    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: `Sincronizando turno "${newRow.programa}" en Google Drive...`,
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        let sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : undefined;

        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
          sheetUrl = sheet.url;
        }

        await appendChecklistRowToDrive(googleAccessToken, sheetId, newRow);
        await markSheetsSyncedCentrally();
        setPendingSheetsSync(false);

        setSyncToast({
          type: 'success',
          message: `¡Turno "${newRow.programa}" guardado en tu Google Sheet y base central!`,
          sheetUrl: sheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error auto-syncing row to Google Drive:', e);
        if (e.message?.includes('401')) {
          setGoogleAccessToken(null);
          setSyncToast({
            type: 'error',
            message: 'La sesión de Google expiró. Haz clic en "Conectar con Google Drive" para reactivar.',
          });
        } else {
          setSyncToast({
            type: 'error',
            message: `Guardado en base central. Error al escribir en Google Sheets: ${e.message || 'Error en Sheets API'}`,
          });
        }
      } finally {
        setIsSyncingGlobal(false);
      }
    } else {
      setSyncToast({
        type: 'success',
        message: `¡Turno "${newRow.programa}" guardado en la base de datos central en tiempo real!`,
      });
    }
  };

  const handleAddMultipleChecklistRows = async (newRowsData: Omit<BroadcastChecklistRow, 'id'>[]) => {
    // Filter out any row whose date + hour/program already exists in checklistRows
    const nonDuplicates = newRowsData.filter((row) => {
      const normH = (row.hora || '').trim().toLowerCase().replace(':', 'h');
      const normP = (row.programa || '').trim().toLowerCase();
      return !checklistRows.some((r) => {
        if (r.fecha !== row.fecha) return false;
        const rH = (r.hora || '').trim().toLowerCase().replace(':', 'h');
        const rP = (r.programa || '').trim().toLowerCase();
        return rH === normH || rP === normP;
      });
    });

    if (nonDuplicates.length === 0) {
      setSyncToast({
        type: 'warning',
        message: 'Todos los turnos seleccionados ya fueron ingresados previamente para esa fecha. No se agregaron duplicados.',
      });
      return;
    }

    const timestamp = Date.now();
    const newRows: BroadcastChecklistRow[] = nonDuplicates.map((row, idx) => ({
      ...row,
      id: `chk-${timestamp}-${idx}`,
    }));

    // Atomically persist to central server
    const centralRes = await addChecklistRowsCentrally(newRows);
    if (centralRes.success && centralRes.state?.checklistRows) {
      setChecklistRows(centralRes.state.checklistRows);
      localStorage.setItem('comunica_checklist_rows', JSON.stringify(centralRes.state.checklistRows));
      if (centralRes.revision) lastRevisionRef.current = centralRes.revision;
    } else {
      setChecklistRows((prev) => [...newRows, ...prev]);
    }

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: `Sincronizando ${newRows.length} registros en Google Drive...`,
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        let sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : undefined;

        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
          sheetUrl = sheet.url;
        }

        await appendMultipleChecklistRowsToDrive(googleAccessToken, sheetId, newRows);
        await markSheetsSyncedCentrally();
        setPendingSheetsSync(false);

        setSyncToast({
          type: 'success',
          message: `¡${newRows.length} registros sincronizados en la base central y Google Sheets!`,
          sheetUrl: sheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error batch syncing:', e);
        setSyncToast({
          type: 'error',
          message: `Guardado en base central. Error en Google Drive: ${e.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    } else {
      setSyncToast({
        type: 'success',
        message: `¡${newRows.length} registros guardados en la base de datos central en tiempo real!`,
      });
    }
  };

  const handleCleanDuplicateRows = async () => {
    const seen = new Set<string>();
    const uniqueRows: BroadcastChecklistRow[] = [];
    let duplicateCount = 0;

    checklistRows.forEach((row) => {
      const normH = (row.hora || '').trim().toLowerCase().replace(':', 'h');
      const normP = (row.programa || '').trim().toLowerCase();
      const key = `${row.fecha}_${normH}_${normP}`;
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
        uniqueRows.push(row);
      }
    });

    if (duplicateCount === 0) {
      setSyncToast({
        type: 'success',
        message: 'No se encontraron turnos duplicados.',
      });
      return;
    }

    setChecklistRows(uniqueRows);

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: `Eliminando ${duplicateCount} turnos duplicados en Google Sheets...`,
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
        }

        await syncAllRowsToDrive(googleAccessToken, sheetId, uniqueRows);

        setSyncToast({
          type: 'success',
          message: `Se depuraron ${duplicateCount} turnos duplicados y tu Google Sheet quedó sincronizado.`,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (err: any) {
        console.error('Error syncing after clean duplicates:', err);
        setSyncToast({
          type: 'error',
          message: `Turnos depurados en la app, pero falló la sincronización con Google Sheets: ${err.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    } else {
      setSyncToast({
        type: 'success',
        message: `Se eliminaron ${duplicateCount} turnos duplicados del checklist local.`,
      });
    }
  };

  const handleUpdateCellStatus = (
    rowId: string, 
    field: keyof BroadcastChecklistRow, 
    newStatus: CheckStatus
  ) => {
    setChecklistRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return { ...row, [field]: newStatus };
        }
        return row;
      })
    );
  };

  const handleUpdateRow = async (
    rowId: string, 
    updates: Partial<BroadcastChecklistRow>
  ) => {
    const updatedRows = checklistRows.map((row) =>
      row.id === rowId ? { ...row, ...updates } : row
    );
    setChecklistRows(updatedRows);

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: 'Guardando cambios en Google Sheets...',
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
        }

        await syncAllRowsToDrive(googleAccessToken, sheetId, updatedRows);

        setSyncToast({
          type: 'success',
          message: 'Registro actualizado en Google Sheets.',
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error al sincronizar edición con Google Sheets:', e);
        setSyncToast({
          type: 'error',
          message: `Modificado en la app, pero falló en Google Sheets: ${e.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    const updatedRows = checklistRows.filter((row) => row.id !== rowId);
    setChecklistRows(updatedRows);

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: 'Eliminando registro y actualizando Google Sheets...',
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
        }

        await syncAllRowsToDrive(googleAccessToken, sheetId, updatedRows);

        setSyncToast({
          type: 'success',
          message: 'Fila eliminada y Google Sheet actualizado correctamente.',
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error al actualizar Google Sheet tras borrar fila:', e);
        setSyncToast({
          type: 'error',
          message: `Fila eliminada en la app, pero hubo un error en Google Sheets: ${e.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    } else {
      setSyncToast({
        type: 'warning',
        message: 'Fila eliminada localmente. Para reflejar la eliminación en tu Google Sheet, conecta tu cuenta de Google Drive en la barra superior o presiona "Sincronizar ahora".',
      });
    }
  };

  // Handlers for Service Desk Incidents
  const handleAddIncident = async (ticketData: Omit<IncidentTicket, 'id' | 'codigo'>) => {
    const count = incidents.length + 1;
    const code = `INC-2026-${String(count).padStart(3, '0')}`;
    const newTicket: IncidentTicket = {
      ...ticketData,
      id: `inc-${Date.now()}`,
      codigo: code,
    };
    setIncidents((prev) => [newTicket, ...prev]);

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        setSyncToast({
          type: 'syncing',
          message: `Guardando incidencia ${code} en Google Drive...`,
        });

        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
        }

        await appendIncidentToDrive(googleAccessToken, sheetId, newTicket);

        setSyncToast({
          type: 'success',
          message: `Incidencia ${code} guardada en pestaña "Mesa Incidencias" de Google Drive`,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error syncing incident to Drive:', e);
        setSyncToast({
          type: 'error',
          message: `Error al guardar incidencia en Drive: ${e.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    }
  };

  const handleUpdateIncidentStatus = async (
    id: string, 
    newStatus: IncidentStatus, 
    solucion?: string
  ) => {
    const updatedIncidents = incidents.map((inc) => {
      if (inc.id === id) {
        const updated: IncidentTicket = { ...inc, estado: newStatus };
        if (newStatus === 'resuelto' && solucion) {
          updated.solucionAplicada = solucion;
          updated.fechaSolucion = new Date().toISOString().replace('T', ' ').slice(0, 16);
        }
        return updated;
      }
      return inc;
    });
    setIncidents(updatedIncidents);

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllIncidentsToDrive(googleAccessToken, sheetId, updatedIncidents);
        }
      } catch (err) {
        console.error('Error al sincronizar estado de incidencia con Google Sheets:', err);
      }
    }
  };

  const handleUpdateIncident = async (updatedIncident: IncidentTicket) => {
    const updatedIncidents = incidents.map((inc) =>
      inc.id === updatedIncident.id ? updatedIncident : inc
    );
    setIncidents(updatedIncidents);

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllIncidentsToDrive(googleAccessToken, sheetId, updatedIncidents);
        }
      } catch (err) {
        console.error('Error al sincronizar actualización de incidencia con Google Sheets:', err);
      }
    }
  };

  const handleDeleteIncident = async (id: string) => {
    const updatedIncidents = incidents.filter((inc) => inc.id !== id);
    setIncidents(updatedIncidents);

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllIncidentsToDrive(googleAccessToken, sheetId, updatedIncidents);
        }
      } catch (err) {
        console.error('Error al sincronizar eliminación de incidencia con Google Sheets:', err);
      }
    }
  };

  // Handlers for Overtime & Compensations
  const handleAddOvertime = async (logData: Omit<OvertimeLog, 'id' | 'creadoEn'>) => {
    const emp = employees.find((e) => e.id === logData.empleadoId);
    const empNombre = emp ? emp.nombre : 'Técnico';

    const newLog: OvertimeLog = {
      ...logData,
      empleadoNombre: empNombre,
      id: `ot-${Date.now()}`,
      creadoEn: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // 1. Atomically register on central server so all other accounts instantly see it
    const centralRes = await addOvertimeLogCentrally(newLog);
    if (centralRes.success && centralRes.state) {
      if (centralRes.state.overtimeLogs) {
        setOvertimeLogs(centralRes.state.overtimeLogs);
        localStorage.setItem('comunica_overtime_logs', JSON.stringify(centralRes.state.overtimeLogs));
      }
      if (centralRes.state.employees) {
        setEmployees(sanitizeEmployees(centralRes.state.employees));
        localStorage.setItem('comunica_employees', JSON.stringify(centralRes.state.employees));
      }
      if (centralRes.revision) lastRevisionRef.current = centralRes.revision;
    } else {
      setOvertimeLogs((prev) => [newLog, ...prev]);
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === logData.empleadoId) {
            const updatedSaldo = Number((e.saldoHoras + logData.horasEquivalentes).toFixed(2));
            return { ...e, saldoHoras: updatedSaldo };
          }
          return e;
        })
      );
    }

    if (googleAccessToken) {
      try {
        setIsSyncingGlobal(true);
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (!sheetId) {
          const sheet = await findOrCreateComunicaSheet(googleAccessToken);
          sheetId = sheet.id;
        }

        await appendOvertimeToDrive(googleAccessToken, sheetId, {
          tipo: 'HORAS EXTRAS',
          tecnico: empNombre,
          fecha: newLog.fecha,
          motivo: `Recargo ${newLog.recargo} - Equiv: ${newLog.horasEquivalentes}h`,
          horas: newLog.horasRealizadas,
          detalle: newLog.motivo,
          registradoEn: newLog.creadoEn,
        });

        await markSheetsSyncedCentrally();
        setPendingSheetsSync(false);

        setSyncToast({
          type: 'success',
          message: `Horas extras de ${empNombre} registradas en Google Sheets y base central`,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } catch (e: any) {
        console.error('Error syncing overtime:', e);
        setSyncToast({
          type: 'warning',
          message: `Horas guardadas en la base central. Error al sincronizar con Google Sheets: ${e.message}`,
        });
      } finally {
        setIsSyncingGlobal(false);
      }
    } else {
      setSyncToast({
        type: 'success',
        message: `¡Horas extras de ${empNombre} registradas en la base central en tiempo real!`,
      });
    }
  };

  const handleApplyTimeOff = async (
    deductionData: Omit<TimeOffDeduction, 'id' | 'creadoEn' | 'saldoPrevio' | 'saldoRestante'>
  ): Promise<{ success: boolean; error?: string }> => {
    const emp = employees.find((e) => e.id === deductionData.empleadoId);
    if (!emp) return { success: false, error: 'Trabajador no encontrado.' };

    if (emp.saldoHoras < deductionData.horasDescontadas) {
      return { 
        success: false, 
        error: `Saldo insuficiente. Tiene ${emp.saldoHoras}h y se solicitan ${deductionData.horasDescontadas}h.` 
      };
    }

    const saldoPrevio = emp.saldoHoras;
    const saldoRestante = Number((saldoPrevio - deductionData.horasDescontadas).toFixed(2));

    const newDeduction: TimeOffDeduction = {
      ...deductionData,
      empleadoNombre: emp.nombre,
      id: `to-${Date.now()}`,
      saldoPrevio: saldoPrevio,
      saldoRestante: saldoRestante,
      creadoEn: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // 1. Atomically register deduction on central server
    const centralRes = await addTimeOffDeductionCentrally(newDeduction);
    if (centralRes.success && centralRes.state) {
      if (centralRes.state.timeOffDeductions) {
        setTimeOffDeductions(centralRes.state.timeOffDeductions);
        localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(centralRes.state.timeOffDeductions));
      }
      if (centralRes.state.employees) {
        setEmployees(sanitizeEmployees(centralRes.state.employees));
        localStorage.setItem('comunica_employees', JSON.stringify(centralRes.state.employees));
      }
      if (centralRes.revision) lastRevisionRef.current = centralRes.revision;
    } else {
      setTimeOffDeductions((prev) => [newDeduction, ...prev]);
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === deductionData.empleadoId) {
            return { ...e, saldoHoras: saldoRestante };
          }
          return e;
        })
      );
    }

    if (googleAccessToken) {
      (async () => {
        try {
          setIsSyncingGlobal(true);
          let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
          if (!sheetId) {
            const sheet = await findOrCreateComunicaSheet(googleAccessToken);
            sheetId = sheet.id;
          }

          await appendOvertimeToDrive(googleAccessToken, sheetId, {
            tipo: 'COMPENSATORIO',
            tecnico: emp.nombre,
            fecha: deductionData.fechaDisfrute,
            motivo: `Descanso Compensatorio (${deductionData.tipo})`,
            horas: -deductionData.horasDescontadas,
            detalle: `${deductionData.motivo || 'Descanso programado'} | Saldo anterior: ${saldoPrevio}h -> Nuevo saldo: ${saldoRestante}h`,
            registradoEn: newDeduction.creadoEn,
          });

          await markSheetsSyncedCentrally();
          setPendingSheetsSync(false);

          setSyncToast({
            type: 'success',
            message: `Deducción de tiempo libre de ${emp.nombre} registrada en Google Sheets y base central`,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          });
        } catch (e: any) {
          console.error('Error syncing time off to Drive:', e);
          setSyncToast({
            type: 'warning',
            message: `Descuento aplicado en base central. Error en Google Sheets: ${e.message}`,
          });
        } finally {
          setIsSyncingGlobal(false);
        }
      })();
    } else {
      setSyncToast({
        type: 'success',
        message: `¡Deducción de tiempo libre de ${emp.nombre} registrada en la base central en tiempo real!`,
      });
    }

    return { success: true };
  };

  const handleAddEmployee = async (newEmpData: Omit<Employee, 'id' | 'saldoHoras'>): Promise<Employee> => {
    // If adding a previously deleted code, unmark it
    try {
      const deletedCodes = JSON.parse(localStorage.getItem('comunica_deleted_employee_codes') || '[]');
      const filteredCodes = deletedCodes.filter((c: string) => c !== newEmpData.tecnicoCode);
      localStorage.setItem('comunica_deleted_employee_codes', JSON.stringify(filteredCodes));
    } catch {
      // ignore
    }

    const newEmp: Employee = {
      ...newEmpData,
      id: `emp-${Date.now()}`,
      saldoHoras: 0,
    };

    // Atomically persist to central server
    const centralRes = await addEmployeeCentrally(newEmp);
    if (centralRes.success && centralRes.state?.employees) {
      setEmployees(sanitizeEmployees(centralRes.state.employees));
      localStorage.setItem('comunica_employees', JSON.stringify(centralRes.state.employees));
      if (centralRes.revision) lastRevisionRef.current = centralRes.revision;
    } else {
      setEmployees((prev) => [...prev, newEmp]);
    }

    setSyncToast({
      type: 'success',
      message: `Trabajador ${newEmp.nombre} (${newEmp.tecnicoCode}) agregado exitosamente a la base central`,
    });
    return newEmp;
  };

  const handleDeleteEmployee = async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    const targetCode = emp?.tecnicoCode;
    const targetName = emp?.nombre ? emp.nombre.toLowerCase() : '';

    if (targetCode) {
      try {
        const deletedCodes = JSON.parse(localStorage.getItem('comunica_deleted_employee_codes') || '[]');
        if (!deletedCodes.includes(targetCode)) {
          deletedCodes.push(targetCode);
          localStorage.setItem('comunica_deleted_employee_codes', JSON.stringify(deletedCodes));
        }
      } catch (err) {
        console.error('Error saving deleted employee code:', err);
      }
    }

    const updatedEmployees = employees.filter((e) => e.id !== id && (!targetCode || e.tecnicoCode !== targetCode));
    const updatedLogs = overtimeLogs.filter((ot) => ot.empleadoId !== id && (!targetName || (ot.empleadoNombre || '').toLowerCase() !== targetName));
    const updatedDeductions = timeOffDeductions.filter((to) => to.empleadoId !== id && (!targetName || (to.empleadoNombre || '').toLowerCase() !== targetName));

    setEmployees(updatedEmployees);
    setOvertimeLogs(updatedLogs);
    setTimeOffDeductions(updatedDeductions);

    localStorage.setItem('comunica_employees', JSON.stringify(updatedEmployees));
    localStorage.setItem('comunica_overtime_logs', JSON.stringify(updatedLogs));
    localStorage.setItem('comunica_timeoff_deductions', JSON.stringify(updatedDeductions));

    // Call server endpoint atomically to persist deletion in central JSON and trigger sync for all users
    try {
      const res = await deleteEmployeeCentrally(id, targetCode);
      if (res && res.revision) {
        lastRevisionRef.current = res.revision;
      }
    } catch (serverErr) {
      console.error('Error deleting employee centrally:', serverErr);
    }

    // If Google Sheets is connected in this session, update Google Sheets immediately
    if (googleAccessToken) {
      try {
        const sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllOvertimeToDrive(googleAccessToken, sheetId, updatedLogs, updatedDeductions, updatedEmployees);
          await syncAllEmployeesToDrive(googleAccessToken, sheetId, updatedEmployees);
          await markSheetsSyncedCentrally();
          setPendingSheetsSync(false);
          setLastSheetsSyncTime(Date.now());
          setSyncToast({
            type: 'success',
            message: emp
              ? `Trabajador ${emp.nombre} retirado de la base central y de Google Sheets`
              : 'Trabajador retirado correctamente de la base central y Google Sheets',
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          });
          return;
        }
      } catch (syncErr) {
        console.error('Error syncing deletion to Google Sheets:', syncErr);
      }
    }

    setSyncToast({
      type: 'success',
      message: emp
        ? `Trabajador ${emp.nombre} retirado de la base central. Se sincronizará con Google Sheets automáticamente.`
        : 'Trabajador retirado de la base central',
    });
  };

  const handleUpdateEmployeeCode = async (id: string, newCode: string) => {
    const cleanCode = newCode.trim().toUpperCase();
    const updated = employees.map((emp) => (emp.id === id ? { ...emp, codigoSeguridad: cleanCode } : emp));
    setEmployees(updated);
    localStorage.setItem('comunica_employees', JSON.stringify(updated));

    try {
      const res = await updateEmployeeCodeCentrally(id, cleanCode);
      if (res && res.revision) {
        lastRevisionRef.current = res.revision;
      }
    } catch (err) {
      console.error('Error updating employee code centrally:', err);
    }

    setSyncToast({
      type: 'success',
      message: 'Código de seguridad (PIN) actualizado exitosamente',
    });
  };

  const handleUpdateOvertimeLog = async (updatedLog: OvertimeLog) => {
    const oldLog = overtimeLogs.find((ot) => ot.id === updatedLog.id);
    if (!oldLog) return;

    const newLogs = overtimeLogs.map((ot) => (ot.id === updatedLog.id ? updatedLog : ot));
    setOvertimeLogs(newLogs);

    const updatedEmployees = employees.map((emp) => {
      let saldo = emp.saldoHoras;
      if (emp.id === oldLog.empleadoId) {
        saldo -= oldLog.horasEquivalentes;
      }
      if (emp.id === updatedLog.empleadoId) {
        saldo += updatedLog.horasEquivalentes;
      }
      return { ...emp, saldoHoras: Number(Math.max(0, saldo).toFixed(2)) };
    });

    setEmployees(updatedEmployees);
    await pushCentralState({ overtimeLogs: newLogs, employees: updatedEmployees });

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllOvertimeToDrive(googleAccessToken, sheetId, newLogs, timeOffDeductions);
          await markSheetsSyncedCentrally();
          setSyncToast({
            type: 'success',
            message: 'Registro de horas extras corregido y actualizado en Google Sheets y base central',
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          });
        }
      } catch (err: any) {
        console.error('Error al sincronizar corrección de horas extras:', err);
      }
    }
  };

  const handleDeleteOvertimeLog = async (id: string) => {
    const cleanId = id.replace(/^ot-/, '');
    const logToDelete = overtimeLogs.find((ot) => ot.id === id || ot.id === cleanId || `ot-${ot.id}` === id);
    if (!logToDelete) {
      console.warn('No se encontró el registro de horas extras con id:', id);
      return;
    }

    const targetId = logToDelete.id;
    const newLogs = overtimeLogs.filter((ot) => ot.id !== targetId);
    setOvertimeLogs(newLogs);

    // Restar las horas del saldo del empleado o poner en 0 si ya no tiene horas extras
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === logToDelete.empleadoId) {
        const remainingEmpLogs = newLogs.filter((ot) => ot.empleadoId === emp.id);
        if (remainingEmpLogs.length === 0) {
          return { ...emp, saldoHoras: 0 };
        }
        const nuevoSaldo = Number(Math.max(0, emp.saldoHoras - logToDelete.horasEquivalentes).toFixed(2));
        return { ...emp, saldoHoras: nuevoSaldo };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    await pushCentralState({ overtimeLogs: newLogs, employees: updatedEmployees });

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllOvertimeToDrive(googleAccessToken, sheetId, newLogs, timeOffDeductions);
          await markSheetsSyncedCentrally();
          setSyncToast({
            type: 'success',
            message: 'Registro de horas extras eliminado y saldo recalculado en Google Sheets y base central',
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          });
        }
      } catch (err: any) {
        console.error('Error al sincronizar eliminación de horas extras:', err);
      }
    }
  };

  const handleDeleteTimeOffDeduction = async (id: string) => {
    const cleanId = id.replace(/^to-/, '');
    const toDelete = timeOffDeductions.find((to) => to.id === id || to.id === cleanId || `to-${to.id}` === id);
    if (!toDelete) {
      console.warn('No se encontró el registro de compensatorio con id:', id);
      return;
    }

    const targetId = toDelete.id;
    const newDeductions = timeOffDeductions.filter((to) => to.id !== targetId);
    setTimeOffDeductions(newDeductions);

    // Devolver las horas descontadas al saldo del empleado
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === toDelete.empleadoId) {
        const restoredSaldo = Number((emp.saldoHoras + toDelete.horasDescontadas).toFixed(2));
        return { ...emp, saldoHoras: restoredSaldo };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    await pushCentralState({ timeOffDeductions: newDeductions, employees: updatedEmployees });

    if (googleAccessToken) {
      try {
        let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
        if (sheetId) {
          await syncAllOvertimeToDrive(googleAccessToken, sheetId, overtimeLogs, newDeductions);
          await markSheetsSyncedCentrally();
          setSyncToast({
            type: 'success',
            message: 'Deducción anulada y horas reintegradas al saldo del trabajador en Google Sheets y base central',
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          });
        }
      } catch (err: any) {
        console.error('Error al sincronizar anulación de compensatorio:', err);
      }
    }
  };

  const handleUpdateEmployeeBalance = async (employeeId: string, newBalance: number) => {
    const cleanBalance = Math.max(0, Number(newBalance.toFixed(2)));
    const updatedEmployees = employees.map((emp) => (emp.id === employeeId ? { ...emp, saldoHoras: cleanBalance } : emp));
    setEmployees(updatedEmployees);
    await pushCentralState({ employees: updatedEmployees });

    setSyncToast({
      type: 'success',
      message: `Saldo acumulado actualizado correctamente a ${cleanBalance} horas en base central`,
    });
  };

  const handleRecalculateAllBalances = () => {
    setEmployees((prev) =>
      prev.map((emp) => {
        const n = (emp.nombre || '').toLowerCase();
        const code = (emp.tecnicoCode || '').toLowerCase();

        // Darwin Quevedo siempre 0
        if (n.includes('darwin') || n.includes('quevedo') || code === 'dquevedo') {
          return { ...emp, saldoHoras: 0 };
        }

        const abonos = overtimeLogs
          .filter((ot) => ot.empleadoId === emp.id || (ot.empleadoNombre && ot.empleadoNombre.toLowerCase() === n))
          .reduce((sum, ot) => sum + (Number(ot.horasEquivalentes) || 0), 0);

        const deducciones = timeOffDeductions
          .filter((to) => to.empleadoId === emp.id || (to.empleadoNombre && to.empleadoNombre.toLowerCase() === n))
          .reduce((sum, to) => sum + (Number(to.horasDescontadas) || 0), 0);

        const saldoNeto = Math.max(0, Number((abonos - deducciones).toFixed(2)));
        return { ...emp, saldoHoras: saldoNeto };
      })
    );

    setSyncToast({
      type: 'success',
      message: 'Saldos recalculados y sincronizados exactamente con los movimientos registrados en el Kardex.',
    });
  };

  const handleSyncOvertimeOnly = async () => {
    if (!googleAccessToken) {
      throw new Error('Debes conectar tu cuenta de Google Drive en la barra superior para sincronizar con Google Sheets.');
    }

    setIsSyncingGlobal(true);
    setSyncToast({
      type: 'syncing',
      message: 'Actualizando registro de Horas Extras y Compensatorios en Google Sheets...',
    });

    try {
      const sheet = await findOrCreateComunicaSheet(googleAccessToken);
      await syncAllOvertimeToDrive(googleAccessToken, sheet.id, overtimeLogs, timeOffDeductions, employees);
      await syncAllEmployeesToDrive(googleAccessToken, sheet.id, employees);
      await markSheetsSyncedCentrally();
      setPendingSheetsSync(false);
      setLastSheetsSyncTime(Date.now());
      setSyncToast({
        type: 'success',
        message: '¡Horas Extras, Compensatorios y Saldos de Técnicos sincronizados en Google Sheets!',
        sheetUrl: sheet.url,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: `Error al sincronizar horas extras: ${err.message}`,
      });
      throw err;
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleLinkSpreadsheet = async (inputUrlOrId: string) => {
    const sheetId = extractSpreadsheetId(inputUrlOrId);
    if (!sheetId) return;

    setIsSyncingGlobal(true);
    setSyncToast({
      type: 'syncing',
      message: 'Vinculando hoja centralizada y asegurando formato...',
    });

    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, sheetId);

      // Save to central server for ALL devices and team members
      await linkCentralSpreadsheet(sheetId, 'COMUNICA EP - Registro Centralizado Operaciones', sheetUrl);

      if (googleAccessToken) {
        await ensureSpreadsheetTabsAndHeaders(googleAccessToken, sheetId);
        // Automatically grant editor permissions to authorized team emails
        if (accessPolicy.authorizedEmails.length > 0) {
          await shareSpreadsheetWithAuthorizedTeam(googleAccessToken, sheetId, accessPolicy.authorizedEmails);
        }
      }

      setSyncToast({
        type: 'success',
        message: '¡Hoja centralizada vinculada y compartida con el equipo!',
        sheetUrl,
      });
    } catch (err: any) {
      console.error('Error linking sheet:', err);
      setSyncToast({
        type: 'error',
        message: `Error al vincular hoja institucional: ${err.message}`,
      });
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleImportFromDrive = async () => {
    if (!googleAccessToken) {
      setSyncToast({
        type: 'warning',
        message: 'Debes conectar tu cuenta de Google Drive primero.',
      });
      return;
    }

    let sheetId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
    if (!sheetId) {
      const sheet = await findOrCreateComunicaSheet(googleAccessToken);
      sheetId = sheet.id;
    }

    setIsSyncingGlobal(true);
    setSyncToast({
      type: 'syncing',
      message: 'Importando registros desde Google Drive...',
    });

    try {
      const imported = await readAllFromDriveSpreadsheet(googleAccessToken, sheetId);
      if (imported) {
        const parts: string[] = [];
        if (imported.checklistRows.length > 0) {
          setChecklistRows(imported.checklistRows);
          localStorage.setItem('comunica_checklist_rows', JSON.stringify(imported.checklistRows));
          parts.push(`${imported.checklistRows.length} turnos`);
        }
        if (imported.incidents.length > 0) {
          setIncidents(imported.incidents);
          localStorage.setItem('comunica_incidents', JSON.stringify(imported.incidents));
          parts.push(`${imported.incidents.length} incidencias`);
        }

        await pushCentralState({
          checklistRows: imported.checklistRows.length > 0 ? imported.checklistRows : checklistRows,
          incidents: imported.incidents.length > 0 ? imported.incidents : incidents,
        });

        setSyncToast({
          type: 'success',
          message: `¡Registros importados de Drive con éxito! (${parts.join(', ') || '0 registros'})`,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        });
      } else {
        setSyncToast({
          type: 'warning',
          message: 'No se encontraron datos en las pestañas de Google Sheets.',
        });
      }
    } catch (err: any) {
      console.error('Error importing from Drive:', err);
      setSyncToast({
        type: 'error',
        message: `Error al importar de Google Drive: ${err.message}`,
      });
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleTriggerFullSync = async () => {
    if (!googleAccessToken) {
      throw new Error('Debes conectar tu cuenta de Google Drive primero.');
    }

    setIsSyncingGlobal(true);
    setSyncToast({
      type: 'syncing',
      message: 'Sincronizando todo el registro (Checklist, Incidencias y Horas Extras) con Google Sheets...',
    });

    try {
      const sheet = await findOrCreateComunicaSheet(googleAccessToken);
      await syncAllRowsToDrive(googleAccessToken, sheet.id, checklistRows);
      await syncAllIncidentsToDrive(googleAccessToken, sheet.id, incidents);
      await syncAllOvertimeToDrive(googleAccessToken, sheet.id, overtimeLogs, timeOffDeductions, employees);
      await syncAllEmployeesToDrive(googleAccessToken, sheet.id, employees);
      await markSheetsSyncedCentrally();
      setPendingSheetsSync(false);
      setLastSheetsSyncTime(Date.now());

      // Also ensure authorized users have edit access in Drive
      if (accessPolicy.authorizedEmails.length > 0) {
        await shareSpreadsheetWithAuthorizedTeam(
          googleAccessToken,
          sheet.id,
          accessPolicy.authorizedEmails
        );
      }

      // Save to central state
      await pushCentralState({
        employees,
        checklistRows,
        incidents,
        overtimeLogs,
        timeOffDeductions,
        accessPolicy,
        spreadsheetId: sheet.id,
        spreadsheetUrl: sheet.url,
      });

      await markSheetsSyncedCentrally();
      setPendingSheetsSync(false);
      setLastSheetsSyncTime(Date.now());

      setSyncToast({
        type: 'success',
        message: `¡Checklist (${checklistRows.length}), Incidencias (${incidents.length}) y Horas Extras sincronizados en Google Sheets!`,
        sheetUrl: sheet.url,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: `Error al sincronizar con Drive: ${err.message}`,
      });
      throw err;
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de restablecer todos los datos a los valores predeterminados?')) {
      localStorage.removeItem('comunica_checklist_rows');
      localStorage.removeItem('comunica_incidents');
      localStorage.removeItem('comunica_employees');
      localStorage.removeItem('comunica_overtime_logs');
      localStorage.removeItem('comunica_timeoff_deductions');
      setChecklistRows(INITIAL_CHECKLIST_ROWS);
      setIncidents(INITIAL_INCIDENTS);
      setEmployees(INITIAL_EMPLOYEES);
      setOvertimeLogs(INITIAL_OVERTIME_LOGS);
      setTimeOffDeductions(INITIAL_TIMEOFF_DEDUCTIONS);
    }
  };

  const openIncidentsCount = incidents.filter((i) => i.estado === 'abierto' || i.estado === 'en_progreso').length;

  const userEmail = (googleUser?.email || '').toLowerCase().trim();
  const isAdmin = adminBypass || (userEmail !== '' && accessPolicy.adminEmails.some((adm) => adm.toLowerCase().trim() === userEmail));

  // Determine if current visitor has authorization to access and fill information:
  // If mode is 'all_google': any Google account or local user can view/fill
  // If mode is 'authorized_only': must be signed in with Google AND email must be in authorizedEmails or adminEmails (or adminBypass is active)
  const isAuthorized = (() => {
    if (adminBypass) return true;
    if (accessPolicy.mode === 'all_google') {
      return true;
    }
    // Mode is 'authorized_only':
    if (!googleUser || !userEmail) {
      return false;
    }
    if (isAdmin) return true;
    return accessPolicy.authorizedEmails.some((e) => e.toLowerCase().trim() === userEmail);
  })();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        openIncidentsCount={openIncidentsCount}
        onResetData={handleResetData}
        onOpenAccessControl={isAdmin ? () => setIsAccessControlModalOpen(true) : undefined}
        accessPolicy={accessPolicy}
        currentUserEmail={googleUser?.email}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Google Drive & Sheets Integration Bar */}
        <GoogleDriveSyncBar
          user={googleUser}
          accessToken={googleAccessToken}
          onAuthChange={(user, token) => {
            setGoogleUser(user);
            setGoogleAccessToken(token);
          }}
          checklistRows={checklistRows}
          incidents={incidents}
          overtimeLogs={overtimeLogs}
          timeOffDeductions={timeOffDeductions}
          employees={employees}
          onTriggerFullSync={handleTriggerFullSync}
          isSyncingGlobal={isSyncingGlobal}
          pendingSheetsSync={pendingSheetsSync}
          lastSheetsSyncTime={lastSheetsSyncTime}
        />

        {!isAuthorized ? (
          <UnauthorizedAccessScreen
            currentUser={googleUser}
            onAuthSuccess={(user, token) => {
              setGoogleUser(user);
              setGoogleAccessToken(token);
            }}
            adminEmails={accessPolicy.adminEmails}
            onAdminUnlock={() => setAdminBypass(true)}
          />
        ) : (
          <>
            {activeTab === 'resumen' && (
              <OverviewDashboard
                checklistRows={checklistRows}
                incidents={incidents}
                employees={employees}
                overtimeLogs={overtimeLogs}
                timeOffDeductions={timeOffDeductions}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'checklist' && (
              <BroadcastChecklist
                rows={checklistRows}
                onAddRow={handleAddChecklistRow}
                onAddMultipleRows={handleAddMultipleChecklistRows}
                onUpdateCellStatus={handleUpdateCellStatus}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                onCleanDuplicates={handleCleanDuplicateRows}
                employees={employees}
              />
            )}

            {activeTab === 'incidencias' && (
              <ServiceDesk
                incidents={incidents}
                employees={employees}
                onAddIncident={handleAddIncident}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onUpdateIncident={handleUpdateIncident}
                onDeleteIncident={handleDeleteIncident}
                onAddEmployee={handleAddEmployee}
                onDeleteEmployee={handleDeleteEmployee}
              />
            )}

            {activeTab === 'horas_extras' && (
              <OvertimeComp
                employees={employees}
                overtimeLogs={overtimeLogs}
                timeOffDeductions={timeOffDeductions}
                onAddOvertime={handleAddOvertime}
                onApplyTimeOff={handleApplyTimeOff}
                onAddEmployee={handleAddEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onUpdateOvertimeLog={handleUpdateOvertimeLog}
                onDeleteOvertimeLog={handleDeleteOvertimeLog}
                onDeleteTimeOffDeduction={handleDeleteTimeOffDeduction}
                onUpdateEmployeeBalance={handleUpdateEmployeeBalance}
                onRecalculateAllBalances={handleRecalculateAllBalances}
                onSyncToGoogleSheets={handleSyncOvertimeOnly}
                isGoogleConnected={!!googleAccessToken}
                isSyncing={isSyncingGlobal}
                onUpdateEmployeeCode={handleUpdateEmployeeCode}
                isAdmin={isAdmin}
              />
            )}
          </>
        )}
      </main>

      {/* Access Control Policy Modal (Admin only) */}
      {isAdmin && (
        <AccessControlModal
          isOpen={isAccessControlModalOpen}
          onClose={() => setIsAccessControlModalOpen(false)}
          policy={accessPolicy}
          isAdmin={isAdmin}
          onUpdatePolicy={(newPolicy) => {
            setAccessPolicy(newPolicy);
            localStorage.setItem('comunica_access_policy', JSON.stringify(newPolicy));
            pushCentralState({ accessPolicy: newPolicy });

            setSyncToast({
              type: 'success',
              message: `Política de acceso actualizada (${newPolicy.mode === 'whitelist_only' ? 'Solo lista blanca' : 'Cualquier cuenta Google'})`,
            });
          }}
          currentUser={googleUser}
        />
      )}

      {/* Floating Sync Notification Banner */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-3 duration-300">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            syncToast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-700 text-emerald-100'
              : syncToast.type === 'syncing'
              ? 'bg-cyan-950/95 border-cyan-700 text-cyan-100'
              : syncToast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-700 text-amber-100'
              : 'bg-red-950/95 border-red-700 text-red-100'
          }`}>
            <div className="shrink-0 mt-0.5">
              {syncToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {syncToast.type === 'syncing' && <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />}
              {syncToast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {syncToast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            </div>

            <div className="flex-1 text-xs">
              <div className="font-semibold text-sm">
                {syncToast.type === 'success' && 'Google Drive Sincronizado'}
                {syncToast.type === 'syncing' && 'Sincronizando con Google Drive...'}
                {syncToast.type === 'warning' && 'Aviso de Almacenamiento'}
                {syncToast.type === 'error' && 'Error de Sincronización en Drive'}
              </div>
              <p className="mt-1 opacity-90 leading-relaxed">{syncToast.message}</p>

              {syncToast.sheetUrl && (
                <div className="mt-2.5">
                  <a
                    href={syncToast.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-white transition"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="p-1 rounded-md hover:bg-black/20 text-white/70 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-4 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>COMUNICA EP • Sistema Unificado de Operaciones Broadcasting y Gestión Técnica</span>
          <span className="text-zinc-600">Almacenamiento en Google Drive & Respaldo local activo</span>
        </div>
      </footer>
    </div>
  );
}
