import React, { useState } from 'react';
import { BroadcastChecklistRow, CheckStatus, Employee } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  ClipboardPaste, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  FileText,
  ExternalLink,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportRows: (rows: Omit<BroadcastChecklistRow, 'id'>[]) => void;
  employees: Employee[];
}

export const GoogleSheetsSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportRows,
  employees,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paste' | 'upload' | 'live_sync'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Omit<BroadcastChecklistRow, 'id'>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedSuccessCount, setImportedSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const parseStatus = (val: string | undefined): CheckStatus => {
    if (!val) return 'na';
    const clean = val.trim().toLowerCase();
    if (['ok', 'si', 'sí', '1', 'true', 'bien', 'activo', 'normal'].includes(clean)) return 'ok';
    if (['falla', 'error', 'no', '0', 'false', 'caido', 'dañado', 'f'].includes(clean)) return 'falla';
    if (['alerta', 'obs', 'observacion', 'observación', 'warn', 'warning', 'al'].includes(clean)) return 'alerta';
    return 'na';
  };

  const handleParseText = (text: string) => {
    setParseError(null);
    setImportedSuccessCount(null);

    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedPreview([]);
      return;
    }

    const newRows: Omit<BroadcastChecklistRow, 'id'>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab (standard for Google Sheets copy-paste) or comma/semicolon
      let cols: string[];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes(';')) {
        cols = line.split(';');
      } else {
        // Fallback to simple comma split (handling basic quotes)
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      }

      cols = cols.map((c) => c.replace(/^["']|["']$/g, '').trim());

      // If this line looks like a header (contains words like "PROGRAMA" or "FECHA"), skip it
      const headerCheck = cols.join(' ').toLowerCase();
      if (headerCheck.includes('programa') && headerCheck.includes('fecha')) {
        continue;
      }

      if (cols.length < 3) continue;

      const programa = cols[0] || 'Emisión Noticias';
      const fecha = cols[1] || new Date().toISOString().split('T')[0];
      const hora = cols[2] || '07h00';

      // Default technician fallback
      let tecnico = employees[0]?.tecnicoCode || 'DQuevedo';
      let observaciones = 'sin novedad';

      // Check if last column or second to last is technician
      if (cols.length >= 19) {
        observaciones = cols[17] || 'sin novedad';
        tecnico = cols[18] || tecnico;
      } else if (cols.length >= 4) {
        // Find if any column matches an employee code
        const matchedEmp = employees.find((e) =>
          cols.some((c) => c.toLowerCase() === e.tecnicoCode.toLowerCase() || c.toLowerCase() === e.nombre.toLowerCase())
        );
        if (matchedEmp) tecnico = matchedEmp.tecnicoCode;
      }

      const row: Omit<BroadcastChecklistRow, 'id'> = {
        programa,
        fecha,
        hora,
        enpsSvrPrimario: parseStatus(cols[3]),
        enpsSvrSecundario: parseStatus(cols[4]),
        noticiasK2Aire: parseStatus(cols[5]),
        noticiasNexio: parseStatus(cols[6]),
        legalrecRadio: parseStatus(cols[7]),
        legalrecTv: parseStatus(cols[8]),
        mosSvrPrincipal: parseStatus(cols[9]),
        oradSrvHdvg: parseStatus(cols[10]),
        oradMaestroPc: parseStatus(cols[11]),
        provysSvrBdd: parseStatus(cols[12]),
        prompterPcCliente: parseStatus(cols[13]),
        zoomPcZoom: parseStatus(cols[14]),
        internetEnlacePrincipal: parseStatus(cols[15]),
        internetEnlaceSecundario: parseStatus(cols[16]),
        observaciones,
        tecnicoTurno: tecnico,
      };

      newRows.push(row);
    }

    if (newRows.length === 0) {
      setParseError('No se reconocieron filas válidas. Asegúrate de copiar las celdas desde Google Sheets.');
    } else {
      setParsedPreview(newRows);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setPastedText(content);
      handleParseText(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportRows(parsedPreview);
    setImportedSuccessCount(parsedPreview.length);
    setTimeout(() => {
      onClose();
      setPastedText('');
      setParsedPreview([]);
      setImportedSuccessCount(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Integración con Google Sheets</h3>
              <p className="text-xs text-zinc-400">Importa tus turnos existentes o sincroniza tu planilla</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="px-6 pt-3 border-b border-zinc-850 flex gap-2 bg-zinc-950">
          <button
            type="button"
            onClick={() => setActiveSubTab('paste')}
            className={`pb-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'paste'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Copiar y Pegar Celdas
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('upload')}
            className={`pb-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'upload'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Archivo (.csv / .tsv)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('live_sync')}
            className={`pb-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'live_sync'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Sincronización en la Nube
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeSubTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instrucciones para importar desde Google Sheets:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                  <li>Abre tu hoja de cálculo en <strong>Google Sheets</strong>.</li>
                  <li>Selecciona las filas que deseas copiar (puedes incluir o no la fila de encabezados).</li>
                  <li>Presiona <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">Ctrl + C</kbd> (o <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">Cmd + C</kbd>).</li>
                  <li>Pega el contenido en el siguiente cuadro con <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">Ctrl + V</kbd>.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Pega aquí las celdas copiadas de Google Sheets:
                </label>
                <textarea
                  id="paste-sheets-textarea"
                  rows={6}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    handleParseText(e.target.value);
                  }}
                  placeholder="Noticiero Matinal	2026-09-10	07h00	OK	OK	OK	OK	OK	OK	OK	OK	OK	OK	OK	OK	OK	OK	sin novedad	DQuevedo"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 transition resize-none placeholder:text-zinc-600"
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Vista previa de registros detectados: <strong className="text-white">{parsedPreview.length} turnos</strong>
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Formato validado
                    </span>
                  </div>

                  <div className="border border-zinc-850 rounded-xl overflow-hidden max-h-40 overflow-y-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
                        <tr>
                          <th className="p-2">Programa</th>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Hora</th>
                          <th className="p-2">Técnico</th>
                          <th className="p-2">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {parsedPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/40 text-zinc-300">
                            <td className="p-2 font-medium text-white">{row.programa}</td>
                            <td className="p-2 font-mono">{row.fecha}</td>
                            <td className="p-2 font-mono">{row.hora}</td>
                            <td className="p-2">{row.tecnicoTurno}</td>
                            <td className="p-2 text-zinc-400 truncate max-w-[150px]">{row.observaciones}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <div className="font-semibold text-emerald-400">Exportar desde Google Sheets a archivo:</div>
                <p className="text-[11px] text-zinc-400">
                  En Google Sheets, dirígete a: <strong className="text-zinc-200">Archivo &gt; Descargar &gt; Valores separados por comas (.csv)</strong> o <strong className="text-zinc-200">Valores separados por tabuladores (.tsv)</strong>, y cárgalo aquí.
                </p>
              </div>

              <div className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-8 text-center transition cursor-pointer relative bg-zinc-900/20">
                <input
                  id="sheets-file-input"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-sm text-white">Haz clic aquí o arrastra tu archivo CSV</div>
                  <p className="text-xs text-zinc-500">Archivos .csv o .tsv descargados de Google Sheets</p>
                </div>
              </div>

              {parsedPreview.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Se procesaron <strong>{parsedPreview.length} registros</strong> correctamente del archivo.
                  </span>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'live_sync' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Conexión con Google Drive y Google Sheets Activada
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  La integración con Google Drive y Sheets está lista. Al iniciar sesión con tu cuenta de Google en la barra superior:
                </p>
                <div className="space-y-2 pt-2 border-t border-zinc-800 text-zinc-400 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[9px] shrink-0 font-bold">✓</span>
                    <span><strong>Creación automática:</strong> Se genera la hoja de cálculo <em>"COMUNICA EP - Registro Centralizado Operaciones"</em> en tu Google Drive.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[9px] shrink-0 font-bold">✓</span>
                    <span><strong>Sincronización en tiempo real:</strong> Cada nuevo checklist registrado se envía inmediatamente a la pestaña <em>Checklist Sistemas</em> de tu Google Sheet.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[9px] shrink-0 font-bold">✓</span>
                    <span><strong>Sincronización masiva:</strong> Puedes presionar <em>"Sincronizar ahora"</em> para volcar todo el historial actual de turnos a tu hoja de Drive con un solo clic.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-850 flex items-center justify-between bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            Cerrar
          </button>

          {activeSubTab !== 'live_sync' && (
            <button
              type="button"
              id="confirm-import-sheets-btn"
              disabled={parsedPreview.length === 0}
              onClick={handleConfirmImport}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                parsedPreview.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {importedSuccessCount !== null ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>¡{importedSuccessCount} registros importados!</span>
                </>
              ) : (
                <>
                  <span>Importar {parsedPreview.length > 0 ? `${parsedPreview.length} registros` : ''}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
