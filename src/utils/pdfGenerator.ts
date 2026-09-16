import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BroadcastChecklistRow, IncidentTicket, Employee } from '../types';

export const generateChecklistPDF = (
  month: string,
  rows: BroadcastChecklistRow[],
  employees: Employee[],
  selectedTecnico: string
) => {
  // Format month name
  let monthLabel = month;
  if (month !== 'all') {
    const [year, m] = month.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIdx = parseInt(m, 10) - 1;
    monthLabel = `${months[mIdx] || m} ${year}`;
  } else {
    monthLabel = 'Histórico Completo';
  }

  // Filter rows
  const filteredRows = rows.filter((r) => {
    const matchMonth = month === 'all' || r.fecha.startsWith(month);
    const matchTecnico = selectedTecnico === 'all' || r.tecnicoTurno === selectedTecnico;
    return matchMonth && matchTecnico;
  });

  // Calculate statistics
  const totalTurnos = filteredRows.length;
  let totalVerif = 0;
  let okCount = 0;
  let alertaCount = 0;
  let fallaCount = 0;

  const systemKeys: (keyof BroadcastChecklistRow)[] = [
    'enpsSvrPrimario', 'enpsSvrSecundario',
    'noticiasK2Aire', 'noticiasNexio',
    'legalrecRadio', 'legalrecTv',
    'mosSvrPrincipal',
    'oradSrvHdvg', 'oradMaestroPc',
    'provysSvrBdd', 'prompterPcCliente', 'zoomPcZoom',
    'internetEnlacePrincipal', 'internetEnlaceSecundario'
  ];

  filteredRows.forEach((r) => {
    systemKeys.forEach((key) => {
      totalVerif++;
      const val = r[key];
      if (val === 'ok') okCount++;
      else if (val === 'alerta') alertaCount++;
      else if (val === 'falla') fallaCount++;
    });
  });

  const SYSTEM_NAMES: Record<string, string> = {
    enpsSvrPrimario: 'ENPS Primario',
    enpsSvrSecundario: 'ENPS Secundario',
    noticiasK2Aire: 'Noticias K2 Aire',
    noticiasNexio: 'Noticias Nexio',
    legalrecRadio: 'LegalRec Radio',
    legalrecTv: 'LegalRec TV',
    mosSvrPrincipal: 'MOS Principal',
    oradSrvHdvg: 'ORAD HDVG',
    oradMaestroPc: 'ORAD Maestro PC',
    provysSvrBdd: 'Provys BDD',
    prompterPcCliente: 'Prompter PC',
    zoomPcZoom: 'Zoom PC',
    internetEnlacePrincipal: 'Internet Principal',
    internetEnlaceSecundario: 'Internet Secundario',
  };

  const isRealNovelty = (obs?: string) => {
    if (!obs) return false;
    const clean = obs.trim().toLowerCase();
    return (
      clean !== '' &&
      clean !== 'sin novedad' &&
      clean !== 'sin novedades' &&
      clean !== 'sin novedad.' &&
      clean !== 's/n' &&
      clean !== 'ninguna' &&
      clean !== 'ninguno' &&
      clean !== 'ok' &&
      clean !== 'normal' &&
      clean !== '-' &&
      clean !== 'ningun'
    );
  };

  const getSubsystemIssues = (r: BroadcastChecklistRow) => {
    const issues: { label: string; type: 'falla' | 'alerta' }[] = [];
    systemKeys.forEach((key) => {
      const val = r[key];
      if (val === 'falla') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'falla' });
      } else if (val === 'alerta') {
        issues.push({ label: SYSTEM_NAMES[key] || key, type: 'alerta' });
      }
    });
    return issues;
  };

  // Extract only rows with real novelties or subsystem alerts/failures
  const rowsWithNovelties = filteredRows.filter((r) => {
    const hasObs = isRealNovelty(r.observaciones);
    const hasSystemIssue = systemKeys.some((k) => r[k] === 'falla' || r[k] === 'alerta');
    return hasObs || hasSystemIssue;
  });

  const operatividad = totalVerif > 0 ? ((okCount / totalVerif) * 100).toFixed(1) : '100';

  // Initialize PDF in landscape (A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const darkNavy = [15, 23, 42]; // #0f172a
  const cyanBrand = [8, 145, 178]; // #0891b2
  const textMuted = [100, 116, 139]; // #64748b

  // Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(10, 10, 277, 24, 'F');

  // Title in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EMPRESA PÚBLICA DE COMUNICACIÓN DEL ECUADOR - COMUNICA EP', 16, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('COORDINACIÓN GENERAL DE COMERCIALIZACIÓN Y OPERACIONES', 16, 26);

  // Right pill in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text(`INFORME MENSUAL: ${monthLabel.toUpperCase()}`, 275, 22, { align: 'right' });

  // Subtitle / Scope
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Auditoría Operativa de Turnos y 14 Subsistemas Críticos | Técnico: ${selectedTecnico === 'all' ? 'Todos' : selectedTecnico} | Emisión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`,
    10,
    39
  );

  // Metric Boxes
  const kpis = [
    { label: 'TURNOS EVALUADOS', value: `${totalTurnos}`, color: [15, 23, 42] },
    { label: 'OPERATIVIDAD GLOBAL', value: `${operatividad}%`, color: [16, 185, 129] },
    { label: 'VERIFICACIONES OK', value: `${okCount}`, color: [5, 150, 105] },
    { label: 'ALERTAS / FALLAS', value: `${alertaCount} / ${fallaCount}`, color: alertaCount + fallaCount > 0 ? [220, 38, 38] : [100, 116, 139] },
  ];

  const boxWidth = 66.5;
  kpis.forEach((kpi, index) => {
    const x = 10 + index * (boxWidth + 3.7);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, 42, boxWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, 47);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 4, 53);
  });

  // State Convention Legend Bar in PDF matching UI convention
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, 56, 277, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);
  doc.text('CONVENCIÓN DE ESTADOS:', 13, 60.3);

  // 1. Icono OK: Círculo verde con checkmark blanco vectorial
  doc.setFillColor(16, 185, 129);
  doc.circle(60, 59.3, 1.6, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(60 - 0.65, 59.3, 60 - 0.15, 59.3 + 0.55);
  doc.line(60 - 0.15, 59.3 + 0.55, 60 + 0.75, 59.3 - 0.55);
  doc.setTextColor(52, 211, 153);
  doc.text('OK: Normal / OK', 63.5, 60.3);

  // 2. Icono FALLA: Círculo rojo con cruz blanca vectorial
  doc.setFillColor(239, 68, 68);
  doc.circle(110, 59.3, 1.6, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(110 - 0.55, 59.3 - 0.55, 110 + 0.55, 59.3 + 0.55);
  doc.line(110 - 0.55, 59.3 + 0.55, 110 + 0.55, 59.3 - 0.55);
  doc.setTextColor(248, 113, 113);
  doc.text('FALLA: Falla Crítica', 113.5, 60.3);

  // 3. Icono ALERTA: Círculo ámbar con signo de exclamación blanco
  doc.setFillColor(245, 158, 11);
  doc.circle(165, 59.3, 1.6, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(165, 59.3 - 0.65, 165, 59.3 + 0.1);
  doc.setFillColor(255, 255, 255);
  doc.circle(165, 59.3 + 0.6, 0.2, 'F');
  doc.setTextColor(251, 191, 36);
  doc.text('ALERTA: Observación / Alerta', 168.5, 60.3);

  // 4. Icono NA: Círculo gris con guión blanco
  doc.setFillColor(156, 163, 175);
  doc.circle(230, 59.3, 1.6, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(230 - 0.6, 59.3, 230 + 0.6, 59.3);
  doc.setTextColor(203, 213, 225);
  doc.text('NA / -: No Aplica', 233.5, 60.3);

  // Table Data Preparation
  const head = [
    [
      'Fecha',
      'Hora',
      'Programa',
      'ENPS-1',
      'ENPS-2',
      'K2 Aire',
      'Nexio',
      'Radio',
      'TV',
      'MOS',
      'HDVG',
      'Orad',
      'Provys',
      'Promp',
      'Zoom',
      'Net-1',
      'Net-2',
      'Téc.',
      'Novedades / Observaciones',
    ],
  ];

  const body = filteredRows.map((r) => [
    r.fecha,
    r.hora,
    r.programa,
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
    r.tecnicoTurno,
    r.observaciones || 'sin novedad',
  ]);

  autoTable(doc, {
    head: head,
    body: body,
    startY: 64,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 }, // Fecha
      1: { halign: 'center', cellWidth: 12 }, // Hora
      2: { halign: 'left', fontStyle: 'bold', cellWidth: 32 }, // Programa
      17: { halign: 'center', fontStyle: 'bold', cellWidth: 14 }, // Téc.
      18: { halign: 'left', cellWidth: 'auto' }, // Novedades
    },
    didParseCell: (data) => {
      // For the 14 subsystem columns (3 to 16), clear text so only the vector icon is drawn
      if (data.section === 'body' && data.column.index >= 3 && data.column.index <= 16) {
        const text = String(data.cell.raw).trim();
        data.cell.text = []; // Clear raw text to render clean vector icon
        if (text === 'OK') {
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (text === 'FALLA') {
          data.cell.styles.fillColor = [254, 226, 226];
        } else if (text === 'ALERTA') {
          data.cell.styles.fillColor = [254, 243, 199];
        } else {
          data.cell.styles.fillColor = [248, 250, 252];
        }
      }
      if (data.section === 'body' && data.column.index === 18) {
        const text = String(data.cell.raw).toLowerCase();
        if (text !== 'sin novedad') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawCell: (data) => {
      // Draw vector icons in each subsystem cell
      if (data.section === 'body' && data.column.index >= 3 && data.column.index <= 16) {
        const status = String(data.cell.raw).trim().toUpperCase();
        const cx = data.cell.x + data.cell.width / 2;
        const cy = data.cell.y + data.cell.height / 2;
        const r = 1.6;

        if (status === 'OK') {
          // Círculo Verde con Checkmark Vectorial Blanco
          doc.setFillColor(16, 185, 129);
          doc.circle(cx, cy, r, 'F');
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.line(cx - 0.6, cy, cx - 0.15, cy + 0.5);
          doc.line(cx - 0.15, cy + 0.5, cx + 0.7, cy - 0.5);
        } else if (status === 'FALLA') {
          // Círculo Rojo con Cruz Vectorial Blanca
          doc.setFillColor(239, 68, 68);
          doc.circle(cx, cy, r, 'F');
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.line(cx - 0.55, cy - 0.55, cx + 0.55, cy + 0.55);
          doc.line(cx - 0.55, cy + 0.55, cx + 0.55, cy - 0.55);
        } else if (status === 'ALERTA') {
          // Círculo Ámbar con Exclamación Vectorial Blanca
          doc.setFillColor(245, 158, 11);
          doc.circle(cx, cy, r, 'F');
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.line(cx, cy - 0.65, cx, cy + 0.1);
          doc.setFillColor(255, 255, 255);
          doc.circle(cx, cy + 0.6, 0.18, 'F');
        } else {
          // Círculo Gris con Guión Vectorial Blanco (NA / -)
          doc.setFillColor(156, 163, 175);
          doc.circle(cx, cy, r, 'F');
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.line(cx - 0.55, cy, cx + 0.55, cy);
        }
      }
    },
    margin: { left: 10, right: 10, bottom: 35 },
  });

  // Resumen de Novedades Reportadas (Solo Novedades) Section in PDF
  let currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 120;

  // If table ended too low on page, start a fresh page for novedades & signatures
  if (currentY > 145) {
    doc.addPage();
    currentY = 20;
  }

  // Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `RESUMEN DE NOVEDADES REPORTADAS EN LA TRANSMISIÓN (SOLO NOVEDADES) - (${rowsWithNovelties.length})`,
    10,
    currentY
  );

  currentY += 4;

  if (rowsWithNovelties.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['FECHA', 'HORA', 'PROGRAMA', 'SUBSISTEMAS CON FALLA / ALERTA', 'DETALLE DE LA NOVEDAD U OBSERVACIÓN', 'TÉCNICO']],
      body: rowsWithNovelties.map((r) => {
        const issues = getSubsystemIssues(r).map((iss) => `${iss.label}: ${iss.type.toUpperCase()}`).join(', ');
        const obs = r.observaciones && isRealNovelty(r.observaciones) ? r.observaciones : (issues ? 'Falla en subsistema' : 'Sin novedad');
        return [
          r.fecha,
          r.hora,
          r.programa,
          issues || 'Subsistemas OK',
          obs,
          r.tecnicoTurno
        ];
      }),
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [180, 83, 9], // amber tone
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'left', fontStyle: 'bold', cellWidth: 45 },
        3: { halign: 'left', cellWidth: 50 },
        4: { halign: 'left', cellWidth: 'auto' },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const text = String(data.cell.raw);
          if (text.includes('FALLA')) {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('ALERTA')) {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 10, right: 10, bottom: 38 },
    });
  } else {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(10, currentY, 277, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text(
      'Sin novedades técnicas registradas en este periodo. Todas las emisiones y los 14 subsistemas operaron con total normalidad.',
      14,
      currentY + 5.8
    );
  }

  // Footer & Signatures at bottom of last page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Page number
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} | Documento Oficial COMUNICA EP`,
      10,
      202
    );

    // If on the last page, add formal signatures (Only Freddy Malla and Darwin Quevedo)
    if (i === pageCount) {
      const sigY = 178;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);

      // Signature 1: Ing. Freddy Malla
      doc.line(35, sigY, 125, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Ing. Freddy Malla, Msc', 80, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Analista de Sistemas y Multimedia Broadcasting 2', 80, sigY + 8, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('COMUNICA EP', 80, sigY + 12, { align: 'center' });

      // Signature 2: Ing. Darwin Quevedo
      doc.line(162, sigY, 252, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Ing. Darwin Quevedo, Msc', 207, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Analista de Sistemas y Multimedia Broadcasting 2', 207, sigY + 8, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('Jefe de Operaciones Encargado', 207, sigY + 12, { align: 'center' });
    }
  }

  // Save the PDF
  const filename = `Reporte_Mensual_Checklist_${month}_COMUNICA_EP.pdf`;
  doc.save(filename);
};

export const generateIncidentsPDF = (
  month: string,
  incidents: IncidentTicket[],
  selectedTecnico: string = 'all',
  statusFilter: string = 'all',
  priorityFilter: string = 'all'
) => {
  let monthLabel = month;
  if (month !== 'all') {
    const [year, m] = month.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIdx = parseInt(m, 10) - 1;
    monthLabel = `${months[mIdx] || m} ${year}`;
  } else {
    monthLabel = 'Histórico Completo';
  }

  // Filter
  const filtered = incidents.filter((i) => {
    const dateStr = i.fechaReporte || (i as any).fechaCreacion || '';
    const matchMonth = month === 'all' || dateStr.startsWith(month);
    const matchTecnico = selectedTecnico === 'all' || i.tecnicoAsignado === selectedTecnico;
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'resuelto' && (i.estado === 'resuelto' || i.estado === 'cerrado'))
      || (statusFilter === 'cerrado' && i.estado === 'cerrado')
      || i.estado === statusFilter;
    const matchPriority = priorityFilter === 'all' || i.prioridad === priorityFilter;
    return matchMonth && matchTecnico && matchStatus && matchPriority;
  });

  const total = filtered.length;
  const resueltos = filtered.filter((i) => i.estado === 'resuelto' || i.estado === 'cerrado').length;
  const abiertos = filtered.filter((i) => i.estado === 'abierto').length;
  const progreso = filtered.filter((i) => i.estado === 'en_progreso').length;
  const tasaResolucion = total > 0 ? ((resueltos / total) * 100).toFixed(1) : '100';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const darkNavy = [15, 23, 42];
  const textMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(10, 10, 277, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EMPRESA PÚBLICA DE COMUNICACIÓN DEL ECUADOR - COMUNICA EP', 16, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('COORDINACIÓN GENERAL DE COMERCIALIZACIÓN Y OPERACIONES | MESA DE SERVICIOS', 16, 26);

  // Right pill
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text(`INFORME DE INCIDENCIAS: ${monthLabel.toUpperCase()}`, 275, 22, { align: 'right' });

  // Subtitle
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Registro Mensual de Tickets, Solicitudes Técnicas y Soporte a Usuarios | Técnico: ${selectedTecnico === 'all' ? 'Todos' : selectedTecnico} | Emisión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`,
    10,
    39
  );

  // Metric Boxes
  const kpis = [
    { label: 'TOTAL DE INCIDENCIAS', value: `${total}`, color: [15, 23, 42] },
    { label: 'TASA DE RESOLUCIÓN', value: `${tasaResolucion}%`, color: [16, 185, 129] },
    { label: 'RESUELTAS / CERRADAS', value: `${resueltos}`, color: [5, 150, 105] },
    { label: 'ABIERTAS / EN CURSO', value: `${abiertos} / ${progreso}`, color: abiertos > 0 ? [220, 38, 38] : [100, 116, 139] },
  ];

  const boxWidth = 66.5;
  kpis.forEach((kpi, index) => {
    const x = 10 + index * (boxWidth + 3.7);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, 42, boxWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, 47);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 4, 53);
  });

  const head = [
    [
      'Código',
      'Fecha',
      'Hora',
      'Reportado Por',
      'Categoría',
      'Prioridad',
      'Título / Falla Reportada',
      'Técnico',
      'Estado',
      'Resolución / Acciones',
    ],
  ];

  const formatIncidentStatus = (st: string) => {
    switch (st) {
      case 'cerrado':
        return 'CERRADO';
      case 'resuelto':
        return 'RESUELTO';
      case 'en_progreso':
        return 'EN PROGRESO';
      case 'abierto':
        return 'ABIERTO';
      default:
        return (st || '').toUpperCase();
    }
  };

  const body = filtered.map((i) => [
    i.codigo,
    i.fechaReporte,
    i.horaReporte,
    i.reportadoPor,
    i.categoria.toUpperCase(),
    i.prioridad.toUpperCase(),
    i.titulo,
    i.tecnicoAsignado,
    formatIncidentStatus(i.estado),
    i.solucionAplicada || 'Pendiente de cierre técnico',
  ]);

  autoTable(doc, {
    head: head,
    body: body,
    startY: 60,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 14 },
      3: { cellWidth: 24 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 16 },
      6: { cellWidth: 50 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      9: { cellWidth: 57 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const p = String(data.cell.raw).toLowerCase();
        if (p === 'critica') {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (p === 'alta') {
          data.cell.styles.fillColor = [255, 237, 213];
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 8) {
        const s = String(data.cell.raw).toLowerCase();
        if (s.includes('resuelto') || s.includes('cerrado')) {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (s.includes('abierto')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (s.includes('progreso')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 10, right: 10, bottom: 35 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} | Service Desk COMUNICA EP`,
      10,
      202
    );

    if (i === pageCount) {
      const sigY = 180;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);

      // Signature 1: Ing. Freddy Malla, Msc
      doc.line(35, sigY, 125, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Ing. Freddy Malla, Msc', 80, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Analista de Sistemas y Multimedia Broadcasting 2', 80, sigY + 8, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('COMUNICA EP', 80, sigY + 11.5, { align: 'center' });

      // Signature 2: Ing. Darwin Quevedo, Msc
      doc.line(162, sigY, 252, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Ing. Darwin Quevedo, Msc', 207, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Jefe de Operaciones Encargado', 207, sigY + 8, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('COMUNICA EP', 207, sigY + 11.5, { align: 'center' });
    }
  }

  const filename = `Informe_Mensual_Incidencias_${month}_COMUNICA_EP.pdf`;
  doc.save(filename);
};
