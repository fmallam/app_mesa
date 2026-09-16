import { 
  BroadcastChecklistRow, 
  IncidentTicket, 
  OvertimeLog, 
  TimeOffDeduction, 
  Employee,
  ControlTecnicoRow,
  Ipv4Network,
  IpAssignment
} from '../types';

export const CHECKLIST_SPREADSHEET_KEY = 'comunica_drive_spreadsheet_id';
export const CHECKLIST_SPREADSHEET_NAME_KEY = 'comunica_drive_spreadsheet_name';

const SPREADSHEET_TITLE = 'COMUNICA EP - Registro Centralizado Operaciones';

export interface SheetSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

/**
 * Checks if token is valid or expired by making a lightweight userinfo call.
 */
export async function verifyGoogleToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ensures that the required tabs ('Checklist Sistemas', 'Mesa Incidencias', 'Horas Extras y Descansos', 'Saldos Técnicos')
 * exist in the spreadsheet and have their initial header rows.
 */
export async function ensureSpreadsheetTabsAndHeaders(
  accessToken: string,
  spreadsheetId: string
) {
  // 1. Get spreadsheet metadata to inspect existing sheet tabs
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`Error al leer hoja de cálculo (${metaRes.status}): ${err}`);
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map(
    (s: any) => s.properties?.title
  );

  const requiredTabs = [
    'Checklist Sistemas',
    'Checklist Control Técnico',
    'Mesa Incidencias',
    'Gestión de IPs',
    'Horas Extras y Descansos',
    'Saldos Técnicos',
  ];

  const missingTabs = requiredTabs.filter((t) => !existingSheetTitles.includes(t));

  // If there are missing tabs, add them via batchUpdate
  if (missingTabs.length > 0) {
    const addSheetRequests = missingTabs.map((title) => ({
      addSheet: {
        properties: { title },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    });
  }

  // 2. Write headers to each tab if needed
  const checklistHeaders = [
    [
      'PROGRAMA',
      'FECHA',
      'HORA',
      'ENPS SVR PRIMARIO',
      'ENPS SVR SECUNDARIO',
      'NOTICIAS K2 AIRE',
      'NOTICIAS NEXIO',
      'LEGALREC RADIO',
      'LEGALREC TV',
      'MOS SVR PRINCIPAL',
      'ORAD SRV-HDVG',
      'ORAD MAESTRO PC',
      'PROVYS SVR-BDD',
      'PROMPTER PC-CLIENTE',
      'ZOOM PC-ZOOM',
      'INTERNET ENLACE PRINCIPAL',
      'INTERNET ENLACE SECUNDARIO',
      'OBSERVACIONES',
      'TECNICO DE TURNO',
    ],
  ];

  const controlTecnicoHeaders = [
    [
      'FECHA',
      'HORA',
      'NACIONAL_AV',
      'NACIONAL_CN',
      'NACIONAL_LM',
      'NACIONAL_BER',
      'INTERNACIONAL_AV',
      'INTERNACIONAL_CN',
      'INTERNACIONAL_LM',
      'INTERNACIONAL_BER',
      'AIRE_ANAL_AU',
      'AIRE_ANAL_VD',
      'AIRE_7.1HD_AU',
      'AIRE_7.1HD_VD',
      'AIRE_7.2SD_AU',
      'AIRE_7.2SD_VD',
      'RADIO_SAT_AU',
      'RADIO_INOVONIC_AU',
      'MASTER_NAC_AU',
      'MASTER_NAC_VD',
      'MASTER_INT_AU',
      'MASTER_INT_VD',
      'HISPASAT_SRT_AU',
      'HISPASAT_SRT_VD',
      'FO_PRES_PING',
      'FO_GYE_PING',
      'TEMP_CER_201',
      'TEMP_CER_202',
      'OBSERVACIONES',
      'TECNICO_TURNO',
    ],
  ];

  const ipHeaders = [
    [
      'DIRECCION_IP',
      'HOSTNAME_EQUIPO',
      'TIPO_DISPOSITIVO',
      'ESTADO',
      'RED_SEGMENTO',
      'VLAN',
      'MAC_ADDRESS',
      'UBICACION',
      'RESPONSABLE',
      'OBSERVACIONES',
      'ULTIMA_MODIFICACION',
    ],
  ];

  const incidentHeaders = [
    [
      'CODIGO',
      'TITULO',
      'SISTEMA AFECTADO',
      'PRIORIDAD',
      'ESTADO',
      'TECNICO ASIGNADO',
      'FECHA REPORTE',
      'SOLUCION APLICADA',
    ],
  ];

  const overtimeHeaders = [
    ['TIPO', 'TECNICO', 'FECHA', 'TIPO HORA / MOTIVO', 'HORAS', 'DETALLE', 'REGISTRADO EN'],
  ];

  const employeeHeaders = [
    ['CODIGO', 'TECNICO', 'CARGO', 'CORREO', 'SALDO HORAS DISPONIBLES', 'EQUIVALENCIA DIAS LIBRES', 'ULTIMA ACTUALIZACION'],
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: "'Checklist Sistemas'!A1:S1",
          values: checklistHeaders,
        },
        {
          range: "'Checklist Control Técnico'!A1:AD1",
          values: controlTecnicoHeaders,
        },
        {
          range: "'Mesa Incidencias'!A1:H1",
          values: incidentHeaders,
        },
        {
          range: "'Gestión de IPs'!A1:K1",
          values: ipHeaders,
        },
        {
          range: "'Horas Extras y Descansos'!A1:G1",
          values: overtimeHeaders,
        },
        {
          range: "'Saldos Técnicos'!A1:G1",
          values: employeeHeaders,
        },
      ],
    }),
  });
}

/**
 * Extracts a Google Spreadsheet ID from either a full URL or a raw ID string.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Grants edit permission to a specific email address on the Google Spreadsheet.
 */
export async function shareSpreadsheetWithUser(
  accessToken: string,
  spreadsheetId: string,
  email: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions?sendNotificationEmail=false`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: email.trim().toLowerCase(),
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn(`Could not share sheet with ${email}:`, err);
    return false;
  }
}

/**
 * Grants edit permission to anyone with the link (ideal for internal shared tools).
 */
export async function shareSpreadsheetPublicEdit(
  accessToken: string,
  spreadsheetId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'anyone',
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('Could not share sheet publicly for team edit:', err);
    return false;
  }
}

/**
 * Shares the spreadsheet with all emails in the authorized team list.
 */
export async function shareSpreadsheetWithAuthorizedTeam(
  accessToken: string,
  spreadsheetId: string,
  emails: string[]
) {
  // 1. First attempt to make it link-editable for any authorized collaborator
  await shareSpreadsheetPublicEdit(accessToken, spreadsheetId);

  // 2. Also explicitly add each authorized email as writer
  for (const email of emails) {
    if (email && email.includes('@')) {
      await shareSpreadsheetWithUser(accessToken, spreadsheetId, email);
    }
  }
}

/**
 * Searches user's Google Drive for an existing spreadsheet or creates a new one.
 * Always prioritizes the shared institutional Spreadsheet ID from the central server.
 */
export async function findOrCreateComunicaSheet(
  accessToken: string,
  customName: string = SPREADSHEET_TITLE
): Promise<{ id: string; name: string; url: string }> {
  // 0. Check if the central server already has a shared institutional Spreadsheet ID
  try {
    const serverRes = await fetch('/api/central-state');
    if (serverRes.ok) {
      const serverState = await serverRes.json();
      if (serverState && serverState.spreadsheetId) {
        const sharedId = serverState.spreadsheetId.trim();
        // Check if accessible with current user's token
        const checkRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sharedId}?fields=spreadsheetId,properties.title`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (checkRes.ok) {
          const data = await checkRes.json();
          localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, sharedId);
          localStorage.setItem(CHECKLIST_SPREADSHEET_NAME_KEY, data.properties?.title || customName);
          await ensureSpreadsheetTabsAndHeaders(accessToken, sharedId);
          // Ensure link-editable so all authorized team accounts can read & write
          await shareSpreadsheetPublicEdit(accessToken, sharedId).catch(() => {});
          return {
            id: sharedId,
            name: data.properties?.title || customName,
            url: `https://docs.google.com/spreadsheets/d/${sharedId}/edit`,
          };
        } else if (checkRes.status === 403) {
          console.warn('Central spreadsheet exists but caller lacks write permissions:', sharedId);
          // Return the institutional spreadsheet info without creating a duplicate
          localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, sharedId);
          return {
            id: sharedId,
            name: serverState.spreadsheetName || customName,
            url: serverState.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sharedId}/edit`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not check server for shared spreadsheet ID:', err);
  }

  // 1. Check if we have an ID in localStorage
  const savedId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
  if (savedId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId,properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const data = await checkRes.json();
        await ensureSpreadsheetTabsAndHeaders(accessToken, savedId);
        await shareSpreadsheetPublicEdit(accessToken, savedId).catch(() => {});
        // Persist to server so other users also use it
        fetch('/api/link-spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: savedId,
            spreadsheetName: data.properties?.title || customName,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
          }),
        }).catch(() => {});

        return {
          id: savedId,
          name: data.properties?.title || customName,
          url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
        };
      }
    } catch {
      // If failed, proceed to search or create
    }
  }

  // 2. Search in Google Drive
  try {
    const query = encodeURIComponent(
      `name = '${customName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existing = searchData.files[0];
        localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, existing.id);
        localStorage.setItem(CHECKLIST_SPREADSHEET_NAME_KEY, existing.name);
        await ensureSpreadsheetTabsAndHeaders(accessToken, existing.id);

        // Share publicly with link / team
        await shareSpreadsheetPublicEdit(accessToken, existing.id);

        // Persist to server
        fetch('/api/link-spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: existing.id,
            spreadsheetName: existing.name,
            spreadsheetUrl: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
          }),
        }).catch(() => {});

        return {
          id: existing.id,
          name: existing.name,
          url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
        };
      }
    }
  } catch (err) {
    console.warn('Could not search Drive, will attempt creation:', err);
  }

  // 3. Create new Google Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: customName,
      },
      sheets: [
        { properties: { title: 'Checklist Sistemas' } },
        { properties: { title: 'Mesa Incidencias' } },
        { properties: { title: 'Horas Extras y Descansos' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Error al crear Google Sheet: ${err}`);
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;
  const sheetUrl =
    newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, spreadsheetId);
  localStorage.setItem(CHECKLIST_SPREADSHEET_NAME_KEY, customName);

  // Initialize headers
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // Enable team / link sharing
  await shareSpreadsheetPublicEdit(accessToken, spreadsheetId);

  // Persist to central server
  fetch('/api/link-spreadsheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spreadsheetId,
      spreadsheetName: customName,
      spreadsheetUrl: sheetUrl,
    }),
  }).catch(() => {});

  return {
    id: spreadsheetId,
    name: customName,
    url: sheetUrl,
  };
}

/**
 * Appends a new checklist row to the user's Google Sheet
 */
export async function appendChecklistRowToDrive(
  accessToken: string,
  spreadsheetId: string,
  row: BroadcastChecklistRow
): Promise<any> {
  const values = [
    [
      row.programa,
      row.fecha,
      row.hora,
      row.enpsSvrPrimario.toUpperCase(),
      row.enpsSvrSecundario.toUpperCase(),
      row.noticiasK2Aire.toUpperCase(),
      row.noticiasNexio.toUpperCase(),
      row.legalrecRadio.toUpperCase(),
      row.legalrecTv.toUpperCase(),
      row.mosSvrPrincipal.toUpperCase(),
      row.oradSrvHdvg.toUpperCase(),
      row.oradMaestroPc.toUpperCase(),
      row.provysSvrBdd.toUpperCase(),
      row.prompterPcCliente.toUpperCase(),
      row.zoomPcZoom.toUpperCase(),
      row.internetEnlacePrincipal.toUpperCase(),
      row.internetEnlaceSecundario.toUpperCase(),
      row.observaciones,
      row.tecnicoTurno,
    ],
  ];

  const range = encodeURIComponent("'Checklist Sistemas'!A:S");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al guardar fila de checklist en Google Sheet (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Appends multiple checklist rows to Google Sheet in a single request
 */
export async function appendMultipleChecklistRowsToDrive(
  accessToken: string,
  spreadsheetId: string,
  rows: BroadcastChecklistRow[]
): Promise<any> {
  if (rows.length === 0) return null;

  const values = rows.map((row) => [
    row.programa,
    row.fecha,
    row.hora,
    row.enpsSvrPrimario.toUpperCase(),
    row.enpsSvrSecundario.toUpperCase(),
    row.noticiasK2Aire.toUpperCase(),
    row.noticiasNexio.toUpperCase(),
    row.legalrecRadio.toUpperCase(),
    row.legalrecTv.toUpperCase(),
    row.mosSvrPrincipal.toUpperCase(),
    row.oradSrvHdvg.toUpperCase(),
    row.oradMaestroPc.toUpperCase(),
    row.provysSvrBdd.toUpperCase(),
    row.prompterPcCliente.toUpperCase(),
    row.zoomPcZoom.toUpperCase(),
    row.internetEnlacePrincipal.toUpperCase(),
    row.internetEnlaceSecundario.toUpperCase(),
    row.observaciones,
    row.tecnicoTurno,
  ]);

  const range = encodeURIComponent("'Checklist Sistemas'!A:S");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al guardar registros en Google Sheet (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Appends an incident ticket to Google Sheet
 */
export async function appendIncidentToDrive(
  accessToken: string,
  spreadsheetId: string,
  incident: IncidentTicket
): Promise<any> {
  const values = [
    [
      incident.codigo,
      incident.titulo,
      incident.categoria,
      incident.prioridad.toUpperCase(),
      incident.estado.toUpperCase(),
      incident.tecnicoAsignado || 'Sin asignar',
      incident.fechaReporte,
      incident.solucionAplicada || '',
    ],
  ];

  const range = encodeURIComponent("'Mesa Incidencias'!A:H");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al guardar incidencia en Google Sheet (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Appends an overtime or time-off deduction to Google Sheet
 */
export async function appendOvertimeToDrive(
  accessToken: string,
  spreadsheetId: string,
  item: {
    tipo: string;
    tecnico: string;
    fecha: string;
    motivo: string;
    horas: number;
    detalle: string;
    registradoEn: string;
  }
): Promise<any> {
  // Always ensure tabs and headers are present first
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  const values = [
    [
      item.tipo,
      item.tecnico,
      item.fecha,
      item.motivo,
      item.horas,
      item.detalle,
      item.registradoEn,
    ],
  ];

  const range = encodeURIComponent("'Horas Extras y Descansos'!A:G");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al guardar horas en Google Sheet (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Synchronizes all existing local checklist rows to Google Sheets in a single batch,
 * clearing any previously deleted rows so the sheet reflects the exact current state.
 */
export async function syncAllRowsToDrive(
  accessToken: string,
  spreadsheetId: string,
  rows: BroadcastChecklistRow[]
): Promise<any> {
  // Ensure tabs and write headers
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // 1. Clear previous data rows from A2:S to ensure deleted records are wiped out
  try {
    const clearRange = encodeURIComponent("'Checklist Sistemas'!A2:S");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear range before writing:', clearErr);
  }

  if (rows.length === 0) return { cleared: true };

  const values = rows.map((r) => [
    r.programa,
    r.fecha,
    r.hora,
    r.enpsSvrPrimario.toUpperCase(),
    r.enpsSvrSecundario.toUpperCase(),
    r.noticiasK2Aire.toUpperCase(),
    r.noticiasNexio.toUpperCase(),
    r.legalrecRadio.toUpperCase(),
    r.legalrecTv.toUpperCase(),
    r.mosSvrPrincipal.toUpperCase(),
    r.oradSrvHdvg.toUpperCase(),
    r.oradMaestroPc.toUpperCase(),
    r.provysSvrBdd.toUpperCase(),
    r.prompterPcCliente.toUpperCase(),
    r.zoomPcZoom.toUpperCase(),
    r.internetEnlacePrincipal.toUpperCase(),
    r.internetEnlaceSecundario.toUpperCase(),
    r.observaciones,
    r.tecnicoTurno,
  ]);

  // Overwrite rows from row 2
  const range = encodeURIComponent(`'Checklist Sistemas'!A2:S${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error en sincronización a Google Sheets (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Synchronizes all incident tickets to Google Sheets
 */
export async function syncAllIncidentsToDrive(
  accessToken: string,
  spreadsheetId: string,
  incidents: IncidentTicket[]
): Promise<any> {
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  try {
    const clearRange = encodeURIComponent("'Mesa Incidencias'!A2:H");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear incidents range:', clearErr);
  }

  if (incidents.length === 0) return { cleared: true };

  const values = incidents.map((inc) => [
    inc.codigo,
    inc.titulo,
    inc.categoria,
    inc.prioridad.toUpperCase(),
    inc.estado.toUpperCase(),
    inc.tecnicoAsignado || 'Sin asignar',
    inc.fechaReporte,
    inc.solucionAplicada || '',
  ]);

  const range = encodeURIComponent(`'Mesa Incidencias'!A2:H${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al sincronizar incidencias en Google Sheets (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Synchronizes all overtime and compensatory movements to Google Sheets
 */
export async function syncAllOvertimeToDrive(
  accessToken: string,
  spreadsheetId: string,
  overtimeLogs: OvertimeLog[],
  timeOffDeductions: TimeOffDeduction[],
  employees?: Employee[]
): Promise<any> {
  // 1. Ensure tabs and write headers
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // 2. Clear previous data rows from A2:G to ensure deleted records are wiped out
  try {
    const clearRange = encodeURIComponent("'Horas Extras y Descansos'!A2:G");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear overtime range:', clearErr);
  }

  // Filter out any Darwin Quevedo from overtime (sysadmin/analyst role)
  const validOvertime = overtimeLogs.filter((ot) => {
    const isDarwin = (ot.empleadoNombre || '').toLowerCase() === 'darwin quevedo' || ot.empleadoId === 'emp-1' || ot.empleadoId === 'dquevedo';
    return !isDarwin;
  });

  const validTimeOff = timeOffDeductions.filter((to) => {
    const isDarwin = (to.empleadoNombre || '').toLowerCase() === 'darwin quevedo' || to.empleadoId === 'emp-1' || to.empleadoId === 'dquevedo';
    return !isDarwin;
  });

  // Combine both into unified rows sorted chronologically
  const movements: Array<{
    tipo: string;
    tecnico: string;
    fecha: string;
    motivo: string;
    horas: number;
    detalle: string;
    registradoEn: string;
    sortKey: string;
  }> = [];

  for (const ot of validOvertime) {
    movements.push({
      tipo: 'HORA EXTRA',
      tecnico: ot.empleadoNombre,
      fecha: ot.fecha,
      motivo: `Recargo ${ot.recargo} (+${ot.horasEquivalentes}h equiv)`,
      horas: ot.horasRealizadas,
      detalle: `${ot.motivo} [Aprobado por: ${ot.aprobadoPor}]`,
      registradoEn: ot.creadoEn || ot.fecha,
      sortKey: ot.fecha + (ot.creadoEn || ''),
    });
  }

  for (const to of validTimeOff) {
    movements.push({
      tipo: 'COMPENSATORIO',
      tecnico: to.empleadoNombre,
      fecha: to.fechaDisfrute,
      motivo: `Descanso Compensatorio (${to.tipo})`,
      horas: -to.horasDescontadas,
      detalle: `${to.motivo || 'Descanso programado'} | Saldo: ${to.saldoPrevio}h -> ${to.saldoRestante}h`,
      registradoEn: to.creadoEn || to.fechaSolicitud,
      sortKey: to.fechaDisfrute + (to.creadoEn || ''),
    });
  }

  // Sort descending by date (newest first)
  movements.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  // Also sync employees tab if provided
  if (employees) {
    await syncAllEmployeesToDrive(accessToken, spreadsheetId, employees).catch((e) =>
      console.warn('Error syncing employees tab:', e)
    );
  }

  if (movements.length === 0) {
    return { cleared: true, count: 0 };
  }

  const values = movements.map((m) => [
    m.tipo,
    m.tecnico,
    m.fecha,
    m.motivo,
    m.horas,
    m.detalle,
    m.registradoEn,
  ]);

  const range = encodeURIComponent(`'Horas Extras y Descansos'!A2:G${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al sincronizar horas extras en Google Sheets (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Synchronizes the list of technicians and their available hours balances to the 'Saldos Técnicos' tab
 */
export async function syncAllEmployeesToDrive(
  accessToken: string,
  spreadsheetId: string,
  employees: Employee[]
): Promise<any> {
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // Clear previous data rows from A2:G to ensure removed technicians are wiped out
  try {
    const clearRange = encodeURIComponent("'Saldos Técnicos'!A2:G");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear employees range:', clearErr);
  }

  const activeEmployees = (employees || []).filter((e) => e && e.nombre);
  if (activeEmployees.length === 0) return { cleared: true };

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const values = activeEmployees.map((emp) => {
    const isDarwin = emp.id === 'emp-1' || emp.tecnicoCode === 'DQuevedo' || (emp.nombre || '').toLowerCase().includes('darwin');
    return [
      emp.tecnicoCode || '',
      emp.nombre,
      emp.cargo || '',
      emp.email || '',
      isDarwin ? 'No aplica (Analista)' : `${emp.saldoHoras || 0} horas`,
      isDarwin ? '-' : `~${((emp.saldoHoras || 0) / 8).toFixed(1)} días`,
      nowStr,
    ];
  });

  const range = encodeURIComponent(`'Saldos Técnicos'!A2:G${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`Error al guardar saldos en Google Sheet: ${err}`);
  }

  return await res.json().catch(() => ({}));
}

/**
 * Synchronizes the Control Técnico Checklist rows to the 'Checklist Control Técnico' tab
 */
export async function syncAllControlTecnicoToDrive(
  accessToken: string,
  spreadsheetId: string,
  rows: ControlTecnicoRow[]
): Promise<any> {
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // Clear previous data rows from A2:AD
  try {
    const clearRange = encodeURIComponent("'Checklist Control Técnico'!A2:AD");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear control técnico sheet range:', clearErr);
  }

  if (!rows || rows.length === 0) return { cleared: true };

  const values = rows.map((r) => [
    r.fecha || '',
    r.hora || '',
    r.rxSatNacAv ? 'OK' : 'FALLA',
    r.rxSatNacCn || '',
    r.rxSatNacLm || '',
    r.rxSatNacBer || '',
    r.rxSatIntAv ? 'OK' : 'FALLA',
    r.rxSatIntCn || '',
    r.rxSatIntLm || '',
    r.rxSatIntBer || '',
    r.monAireAnalogaAu ? 'OK' : 'FALLA',
    r.monAireAnalogaVd ? 'OK' : 'FALLA',
    r.monAireHdAu ? 'OK' : 'FALLA',
    r.monAireHdVd ? 'OK' : 'FALLA',
    r.monAireSdAu ? 'OK' : 'FALLA',
    r.monAireSdVd ? 'OK' : 'FALLA',
    r.radioPubSatAu ? 'OK' : 'FALLA',
    r.radioPubInovonicAu ? 'OK' : 'FALLA',
    r.ctrlMasterNacAu ? 'OK' : 'FALLA',
    r.ctrlMasterNacVd ? 'OK' : 'FALLA',
    r.ctrlMasterIntAu ? 'OK' : 'FALLA',
    r.ctrlMasterIntVd ? 'OK' : 'FALLA',
    r.hispasatSrtAu ? 'OK' : 'FALLA',
    r.hispasatSrtVd ? 'OK' : 'FALLA',
    r.foPresPing ? 'OK' : 'FALLA',
    r.foGyePing ? 'OK' : 'FALLA',
    r.tempCer201 || '20',
    r.tempCer202 || 'N/A',
    r.observaciones || 'S/N',
    r.tecnicoTurno || '',
  ]);

  const range = encodeURIComponent(`'Checklist Control Técnico'!A2:AD${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  return await res.json().catch(() => ({}));
}

/**
 * Synchronizes IPv4 Networks and IP Assignments to the 'Gestión de IPs' tab
 */
export async function syncAllIpManagementToDrive(
  accessToken: string,
  spreadsheetId: string,
  networks: Ipv4Network[],
  assignments: IpAssignment[]
): Promise<any> {
  await ensureSpreadsheetTabsAndHeaders(accessToken, spreadsheetId);

  // Clear previous data rows from A2:K
  try {
    const clearRange = encodeURIComponent("'Gestión de IPs'!A2:K");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear IPs sheet range:', clearErr);
  }

  if (!assignments || assignments.length === 0) return { cleared: true };

  const netMap = new Map((networks || []).map((n) => [n.id, n]));

  const values = assignments.map((a) => {
    const net = netMap.get(a.networkId);
    return [
      a.ip || '',
      a.hostname || '',
      a.tipoDispositivo || 'otro',
      a.estado || 'asignada',
      net ? net.segmento : '',
      net ? net.vlan || '' : '',
      a.macAddress || '',
      a.ubicacion || '',
      a.responsable || '',
      a.observaciones || '',
      a.ultimaModificacion || '',
    ];
  });

  const range = encodeURIComponent(`'Gestión de IPs'!A2:K${values.length + 1}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  return await res.json().catch(() => ({}));
}

/**
 * Reads all data rows from the 3 main tabs of the Google Spreadsheet
 */
export async function readAllFromDriveSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  checklistRows: BroadcastChecklistRow[];
  incidents: IncidentTicket[];
  overtimeRows: any[];
} | null> {
  try {
    const ranges = [
      encodeURIComponent("'Checklist Sistemas'!A2:S"),
      encodeURIComponent("'Mesa Incidencias'!A2:H"),
      encodeURIComponent("'Horas Extras y Descansos'!A2:G"),
    ].join('&ranges=');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn('Could not batch get sheets:', res.status);
      return null;
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    // Parse checklist
    const checklistValues = valueRanges[0]?.values || [];
    const checklistRows: BroadcastChecklistRow[] = checklistValues.map((row: string[], idx: number) => ({
      id: `chk-drive-${idx}`,
      programa: row[0] || '',
      fecha: row[1] || '',
      hora: row[2] || '',
      enpsSvrPrimario: (row[3] || 'ok') as any,
      enpsSvrSecundario: (row[4] || 'ok') as any,
      noticiasK2Aire: (row[5] || 'ok') as any,
      noticiasNexio: (row[6] || 'ok') as any,
      legalrecRadio: (row[7] || 'ok') as any,
      legalrecTv: (row[8] || 'ok') as any,
      mosSvrPrincipal: (row[9] || 'ok') as any,
      oradSrvHdvg: (row[10] || 'ok') as any,
      oradMaestroPc: (row[11] || 'ok') as any,
      provysSvrBdd: (row[12] || 'ok') as any,
      prompterPcCliente: (row[13] || 'ok') as any,
      zoomPcZoom: (row[14] || 'ok') as any,
      internetEnlacePrincipal: (row[15] || 'ok') as any,
      internetEnlaceSecundario: (row[16] || 'ok') as any,
      observaciones: row[17] || '',
      tecnicoTurno: (row[18] || 'DQuevedo') as any,
    }));

    // Parse incidents
    const incidentValues = valueRanges[1]?.values || [];
    const incidents: IncidentTicket[] = incidentValues.map((row: string[], idx: number) => ({
      id: `inc-drive-${idx}`,
      codigo: row[0] || `INC-${Date.now()}-${idx}`,
      titulo: row[1] || '',
      categoria: (row[2] || 'Servidores') as any,
      prioridad: (row[3]?.toLowerCase() || 'media') as any,
      estado: (row[4]?.toLowerCase() || 'abierto') as any,
      tecnicoAsignado: (row[5] || 'Sin asignar') as any,
      fechaReporte: row[6] || new Date().toISOString(),
      solucionAplicada: row[7] || '',
      descripcion: row[1] || '',
    }));

    const overtimeValues = valueRanges[2]?.values || [];

    return {
      checklistRows,
      incidents,
      overtimeRows: overtimeValues,
    };
  } catch (err) {
    console.error('Error reading from Drive spreadsheet:', err);
    return null;
  }
}
