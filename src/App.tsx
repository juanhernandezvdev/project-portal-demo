import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  Shield, CheckCircle2, Clock, Download, Key, MessageSquare,
  FileText, LogOut, Lock, Plus, RefreshCw, AlertCircle,
  Cpu, FolderPlus, PackagePlus,
  FileCheck, CreditCard, Home, LayoutDashboard
} from 'lucide-react';

const ADMIN_EMAIL = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL || 'admin@example.com';

/** Coordina la autenticación, los datos de proyectos y las vistas del portal. */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'releases' | 'licenses' | 'documents' | 'payments' | 'tickets' | 'invoices'>('home');

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjData, setNewProjData] = useState({
    customId: '',
    name: '',
    orgName: '',
    clientUid: '',
    licenseKey: '',
    maxNodes: 5
  });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const [newRelease, setNewRelease] = useState({
    version: '',
    platform: 'Windows x64 (.exe)',
    size: '',
    sha256: '',
    downloadUrl: '',
    changelog: ''
  });

  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');

  const [newInvoice, setNewInvoice] = useState({
    concept: '',
    amount: '',
    date: ''
  });

  const [newDocData, setNewDocData] = useState({ title: '', type: 'Contrato de Servicios', url: '' });
  const [paymentReport, setPaymentReport] = useState({ reference: '', method: 'Transferencia de ejemplo', amount: '', notes: '' });

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser && currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setActiveTab('overview');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setSelectedProjectId(null);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ? query(projectsRef)
      : query(projectsRef, where('clientUid', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    }, (error) => {
      console.error("Error leyendo Firestore:", error);
    });

    return () => unsub();
  }, [user]);

  /** Autentica al usuario y muestra un mensaje si Firebase rechaza sus credenciales. */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setLoginError('Correo o contraseña incorrectos, o cuenta no creada en Firebase Auth.');
    }
  };

  /** Crea un proyecto y guarda sus registros iniciales de ejemplo en Firestore. */
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = newProjData.customId.trim() || `proj_${Date.now()}`;
    const generatedKey = newProjData.licenseKey.trim() || `DEMO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-PRO`;

    await setDoc(doc(db, 'projects', docId), {
      name: newProjData.name,
      orgName: newProjData.orgName,
      clientUid: newProjData.clientUid.trim(),
      status: 'En Desarrollo',
      overallProgress: 25,
      milestones: [
        { id: `m_${Date.now()}`, title: 'Levantamiento de Requerimientos & Arquitectura', progress: 100, date: 'Completado' }
      ],
      releases: [],
      license: {
        key: generatedKey,
        plan: 'Licencia Empresarial Offline-First',
        maxNodes: Number(newProjData.maxNodes) || 5,
        nodes: []
      },
      tickets: [],
      invoices: [],
      documents: [
        { id: 'doc_1', title: 'Acuerdo de confidencialidad de ejemplo', type: 'Acuerdo', url: '#', date: 'Fecha de ejemplo', signed: true },
        { id: 'doc_2', title: 'Guía de servicio de ejemplo', type: 'Guía', url: '#', date: 'Fecha de ejemplo', signed: true }
      ],
      paymentMethods: [
        { type: 'Transferencia de ejemplo', details: 'Datos ficticios; no realizar pagos.' }
      ],
      reportedPayments: [],
      timeline: [
        { id: 't_1', text: 'Proyecto creado e inicializado', date: new Date().toLocaleDateString(), type: 'info' }
      ]
    });

    setSelectedProjectId(docId);
    setShowNewProjectModal(false);
    setNewProjData({ customId: '', name: '', orgName: '', clientUid: '', licenseKey: '', maxNodes: 5 });
  };

  /** Carga registros ficticios en el proyecto seleccionado para recorrer la interfaz. */
  const initializeFullProjectData = async () => {
    if (!selectedProject) return;
    await updateDoc(doc(db, 'projects', selectedProject.id), {
      orgName: selectedProject.orgName || "Empresa de ejemplo",
      milestones: [
        { id: "m1", title: "Diseño de la solución", progress: 100, date: "Completado" },
        { id: "m2", title: "Implementación de módulos", progress: 100, date: "Completado" },
        { id: "m3", title: "Pruebas y entrega", progress: 50, date: "En curso" }
      ],
      releases: [
        {
          id: "rel_1",
          version: "v1.0.0-demo",
          date: "Fecha de ejemplo",
          platform: "Web (URL)",
          size: "Tamaño de ejemplo",
          sha256: "Hash de ejemplo",
          downloadUrl: "#",
          approved: false,
          changelog: "Versión de demostración"
        }
      ],
      license: {
        key: "DEMO-PORTAL-0001",
        plan: "Plan de demostración",
        maxNodes: 5,
        nodes: [
          { hwid: "DEMO-WORKSTATION-01", alias: "Equipo de ejemplo", lastSync: "Última conexión de ejemplo" }
        ]
      },
      tickets: [
        {
          id: "TKT-001",
          title: "Revisar el diseño de la pantalla",
          description: "Solicitud ficticia para mostrar el flujo de soporte.",
          priority: "Media",
          status: "En Revisión",
          createdAt: "Fecha de ejemplo"
        }
      ],
      timeline: [
        { id: 't_demo', text: 'Datos de prueba poblados en Firestore', date: new Date().toLocaleDateString(), type: 'success' }
      ]
    });
  };

  /** Actualiza el estado del proyecto si el usuario tiene el rol de administrador. */
  const handleUpdateProjectStatus = async (newStatus: string) => {
    if (!selectedProject || !isAdmin) return;
    await updateDoc(doc(db, 'projects', selectedProject.id), { status: newStatus });
  };

  /** Agrega un hito, recalcula el avance general y registra el cambio en la actividad. */
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !selectedProject) return;
    const current = selectedProject.milestones || [];
    const updated = [...current, { id: `m_${Date.now()}`, title: newMilestoneTitle, date: newMilestoneDate || 'Por definir', progress: 0 }];

    const totalProgress = updated.length > 0
      ? Math.round(updated.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / updated.length)
      : 0;

    const timeline = selectedProject.timeline || [];
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Nuevo hito agregado: ${newMilestoneTitle}`, date: new Date().toLocaleDateString(), type: 'info' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      milestones: updated,
      overallProgress: totalProgress,
      timeline: [newTimelineItem, ...timeline]
    });
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  /** Cambia el avance de un hito y sincroniza el resumen y la actividad del proyecto. */
  const handleUpdateMilestoneProgress = async (mId: string, progress: number) => {
    if (!selectedProject || !isAdmin) return;
    const updated = (selectedProject.milestones || []).map((m: any) => m.id === mId ? { ...m, progress } : m);

    const totalProgress = updated.length > 0
      ? Math.round(updated.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / updated.length)
      : 0;

    const timeline = selectedProject.timeline || [];
    const milestoneObj = updated.find((m: any) => m.id === mId);
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Hito "${milestoneObj?.title}" actualizado a ${progress}%`, date: new Date().toLocaleDateString(), type: 'success' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      milestones: updated,
      overallProgress: totalProgress,
      timeline: [newTimelineItem, ...timeline]
    });
  };

  /** Publica un entregable y agrega el evento correspondiente a la actividad. */
  const handlePublishRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelease.version.trim() || !selectedProject) return;
    const current = selectedProject.releases || [];
    const created = {
      id: `rel_${Date.now()}`,
      version: newRelease.version,
      platform: newRelease.platform,
      size: newRelease.size || '65.0 MB',
      sha256: newRelease.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      downloadUrl: newRelease.downloadUrl || '#',
      changelog: newRelease.changelog,
      date: new Date().toLocaleDateString(),
      approved: false
    };

    const timeline = selectedProject.timeline || [];
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Nuevo entregable publicado: ${newRelease.version} (${newRelease.platform})`, date: new Date().toLocaleDateString(), type: 'success' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      releases: [created, ...current],
      timeline: [newTimelineItem, ...timeline]
    });
    setNewRelease({ version: '', platform: 'Windows x64 (.exe)', size: '', sha256: '', downloadUrl: '', changelog: '' });
  };

  /** Aprueba un entregable con el usuario actual y registra la aprobación. */
  const handleApproveRelease = async (releaseId: string) => {
    if (!selectedProject || !user) return;
    const updated = (selectedProject.releases || []).map((r: any) =>
      r.id === releaseId ? { ...r, approved: true, approvedBy: user.email, approvedAt: new Date().toLocaleDateString() } : r
    );
    const timeline = selectedProject.timeline || [];
    const relObj = updated.find((r: any) => r.id === releaseId);
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Entregable ${relObj?.version} aprobado`, date: new Date().toLocaleDateString(), type: 'success' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      releases: updated,
      timeline: [newTimelineItem, ...timeline]
    });
  };

  /** Quita un dispositivo registrado de la licencia del proyecto seleccionado. */
  const handleRevokeNode = async (hwid: string) => {
    if (!selectedProject?.license) return;
    const updatedNodes = (selectedProject.license.nodes || []).filter((n: any) => n.hwid !== hwid);
    await updateDoc(doc(db, 'projects', selectedProject.id), { 'license.nodes': updatedNodes });
  };

  /** Crea una solicitud de soporte y la registra en la actividad del proyecto. */
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !selectedProject) return;
    const current = selectedProject.tickets || [];
    const newTk = {
      id: `TKT-${String(current.length + 1).padStart(3, '0')}`,
      title: newTicketTitle,
      description: newTicketDesc,
      priority: "Alta",
      status: "Abierto",
      createdAt: new Date().toLocaleDateString()
    };

    const timeline = selectedProject.timeline || [];
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Nuevo ticket abierto: ${newTicketTitle}`, date: new Date().toLocaleDateString(), type: 'info' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      tickets: [newTk, ...current],
      timeline: [newTimelineItem, ...timeline]
    });
    setNewTicketTitle('');
    setNewTicketDesc('');
  };

  /** Cambia el estado de una solicitud de soporte y registra la actualización. */
  const handleChangeTicketStatus = async (tkId: string, newStatus: string) => {
    if (!selectedProject || !isAdmin) return;
    const updated = (selectedProject.tickets || []).map((t: any) => t.id === tkId ? { ...t, status: newStatus } : t);

    const timeline = selectedProject.timeline || [];
    const tkObj = updated.find((t: any) => t.id === tkId);
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Ticket ${tkObj?.id} marcado como "${newStatus}"`, date: new Date().toLocaleDateString(), type: 'success' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      tickets: updated,
      timeline: [newTimelineItem, ...timeline]
    });
  };

  /** Crea un registro de factura con un identificador de demostración secuencial. */
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.concept.trim() || !selectedProject) return;
    const current = selectedProject.invoices || [];
    const created = {
      id: `INV-${String(current.length + 1).padStart(3, '0')}`,
      concept: newInvoice.concept,
      amount: newInvoice.amount.startsWith('$') ? newInvoice.amount : `$${newInvoice.amount}`,
      date: newInvoice.date || new Date().toLocaleDateString(),
      status: 'Pendiente'
    };
    await updateDoc(doc(db, 'projects', selectedProject.id), { invoices: [created, ...current] });
    setNewInvoice({ concept: '', amount: '', date: '' });
  };

  /** Alterna una factura entre los estados pendiente y pagado para administradores. */
  const handleToggleInvoiceStatus = async (invId: string) => {
    if (!selectedProject || !isAdmin) return;
    const updated = (selectedProject.invoices || []).map((i: any) =>
      i.id === invId ? { ...i, status: i.status === 'Pagado' ? 'Pendiente' : 'Pagado' } : i
    );
    await updateDoc(doc(db, 'projects', selectedProject.id), { invoices: updated });
  };

  /** Agrega un documento y notifica a los participantes mediante la actividad. */
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.title.trim() || !selectedProject) return;
    const current = selectedProject.documents || [];
    const newDoc = {
      id: `doc_${Date.now()}`,
      title: newDocData.title,
      type: newDocData.type,
      url: newDocData.url || '#',
      date: new Date().toLocaleDateString(),
      signed: true
    };
    const timeline = selectedProject.timeline || [];
    const newTimelineItem = { id: `t_${Date.now()}`, text: `Documento adjuntado: ${newDocData.title} (${newDocData.type})`, date: new Date().toLocaleDateString(), type: 'success' };

    await updateDoc(doc(db, 'projects', selectedProject.id), {
      documents: [newDoc, ...current],
      timeline: [newTimelineItem, ...timeline]
    });
    setNewDocData({ title: '', type: 'Contrato de Servicios', url: '' });
  };

  /** Guarda un reporte para revisión; los datos de pago de la demo no son reales. */
  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentReport.reference.trim() || !selectedProject || !user) return;
    const current = selectedProject.reportedPayments || [];
    const report = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      reference: paymentReport.reference,
      method: paymentReport.method,
      amount: paymentReport.amount ? (paymentReport.amount.startsWith('$') ? paymentReport.amount : `$${paymentReport.amount}`) : 'Por verificar',
      notes: paymentReport.notes,
      reportedBy: user.email,
      date: new Date().toLocaleDateString(),
      status: 'En Revisión'
    };
    await updateDoc(doc(db, 'projects', selectedProject.id), { reportedPayments: [report, ...current] });
    setPaymentReport({ reference: '', method: 'Transferencia de ejemplo', amount: '', notes: '' });
  };

  /** Actualiza el estado de revisión de un reporte de pago. */
  const handleTogglePaymentStatus = async (payId: string, newStatus: string) => {
    if (!selectedProject || !isAdmin) return;
    const updated = (selectedProject.reportedPayments || []).map((p: any) =>
      p.id === payId ? { ...p, status: newStatus } : p
    );
    await updateDoc(doc(db, 'projects', selectedProject.id), { reportedPayments: updated });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-500" />
        Conectando con Firebase...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/30">
              PD
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Portal de Proyectos</h1>
              <p className="text-xs text-slate-400">Portal Corporativo de Clientes & Licencias</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Ingresar al Portal Seguro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra Superior */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm shadow-md">PD</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Portal de Proyectos</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                {isAdmin ? `Modo Administrador Total (${projects.length} proyectos)` : 'Portal Cliente Verificado'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Nuevo Cliente / Proyecto
            </button>
          )}
          <button
            onClick={() => signOut(auth)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Estructura Principal con 3 Columnas */}
      <div className="flex-1 flex overflow-hidden">

        {/* 1. BARRA DE NAVEGACIÓN LATERAL IZQUIERDA */}
        <aside className="w-64 bg-slate-900/70 border-r border-slate-800 p-4 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-2 mb-2">
              Navegación General
            </span>
            <nav className="space-y-1">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('home')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'home'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Home className="w-4 h-4 text-indigo-400" />
                  Inicio / Todos los Proyectos
                </button>
              )}
            </nav>
          </div>

          <div className="flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-2 mb-2">
              {isAdmin ? 'Proyectos Activos' : 'Secciones del Proyecto'}
            </span>

            {isAdmin ? (
              <div className="space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      if (activeTab === 'home') setActiveTab('overview');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition border flex items-center justify-between ${
                      selectedProject?.id === proj.id && activeTab !== 'home'
                        ? 'bg-slate-800 border-indigo-500/50 text-white font-semibold'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{proj.orgName || proj.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 rounded text-indigo-300 shrink-0">
                      {proj.overallProgress || 0}%
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Hitos & Avance', icon: Clock },
                  { id: 'releases', label: 'Entregables', icon: Download },
                  { id: 'licenses', label: 'Licencia & Nodos', icon: Key },
                  { id: 'documents', label: 'Documentos & NDA', icon: FileCheck },
                  { id: 'payments', label: 'Métodos & Pagos', icon: CreditCard },
                  { id: 'tickets', label: 'Soporte', icon: MessageSquare },
                  { id: 'invoices', label: 'Facturas', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </aside>

        {/* 2. CONTENIDO CENTRAL */}
        <main className="flex-1 p-6 overflow-y-auto">
          {!selectedProject && activeTab !== 'home' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
              <Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h2 className="text-base font-semibold">No hay proyectos registrados</h2>
            </div>
          ) : (
            <>
              {isAdmin && activeTab === 'home' ? (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                      Panel General de Administración
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Resumen general de las empresas y proyectos de ejemplo.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveTab('overview');
                        }}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer transition space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {proj.id}
                          </span>
                          <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded">
                            {proj.status || 'En Desarrollo'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{proj.orgName || proj.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{proj.name}</p>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Progreso General</span>
                            <span className="font-bold text-indigo-400">{proj.overallProgress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${proj.overallProgress || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                          {selectedProject.id}
                        </span>
                        {isAdmin ? (
                          <select
                            value={selectedProject.status || 'En Desarrollo'}
                            onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                            className="text-xs bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/30 focus:outline-none"
                          >
                            <option className="bg-slate-900" value="En Desarrollo">En Desarrollo</option>
                            <option className="bg-slate-900" value="Fase QA / Pruebas">Fase QA / Pruebas</option>
                            <option className="bg-slate-900" value="En Producción">En Producción</option>
                            <option className="bg-slate-900" value="Pausado">Pausado</option>
                          </select>
                        ) : (
                          <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/20">
                            {selectedProject.status}
                          </span>
                        )}
                        {isAdmin && !selectedProject.milestones && (
                          <button
                            onClick={initializeFullProjectData}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-2.5 py-0.5 rounded transition"
                          >
                            + Poblar Datos Demo
                          </button>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white">{selectedProject.name}</h2>
                      <p className="text-xs text-slate-400">
                        Empresa: <b className="text-slate-200">{selectedProject.orgName || 'Sin especificar'}</b>
                      </p>
                    </div>

                    <div className="md:w-72 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Progreso General</span>
                        <span className="font-bold text-indigo-400">{selectedProject.overallProgress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${selectedProject.overallProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Hitos & Avance', icon: Clock },
                      { id: 'releases', label: `Entregables (${selectedProject.releases?.length || 0})`, icon: Download },
                      { id: 'licenses', label: 'Licencia & Nodos', icon: Key },
                      { id: 'documents', label: `Documentos (${selectedProject.documents?.length || 0})`, icon: FileCheck },
                      { id: 'payments', label: 'Métodos & Pagos', icon: CreditCard },
                      { id: 'tickets', label: `Soporte (${selectedProject.tickets?.length || 0})`, icon: MessageSquare },
                      { id: 'invoices', label: `Facturas (${selectedProject.invoices?.length || 0})`, icon: FileText },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {isAdmin && (
                        <form onSubmit={handleAddMilestone} className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-wrap gap-3 items-center">
                          <span className="text-xs font-semibold text-amber-300">Admin • Nuevo Hito:</span>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Módulo de Reportes Fiscales"
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Fecha estimada (ej. Nov 2026)"
                            value={newMilestoneDate}
                            onChange={(e) => setNewMilestoneDate(e.target.value)}
                            className="w-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Agregar Hito
                          </button>
                        </form>
                      )}

                      <div className="space-y-3">
                        {(selectedProject.milestones || []).map((m: any) => (
                          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className={`w-5 h-5 shrink-0 ${m.progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`} />
                              <div>
                                <h3 className="text-sm font-medium text-white">{m.title}</h3>
                                <span className="text-xs text-slate-400">Entrega estimada: {m.date}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isAdmin ? (
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMilestoneProgress(m.id, 0)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${m.progress === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                  >
                                    0%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMilestoneProgress(m.id, 50)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${m.progress === 50 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                                  >
                                    50%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMilestoneProgress(m.id, 100)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${m.progress === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                                  >
                                    100%
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-bold px-3 py-1 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                                  {m.progress}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'releases' && (
                    <div className="space-y-5">
                      {isAdmin && (
                        <form onSubmit={handlePublishRelease} className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                            <PackagePlus className="w-4 h-4" /> Publicar Nuevo Entregable
                          </div>
                          <div className="grid sm:grid-cols-4 gap-3">
                            <input
                              type="text"
                              required
                              placeholder="Versión (ej. v1.5.0)"
                              value={newRelease.version}
                              onChange={(e) => setNewRelease({ ...newRelease, version: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                            <select
                              value={newRelease.platform}
                              onChange={(e) => setNewRelease({ ...newRelease, platform: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            >
                              <option>Windows x64 (.exe)</option>
                              <option>Android (.apk)</option>
                              <option>Web (URL)</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Tamaño (ej. 72 MB)"
                              value={newRelease.size}
                              onChange={(e) => setNewRelease({ ...newRelease, size: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="text"
                              placeholder="URL Descarga"
                              value={newRelease.downloadUrl}
                              onChange={(e) => setNewRelease({ ...newRelease, downloadUrl: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <button type="submit" className="bg-amber-500 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg">
                            Publicar
                          </button>
                        </form>
                      )}

                      <div className="space-y-4">
                        {(selectedProject.releases || []).map((rel: any) => (
                          <div key={rel.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-white">{rel.version}</span>
                                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{rel.platform}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{rel.date} • {rel.size}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {rel.downloadUrl && rel.downloadUrl !== '#' && (
                                <a href={rel.downloadUrl} target="_blank" rel="noreferrer" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                  <Download className="w-3.5 h-3.5" /> Descargar
                                </a>
                              )}
                              {rel.approved ? (
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg">Aprobado</span>
                              ) : (
                                <button onClick={() => handleApproveRelease(rel.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">
                                  Aprobar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'licenses' && selectedProject.license && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                      <div className="flex justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-xs text-slate-400">{selectedProject.license.plan}</span>
                          <div className="text-lg font-mono font-bold text-indigo-400 mt-1">{selectedProject.license.key}</div>
                        </div>
                        <div className="text-xs bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                          Nodos: <b>{selectedProject.license.nodes?.length || 0} / {selectedProject.license.maxNodes}</b>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(selectedProject.license.nodes || []).map((node: any) => (
                          <div key={node.hwid} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Cpu className="w-4 h-4 text-indigo-400" />
                              <div>
                                <div className="text-xs font-medium text-white">{node.alias}</div>
                                <div className="text-[11px] font-mono text-slate-400">{node.hwid}</div>
                              </div>
                            </div>
                            <button onClick={() => handleRevokeNode(node.hwid)} className="text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded">
                              Liberar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="space-y-5">
                      {isAdmin && (
                        <form onSubmit={handleAddDocument} className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-center">
                          <input
                            type="text"
                            required
                            placeholder="Título del documento"
                            value={newDocData.title}
                            onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <select
                            value={newDocData.type}
                            onChange={(e) => setNewDocData({ ...newDocData, type: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          >
                            <option value="Contrato">Contrato</option>
                            <option value="NDA">NDA</option>
                            <option value="Propuesta">Propuesta</option>
                          </select>
                          <button type="submit" className="bg-amber-500 text-slate-950 text-xs px-3.5 py-1.5 rounded-lg font-semibold">
                            Subir
                          </button>
                        </form>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        {(selectedProject.documents || []).map((docItem: any) => (
                          <div key={docItem.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex justify-between items-center">
                            <div>
                              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">{docItem.type}</span>
                              <h4 className="text-sm font-semibold text-white mt-1">{docItem.title}</h4>
                            </div>
                            <a href={docItem.url} target="_blank" rel="noreferrer" className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg">Ver</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 5: MÉTODOS Y REPORTES DE PAGO (IMPLEMENTADA) */}
                  {activeTab === 'payments' && (
                    <div className="space-y-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          Métodos de pago de ejemplo
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          {(selectedProject.paymentMethods || [
                            { type: 'Transferencia de ejemplo', details: 'Datos ficticios; no realizar pagos.' }
                          ]).map((pm: any, idx: number) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                              <div className="text-xs font-semibold text-indigo-400 mb-1">{pm.type}</div>
                              <div className="text-xs font-mono text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800/80 select-all">
                                {pm.details}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <form onSubmit={handleReportPayment} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 h-fit">
                          <h3 className="text-sm font-bold text-white">Registrar un pago de ejemplo</h3>
                          <p className="text-xs text-slate-400">Este formulario es ilustrativo; no envíes datos financieros reales.</p>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Método Utilizado</label>
                            <select
                              value={paymentReport.method}
                              onChange={(e) => setPaymentReport({ ...paymentReport, method: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            >
                              <option>Transferencia de ejemplo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Nº de Referencia *</label>
                            <input
                              type="text"
                              required
                              placeholder="Referencia de ejemplo"
                              value={paymentReport.reference}
                              onChange={(e) => setPaymentReport({ ...paymentReport, reference: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Monto Pagado ($)</label>
                            <input
                              type="text"
                              placeholder="Ej. $600.00"
                              value={paymentReport.amount}
                              onChange={(e) => setPaymentReport({ ...paymentReport, amount: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-medium py-2 rounded-lg text-white">
                            Guardar reporte de ejemplo
                          </button>
                        </form>

                        <div className="md:col-span-2 space-y-3">
                          <h3 className="text-sm font-bold text-white mb-2">Historial de Pagos Reportados</h3>
                          {(!selectedProject.reportedPayments || selectedProject.reportedPayments.length === 0) ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                              No hay pagos reportados todavía.
                            </div>
                          ) : (
                            selectedProject.reportedPayments.map((pay: any) => (
                              <div key={pay.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-indigo-400">{pay.id}</span>
                                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{pay.method}</span>
                                  </div>
                                  <h4 className="text-sm font-semibold text-white mt-1">Ref: {pay.reference} • <b className="text-emerald-400">{pay.amount}</b></h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Reportado por {pay.reportedBy} el {pay.date}</p>
                                </div>

                                {isAdmin ? (
                                  <select
                                    value={pay.status}
                                    onChange={(e) => handleTogglePaymentStatus(pay.id, e.target.value)}
                                    className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-amber-500/40 text-amber-300"
                                  >
                                    <option value="En Revisión">En Revisión</option>
                                    <option value="Verificado y Aprobado">Verificado y Aprobado</option>
                                    <option value="Rechazado">Rechazado</option>
                                  </select>
                                ) : (
                                  <span className={`text-xs px-2.5 py-1 rounded border ${pay.status === 'Verificado y Aprobado' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-amber-300'}`}>
                                    {pay.status}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tickets' && (
                    <div className="grid md:grid-cols-3 gap-6">
                      <form onSubmit={handleCreateTicket} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 h-fit">
                        <h3 className="text-sm font-bold text-white">Nuevo Ticket</h3>
                        <input
                          type="text"
                          required
                          placeholder="Asunto"
                          value={newTicketTitle}
                          onChange={(e) => setNewTicketTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <button type="submit" className="w-full bg-indigo-600 text-xs py-2 rounded-lg text-white">Crear</button>
                      </form>
                      <div className="md:col-span-2 space-y-3">
                        {(selectedProject.tickets || []).map((tk: any) => (
                          <div key={tk.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-mono text-indigo-400 mr-2">{tk.id}</span>
                              <span className="text-sm font-medium text-white">{tk.title}</span>
                            </div>
                            {isAdmin ? (
                              <select
                                value={tk.status}
                                onChange={(e) => handleChangeTicketStatus(tk.id, e.target.value)}
                                className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-amber-500/40 text-amber-300"
                              >
                                <option value="Abierto">Abierto</option>
                                <option value="En Revisión">En Revisión</option>
                                <option value="Resuelto">Resuelto</option>
                              </select>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded bg-slate-950 text-amber-300">{tk.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'invoices' && (
                    <div className="space-y-4">
                      {isAdmin && (
                        <form onSubmit={handleCreateInvoice} className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-center">
                          <input
                            type="text"
                            required
                            placeholder="Concepto"
                            value={newInvoice.concept}
                            onChange={(e) => setNewInvoice({ ...newInvoice, concept: e.target.value })}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Monto ($)"
                            value={newInvoice.amount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                            className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <button type="submit" className="bg-amber-500 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-lg">Emitir</button>
                        </form>
                      )}
                      <div className="space-y-3">
                        {(selectedProject.invoices || []).map((inv: any) => (
                          <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                              <h4 className="text-sm font-medium text-white">{inv.concept}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-white">{inv.amount}</span>
                              {isAdmin ? (
                                <button onClick={() => handleToggleInvoiceStatus(inv.id)} className={`text-xs px-2.5 py-1 rounded ${inv.status === 'Pagado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  {inv.status} ↻
                                </button>
                              ) : (
                                <span className={`text-xs px-2.5 py-1 rounded ${inv.status === 'Pagado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{inv.status}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </main>

        {/* 3. PANEL DERECHO: LÍNEA DE TIEMPO */}
        <aside className="w-80 bg-slate-900/70 border-l border-slate-800 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto hidden lg:flex">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" /> Línea de Tiempo
            </h3>
            <p className="text-[11px] text-slate-400">Últimos cambios, entregas y tickets resueltos.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {selectedProject && selectedProject.timeline && selectedProject.timeline.length > 0 ? (
              selectedProject.timeline.map((item: any) => (
                <div key={item.id} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <div className="text-[10px] text-slate-500 font-mono">{item.date}</div>
                  <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50 p-4">
                No hay actividad registrada en la línea de tiempo de este proyecto aún.
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Nombre de la Empresa"
                value={newProjData.orgName}
                onChange={(e) => setNewProjData({ ...newProjData, orgName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="Nombre del Proyecto"
                value={newProjData.name}
                onChange={(e) => setNewProjData({ ...newProjData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="UID de Firebase Auth del Cliente"
                value={newProjData.clientUid}
                onChange={(e) => setNewProjData({ ...newProjData, clientUid: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 text-xs bg-slate-800 text-slate-300 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}