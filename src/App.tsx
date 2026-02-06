import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Tv,
  Camera,
  Lock,
  ArrowLeft,
  Home,
  Bell,
  LogOut,
  Save,
  ChevronRight,
  Scissors,
  Crown,
  Trash2,
  Clock,
  Users,
  Scan,
  Eraser,
  Settings,
  UserCheck,
  UserMinus,
  UserX,
  RefreshCw,
  CheckCircle2,
  Play,
  Calendar,
  AlertTriangle,
  X,
  ShieldAlert,
  Zap,
  Loader2,
  Code2,
  Circle,
  Check,
  Info,
  AlertCircle,
  DollarSign,
  Banknote,
  CreditCard,
  TrendingUp,
} from "lucide-react";

// --- Configuração do Firebase ---
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAU5crOPK6roszFly_pyl0G7CcsYFvjm6U",
  authDomain: "sistema-barbearia-acb02.firebaseapp.com",
  projectId: "sistema-barbearia-acb02",
  storageBucket: "sistema-barbearia-acb02.firebasestorage.app",
  messagingSenderId: "149768423148",
  appId: "1:149768423148:web:59189c3c1912ab98d847c9",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- Componentes de Interface ---

const GlassContainer = ({ children, className = "", onClick }: any) => {
  const m = motion as any;
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.01 } : {}}
      onClick={onClick}
      className={`glass rounded-[2.5rem] p-8 transition-all ${className}`}
    >
      {children}
    </m.div>
  );
};

const ISDSignature = () => (
  <div className="fixed bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none z-50">
    <div className="flex items-center gap-2 isd-signature text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
      <Code2 size={12} className="text-blue-500" />
      Developed by <span className="text-blue-400">&lt;ISD Systems /&gt;</span>
    </div>
  </div>
);

const EliteToasts = ({ toasts }: { toasts: any[] }) => {
  const m = motion as any;
  return (
    <div className="fixed top-10 right-10 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className={`pointer-events-auto glass-slim min-w-[300px] p-6 rounded-3xl border flex items-center gap-4 shadow-2xl ${
              toast.type === "sucesso"
                ? "border-emerald-500/30"
                : toast.type === "erro"
                ? "border-red-500/30"
                : "border-blue-500/30"
            }`}
          >
            <div
              className={`p-3 rounded-2xl ${
                toast.type === "sucesso"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : toast.type === "erro"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {toast.type === "sucesso" ? (
                <Check size={20} />
              ) : toast.type === "erro" ? (
                <AlertCircle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-white/90">
              {toast.message}
            </p>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Aplicação ---

const App: React.FC = () => {
  const m = motion as any;
  const [modo, setModo] = useState<any>("selecao");
  const [clientesFila, setClientesFila] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState<any[]>([]);
  const [barbeiroLogado, setBarbeiroLogado] = useState<any | null>(null);
  const [checkoutAtivo, setCheckoutAtivo] = useState<any | null>(null);
  const [valorInput, setValorInput] = useState<string>("50.00");
  const [showGanhosModal, setShowGanhosModal] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [tentativasPIN, setTentativasPIN] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sobrenome: "",
    whatsapp: "",
    cpf: "",
    foto: "",
    barbeiroPref: "Sem Preferência",
    servico: "Cabelo",
  });
  const [novoProf, setNovoProf] = useState({ nome: "", matricula: "" });
  const [acessoInput, setAcessoInput] = useState("");
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevClientesRef = useRef<any[]>([]);

  const addToast = (
    message: string,
    type: "sucesso" | "erro" | "info" = "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
  }, []);

  useEffect(() => {
    const unsubFila = db
      .collection("fila_paiva")
      .orderBy("chegada", "asc")
      .onSnapshot((snap) => {
        const novos = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        if (modo === "painel") {
          const chamado = novos.find((c) => {
            const anterior = prevClientesRef.current.find((p) => p.id === c.id);
            return (
              c.status === "atendendo" &&
              (!anterior || anterior.status === "esperando")
            );
          });
          if (chamado) audioRef.current?.play().catch(() => {});
        }
        prevClientesRef.current = novos;
        setClientesFila(novos);
      });
    const unsubProf = db.collection("profissionais").onSnapshot((snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setProfissionais(list);
      if (barbeiroLogado) {
        const atual = list.find((p) => p.id === barbeiroLogado.id);
        if (atual) setBarbeiroLogado(atual);
      }
    });
    const unsubHist = db
      .collection("historico_paiva")
      .orderBy("dataConclusao", "desc")
      .limit(100)
      .onSnapshot((snap) => {
        setHistoricoAtendimentos(
          snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        );
      });
    return () => {
      unsubFila();
      unsubProf();
      unsubHist();
      pararCamera();
    };
  }, [barbeiroLogado?.id, modo]);

  useEffect(() => {
    if (modo === "biometria") abrirCamera();
    else if (modo === "selecao") pararCamera();
  }, [modo]);

  useEffect(() => {
    let interval: any;
    if (bloqueadoAte) {
      interval = setInterval(() => {
        const rest = Math.ceil((bloqueadoAte - Date.now()) / 1000);
        if (rest <= 0) {
          setBloqueadoAte(null);
          setTentativasPIN(0);
          setSegundosRestantes(0);
        } else {
          setSegundosRestantes(rest);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  const abrirCamera = async () => {
    try {
      pararCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      addToast("Erro na câmera.", "erro");
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const tirarFoto = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        setNovoCliente((prev) => ({
          ...prev,
          foto: canvasRef.current!.toDataURL("image/png"),
        }));
        pararCamera();
        setModo("cliente_registro");
        addToast("Foto ok!", "sucesso");
      }
    }
  };

  const handleAcesso = () => {
    if (bloqueadoAte) return;
    if (acessoInput === "123456") {
      setModo("gestao_master");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast("Modo Master", "sucesso");
      return;
    }
    const prof = profissionais.find((p) => p.matricula === acessoInput);
    if (prof) {
      setBarbeiroLogado(prof);
      setModo("admin_barbeiro");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast(`Olá, ${prof.nome}`, "sucesso");
    } else {
      const next = tentativasPIN + 1;
      setTentativasPIN(next);
      setAcessoInput("");
      if (next >= 3) {
        setBloqueadoAte(Date.now() + 300000);
        addToast("Bloqueado por 5 min", "erro");
      } else addToast("PIN incorreto", "erro");
    }
  };

  const mudarStatus = async (status: string) => {
    if (!barbeiroLogado) return;
    try {
      const batch = db.batch();
      batch.update(db.collection("profissionais").doc(barbeiroLogado.id), {
        status,
      });
      if (status === "ausente") {
        clientesFila
          .filter(
            (c) =>
              c.barbeiroPref === barbeiroLogado.nome && c.status === "esperando"
          )
          .forEach((c) =>
            batch.update(db.collection("fila_paiva").doc(c.id), {
              barbeiroPref: "Sem Preferência",
            })
          );
      }
      await batch.commit();
      addToast(`Status: ${status}`, "info");
    } catch (e) {
      addToast("Erro ao mudar status", "erro");
    }
  };

  const cadastrarCliente = async (barbeiro: string) => {
    try {
      await db
        .collection("fila_paiva")
        .add({
          ...novoCliente,
          barbeiroPref: barbeiro,
          chegada: firebase.firestore.Timestamp.now(),
          status: "esperando",
        });
      setModo("selecao");
      addToast("Cadastrado!", "sucesso");
    } catch (e) {
      addToast("Erro ao cadastrar", "erro");
    }
  };

  const finalizarServico = async () => {
    const val = parseFloat(valorInput);
    if (isNaN(val) || val <= 0) return addToast("Valor inválido", "erro");
    try {
      await db.collection("historico_paiva").add({
        nome: checkoutAtivo.nome + " " + (checkoutAtivo.sobrenome || ""),
        barbeiro: barbeiroLogado.nome,
        servico: checkoutAtivo.servico,
        valor: val,
        dataConclusao: firebase.firestore.Timestamp.now(),
        tempoEspera: Math.floor(
          (Date.now() - checkoutAtivo.chegada.toMillis()) / 60000
        ),
      });
      await db.collection("fila_paiva").doc(checkoutAtivo.id).delete();
      addToast("Finalizado!", "sucesso");
      setCheckoutAtivo(null);
    } catch (e) {
      addToast("Erro ao finalizar", "erro");
    }
  };

  const getStats = (nome?: string) => {
    const hoje = new Date().setHours(0, 0, 0, 0);
    const hist = nome
      ? historicoAtendimentos.filter((h) => h.barbeiro === nome)
      : historicoAtendimentos;
    return {
      hoje: hist
        .filter((h) => h.dataConclusao?.toMillis() >= hoje)
        .reduce((acc, c) => acc + (c.valor || 0), 0),
    };
  };

  if (modo === "selecao") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
        <m.div initial={{ y: -50 }} animate={{ y: 0 }} className="pt-10">
          <h1 className="text-8xl font-black uppercase italic tracking-tighter neon-yellow text-white mb-4">
            ELITE CARIOCA
          </h1>
          <p className="text-blue-500 font-bold tracking-[0.8em] uppercase text-sm neon-blue">
            Luxury Barber Experience
          </p>
        </m.div>
        <m.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setModo("cliente_registro")}
          className="relative glass h-80 w-80 md:h-[450px] md:w-[450px] rounded-[5rem] flex flex-col items-center justify-center gap-8 border-2 border-yellow-500/30 shadow-2xl"
        >
          <div className="p-8 bg-yellow-500/10 rounded-full">
            <Scissors size={100} className="text-yellow-500" />
          </div>
          <span className="font-black text-4xl uppercase">Quero Cortar</span>
        </m.button>
        <div className="w-full flex justify-between items-end">
          <button
            onClick={() => setModo("painel")}
            className="opacity-30 hover:opacity-100 p-4 flex flex-col items-center"
          >
            <Tv size={24} />
            <span className="text-[8px] font-black uppercase">TV</span>
          </button>
          <div className="glass-slim px-6 py-4 rounded-[2rem] flex items-center gap-4 bg-slate-900/40">
            <input
              type="password"
              disabled={!!bloqueadoAte}
              placeholder={bloqueadoAte ? "BLOQUEADO" : "PIN"}
              className="w-32 bg-transparent text-center font-bold text-xs outline-none"
              value={acessoInput}
              onChange={(e) => setAcessoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAcesso()}
            />
            <button
              onClick={handleAcesso}
              className="text-blue-500 font-black text-[9px]"
            >
              OK
            </button>
          </div>
        </div>
        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "biometria") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <button
          onClick={() => setModo("cliente_registro")}
          className="absolute top-10 left-10 text-slate-600 flex items-center gap-2 font-bold uppercase text-xs"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="relative w-80 h-80 rounded-[4rem] border-4 border-yellow-500 overflow-hidden mb-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={tirarFoto}
          className="bg-yellow-600 px-12 py-5 rounded-3xl font-black uppercase flex items-center gap-3"
        >
          <Camera size={24} /> Capturar
        </button>
        <canvas ref={canvasRef} width="400" height="400" className="hidden" />
      </div>
    );
  }

  if (modo === "cliente_registro") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <GlassContainer className="w-full max-w-lg space-y-8">
          <button
            onClick={() => setModo("selecao")}
            className="text-slate-500 flex items-center gap-2 font-bold uppercase text-[10px]"
          >
            <ArrowLeft size={14} /> Início
          </button>
          <h2 className="text-4xl font-black uppercase text-center neon-yellow">
            Cadastro
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="NOME"
              className="w-full p-5 bg-slate-950 rounded-2xl border border-white/5 outline-none focus:border-yellow-500 text-white"
              value={novoCliente.nome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, nome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="SOBRENOME"
              className="w-full p-5 bg-slate-950 rounded-2xl border border-white/5 outline-none focus:border-yellow-500 text-white"
              value={novoCliente.sobrenome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, sobrenome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="WHATSAPP"
              className="w-full p-5 bg-slate-950 rounded-2xl border border-white/5 outline-none focus:border-yellow-500 text-white"
              value={novoCliente.whatsapp}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, whatsapp: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Cabelo", "Barba", "Completo"].map((s) => (
              <button
                key={s}
                onClick={() => setNovoCliente({ ...novoCliente, servico: s })}
                className={`py-4 rounded-xl font-black uppercase text-[10px] border ${
                  novoCliente.servico === s
                    ? "bg-yellow-500 text-slate-950"
                    : "bg-slate-900 text-slate-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setModo("biometria")}
              className="p-6 bg-slate-900 rounded-2xl text-slate-400 flex-1 flex items-center justify-center gap-3"
            >
              <Camera size={24} />{" "}
              {novoCliente.foto ? "Alterar Foto" : "Biometria"}
            </button>
            {novoCliente.foto && (
              <img
                src={novoCliente.foto}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
          </div>
          <button
            disabled={!novoCliente.nome}
            onClick={() => setModo("barbeiro_choice")}
            className="w-full p-8 rounded-[2rem] font-black uppercase bg-yellow-600 text-white disabled:opacity-30"
          >
            Escolher Barbeiro
          </button>
        </GlassContainer>
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "barbeiro_choice") {
    const disp = profissionais.filter((p) => p.status === "disponivel");
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <h2 className="text-5xl font-black mb-12 uppercase italic neon-yellow">
          Com quem vamos cortar?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-center">
          <GlassContainer
            onClick={() => cadastrarCliente("Sem Preferência")}
            className="bg-yellow-600/10 border-yellow-500/20 flex flex-col items-center gap-2 cursor-pointer hover:bg-yellow-600"
          >
            <Zap size={32} className="text-yellow-500" />
            <span className="font-black text-xl uppercase">
              Sem Preferência
            </span>
          </GlassContainer>
          {disp.map((p) => (
            <GlassContainer
              key={p.id}
              onClick={() => cadastrarCliente(p.nome)}
              className="flex flex-col items-center gap-2 cursor-pointer border-white/10 hover:border-yellow-500"
            >
              <Scissors size={24} className="text-yellow-500" />
              <span className="font-black text-xl uppercase">{p.nome}</span>
            </GlassContainer>
          ))}
          {disp.length === 0 && (
            <p className="col-span-full opacity-50">
              Nenhum barbeiro disponível no momento.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (modo === "painel") {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white flex flex-col">
        <div className="flex justify-between items-center mb-12">
          <button onClick={() => setModo("selecao")}>
            <ArrowLeft size={32} />
          </button>
          <h1 className="text-5xl font-black uppercase neon-yellow">
            ELITE CARIOCA TV
          </h1>
          <div className="text-4xl font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
          <GlassContainer className="bg-slate-900/30 border-blue-500/20">
            <h3 className="text-center font-black text-blue-400 mb-8 pb-4 border-b border-white/5">
              Geral
            </h3>
            {clientesFila
              .filter(
                (c) =>
                  c.barbeiroPref === "Sem Preferência" &&
                  c.status === "esperando"
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="p-6 bg-slate-800 rounded-3xl text-center mb-4"
                >
                  <span className="text-2xl font-black block">{c.nome}</span>
                  <span className="text-[10px] opacity-50 uppercase">
                    {c.servico}
                  </span>
                </div>
              ))}
          </GlassContainer>
          {profissionais
            .filter((p) => p.status !== "ausente")
            .map((p) => (
              <GlassContainer
                key={p.id}
                className="bg-slate-900/30 border-yellow-500/20"
              >
                <h3 className="text-center font-black text-yellow-400 mb-8 pb-4 border-b border-white/5">
                  {p.nome}
                </h3>
                {clientesFila
                  .filter(
                    (c) => c.barbeiroPref === p.nome && c.status === "esperando"
                  )
                  .map((c, i) => (
                    <div
                      key={c.id}
                      className={`p-6 rounded-3xl text-center font-black mb-4 ${
                        i === 0 ? "bg-yellow-600" : "bg-slate-800"
                      }`}
                    >
                      <span className="text-2xl block">{c.nome}</span>
                      <span className="text-[10px] opacity-50 uppercase">
                        {c.servico}
                      </span>
                    </div>
                  ))}
              </GlassContainer>
            ))}
        </div>
      </div>
    );
  }

  if (modo === "admin_barbeiro" && barbeiroLogado) {
    const stats = getStats(barbeiroLogado.nome);
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-white">
        <GlassContainer className="w-full max-w-5xl space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-black uppercase neon-yellow">
              {barbeiroLogado.nome}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowGanhosModal(true)}
                className="p-4 bg-blue-900 rounded-2xl font-bold text-xs uppercase"
              >
                Ganhos
              </button>
              <button
                onClick={() => setModo("selecao")}
                className="p-4 bg-red-900 rounded-2xl"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["disponivel", "ocupado", "ausente"].map((s) => (
              <button
                key={s}
                onClick={() => mudarStatus(s)}
                className={`p-6 rounded-[2rem] font-black uppercase border-2 ${
                  barbeiroLogado.status === s
                    ? "bg-emerald-600 border-emerald-400"
                    : "bg-slate-900 border-transparent opacity-40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="font-black text-slate-500 mb-4 uppercase text-xs">
                Fila
              </h3>
              {clientesFila
                .filter(
                  (c) =>
                    (c.barbeiroPref === barbeiroLogado.nome ||
                      c.barbeiroPref === "Sem Preferência") &&
                    c.status === "esperando"
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-6 bg-slate-900 rounded-3xl mb-4 flex justify-between items-center"
                  >
                    <span>{c.nome}</span>
                    <button
                      onClick={() =>
                        db
                          .collection("fila_paiva")
                          .doc(c.id)
                          .update({
                            status: "atendendo",
                            barbeiroPref: barbeiroLogado.nome,
                          })
                      }
                      className="bg-yellow-600 px-4 py-2 rounded-xl text-xs font-black"
                    >
                      Chamar
                    </button>
                  </div>
                ))}
            </div>
            <div>
              <h3 className="font-black text-emerald-500 mb-4 uppercase text-xs">
                Atendimento
              </h3>
              {clientesFila
                .filter(
                  (c) =>
                    c.barbeiroPref === barbeiroLogado.nome &&
                    c.status === "atendendo"
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-10 bg-slate-900 rounded-3xl border-2 border-emerald-500 shadow-xl text-center"
                  >
                    <h4 className="text-4xl font-black mb-4">{c.nome}</h4>
                    <button
                      onClick={() => setCheckoutAtivo(c)}
                      className="w-full bg-emerald-600 p-6 rounded-2xl font-black"
                    >
                      Finalizar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </GlassContainer>
        {showGanhosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <GlassContainer className="max-w-md w-full text-center">
              <div className="flex justify-between mb-8">
                <h3 className="text-2xl font-black">Ganhos Hoje</h3>
                <button onClick={() => setShowGanhosModal(false)}>
                  <X />
                </button>
              </div>
              <span className="text-5xl font-black text-emerald-400">
                {formatBRL(stats.hoje)}
              </span>
            </GlassContainer>
          </div>
        )}
        {checkoutAtivo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <GlassContainer className="max-w-sm w-full text-center">
              <h3 className="text-3xl font-black mb-2 text-emerald-400">
                Checkout
              </h3>
              <input
                type="number"
                autoFocus
                className="bg-transparent text-5xl font-black text-center text-white w-full border-b border-emerald-500 mb-8 outline-none"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setCheckoutAtivo(null)}
                  className="flex-1 p-4 bg-slate-800 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={finalizarServico}
                  className="flex-1 p-4 bg-emerald-600 rounded-2xl font-black"
                >
                  Confirmar
                </button>
              </div>
            </GlassContainer>
          </div>
        )}
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "gestao_master") {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <GlassContainer className="w-full max-w-7xl space-y-10">
          <div className="flex justify-between items-center">
            <button onClick={() => setModo("selecao")}>
              <ArrowLeft />
            </button>
            <h2 className="text-2xl font-black">MASTER ADMIN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <GlassContainer className="bg-slate-900/50">
              <h3 className="font-black text-yellow-500 mb-4 uppercase text-xs tracking-widest">
                Novo Barbeiro
              </h3>
              <input
                className="w-full bg-slate-950 p-4 mb-4 rounded-xl border border-white/5 outline-none"
                placeholder="Nome"
                value={novoProf.nome}
                onChange={(e) =>
                  setNovoProf({ ...novoProf, nome: e.target.value })
                }
              />
              <input
                className="w-full bg-slate-950 p-4 mb-4 rounded-xl border border-white/5 outline-none"
                placeholder="Matrícula"
                value={novoProf.matricula}
                onChange={(e) =>
                  setNovoProf({ ...novoProf, matricula: e.target.value })
                }
              />
              <button
                onClick={async () => {
                  await db
                    .collection("profissionais")
                    .add({ ...novoProf, status: "ausente" });
                  setNovoProf({ nome: "", matricula: "" });
                  addToast("Salvo", "sucesso");
                }}
                className="w-full bg-yellow-600 p-4 rounded-xl font-black uppercase"
              >
                Salvar
              </button>
            </GlassContainer>
            <GlassContainer className="bg-slate-900/50">
              <h3 className="font-black mb-4 uppercase text-xs tracking-widest">
                Equipe
              </h3>
              <div className="space-y-4">
                {profissionais.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950 rounded-xl flex justify-between items-center"
                  >
                    <span>{p.nome}</span>
                    <button
                      onClick={() =>
                        db.collection("profissionais").doc(p.id).delete()
                      }
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassContainer>
          </div>
        </GlassContainer>
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  return null;
};

export default App;
