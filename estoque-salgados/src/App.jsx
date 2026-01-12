import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Swal from 'sweetalert2';
import { Plus, Trash2, Search, Package, ArrowUp, ArrowDown, AlertCircle, TrendingUp, DollarSign, History, Calendar, LogIn, LogOut, Loader2, Filter, X, Layers, ShoppingBag, Edit, Check, XCircle } from 'lucide-react';

// --- Configuração SweetAlert ---
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

const confirmStyle = { confirmButtonColor: '#f97316', cancelButtonColor: '#94a3b8' };

// --- Componentes UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, type="button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95",
    secondary: "bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-600",
    danger: "text-red-500 hover:bg-red-50",
    icon: "p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- Tela de Login ---
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Swal.fire({ icon: 'error', title: 'Acesso Negado', text: 'Dados incorretos.', confirmButtonColor: '#f97316' });
    else Toast.fire({ icon: 'success', title: 'Bem-vindo à Kimania!' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100 text-center">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="text-orange-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Kimania Salgados</h1>
        <p className="text-slate-500 mb-8">Login administrativo</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
          <Button className="w-full py-3" disabled={loading} type="submit">{loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Entrar</>}</Button>
        </form>
      </div>
    </div>
  );
}

// --- App Principal ---
function App() {
  const [session, setSession] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Dados
  const [items, setItems] = useState([]);
  const [kits, setKits] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // UI States
  const [newItem, setNewItem] = useState({ name: '', category: 'Fritos', quantity: 0, min_stock: 10, price: 0 });
  const [newKit, setNewKit] = useState({ name: '', price: 0, contents: [] });
  const [kitTempItem, setKitTempItem] = useState({ id: '', qty: 1 });

  // Estado para EDIÇÃO DO KIT NA VENDA
  const [editingKitSale, setEditingKitSale] = useState(null);
  const [kitSaleAddTemp, setKitSaleAddTemp] = useState({ id: '', qty: 1 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isKitSectionOpen, setIsKitSectionOpen] = useState(false);
  const [isKitFormOpen, setIsKitFormOpen] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

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

  const fetchData = async () => {
    setLoadingData(true);
    const { data: itemsData } = await supabase.from('items').select('*').order('name');
    if (itemsData) setItems(itemsData);
    const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (salesData) setSales(salesData);
    const { data: kitsData } = await supabase.from('kits').select('*').order('name');
    if (kitsData) setKits(kitsData);
    setLoadingData(false);
  };

  const calculateTotalContentsPrice = (contentsArray) => {
    return contentsArray.reduce((acc, content) => {
      const originalItem = items.find(i => i.id === content.id);
      const price = originalItem ? originalItem.price : 0;
      return acc + (price * content.qty);
    }, 0);
  };

  // --- Funções Itens ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    const { data, error } = await supabase.from('items').insert([newItem]).select();
    if (!error && data) {
      setItems([...items, data[0]]);
      setNewItem({ name: '', category: 'Fritos', quantity: 0, min_stock: 10, price: 0 });
      setIsFormOpen(false);
      Toast.fire({ icon: 'success', title: 'Produto cadastrado!' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Excluir?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim', ...confirmStyle });
    if (result.isConfirmed) {
      await supabase.from('items').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
      Swal.fire({ title: 'Excluído!', icon: 'success', ...confirmStyle });
    }
  };

  const updateQuantity = async (id, amount) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (amount < 0 && item.quantity > 0) await registerSale(item.id, item.name, item.price);
    const newQty = Math.max(0, item.quantity + amount);
    await supabase.from('items').update({ quantity: newQty }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const handleManualStockChange = async (id, value) => {
    const newQty = parseInt(value) || 0;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    await supabase.from('items').update({ quantity: newQty }).eq('id', id);
  };

  // --- Funções Kits (Criação) ---
  const addContentToKit = () => {
    if(!kitTempItem.id || kitTempItem.qty <= 0) return;
    const selectedItem = items.find(i => i.id === parseInt(kitTempItem.id));
    if (!selectedItem) return;
    
    const newContents = [...newKit.contents, { id: selectedItem.id, name: selectedItem.name, qty: parseInt(kitTempItem.qty) }];
    const newTotal = calculateTotalContentsPrice(newContents);

    setNewKit({ 
      ...newKit, 
      contents: newContents,
      price: newTotal
    });
    setKitTempItem({ id: '', qty: 1 });
  };

  const removeContentFromKit = (index) => {
    const newContents = newKit.contents.filter((_, i) => i !== index);
    const newTotal = calculateTotalContentsPrice(newContents);
    setNewKit({ ...newKit, contents: newContents, price: newTotal });
  };

  const handleSaveKit = async (e) => {
    e.preventDefault();
    if (!newKit.name || newKit.contents.length === 0) return Swal.fire({ icon: 'error', text: 'Adicione itens ao kit.' });
    const { data } = await supabase.from('kits').insert([newKit]).select();
    if (data) {
      setKits([...kits, data[0]]);
      setNewKit({ name: '', price: 0, contents: [] });
      setIsKitFormOpen(false);
      Toast.fire({ icon: 'success', title: 'Kit Criado!' });
    }
  };

  const handleDeleteKit = async (id) => {
    if (confirm('Excluir Kit?')) {
      await supabase.from('kits').delete().eq('id', id);
      setKits(kits.filter(k => k.id !== id));
    }
  };

  // --- Funções Venda ---
  const openKitSaleModal = (kit) => {
    setEditingKitSale(JSON.parse(JSON.stringify(kit)));
  };

  const updateKitSaleItemQty = (index, delta) => {
    if (!editingKitSale) return;
    const newContents = [...editingKitSale.contents];
    newContents[index].qty = Math.max(0, newContents[index].qty + delta);
    if (newContents[index].qty === 0) newContents.splice(index, 1);
    const newTotal = calculateTotalContentsPrice(newContents);
    setEditingKitSale({ ...editingKitSale, contents: newContents, price: newTotal });
  };

  const addItemToKitSale = () => {
    if (!kitSaleAddTemp.id || kitSaleAddTemp.qty <= 0) return;
    const selected = items.find(i => i.id === parseInt(kitSaleAddTemp.id));
    if (!selected) return;

    const existingIndex = editingKitSale.contents.findIndex(c => c.id === selected.id);
    let newContents = [...editingKitSale.contents];
    
    if (existingIndex >= 0) {
      newContents[existingIndex].qty += parseInt(kitSaleAddTemp.qty);
    } else {
      newContents.push({ id: selected.id, name: selected.name, qty: parseInt(kitSaleAddTemp.qty) });
    }
    const newTotal = calculateTotalContentsPrice(newContents);
    setEditingKitSale({ ...editingKitSale, contents: newContents, price: newTotal });
    setKitSaleAddTemp({ id: '', qty: 1 });
  };

  const handleConfirmKitSale = async () => {
    if (!editingKitSale) return;
    let missingItem = '';
    let canSell = true;

    for (const component of editingKitSale.contents) {
      const stockItem = items.find(i => i.id === component.id);
      if (!stockItem || stockItem.quantity < component.qty) {
        canSell = false;
        missingItem = component.name;
        break;
      }
    }

    if (!canSell) return Swal.fire({ icon: 'error', title: 'Estoque Insuficiente', text: `Faltam: ${missingItem}` });

    const updatedItems = [...items];
    const updatePromises = editingKitSale.contents.map(async (component) => {
      const idx = updatedItems.findIndex(i => i.id === component.id);
      if (idx > -1) {
        const newQty = updatedItems[idx].quantity - component.qty;
        updatedItems[idx] = { ...updatedItems[idx], quantity: newQty };
        return supabase.from('items').update({ quantity: newQty }).eq('id', component.id);
      }
    });

    await Promise.all(updatePromises);
    setItems(updatedItems);
    await registerSale(null, `KIT: ${editingKitSale.name} (Venda)`, editingKitSale.price);
    setEditingKitSale(null);
    Toast.fire({ icon: 'success', title: 'Venda realizada!' });
  };

  const registerSale = async (itemId, itemName, price) => {
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
    const sale = { item_id: itemId, item_name: itemName, price: price, date: localDate };
    const { data } = await supabase.from('sales').insert([sale]).select();
    if (data) setSales(prev => [data[0], ...prev]);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setItems([]); setSales([]); };

  if (loadingInit) return <div className="h-screen flex items-center justify-center text-orange-500"><Loader2 className="animate-spin" size={40}/></div>;
  if (!session) return <LoginScreen />;

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSales = sales.filter(sale => {
    if (!sale.date) return false;
    const sDate = sale.date.split('T')[0];
    const start = dateStart || '0000-00-00';
    const end = dateEnd || '9999-12-31';
    return sDate >= start && sDate <= end;
  });

  const now = new Date();
  const localToday = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const todaysSales = sales.filter(sale => sale.date && sale.date.startsWith(localToday));
  const dailyRevenue = todaysSales.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 relative">
      
      {/* MODAL DE EDIÇÃO DE VENDA DE KIT */}
      {editingKitSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><Edit size={20}/> Personalizar Venda</h3>
              <button onClick={() => setEditingKitSale(null)} className="hover:bg-purple-700 p-1 rounded"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome da Venda</label>
                <input className="w-full text-lg font-bold text-slate-800 border-b border-slate-200 outline-none focus:border-purple-500 bg-transparent"
                  value={editingKitSale.name} onChange={e => setEditingKitSale({...editingKitSale, name: e.target.value})} />
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase">Conteúdo do Combo:</p>
                {editingKitSale.contents.map((item, index) => {
                  const stockItem = items.find(i => i.id === item.id);
                  const stockQty = stockItem ? stockItem.quantity : 0;
                  const hasStock = stockQty >= item.qty;

                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${hasStock ? 'border-slate-100 bg-slate-50' : 'border-red-200 bg-red-50'}`}>
                      <div>
                        <p className="font-bold text-slate-700">{item.name}</p>
                        <p className={`text-xs ${hasStock ? 'text-slate-400' : 'text-red-500 font-bold'}`}>
                           Estoque: {stockQty} {hasStock ? '' : '(Insuficiente)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateKitSaleItemQty(index, -1)} className="w-8 h-8 rounded bg-slate-200 hover:bg-red-100 hover:text-red-500 font-bold">-</button>
                        <span className="w-8 text-center font-bold">{item.qty}</span>
                        <button onClick={() => updateKitSaleItemQty(index, 1)} className="w-8 h-8 rounded bg-slate-200 hover:bg-emerald-100 hover:text-emerald-600 font-bold">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-6">
                <p className="text-xs font-bold text-purple-700 mb-2">Adicionar / Trocar Item:</p>
                {/* --- RESPONSIVIDADE CORRIGIDA AQUI --- */}
                <div className="flex flex-col sm:flex-row gap-2">
                   <select className="w-full sm:flex-1 p-2 text-sm rounded border border-purple-200 outline-none" 
                     value={kitSaleAddTemp.id} onChange={e => setKitSaleAddTemp({...kitSaleAddTemp, id: e.target.value})}>
                     <option value="">Selecione...</option>
                     {items.map(i => <option key={i.id} value={i.id}>{i.name} ({formatMoney(i.price)})</option>)}
                   </select>
                   <div className="flex gap-2">
                      <input type="number" min="1" className="w-full sm:w-20 p-2 text-sm rounded border border-purple-200" 
                        value={kitSaleAddTemp.qty} onChange={e => setKitSaleAddTemp({...kitSaleAddTemp, qty: e.target.value})} />
                      <button onClick={addItemToKitSale} className="bg-purple-600 text-white px-3 rounded hover:bg-purple-700 w-full sm:w-auto font-bold">+</button>
                   </div>
                </div>
                {/* ------------------------------------- */}
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Valor Final Automático (R$)</label>
                 <div className="flex items-center gap-2">
                   <DollarSign className="text-emerald-500" />
                   <input type="number" step="0.01" className="w-full text-2xl font-bold text-emerald-600 border-b border-slate-200 outline-none focus:border-emerald-500 bg-transparent"
                     value={editingKitSale.price} onChange={e => setEditingKitSale({...editingKitSale, price: parseFloat(e.target.value)})} />
                 </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
               <Button variant="outline" onClick={() => setEditingKitSale(null)} className="flex-1">Cancelar</Button>
               <Button variant="success" onClick={handleConfirmKitSale} className="flex-[2]">
                 <Check size={20}/> Confirmar e Vender
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg"><Package className="text-orange-600" size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Kimania<span className="text-orange-500">Salgados</span></h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className={`text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 ${showHistory ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
              {showHistory ? <><ArrowUp className="rotate-180" size={16}/> Voltar</> : <><History size={16}/> Relatórios</>}
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {loadingData && <div className="text-center text-xs text-orange-500 animate-pulse">Sincronizando dados...</div>}

        {showHistory ? (
           <div className="animate-in fade-in duration-300 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-3 flex flex-col md:flex-row gap-4 items-center bg-white">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-xs w-full md:w-auto"><Filter size={14}/> Filtrar:</div>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  <span className="text-slate-300">à</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  {(dateStart || dateEnd) && <button onClick={() => {setDateStart(''); setDateEnd('')}} className="text-xs text-red-500 flex items-center gap-1"><X size={12}/> Limpar</button>}
                </Card>
                <Card className="bg-emerald-50 border-emerald-100 flex flex-col justify-center">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Total</span>
                  <span className="text-2xl font-bold text-emerald-700">{formatMoney(filteredSales.reduce((acc, curr) => acc + (curr.price || 0), 0))}</span>
                </Card>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Data</th><th className="p-4">Produto</th><th className="p-4 text-right">Valor</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}><td className="p-4 text-sm text-slate-500">{new Date(sale.date).toLocaleString('pt-BR')}</td><td className="p-4 font-medium">{sale.item_name}</td><td className="p-4 text-right text-emerald-600">+{formatMoney(sale.price)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
                <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2"><DollarSign size={14}/> Faturamento Hoje</p>
                <h2 className="text-3xl font-bold mt-2 text-emerald-600">{formatMoney(dailyRevenue)}</h2>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                 <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2"><Calendar size={14}/> Vendas Hoje</p>
                 <h2 className="text-3xl font-bold mt-2">{todaysSales.length}</h2>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar salgado..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={() => setIsKitSectionOpen(!isKitSectionOpen)} className="flex-1 sm:flex-none"><Layers size={20} /> Meus Kits</Button>
                <Button onClick={() => setIsFormOpen(!isFormOpen)} className="flex-1 sm:flex-none"><Plus size={20} /> Novo Item</Button>
              </div>
            </div>

            {/* SEÇÃO KITS */}
            {isKitSectionOpen && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4 border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-2xl p-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2"><Layers/> Kits e Combos</h3>
                    <Button variant="secondary" onClick={() => setIsKitFormOpen(!isKitFormOpen)} className="text-xs h-8">Criar Novo Kit</Button>
                 </div>

                 {isKitFormOpen && (
                   <Card className="bg-white border-purple-100 shadow-md">
                     <h4 className="font-bold text-slate-700 mb-4">Montar Novo Kit (Receita Padrão)</h4>
                     <form onSubmit={handleSaveKit} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Nome</label><input required className="w-full p-2 rounded border" value={newKit.name} onChange={e => setNewKit({...newKit, name: e.target.value})} placeholder="Ex: Combo Família" /></div>
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Preço (Auto)</label><input required type="number" className="w-full p-2 rounded border bg-slate-100" value={newKit.price} onChange={e => setNewKit({...newKit, price: parseFloat(e.target.value)})} /></div>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                         {/* --- RESPONSIVIDADE CORRIGIDA AQUI --- */}
                         <div className="flex flex-col sm:flex-row gap-2">
                           <select className="w-full sm:flex-1 p-2 rounded border" value={kitTempItem.id} onChange={e => setKitTempItem({...kitTempItem, id: e.target.value})}>
                             <option value="">Selecione salgado...</option>{items.map(i => <option key={i.id} value={i.id}>{i.name} ({formatMoney(i.price)})</option>)}
                           </select>
                           <div className="flex gap-2">
                              <input type="number" min="1" className="w-full sm:w-20 p-2 rounded border" value={kitTempItem.qty} onChange={e => setKitTempItem({...kitTempItem, qty: e.target.value})} />
                              <button type="button" onClick={addContentToKit} className="bg-slate-200 px-3 rounded font-bold w-full sm:w-auto">+</button>
                           </div>
                         </div>
                         {/* ------------------------------------- */}
                         <ul className="mt-3 space-y-1">
                           {newKit.contents.map((c, idx) => (<li key={idx} className="text-sm bg-white p-2 rounded border flex justify-between"><span>{c.qty}x {c.name}</span><button type="button" onClick={() => removeContentFromKit(idx)} className="text-red-500 text-xs">Remover</button></li>))}
                         </ul>
                       </div>
                       <Button variant="secondary" type="submit" className="w-full">Salvar Receita do Kit</Button>
                     </form>
                   </Card>
                 )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {kits.map(kit => (
                     <Card key={kit.id} className="border-l-4 border-l-purple-500 relative group hover:shadow-lg transition">
                        <button onClick={() => handleDeleteKit(kit.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                        <h4 className="font-bold text-slate-800">{kit.name}</h4>
                        <p className="text-purple-600 font-bold text-lg mb-2">{formatMoney(kit.price)}</p>
                        <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                          {kit.contents.map((c, idx) => <span key={idx} className="block">• {c.qty}x {c.name}</span>)}
                        </div>
                        <Button onClick={() => openKitSaleModal(kit)} variant="secondary" className="w-full text-sm">
                          <ShoppingBag size={16}/> Vender / Editar
                        </Button>
                     </Card>
                   ))}
                   {kits.length === 0 && <p className="text-center text-slate-400 col-span-full py-4">Nenhum kit criado ainda.</p>}
                 </div>
              </div>
            )}

            {isFormOpen && (
              <Card className="bg-orange-50/50 border-orange-100 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-orange-900 mb-4">Novo Salgado Individual</h3>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Nome</label><input required className="w-full p-2 rounded border" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Categoria</label><select className="w-full p-2 rounded border" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}><option>Fritos</option><option>Assados</option><option>Doces</option><option>Bebidas</option></select></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Preço</label><input type="number" className="w-full p-2 rounded border" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Mínimo</label><input type="number" className="w-full p-2 rounded border" value={newItem.min_stock} onChange={e => setNewItem({...newItem, min_stock: parseInt(e.target.value)})} /></div>
                  <div className="md:col-span-5 flex justify-end gap-2 mt-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
                </form>
              </Card>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Produto</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Estoque</th><th className="p-4 text-right">Preço</th><th className="p-4"></th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4"><p className="font-bold text-slate-700">{item.name}</p><span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{item.category}</span></td>
                        <td className="p-4 text-center">{item.quantity <= item.min_stock ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex justify-center items-center gap-1"><AlertCircle size={12}/> Baixo</span> : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">OK</span>}</td>
                        <td className="p-4 flex justify-center items-center gap-2"><button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><ArrowDown size={16}/></button><input type="number" value={item.quantity} onChange={(e) => handleManualStockChange(item.id, e.target.value)} className="w-14 text-center font-mono font-bold bg-transparent border-b border-transparent focus:border-orange-500 outline-none"/><button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition"><ArrowUp size={16}/></button></td>
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