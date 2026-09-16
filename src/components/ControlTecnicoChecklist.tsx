import React, { useState } from 'react';
import { ControlTecnicoRow, Employee, TechnicianSession } from '../types';
import { 
  Radio, 
  Tv, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  Thermometer, 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ControlTecnicoChecklistProps {
  rows: ControlTecnicoRow[];
  employees: Employee[];
  session: TechnicianSession | null;
  onAddRow: (row: ControlTecnicoRow) => void;
  onDeleteRow: (id: string) => void;
  onTriggerSync?: () => void;
}

export const ControlTecnicoChecklist: React.FC<ControlTecnicoChecklistProps> = ({
  rows,
  employees,
  session,
  onAddRow,
  onDeleteRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ControlTecnicoRow | null>(null);

  // Form state
  const now = new Date();
  const defaultFecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const defaultHora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [formData, setFormData] = useState<Omit<ControlTecnicoRow, 'id'>>({
    fecha: defaultFecha,
    hora: defaultHora,
    rxSatNacAv: true,
    rxSatNacCn: '13.91',
    rxSatNacLm: '7.10',
    rxSatNacBer: '0e-8',
    rxSatIntAv: true,
    rxSatIntCn: '14.90',
    rxSatIntLm: '7.18',
    rxSatIntBer: '0e-8',
    monAireAnalogaAu: true,
    monAireAnalogaVd: true,
    monAireHdAu: true,
    monAireHdVd: true,
    monAireSdAu: true,
    monAireSdVd: true,
    radioPubSatAu: true,
    radioPubInovonicAu: true,
    ctrlMasterNacAu: true,
    ctrlMasterNacVd: true,
    ctrlMasterIntAu: true,
    ctrlMasterIntVd: true,
    hispasatSrtAu: true,
    hispasatSrtVd: true,
    foPresPing: true,
    foGyePing: true,
    tempCer201: '20',
    tempCer202: 'N/A',
    observaciones: 'S/N',
    tecnicoTurno: session ? (session.tecnicoCode || session.nombre) : 'PCueva',
  });

  const handleOpenNew = () => {
    const cur = new Date();
    const f = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}/${cur.getFullYear()}`;
    const h = `${String(cur.getHours()).padStart(2, '0')}:${String(cur.getMinutes()).padStart(2, '0')}`;

    setEditingRow(null);
    setFormData({
      fecha: f,
      hora: h,
      rxSatNacAv: true,
      rxSatNacCn: '13.91',
      rxSatNacLm: '7.10',
      rxSatNacBer: '0e-8',
      rxSatIntAv: true,
      rxSatIntCn: '14.90',
      rxSatIntLm: '7.18',
      rxSatIntBer: '0e-8',
      monAireAnalogaAu: true,
      monAireAnalogaVd: true,
      monAireHdAu: true,
      monAireHdVd: true,
      monAireSdAu: true,
      monAireSdVd: true,
      radioPubSatAu: true,
      radioPubInovonicAu: true,
      ctrlMasterNacAu: true,
      ctrlMasterNacVd: true,
      ctrlMasterIntAu: true,
      ctrlMasterIntVd: true,
      hispasatSrtAu: true,
      hispasatSrtVd: true,
      foPresPing: true,
      foGyePing: true,
      tempCer201: '20',
      tempCer202: 'N/A',
      observaciones: 'S/N',
      tecnicoTurno: session ? (session.tecnicoCode || session.nombre) : (employees[0]?.tecnicoCode || 'PCueva'),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (row: ControlTecnicoRow) => {
    setEditingRow(row);
    setFormData({
      fecha: row.fecha,
      hora: row.hora,
      rxSatNacAv: row.rxSatNacAv,
      rxSatNacCn: row.rxSatNacCn,
      rxSatNacLm: row.rxSatNacLm,
      rxSatNacBer: row.rxSatNacBer,
      rxSatIntAv: row.rxSatIntAv,
      rxSatIntCn: row.rxSatIntCn,
      rxSatIntLm: row.rxSatIntLm,
      rxSatIntBer: row.rxSatIntBer,
      monAireAnalogaAu: row.monAireAnalogaAu,
      monAireAnalogaVd: row.monAireAnalogaVd,
      monAireHdAu: row.monAireHdAu,
      monAireHdVd: row.monAireHdVd,
      monAireSdAu: row.monAireSdAu,
      monAireSdVd: row.monAireSdVd,
      radioPubSatAu: row.radioPubSatAu,
      radioPubInovonicAu: row.radioPubInovonicAu,
      ctrlMasterNacAu: row.ctrlMasterNacAu,
      ctrlMasterNacVd: row.ctrlMasterNacVd,
      ctrlMasterIntAu: row.ctrlMasterIntAu,
      ctrlMasterIntVd: row.ctrlMasterIntVd,
      hispasatSrtAu: row.hispasatSrtAu,
      hispasatSrtVd: row.hispasatSrtVd,
      foPresPing: row.foPresPing,
      foGyePing: row.foGyePing,
      tempCer201: row.tempCer201,
      tempCer202: row.tempCer202,
      observaciones: row.observaciones,
      tecnicoTurno: row.tecnicoTurno,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRow: ControlTecnicoRow = {
      id: editingRow ? editingRow.id : `ct-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...formData,
    };
    onAddRow(newRow);
    setIsModalOpen(false);
  };

  // Quick preset: Mark all checks as OK
  const handleMarkAllOk = () => {
    setFormData((prev) => ({
      ...prev,
      rxSatNacAv: true,
      rxSatIntAv: true,
      monAireAnalogaAu: true,
      monAireAnalogaVd: true,
      monAireHdAu: true,
      monAireHdVd: true,
      monAireSdAu: true,
      monAireSdVd: true,
      radioPubSatAu: true,
      radioPubInovonicAu: true,
      ctrlMasterNacAu: true,
      ctrlMasterNacVd: true,
      ctrlMasterIntAu: true,
      ctrlMasterIntVd: true,
      hispasatSrtAu: true,
      hispasatSrtVd: true,
      foPresPing: true,
      foGyePing: true,
    }));
  };

  // Filter rows
  const filteredRows = rows.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.observaciones?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tecnicoTurno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fecha?.includes(searchTerm);
    const matchesDate = !filterDate || r.fecha.includes(filterDate);
    const matchesTecnico = !filterTecnico || r.tecnicoTurno.toLowerCase() === filterTecnico.toLowerCase();
    return matchesSearch && matchesDate && matchesTecnico;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'FECHA', 'HORA',
      'NAC_AV', 'NAC_CN', 'NAC_LM', 'NAC_BER',
      'INT_AV', 'INT_CN', 'INT_LM', 'INT_BER',
      'AIRE_ANA_AU', 'AIRE_ANA_VD',
      'AIRE_7.1HD_AU', 'AIRE_7.1HD_VD',
      'AIRE_7.2SD_AU', 'AIRE_7.2SD_VD',
      'RADIO_SAT_AU', 'RADIO_INOVONIC_AU',
      'MASTER_NAC_AU', 'MASTER_NAC_VD',
      'MASTER_INT_AU', 'MASTER_INT_VD',
      'HISPASAT_SRT_AU', 'HISPASAT_SRT_VD',
      'FO_PRES_PING', 'FO_GYE_PING',
      'TEMP_CER_201', 'TEMP_CER_202',
      'OBSERVACIONES', 'TECNICO_TURNO'
    ];

    const csvRows = [
      headers.join(';'),
      ...filteredRows.map((r) =>
        [
          r.fecha, r.hora,
          r.rxSatNacAv ? 'OK' : 'FALLA', r.rxSatNacCn, r.rxSatNacLm, r.rxSatNacBer,
          r.rxSatIntAv ? 'OK' : 'FALLA', r.rxSatIntCn, r.rxSatIntLm, r.rxSatIntBer,
          r.monAireAnalogaAu ? 'OK' : 'FALLA', r.monAireAnalogaVd ? 'OK' : 'FALLA',
          r.monAireHdAu ? 'OK' : 'FALLA', r.monAireHdVd ? 'OK' : 'FALLA',
          r.monAireSdAu ? 'OK' : 'FALLA', r.monAireSdVd ? 'OK' : 'FALLA',
          r.radioPubSatAu ? 'OK' : 'FALLA', r.radioPubInovonicAu ? 'OK' : 'FALLA',
          r.ctrlMasterNacAu ? 'OK' : 'FALLA', r.ctrlMasterNacVd ? 'OK' : 'FALLA',
          r.ctrlMasterIntAu ? 'OK' : 'FALLA', r.ctrlMasterIntVd ? 'OK' : 'FALLA',
          r.hispasatSrtAu ? 'OK' : 'FALLA', r.hispasatSrtVd ? 'OK' : 'FALLA',
          r.foPresPing ? 'OK' : 'FALLA', r.foGyePing ? 'OK' : 'FALLA',
          r.tempCer201, r.tempCer202,
          `"${(r.observaciones || '').replace(/"/g, '""')}"`,
          r.tecnicoTurno
        ].join(';')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `checklist_control_tecnico_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 font-bold border border-blue-800/60">
                  CÓDIGO: CGCO-JO-2026-CHK-ING
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  VERSIÓN: 01
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-medium border border-emerald-800/40 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  SISTEMA EN VIVO
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Checklist de Ingeniería y Control Técnico de Emisión
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Supervisión horaria de enlace satelital, señal al aire analógica/digital, radio pública, fibra óptica y centro de datos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Descargar datos en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleOpenNew}
              id="btn-nuevo-control-tecnico"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Medición de Turno</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por observación, técnico..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterTecnico}
              onChange={(e) => setFilterTecnico(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los técnicos</option>
              {Array.from(new Set(rows.map((r) => r.tecnicoTurno))).map((tec) => (
                <option key={tec} value={tec}>
                  {tec}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-400 font-mono ml-auto">
            {filteredRows.length} de {rows.length} registros
          </div>
        </div>
      </div>

      {/* Main Checklist Matrix (Multi-level Table matching the image) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            {/* Multi-tier Header matching screenshot */}
            <thead className="sticky top-0 z-20 bg-zinc-950 text-zinc-300 select-none shadow-sm">
              {/* Level 1 Groupings */}
              <tr className="border-b border-zinc-800 text-[11px] font-bold text-center">
                <th colSpan={2} className="px-3 py-2 bg-zinc-900/90 border-r border-zinc-800 text-zinc-300">
                  HORARIO
                </th>
                <th colSpan={8} className="px-3 py-2 bg-blue-950/40 text-blue-300 border-r border-zinc-800">
                  RX SATELITE
                </th>
                <th colSpan={6} className="px-3 py-2 bg-cyan-950/40 text-cyan-300 border-r border-zinc-800">
                  MONITOREO SEÑAL DEL AIRE
                </th>
                <th colSpan={2} className="px-3 py-2 bg-amber-950/40 text-amber-300 border-r border-zinc-800">
                  RADIO PÚBLICA
                </th>
                <th colSpan={4} className="px-3 py-2 bg-indigo-950/40 text-indigo-300 border-r border-zinc-800">
                  CONTROLES MASTER
                </th>
                <th colSpan={2} className="px-3 py-2 bg-purple-950/40 text-purple-300 border-r border-zinc-800">
                  HISPASAT
                </th>
                <th colSpan={2} className="px-3 py-2 bg-emerald-950/40 text-emerald-300 border-r border-zinc-800">
                  F.O PING
                </th>
                <th colSpan={2} className="px-3 py-2 bg-rose-950/40 text-rose-300 border-r border-zinc-800">
                  AIRES CER
                </th>
                <th className="px-3 py-2 bg-zinc-900/90 border-r border-zinc-800 text-zinc-300">
                  DETALLE
                </th>
                <th colSpan={2} className="px-3 py-2 bg-zinc-900/90 text-zinc-300">
                  CONTROL
                </th>
              </tr>

              {/* Level 2 Sub-Groupings */}
              <tr className="border-b border-zinc-800 text-[10px] font-semibold text-center uppercase tracking-wider">
                {/* Horario */}
                <th className="px-2 py-1.5 border-r border-zinc-850">FECHA</th>
                <th className="px-2 py-1.5 border-r border-zinc-800">HORA</th>

                {/* RX Sat: Nacional (4) + Internacional (4) */}
                <th colSpan={4} className="px-2 py-1 border-r border-blue-900/50 bg-blue-950/20 text-blue-200">
                  NACIONAL
                </th>
                <th colSpan={4} className="px-2 py-1 border-r border-zinc-800 bg-blue-950/20 text-blue-200">
                  INTERNACIONAL
                </th>

                {/* Monitoreo Aire: Analoga (2) + 7.1 HD (2) + 7.2 SD (2) */}
                <th colSpan={2} className="px-2 py-1 border-r border-cyan-900/50 bg-cyan-950/20 text-cyan-200">
                  ANALÓGA
                </th>
                <th colSpan={2} className="px-2 py-1 border-r border-cyan-900/50 bg-cyan-950/20 text-cyan-200">
                  7.1 HD
                </th>
                <th colSpan={2} className="px-2 py-1 border-r border-zinc-800 bg-cyan-950/20 text-cyan-200">
                  7.2 SD
                </th>

                {/* Radio Publica: Sat + Inovonic */}
                <th className="px-1.5 py-1 border-r border-amber-900/50 bg-amber-950/20 text-amber-200">SAT</th>
                <th className="px-1.5 py-1 border-r border-zinc-800 bg-amber-950/20 text-amber-200">INOVONIC</th>

                {/* Master: Nacional (2) + Internacional (2) */}
                <th colSpan={2} className="px-2 py-1 border-r border-indigo-900/50 bg-indigo-950/20 text-indigo-200">
                  NACIONAL
                </th>
                <th colSpan={2} className="px-2 py-1 border-r border-zinc-800 bg-indigo-950/20 text-indigo-200">
                  INTERNACIONAL
                </th>

                {/* Hispasat: SRT (2) */}
                <th colSpan={2} className="px-2 py-1 border-r border-zinc-800 bg-purple-950/20 text-purple-200">
                  SRT
                </th>

                {/* Conectividad FO: Pres + Gye */}
                <th className="px-1.5 py-1 border-r border-emerald-900/50 bg-emerald-950/20 text-emerald-200">PRES</th>
                <th className="px-1.5 py-1 border-r border-zinc-800 bg-emerald-950/20 text-emerald-200">GYE</th>

                {/* Aires CER: 201 + 202 */}
                <th className="px-1.5 py-1 border-r border-rose-900/50 bg-rose-950/20 text-rose-200">201</th>
                <th className="px-1.5 py-1 border-r border-zinc-800 bg-rose-950/20 text-rose-200">202</th>

                {/* Observaciones & Turno */}
                <th className="px-3 py-1 border-r border-zinc-800">OBSERVACIONES</th>
                <th className="px-2 py-1 border-r border-zinc-850">TÉCNICO</th>
                <th className="px-2 py-1">ACCIONES</th>
              </tr>

              {/* Level 3 Specific Metric Columns */}
              <tr className="border-b border-zinc-800 text-[9px] font-mono text-center text-zinc-400">
                <th className="px-2 py-1 border-r border-zinc-850">DD/MM</th>
                <th className="px-2 py-1 border-r border-zinc-800">HH:MM</th>

                {/* Sat Nacional */}
                <th className="px-1.5 py-1 border-r border-zinc-850">A/V</th>
                <th className="px-1.5 py-1 border-r border-zinc-850">C/N</th>
                <th className="px-1.5 py-1 border-r border-zinc-850">L/M</th>
                <th className="px-1.5 py-1 border-r border-blue-900/40">BER</th>

                {/* Sat Internacional */}
                <th className="px-1.5 py-1 border-r border-zinc-850">A/V</th>
                <th className="px-1.5 py-1 border-r border-zinc-850">C/N</th>
                <th className="px-1.5 py-1 border-r border-zinc-850">L/M</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">BER</th>

                {/* Monitoreo Analoga */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-cyan-900/40">VD</th>

                {/* Monitoreo 7.1 HD */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-cyan-900/40">VD</th>

                {/* Monitoreo 7.2 SD */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">VD</th>

                {/* Radio Publica */}
                <th className="px-1.5 py-1 border-r border-amber-900/40">AU</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">AU</th>

                {/* Master Nacional */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-indigo-900/40">VD</th>

                {/* Master Internacional */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">VD</th>

                {/* Hispasat SRT */}
                <th className="px-1.5 py-1 border-r border-zinc-850">AU</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">VD</th>

                {/* FO Ping */}
                <th className="px-1.5 py-1 border-r border-emerald-900/40">PING</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">PING</th>

                {/* Aires CER */}
                <th className="px-1.5 py-1 border-r border-rose-900/40">°C</th>
                <th className="px-1.5 py-1 border-r border-zinc-800">°C</th>

                {/* Observaciones */}
                <th className="px-3 py-1 border-r border-zinc-800">COMENTARIO</th>
                <th className="px-2 py-1 border-r border-zinc-850">TURNO</th>
                <th className="px-2 py-1">OPC</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-800 text-[11px] font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={30} className="px-4 py-8 text-center text-zinc-500 text-xs">
                    No se encontraron registros de medición técnica para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/40 transition">
                    {/* Horario */}
                    <td className="px-2 py-2 font-medium text-zinc-300 whitespace-nowrap border-r border-zinc-850">
                      {row.fecha}
                    </td>
                    <td className="px-2 py-2 font-bold text-white whitespace-nowrap border-r border-zinc-800">
                      {row.hora}
                    </td>

                    {/* Sat Nacional */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.rxSatNacAv ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-300 border-r border-zinc-850">
                      {row.rxSatNacCn}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-300 border-r border-zinc-850">
                      {row.rxSatNacLm}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-400 border-r border-blue-900/40">
                      {row.rxSatNacBer}
                    </td>

                    {/* Sat Internacional */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.rxSatIntAv ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-300 border-r border-zinc-850">
                      {row.rxSatIntCn}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-300 border-r border-zinc-850">
                      {row.rxSatIntLm}
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-400 border-r border-zinc-800">
                      {row.rxSatIntBer}
                    </td>

                    {/* Monitoreo Analoga */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.monAireAnalogaAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-cyan-900/40">
                      {row.monAireAnalogaVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Monitoreo 7.1 HD */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.monAireHdAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-cyan-900/40">
                      {row.monAireHdVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Monitoreo 7.2 SD */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.monAireSdAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-zinc-800">
                      {row.monAireSdVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Radio Publica */}
                    <td className="px-1.5 py-2 text-center border-r border-amber-900/40">
                      {row.radioPubSatAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-zinc-800">
                      {row.radioPubInovonicAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Master Nacional */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.ctrlMasterNacAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-indigo-900/40">
                      {row.ctrlMasterNacVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Master Internacional */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.ctrlMasterIntAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-zinc-800">
                      {row.ctrlMasterIntVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* Hispasat SRT */}
                    <td className="px-1.5 py-2 text-center border-r border-zinc-850">
                      {row.hispasatSrtAu ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-zinc-800">
                      {row.hispasatSrtVd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      )}
                    </td>

                    {/* FO Ping */}
                    <td className="px-1.5 py-2 text-center border-r border-emerald-900/40">
                      {row.foPresPing ? (
                        <span className="px-1 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                          OK
                        </span>
                      ) : (
                        <span className="px-1 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold">
                          TIMEOUT
                        </span>
                      )}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-zinc-800">
                      {row.foGyePing ? (
                        <span className="px-1 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                          OK
                        </span>
                      ) : (
                        <span className="px-1 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold">
                          TIMEOUT
                        </span>
                      )}
                    </td>

                    {/* Aires CER */}
                    <td className="px-1.5 py-2 text-center text-zinc-200 border-r border-rose-900/40">
                      {row.tempCer201}°C
                    </td>
                    <td className="px-1.5 py-2 text-center text-zinc-400 border-r border-zinc-800">
                      {row.tempCer202}
                    </td>

                    {/* Observaciones */}
                    <td className="px-3 py-2 text-zinc-300 font-sans text-xs border-r border-zinc-800 max-w-[140px] truncate" title={row.observaciones}>
                      {row.observaciones || 'S/N'}
                    </td>

                    {/* Turno */}
                    <td className="px-2 py-2 whitespace-nowrap border-r border-zinc-850">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-semibold text-[10px]">
                        {row.tecnicoTurno}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-1 text-zinc-400 hover:text-blue-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                          title="Editar fila"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Desea eliminar la medición de las ${row.hora} del ${row.fecha}?`)) {
                              onDeleteRow(row.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva / Editar Medición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRow ? 'Modificar Registro de Medición Técnica' : 'Nuevo Registro de Medición de Turno'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Formato oficial de control de parámetros de transmisión satelital y monitoreo.
                  </p>
                </div>
              </div>
              <button
                onClick={handleMarkAllOk}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold hover:bg-emerald-900 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Marcar Todo OK</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Fecha, Hora, Técnico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Fecha (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Hora de Inspección</label>
                  <input
                    type="text"
                    required
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Técnico de Turno</label>
                  <input
                    type="text"
                    required
                    value={formData.tecnicoTurno}
                    onChange={(e) => setFormData({ ...formData, tecnicoTurno: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* Section: RX Satélite (Nacional & Internacional) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-blue-900/40 space-y-4">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <span>Recepción Satelital (RX SATÉLITE)</span>
                </h4>

                {/* Nacional */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="col-span-2 sm:col-span-4 text-xs font-bold text-zinc-300">
                    Señal Satelital Nacional
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Audio / Video (A/V)</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rxSatNacAv: !formData.rxSatNacAv })}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.rxSatNacAv
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-rose-950 border-rose-700 text-rose-300'
                      }`}
                    >
                      {formData.rxSatNacAv ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{formData.rxSatNacAv ? 'OK' : 'FALLA'}</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">C/N Ratio (dB)</label>
                    <input
                      type="text"
                      value={formData.rxSatNacCn}
                      onChange={(e) => setFormData({ ...formData, rxSatNacCn: e.target.value })}
                      placeholder="13.91"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Link Margin (L/M)</label>
                    <input
                      type="text"
                      value={formData.rxSatNacLm}
                      onChange={(e) => setFormData({ ...formData, rxSatNacLm: e.target.value })}
                      placeholder="7.10"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">BER Ratio</label>
                    <input
                      type="text"
                      value={formData.rxSatNacBer}
                      onChange={(e) => setFormData({ ...formData, rxSatNacBer: e.target.value })}
                      placeholder="0e-8"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Internacional */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="col-span-2 sm:col-span-4 text-xs font-bold text-zinc-300">
                    Señal Satelital Internacional
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Audio / Video (A/V)</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rxSatIntAv: !formData.rxSatIntAv })}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.rxSatIntAv
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-rose-950 border-rose-700 text-rose-300'
                      }`}
                    >
                      {formData.rxSatIntAv ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{formData.rxSatIntAv ? 'OK' : 'FALLA'}</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">C/N Ratio (dB)</label>
                    <input
                      type="text"
                      value={formData.rxSatIntCn}
                      onChange={(e) => setFormData({ ...formData, rxSatIntCn: e.target.value })}
                      placeholder="14.90"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Link Margin (L/M)</label>
                    <input
                      type="text"
                      value={formData.rxSatIntLm}
                      onChange={(e) => setFormData({ ...formData, rxSatIntLm: e.target.value })}
                      placeholder="7.18"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">BER Ratio</label>
                    <input
                      type="text"
                      value={formData.rxSatIntBer}
                      onChange={(e) => setFormData({ ...formData, rxSatIntBer: e.target.value })}
                      placeholder="0e-8"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Monitoreo Aire & Controles Master */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monitoreo Señal del Aire */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-cyan-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    <span>Monitoreo Señal del Aire</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Analógica</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireAnalogaAu}
                            onChange={(e) => setFormData({ ...formData, monAireAnalogaAu: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireAnalogaVd}
                            onChange={(e) => setFormData({ ...formData, monAireAnalogaVd: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Digital 7.1 HD</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireHdAu}
                            onChange={(e) => setFormData({ ...formData, monAireHdAu: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireHdVd}
                            onChange={(e) => setFormData({ ...formData, monAireHdVd: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Digital 7.2 SD</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireSdAu}
                            onChange={(e) => setFormData({ ...formData, monAireSdAu: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.monAireSdVd}
                            onChange={(e) => setFormData({ ...formData, monAireSdVd: e.target.checked })}
                            className="rounded text-cyan-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master, Radio & Hispasat */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-indigo-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Master, Radio & Hispasat SRT</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Radio Pública</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.radioPubSatAu}
                            onChange={(e) => setFormData({ ...formData, radioPubSatAu: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>SAT AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.radioPubInovonicAu}
                            onChange={(e) => setFormData({ ...formData, radioPubInovonicAu: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>INOVONIC</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Master Nacional</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ctrlMasterNacAu}
                            onChange={(e) => setFormData({ ...formData, ctrlMasterNacAu: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ctrlMasterNacVd}
                            onChange={(e) => setFormData({ ...formData, ctrlMasterNacVd: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Master Internacional</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ctrlMasterIntAu}
                            onChange={(e) => setFormData({ ...formData, ctrlMasterIntAu: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ctrlMasterIntVd}
                            onChange={(e) => setFormData({ ...formData, ctrlMasterIntVd: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="font-semibold text-zinc-300">Hispasat SRT</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hispasatSrtAu}
                            onChange={(e) => setFormData({ ...formData, hispasatSrtAu: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>AU</span>
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hispasatSrtVd}
                            onChange={(e) => setFormData({ ...formData, hispasatSrtVd: e.target.checked })}
                            className="rounded text-indigo-500"
                          />
                          <span>VD</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FO Conectividad & Clima CER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Conectividad Enlaces Fibra Óptica (Ping)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">FO Presidencia</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, foPresPing: !formData.foPresPing })}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formData.foPresPing
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-rose-950 border-rose-700 text-rose-300'
                        }`}
                      >
                        {formData.foPresPing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{formData.foPresPing ? 'OK (0% Loss)' : 'TIMEOUT'}</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">FO Guayaquil</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, foGyePing: !formData.foGyePing })}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formData.foGyePing
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-rose-950 border-rose-700 text-rose-300'
                        }`}
                      >
                        {formData.foGyePing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{formData.foGyePing ? 'OK (0% Loss)' : 'TIMEOUT'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-rose-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    <span>Aires Acondicionados Centro CER</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">CER 201 (°C)</label>
                      <input
                        type="text"
                        value={formData.tempCer201}
                        onChange={(e) => setFormData({ ...formData, tempCer201: e.target.value })}
                        placeholder="20"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">CER 202 (°C / N/A)</label>
                      <input
                        type="text"
                        value={formData.tempCer202}
                        onChange={(e) => setFormData({ ...formData, tempCer202: e.target.value })}
                        placeholder="N/A"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Observaciones / Novedades</label>
                <input
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Sin novedades (S/N) o detalle de eventos..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer"
                >
                  {editingRow ? 'Guardar Cambios' : 'Registrar Medición Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
