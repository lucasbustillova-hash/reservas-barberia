import Link from 'next/link'

export default function LandingPage() {
  const miWhatsApp = "50376885349" // Tu número real que vi en tu código
  const mensajeVentas = "¡Hola! Vi la página de TurnoPro y me interesa automatizar las reservas de mi negocio. ¿Me pueden dar más información?";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* NAVEGACIÓN */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-black tracking-tighter">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg mr-1">Turno</span>Pro
        </div>
      </nav>

      {/* HERO SECTION (El gancho principal) */}
      <header className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-block bg-blue-50 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 border border-blue-200">
          ✨ Diseñado para Barberías, Salones y Spas
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
          Llena tu agenda sin contestar <span className="text-blue-600">WhatsApp.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
          El sistema de reservas definitivo. Tus clientes se agendan solos 24/7, y tú recuperas el control de tu tiempo y tu negocio.
        </p>
        <a 
          href={`https://api.whatsapp.com/send?phone=${miWhatsApp}&text=${encodeURIComponent(mensajeVentas)}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-slate-900 text-white font-black px-8 py-4 rounded-2xl text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-block"
        >
          Pedir mi sistema ahora 🚀
        </a>
      </header>

      {/* SECCIÓN 1: VIDEO CLIENTE */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1 relative">
          {/* El div del fondo es solo un adorno para que el video resalte */}
          <div className="absolute inset-0 bg-blue-100 rounded-[2rem] transform rotate-3 scale-105 -z-10"></div>
          {/* Aquí va tu primer video */}
          <video src="/demo-cliente.mp4" autoPlay loop muted playsInline className="w-full rounded-[2rem] shadow-2xl border-4 border-white" />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-4xl font-black tracking-tighter mb-4">Tus clientes agendan en <span className="text-blue-600">3 clics.</span></h2>
          <p className="text-lg text-slate-500 font-medium mb-6">
            Olvida el "déjame revisar la libreta". Tus clientes ven tus horarios disponibles y se agendan al instante desde cualquier celular, sin descargar aplicaciones.
          </p>
          <ul className="space-y-3 font-bold text-slate-700">
            <li className="flex items-center gap-2">✅ Funciona las 24 horas del día.</li>
            <li className="flex items-center gap-2">✅ Sin descargas molestas.</li>
            <li className="flex items-center gap-2">✅ Evita las citas dobles.</li>
          </ul>
        </div>
      </section>

      {/* SECCIÓN 2: VIDEO ADMIN */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-4">Control total en <span className="text-yellow-600">Tiempo Real.</span></h2>
          <p className="text-lg text-slate-500 font-medium mb-6">
            Recibe notificaciones en vivo cada vez que alguien agenda. Bloquea horarios de almuerzo, gestiona a tu personal y confirma citas por WhatsApp con un solo botón.
          </p>
          <ul className="space-y-3 font-bold text-slate-700">
            <li className="flex items-center gap-2">⚡ Panel de administración en vivo.</li>
            <li className="flex items-center gap-2">⚡ Mensajes de WhatsApp automatizados.</li>
            <li className="flex items-center gap-2">⚡ Control de ausencias y días libres.</li>
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-100 rounded-[2rem] transform -rotate-3 scale-105 -z-10"></div>
          {/* Aquí va tu segundo video */}
          <video src="/demo-admin.mp4" autoPlay loop muted playsInline className="w-full rounded-[2rem] shadow-2xl border-4 border-white" />
        </div>
      </section>

{/* SECCIÓN FINAL: CALL TO ACTION (CTA) */}
      <section className="max-w-4xl mx-auto text-center px-6 py-24 border-t border-slate-200 mt-10">
        <h2 className="text-4xl font-black tracking-tighter mb-6">
          ¿Listo para llevar tu negocio al <span className="text-blue-600">siguiente nivel?</span>
        </h2>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
          Únete a los salones y barberías que ya automatizaron su agenda. Deja que TurnoPro trabaje por ti mientras tú te enfocas en atender a tus clientes.
        </p>
        <a 
          href={`https://api.whatsapp.com/send?phone=${miWhatsApp}&text=${encodeURIComponent(mensajeVentas)}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-blue-600 text-white font-black px-10 py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-block"
        >
          Pedir mi sistema ahora 🚀
        </a>
        <p className="text-sm text-slate-400 mt-6 font-bold">
          Configuración rápida • Sin tarjetas de crédito • Soporte directo
        </p>
      </section>

    </div>
  )
}