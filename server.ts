import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'central_state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CentralState {
  revision: number;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  accessPolicy: any;
  employees: any[];
  checklistRows: any[];
  incidents: any[];
  overtimeLogs: any[];
  timeOffDeductions: any[];
  controlTecnicoRows: any[];
  ipv4Networks: any[];
  ipAssignments: any[];
  lastUpdated: number;
  pendingSheetsSync: boolean;
  lastSheetsSyncTime: number | null;
}

// Load initial state from disk or fallback
function loadState(): CentralState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        revision: typeof parsed.revision === 'number' ? parsed.revision : 1,
        spreadsheetId: parsed.spreadsheetId || null,
        spreadsheetName: parsed.spreadsheetName || 'COMUNICA EP - Registro Centralizado Operaciones',
        spreadsheetUrl: parsed.spreadsheetUrl || (parsed.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/edit` : null),
        accessPolicy: parsed.accessPolicy || null,
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        checklistRows: Array.isArray(parsed.checklistRows) ? parsed.checklistRows : [],
        incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
        overtimeLogs: Array.isArray(parsed.overtimeLogs) ? parsed.overtimeLogs : [],
        timeOffDeductions: Array.isArray(parsed.timeOffDeductions) ? parsed.timeOffDeductions : [],
        controlTecnicoRows: Array.isArray(parsed.controlTecnicoRows) ? parsed.controlTecnicoRows : [],
        ipv4Networks: Array.isArray(parsed.ipv4Networks) ? parsed.ipv4Networks : [],
        ipAssignments: Array.isArray(parsed.ipAssignments) ? parsed.ipAssignments : [],
        lastUpdated: parsed.lastUpdated || Date.now(),
        pendingSheetsSync: !!parsed.pendingSheetsSync,
        lastSheetsSyncTime: parsed.lastSheetsSyncTime || null,
      };
    }
  } catch (err) {
    console.error('Error reading central_state.json:', err);
  }

  return {
    revision: 1,
    spreadsheetId: null,
    spreadsheetName: 'COMUNICA EP - Registro Centralizado Operaciones',
    spreadsheetUrl: null,
    accessPolicy: null,
    employees: [],
    checklistRows: [],
    incidents: [],
    overtimeLogs: [],
    timeOffDeductions: [],
    controlTecnicoRows: [],
    ipv4Networks: [],
    ipAssignments: [],
    lastUpdated: Date.now(),
    pendingSheetsSync: false,
    lastSheetsSyncTime: null,
  };
}

let currentState: CentralState = loadState();

function saveState(newState: Partial<CentralState>, markSheetsPending: boolean = false) {
  const nextRevision = (currentState.revision || 0) + 1;
  currentState = {
    ...currentState,
    ...newState,
    revision: nextRevision,
    lastUpdated: Date.now(),
    pendingSheetsSync: markSheetsPending !== undefined ? markSheetsPending : currentState.pendingSheetsSync,
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving central_state.json:', err);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), revision: currentState.revision });
  });

  // Get centralized state
  app.get('/api/central-state', (req, res) => {
    res.json(currentState);
  });

  // Update centralized state
  app.post('/api/central-state', (req, res) => {
    const updates = req.body || {};
    
    // Check if activities changed to mark sheets as pending sync
    const hasActivityChanges = 
      (updates.checklistRows !== undefined) ||
      (updates.incidents !== undefined) ||
      (updates.overtimeLogs !== undefined) ||
      (updates.timeOffDeductions !== undefined);

    const markPending = updates.pendingSheetsSync !== undefined ? !!updates.pendingSheetsSync : (hasActivityChanges || currentState.pendingSheetsSync);

    // If client sends empty arrays for checklist or employees while server already has data,
    // protect server from accidental complete data wipeout on uninitialized clients
    if (updates.checklistRows && updates.checklistRows.length === 0 && currentState.checklistRows.length > 0 && !updates.forceEmpty) {
      delete updates.checklistRows;
    }
    if (updates.employees && updates.employees.length === 0 && currentState.employees.length > 0 && !updates.forceEmpty) {
      delete updates.employees;
    }

    saveState(updates, markPending);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Mark that Google Sheets has been synchronized
  app.post('/api/central-state/mark-sheets-synced', (req, res) => {
    saveState({
      pendingSheetsSync: false,
      lastSheetsSyncTime: Date.now(),
    }, false);
    res.json({ success: true, revision: currentState.revision, lastSheetsSyncTime: currentState.lastSheetsSyncTime });
  });

  // Append new checklist rows atomically
  app.post('/api/central-state/add-checklist-rows', (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows array is required' });
    }

    // Filter out rows that are already present by id or exact fecha + hora + programa
    const existing = currentState.checklistRows || [];
    const nonDuplicates = rows.filter((r) => {
      const normH = (r.hora || '').trim().toLowerCase().replace(':', 'h');
      const normP = (r.programa || '').trim().toLowerCase();
      return !existing.some((ex) => {
        if (ex.id === r.id) return true;
        if (ex.fecha !== r.fecha) return false;
        const exH = (ex.hora || '').trim().toLowerCase().replace(':', 'h');
        const exP = (ex.programa || '').trim().toLowerCase();
        return exH === normH || exP === normP;
      });
    });

    const updatedRows = [...nonDuplicates, ...existing];
    saveState({ checklistRows: updatedRows }, true);
    res.json({ success: true, state: currentState, addedCount: nonDuplicates.length, revision: currentState.revision });
  });

  // Append new overtime log atomically and recalculate employee balance
  app.post('/api/central-state/add-overtime-log', (req, res) => {
    const { log } = req.body;
    if (!log || !log.empleadoId) {
      return res.status(400).json({ error: 'Valid log object with empleadoId is required' });
    }

    const existingLogs = currentState.overtimeLogs || [];
    const isDuplicate = existingLogs.some((l) => l.id === log.id);
    const updatedLogs = isDuplicate ? existingLogs : [log, ...existingLogs];

    // Update employee balance atomically
    const currentEmployees = currentState.employees || [];
    const updatedEmployees = currentEmployees.map((emp) => {
      if (emp.id === log.empleadoId) {
        const addedHours = Number(log.horasEquivalentes) || 0;
        const newBalance = Number(((Number(emp.saldoHoras) || 0) + addedHours).toFixed(2));
        return { ...emp, saldoHoras: newBalance };
      }
      return emp;
    });

    saveState({ overtimeLogs: updatedLogs, employees: updatedEmployees }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Apply time off deduction atomically and deduce employee balance
  app.post('/api/central-state/add-timeoff-deduction', (req, res) => {
    const { deduction } = req.body;
    if (!deduction || !deduction.empleadoId) {
      return res.status(400).json({ error: 'Valid deduction object with empleadoId is required' });
    }

    const existingDeductions = currentState.timeOffDeductions || [];
    const isDuplicate = existingDeductions.some((d) => d.id === deduction.id);
    const updatedDeductions = isDuplicate ? existingDeductions : [deduction, ...existingDeductions];

    // Deduct balance atomically
    const currentEmployees = currentState.employees || [];
    const updatedEmployees = currentEmployees.map((emp) => {
      if (emp.id === deduction.empleadoId) {
        const deductedHours = Number(deduction.horasDescontadas) || 0;
        const newBalance = Math.max(0, Number(((Number(emp.saldoHoras) || 0) - deductedHours).toFixed(2)));
        return { ...emp, saldoHoras: newBalance };
      }
      return emp;
    });

    saveState({ timeOffDeductions: updatedDeductions, employees: updatedEmployees }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Add employee atomically
  app.post('/api/central-state/add-employee', (req, res) => {
    const { employee } = req.body;
    if (!employee || !employee.nombre || !employee.tecnicoCode) {
      return res.status(400).json({ error: 'Valid employee object is required' });
    }

    const currentEmployees = currentState.employees || [];
    const existingIndex = currentEmployees.findIndex(
      (e) => e.id === employee.id || e.tecnicoCode === employee.tecnicoCode
    );

    let updatedEmployees: any[];
    if (existingIndex >= 0) {
      updatedEmployees = currentEmployees.map((e, idx) => (idx === existingIndex ? { ...e, ...employee } : e));
    } else {
      updatedEmployees = [...currentEmployees, employee];
    }

    saveState({ employees: updatedEmployees }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Delete employee atomically, and remove their associated overtime logs and deductions
  app.post('/api/central-state/delete-employee', (req, res) => {
    const { employeeId, tecnicoCode } = req.body;
    if (!employeeId && !tecnicoCode) {
      return res.status(400).json({ error: 'employeeId or tecnicoCode is required' });
    }

    const currentEmployees = currentState.employees || [];
    const targetEmp = currentEmployees.find(
      (e) => (employeeId && e.id === employeeId) || (tecnicoCode && e.tecnicoCode.toLowerCase() === tecnicoCode.toLowerCase())
    );

    const targetId = targetEmp ? targetEmp.id : employeeId;
    const targetCode = targetEmp ? targetEmp.tecnicoCode : tecnicoCode;
    const targetName = targetEmp ? targetEmp.nombre.toLowerCase() : '';

    const updatedEmployees = currentEmployees.filter(
      (e) => e.id !== targetId && (!targetCode || e.tecnicoCode.toLowerCase() !== targetCode.toLowerCase())
    );

    // Also remove any related overtime logs and deductions
    const updatedLogs = (currentState.overtimeLogs || []).filter(
      (ot) => ot.empleadoId !== targetId && (!targetName || (ot.empleadoNombre || '').toLowerCase() !== targetName)
    );

    const updatedDeductions = (currentState.timeOffDeductions || []).filter(
      (to) => to.empleadoId !== targetId && (!targetName || (to.empleadoNombre || '').toLowerCase() !== targetName)
    );

    saveState({
      employees: updatedEmployees,
      overtimeLogs: updatedLogs,
      timeOffDeductions: updatedDeductions,
    }, true);

    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Update employee security PIN code atomically
  app.post('/api/central-state/update-employee-code', (req, res) => {
    const { employeeId, newCode } = req.body;
    if (!employeeId || !newCode) {
      return res.status(400).json({ error: 'employeeId and newCode are required' });
    }

    const currentEmployees = currentState.employees || [];
    const updatedEmployees = currentEmployees.map((e) =>
      e.id === employeeId ? { ...e, codigoSeguridad: newCode.trim().toUpperCase() } : e
    );

    saveState({ employees: updatedEmployees }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Add a Control Técnico Checklist row atomically
  app.post('/api/central-state/add-control-tecnico-row', (req, res) => {
    const { row } = req.body;
    if (!row) {
      return res.status(400).json({ error: 'row is required' });
    }
    const currentRows = currentState.controlTecnicoRows || [];
    // Check if duplicate or update
    const existingIdx = currentRows.findIndex((r) => r.id === row.id);
    let updatedRows: any[];
    if (existingIdx >= 0) {
      updatedRows = [...currentRows];
      updatedRows[existingIdx] = row;
    } else {
      updatedRows = [row, ...currentRows];
    }
    saveState({ controlTecnicoRows: updatedRows }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Delete a Control Técnico Checklist row atomically
  app.post('/api/central-state/delete-control-tecnico-row', (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    const currentRows = currentState.controlTecnicoRows || [];
    const updatedRows = currentRows.filter((r) => r.id !== id);
    saveState({ controlTecnicoRows: updatedRows }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Save IPv4 Networks list centrally
  app.post('/api/central-state/save-networks', (req, res) => {
    const { networks } = req.body;
    if (!Array.isArray(networks)) {
      return res.status(400).json({ error: 'networks array is required' });
    }
    saveState({ ipv4Networks: networks }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Save IP Assignments list centrally
  app.post('/api/central-state/save-ip-assignments', (req, res) => {
    const { assignments } = req.body;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments array is required' });
    }
    saveState({ ipAssignments: assignments }, true);
    res.json({ success: true, state: currentState, revision: currentState.revision });
  });

  // Link or update the central Google Spreadsheet
  app.post('/api/link-spreadsheet', (req, res) => {
    const { spreadsheetId, spreadsheetName, spreadsheetUrl, force } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    const cleanId = spreadsheetId.trim();
    // Protect institutional spreadsheet from being overwritten by a secondary user creating a random blank sheet
    if (currentState.spreadsheetId && currentState.spreadsheetId !== cleanId && !force) {
      // Return existing institutional sheet
      return res.json({ 
        success: true, 
        spreadsheetId: currentState.spreadsheetId, 
        url: currentState.spreadsheetUrl,
        retainedExisting: true 
      });
    }

    saveState({
      spreadsheetId: cleanId,
      spreadsheetName: spreadsheetName || currentState.spreadsheetName || 'COMUNICA EP - Registro Centralizado Operaciones',
      spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
    }, currentState.pendingSheetsSync);

    res.json({ success: true, spreadsheetId: cleanId, url: currentState.spreadsheetUrl });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
