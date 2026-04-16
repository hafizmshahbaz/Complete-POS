import React, { useState, useEffect } from 'react';

function App() {
    // 1. UI STATES
    const [activeTab, setActiveTab] = useState("Dashboard"); 
    const[isSidebarOpen, setSidebarOpen] = useState(true); 
    
    // 2. DATA STATES
    const[products, setProducts] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reports, setReports] = useState(null);
    const [settings, setSettings] = useState({ business_name: "Teknivos POS", phone: "03001234567", email: "info@tekniivos.com", currency_symbol: "Rs.", tax_rate: 0, low_stock_alert_level: 5, receipt_message: "Thank you!" });

    // 3. MODAL STATES
    const [productModal, setProductModal] = useState({ open: false, isEdit: false, id: null });
    const [customerModal, setCustomerModal] = useState({ open: false, isEdit: false, id: null });
    const [orderDetails, setOrderDetails] = useState(null); 
    const [ledgerCustomer, setLedgerCustomer] = useState(null); 
    
    // 4. SEARCH & FILTER STATES
    const [posCategory, setPosCategory] = useState("All");
    const [posSearch, setPosSearch] = useState("");
    const[prodSearch, setProdSearch] = useState("");
    const [custSearch, setCustSearch] = useState("");

    // 5. FORM STATES
    const [formData, setFormData] = useState({ name: "", sku: "", category: "", cost_price: "", selling_price: "", stock_level: "", low_stock_alert: "5" });
    const [customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "" });

    // 6. POS STATES
    const [cart, setCart] = useState([]);
    const[discountType, setDiscountType] = useState("none"); 
    const [discountValue, setDiscountValue] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState("");

    // --- FETCH FUNCTIONS ---
    const loadProducts = () => fetch('http://192.168.100.15:8000/products').then(res => res.json()).then(setProducts);
    const loadDashboard = () => fetch('http://192.168.100.15:8000/dashboard').then(res => res.json()).then(setDashboardStats);
    const loadCustomers = () => fetch('http://192.168.100.15:8000/customers').then(res => res.json()).then(setCustomers);
    const loadOrders = () => fetch('http://192.168.100.15:8000/orders').then(res => res.json()).then(setOrders);
    const loadReports = () => fetch('http://192.168.100.15:8000/reports').then(res => res.json()).then(setReports);
    const loadSettings = () => fetch('http://192.168.100.15:8000/settings').then(res => res.json()).then(setSettings);

    useEffect(() => {
        loadSettings();
        if (activeTab === "Products" || activeTab === "POS/Billing" || activeTab === "Dashboard") loadProducts();
        if (activeTab === "Dashboard") loadDashboard();
        if (activeTab === "Customers" || activeTab === "POS/Billing") loadCustomers();
        if (activeTab === "Orders") loadOrders();
        if (activeTab === "Reports") loadReports();
    },[activeTab]);

    // --- CRUD FUNCTIONS ---
    const saveProduct = (e) => {
        e.preventDefault();
        const method = productModal.isEdit ? 'PUT' : 'POST';
        const url = productModal.isEdit ? `http://192.168.100.15:8000/products/${productModal.id}` : 'http://192.168.100.15:8000/products';
        fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        .then(() => { loadProducts(); setProductModal({ open: false }); });
    };
    const openEditProduct = (p) => { setFormData(p); setProductModal({ open: true, isEdit: true, id: p.id }); };
    const deleteProduct = (id) => { if (window.confirm("Delete this product?")) fetch(`http://192.168.100.15:8000/products/${id}`, { method: 'DELETE' }).then(loadProducts); };

    const saveCustomer = (e) => {
        e.preventDefault();
        const method = customerModal.isEdit ? 'PUT' : 'POST';
        const url = customerModal.isEdit ? `http://192.168.100.15:8000/customers/${customerModal.id}` : 'http://192.168.100.15:8000/customers';
        fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerForm) })
        .then(() => { loadCustomers(); setCustomerModal({ open: false }); });
    };
    const openEditCustomer = (c) => { setCustomerForm(c); setCustomerModal({ open: true, isEdit: true, id: c.id }); };

    const saveSettings = () => {
        fetch('http://192.168.100.15:8000/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
        .then(() => alert("Settings Saved Successfully!"));
    };

    // --- POS FUNCTIONS ---
    const addToCart = (product) => {
        if (product.stock_level <= 0) return alert("Out of stock!");
        const existing = cart.find(i => i.product_id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_level) return alert("Stock limit reached!");
            setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else { setCart([...cart, { product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, max: product.stock_level }]); }
    };
    const updateQty = (id, delta) => {
        setCart(cart.map(i => {
            if(i.product_id === id) {
                const newQ = i.quantity + delta;
                if(newQ > 0 && newQ <= i.max) return {...i, quantity: newQ};
            }
            return i;
        }));
    };
    const removeFromCart = (id) => setCart(cart.filter(i => i.product_id !== id));
    const clearCart = () => { if(window.confirm("Clear cart?")) { setCart([]); setDiscountValue(0); setDiscountType('none'); setSelectedCustomer(""); } };

    // Calculations
    const subtotal = cart.reduce((t, i) => t + (i.price * i.quantity), 0);
    let discountAmt = 0;
    if(discountType === 'fixed') discountAmt = Number(discountValue);
    if(discountType === 'percent') discountAmt = subtotal * (Number(discountValue) / 100);
    const finalTotal = subtotal - discountAmt;

    const handleCheckout = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        const payload = { cart_items: cart, discount: discountAmt, customer_id: selectedCustomer ? parseInt(selectedCustomer) : null };
        fetch('http://192.168.100.15:8000/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(() => { alert("Bill Created!"); setCart([]); setDiscountValue(0); setDiscountType('none'); loadProducts(); });
    };

    // Filters & Categories
    const categories =["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    const filteredPOS = products.filter(p => (posCategory === "All" || p.category === posCategory) && p.name.toLowerCase().includes(posSearch.toLowerCase()));
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.includes(prodSearch));
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch));

    // ==========================================
    // BEAUTIFUL VIP STYLES
    // ==========================================
    const styles = {
        appContainer: { display: 'flex', height: '100vh', backgroundColor: '#f4f6f9', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
        sidebar: { width: isSidebarOpen ? '260px' : '0px', backgroundColor: '#0B132B', color: '#8A94A6', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0 },
        logoArea: { padding: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1C253C', minWidth: '260px' },
        menuList: { padding: '15px 10px', flex: 1, overflowY: 'auto', minWidth: '240px' },
        menuItem: (isActive) => ({ padding: '12px 15px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '15px', fontWeight: isActive ? 'bold' : 'normal', backgroundColor: isActive ? '#1D4ED8' : 'transparent', color: isActive ? 'white' : '#8A94A6', transition: 'all 0.2s' }),
        mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        topHeader: { backgroundColor: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' },
        contentArea: { padding: '30px', overflowY: 'auto', flex: 1 },
        card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
        td: { padding: '15px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
        input: { padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', width: '100%', boxSizing: 'border-box' },
        btnPrimary: { backgroundColor: '#1D4ED8', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
        btnAction: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', margin: '0 5px', color: '#6B7280' },
        qtyBtn: { border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modalBox: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }
    };

    const tabs =[
        { name: "Dashboard", icon: "📊" }, { name: "POS/Billing", icon: "🛒" }, { name: "Products", icon: "📦" }, 
        { name: "Customers", icon: "👥" }, { name: "Orders", icon: "📜" }, { name: "Reports", icon: "📈" }, { name: "Settings", icon: "⚙️" }
    ];

    return (
        <div style={styles.appContainer}>
            
            {/* --- SIDEBAR --- */}
            <div style={styles.sidebar}>
                <div style={styles.logoArea}>
                    <div style={{ backgroundColor: '#1D4ED8', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🛒</div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Teknivos POS</h3>
                        <span style={{ fontSize: '11px', color: '#8A94A6' }}>Powered by {settings.business_name}</span>
                    </div>
                </div>
                <div style={styles.menuList}>
                    {tabs.map(tab => (
                        <div key={tab.name} onClick={() => setActiveTab(tab.name)} style={styles.menuItem(activeTab === tab.name)}>
                            <span>{tab.icon}</span> {tab.name}
                        </div>
                    ))}
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid #1C253C', minWidth: '260px' }}>
                    <p style={{ margin: 0, color: 'white', fontSize: '14px' }}>Administrator</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>Admin</p>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div style={styles.mainContent}>
                
                {/* Header */}
                <div style={styles.topHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#374151' }}>☰</button>
                        <div>
                            <h2 style={{ margin: 0, color: '#111827' }}>{activeTab}</h2>
                            <p style={{ margin: '5px 0 0 0', color: '#6B7280', fontSize: '14px' }}>{new Date().toDateString()}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#6B7280' }}>
                        <strong>Powered by Teknivos</strong><br/>
                        Custom POS & Business Software
                    </div>
                </div>

                {/* Dynamic Views */}
                <div style={styles.contentArea}>

                    {/* ==================== DASHBOARD ==================== */}
                    {activeTab === "Dashboard" && dashboardStats && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TODAY SALES</p><h2 style={{ margin: 0 }}>{settings.currency_symbol}{dashboardStats.today_sales.toFixed(2)}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL ORDERS</p><h2 style={{ margin: 0 }}>{dashboardStats.total_orders}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>PRODUCTS</p><h2 style={{ margin: 0 }}>{dashboardStats.total_products}</h2><p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#EF4444' }}>{dashboardStats.low_stock_products} low stock</p></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>CUSTOMERS</p><h2 style={{ margin: 0 }}>{customers.length || 0}</h2></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div style={{...styles.card, minHeight: '250px'}}>
                                    <h4 style={{margin: '0 0 15px 0'}}>Recent Orders</h4>
                                    {dashboardStats.recent_orders.length === 0 ? <p style={{color: '#9CA3AF', textAlign: 'center', marginTop: '50px'}}>No orders yet today</p> : 
                                    <table style={styles.table}>
                                        <thead><tr><th style={styles.th}>Order #</th><th style={styles.th}>Customer</th><th style={styles.th}>Total</th><th style={styles.th}>Time</th></tr></thead>
                                        <tbody>{dashboardStats.recent_orders.map(o => (
                                            <tr key={o.id}><td style={{...styles.td, color:'#1D4ED8', fontWeight:'bold'}}>#{o.id}</td><td style={styles.td}>{o.customer}</td><td style={styles.td}>{settings.currency_symbol}{o.total}</td><td style={styles.td}>{new Date(o.time).toLocaleTimeString()}</td></tr>
                                        ))}</tbody>
                                    </table>}
                                </div>
                                <div style={{...styles.card, minHeight: '250px', borderTop: '4px solid #F59E0B'}}>
                                    <h4 style={{margin: '0 0 15px 0', color: '#D97706'}}>⚠️ Low Stock Alert</h4>
                                    {products.filter(p => p.stock_level <= p.low_stock_alert).length === 0 ? <p style={{color: '#9CA3AF', textAlign: 'center', marginTop: '50px'}}>All products well-stocked</p> : 
                                    products.filter(p => p.stock_level <= p.low_stock_alert).map(p => <div key={p.id} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '10px 0'}}><span>{p.name}</span><span style={{color: '#EF4444', fontWeight: 'bold'}}>{p.stock_level} left</span></div>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== POS / BILLING ==================== */}
                    {activeTab === "POS/Billing" && (
                        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                            {/* Left Side: Products & Categories */}
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                                <input type="text" placeholder="🔍 Search by name, SKU or barcode..." value={posSearch} onChange={e=>setPosSearch(e.target.value)} style={{...styles.input, marginBottom: '15px', padding: '15px'}} />
                                
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '5px' }}>
                                    {categories.map(cat => (
                                        <button key={cat} onClick={() => setPosCategory(cat)} style={{
                                            padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                                            border: posCategory === cat ? 'none' : '1px solid #d1d5db',
                                            backgroundColor: posCategory === cat ? '#1D4ED8' : 'white',
                                            color: posCategory === cat ? 'white' : '#374151'
                                        }}>{cat}</button>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto', alignContent: 'start', paddingBottom:'20px' }}>
                                    {filteredPOS.length === 0 ? <p style={{color: '#9CA3AF'}}>No products found</p> : filteredPOS.map(p => (
                                        <div key={p.id} onClick={() => addToCart(p)} style={{ ...styles.card, cursor: 'pointer', textAlign: 'center', padding: '20px 15px', transition: 'transform 0.2s' }}>
                                            <div style={{fontSize: '30px', marginBottom: '10px'}}>📦</div>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{p.name}</h4>
                                            <p style={{ margin: '0', color: '#1D4ED8', fontWeight: 'bold' }}>{settings.currency_symbol}{p.selling_price}</p>
                                            <span style={{ fontSize: '11px', color: p.stock_level > 0 ? '#10B981' : '#EF4444', backgroundColor: p.stock_level > 0 ? '#D1FAE5' : '#FEE2E2', padding: '2px 8px', borderRadius: '10px', marginTop: '10px', display: 'inline-block' }}>
                                                {p.stock_level > 0 ? `Stock: ${p.stock_level}` : 'Out of Stock'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Cart */}
                            <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🛒 Cart</h3>
                                    {cart.length > 0 && <button onClick={clearCart} style={{color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Clear All</button>}
                                </div>
                                
                                <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                                    <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} style={{...styles.input, marginBottom: '20px'}}>
                                        <option value="">👤 Walk-in Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>

                                    {cart.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '50px' }}>
                                            <span style={{fontSize: '40px'}}>🛒</span><p>Add products to start</p>
                                        </div>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{margin: '0', fontWeight: 'bold', color: '#374151', fontSize:'14px'}}>{item.name}</p>
                                                    <span style={{fontSize: '12px', color: '#6B7280'}}>{settings.currency_symbol}{item.price} each</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button onClick={() => updateQty(item.product_id, -1)} style={styles.qtyBtn}>-</button>
                                                    <span style={{width: '20px', textAlign: 'center', fontWeight: 'bold'}}>{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.product_id, 1)} style={styles.qtyBtn}>+</button>
                                                </div>
                                                <div style={{ marginLeft: '15px', textAlign: 'right', minWidth: '60px' }}>
                                                    <strong style={{color: '#111827'}}>{settings.currency_symbol}{(item.price * item.quantity).toFixed(2)}</strong>
                                                    <div onClick={() => removeFromCart(item.product_id)} style={{color: '#EF4444', fontSize: '11px', cursor: 'pointer', marginTop:'2px'}}>Remove</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderRadius: '0 0 12px 12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                        <span style={{color: '#6B7280', fontWeight: 'bold'}}>Discount:</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <select value={discountType} onChange={(e)=>setDiscountType(e.target.value)} style={{...styles.input, width: '100px', padding: '8px'}}>
                                                <option value="none">No Disc</option>
                                                <option value="fixed">Fixed ({settings.currency_symbol})</option>
                                                <option value="percent">Percent (%)</option>
                                            </select>
                                            {discountType !== 'none' && <input type="number" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} style={{...styles.input, width: '80px', padding: '8px'}} />}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
                                        <span>Total:</span>
                                        <span>{settings.currency_symbol}{finalTotal.toFixed(2)}</span>
                                    </div>
                                    <button onClick={handleCheckout} style={{...styles.btnPrimary, backgroundColor: '#10B981', width: '100%', padding: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center'}}>
                                        Pay & Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== PRODUCTS ==================== */}
                    {activeTab === "Products" && (
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <input type="text" placeholder="🔍 Search name, SKU..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} style={{...styles.input, width: '300px'}} />
                                <button onClick={() => {setFormData({name:"",sku:"",category:"",cost_price:"",selling_price:"",stock_level:"",low_stock_alert:"5"}); setProductModal({open:true, isEdit:false})}} style={styles.btnPrimary}>+ Add Product</button>
                            </div>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>SKU</th><th style={styles.th}>Category</th><th style={styles.th}>Price</th><th style={styles.th}>Stock</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{p.name}</td>
                                        <td style={styles.td}>{p.sku}</td><td style={styles.td}>{p.category}</td>
                                        <td style={{...styles.td, color: '#1D4ED8', fontWeight: 'bold'}}>{settings.currency_symbol}{p.selling_price}</td>
                                        <td style={{...styles.td, color: p.stock_level <= p.low_stock_alert ? '#EF4444' : '#10B981', fontWeight: 'bold'}}>{p.stock_level}</td>
                                        <td style={styles.td}>
                                            <button onClick={()=>openEditProduct(p)} style={{...styles.btnAction, color: '#3B82F6'}}>✏️ Edit</button>
                                            <button onClick={()=>deleteProduct(p.id)} style={{...styles.btnAction, color: '#EF4444'}}>🗑️ Delete</button>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}

                    {/* ==================== CUSTOMERS ==================== */}
                    {activeTab === "Customers" && (
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <input type="text" placeholder="🔍 Search name, phone..." value={custSearch} onChange={e=>setCustSearch(e.target.value)} style={{...styles.input, width: '300px'}} />
                                <button onClick={() => {setCustomerForm({name:"",phone:"",email:""}); setCustomerModal({open:true, isEdit:false})}} style={styles.btnPrimary}>+ Add Customer</button>
                            </div>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>Email</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{filteredCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{c.name}</td>
                                        <td style={styles.td}>{c.phone}</td><td style={styles.td}>{c.email || 'N/A'}</td>
                                        <td style={styles.td}>
                                            <button onClick={()=>setLedgerCustomer(c)} style={{...styles.btnAction, color: '#10B981'}}>📘 Ledger</button>
                                            <button onClick={()=>openEditCustomer(c)} style={{...styles.btnAction, color: '#3B82F6'}}>✏️ Edit</button>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}

                    {/* ==================== ORDERS ==================== */}
                    {activeTab === "Orders" && (
                        <div style={styles.card}>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Order #</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Customer</th><th style={styles.th}>Total</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{orders.map(o => (
                                    <tr key={o.id}>
                                        <td style={{...styles.td, fontWeight: 'bold', color: '#1D4ED8'}}>#{o.id}</td>
                                        <td style={styles.td}>{new Date(o.date).toLocaleString()}</td>
                                        <td style={styles.td}>{o.customer_name}</td>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{settings.currency_symbol}{o.total.toFixed(2)}</td>
                                        <td style={styles.td}><span style={{ backgroundColor: '#D1FAE5', color: '#10B981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{o.status}</span></td>
                                        <td style={styles.td}><button onClick={()=>setOrderDetails(o)} style={{...styles.btnPrimary, padding: '6px 12px', fontSize: '12px'}}>👁️ Receipt</button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}

                    {/* ==================== REPORTS ==================== */}
                    {activeTab === "Reports" && reports && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL REVENUE</p><h2 style={{ margin: 0, color: '#1D4ED8' }}>{settings.currency_symbol}{reports.total_revenue.toFixed(2)}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL ORDERS</p><h2 style={{ margin: 0 }}>{reports.total_orders}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>AVG ORDER VALUE</p><h2 style={{ margin: 0, color: '#8B5CF6' }}>{reports.total_orders > 0 ? `${settings.currency_symbol}${(reports.total_revenue / reports.total_orders).toFixed(2)}` : `${settings.currency_symbol}0`}</h2></div>
                            </div>
                            <div style={styles.card}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>Daily Breakdown</h3>
                                <table style={styles.table}>
                                    <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Orders</th><th style={styles.th}>Revenue</th></tr></thead>
                                    <tbody>{reports.daily.map(d => (
                                        <tr key={d.date}><td style={styles.td}>{d.date}</td><td style={styles.td}>{d.orders}</td><td style={{...styles.td, color: '#1D4ED8', fontWeight: 'bold'}}>{settings.currency_symbol}{d.revenue}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ==================== SETTINGS ==================== */}
                    {activeTab === "Settings" && (
                        <div>
                            <div style={{...styles.card, marginBottom: '20px'}}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#1D4ED8' }}>🏢 Business Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Business Name</label><input value={settings.business_name} onChange={e=>setSettings({...settings, business_name:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Phone</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Email</label><input value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Currency Symbol</label><input value={settings.currency_symbol} onChange={e=>setSettings({...settings, currency_symbol:e.target.value})} style={styles.input}/></div>
                                </div>
                            </div>
                            <div style={styles.card}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#1D4ED8' }}>⚙️ POS Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Tax Rate (%)</label><input type="number" value={settings.tax_rate} onChange={e=>setSettings({...settings, tax_rate:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Low Stock Alert Level</label><input type="number" value={settings.low_stock_alert_level} onChange={e=>setSettings({...settings, low_stock_alert_level:e.target.value})} style={styles.input}/></div>
                                    <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px'}}>Receipt Footer Message</label><input value={settings.receipt_message} onChange={e=>setSettings({...settings, receipt_message:e.target.value})} style={styles.input}/></div>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '20px' }}><button onClick={saveSettings} style={styles.btnPrimary}>💾 Save Settings</button></div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ========================================== */}
            {/* VIP MODALS (POPUPS)                        */}
            {/* ========================================== */}

            {/* PRODUCT EDIT/ADD MODAL */}
            {productModal.open && (
                <div style={styles.modalOverlay}><div style={styles.modalBox}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>{productModal.isEdit ? '✏️ Edit Product' : '📦 Add Product'}</h3>
                        <button onClick={()=>setProductModal({open:false})} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280'}}>✖</button>
                    </div>
                    <form onSubmit={saveProduct} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Product Name *</label><input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required style={styles.input}/></div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>SKU *</label><input value={formData.sku} onChange={e=>setFormData({...formData, sku:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Category</label><input value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} style={styles.input}/></div>
                        </div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Purchase Price *</label><input type="number" step="0.01" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Sale Price *</label><input type="number" step="0.01" value={formData.selling_price} onChange={e=>setFormData({...formData, selling_price:e.target.value})} required style={styles.input}/></div>
                        </div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Stock Quantity</label><input type="number" value={formData.stock_level} onChange={e=>setFormData({...formData, stock_level:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Low Stock Alert</label><input type="number" value={formData.low_stock_alert} onChange={e=>setFormData({...formData, low_stock_alert:e.target.value})} required style={styles.input}/></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setProductModal({open:false})} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
                            <button type="submit" style={styles.btnPrimary}>{productModal.isEdit ? 'Update Product' : 'Create Product'}</button>
                        </div>
                    </form>
                </div></div>
            )}

            {/* CUSTOMER EDIT/ADD MODAL */}
            {customerModal.open && (
                <div style={styles.modalOverlay}><div style={styles.modalBox}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>{customerModal.isEdit ? '✏️ Edit Customer' : '👥 Add Customer'}</h3>
                        <button onClick={()=>setCustomerModal({open:false})} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280'}}>✖</button>
                    </div>
                    <form onSubmit={saveCustomer} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Full Name *</label><input value={customerForm.name} onChange={e=>setCustomerForm({...customerForm, name:e.target.value})} required style={styles.input}/></div>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Phone Number *</label><input value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm, phone:e.target.value})} required style={styles.input}/></div>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Email Address</label><input value={customerForm.email} onChange={e=>setCustomerForm({...customerForm, email:e.target.value})} style={styles.input}/></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setCustomerModal({open:false})} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
                            <button type="submit" style={styles.btnPrimary}>{customerModal.isEdit ? 'Update Customer' : 'Add Customer'}</button>
                        </div>
                    </form>
                </div></div>
            )}

            {/* ORDER HISTORY / RECEIPT MODAL */}
            {orderDetails && (
                <div style={styles.modalOverlay}><div style={{...styles.modalBox, width: '600px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>Order #{orderDetails.id}</h3>
                        <button onClick={()=>setOrderDetails(null)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280'}}>✖</button>
                    </div>
                    
                    <div style={{display:'flex', gap: '15px', marginBottom: '20px'}}>
                        <div style={{flex: 1, backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
                            <span style={{fontSize: '12px', color: '#6B7280'}}>Date</span><br/>
                            <strong>{new Date(orderDetails.date).toLocaleDateString()}</strong>
                        </div>
                        <div style={{flex: 1, backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
                            <span style={{fontSize: '12px', color: '#6B7280'}}>Customer</span><br/>
                            <strong>{orderDetails.customer_name}</strong>
                        </div>
                        <div style={{flex: 1, backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
                            <span style={{fontSize: '12px', color: '#6B7280'}}>Total</span><br/>
                            <strong style={{color: '#1D4ED8'}}>{settings.currency_symbol}{orderDetails.total}</strong>
                        </div>
                    </div>

                    <h4 style={{margin: '0 0 10px 0'}}>Items</h4>
                    <div style={{backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr>
                                    <th style={{...styles.th, borderBottom: '1px solid #d1d5db', padding: '10px 0'}}>Product</th>
                                    <th style={{...styles.th, borderBottom: '1px solid #d1d5db', padding: '10px 0', textAlign: 'center'}}>Qty</th>
                                    <th style={{...styles.th, borderBottom: '1px solid #d1d5db', padding: '10px 0', textAlign: 'right'}}>Total</th>
                                </tr>
                            </thead>
                            <tbody>{orderDetails.items.map((i, idx) => (
                                <tr key={idx}>
                                    <td style={{padding: '10px 0', borderBottom: '1px solid #e5e7eb'}}>{i.name}</td>
                                    <td style={{padding: '10px 0', borderBottom: '1px solid #e5e7eb', textAlign: 'center'}}>{i.qty}</td>
                                    <td style={{padding: '10px 0', borderBottom: '1px solid #e5e7eb', textAlign: 'right'}}>{settings.currency_symbol}{(i.price * i.qty).toFixed(2)}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                        
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
                            <div style={{width: '250px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6B7280'}}><span>Subtotal</span><span>{settings.currency_symbol}{orderDetails.subtotal}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#EF4444'}}><span>Discount</span><span>-{settings.currency_symbol}{orderDetails.discount}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1d5db', paddingTop: '10px', fontWeight: 'bold', fontSize: '18px'}}><span>Total</span><span style={{color: '#1D4ED8'}}>{settings.currency_symbol}{orderDetails.total}</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setOrderDetails(null)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f3f4f6' }}>Close</button>
                        <button onClick={() => window.print()} style={styles.btnPrimary}>🖨️ Print Receipt</button>
                    </div>
                </div></div>
            )}

            {/* CUSTOMER LEDGER MODAL */}
            {ledgerCustomer && (
                <div style={styles.modalOverlay}><div style={{...styles.modalBox, width:'700px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>📘 {ledgerCustomer.name} - Ledger</h3>
                        <button onClick={()=>setLedgerCustomer(null)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280'}}>✖</button>
                    </div>
                    
                    <div style={{display:'flex', gap: '15px', marginBottom: '20px'}}>
                        <div style={{flex: 1, backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe'}}>
                            <span style={{fontSize: '12px', color: '#3b82f6'}}>Contact Details</span><br/>
                            <span style={{fontSize: '14px'}}>📞 {ledgerCustomer.phone}</span><br/>
                            <span style={{fontSize: '14px'}}>✉️ {ledgerCustomer.email || 'N/A'}</span>
                        </div>
                        <div style={{flex: 1, backgroundColor: '#d1fae5', padding: '15px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center'}}>
                            <span style={{fontSize: '12px', color: '#059669'}}>Total Orders</span><br/>
                            <strong style={{fontSize: '24px', color: '#047857'}}>{orders.filter(o => o.customer_name === ledgerCustomer.name).length}</strong>
                        </div>
                    </div>

                    <h4 style={{margin: '0 0 10px 0'}}>Order History</h4>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Order ID</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Total Amount</th></tr></thead>
                        <tbody>{orders.filter(o => o.customer_name === ledgerCustomer.name).map(o => (
                            <tr key={o.id}><td style={{...styles.td, color: '#1D4ED8', fontWeight: 'bold'}}>#{o.id}</td><td style={styles.td}>{new Date(o.date).toLocaleString()}</td><td style={{...styles.td, color:'#10B981', fontWeight: 'bold'}}>{settings.currency_symbol}{o.total}</td></tr>
                        ))}
                        {orders.filter(o => o.customer_name === ledgerCustomer.name).length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'30px', color: '#9CA3AF'}}>No orders found for this customer.</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}

        </div>
    );
}

export default App;