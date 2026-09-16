import { 
  BroadcastChecklistRow, 
  IncidentTicket, 
  Employee, 
  OvertimeLog, 
  TimeOffDeduction, 
  GoogleAccessPolicy,
  ControlTecnicoRow,
  Ipv4Network,
  IpAssignment
} from '../types';

export interface CentralStateData {
  revision: number;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  accessPolicy: GoogleAccessPolicy | null;
  employees: Employee[];
  checklistRows: BroadcastChecklistRow[];
  incidents: IncidentTicket[];
  overtimeLogs: OvertimeLog[];
  timeOffDeductions: TimeOffDeduction[];
  controlTecnicoRows?: ControlTecnicoRow[];
  ipv4Networks?: Ipv4Network[];
  ipAssignments?: IpAssignment[];
  lastUpdated: number;
  pendingSheetsSync?: boolean;
  lastSheetsSyncTime?: number | null;
}

export async function getCentralState(): Promise<CentralStateData | null> {
  try {
    const res = await fetch('/api/central-state');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch central state from server:', err);
    return null;
  }
}

export async function pushCentralState(partial: Partial<CentralStateData> & { forceEmpty?: boolean }): Promise<{ success: boolean; revision?: number }> {
  try {
    const res = await fetch('/api/central-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, revision: data.revision };
  } catch (err) {
    console.warn('Could not push central state to server:', err);
    return { success: false };
  }
}

export async function addChecklistRowsCentrally(rows: BroadcastChecklistRow[]): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/add-checklist-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not add checklist rows centrally:', err);
    return { success: false };
  }
}

export async function markSheetsSyncedCentrally(): Promise<boolean> {
  try {
    const res = await fetch('/api/central-state/mark-sheets-synced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not mark sheets synced:', err);
    return false;
  }
}

export async function addOvertimeLogCentrally(log: OvertimeLog): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/add-overtime-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not add overtime log centrally:', err);
    return { success: false };
  }
}

export async function addTimeOffDeductionCentrally(deduction: TimeOffDeduction): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/add-timeoff-deduction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deduction }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not add timeoff deduction centrally:', err);
    return { success: false };
  }
}

export async function addEmployeeCentrally(employee: Employee): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/add-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not add employee centrally:', err);
    return { success: false };
  }
}

export async function deleteEmployeeCentrally(
  employeeId: string,
  tecnicoCode?: string
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/delete-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, tecnicoCode }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not delete employee centrally:', err);
    return { success: false };
  }
}

export async function updateEmployeeCodeCentrally(
  employeeId: string,
  newCode: string
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/update-employee-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, newCode }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not update employee code centrally:', err);
    return { success: false };
  }
}

export async function linkCentralSpreadsheet(
  spreadsheetId: string,
  spreadsheetName?: string,
  spreadsheetUrl?: string,
  force?: boolean
): Promise<{ success: boolean; url?: string }> {
  try {
    const res = await fetch('/api/link-spreadsheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId, spreadsheetName, spreadsheetUrl, force }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, url: data.url };
  } catch (err) {
    console.warn('Could not link central spreadsheet:', err);
    return { success: false };
  }
}

export async function addControlTecnicoRowCentrally(
  row: ControlTecnicoRow
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/add-control-tecnico-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not add control tecnico row centrally:', err);
    return { success: false };
  }
}

export async function deleteControlTecnicoRowCentrally(
  id: string
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/delete-control-tecnico-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not delete control tecnico row centrally:', err);
    return { success: false };
  }
}

export async function saveIpv4NetworksCentrally(
  networks: Ipv4Network[]
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/save-networks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ networks }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not save networks centrally:', err);
    return { success: false };
  }
}

export async function saveIpAssignmentsCentrally(
  assignments: IpAssignment[]
): Promise<{ success: boolean; state?: CentralStateData; revision?: number }> {
  try {
    const res = await fetch('/api/central-state/save-ip-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, state: data.state, revision: data.revision };
  } catch (err) {
    console.warn('Could not save IP assignments centrally:', err);
    return { success: false };
  }
}

