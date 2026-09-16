import React, { useState } from 'react';
import { GoogleAccessPolicy, AccessControlMode } from '../types';
import { 
  Shield, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Plus, 
  Trash2, 
  UserCheck, 
  AlertCircle, 
  Check, 
  X,
  Mail,
  Crown
} from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  policy: GoogleAccessPolicy;
  onUpdatePolicy: (newPolicy: GoogleAccessPolicy) => void;
  currentUser: User | null;
  isAdmin?: boolean;
}

export const AccessControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  policy,
  onUpdatePolicy,
  currentUser,
  isAdmin = true,
}) => {
  const [mode, setMode] = useState<AccessControlMode>(policy.mode);
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(policy.authorizedEmails);
  const [adminEmails, setAdminEmails] = useState<string[]>(policy.adminEmails);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor ingresa una dirección de correo electrónico válida de Google.');
      return;
    }

    if (authorizedEmails.some((email) => email.toLowerCase() === cleanEmail)) {
      setError('Este correo electrónico ya se encuentra en la lista autorizada.');
      return;
    }

    setAuthorizedEmails([...authorizedEmails, cleanEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setError(null);
    const cleanToRemove = emailToRemove.toLowerCase();

    // Prevent removing all admins
    const remainingAdmins = adminEmails.filter((a) => a.toLowerCase() !== cleanToRemove);
    if (adminEmails.includes(emailToRemove) && remainingAdmins.length === 0) {
      setError('No puedes eliminar el único correo administrador. Debe existir al menos un administrador.');
      return;
    }

    setAuthorizedEmails(authorizedEmails.filter((e) => e.toLowerCase() !== cleanToRemove));
    setAdminEmails(adminEmails.filter((e) => e.toLowerCase() !== cleanToRemove));
  };

  const handleToggleAdmin = (email: string) => {
    const clean = email.toLowerCase();
    const isAdmin = adminEmails.some((a) => a.toLowerCase() === clean);

    if (isAdmin) {
      if (adminEmails.length <= 1) {
        setError('Debe existir al menos un correo con permisos de administrador.');
        return;
      }
      setAdminEmails(adminEmails.filter((a) => a.toLowerCase() !== clean));
    } else {
      setAdminEmails([...adminEmails, clean]);
    }
  };

  const handleSave = () => {
    const updatedPolicy: GoogleAccessPolicy = {
      mode,
      authorizedEmails,
      adminEmails,
    };
    onUpdatePolicy(updatedPolicy);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Control de Acceso y Autorización Google
              </h3>
              <p className="text-xs text-zinc-400">
                Configura quiénes pueden acceder a llenar y modificar la información en la plataforma.
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

        {/* Current user badge */}
        {currentUser?.email && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Sesión activa: <strong className="text-white">{currentUser.email}</strong></span>
            </div>
            {adminEmails.some((a) => a.toLowerCase() === currentUser.email?.toLowerCase()) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" />
                Administrador
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                Técnico (Solo Lectura)
              </span>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Solo los usuarios administradores autorizados pueden agregar, eliminar correos o modificar los permisos de acceso.
            </span>
          </div>
        )}

          {/* Mode Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Modo de Acceso a la Plataforma
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: All Google Users */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setMode('all_google')}
              className={`p-4 rounded-xl border text-left transition relative ${
                !isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                mode === 'all_google'
                  ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/60 text-white'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className={`w-4 h-4 ${mode === 'all_google' ? 'text-cyan-400' : 'text-zinc-400'}`} />
                <span className="font-semibold text-sm">Cualquier cuenta Google</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Cualquier usuario con una cuenta de Google puede acceder a llenar turnos, tickets y registrar datos.
              </p>
              {mode === 'all_google' && (
                <div className="absolute top-3 right-3 text-cyan-400">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>

            {/* Mode 2: Whitelist Only */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setMode('authorized_only')}
              className={`p-4 rounded-xl border text-left transition relative ${
                !isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                mode === 'authorized_only'
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 text-white'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className={`w-4 h-4 ${mode === 'authorized_only' ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span className="font-semibold text-sm">Solo correos autorizados</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Solo los correos especificados en la lista blanca tienen autorización para ingresar y modificar datos.
              </p>
              {mode === 'authorized_only' && (
                <div className="absolute top-3 right-3 text-amber-400">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Whitelist Management Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Lista Blanca de Correos de Google ({authorizedEmails.length})
            </label>
            <span className="text-[11px] text-zinc-500">
              {mode === 'authorized_only' ? 'Activa y obligatoria' : 'Configurada (Inactiva en modo abierto)'}
            </span>
          </div>

          {/* Add email form (only for admin) */}
          {isAdmin ? (
            <form onSubmit={handleAddEmail} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@comunica.ec o usuario@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Autorizar</span>
              </button>
            </form>
          ) : (
            <p className="text-xs text-zinc-500 italic">Solo administradores pueden agregar o eliminar correos.</p>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* List of emails */}
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 divide-y divide-zinc-850 max-h-48 overflow-y-auto">
            {authorizedEmails.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No hay correos en la lista blanca. Agrega uno arriba.
              </div>
            ) : (
              authorizedEmails.map((email) => {
                const isItemAdmin = adminEmails.some((a) => a.toLowerCase() === email.toLowerCase());
                const isCurrent = currentUser?.email?.toLowerCase() === email.toLowerCase();

                return (
                  <div key={email} className="p-2.5 px-3 flex items-center justify-between gap-3 text-xs hover:bg-zinc-900/80 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className={`w-3.5 h-3.5 shrink-0 ${isItemAdmin ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span className="text-zinc-200 truncate font-mono text-[11px]">{email}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          Tú
                        </span>
                      )}
                    </div>

                    {isAdmin ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(email)}
                          title={isItemAdmin ? 'Quitar rol de Administrador' : 'Asignar como Administrador'}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                            isItemAdmin
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300 hover:bg-amber-900'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Crown className="w-2.5 h-2.5" />
                          <span>{isItemAdmin ? 'Admin' : 'Hacer Admin'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          title="Eliminar de la lista autorizada"
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isItemAdmin ? 'text-amber-400 bg-amber-950/50' : 'text-zinc-400 bg-zinc-800'}`}>
                        {isItemAdmin ? 'Administrador' : 'Técnico'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-500">
            {savedSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ¡Permisos guardados correctamente!
              </span>
            ) : (
              'Los cambios se aplican de inmediato en la sesión.'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition cursor-pointer"
            >
              {isAdmin ? 'Cancelar' : 'Cerrar'}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
