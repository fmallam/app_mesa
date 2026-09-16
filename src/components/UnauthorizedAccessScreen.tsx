import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  ShieldAlert, 
  Lock, 
  LogOut, 
  RefreshCw, 
  Mail, 
  Key, 
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { googleSignIn, logoutGoogle } from '../lib/googleAuth';

interface Props {
  currentUser: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  adminEmails: string[];
  onAdminUnlock: () => void;
}

export const UnauthorizedAccessScreen: React.FC<Props> = ({
  currentUser,
  onAuthSuccess,
  adminEmails,
  onAdminUnlock,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdminPinInput, setShowAdminPinInput] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      let userFriendlyMsg = err.message || 'Error al iniciar sesión con Google';
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMsg = 'Se cerró la ventana emergente de Google antes de completar la autenticación.';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMsg = 'El navegador bloqueó la ventana emergente. Por favor permite las ventanas emergentes (popups) para este sitio.';
      } else if (err.code === 'auth/unauthorized-domain') {
        userFriendlyMsg = 'El dominio no está autorizado en la consola de Firebase Authentication.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMsg = 'Operación cancelada por otra solicitud en curso.';
      }
      setErrorMessage(userFriendlyMsg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === 'ADMIN-2026') {
      onAdminUnlock();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2500);
    }
  };

  const primaryAdmin = adminEmails[0] || 'fmallam@unemi.edu.ec';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title and message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Acceso Restringido a Personal Autorizado
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            El sistema de Operaciones y Horas Extras se encuentra en modo restringido. Solo los correos de Google autorizados por la administración tienen permiso de acceso.
          </p>
        </div>

        {/* Logged in or Not logged in details */}
        {currentUser ? (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Cuenta de Google detectada:</span>
              <span className="font-mono text-zinc-200 font-semibold truncate max-w-[220px]">
                {currentUser.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span>Estado de autorización:</span>
              <span className="font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No Autorizado
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
              Tu correo no figura en la lista blanca de técnicos o administradores habilitados.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400 space-y-1">
            <p>Debes identificarte con tu cuenta de Google institucional para comprobar tus permisos.</p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          {currentUser ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSigningIn ? 'animate-spin' : ''}`} />
                <span>{isSigningIn ? 'Conectando...' : 'Cambiar de Cuenta Google'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-xl transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Conectando con Google...' : 'Iniciar Sesión con Google'}</span>
            </button>
          )}

          {/* Contact Admin Info */}
          <div className="pt-3 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Contacto del Administrador: <strong>{primaryAdmin}</strong></span>
          </div>
        </div>

        {/* Emergency Admin PIN override */}
        <div className="pt-2 border-t border-zinc-900">
          {!showAdminPinInput ? (
            <button
              type="button"
              onClick={() => setShowAdminPinInput(true)}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition cursor-pointer inline-flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              <span>¿Eres el Administrador? Ingresar con PIN de emergencia</span>
            </button>
          ) : (
            <form onSubmit={handleVerifyAdminPin} className="space-y-2 mt-2">
              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <input
                  type="password"
                  placeholder="PIN Maestro (ADMIN-2026)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-center"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Acceder
                </button>
              </div>
              {pinError && (
                <p className="text-[10px] text-red-400 font-medium">
                  PIN de administrador incorrecto.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
