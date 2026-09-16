import * as XLSX from 'xlsx';
import { BroadcastChecklistRow, IncidentTicket, OvertimeLog, TimeOffDeduction, Employee } from '../types';

export function exportAllToExcel(
  checklistRows: BroadcastChecklistRow[],
  incidents: IncidentTicket[],
  overtimeLogs: OvertimeLog[],
  timeOffDeductions: TimeOffDeduction[],
  employees: Employee[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Checklist Sheet
  const checklistData = checklistRows.map((r, idx) => ({
    '#': idx + 1,
    'Programa': r.programa,
    'Fecha': r.fecha,
    'Hora': r.hora,
    'Técnico de Turno': r.tecnicoTurno,
    'ENPS Svr Primario': (r.enpsSvrPrimario || '').toUpperCase(),
    'ENPS Svr Secundario': (r.enpsSvrSecundario || '').toUpperCase(),
    'K2 Noticias Aire': (r.noticiasK2Aire || '').toUpperCase(),
    'Nexio': (r.noticiasNexio || '').toUpperCase(),
    'LegalRec Radio': (r.legalrecRadio || '').toUpperCase(),
    'LegalRec TV': (r.legalrecTv || '').toUpperCase(),
    'MOS Svr Principal': (r.mosSvrPrincipal || '').toUpperCase(),
    'Orad SRV HDVG': (r.oradSrvHdvg || '').toUpperCase(),
    'Orad Maestro PC': (r.oradMaestroPc || '').toUpperCase(),
    'Provys Svr BDD': (r.provysSvrBdd || '').toUpperCase(),
    'Prompter PC Cliente': (r.prompterPcCliente || '').toUpperCase(),
    'Zoom PC': (r.zoomPcZoom || '').toUpperCase(),
    'Internet Principal': (r.internetEnlacePrincipal || '').toUpperCase(),
    'Internet Secundario': (r.internetEnlaceSecundario || '').toUpperCase(),
    'Observaciones': r.observaciones || 'Sin observaciones',
  }));
  const wsChecklist = XLSX.utils.json_to_sheet(checklistData);
  XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklist Sistemas');

  // 2. Incidents Sheet
  const incidentsData = incidents.map((i, idx) => ({
    '#': idx + 1,
    'Código': i.codigo,
    'Título': i.titulo,
    'Categoría': i.categoria,
    'Prioridad': (i.prioridad || '').toUpperCase(),
    'Estado': (i.estado || '').toUpperCase(),
    'Técnico Asignado': i.tecnicoAsignado,
    'Reportado Por': i.reportadoPor,
    'Fecha Reporte': i.fechaReporte,
    'Hora Reporte': i.horaReporte,
    'Descripción del Problema': i.descripcion,
    'Fecha Solución': i.fechaSolucion || 'Pendiente',
    'Solución Aplicada': i.solucionAplicada || 'En atención',
  }));
  const wsIncidents = XLSX.utils.json_to_sheet(incidentsData);
  XLSX.utils.book_append_sheet(wb, wsIncidents, 'Mesa de Incidencias');

  // 3. Overtime Logs Sheet
  const overtimeData = overtimeLogs.map((o, idx) => ({
    '#': idx + 1,
    'Fecha Actividad': o.fecha,
    'Técnico': o.empleadoNombre,
    'Horas Realizadas': o.horasRealizadas,
    'Recargo (%)': o.recargo,
    'Horas Equivalentes (Abono)': o.horasEquivalentes,
    'Motivo / Tarea': o.motivo,
    'Aprobado Por': o.aprobadoPor,
    'Registrado En': o.creadoEn,
  }));
  const wsOvertime = XLSX.utils.json_to_sheet(overtimeData);
  XLSX.utils.book_append_sheet(wb, wsOvertime, 'Horas Extras');

  // 4. Time Off Deductions Sheet
  const deductionsData = timeOffDeductions.map((d, idx) => ({
    '#': idx + 1,
    'Fecha Solicitud': d.fechaSolicitud,
    'Técnico': d.empleadoNombre,
    'Fecha Disfrute': d.fechaDisfrute,
    'Tipo': (d.tipo || '').toUpperCase(),
    'Cantidad Solicitada': d.cantidadSolicitada,
    'Horas Descontadas': d.horasDescontadas,
    'Saldo Previo': d.saldoPrevio,
    'Saldo Restante': d.saldoRestante,
    'Motivo': d.motivo,
    'Estado': (d.estado || '').toUpperCase(),
  }));
  const wsDeductions = XLSX.utils.json_to_sheet(deductionsData);
  XLSX.utils.book_append_sheet(wb, wsDeductions, 'Descansos y Compensaciones');

  // 5. Employees Balance Sheet
  const employeesData = employees.map((e, idx) => ({
    '#': idx + 1,
    'Nombre Técnico': e.nombre,
    'Cargo': e.cargo,
    'Código Técnico': e.tecnicoCode,
    'Correo Institucional': e.email,
    'Saldo Horas Extras': `${e.saldoHoras} hrs`,
  }));
  const wsEmployees = XLSX.utils.json_to_sheet(employeesData);
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Personal y Saldos');

  // Generate filename with date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `COMUNICA_EP_Reporte_Operaciones_${dateStr}.xlsx`;

  // Write file to download
  XLSX.writeFile(wb, filename);
}
