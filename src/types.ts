export type CheckStatus = 'ok' | 'falla' | 'alerta' | 'na';

export interface BroadcastChecklistRow {
  id: string;
  programa: string;
  fecha: string;
  hora: string;
  // ENPS
  enpsSvrPrimario: CheckStatus;
  enpsSvrSecundario: CheckStatus;
  // SISTEMA NOTICIAS
  noticiasK2Aire: CheckStatus;
  noticiasNexio: CheckStatus;
  // LEGALREC
  legalrecRadio: CheckStatus;
  legalrecTv: CheckStatus;
  // MOS
  mosSvrPrincipal: CheckStatus;
  // ORAD
  oradSrvHdvg: CheckStatus;
  oradMaestroPc: CheckStatus;
  // PROVYS
  provysSvrBdd: CheckStatus;
  // PROMPTER
  prompterPcCliente: CheckStatus;
  // ZOOM
  zoomPcZoom: CheckStatus;
  // INTERNET
  internetEnlacePrincipal: CheckStatus;
  internetEnlaceSecundario: CheckStatus;
  // METADATA
  observaciones: string;
  tecnicoTurno: string;
}

export type IncidentPriority = 'baja' | 'media' | 'alta' | 'critica';
export type IncidentStatus = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';

export interface IncidentTicket {
  id: string;
  codigo: string; // ej: INC-2026-001
  titulo: string;
  descripcion: string;
  categoria: 'ENPS' | 'K2 / Nexio' | 'LegalRec' | 'Orad / Gráficos' | 'Provys' | 'Internet / Enlaces' | 'Audio / Video' | 'Prompter' | 'Zoom' | 'General';
  prioridad: IncidentPriority;
  estado: IncidentStatus;
  tecnicoAsignado: string;
  reportadoPor: string;
  fechaReporte: string;
  horaReporte: string;
  fechaSolucion?: string;
  solucionAplicada?: string;
}

export type OperationalArea = 'multimedia' | 'control_tecnico' | 'todas';

export interface Employee {
  id: string;
  nombre: string;
  cargo: string;
  tecnicoCode: string; // ej: DQuevedo, Fmalla, AUreña, PCueva
  email: string;
  saldoHoras: number; // Saldo actual neto acumulado
  codigoSeguridad?: string; // Código único / PIN para autorizar horas extras y login
  area?: OperationalArea;
}

export interface TechnicianSession {
  employeeId?: string;
  nombre: string;
  tecnicoCode: string;
  area: OperationalArea;
  isAdmin: boolean;
  loggedAt: number;
}

export type AccessControlMode = 'all_google' | 'authorized_only';

export interface GoogleAccessPolicy {
  mode: AccessControlMode;
  authorizedEmails: string[]; // Lista blanca de correos de Google autorizados
  adminEmails: string[]; // Administradores con facultad de cambiar políticas y gestionar usuarios
}

export type OvertimeRate = '0%' | '50%' | '100%';

export interface OvertimeLog {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fecha: string;
  horasRealizadas: number;
  recargo: OvertimeRate;
  horasEquivalentes: number; // Por defecto: 50% = 1.5x o tiempo 1:1 con recargo, configurable
  motivo: string;
  aprobadoPor: string;
  creadoEn: string;
}

export interface TimeOffDeduction {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaSolicitud: string;
  fechaDisfrute: string;
  tipo: 'horas' | 'dias';
  cantidadSolicitada: number; // Si es 'dias', ej. 1 día = 8 horas
  horasDescontadas: number;
  saldoPrevio: number;
  saldoRestante: number;
  motivo: string;
  estado: 'aprobado' | 'completado';
  creadoEn: string;
}

export type ActiveTab = 'resumen' | 'checklist' | 'control_tecnico' | 'gestion_ips' | 'incidencias' | 'horas_extras';

// Model for Control Técnico Checklist as per format CGCO-JO-2026-CHK-ING VERSIÓN: 01
export interface ControlTecnicoRow {
  id: string;
  fecha: string;
  hora: string;
  // RX SATELITE NACIONAL
  rxSatNacAv: boolean;
  rxSatNacCn: string;
  rxSatNacLm: string;
  rxSatNacBer: string;
  // RX SATELITE INTERNACIONAL
  rxSatIntAv: boolean;
  rxSatIntCn: string;
  rxSatIntLm: string;
  rxSatIntBer: string;
  // MONITOREO SEÑAL DEL AIRE
  monAireAnalogaAu: boolean;
  monAireAnalogaVd: boolean;
  monAireHdAu: boolean;
  monAireHdVd: boolean;
  monAireSdAu: boolean;
  monAireSdVd: boolean;
  // RADIO PÚBLICA
  radioPubSatAu: boolean;
  radioPubInovonicAu: boolean;
  // CONTROLES MASTER
  ctrlMasterNacAu: boolean;
  ctrlMasterNacVd: boolean;
  ctrlMasterIntAu: boolean;
  ctrlMasterIntVd: boolean;
  // HISPASAT
  hispasatSrtAu: boolean;
  hispasatSrtVd: boolean;
  // CONECTIVIDAD F.O
  foPresPing: boolean;
  foGyePing: boolean;
  // AIRES CER (TEMP CER)
  tempCer201: string;
  tempCer202: string;
  // OBSERVACIONES & TÉCNICO
  observaciones: string;
  tecnicoTurno: string;
}

// Model for IPv4 Management & Device Inventory
export interface Ipv4Network {
  id: string;
  nombre: string; // ej: "Red Broadcast Playout y Servidores", "Red Producción Controles Master"
  segmento: string; // ej: "192.168.10.0/24"
  vlan?: string; // ej: "VLAN 10"
  gateway: string; // ej: "192.168.10.1"
  mascara: string; // ej: "255.255.255.0"
  dnsPrimario?: string; // ej: "192.168.10.2"
  ubicacion?: string; // ej: "Rack Central CER", "Cabina Noticias"
  descripcion?: string;
  creadoEn: string;
}

export type IpAssignmentStatus = 'asignada' | 'disponible' | 'reservada' | 'mantenimiento';

export type DeviceType = 
  | 'servidor'
  | 'estacion_trabajo'
  | 'switch_router'
  | 'encoder_decoder'
  | 'camara_tx'
  | 'prompter'
  | 'audio_master'
  | 'impresora'
  | 'otro';

export interface IpAssignment {
  id: string;
  networkId: string;
  ip: string; // ej: "192.168.10.15"
  hostname: string; // ej: "SRV-ENPS-PRIMARIO"
  tipoDispositivo: DeviceType;
  macAddress?: string; // ej: "00:1A:2B:3C:4D:5E"
  ubicacion?: string; // ej: "Rack 02 - U14"
  estado: IpAssignmentStatus;
  responsable?: string; // ej: "Darwin Quevedo"
  observaciones?: string;
  ultimaModificacion: string;
}

export interface BroadcastProgramTemplate {
  programa: string;
  hora: string;
  descripcion?: string;
}

export const DAILY_BROADCAST_TEMPLATE: BroadcastProgramTemplate[] = [
  { programa: 'Noticiero Matinal', hora: '07h00', descripcion: 'Emisión matutina en vivo' },
  { programa: 'Esto es ecuador', hora: '08h30', descripcion: 'Revista de variedades y cultura' },
  { programa: 'Noticiero Central', hora: '12h30', descripcion: 'Emisión meridiana informativa' },
  { programa: 'Doctor 7', hora: '17h00', descripcion: 'Programa médico y bienestar comunitario' },
  { programa: 'Chef Bigotes', hora: '18h00', descripcion: 'Producción gastronómica y cultural' },
  { programa: 'Noticiero Estelar', hora: '19h00', descripcion: 'Emisión central y estelar de noticias' },
  { programa: 'Deportes', hora: '21h00', descripcion: 'Resumen deportivo nocturno' },
];

export const ESTABLISHED_HOURS: string[] = [
  '07h00',
  '08h30',
  '12h30',
  '17h00',
  '18h00',
  '19h00',
  '21h00',
];
