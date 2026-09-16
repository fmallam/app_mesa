import React, { useState, useEffect } from 'react';
import { Employee, OperationalArea, TechnicianSession } from '../types';
import { Shield, User, KeyRound, Radio, Tv, Layers, CheckCircle2, AlertCircle, LogIn, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  employees: Employee[];
  currentUserEmail?: string | null;
  isAdminGoogle: boolean;
  onLoginSuccess: (session: TechnicianSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  employees,
  currentUserEmail,
  isAdminGoogle,
  onLoginSuccess,
}) => {
  const [selectedCode, setSelectedCode] = useState('');
  const [pin, setPin] = useState('');
  const [area, setArea] = useState<OperationalArea>('multimedia');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill code if there is an employee matching email or default
  useEffect(() => {
    if (employees.length > 0 && !selectedCode) {
      const match = employees.find(
        (e) => currentUserEmail && e.email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      if (match) {
        setSelectedCode(match.tecnicoCode);
        if (match.area && match.area !== 'todas') {
          setArea(match.area);
        }
      } else {
        setSelectedCode(employees[0].tecnicoCode);
        if (employees[0].area && employees[0].area !== 'todas') {
          setArea(employees[0].area);
        }
      }
    }
  }, [employees, currentUserEmail, selectedCode]);

  // When selected code changes, auto-suggest area
  const handleCodeChange = (code: string) => {
    setSelectedCode(code);
    const emp = employees.find((e) => e.tecnicoCode.toLowerCase() === code.toLowerCase());
    if (emp && emp.area && emp.area !== 'todas') {
      setArea(emp.area);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Admin mode login
    if (isAdminMode) {
      const validAdminPins = ['ADMIN-2026', 'FMALLA-2026', 'DQ-2026'];
      if (isAdminGoogle || validAdminPins.includes(adminPin.trim().toUpperCase())) {
        onLoginSuccess({
          nombre: 'Administrador General',
          tecnicoCode: 'ADMIN',
          area: 'todas',
          isAdmin: true,
          loggedAt: Date.now(),
        });
        return;
      } else {
        setError('PIN Maestro de Administrador inválido. Contacte al administrador del sistema.');
        return;
      }
    }

    // Technician login
    const cleanCode = selectedCode.trim();
    if (!cleanCode) {
      setError('Por favor seleccione o ingrese su Código de Turno.');
      return;
    }

    const emp = employees.find(
      (e) => e.tecnicoCode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!emp) {
      setError(`No se encontró ningún trabajador registrado con el código "${cleanCode}".`);
      return;
    }

    // Validate PIN
    const expectedPin = (emp.codigoSeguridad || `${emp.tecnicoCode}-2026`).trim().toUpperCase();
    const inputPin = pin.trim().toUpperCase();

    // Check if input matches personal PIN or master override
    if (inputPin !== expectedPin && inputPin !== 'ADMIN-2026') {
      setError(`Código de seguridad (PIN) incorrecto para el técnico ${emp.nombre}.`);
      return;
    }

    // Determine effective area
    const effectiveArea: OperationalArea = area || emp.area || 'multimedia';

    onLoginSuccess({
      employeeId: emp.id,
      nombre: emp.nombre,
      tecnicoCode: emp.tecnicoCode,
      area: effectiveArea,
      isAdmin: false,
      loggedAt: Date.now(),
    });
  };

  const handleFastAdminLogin = () => {
    onLoginSuccess({
      nombre: currentUserEmail ? currentUserEmail.split('@')[0] : 'Freddy Malla (Admin)',
      tecnicoCode: 'Fmalla',
      area: 'todas',
      isAdmin: true,
      loggedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-zinc-950 p-6 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-wider text-base">COMUNICA EP</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-semibold border border-cyan-700/50">
                  OPERACIONES
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Empresa Pública de Comunicación del Ecuador
              </p>
            </div>
          </div>
          <h1 className="text-lg font-bold text-white mt-4">
            Bienvenido al Sistema de Turnos & Control Operativo
          </h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Ingrese su código de turno y PIN de seguridad para acceder a los checklists y registros autorizados para su área.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch: Technician vs Administrator */}
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(false);
                setError(null);
              }}
              className={`flex-1 py-2 font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                !isAdminMode ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Ingreso Técnico de Turno</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(true);
                setError(null);
              }}
              className={`flex-1 py-2 font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                isAdminMode ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso Administrador</span>
            </button>
          </div>

          {!isAdminMode ? (
            <>
              {/* Field 1: Código de Turno */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Código de Turno (Inicial Nombre + Apellido)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Ej: Fmalla, DQuevedo, AUreña</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <select
                    id="login-tecnico-code"
                    value={selectedCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Seleccione su Usuario / Técnico --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.tecnicoCode}>
                        {emp.tecnicoCode} ({emp.nombre}) - {emp.area === 'control_tecnico' ? 'Control Técnico' : 'Multimedia'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 2: PIN de Seguridad */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Código Único de Seguridad (PIN)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">PIN configurado en tu ficha</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="login-pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Ej. FMALLA-2026"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 3: Área Operativa */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Área de Asignación para esta Sesión
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setArea('multimedia')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      area === 'multimedia'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <Tv className={`w-5 h-5 mt-0.5 shrink-0 ${area === 'multimedia' ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-xs font-bold">Multimedia</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                        Checklist Sistemas, Gestión IPs, Horas Extras personales
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArea('control_tecnico')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      area === 'control_tecnico'
                        ? 'border-blue-500 bg-blue-950/40 text-blue-200 ring-1 ring-blue-500/50'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <Radio className={`w-5 h-5 mt-0.5 shrink-0 ${area === 'control_tecnico' ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-xs font-bold">Control Técnico</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                        Checklist Satelital, Monitoreo Aire, Horas Extras personales
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Admin Mode Fields */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200 leading-relaxed">
                <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Modo Supervisor / Administrador General</span>
                </div>
                Como Administrador tendrás acceso total a todas las áreas, verás los bancos de horas y kardex de todos los técnicos, configuración de Google Sheets y gestión de IPs.
              </div>

              {isAdminGoogle ? (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Autenticado con cuenta administradora: <strong>{currentUserEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFastAdminLogin}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Ingresar Directo
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    PIN Maestro de Administrador
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-admin-pin"
                      type="password"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="Ingrese PIN Maestro"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    También puede ingresar con su cuenta Google autorizada en el encabezado.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 hover:from-cyan-400 to-blue-600 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isAdminMode ? 'Acceder al Panel de Administración' : 'Ingresar a mi Turno de Trabajo'}</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="bg-zinc-900/60 px-6 py-3 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Sistema Centralizado COMUNICA EP</span>
          <span className="font-mono">v2026.09.1</span>
        </div>
      </div>
    </div>
  );
};
