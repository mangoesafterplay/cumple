'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, MessageSquare, Send, Zap, MapPin, Calendar, Clock, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { verificarApodo, obtenerSesionActiva, confirmarAsistencia, publicarEnMuro, enviarMensajeChat, obtenerPostsMuro, obtenerMensajesChat } from './actions';
import { upload } from '@vercel/blob/client';

// EL DICCIONARIO DE MENSAJES CURSED (INTACTO)
const mensajesPorUsuario: Record<string, string> = {
  nandogol: 'ESHE TOTO EH WENO, go brol',
  noemo: 'oh nozomii, estas invitada a mi crucificción bro',
  pipo: 'la locura geimer esta invitado a mi cum, si faltas es porque te fuiste con tus amigas maldita falla',
  mono: 'monito bebe mi vida mi amor mi salvación, te espero bro',
  car: 'PUTO CAR SE QUE NO VAS A VERNIR PERO IGUAL TAS INVITADO',
  mapache: 'felicidades por ganar tu partido mi bro, estas invitado a mi invasión',
  manu: 'MANUEEELLL, tas invitado a mi cum bro lo juto',
  tiobabu: 'maldito borracho de mierdaaa (go riendas)',
  china: '调整：我特意翻译了这个，就是为了让你能看懂。我邀请你来参加我的生日派对。',
  yuda: 'estas invitada a mi cum yudiña, de regalo quiero lentes de descanso lo juto',
  mariana: 'te invito a mi cumpleaños marii, la entrada es ua cajita de chela oño',
  alvaro: 'bro estas invitado a mi cum oficialmente (aprendete la de amor en epocas de mundial lo juto)',
  ivan: 'estas invitado a mi cum bro, nada de traer putas primer aviso (traete una hamgurguesita p oño)',
  mezzza: 'maldita falla, si no vienes te saco tu chucha y le digo al alvaro que te kche en dota de nuevo',
  marjory: 'amigaa estas invitada a mi cum, le dices a mapache que la entrada es una caja de chelas',
  guillen: 'GUILLEN BORRACHO DE MIERDAAAA, espero vengas chetumare si no te saco de tu casa maldita',
  michael: 'maldito borracho bro, estas invitado a mi cum, si no vienes el mono ya no te va a besar',
};

export default function Home() {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  
  const [apodoInput, setApodoInput] = useState('');
  const [errorLanding, setErrorLanding] = useState('');
  const [validando, setValidando] = useState(false);

  const [confirmado, setConfirmado] = useState(false);
  const [mensajeMuro, setMensajeMuro] = useState('');
  const [mensajeChat, setMensajeChat] = useState('');
  
  // Estados para subir imágenes al muro
  const [fileMuro, setFileMuro] = useState<File | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  const [postsMuro, setPostsMuro] = useState<any[]>([]);
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function validarSesion() {
      /*
      const sess = await obtenerSesionActiva();
      if (sess) {
        setUsuario(sess);
        setConfirmado(sess.confirmado);
      }
      */
      setCargandoSesion(false);
    }
    validarSesion();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [mensajesChat, usuario]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apodoInput.trim()) return;

    setValidando(true);
    setErrorLanding('');
    
    const res = await verificarApodo(apodoInput);
    if (res.success && res.usuario) {
      setUsuario(res.usuario);
      setConfirmado(res.usuario.confirmado ?? false);
    } else {
      setErrorLanding(res.error || 'ERROR FATAL. NO EXISTES.');
    }
    setValidando(false);
  };

  const handleConfirmar = async (asiste: boolean) => {
    if (!usuario) return;
    await confirmarAsistencia(usuario.id, asiste);
    setConfirmado(asiste);
  };

  const handleMuroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!mensajeMuro.trim() && !fileMuro) || !usuario) return;

    setSubiendoFoto(true);
    let finalUrl = '';

    try {
      if (fileMuro) {
        const newBlob = await upload(fileMuro.name, fileMuro, {
          access: 'public',
          handleUploadUrl: '/api/avatar/upload',
        });
        finalUrl = newBlob.url;
      }

      await publicarEnMuro(usuario.id, mensajeMuro, finalUrl);
      setPostsMuro([{ id: Date.now(), nombre: usuario.nombre, mensaje: mensajeMuro, fotoUrl: finalUrl, creadoEn: new Date() }, ...postsMuro]);
      setMensajeMuro('');
      setFileMuro(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeChat.trim() || !usuario) return;
    await enviarMensajeChat(usuario.id, mensajeChat);
    setMensajesChat([...mensajesChat, { id: Date.now(), nombre: usuario.nombre, mensaje: mensajeChat }]);
    setMensajeChat('');
  };

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-zinc-200 flex items-center justify-center font-mono">
        <div className="text-black font-black text-2xl uppercase animate-bounce tracking-tighter">pera...</div>
      </div>
    );
  }

  const mensajePersonalizado = usuario ? (mensajesPorUsuario[usuario.nombre] || 'who is bro?') : '';

  return (
    <main className="min-h-screen w-full bg-zinc-200 text-black font-mono selection:bg-black selection:text-white pb-20">
      <AnimatePresence mode="wait">
        
        {!usuario ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
          >
            <div className="w-full max-w-md bg-zinc-100 p-6 sm:p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                hola bro
              </h1>
              <p className="text-sm font-bold text-zinc-600 mb-8">
                cómo te dicen bro? minúscula y junto lo juto.
              </p>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="ej: pipogei"
                    value={apodoInput}
                    onChange={(e) => setApodoInput(e.target.value)}
                    disabled={validando}
                    className="w-full px-4 py-4 bg-white border-4 border-black text-center font-black placeholder:text-zinc-400 focus:outline-none focus:bg-zinc-200 transition-none disabled:opacity-50"
                  />
                </div>

                {errorLanding && (
                  <div className="bg-black text-white p-2 font-bold text-xs animate-pulse">
                    {errorLanding}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={validando}
                  className="w-full py-4 bg-white hover:bg-black hover:text-white border-4 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {validando ? 'validando bro...' : 'INGRESAR'}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          
          /* --- DASHBOARD BRUTALISTA RESPONSIVE --- */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
          >
            {/* Header Cursed */}
            <div className="col-span-1 md:col-span-2 lg:col-span-12 bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  hola {usuario.nombre}
                </h2>
                <p className="text-sm font-bold text-zinc-500 mt-1">
                  &gt; {mensajePersonalizado}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-bold uppercase text-xs w-full md:w-auto justify-center">
                invitación
              </div>
            </div>

            {/* COLUMNA IZQUIERDA: EL MURO */}
            <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col h-[550px] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
              <h3 className="text-xl font-black flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
                no suban webadas p oño
              </h3>
              
              <form onSubmit={handleMuroSubmit} className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="aca se escribe bro"
                    value={mensajeMuro}
                    onChange={(e) => setMensajeMuro(e.target.value)}
                    className="flex-1 px-3 py-2 bg-zinc-100 border-2 border-black focus:outline-none font-bold text-sm"
                  />
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => setFileMuro(e.target.files?.[0] || null)}
                  />
                  
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 border-2 border-black font-bold text-sm cursor-pointer ${fileMuro ? 'bg-green-400 text-black' : 'bg-white hover:bg-zinc-200'}`}
                  >
                    <ImageIcon size={18} />
                  </button>

                  <button type="submit" disabled={subiendoFoto} className="p-2 bg-black text-white border-2 border-black hover:bg-zinc-800 cursor-pointer disabled:opacity-50">
                    <Send size={18} />
                  </button>
                </div>
                {fileMuro && (
                  <p className="text-[10px] uppercase font-black text-green-700 bg-green-100 p-1 border border-green-400 truncate">
                    📎 adjunto: {fileMuro.name}
                  </p>
                )}
              </form>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {postsMuro.length === 0 ? (
                  <div className="text-center font-bold text-zinc-400 mt-10 uppercase text-sm">...</div>
                ) : (
                  postsMuro.map((post) => (
                    <div key={post.id} className="p-3 bg-zinc-100 border-2 border-black space-y-2">
                      <p className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-1">{post.nombre}</p>
                      {post.mensaje && <p className="text-sm font-bold">{post.mensaje}</p>}
                      {post.fotoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.fotoUrl} alt="shitpost file" className="w-full h-auto border-2 border-black" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMNA CENTRAL: INVITACIÓN */}
            <div className="col-span-1 md:col-span-1 lg:col-span-4 space-y-6 sm:space-y-8">
              <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* Removido grayscale */}
                <div className="w-full h-48 sm:h-56 bg-zinc-200 border-b-4 border-black relative transition-all duration-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/cumplecat.jpg" alt="Invitacion" className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600'}} />
                  <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-xs font-black uppercase">yo y mis bros</div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <h3 className="text-3xl font-black tracking-tighter mb-4">mi cum</h3>
                  <div className="space-y-2 mb-6">
                    <div className="p-3 bg-zinc-100 border-2 border-black flex items-center gap-3 font-bold text-sm">
                      <Calendar size={18} /> este viernes bro
                    </div>
                    <div className="p-3 bg-zinc-100 border-2 border-black flex items-center gap-3 font-bold text-sm">
                      <Clock size={18} /> desde las 8 hasta que rompan algo (esa va para mi)
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => handleConfirmar(true)} className={`w-full py-3 border-4 border-black font-black text-sm transition-all cursor-pointer ${confirmado ? 'bg-black text-white' : 'bg-white hover:bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1'}`}>
                      {confirmado ? '[ te espero bro ]' : 'llego bro'}
                    </button>
                    <button onClick={() => handleConfirmar(false)} className={`w-full py-3 border-4 border-black font-black text-sm transition-all cursor-pointer ${!confirmado ? 'bg-zinc-300 text-zinc-500' : 'bg-white hover:bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1'}`}>
                      no llego bro
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black flex items-center gap-2 mb-3 text-sm">
                  <MapPin size={16} /> ubi (mi invasión)
                </h4>
                {/* Removido grayscale */}
                <div className="w-full h-40 border-4 border-black">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d281.97535346970744!2d-70.27557965217764!3d-18.034806702232324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915acf3ab95cf893%3A0x80f48826eac72884!2sAv.%20Tacna%201115%2C%20Tacna%2023006!5e0!3m2!1ses-419!2spe!4v1782604464559!5m2!1ses-419!2spe" 
                    className="w-full h-full border-0" 
                    allowFullScreen={false} 
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: CHAT RAW */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col h-[550px] bg-zinc-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
              <h3 className="text-xl font-black flex items-center gap-2 mb-4 border-b-4 border-zinc-700 pb-2">
                <MessageSquare size={24} /> kbro el que escriba
              </h3>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-sm scrollbar-thin">
                {mensajesChat.length === 0 ? (
                  <div className="text-center font-bold text-zinc-600 mt-10 uppercase">...</div>
                ) : (
                  mensajesChat.map((msg) => {
                    const esPropio = msg.nombre === usuario.nombre;
                    return (
                      <div key={msg.id} className={`flex flex-col ${esPropio ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-zinc-500 font-bold mb-1 uppercase">
                          {esPropio ? '>>> TÚ' : `> ${msg.nombre}`}
                        </span>
                        <div className={`px-3 py-2 border-2 ${esPropio ? 'border-white bg-white text-black' : 'border-zinc-700 bg-black text-white'}`}>
                          <p className="font-bold">{msg.mensaje}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="aca también bro"
                  value={mensajeChat}
                  onChange={(e) => setMensajeChat(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black border-2 border-zinc-700 text-white focus:outline-none focus:border-white font-bold text-sm"
                />
                <button type="submit" className="p-2 bg-white text-black border-2 border-white hover:bg-zinc-300 cursor-pointer">
                  <Send size={18} />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
