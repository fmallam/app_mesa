import React, { useState } from 'react';
import { Ipv4Network, IpAssignment, Employee } from '../types';
import { 
  Network, 
  Server, 
  HardDrive, 
  Tv, 
  Wifi, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Download, 
  Layers, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface IpManagementProps {
  networks: Ipv4Network[];
  assignments: IpAssignment[];
  employees: Employee[];
  onSaveNetworks: (networks: Ipv4Network[]) => void;
  onSaveAssignments: (assignments: IpAssignment[]) => void;
  onTriggerSync?: () => void;
}

export const IpManagement: React.FC<IpManagementProps> = ({
  networks,
  assignments,
  employees,
  onSaveNetworks,
  onSaveAssignments,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'networks'>('inventory');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Modals
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<IpAssignment | null>(null);
  const [editingNetwork, setEditingNetwork] = useState<Ipv4Network | null>(null);

  // IP Assignment Form
  const [ipForm, setIpForm] = useState<Omit<IpAssignment, 'id'>>({
    networkId: networks[0]?.id || '',
    ip: '',
    hostname: '',
    tipoDispositivo: 'servidor',
    macAddress: '',
    ubicacion: 'Rack Principal - CER',
    estado: 'asignada',
    responsable: employees[0]?.nombre || 'Darwin Quevedo',
    observaciones: '',
    ultimaModificacion: new Date().toISOString().slice(0, 10),
  });

  // Network Form
  const [netForm, setNetForm] = useState<Omit<Ipv4Network, 'id'>>({
    nombre: '',
    segmento: '',
    mascara: '255.255.255.0',
    gateway: '',
    vlan: 'VLAN 10',
    descripcion: '',
    ubicacion: 'Edificio Principal COMUNICA EP',
  });

  // Copy helper
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1800);
  };

  // Open New IP Modal
  const handleOpenNewIp = () => {
    setEditingAssignment(null);
    const targetNet = networks.find((n) => n.id === selectedNetworkId) || networks[0];
    
    // Auto-suggest next free IP in this network if possible
    let suggestedIp = '';
    if (targetNet && targetNet.segmento) {
      const base = targetNet.segmento.split('/')[0].split('.').slice(0, 3).join('.');
      // Find highest used last octet
      const usedOctets = assignments
        .filter((a) => a.ip.startsWith(base))
        .map((a) => parseInt(a.ip.split('.')[3], 10))
        .filter((n) => !isNaN(n));
      const nextOctet = usedOctets.length > 0 ? Math.max(...usedOctets) + 1 : 10;
      if (nextOctet < 254) {
        suggestedIp = `${base}.${nextOctet}`;
      }
    }

    setIpForm({
      networkId: targetNet?.id || networks[0]?.id || '',
      ip: suggestedIp,
      hostname: '',
      tipoDispositivo: 'servidor',
      macAddress: '',
      ubicacion: 'Rack Principal - CER',
      estado: 'asignada',
      responsable: employees[0]?.nombre || 'Darwin Quevedo',
      observaciones: '',
      ultimaModificacion: new Date().toISOString().slice(0, 10),
    });
    setIsIpModalOpen(true);
  };

  // Edit IP
  const handleEditIp = (item: IpAssignment) => {
    setEditingAssignment(item);
    setIpForm({
      networkId: item.networkId,
      ip: item.ip,
      hostname: item.hostname,
      tipoDispositivo: item.tipoDispositivo,
      macAddress: item.macAddress || '',
      ubicacion: item.ubicacion || '',
      estado: item.estado,
      responsable: item.responsable || '',
      observaciones: item.observaciones || '',
      ultimaModificacion: item.ultimaModificacion || new Date().toISOString().slice(0, 10),
    });
    setIsIpModalOpen(true);
  };

  // Submit IP
  const handleSubmitIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipForm.ip.trim() || !ipForm.hostname.trim()) return;

    if (editingAssignment) {
      const updated = assignments.map((a) =>
        a.id === editingAssignment.id
          ? { ...a, ...ipForm, ultimaModificacion: new Date().toISOString().slice(0, 10) }
          : a
      );
      onSaveAssignments(updated);
    } else {
      const newItem: IpAssignment = {
        id: `ip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...ipForm,
        ultimaModificacion: new Date().toISOString().slice(0, 10),
      };
      onSaveAssignments([...assignments, newItem]);
    }
    setIsIpModalOpen(false);
  };

  // Delete IP
  const handleDeleteIp = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta asignación de IP del inventario?')) {
      onSaveAssignments(assignments.filter((a) => a.id !== id));
    }
  };

  // Open Network Modal
  const handleOpenNewNet = () => {
    setEditingNetwork(null);
    setNetForm({
      nombre: '',
      segmento: '',
      mascara: '255.255.255.0',
      gateway: '',
      vlan: '',
      descripcion: '',
      ubicacion: 'Edificio Principal COMUNICA EP',
    });
    setIsNetworkModalOpen(true);
  };

  // Edit Network
  const handleEditNet = (net: Ipv4Network) => {
    setEditingNetwork(net);
    setNetForm({
      nombre: net.nombre,
      segmento: net.segmento,
      mascara: net.mascara,
      gateway: net.gateway,
      vlan: net.vlan || '',
      descripcion: net.descripcion || '',
      ubicacion: net.ubicacion || '',
    });
    setIsNetworkModalOpen(true);
  };

  // Submit Network
  const handleSubmitNet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!netForm.nombre.trim() || !netForm.segmento.trim()) return;

    if (editingNetwork) {
      const updated = networks.map((n) =>
        n.id === editingNetwork.id ? { ...n, ...netForm } : n
      );
      onSaveNetworks(updated);
    } else {
      const newNet: Ipv4Network = {
        id: `net-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...netForm,
      };
      onSaveNetworks([...networks, newNet]);
    }
    setIsNetworkModalOpen(false);
  };

  // Delete Network
  const handleDeleteNet = (netId: string) => {
    const attachedCount = assignments.filter((a) => a.networkId === netId).length;
    if (attachedCount > 0) {
      if (!window.confirm(`Esta red tiene ${attachedCount} IPs asignadas. ¿Desea eliminar la red y desvincular sus IPs?`)) {
        return;
      }
    } else {
      if (!window.confirm('¿Desea eliminar esta red IPv4?')) return;
    }
    onSaveNetworks(networks.filter((n) => n.id !== netId));
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesNet = selectedNetworkId === 'all' || a.networkId === selectedNetworkId;
    const matchesType = selectedDeviceType === 'all' || a.tipoDispositivo === selectedDeviceType;
    const matchesStatus = selectedStatus === 'all' || a.estado === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      a.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.responsable?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.macAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNet && matchesType && matchesStatus && matchesSearch;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'DIRECCION_IP',
      'HOSTNAME',
      'TIPO_DISPOSITIVO',
      'ESTADO',
      'RED_SEGMENTO',
      'VLAN',
      'MAC_ADDRESS',
      'UBICACION',
      'RESPONSABLE',
      'OBSERVACIONES',
      'ULTIMA_MODIFICACION'
    ];

    const netMap = new Map(networks.map((n) => [n.id, n]));

    const csvRows = [
      headers.join(';'),
      ...filteredAssignments.map((a) => {
        const net = netMap.get(a.networkId);
        return [
          a.ip,
          a.hostname,
          a.tipoDispositivo,
          a.estado,
          net ? net.segmento : '',
          net ? net.vlan || '' : '',
          a.macAddress || '',
          a.ubicacion || '',
          a.responsable || '',
          `"${(a.observaciones || '').replace(/"/g, '""')}"`,
          a.ultimaModificacion || ''
        ].join(';');
      }),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_ips_comunica_ep_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Device icon helper
  const renderDeviceIcon = (tipo: string) => {
    switch (tipo) {
      case 'servidor':
        return <Server className="w-3.5 h-3.5 text-blue-400" />;
      case 'switch_router':
        return <Network className="w-3.5 h-3.5 text-purple-400" />;
      case 'encoder_decoder':
        return <Tv className="w-3.5 h-3.5 text-emerald-400" />;
      case 'prompter_pc':
      case 'estacion_trabajo':
        return <Laptop className="w-3.5 h-3.5 text-cyan-400" />;
      case 'almacenamiento':
        return <HardDrive className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60">
                  IPAM & NETWORKING
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                  COMUNICA EP
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Gestión e Inventario de Direcciones IPv4 y Equipos
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Control centralizado de direccionamiento IP para servidores de emisión, switches de producción, encoders, prompters y consolas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            {activeTab === 'inventory' ? (
              <button
                onClick={handleOpenNewIp}
                id="btn-nueva-ip"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar Nueva IP / Equipo</span>
              </button>
            ) : (
              <button
                onClick={handleOpenNewNet}
                id="btn-nueva-red"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Red IPv4</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Subredes IPv4</div>
            <div className="text-lg font-bold text-white mt-0.5">{networks.length}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">VLANs configuradas</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">IPs Inventariadas</div>
            <div className="text-lg font-bold text-white mt-0.5">{assignments.length}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Equipos mapeados</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">IPs en Producción</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {assignments.filter((a) => a.estado === 'asignada').length}
            </div>
            <div className="text-[10px] text-emerald-500 mt-0.5">Activas y operativas</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Reservadas / Libres</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              {assignments.filter((a) => a.estado === 'reservada' || a.estado === 'disponible').length}
            </div>
            <div className="text-[10px] text-amber-500 mt-0.5">Disponibilidad inmediata</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Inventario de IPs vs Redes */}
      <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'inventory' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Inventario de Equipos & IPs ({assignments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('networks')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'networks' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Redes & Subredes ({networks.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por IP, hostname, MAC, responsable..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Filter by Network */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Red:</span>
              <select
                value={selectedNetworkId}
                onChange={(e) => setSelectedNetworkId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">Todas las redes</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre} ({n.segmento})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Device Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Tipo:</span>
              <select
                value={selectedDeviceType}
                onChange={(e) => setSelectedDeviceType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="servidor">Servidores</option>
                <option value="switch_router">Switches / Routers</option>
                <option value="encoder_decoder">Encoders / Decoders</option>
                <option value="prompter_pc">Prompters</option>
                <option value="estacion_trabajo">Estaciones PC</option>
                <option value="almacenamiento">Almacenamiento / SAN</option>
                <option value="otro">Otros</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-750 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">Todos</option>
                <option value="asignada">En Uso / Asignada</option>
                <option value="disponible">Disponible</option>
                <option value="reservada">Reservada</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>

            <div className="text-xs text-zinc-400 font-mono ml-auto">
              {filteredAssignments.length} de {assignments.length} registros
            </div>
          </div>

          {/* Table of IP Assignments */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800 tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Dirección IP</th>
                    <th className="px-3 py-3">Hostname / Dispositivo</th>
                    <th className="px-3 py-3">Tipo de Equipo</th>
                    <th className="px-3 py-3">Red & VLAN</th>
                    <th className="px-3 py-3">MAC Address</th>
                    <th className="px-3 py-3">Ubicación F枚sica</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Responsable</th>
                    <th className="px-3 py-3">Observaciones</th>
                    <th className="px-3 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 text-xs">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No se encontraron registros de direcciones IP para los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((item) => {
                      const net = networks.find((n) => n.id === item.networkId);
                      return (
                        <tr key={item.id} className="hover:bg-zinc-800/40 transition">
                          {/* IP Address + Copy */}
                          <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                {item.ip}
                              </span>
                              <button
                                onClick={() => handleCopyIp(item.ip)}
                                className="text-zinc-500 hover:text-cyan-400 transition p-1 rounded hover:bg-zinc-800 cursor-pointer"
                                title="Copiar IP"
                              >
                                {copiedIp === item.ip ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Hostname */}
                          <td className="px-3 py-2.5 font-semibold text-zinc-200 whitespace-nowrap">
                            {item.hostname}
                          </td>

                          {/* Device Type */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {renderDeviceIcon(item.tipoDispositivo)}
                              <span className="text-[11px] text-zinc-300 capitalize">
                                {item.tipoDispositivo.replace('_', ' ')}
                              </span>
                            </div>
                          </td>

                          {/* Network & VLAN */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="text-[11px] text-zinc-300 font-medium">
                              {net ? net.nombre : 'Sin red'}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {net?.vlan || net?.segmento}
                            </div>
                          </td>

                          {/* MAC Address */}
                          <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {item.macAddress || '-'}
                          </td>

                          {/* Ubicación */}
                          <td className="px-3 py-2.5 text-[11px] text-zinc-300 whitespace-nowrap">
                            {item.ubicacion || '-'}
                          </td>

                          {/* Estado */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                item.estado === 'asignada'
                                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                                  : item.estado === 'reservada'
                                  ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                                  : item.estado === 'mantenimiento'
                                  ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                              }`}
                            >
                              {item.estado.toUpperCase()}
                            </span>
                          </td>

                          {/* Responsable */}
                          <td className="px-3 py-2.5 text-[11px] text-zinc-300 whitespace-nowrap">
                            {item.responsable || '-'}
                          </td>

                          {/* Observaciones */}
                          <td className="px-3 py-2.5 text-zinc-400 text-[11px] max-w-[150px] truncate" title={item.observaciones}>
                            {item.observaciones || '-'}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditIp(item)}
                                className="p-1 text-zinc-400 hover:text-cyan-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteIp(item.id)}
                                className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Networks Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((net) => {
            const netAssignments = assignments.filter((a) => a.networkId === net.id);
            const inUseCount = netAssignments.filter((a) => a.estado === 'asignada').length;
            const reservedCount = netAssignments.filter((a) => a.estado === 'reservada').length;

            return (
              <div
                key={net.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{net.nombre}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-purple-300">
                        {net.vlan || 'VLAN Nativa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditNet(net)}
                      className="p-1 text-zinc-400 hover:text-purple-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                      title="Editar Red"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNet(net.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition cursor-pointer"
                      title="Eliminar Red"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Segmento:</span>
                    <span className="text-white font-bold">{net.segmento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Gateway:</span>
                    <span className="text-zinc-300">{net.gateway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Máscara:</span>
                    <span className="text-zinc-400">{net.mascara}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Ubicación:</span>
                    <span className="text-zinc-400 font-sans truncate max-w-[150px]">{net.ubicacion || 'CER Central'}</span>
                  </div>
                </div>

                {/* Progress bar of usage */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Ocupación estimada</span>
                    <span className="text-white font-semibold">{netAssignments.length} IPs mapeadas</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${Math.min(100, (inUseCount / 254) * 100 * 5)}%` }}
                      title={`${inUseCount} en uso`}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${Math.min(100, (reservedCount / 254) * 100 * 5)}%` }}
                      title={`${reservedCount} reservadas`}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {inUseCount} En Uso
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {reservedCount} Reservadas
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNetworkId(net.id);
                      setActiveTab('inventory');
                    }}
                    className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Ver IPs de esta Red</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Asignar / Editar IP */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>{editingAssignment ? 'Editar Asignación de IP' : 'Registrar Equipo / Asignar Dirección IP'}</span>
              </h3>
              <button
                onClick={() => setIsIpModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIp} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Red / Subred</label>
                  <select
                    value={ipForm.networkId}
                    onChange={(e) => setIpForm({ ...ipForm, networkId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  >
                    {networks.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre} ({n.segmento})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Dirección IPv4</label>
                  <input
                    type="text"
                    required
                    value={ipForm.ip}
                    onChange={(e) => setIpForm({ ...ipForm, ip: e.target.value })}
                    placeholder="192.168.10.25"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Hostname / Equipo</label>
                  <input
                    type="text"
                    required
                    value={ipForm.hostname}
                    onChange={(e) => setIpForm({ ...ipForm, hostname: e.target.value })}
                    placeholder="ENPS-SVR-01"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tipo de Dispositivo</label>
                  <select
                    value={ipForm.tipoDispositivo}
                    onChange={(e) => setIpForm({ ...ipForm, tipoDispositivo: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  >
                    <option value="servidor">Servidor</option>
                    <option value="switch_router">Switch / Router</option>
                    <option value="encoder_decoder">Encoder / Decoder</option>
                    <option value="prompter_pc">Prompter PC</option>
                    <option value="estacion_trabajo">Estación de Trabajo</option>
                    <option value="almacenamiento">Almacenamiento / SAN</option>
                    <option value="camara_video">Cámara / Video IP</option>
                    <option value="impresora">Impresora</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Estado</label>
                  <select
                    value={ipForm.estado}
                    onChange={(e) => setIpForm({ ...ipForm, estado: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  >
                    <option value="asignada">Asignada / En Uso</option>
                    <option value="disponible">Disponible</option>
                    <option value="reservada">Reservada</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">MAC Address (opcional)</label>
                  <input
                    type="text"
                    value={ipForm.macAddress}
                    onChange={(e) => setIpForm({ ...ipForm, macAddress: e.target.value })}
                    placeholder="00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Ubicación Física</label>
                  <input
                    type="text"
                    value={ipForm.ubicacion}
                    onChange={(e) => setIpForm({ ...ipForm, ubicacion: e.target.value })}
                    placeholder="Rack 02 - Cabina Central CER"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Responsable / Administrador</label>
                  <input
                    type="text"
                    value={ipForm.responsable}
                    onChange={(e) => setIpForm({ ...ipForm, responsable: e.target.value })}
                    placeholder="Darwin Quevedo"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={ipForm.observaciones}
                  onChange={(e) => setIpForm({ ...ipForm, observaciones: e.target.value })}
                  placeholder="Detalles de puertos, redundancia o notas..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsIpModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer"
                >
                  {editingAssignment ? 'Guardar Cambios' : 'Registrar IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Red IPv4 */}
      {isNetworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-400" />
                <span>{editingNetwork ? 'Editar Red IPv4' : 'Crear Nueva Red / Subred IPv4'}</span>
              </h3>
              <button
                onClick={() => setIsNetworkModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNet} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nombre de la Red</label>
                <input
                  type="text"
                  required
                  value={netForm.nombre}
                  onChange={(e) => setNetForm({ ...netForm, nombre: e.target.value })}
                  placeholder="Red Producción Broadcast"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Segmento CIDR</label>
                  <input
                    type="text"
                    required
                    value={netForm.segmento}
                    onChange={(e) => setNetForm({ ...netForm, segmento: e.target.value })}
                    placeholder="192.168.10.0/24"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Puerta de Enlace (Gateway)</label>
                  <input
                    type="text"
                    required
                    value={netForm.gateway}
                    onChange={(e) => setNetForm({ ...netForm, gateway: e.target.value })}
                    placeholder="192.168.10.1"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Máscara de Red</label>
                  <input
                    type="text"
                    value={netForm.mascara}
                    onChange={(e) => setNetForm({ ...netForm, mascara: e.target.value })}
                    placeholder="255.255.255.0"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">VLAN (Identificador)</label>
                  <input
                    type="text"
                    value={netForm.vlan}
                    onChange={(e) => setNetForm({ ...netForm, vlan: e.target.value })}
                    placeholder="VLAN 10 - Prod"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Ubicación / Área</label>
                <input
                  type="text"
                  value={netForm.ubicacion}
                  onChange={(e) => setNetForm({ ...netForm, ubicacion: e.target.value })}
                  placeholder="CER / Control Central / Estudios"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descripción</label>
                <input
                  type="text"
                  value={netForm.descripcion}
                  onChange={(e) => setNetForm({ ...netForm, descripcion: e.target.value })}
                  placeholder="Red dedicada a playouts, encoders y prompters"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNetworkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
                >
                  {editingNetwork ? 'Guardar Red' : 'Crear Red'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
