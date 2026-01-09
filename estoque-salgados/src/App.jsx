import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Swal from 'sweetalert2'; // Importando o SweetAlert
import { Plus, Trash2, Search, Package, ArrowUp, ArrowDown, AlertCircle, TrendingUp, DollarSign, History, Calendar, LogIn, LogOut, Loader2, Filter, X } from 'lucide-react';

// --- Configuração Padrão do SweetAlert (Tema Laranja) ---
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

const confirmStyle = {
  confirmButtonColor: '#f97316', // Laranja
  cancelButtonColor: '#94a3b8', // Cinza
};

// --- Componentes UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-600",
    danger: "text-red-500 hover:bg-red-50",
    icon: "p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- Componente de Login ---
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Acesso Negado',
        text: 'E-mail ou senha incorretos.',
        confirmButtonColor: '#f97316'
      });
    } else {
      Toast.fire({
        icon: 'success',
        title: 'Login realizado com sucesso!'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100 text-center">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="text-orange-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">KimaniaSalgados</h1>
        <p className="text-slate-500 mb-8">Entre para gerenciar seu estoque</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
            <input type="email" required className="w-full mt-1 p-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
              placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="text-left">
             <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
             <input type="password" required className="w-full mt-1 p-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button className="w-full py-3" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Entrar no Sistema</>}
          </Button>
        </form>
      </div>
    </div>
  );
}

// --- Aplicação Principal ---
function App() {
  const [session, setSession] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Estados de Dados
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados de UI e Filtros
  const [newItem, setNewItem] = useState({ name: '', category: 'Fritos', quantity: 0, min_stock: 10, price: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // NOVOS ESTADOS PARA FILTRO DE DATA
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // 1. Inicialização
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingInit(false);
      if (session) fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Buscar Dados
  const fetchData = async () => {
    setLoadingData(true);
    const { data: itemsData } = await supabase.from('items').select('*').order('name');
    if (itemsData) setItems(itemsData);

    const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (salesData) setSales(salesData);
    setLoadingData(false);
  };

  // 3. Adicionar Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const itemPayload = {
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      min_stock: newItem.min_stock,
      price: newItem.price
    };

    const { data, error } = await supabase.from('items').insert([itemPayload]).select();
    
    if (!error && data) {
      setItems([...items, data[0]]);
      setNewItem({ name: '', category: 'Fritos', quantity: 0, min_stock: 10, price: 0 });
      setIsFormOpen(false);
      Toast.fire({ icon: 'success', title: 'Produto cadastrado!' });
    } else {
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar o item.' });
    }
  };

  // 4. Deletar Item
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter isso!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      ...confirmStyle
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.from('items').delete().eq('id', id);
        setItems(items.filter(item => item.id !== id));
        Swal.fire({
          title: 'Excluído!',
          text: 'O item foi removido.',
          icon: 'success',
          ...confirmStyle
        });
      }
    });
  };

  // 5. Atualizar Quantidade
  const updateQuantity = async (id, amount) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (amount < 0 && item.quantity > 0) {
      await registerSale(item);
    }

    const newQty = Math.max(0, item.quantity + amount);
    await supabase.from('items').update({ quantity: newQty }).eq('id', id);
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const handleManualStockChange = async (id, value) => {
    const newQty = parseInt(value);
    const finalQty = isNaN(newQty) ? 0 : Math.max(0, newQty);
    setItems(items.map(i => i.id === id ? { ...i, quantity: finalQty } : i));
    await supabase.from('items').update({ quantity: finalQty }).eq('id', id);
  };

// 7. Registrar Venda 
  const registerSale = async (item) => {
    // Pega a data/hora atual
    const now = new Date();
    
    // Ajusta o fuso horário para o local do seu sistema (OS)
    // Subtrai a diferença de fuso para que o ISOString fique igual ao relógio do PC
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();

    const sale = {
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      date: localDate
    };

    const { data } = await supabase.from('sales').insert([sale]).select();
    if (data) setSales(prev => [data[0], ...prev]);
  };

  const handleLogout = async () => {
    Swal.fire({
      title: 'Sair do sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sair',
      cancelButtonText: 'Ficar',
      ...confirmStyle
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        setItems([]);
        setSales([]);
      }
    });
  };

  // --- Renderização ---
  if (loadingInit) return <div className="h-screen flex items-center justify-center text-orange-500"><Loader2 className="animate-spin" size={40}/></div>;
  if (!session) return <LoginScreen />;

  // Cálculos do Dashboard Principal (Hoje)
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const lowStockCount = items.filter(i => i.quantity <= i.min_stock).length;
  // Ajuste para pegar a data "Hoje" local corretamente
  const now = new Date();
  const localToday = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  const todaysSales = sales.filter(sale => sale.date && sale.date.startsWith(localToday));
  const dailyRevenue = todaysSales.reduce((acc, curr) => acc + (curr.price || 0), 0);

  // Lógica de Filtro para o Relatório
  const filteredSales = sales.filter(sale => {
    if (!sale.date) return false;
    const saleDate = sale.date.split('T')[0];
    const start = dateStart || '0000-00-00';
    const end = dateEnd || '9999-12-31';
    return saleDate >= start && saleDate <= end;
  });

  // Total do período filtrado
  const filteredRevenue = filteredSales.reduce((acc, curr) => acc + (curr.price || 0), 0);

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg"><Package className="text-orange-600" size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Kimania<span className="text-orange-500">Salgados</span></h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${showHistory ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 hover:bg-slate-200'}`}>
              {showHistory ? <><ArrowUp className="rotate-180" size={16}/> Voltar</> : <><History size={16}/> Relatórios</>}
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {loadingData && <div className="text-center text-xs text-orange-500 animate-pulse">Sincronizando dados...</div>}

        {/* Se estiver no modo Relatório, mostra filtros. Se não, mostra Dashboard de Hoje */}
        {showHistory ? (
           /* MODO RELATÓRIO */
           <div className="animate-in fade-in duration-300 space-y-6">
              
              {/* Barra de Filtros e Totalizador */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-3 flex flex-col md:flex-row gap-4 items-center bg-white">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-xs w-full md:w-auto">
                    <Filter size={14}/> Filtrar por Data:
                  </div>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} 
                    className="p-2 border border-slate-200 rounded-lg text-sm w-full md:w-auto focus:border-orange-500 outline-none" />
                  <span className="text-slate-300 hidden md:inline">à</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} 
                    className="p-2 border border-slate-200 rounded-lg text-sm w-full md:w-auto focus:border-orange-500 outline-none" />
                  
                  {(dateStart || dateEnd) && (
                    <button onClick={() => {setDateStart(''); setDateEnd('')}} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                      <X size={12}/> Limpar
                    </button>
                  )}
                </Card>

                <Card className="bg-emerald-50 border-emerald-100 flex flex-col justify-center">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Total no Período</span>
                  <span className="text-2xl font-bold text-emerald-700">{formatMoney(filteredRevenue)}</span>
                  <span className="text-xs text-emerald-600/70">{filteredSales.length} vendas</span>
                </Card>
              </div>

              {/* Tabela de Vendas */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="p-4">Data</th><th className="p-4">Produto</th><th className="p-4 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.length === 0 ? (
                      <tr><td colSpan="3" className="p-8 text-center text-slate-400">Nenhuma venda encontrada neste período.</td></tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="p-4 text-sm text-slate-500">
                            {new Date(sale.date).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 font-medium">{sale.item_name}</td>
                          <td className="p-4 text-right text-emerald-600 font-medium">+{formatMoney(sale.price)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        ) : (
          /* MODO ESTOQUE (PADRÃO) */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
                <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2"><DollarSign size={14}/> Faturamento Hoje</p>
                <h2 className="text-3xl font-bold mt-2 text-emerald-600">{formatMoney(dailyRevenue)}</h2>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                 <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2"><Calendar size={14}/> Vendas Hoje</p>
                 <h2 className="text-3xl font-bold mt-2">{todaysSales.length} <span className="text-sm font-normal text-slate-400">unidades</span></h2>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                 <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2"><AlertCircle size={14}/> Repor Estoque</p>
                 <h2 className="text-3xl font-bold mt-2 text-red-500">{lowStockCount} <span className="text-sm font-normal text-slate-400">itens</span></h2>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-orange-500 outline-none"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full sm:w-auto"><Plus size={20} /> Novo</Button>
            </div>

            {isFormOpen && (
              <Card className="bg-orange-50/50 border-orange-100 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-orange-900 mb-4">Novo Produto</h3>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                    <input required className="w-full p-2 rounded border border-slate-200" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                    <select className="w-full p-2 rounded border border-slate-200" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                      <option>Fritos</option><option>Assados</option><option>Doces</option><option>Bebidas</option>
                    </select>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Preço</label><input type="number" step="0.01" className="w-full p-2 rounded border" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Mínimo</label><input type="number" className="w-full p-2 rounded border" value={newItem.min_stock} onChange={e => setNewItem({...newItem, min_stock: parseInt(e.target.value)})} /></div>
                  <div className="md:col-span-5 flex justify-end gap-2 mt-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
                </form>
              </Card>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="p-4">Produto</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Estoque</th><th className="p-4 text-right">Preço</th><th className="p-4"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4"><p className="font-bold text-slate-700">{item.name}</p><span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{item.category}</span></td>
                        <td className="p-4 text-center">
                          {item.quantity <= item.min_stock ? 
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex justify-center items-center gap-1"><AlertCircle size={12}/> Baixo</span> : 
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">OK</span>}
                        </td>
                        <td className="p-4 flex justify-center items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><ArrowDown size={16}/></button>
                          <input type="number" value={item.quantity} onChange={(e) => handleManualStockChange(item.id, e.target.value)} className="w-14 text-center font-mono font-bold bg-transparent border-b border-transparent focus:border-orange-500 outline-none"/>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition"><ArrowUp size={16}/></button>
                        </td>
                        <td className="p-4 text-right font-medium">{formatMoney(item.price)}</td>
                        <td className="p-4"><button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;