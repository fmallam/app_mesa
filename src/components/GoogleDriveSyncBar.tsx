import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  LogOut, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Database,
  Check
} from 'lucide-react';
import { googleSignIn, logoutGoogle } from '../lib/googleAuth';
import { 
  findOrCreateComunicaSheet, 
  syncAllRowsToDrive, 
  CHECKLIST_SPREADSHEET_KEY 
} from '../lib/driveSheetsService';
import { 
  BroadcastChecklistRow, 
  IncidentTicket, 
  OvertimeLog, 
  TimeOffDeduction, 
  Employee 
} from '../types';
import { exportAllToExcel } from '../utils/excelExport';

interface Props {
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
  checklistRows: BroadcastChecklistRow[];
  incidents?: IncidentTicket[];
  overtimeLogs?: OvertimeLog[];
  timeOffDeductions?: TimeOffDeduction[];
  employees?: Employee[];
  authorizedEmails?: string[];
  onTriggerFullSync?: () => Promise<void>;
  isSyncingGlobal?: boolean;
  pendingSheetsSync?: boolean;
  lastSheetsSyncTime?: number | null;
}

export const GoogleDriveSyncBar: React.FC<Props> = ({
  user,
  accessToken,
  onAuthChange,
  checklistRows,
  incidents = [],
  overtimeLogs = [],
  timeOffDeductions = [],
  employees = [],
  onTriggerFullSync,
  isSyncingGlobal = false,
  pendingSheetsSync = false,
  lastSheetsSyncTime = null,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const savedId = localStorage.getItem(CHECKLIST_SPREADSHEET_KEY);
    return savedId ? `https://docs.google.com/spreadsheets/d/${savedId}/edit` : null;
  });

  // Keep spreadsheet ID synchronized with server
  useEffect(() => {
    fetch('/api/central-state')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.spreadsheetId) {
          setSpreadsheetUrl(data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`);
          localStorage.setItem(CHECKLIST_SPREADSHEET_KEY, data.spreadsheetId);
        }
      })
      .catch(() => {});
  }, []);

  const isSyncing = isSyncingGlobal || isSyncingLocal;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        const sheet = await findOrCreateComunicaSheet(result.accessToken);
        setSpreadsheetUrl(sheet.url);

        if (onTriggerFullSync) {
          await onTriggerFullSync();
        } else if (checklistRows.length > 0) {
          await syncAllRowsToDrive(result.accessToken, sheet.id, checklistRows);
        }
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      setErrorMessage(err.message || 'Error al conectar con Google Drive');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onAuthChange(null, null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSync = async () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }

    if (onTriggerFullSync) {
      try {
        await onTriggerFullSync();
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 4000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al sincronizar');
      }
      return;
    }

    setIsSyncingLocal(true);
    setErrorMessage(null);
    setSyncSuccess(false);

    try {
      const sheet = await findOrCreateComunicaSheet(accessToken);
      setSpreadsheetUrl(sheet.url);

      await syncAllRowsToDrive(accessToken, sheet.id, checklistRows);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error syncing:', err);
      if (err.message?.includes('401')) {
        onAuthChange(null, null);
        setErrorMessage('La sesión de Google expiró. Vuelve a conectar tu cuenta.');
      } else {
        setErrorMessage(err.message || 'Error al sincronizar con Google Sheets');
      }
    } finally {
      setIsSyncingLocal(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      exportAllToExcel(checklistRows, incidents, overtimeLogs, timeOffDeductions, employees);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error exporting Excel:', err);
      setErrorMessage('Error al generar el archivo Excel');
    }
  };

  return (
    <div className="bg-zinc-950/95 border border-zinc-800/90 rounded-2xl p-4 mb-6 text-xs flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur">
      {/* Left: Realtime status */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-950/50 border-emerald-800/80 text-emerald-400">
          <Database className="w-5 h-5 text-emerald-400" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">
              Base de Datos Centralizada en Tiempo Real
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En Línea y Compartida
            </span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-tight mt-0.5">
            Todos los turnos, incidencias y horas extras se guardan y reflejan al instante para todo el equipo técnico autorizado.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        {errorMessage && (
          <div className="text-[11px] text-red-400 flex items-center gap-1 bg-red-950/50 border border-red-800/60 px-2.5 py-1 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[200px]">{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Excel Download (Bulletproof, no Drive permission hassle) */}
        <button
          id="btn-download-operations-excel"
          type="button"
          onClick={handleDownloadExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          title="Descargar libro de Excel completo con Checklist, Incidencias y Horas Extras"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Excel Descargado!</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Descargar Excel (.xlsx)</span>
            </>
          )}
        </button>

        {/* Google Sheet Direct Link (Always accessible to all team members) */}
        {spreadsheetUrl && (
          <a
            id="link-open-google-drive-sheet"
            href={spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-800/80 bg-zinc-900 hover:bg-zinc-850 text-emerald-300 hover:text-white font-semibold text-xs shadow-sm transition"
            title="Abrir hoja de cálculo oficial en Google Sheets"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver en Sheets</span>
            {pendingSheetsSync ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Hay actividades registradas pendientes por volcar a Sheets" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Google Sheet actualizado al 100%" />
            )}
          </a>
        )}

        {/* Google Workspace Integration */}
        {user && accessToken ? (
          <>
            {/* Sync to Google Sheets button */}
            <button
              id="btn-sync-now-google-drive"
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-medium text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
              title="Volcar todas las actividades del servidor central a Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
              <span>{isSyncing ? 'Guardando...' : syncSuccess ? '¡Guardado en Sheets!' : 'Sincronizar Sheets'}</span>
              {syncSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Disconnect Google */}
            <button
              id="btn-google-signout"
              type="button"
              onClick={handleSignOut}
              title={`Conectado como ${user.email}. Clic para desconectar.`}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            id="btn-google-signin"
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-lg transition active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Conectar con Google Drive para crear copias y sincronizar en la nube"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isSigningIn ? 'Conectando...' : 'Conectar Google Sheets'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
