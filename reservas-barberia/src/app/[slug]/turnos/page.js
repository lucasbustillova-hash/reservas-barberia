'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function TurnosAdmin() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug

  const [autorizado, setAutorizado] = useState(false)
  const [negocio, setNegocio] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [empleados, setEmpleados] = useState([]) 
  const [ausencias, setAusencias] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  const [idResaltado, setIdResaltado] = useState(null)
  const [filtroBarbero, setFiltroBarbero] = useState('Todos')
  
  const [formAusencia, setFormAusencia] = useState({ barbero: '', fecha: '' })

  // ==========================================
  // NUEVOS ESTADOS PARA EL MODAL DE FOTOS
  // ==========================================
  const [fotoModal, setFotoModal] = useState(null)
  const [turnoActivo, setTurnoActivo] = useState(null)

  const getHoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const [filtroFecha, setFiltroFecha] = useState(getHoy())

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/login')
      else setAutorizado(true)
    }
    verificarSesion()
  }, [router])

  useEffect(() => {
    if (slug) cargarDatosPrincipal()
  }, [slug])

  const cargarSoloTurnos = async (idNegocio) => {
    const { data } = await supabase.from('reservas').select('*').eq('negocio_id', idNegocio).order('fecha_hora', { ascending: true })
    if (data) setTurnos(data)
  }

  const cargarAusencias = async (idNegocio) => {
    const { data } = await supabase.from('ausencias').select('*').eq('negocio_id', idNegocio).order('fecha', { ascending: true })
    if (data) setAusencias(data)
  }

  async function cargarDatosPrincipal() {
    setLoading(true)
    try {
      const { data: negocioData, error: errorNegocio } = await supabase.from('negocios').select('*').eq('slug', slug).single()
      if (errorNegocio || !negocioData) { setLoading(false); return; }
      setNegocio(negocioData);

      await cargarSoloTurnos(negocioData.id);
      await cargarAusencias(negocioData.id);

      const { data: empleadosData } = await supabase.from('empleados').select('*').eq('negocio_id', negocioData.id).order('nombre', { ascending: true })
      if (empleadosData) {
        setEmpleados(empleadosData)
        if (empleadosData.length > 0) setFormAusencia(prev => ({ ...prev, barbero: empleadosData[0].nombre }))
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!negocio) return; 
    const canalReservas = supabase.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nuevoId = payload.new.id;
            setIdResaltado(nuevoId);
            setTimeout(() => { setIdResaltado(null); }, 5000); 
          }
          cargarSoloTurnos(negocio.id);
        }
      ).subscribe();
    return () => { supabase.removeChannel(canalReservas); }
  }, [negocio]);

  async function eliminarTurno(id, nombre) {
    if (window.confirm(`¿Eliminar la cita de ${nombre}?`)) {
      await supabase.from('reservas').delete().eq('id', id)
    }
  }

  async function toggleEstadoEmpleado(empleado) {
    const nuevoEstado = !empleado.activo;
    setEmpleados(empleados.map(emp => emp.id === empleado.id ? { ...emp, activo: nuevoEstado } : emp));
    await supabase.from('empleados').update({ activo: nuevoEstado }).eq('id', empleado.id);
  }

  async function agregarAusencia(e) {
    e.preventDefault();
    if (!formAusencia.barbero || !formAusencia.fecha) return;
    
    const nueva = { negocio_id: negocio.id, barbero: formAusencia.barbero, fecha: formAusencia.fecha };
    const { data, error } = await supabase.from('ausencias').insert([nueva]).select();
    
    if (!error && data) {
      setAusencias([...ausencias, data[0]]);
      setFormAusencia({ ...formAusencia, fecha: '' }); 
    } else {
      alert("Hubo un error al guardar el día libre.");
    }
  }

  async function eliminarAusencia(id) {
    await supabase.from('ausencias').delete().eq('id', id);
    setAusencias(ausencias.filter(a => a.id !== id));
  }

  // ==========================================
  // FUNCIONES DEL MODAL DE COMPROBANTES
  // ==========================================
  const abrirModal = (turno) => {
    setTurnoActivo(turno)
    setFotoModal(turno.comprobante_url)
  }

  const cerrarModal = () => {
    setTurnoActivo(null)
    setFotoModal(null)
  }

  const aprobarPago = () => {
    alert("¡Comprobante validado! El turno se mantiene confirmado en tu agenda.")
    cerrarModal()
  }

  const rechazarPago = async () => {
    if(window.confirm("⚠️ ¿Estás seguro que este comprobante es falso o inválido? Se eliminará la cita y se liberará el espacio.")){
      await supabase.from('reservas').delete().eq('id', turnoActivo.id)
      cerrarModal()
    }
  }
  // ==========================================

  const turnosFiltrados = turnos.filter(t => {
    const coincideBarbero = filtroBarbero === 'Todos' || t.barbero === filtroBarbero;
    let coincideFecha = true;
    if (filtroFecha && t.fecha_hora) {
      const fechaTurno = t.fecha_hora.includes('T') ? t.fecha_hora.split('T')[0] : t.fecha_hora.split(' ')[0];
      coincideFecha = fechaTurno === filtroFecha;
    }
    return coincideBarbero && coincideFecha;
  })

  if (!autorizado) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest animate-pulse">VERIFICANDO SEGURIDAD 🔐...</div>
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest animate-pulse">CARGANDO AGENDA...</div>
  if (!negocio) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-red-500">❌ Local no encontrado</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans relative">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h1 className="text-3xl font-black tracking-tighter uppercase">AGENDA <span className="text-yellow-600">{negocio.nombre}</span></h1>
              <div className="flex gap-2">
                 <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    EN VIVO
                 </span>
                 <button onClick={cerrarSesion} className="text-xs font-bold text-red-500 border border-red-100 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">Cerrar Sesión 🔒</button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">FECHA:</span>
              <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl outline-none focus:border-blue-500 transition-all"/>
              <button onClick={() => setFiltroFecha('')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroFecha === '' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Ver Todo</button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Control de Asistencia (Hoy)</span>
            <div className="flex gap-3 flex-wrap justify-center">
              {empleados.map(emp => (
                <div key={emp.id} className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${emp.activo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <span className={`text-sm font-bold ${emp.activo ? 'text-green-700' : 'text-red-700'}`}>{emp.nombre}</span>
                  <button onClick={() => toggleEstadoEmpleado(emp)} className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all active:scale-95 ${emp.activo ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200' : 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'}`}>
                    {emp.activo ? 'TRABAJANDO ✅' : 'LIBRE ❌'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📅 Programar Días Libres a Futuro</span>
            
            <form onSubmit={agregarAusencia} className="flex flex-col md:flex-row gap-2 w-full max-w-2xl justify-center items-center">
              <select 
                value={formAusencia.barbero} 
                onChange={(e) => setFormAusencia({...formAusencia, barbero: e.target.value})}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none w-full md:w-auto"
                required
              >
                {empleados.map(emp => <option key={emp.id} value={emp.nombre}>{emp.nombre}</option>)}
              </select>
              <input 
                type="date" 
                value={formAusencia.fecha} 
                onChange={(e) => setFormAusencia({...formAusencia, fecha: e.target.value})}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none w-full md:w-auto"
                required
              />
              <button type="submit" className="bg-slate-900 text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest w-full md:w-auto shadow-md">
                Bloquear Día
              </button>
            </form>

            {ausencias.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mt-2 w-full">
                {ausencias.map(ausencia => {
                  const [anio, mes, dia] = ausencia.fecha.split('-');
                  return (
                    <div key={ausencia.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{ausencia.barbero}</span>
                      <span className="text-xs font-bold text-red-500">{dia}/{mes}/{anio}</span>
                      <button type="button" onClick={() => eliminarAusencia(ausencia.id)} className="text-slate-300 hover:text-red-500 ml-1">🗑️</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Agenda por Barbero</span>
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={() => setFiltroBarbero('Todos')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === 'Todos' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>Todos</button>
              {empleados.map(emp => (
                <button key={emp.id} onClick={() => setFiltroBarbero(emp.nombre)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === emp.nombre ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{emp.nombre}</button>
              ))}
            </div>
          </div>
        </header>

        {turnosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3">
            <span className="text-4xl">📅</span>
            <h3 className="text-xl font-black text-slate-700">Agenda Libre</h3>
            <p className="text-slate-500 font-medium text-sm">No hay citas programadas para esta fecha y barbero.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {turnosFiltrados.map((t) => {
              let fecha = 'Sin fecha'; let hora = '00:00';
              if (t.fecha_hora) {
                const d = new Date(t.fecha_hora);
                if (!isNaN(d.getTime())) { 
                  fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
                  hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                } else { fecha = t.fecha_hora; }
              }

              const nombre = t.cliente_nombre || t.cliente || 'Cliente';
              const nombreBarbero = t.barbero || 'Barbero';
              const telefonoGuardado = t.cliente_telefono || t.telefono || '';
              let telLimpio = telefonoGuardado.replace(/\D/g, '');
              if (telLimpio.length === 8) telLimpio = '503' + telLimpio; 
              else if (telLimpio.length === 10) telLimpio = '1' + telLimpio; 
              
              const barberoLimpio = nombreBarbero ? nombreBarbero.trim() : '';
              const barberoMayuscula = barberoLimpio ? barberoLimpio.charAt(0).toUpperCase() + barberoLimpio.slice(1) : '';

              const mensajeWhatsApp = t.codigo 
                ? `Hola ${nombre}, te confirmo tu cita en ${negocio.nombre} para el ${fecha} a las ${hora} con ${barberoMayuscula}. Tu código es #${t.codigo}. ¡Te esperamos!`
                : `Hola ${nombre}, te escribo de ${negocio.nombre} para confirmar tu cita del ${fecha} a las ${hora} con ${barberoMayuscula}.`;

              return (
                <div key={t.id} className={`p-6 flex flex-col md:flex-row items-center gap-6 transition-all duration-1000 ease-out rounded-[24px] ${idResaltado === t.id ? 'bg-yellow-50 border-2 border-yellow-400 ring-4 ring-yellow-200 shadow-lg scale-[1.02]' : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className="text-center md:text-left md:border-r border-slate-200 md:pr-8 min-w-[120px]">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{hora}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">{nombreBarbero}</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{nombre}</h3>
                    <div className="flex gap-2 justify-center md:justify-start mt-3 flex-wrap items-center">
                      <span className="inline-block bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">✂️ {t.servicio || 'Servicio'}</span>
                      {t.codigo && (
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-black px-3 py-1.5 rounded-lg border border-blue-200 uppercase tracking-widest shadow-sm">#{t.codigo}</span>
                      )}
                      
                      {/* ========================================== */}
                      {/* INDICADOR DE FOTO EN LA TARJETA            */}
                      {/* ========================================== */}
                      {t.comprobante_url ? (
                        <button onClick={() => abrirModal(t)} className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-black px-3 py-1.5 rounded-lg border border-green-300 uppercase shadow-sm hover:bg-green-200 transition-all active:scale-95">
                          📎 Ver Recibo
                        </button>
                      ) : (
                        <span className="inline-block bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md border border-red-100 uppercase tracking-widest">
                          ⚠️ Sin Pago
                        </span>
                      )}
                      {/* ========================================== */}
                      
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    {telLimpio ? (
                      <a href={`https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensajeWhatsApp)}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl text-xs text-center shadow-md shadow-green-100">WHATSAPP</a>
                    ) : (
                      <button onClick={() => alert("Sin número registrado")} className="flex-1 md:flex-none bg-slate-100 text-slate-400 font-bold py-3 px-6 rounded-xl text-xs cursor-not-allowed">SIN NÚMERO</button>
                    )}
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 shadow-sm hover:bg-red-50 transition-all">🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* EL POP-UP (MODAL) PARA VER LA FOTO           */}
      {/* ========================================== */}
      {fotoModal && turnoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Revisar Pago</h3>
            <p className="text-sm font-bold text-slate-500 mb-4">{turnoActivo.cliente_nombre}</p>
            
            <div className="w-full bg-slate-100 rounded-2xl border border-slate-200 mb-6 flex items-center justify-center overflow-hidden h-[50vh]">
              <img src={fotoModal} alt="Comprobante" className="w-full h-full object-contain" />
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <button onClick={rechazarPago} className="bg-red-50 text-red-600 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-red-100 border border-red-200 transition-all active:scale-95">
                ❌ Rechazar
              </button>
              <button onClick={aprobarPago} className="bg-green-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-green-600 shadow-md shadow-green-200 transition-all active:scale-95">
                ✅ Aprobar
              </button>
            </div>
            
            <button onClick={cerrarModal} className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest underline hover:text-slate-600 transition-colors">
              Cerrar y volver a la agenda
            </button>
          </div>
        </div>
      )}
      {/* ========================================== */}

    </div>
  )
}