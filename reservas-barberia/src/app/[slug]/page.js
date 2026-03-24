"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation' 
import { supabase } from '../../lib/supabase' 

export default function FormularioNegocio() {
  const params = useParams()
  const slug = params.slug 

  const [negocio, setNegocio] = useState(null)
  const [barberosActivos, setBarberosActivos] = useState([]) 
  const [ausencias, setAusencias] = useState([]) 
  const [cargandoNegocio, setCargandoNegocio] = useState(true)

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    barbero: '', 
    servicio: 'Corte Clásico',
    fecha: '',
    hora: ''
  })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [ticket, setTicket] = useState(null)

  // NUEVOS ESTADOS PARA LA FOTO
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoSubida, setFotoSubida] = useState(false)

  const ALMUERZOS_BARBEROS = {
    'charlie': ['11:45'],
    'barbero 2': ['12:30'],
    'barbero 3': ['13:15'],
    'barbero 4': ['11:45']
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: negocioData } = await supabase.from('negocios').select('*').eq('slug', slug).single()
      
      if (negocioData) {
        setNegocio(negocioData)

        const { data: empleadosData } = await supabase.from('empleados').select('*').eq('negocio_id', negocioData.id).eq('activo', true) 
        if (empleadosData && empleadosData.length > 0) {
          const barberosOrdenados = empleadosData.sort((a, b) => {
            const nomA = a.nombre.trim().toLowerCase();
            const nomB = b.nombre.trim().toLowerCase();
            if (nomA === 'charlie') return -1;
            if (nomB === 'charlie') return 1;
            return a.nombre.localeCompare(b.nombre);
          });
          setBarberosActivos(barberosOrdenados)
          setFormData(prev => ({ ...prev, barbero: barberosOrdenados[0].nombre }))
        } else {
          setBarberosActivos([]) 
        }

        const { data: ausenciasData } = await supabase.from('ausencias').select('*').eq('negocio_id', negocioData.id)
        if (ausenciasData) setAusencias(ausenciasData)
      }
      setCargandoNegocio(false)
    }
    if (slug) cargarDatos()
  }, [slug])

  const generarHorarios = () => {
    const horarios = []
    let h = 8, m = 0
    
    const nombreBarberoLimpio = formData.barbero ? formData.barbero.trim().toLowerCase() : '';
    const horasBloqueadas = ALMUERZOS_BARBEROS[nombreBarberoLimpio] || [];

    while (h < 17 || (h === 17 && m === 0)) {
      const horaFormateada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      if (!horasBloqueadas.includes(horaFormateada)) horarios.push(horaFormateada)
      m += 45
      if (m >= 60) { h++; m -= 60 }
    }
    return horarios
  }

  const horariosDisponibles = generarHorarios()
  const esDiaLibre = ausencias.some(a => a.barbero === formData.barbero && a.fecha === formData.fecha);

  useEffect(() => {
    if (formData.fecha && formData.barbero && negocio && !esDiaLibre) {
      const consultarOcupados = async () => {
        const { data } = await supabase.from('reservas').select('fecha_hora').eq('barbero', formData.barbero).eq('negocio_id', negocio.id) 
        if (data) {
          const ocupadas = data
            .filter(d => d.fecha_hora && d.fecha_hora.includes(formData.fecha))
            .map(d => {
              const parteHora = d.fecha_hora.includes('T') ? d.fecha_hora.split('T')[1] : d.fecha_hora.split(' ')[1];
              return parteHora ? parteHora.substring(0, 5) : null;
            })
            .filter(Boolean);
          setHorasOcupadas(ocupadas);
        }
      }
      consultarOcupados()
    }
  }, [formData.fecha, formData.barbero, negocio, esDiaLibre])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const seleccionarBarbero = (nombre) => setFormData({ ...formData, barbero: nombre, hora: '', fecha: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.hora) { setMensaje('⚠️ Por favor elige una hora'); return; }

    const telLimpio = formData.cliente_telefono.replace(/\D/g, ''); 
    if (telLimpio.length < 8) {
      setMensaje('⚠️ Por favor ingresa un WhatsApp válido (8 dígitos)');
      return;
    }

    setCargando(true)
    const codigoGenerado = 'CH-' + Math.random().toString(36).substring(2, 6).toUpperCase()

    const dataParaEnviar = {
      negocio_id: negocio.id,
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono,
      barbero: formData.barbero,
      servicio: formData.servicio,
      fecha_hora: `${formData.fecha} ${formData.hora}`,
      codigo: codigoGenerado 
    }

    const { error } = await supabase.from('reservas').insert([dataParaEnviar])

    if (error) {
      if (error.code === '23505') {
        setMensaje('❌ ¡Ups! Alguien más acaba de ganar este turno. Intenta con otra hora.');
      } else {
        setMensaje(`❌ Error real: ${error.message} (Cód: ${error.code})`);
      }
    } else {
      const numeroAdmin = "50376885349"; 
      const apiKeyBot = "3741282";      

      const [anio, mes, dia] = formData.fecha.split('-');
      const fechaLocal = `${dia}/${mes}/${anio}`;

      const limpiarTildes = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const mensajeCrudo = `¡NUEVA CITA EN TURNOPRO! ✂️📅\n\n*Cliente:* ${formData.cliente_nombre}\n*Servicio:* ${formData.servicio}\n*Barbero:* ${formData.barbero}\n*Fecha:* ${fechaLocal} a las ${formData.hora}\n*Tel:* ${formData.cliente_telefono}`;
      const textoMensaje = limpiarTildes(mensajeCrudo);
      
      try {
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${numeroAdmin}&text=${encodeURIComponent(textoMensaje)}&apikey=${apiKeyBot}`);
      } catch (err) {}

      const barberoMayuscula = formData.barbero.charAt(0).toUpperCase() + formData.barbero.slice(1);
      const textoParaCharlie = `¡Hola! Soy ${formData.cliente_nombre}. Acabo de agendar en TurnoPro un ${formData.servicio} con ${barberoMayuscula} para el ${fechaLocal} a las ${formData.hora}. Mi código es #${codigoGenerado}. ¡Nos vemos!`;
      const urlWhatsAppCliente = `https://api.whatsapp.com/send?phone=${numeroAdmin}&text=${encodeURIComponent(textoParaCharlie)}`;
      
      setTicket({ ...formData, codigo: codigoGenerado, waUrl: urlWhatsAppCliente })
      setFormData({ ...formData, cliente_nombre: '', cliente_telefono: '', hora: '', fecha: '' })
      setMensaje('')
      // Reiniciamos los estados de la foto por si es una segunda reserva
      setFotoSubida(false)
      setSubiendoFoto(false)
    }
    setCargando(false)
  }

  // ==========================================
  // FUNCIÓN MAGICA: SUBIR FOTO A SUPABASE
  // ==========================================
  const handleSubirComprobante = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSubiendoFoto(true)
    setMensaje('') // Limpiar errores previos si los hay

    try {
      // 1. Inventamos un nombre único para la foto usando el código del ticket
      const extension = file.name.split('.').pop()
      const nombreArchivo = `${ticket.codigo}-${Date.now()}.${extension}`

      // 2. La subimos al cajón "comprobantes"
      const { error: errorSubida } = await supabase.storage
        .from('comprobantes')
        .upload(nombreArchivo, file)

      if (errorSubida) throw errorSubida

      // 3. Obtenemos el link público de la foto
      const { data: { publicUrl } } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(nombreArchivo)

      // 4. Guardamos ese link en la columna de nuestra base de datos
      const { error: errorUpdate } = await supabase
        .from('reservas')
        .update({ comprobante_url: publicUrl })
        .eq('codigo', ticket.codigo)

      if (errorUpdate) throw errorUpdate

      setFotoSubida(true)
    } catch (err) {
      console.error(err)
      setMensaje('❌ Hubo un error al subir la foto. Intenta de nuevo.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  if (cargandoNegocio) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans font-black tracking-widest text-gray-400">CARGANDO...</div>
  if (!negocio) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-red-500">❌ Local no encontrado</div>

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {ticket ? (
          <div className="animate-in zoom-in duration-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><span className="text-3xl">✅</span></div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">¡Turno Apartado!</h2>
              <p className="text-sm font-bold text-slate-500 mt-2">Tu espacio está reservado. Solo falta un paso 👇</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 mb-6 relative">
              <div className="text-center mb-6 border-b-2 border-dashed border-gray-200 pb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">CÓDIGO DE RESERVA</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter">#{ticket.codigo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-black uppercase text-gray-400">Barbero</p><p className="text-base font-bold text-gray-900">{ticket.barbero}</p></div>
                <div><p className="text-[10px] font-black uppercase text-gray-400">Hora</p><p className="text-base font-bold text-yellow-600">{ticket.hora}</p></div>
              </div>
            </div>

            {/* ========================================== */}
            {/* NUEVA SECCIÓN: TRANSFERENCIA BANCARIA      */}
            {/* ========================================== */}
            {!fotoSubida ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-center shadow-sm">
                <h3 className="font-black text-blue-800 uppercase tracking-tighter mb-2 text-lg">Paso Final: Pago</h3>
                <p className="text-xs text-blue-600 font-bold mb-4">Asegura tu cita haciendo el pago a la cuenta de la barbería y sube tu comprobante aquí abajo.</p>
                
                <div className="bg-white rounded-xl p-4 mb-4 border border-blue-100 text-left shadow-sm">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Datos Bancarios</p>
                  
                  <div className="space-y-1.5 mb-3">
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><span>🏦</span> Banco Promerica</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><span>🔢</span> Cta: <span className="font-black font-mono text-blue-700">0000-0000-00</span></p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><span>👤</span> Nombre: Carlos [Apellido]</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><span>📧</span> Correo: charlie@correo.com</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                      💡 <span className="text-blue-600 font-black uppercase">Instrucciones:</span> Si tienes Promerica, haz transferencia directa. Para otros bancos usa <span className="font-black">Transfer365</span>.
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer bg-blue-600 text-white font-black py-3 px-6 rounded-xl hover:bg-blue-700 shadow-md transition-all uppercase tracking-widest text-xs inline-block w-full active:scale-95">
                  {subiendoFoto ? 'Subiendo foto... ⏳' : '📸 Subir Captura de Pago'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSubirComprobante} disabled={subiendoFoto} />
                </label>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-center shadow-sm animate-in zoom-in duration-300">
                <span className="text-3xl block mb-2">💸</span>
                <h3 className="font-black text-green-700 uppercase tracking-tighter text-lg">¡Pago Recibido!</h3>
                <p className="text-xs text-green-600 font-bold">Tu cita está 100% asegurada. Nos vemos pronto.</p>
              </div>
            )}
            {/* ========================================== */}

            {mensaje && <div className="mb-4 p-3 text-center font-bold rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs">{mensaje}</div>}

            <a 
              href={ticket.waUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full flex justify-center items-center gap-2 bg-[#25D366] text-white font-black py-4 rounded-xl hover:bg-green-600 shadow-lg shadow-green-200 transition-all uppercase tracking-widest text-xs mb-3 active:scale-95"
            >
              <span className="text-lg">💬</span> Avisar por WhatsApp
            </a>

            <button onClick={() => { setTicket(null); setFotoSubida(false); setSubiendoFoto(false); }} className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px] active:scale-95">Hacer otra reserva</button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-center text-gray-900 mb-6 uppercase tracking-tight">{negocio.nombre}</h1>
            
            {barberosActivos.length === 0 ? (
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
                <span className="text-3xl block mb-2">🛑</span>
                <h3 className="font-black text-red-700 uppercase mb-1">Local Cerrado</h3>
                <p className="text-sm text-red-600 font-bold">Por el momento no hay barberos disponibles. Intenta más tarde.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Tu Nombre</label><input type="text" name="cliente_nombre" value={formData.cliente_nombre} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" placeholder="Ej. Lucas" /></div>
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">WhatsApp</label><input type="tel" name="cliente_telefono" value={formData.cliente_telefono} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" placeholder="7000-0000" /></div>
                <div>
                  <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Servicio</label>
                  <select name="servicio" value={formData.servicio} onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold">
                    <option value="Corte Clásico">Corte Clásico</option>
                    <option value="Corte + Barba">Corte + Barba</option>
                    <option value="Solo Barba">Solo Barba</option>
                    <option value="Corte para Niños">Corte para Niños 👶</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1 text-center">Selecciona tu Barbero</label>
                  <div className="flex gap-4 justify-center flex-wrap">
                    {barberosActivos.map((b) => (
                      <div key={b.id} onClick={() => seleccionarBarbero(b.nombre)} className={`flex flex-col items-center cursor-pointer p-2 rounded-2xl border-2 transition-all ${formData.barbero === b.nombre ? 'border-blue-600 bg-blue-50 shadow-md scale-105' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <img src={b.nombre.trim().toLowerCase() === 'charlie' ? '/charlie.png' : `https://ui-avatars.com/api/?name=${b.nombre.replace(' ', '+')}&background=random`} className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-white shadow-sm" alt={b.nombre} />
                        <span className="text-[10px] font-black uppercase text-gray-800 text-center">{b.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Día del corte</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold" /></div>
                
                {formData.fecha && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    {esDiaLibre ? (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center shadow-sm">
                        <span className="text-3xl block mb-2">🏖️</span>
                        <h3 className="font-black text-red-700 uppercase mb-1">Día Libre</h3>
                        <p className="text-xs text-red-600 font-bold leading-relaxed">{formData.barbero} no estará disponible en esta fecha. Por favor elige otro día u otro barbero para tu cita.</p>
                      </div>
                    ) : (
                      <>
                        <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1">Horas disponibles</label>
                        <div className="grid grid-cols-3 gap-2">
                          {horariosDisponibles.map((h) => {
                            const estaOcupada = horasOcupadas.includes(h)
                            return (
                              <button key={h} type="button" disabled={estaOcupada} onClick={() => setFormData({ ...formData, hora: h })} className={`py-2 text-sm font-black rounded-xl border-2 transition-all ${estaOcupada ? 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60' : formData.hora === h ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>{h}</button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!esDiaLibre && (
                  <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-sm active:scale-95 disabled:bg-gray-400 mt-6">{cargando ? 'PROCESANDO...' : 'Confirmar Reserva'}</button>
                )}
              </form>
            )}
            {mensaje && <div className={`mt-6 p-4 text-center font-black rounded-xl border-2 text-sm ${mensaje.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{mensaje}</div>}
          </>
        )}
      </div>
    </main>
  )
}