import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldAlert, 
  X, 
  Lock,
  Unlock,
  Sparkles,
  Save,
  ShieldCheck,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdateEmployeeCode: (employeeId: string, newCode: string) => void;
  isAdmin?: boolean;
}

export const WorkerPinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employees,
  onUpdateEmployeeCode,
  isAdmin = false,
}) => {
  // Navigation tabs: 'admin' (all codes, master protected) vs 'my_pin' (self-service for individual technician)
  const [activeTab, setActiveTab] = useState<'admin' | 'my_pin'>('admin');

  // Master Admin Authentication
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  // Visibility toggles in admin view: maps employee ID to boolean (default hidden)
  const [visibleCodeIds, setVisibleCodeIds] = useState<{ [empId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingCodes, setEditingCodes] = useState<{ [empId: string]: string }>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Self-service PIN change for an individual worker
  const [myEmpId, setMyEmpId] = useState<string>('');
  const [myCurrentPin, setMyCurrentPin] = useState<string>('');
  const [myNewPin, setMyNewPin] = useState<string>('');
  const [mySelfError, setMySelfError] = useState<string | null>(null);
  const [mySelfSuccess, setMySelfSuccess] = useState<string | null>(null);
  const [showMyNewPin, setShowMyNewPin] = useState<boolean>(false);

  // Reset states when opening/closing
  useEffect(() => {
    if (isOpen) {
      // If user is verified Google Admin, we can auto-unlock or keep it ready
      if (isAdmin) {
        setIsAdminUnlocked(true);
      } else {
        setIsAdminUnlocked(false);
      }
      setAdminPinInput('');
      setAdminPinError(null);
      setMySelfError(null);
      setMySelfSuccess(null);
      setMyCurrentPin('');
      setMyNewPin('');
      setVisibleCodeIds({});
      if (employees.length > 0 && !myEmpId) {
        setMyEmpId(employees[0].id);
      }
    }
  }, [isOpen, isAdmin, employees]);

  if (!isOpen) return null;

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError(null);
    const cleaned = adminPinInput.trim().toUpperCase();
    if (cleaned === 'ADMIN-2026' || cleaned === 'ADMIN2026') {
      setIsAdminUnlocked(true);
      setAdminPinInput('');
    } else {
      setAdminPinError('Clave Maestra de Supervisión incorrecta. Acceso denegado.');
    }
  };

  const handleToggleSingleVisibility = (empId: string) => {
    setVisibleCodeIds((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const handleCopy = (emp: Employee) => {
    const code = editingCodes[emp.id] ?? emp.codigoSeguridad ?? `${emp.tecnicoCode}-2026`;
    navigator.clipboard.writeText(code);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGenerateRandom = (emp: Employee) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = (emp.tecnicoCode || 'EMP').toUpperCase().slice(0, 3);
    const newPin = `${prefix}-${randomNum}`;
    setEditingCodes((prev) => ({ ...prev, [emp.id]: newPin }));
    // Auto make visible so admin can see what was generated
    setVisibleCodeIds((prev) => ({ ...prev, [emp.id]: true }));
  };

  const handleSaveCode = (emp: Employee) => {
    const codeToSave = (editingCodes[emp.id] ?? emp.codigoSeguridad ?? `${emp.tecnicoCode}-2026`).trim();
    if (!codeToSave) return;
    onUpdateEmployeeCode(emp.id, codeToSave);
    setSavedSuccessId(emp.id);
    setTimeout(() => setSavedSuccessId(null), 2000);
  };

  const handleSelfServiceChange = (e: React.FormEvent) => {
    e.preventDefault();
    setMySelfError(null);
    setMySelfSuccess(null);

    const emp = employees.find((x) => x.id === myEmpId);
    if (!emp) {
      setMySelfError('Trabajador no encontrado.');
      return;
    }

    const expected = (emp.codigoSeguridad || `${emp.tecnicoCode}-2026`).trim().toUpperCase();
    const providedCurrent = myCurrentPin.trim().toUpperCase();

    if (providedCurrent !== expected && providedCurrent !== 'ADMIN-2026') {
      setMySelfError('Tu PIN actual es incorrecto. Si lo olvidaste, solicita al supervisor que lo restablezca.');
      return;
    }

    const newClean = myNewPin.trim().toUpperCase();
    if (newClean.length < 4) {
      setMySelfError('El nuevo código debe tener al menos 4 caracteres (ej: MB-2026).');
      return;
    }

    onUpdateEmployeeCode(emp.id, newClean);
    setMySelfSuccess(`¡Tu PIN personal ha sido actualizado con éxito! Nuevo código: ${newClean}`);
    setMyCurrentPin('');
    setMyNewPin('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Códigos Únicos de Seguridad
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  Privacidad Protegida
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                PIN intransferible por trabajador para evitar acreditación o deducción indebida de horas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-600/20 border border-amber-600/40 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Directorio de Supervisión (Todos)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_pin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'my_pin'
                ? 'bg-cyan-600/20 border border-cyan-600/40 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mi PIN Personal (Técnico)</span>
          </button>
        </div>

        {/* TAB 1: ADMIN VIEW (Protected by Supervisor Master PIN) */}
        {activeTab === 'admin' && (
          <>
            {!isAdminUnlocked ? (
              <div className="p-6 rounded-xl border border-amber-900/60 bg-amber-950/20 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    Acceso Restringido a Supervisión
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Al ser este un equipo compartido, el directorio completo de códigos está protegido para que ningún colaborador pueda ver los PINs de sus compañeros.
                  </p>
                </div>

                <form onSubmit={handleAdminUnlock} className="max-w-xs mx-auto space-y-3 pt-2">
                  <div>
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      placeholder="Ingrese Clave Maestra de Supervisor"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-amber-500 placeholder:text-zinc-600 tracking-wider"
                      autoFocus
                    />
                  </div>

                  {adminPinError && (
                    <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-[11px] flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{adminPinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Desbloquear Directorio</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Unlocked banner with Lock-Out control */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-zinc-200 block">Modo Administrador Desbloqueado</span>
                      <span className="text-[11px] text-zinc-500">Los códigos permanecen ocultos hasta que pulses el ojo de cada fila.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminUnlocked(false);
                      setVisibleCodeIds({});
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Bloquear de inmediato para proteger la privacidad en esta máquina compartida"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Bloquear Ahora</span>
                  </button>
                </div>

                {/* Worker list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      Colaboradores Activos ({employees.length})
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Toca el icono del ojo para revelar u ocultar cada PIN
                    </span>
                  </div>

                  <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 divide-y divide-zinc-850">
                    {employees.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        No hay trabajadores en el banco de horas extras.
                      </div>
                    ) : (
                      employees.map((emp) => {
                        const currentCode = editingCodes[emp.id] ?? emp.codigoSeguridad ?? `${emp.tecnicoCode}-2026`;
                        const isModified = editingCodes[emp.id] !== undefined && editingCodes[emp.id] !== emp.codigoSeguridad;
                        const isCopied = copiedId === emp.id;
                        const isSaved = savedSuccessId === emp.id;
                        const isVisible = !!visibleCodeIds[emp.id];

                        return (
                          <div key={emp.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-zinc-900/60 transition">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-200">{emp.nombre}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">
                                  {emp.tecnicoCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{emp.cargo}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <div className="relative flex items-center">
                                <input
                                  type={isVisible ? 'text' : 'password'}
                                  value={currentCode}
                                  onChange={(e) => {
                                    setEditingCodes({ ...editingCodes, [emp.id]: e.target.value.toUpperCase() });
                                  }}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-mono font-bold text-cyan-300 tracking-wider text-center focus:outline-none focus:border-cyan-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleToggleSingleVisibility(emp.id)}
                                  className="p-1 text-zinc-400 hover:text-zinc-200 ml-1 rounded hover:bg-zinc-800 transition cursor-pointer"
                                  title={isVisible ? 'Ocultar código' : 'Ver código'}
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleGenerateRandom(emp)}
                                title="Generar nuevo código aleatorio"
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopy(emp)}
                                title="Copiar código al portapapeles"
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition cursor-pointer"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {isModified && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveCode(emp)}
                                  title="Guardar nuevo código"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition cursor-pointer shrink-0 shadow-sm"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Guardar</span>
                                </button>
                              )}

                              {isSaved && (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Guardado
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: SELF SERVICE FOR INDIVIDUAL TECHNICIAN */}
        {activeTab === 'my_pin' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Consulta y Cambio de PIN Personal
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Si eres técnico y necesitas cambiar tu clave de autorización, ingresa tu PIN actual para identificarte y define tu nueva contraseña privada.
              </p>
            </div>

            <form onSubmit={handleSelfServiceChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Selecciona tu Nombre
                </label>
                <select
                  value={myEmpId}
                  onChange={(e) => {
                    setMyEmpId(e.target.value);
                    setMySelfError(null);
                    setMySelfSuccess(null);
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.tecnicoCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tu PIN Actual *
                </label>
                <input
                  type="password"
                  required
                  value={myCurrentPin}
                  onChange={(e) => setMyCurrentPin(e.target.value)}
                  placeholder="Introduce tu PIN vigente"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Por seguridad, debes verificar tu clave anterior antes de cambiarla.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">
                    Nuevo PIN Deseado *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMyNewPin(!showMyNewPin)}
                    className="text-[11px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    {showMyNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showMyNewPin ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <input
                  type={showMyNewPin ? 'text' : 'password'}
                  required
                  value={myNewPin}
                  onChange={(e) => setMyNewPin(e.target.value.toUpperCase())}
                  placeholder="Ej: MB-8421"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 tracking-wider"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Crea una combinación fácil de recordar para ti y no la compartas con nadie.
                </span>
              </div>

              {mySelfError && (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{mySelfError}</span>
                </div>
              )}

              {mySelfSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{mySelfSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Actualizar Mi PIN Personal</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            {activeTab === 'admin' && isAdminUnlocked
              ? '⚠️ Recuerda cerrar o bloquear esta ventana antes de abandonar la pantalla.'
              : 'Privacidad garantizada en terminales de uso compartido.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
