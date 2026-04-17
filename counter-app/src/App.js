import React, { useState, useEffect } from 'react';
const API_URL = `http://${window.location.hostname}:8000`;

// --- CUSTOM SVG LINE CHART COMPONENT ---
const SimpleLineChart = ({ data }) => {
    if (!data || data.length === 0) return <p style={{color:'gray', textAlign:'center', marginTop:'50px'}}>No data available</p>;
    const maxVal = Math.max(...data.map(d => d.revenue), 100);
    const chartHeight = 200; const chartWidth = 600;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((d.revenue / maxVal) * chartHeight);
        return `${x},${y}`;
    }).join(" ");

    return (
        <div style={{ width: '100%', overflowX: 'auto', paddingTop:'20px' }}>
            <svg width="100%" height="250" viewBox={`-20 -20 ${chartWidth + 40} ${chartHeight + 60}`} preserveAspectRatio="none">
                {[0, 0.5, 1].map(ratio => (
                    <g key={ratio}>
                        <line x1="0" y1={chartHeight * ratio} x2={chartWidth} y2={chartHeight * ratio} stroke="#e5e7eb" strokeDasharray="4" />
                        <text x="-10" y={(chartHeight * ratio) + 5} fontSize="10" fill="#6B7280" textAnchor="end">{Math.round(maxVal * (1 - ratio))}</text>
                    </g>
                ))}
                <polyline fill="none" stroke="#2563EB" strokeWidth="3" points={points} />
                <polygon fill="rgba(37, 99, 235, 0.1)" points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`} />
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * chartWidth;
                    const y = chartHeight - ((d.revenue / maxVal) * chartHeight);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#2563EB" />
                            <text x={x} y={chartHeight + 20} fontSize="10" fill="#6B7280" textAnchor="middle">{d.date}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

function App() {
    // ==========================================
    // STATES
    // ==========================================
    const[activeTab, setActiveTab] = useState(() => localStorage.getItem("activeTab") || "Dashboard"); 
    const[isSidebarOpen, setSidebarOpen] = useState(true); 
    const [cart, setCart] = useState(() => { const s = localStorage.getItem("posCart"); return s ? JSON.parse(s) :[]; });
    
    useEffect(() => { localStorage.setItem("activeTab", activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem("posCart", JSON.stringify(cart)); }, [cart]);

    const[products, setProducts] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reports, setReports] = useState(null);
    const [settings, setSettings] = useState({ business_name: "", phone: "", email: "", address: "", currency_symbol: "Rs.", tax_rate: 0, low_stock_alert_level: 5, receipt_message: "Thank you for your business!", logo: "" });

    // Modals
    const[productModal, setProductModal] = useState({ open: false, isEdit: false, id: null });
    const[customerModal, setCustomerModal] = useState({ open: false, isEdit: false, id: null });
    const[orderDetails, setOrderDetails] = useState(null); 
    const [checkoutReceipt, setCheckoutReceipt] = useState(null); 
    const [checkoutModal, setCheckoutModal] = useState(false); 
    
    // Filters & Forms
    const [posCategory, setPosCategory] = useState("All");
    const [posSearch, setPosSearch] = useState("");
    const [prodSearch, setProdSearch] = useState("");
    const [custSearch, setCustSearch] = useState("");
    const [orderDateFilter, setOrderDateFilter] = useState("");

    const[formData, setFormData] = useState({ name: "", sku: "", category: "", cost_price: "", selling_price: "", stock_level: "", low_stock_alert: "5" });
    const[customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "" });

    // Checkout Details
    const [discountType, setDiscountType] = useState("none"); 
    const[discountValue, setDiscountValue] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const[paymentMethod, setPaymentMethod] = useState("Cash");
    const [amountReceived, setAmountReceived] = useState("");

    // --- FETCH FUNCTIONS ---
    const loadProducts = () => fetch(`${API_URL}/products`).then(res => res.json()).then(setProducts).catch(console.error);
    const loadDashboard = () => fetch(`${API_URL}/dashboard`).then(res => res.json()).then(setDashboardStats).catch(console.error);
    const loadCustomers = () => fetch(`${API_URL}/customers`).then(res => res.json()).then(setCustomers).catch(console.error);
    const loadOrders = () => fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders).catch(console.error);
    const loadReports = () => fetch(`${API_URL}/reports`).then(res => res.json()).then(setReports).catch(console.error);
    const loadSettings = () => fetch(`${API_URL}/settings`).then(res => res.json()).then(setSettings).catch(console.error);

    useEffect(() => {
        loadSettings();
        if (activeTab === "Products" || activeTab === "POS/Billing" || activeTab === "Dashboard") loadProducts();
        if (activeTab === "Dashboard") loadDashboard();
        if (activeTab === "Customers" || activeTab === "POS/Billing") loadCustomers();
        if (activeTab === "Orders") loadOrders();
        if (activeTab === "Reports") loadReports();
    }, [activeTab]);

    // ==========================================
    // CRUD FUNCTIONS (Fix Applied Here!)
    // ==========================================
    const saveProduct = (e) => {
        e.preventDefault();
        const method = productModal.isEdit ? 'PUT' : 'POST';
        const url = productModal.isEdit ? `${API_URL}/products/${productModal.id}` : `${API_URL}/products`;
        fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        .then(() => { loadProducts(); setProductModal({ open: false }); }).catch(() => alert("Network Error"));
    };
    
    // YEH FUNCTION MISSING THA (Ab Theek Hai)
    const openEditProduct = (p) => { 
        setFormData({ name: p.name, sku: p.sku, category: p.category, cost_price: p.cost_price, selling_price: p.selling_price, stock_level: p.stock_level, low_stock_alert: p.low_stock_alert }); 
        setProductModal({ open: true, isEdit: true, id: p.id }); 
    };

    const deleteProduct = (id) => { 
        if (window.confirm("Are you sure you want to delete this product?")) {
            fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }).then(async (res) => {
                if (!res.ok) { const err = await res.json(); alert("⚠️ ERROR: " + err.detail); } 
                else { loadProducts(); }
            }).catch(() => alert("Network Error"));
        }
    };

    const saveCustomer = (e) => {
        e.preventDefault();
        const method = customerModal.isEdit ? 'PUT' : 'POST';
        const url = customerModal.isEdit ? `${API_URL}/customers/${customerModal.id}` : `${API_URL}/customers`;
        fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerForm) })
        .then(() => { loadCustomers(); setCustomerModal({ open: false }); }).catch(() => alert("Network Error"));
    };

    // YEH FUNCTION MISSING THA (Ab Theek Hai)
    const openEditCustomer = (c) => { 
        setCustomerForm({ name: c.name, phone: c.phone, email: c.email || "" }); 
        setCustomerModal({ open: true, isEdit: true, id: c.id }); 
    };

    const saveSettings = () => {
        fetch(`${API_URL}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
        .then(() => alert("Settings Saved!"))
        .catch(() => alert("Network Error"));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setSettings({ ...settings, logo: reader.result }); reader.readAsDataURL(file); }
    };

    // ==========================================
    // POS FUNCTIONS
    // ==========================================
    const addToCart = (product) => {
        if (product.stock_level <= 0) return alert("Out of stock!");
        const existing = cart.find(i => i.product_id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_level) return alert("Stock limit reached!");
            setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else setCart([...cart, { product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, max: product.stock_level }]);
    };
    const updateQty = (id, delta) => { setCart(cart.map(i => { if(i.product_id === id) { const n = i.quantity + delta; if(n > 0 && n <= i.max) return {...i, quantity: n}; } return i; })); };
    const removeFromCart = (id) => setCart(cart.filter(i => i.product_id !== id));
    const clearCart = () => { if(window.confirm("Clear cart?")) { setCart([]); setDiscountValue(0); setDiscountType('none'); setSelectedCustomer(""); } };

    const subtotal = cart.reduce((t, i) => t + (i.price * i.quantity), 0);
    let discountAmt = discountType === 'fixed' ? Number(discountValue) : (discountType === 'percent' ? subtotal * (Number(discountValue) / 100) : 0);
    const finalTotal = subtotal - discountAmt;

    const processPayment = () => {
        if (cart.length === 0) return;
        const payload = { cart_items: cart, discount: discountAmt, customer_id: selectedCustomer ? parseInt(selectedCustomer) : null, payment_method: paymentMethod, paid_amount: amountReceived || finalTotal };
        
        fetch(`${API_URL}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(res => res.json()).then(data => { 
            const cust = customers.find(c => c.id === parseInt(selectedCustomer));
            setCheckoutReceipt({
                order_id: data.order_id, date: new Date(), items: [...cart], subtotal, discount: discountAmt, total: finalTotal, payment_method: paymentMethod, customer_name: cust ? cust.name : "Walk-in Customer"
            }); 
            setCart([]); setDiscountValue(0); setDiscountType('none'); setSelectedCustomer(""); setAmountReceived(""); setCheckoutModal(false); loadProducts(); 
        });
    };

    // Filters
    const categories =["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    const filteredPOS = products.filter(p => (posCategory === "All" || p.category === posCategory) && p.name.toLowerCase().includes(posSearch.toLowerCase()));
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.includes(prodSearch));
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch));
    const filteredOrders = orderDateFilter ? orders.filter(o => o.date.startsWith(orderDateFilter)) : orders;

    // --- STYLES ---
    const styles = {
        appContainer: { display: 'flex', height: '100vh', backgroundColor: '#f4f6f9', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
        sidebar: { width: isSidebarOpen ? '260px' : '0px', backgroundColor: '#0B132B', color: '#8A94A6', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0 },
        menuItem: (isActive) => ({ padding: '12px 15px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '15px', fontWeight: isActive ? 'bold' : 'normal', backgroundColor: isActive ? '#1D4ED8' : 'transparent', color: isActive ? 'white' : '#8A94A6' }),
        card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' },
        td: { padding: '15px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
        input: { padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', width: '100%', boxSizing: 'border-box' },
        btnPrimary: { backgroundColor: '#1D4ED8', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modalBox: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
        payBtn: (active) => ({ flex: 1, padding: '15px', borderRadius: '8px', border: active ? '2px solid #1D4ED8' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : 'white', color: active ? '#1D4ED8' : '#374151', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' })
    };

    const tabs =[{ n: "Dashboard", i: "" }, { n: "POS/Billing", i: "" }, { n: "Products", i: "" }, { n: "Customers", i: "" }, { n: "Orders", i: "" }, { n: "Reports", i: "" }, { n: "Settings", i: "" }];

    // Receipt Data Helper
    const receiptDataToPrint = checkoutReceipt || orderDetails;

    return (
        <div style={styles.appContainer}>
            
            {/*PERFECT THERMAL PRINT CSS */}
            <style>{`
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { margin: 0; padding: 0; background-color: white; }
                    body * { visibility: hidden; }
                    #printable-slip, #printable-slip * { visibility: visible; }
                    #printable-slip { position: absolute; left: 0; top: 0; width: 76mm; margin: 0 auto; padding: 4mm; color: black; font-family: 'Courier New', Courier, monospace; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* --- SIDEBAR --- */}
            <div style={styles.sidebar} className="no-print">
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1C253C', minWidth: '260px' }}>
                    <img src="/image.png" alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'contain' }} />
                    <div><h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>TEKNIVOS</h3><span style={{ fontSize: '11px', color: '#f3f3f3' }}>Business Software</span></div>
                </div>
                <div style={{ padding: '15px 10px', flex: 1, overflowY: 'auto', minWidth: '240px' }}>
                    {tabs.map(tab => <div key={tab.n} onClick={() => setActiveTab(tab.n)} style={styles.menuItem(activeTab === tab.n)}><span>{tab.i}</span> {tab.n}</div>)}
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid #1C253C', minWidth: '260px' }}><p style={{ margin: 0, color: 'white', fontSize: '14px' }}>Administrator</p></div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="no-print">
                
                <div style={{ backgroundColor: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>☰</button>
                        <div><h2 style={{ margin: 0, color: '#111827' }}>{activeTab}</h2></div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#6B7280' }}><strong>Powered by TEKNIVOS</strong></div>
                </div>

                <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>

                    {/* === DASHBOARD === */}
                    {activeTab === "Dashboard" && dashboardStats && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TODAY SALES</p><h2 style={{ margin: 0 }}>{settings.currency_symbol}{dashboardStats.today_sales.toFixed(2)}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL ORDERS</p><h2 style={{ margin: 0 }}>{dashboardStats.total_orders}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>PRODUCTS</p><h2 style={{ margin: 0 }}>{dashboardStats.total_products}</h2><p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#EF4444' }}>{dashboardStats.low_stock_products} low stock</p></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>CUSTOMERS</p><h2 style={{ margin: 0 }}>{customers.length || 0}</h2></div>
                            </div>
                            
                            <div style={{...styles.card, marginBottom: '20px'}}>
                                <h3>7-Day Sales Trend</h3>
                                <SimpleLineChart data={dashboardStats.chart_data} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div style={{...styles.card}}>
                                    <h4 style={{margin: '0 0 15px 0'}}>Recent Orders</h4>
                                    {dashboardStats.recent_orders.length === 0 ? <p style={{color: 'gray'}}>No orders yet</p> : 
                                    <table style={styles.table}>
                                        <thead><tr><th style={styles.th}>Order #</th><th style={styles.th}>Customer</th><th style={styles.th}>Total</th></tr></thead>
                                        <tbody>{dashboardStats.recent_orders.map(o => <tr key={o.id}><td style={{...styles.td, color:'#1D4ED8', fontWeight:'bold'}}>#{o.id}</td><td style={styles.td}>{o.customer}</td><td style={styles.td}>{settings.currency_symbol}{o.total}</td></tr>)}</tbody>
                                    </table>}
                                </div>
                                <div style={{...styles.card, borderTop: '4px solid #F59E0B'}}>
                                    <h4 style={{margin: '0 0 15px 0', color: '#D97706'}}>Low Stock</h4>
                                    {products.filter(p => p.stock_level <= p.low_stock_alert).map(p => <div key={p.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom:'1px solid #eee'}}><span>{p.name}</span><span style={{color: '#EF4444', fontWeight: 'bold'}}>{p.stock_level}</span></div>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === POS / BILLING === */}
                    {activeTab === "POS/Billing" && (
                        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                                <input type="text" placeholder="Search product..." value={posSearch} onChange={e=>setPosSearch(e.target.value)} style={{...styles.input, marginBottom: '15px'}} />
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                                    {categories.map(cat => <button key={cat} onClick={() => setPosCategory(cat)} style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', border: posCategory === cat ? 'none' : '1px solid #d1d5db', backgroundColor: posCategory === cat ? '#1D4ED8' : 'white', color: posCategory === cat ? 'white' : '#374151' }}>{cat}</button>)}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto', paddingBottom:'20px' }}>
                                    {filteredPOS.map(p => (
                                        <div key={p.id} onClick={() => addToCart(p)} style={{ ...styles.card, cursor: 'pointer', textAlign: 'center', padding: '20px 15px' }}>
                                            <div style={{fontSize: '30px', marginBottom: '10px'}}></div><h4 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{p.name}</h4><p style={{ margin: '0', color: '#1D4ED8', fontWeight: 'bold' }}>{settings.currency_symbol}{p.selling_price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ADVANCED CART UI */}
                            <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color:'#1D4ED8' }}>Cart <span style={{backgroundColor:'#1D4ED8', color:'white', borderRadius:'10px', padding:'2px 8px', fontSize:'12px', marginLeft:'5px'}}>{cart.length}</span></h3>
                                    {cart.length > 0 && <button onClick={clearCart} style={{color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer'}}>Clear</button>}
                                </div>
                                
                                <div style={{ padding: '15px', flex: 1, overflowY: 'auto', backgroundColor:'#f9fafb' }}>
                                    <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} style={{...styles.input, marginBottom: '15px'}}>
                                        <option value="">Walk-in Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {cart.map(item => (
                                        <div key={item.product_id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom:'10px' }}>
                                                <strong style={{color: '#374151'}}>{item.name}</strong>
                                                <button onClick={() => removeFromCart(item.product_id)} style={{color: '#D1D5DB', border: 'none', background: 'none', cursor: 'pointer'}}>✖</button>
                                            </div>
                                            <div style={{color: '#9CA3AF', fontSize:'12px', marginBottom:'10px'}}>{settings.currency_symbol}{item.price} each</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', border:'1px solid #e5e7eb', borderRadius:'6px', overflow:'hidden' }}>
                                                    <button onClick={() => updateQty(item.product_id, -1)} style={{padding:'5px 10px', border:'none', background:'#f9fafb', cursor:'pointer'}}>-</button>
                                                    <span style={{width: '30px', textAlign: 'center', fontWeight: 'bold'}}>{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.product_id, 1)} style={{padding:'5px 10px', border:'none', background:'#f9fafb', cursor:'pointer'}}>+</button>
                                                </div>
                                                <strong style={{color: '#111827'}}>{settings.currency_symbol}{(item.price * item.quantity).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <select value={discountType} onChange={(e)=>setDiscountType(e.target.value)} style={{...styles.input, width: '120px', padding: '8px'}}>
                                            <option value="none">No Discount</option><option value="fixed">Fixed ({settings.currency_symbol})</option><option value="percent">Percent (%)</option>
                                        </select>
                                        {discountType !== 'none' && <input type="number" placeholder="Value" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} style={{...styles.input, width: '80px', padding: '8px'}} />}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', marginBottom:'10px' }}><span>Subtotal</span><span>{settings.currency_symbol}{subtotal.toFixed(2)}</span></div>
                                    {discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444', marginBottom:'10px' }}><span>Discount</span><span>-{settings.currency_symbol}{discountAmt.toFixed(2)}</span></div>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1D4ED8' }}><span>Total</span><span>{settings.currency_symbol}{finalTotal.toFixed(2)}</span></div>
                                    <button onClick={() => {if(cart.length===0) return alert("Cart empty!"); setCheckoutModal(true);}} style={{...styles.btnPrimary, width: '100%', padding: '15px', fontSize: '16px'}}>Pay & Checkout</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === PRODUCTS === */}
                    {activeTab === "Products" && (
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <input type="text" placeholder="Search product..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} style={{...styles.input, width: '300px'}} />
                                <button onClick={() => {setFormData({name:"",sku:"",category:"",cost_price:"",selling_price:"",stock_level:"",low_stock_alert:"5"}); setProductModal({open:true, isEdit:false})}} style={styles.btnPrimary}>+ Add Product</button>
                            </div>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Category</th><th style={styles.th}>Cost</th><th style={styles.th}>Price</th><th style={styles.th}>Stock</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{p.name} <br/><small style={{color:'gray', fontWeight:'normal'}}>{p.sku}</small></td>
                                        <td style={styles.td}>{p.category}</td><td style={styles.td}>{settings.currency_symbol}{p.cost_price}</td><td style={{...styles.td, color: '#1D4ED8', fontWeight: 'bold'}}>{settings.currency_symbol}{p.selling_price}</td><td style={{...styles.td, color: p.stock_level <= p.low_stock_alert ? '#EF4444' : '#10B981', fontWeight: 'bold'}}>{p.stock_level}</td>
                                        <td style={styles.td}><button onClick={()=>openEditProduct(p)} style={styles.btnAction}>Edit</button><button onClick={()=>deleteProduct(p.id)} style={{...styles.btnAction, color:'red'}}>Delete</button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}

                    {/* === CUSTOMERS === */}
                    {activeTab === "Customers" && (
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <input type="text" placeholder="Search name, phone..." value={custSearch} onChange={e=>setCustSearch(e.target.value)} style={{...styles.input, width: '300px'}} />
                                <button onClick={() => {setCustomerForm({name:"",phone:"",email:""}); setCustomerModal({open:true, isEdit:false})}} style={styles.btnPrimary}>+ Add Customer</button>
                            </div>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>Email</th><th style={styles.th}>Orders</th><th style={styles.th}>Balance</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{filteredCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{c.name}</td><td style={styles.td}>{c.phone}</td><td style={styles.td}>{c.email || 'N/A'}</td>
                                        <td style={{...styles.td, fontWeight:'bold'}}>{c.orders_count}</td>
                                        <td style={{...styles.td, color: c.balance > 0 ? 'red' : 'green', fontWeight:'bold'}}>{settings.currency_symbol}{c.balance}</td>
                                        <td style={styles.td}><button onClick={()=>openEditCustomer(c)} style={styles.btnAction}>Edit</button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                            <div style={{textAlign:'right', padding:'10px', color:'gray', fontSize:'12px'}}>{filteredCustomers.length} customers total</div>
                        </div>
                    )}

                    {/* === ORDERS === */}
                    {activeTab === "Orders" && (
                        <div style={styles.card}>
                            <div style={{marginBottom:'20px'}}>
                                <input type="date" value={orderDateFilter} onChange={e => setOrderDateFilter(e.target.value)} style={{...styles.input, width:'200px'}} />
                                {orderDateFilter && <button onClick={()=>setOrderDateFilter("")} style={{marginLeft:'10px', ...styles.btnAction}}>Clear Filter</button>}
                            </div>
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Order #</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Customer</th><th style={styles.th}>Method</th><th style={styles.th}>Total</th><th style={styles.th}>Actions</th></tr></thead>
                                <tbody>{filteredOrders.map(o => (
                                    <tr key={o.id}>
                                        <td style={{...styles.td, fontWeight: 'bold', color: '#1D4ED8'}}>#{o.id}</td><td style={styles.td}>{new Date(o.date).toLocaleString()}</td><td style={styles.td}>{o.customer_name}</td>
                                        <td style={styles.td}>{o.payment_method}</td>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{settings.currency_symbol}{o.total.toFixed(2)}</td>
                                        <td style={styles.td}><button onClick={()=>setOrderDetails(o)} style={{...styles.btnPrimary, padding: '6px 12px', fontSize: '12px'}}>Receipt</button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}

                    {/* === REPORTS === */}
                    {activeTab === "Reports" && reports && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL REVENUE</p><h2 style={{ margin: 0, color: '#1D4ED8' }}>{settings.currency_symbol}{reports.total_revenue.toFixed(2)}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>NET PROFIT</p><h2 style={{ margin: 0, color: '#10B981' }}>{settings.currency_symbol}{reports.total_profit.toFixed(2)}</h2></div>
                                <div style={styles.card}><p style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TOTAL ORDERS</p><h2 style={{ margin: 0 }}>{reports.total_orders}</h2></div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div style={styles.card}>
                                    <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>Daily Breakdown</h3>
                                    <table style={styles.table}>
                                        <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Orders</th><th style={styles.th}>Revenue</th><th style={styles.th}>Profit</th></tr></thead>
                                        <tbody>{reports.daily.map(d => (
                                            <tr key={d.date}><td style={styles.td}>{d.date}</td><td style={styles.td}>{d.orders}</td><td style={{...styles.td, color: '#1D4ED8', fontWeight: 'bold'}}>{settings.currency_symbol}{d.revenue.toFixed(2)}</td><td style={{...styles.td, color: '#10B981'}}>{settings.currency_symbol}{d.profit.toFixed(2)}</td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                                <div style={{...styles.card, borderTop: '4px solid #8B5CF6'}}>
                                    <h4 style={{margin: '0 0 15px 0', color: '#6D28D9'}}>Top Selling Products</h4>
                                    {reports.top_products.map((p, idx) => (
                                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom:'1px solid #eee'}}><span>{p.name}</span><span style={{fontWeight: 'bold', color:'#6D28D9'}}>{p.qty} Sold</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === SETTINGS === */}
                    {activeTab === "Settings" && (
                        <div>
                            <div style={{...styles.card, marginBottom: '20px'}}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#1D4ED8' }}>Business Information (For Slip/Receipt)</h3>
                                <div style={{ marginBottom: '20px', padding: '15px', border: '1px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    {settings.logo ? <img src={settings.logo} alt="Logo" style={{maxWidth: '100px', maxHeight: '100px', borderRadius: '8px'}}/> : <div style={{width: '80px', height: '80px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px'}}></div>}
                                    <div>
                                        <label style={{fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Upload Receipt Logo</label>
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '12px' }} />
                                        <small style={{display:'block', color:'gray', marginTop:'5px'}}>Note: Top-left App Logo will always be TEKNIVOS.</small>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Business Name</label><input value={settings.business_name} onChange={e=>setSettings({...settings, business_name:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Phone</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Email</label><input value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Address (Prints on Slip)</label><input placeholder="Shop 1, Main Market..." value={settings.address} onChange={e=>setSettings({...settings, address:e.target.value})} style={styles.input}/></div>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Currency Symbol</label><input value={settings.currency_symbol} onChange={e=>setSettings({...settings, currency_symbol:e.target.value})} style={styles.input}/></div>
                                </div>
                            </div>
                            <div style={styles.card}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#1D4ED8' }}>POS Options</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize: '12px', color: '#6B7280'}}>Low Stock Alert Level</label><input type="number" value={settings.low_stock_alert_level} onChange={e=>setSettings({...settings, low_stock_alert_level:e.target.value})} style={styles.input}/></div>
                                    <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize: '12px', color: '#6B7280'}}>Receipt Footer Message</label><input value={settings.receipt_message} onChange={e=>setSettings({...settings, receipt_message:e.target.value})} style={styles.input}/></div>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '20px' }}><button onClick={saveSettings} style={styles.btnPrimary}>Save Settings</button></div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ========================================== */}
            {/* VIP MODALS (POPUPS)                        */}
            {/* ========================================== */}

            {/* 💸 PAYMENT CHECKOUT MODAL */}
            {checkoutModal && (
                <div style={styles.modalOverlay} className="no-print">
                    <div style={{...styles.modalBox, width: '450px'}}>
                        <h2 style={{margin:'0 0 20px 0', color:'#111827', textAlign:'center'}}>Complete Payment</h2>
                        
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'24px', fontWeight:'bold', color:'#1D4ED8', paddingBottom:'15px', borderBottom:'1px solid #e5e7eb', marginBottom:'20px'}}>
                            <span>Total Due:</span><span>{settings.currency_symbol}{finalTotal.toFixed(2)}</span>
                        </div>

                        <label style={{fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Payment Method</label>
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                            <button onClick={()=>setPaymentMethod("Cash")} style={styles.payBtn(paymentMethod === "Cash")}>Cash</button>
                            <button onClick={()=>setPaymentMethod("Card")} style={styles.payBtn(paymentMethod === "Card")}>Card</button>
                            <button onClick={()=>setPaymentMethod("Bank")} style={styles.payBtn(paymentMethod === "Bank")}>Bank</button>
                        </div>

                        {paymentMethod === "Cash" && (
                            <div style={{marginBottom:'20px'}}>
                                <label style={{fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Amount Received</label>
                                <input type="number" placeholder="Enter amount..." value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} style={{...styles.input, fontSize:'18px', padding:'15px', textAlign:'center'}} />
                                {amountReceived && Number(amountReceived) >= finalTotal && (
                                    <div style={{marginTop:'10px', padding:'10px', backgroundColor:'#D1FAE5', color:'#065F46', borderRadius:'6px', textAlign:'center', fontWeight:'bold'}}>
                                        Change to Return: {settings.currency_symbol}{(Number(amountReceived) - finalTotal).toFixed(2)}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setCheckoutModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white', fontWeight:'bold' }}>Cancel</button>
                            <button onClick={processPayment} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: '#10B981', color:'white', fontWeight:'bold' }}>Complete Sale</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🧾 THERMAL RECEIPT MODAL */}
            {receiptDataToPrint && (() => {
                const data = receiptDataToPrint;
                return (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalBox, width: '400px', padding: '0', overflow: 'hidden'}}>
                        
                        <div id="printable-slip">
                            <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '15px', marginBottom: '15px' }}>
                                {settings.logo ? <img src={settings.logo} alt="Logo" style={{maxWidth: '120px', maxHeight: '120px', display: 'block', margin: '0 auto 10px auto'}}/> : null}
                                <h1 style={{ margin: '0 0 5px 0', fontSize: '26px', textTransform: 'uppercase', fontFamily: 'Impact, Courier New, monospace' }}>{settings.business_name}</h1>
                                <p style={{ margin: 0, fontSize: '12px' }}>{settings.phone} | {settings.email}</p>
                                {settings.address && <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>{settings.address}</p>}
                                <p style={{ margin: '15px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>SALE RECEIPT {orderDetails && "(DUPLICATE)"}</p>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                <span>Order #: <strong>{data.order_id || data.id}</strong></span>
                                <span>Date: {new Date(data.date).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '12px', marginBottom: '15px', display:'flex', justifyContent:'space-between' }}>
                                <span>Customer: <strong>{data.customer_name}</strong></span>
                                <span>Method: <strong>{data.payment_method}</strong></span>
                            </div>

                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '15px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px dashed black', borderTop: '1px dashed black' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 0' }}>Sr#</th>
                                        <th style={{ textAlign: 'left', padding: '8px 0' }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: '8px 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '8px 0' }}>Price</th>
                                        <th style={{ textAlign: 'right', padding: '8px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '8px 0' }}>{index + 1}</td>
                                            <td style={{ padding: '8px 0', maxWidth:'100px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.qty || item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{item.price}</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{(item.price * (item.qty || item.quantity)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ borderTop: '1px dashed black', paddingTop: '10px', fontSize: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>Subtotal:</span><span>{settings.currency_symbol}{data.subtotal.toFixed(2)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>Discount:</span><span>-{settings.currency_symbol}{data.discount.toFixed(2)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px', marginTop: '10px', borderTop: '2px solid black', paddingTop: '10px' }}><span>TOTAL:</span><span>{settings.currency_symbol}{data.total.toFixed(2)}</span></div>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', borderTop: '1px dashed black', paddingTop: '15px' }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{settings.receipt_message}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: 'gray' }}>Powered by TEKNIVOS</p>
                            </div>
                        </div>

                        <div className="no-print" style={{ padding: '15px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb' }}>
                            <button onClick={() => { setCheckoutReceipt(null); setOrderDetails(null); }} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white', fontWeight:'bold' }}>Close</button>
                            <button onClick={() => window.print()} style={{...styles.btnPrimary, backgroundColor: '#10B981'}}>Print Slip</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* PRODUCT MODAL */}
            {productModal.open && (
                <div style={styles.modalOverlay} className="no-print"><div style={styles.modalBox}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>{productModal.isEdit ? 'Edit Product' : 'Add Product'}</h3><button onClick={()=>setProductModal({open:false})} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}}>✖</button>
                    </div>
                    <form onSubmit={saveProduct} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Product Name *</label><input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required style={styles.input}/></div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>SKU *</label><input value={formData.sku} onChange={e=>setFormData({...formData, sku:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Category</label><input value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} style={styles.input}/></div>
                        </div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Purchase Price (Cost) *</label><input type="number" step="0.01" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Sale Price *</label><input type="number" step="0.01" value={formData.selling_price} onChange={e=>setFormData({...formData, selling_price:e.target.value})} required style={styles.input}/></div>
                        </div>
                        <div style={{display:'flex', gap:'15px'}}>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Stock Quantity</label><input type="number" value={formData.stock_level} onChange={e=>setFormData({...formData, stock_level:e.target.value})} required style={styles.input}/></div>
                            <div style={{flex: 1}}><label style={{fontSize: '12px', color: '#6B7280'}}>Low Stock Alert</label><input type="number" value={formData.low_stock_alert} onChange={e=>setFormData({...formData, low_stock_alert:e.target.value})} required style={styles.input}/></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setProductModal({open:false})} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
                            <button type="submit" style={styles.btnPrimary}>Save Product</button>
                        </div>
                    </form>
                </div></div>
            )}

            {/* CUSTOMER MODAL */}
            {customerModal.open && (
                <div style={styles.modalOverlay} className="no-print"><div style={styles.modalBox}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom:'20px'}}>
                        <h3 style={{ margin: 0 }}>{customerModal.isEdit ? 'Edit Customer' : 'Add Customer'}</h3><button onClick={()=>setCustomerModal({open:false})} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}}>✖</button>
                    </div>
                    <form onSubmit={saveCustomer} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Full Name *</label><input value={customerForm.name} onChange={e=>setCustomerForm({...customerForm, name:e.target.value})} required style={styles.input}/></div>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Phone Number *</label><input value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm, phone:e.target.value})} required style={styles.input}/></div>
                        <div><label style={{fontSize: '12px', color: '#6B7280'}}>Email Address</label><input value={customerForm.email} onChange={e=>setCustomerForm({...customerForm, email:e.target.value})} style={styles.input}/></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setCustomerModal({open:false})} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
                            <button type="submit" style={styles.btnPrimary}>Save Customer</button>
                        </div>
                    </form>
                </div></div>
            )}
        </div>
    );
}

export default App;