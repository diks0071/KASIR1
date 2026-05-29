// ui.js - Render halaman (POS, Produk, Riwayat, Dashboard)

let currentPage = 'pos';
let searchTerm = '';
let filterCategory = '';

// Render halaman sesuai navigasi
function renderPage() {
    const main = document.getElementById('main-content');
    if (!main) return;

    switch (currentPage) {
        case 'pos': main.innerHTML = renderPOS(); break;
        case 'products': main.innerHTML = renderProductsPage(); break;
        case 'history': main.innerHTML = renderHistoryPage(); break;
        case 'dashboard': main.innerHTML = renderDashboard(); break;
        default: main.innerHTML = renderPOS();
    }

    // Re-attach event handler untuk search & filter di halaman POS
    attachUIEvents();
}

// Halaman Kasir (POS)
function renderPOS() {
    const filtered = filterProducts(searchTerm, filterCategory);
    const productCards = filtered.length
        ? filtered.map(p => `
            <div class="product-card" onclick="addToCart('${p.id}')">
                <span class="emoji">${p.emoji || '📦'}</span>
                <div class="pname">${escapeHtml(p.name)}</div>
                <div class="pprice">Rp ${p.price.toLocaleString('id-ID')}</div>
                <div class="pstock">Stok: ${p.stock}</div>
                <button class="btn-del-product" onclick="event.stopPropagation();deleteProduct('${p.id}')">×</button>
            </div>`).join('')
        : '<div class="empty-state">🔍 Tidak ada produk</div>';

    const cartHtml = window.cart && window.cart.length
        ? window.cart.map((item, idx) => `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-price">Rp ${item.price.toLocaleString('id-ID')} × ${item.qty}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn qty-minus" onclick="updateCartQty(${idx}, -1)">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn qty-plus" onclick="updateCartQty(${idx}, 1)">+</button>
                </div>
                <span class="item-total">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
                <button class="btn-remove-item" onclick="removeFromCart(${idx})">🗑️</button>
            </div>`).join('')
        : '<div class="empty-state">🛒 Keranjang kosong</div>';

    const subtotal = (window.cart || []).reduce((s, i) => s + i.price * i.qty, 0);
    const disc = Math.round(subtotal * (window.discountPercent || 0) / 100);
    const after = subtotal - disc;
    const tax = Math.round(after * (window.taxPercent || 0) / 100);
    const total = after + tax;
    const cash = window.cashAmount || 0;
    const change = cash >= total ? cash - total : 0;

    return `
    <div class="header">
        <h1>🛒 Kasir</h1>
        <div class="date">${new Date().toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
    </div>
    <div class="two-col">
        <div class="panel">
            <h2>📦 Produk <span class="badge">${products.length}</span></h2>
            <div class="search-box">
                <input type="text" id="search-product" placeholder="Cari..." value="${escapeHtml(searchTerm)}" oninput="updateSearchTerm(this.value)">
                <button class="btn btn-primary" onclick="openAddProductModal()">+ Tambah</button>
            </div>
            <select id="filter-category" onchange="updateFilterCategory(this.value)" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;">
                <option value="">Semua Kategori</option>
                ${[...new Set(products.map(p => p.category).filter(Boolean))].map(c => `<option ${c === filterCategory ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
            </select>
            <div class="product-grid">${productCards}</div>
        </div>
        <div class="panel">
            <h2>🛒 Keranjang <span class="badge">${(window.cart || []).length}</span></h2>
            <div class="cart-items">${cartHtml}</div>
            <div class="cart-summary">
                <div class="row"><span>Subtotal</span><span>Rp ${subtotal.toLocaleString('id-ID')}</span></div>
                <div class="row"><span>Diskon (%)</span><input type="number" id="discount-input" value="${window.discountPercent || 0}" min="0" max="100" style="width:80px" onchange="updateDiscount(this.value)"></div>
                <div class="row"><span>Diskon</span><span>-Rp ${disc.toLocaleString('id-ID')}</span></div>
                <div class="row"><span>Pajak (%)</span><input type="number" id="tax-input" value="${window.taxPercent || 0}" min="0" max="50" style="width:80px" onchange="updateTax(this.value)"></div>
                <div class="row"><span>Pajak</span><span>+Rp ${tax.toLocaleString('id-ID')}</span></div>
                <div class="row total"><span>Total</span><span>Rp ${total.toLocaleString('id-ID')}</span></div>
                <input type="text" id="customer-name" placeholder="Nama Pelanggan" value="${escapeHtml(window.customerName || '')}" onchange="window.customerName = this.value">
                <select id="payment-method" onchange="window.paymentMethod = this.value; renderPage();">
                    <option value="cash" ${window.paymentMethod === 'cash' ? 'selected' : ''}>Tunai</option>
                    <option value="card" ${window.paymentMethod === 'card' ? 'selected' : ''}>Kartu</option>
                    <option value="transfer" ${window.paymentMethod === 'transfer' ? 'selected' : ''}>Transfer</option>
                </select>
                <input type="number" id="cash-amount" placeholder="Jumlah Bayar" value="${cash || ''}" style="display:${window.paymentMethod === 'cash' ? 'block' : 'none'}" onchange="updateCashAmount(this.value)">
                ${window.paymentMethod === 'cash' && cash > 0 ? `<div class="row"><span>Kembalian</span><span>Rp ${change.toLocaleString('id-ID')}</span></div>` : ''}
                <button class="btn-checkout" onclick="checkout()" ${(window.cart || []).length === 0 ? 'disabled' : ''}>✅ Bayar</button>
                <button class="btn btn-secondary" onclick="clearCart()">🗑️ Kosongkan</button>
            </div>
        </div>
    </div>`;
}

// Halaman Manajemen Produk
function renderProductsPage() {
    const rows = products.map(p => `
        <tr>
            <td>${p.emoji || '📦'}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category || '-')}</td>
            <td>Rp ${p.price.toLocaleString('id-ID')}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn btn-primary" style="padding:4px 10px" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:4px 10px" onclick="deleteProduct('${p.id}')">Hapus</button>
            </td>
        </tr>`).join('') || '<tr><td colspan="6" class="text-center">Belum ada produk</td></tr>';

    return `
    <div class="header">
        <h1>📦 Produk</h1>
        <div>
            <button class="btn btn-primary" onclick="openAddProductModal()">+ Tambah</button>
            <button class="btn btn-success" onclick="exportProductsCSV()">📥 CSV Produk</button>
        </div>
    </div>
    <div class="panel">
        <input type="text" id="search-product-admin" placeholder="🔍 Cari produk..." oninput="filterProductTable()" style="padding:10px;border:2px solid var(--border);border-radius:8px;">
        <div class="table-wrapper">
            <table>
                <thead><tr><th>Emoji</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead>
                <tbody id="product-table-body">${rows}</tbody>
            </table>
        </div>
    </div>`;
}

// Filter tabel produk
function filterProductTable() {
    const search = document.getElementById('search-product-admin')?.value.toLowerCase() || '';
    document.querySelectorAll('#product-table-body tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

// Halaman Riwayat Transaksi
function renderHistoryPage() {
    const rows = [...transactions].reverse().map((t, i) => `
        <tr>
            <td>#${transactions.length - i}</td>
            <td>${formatDate(t.timestamp)} ${formatTime(t.timestamp)}</td>
            <td>${escapeHtml(t.customer || '-')}</td>
            <td>${t.items.length} item</td>
            <td>Rp ${t.total.toLocaleString('id-ID')}</td>
            <td>${t.method}</td>
            <td><button class="btn btn-primary" style="padding:4px 10px" onclick="viewReceipt('${t.id}')">Lihat</button></td>
        </tr>`).join('') || '<tr><td colspan="7" class="text-center">Belum ada transaksi</td></tr>';

    return `
    <div class="header">
        <h1>📋 Riwayat</h1>
        <button class="btn btn-success" onclick="exportTransactionsCSV()">📥 CSV Transaksi</button>
    </div>
    <div class="panel">
        <div class="table-wrapper">
            <table>
                <thead><tr><th>No</th><th>Tanggal</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Metode</th><th>Aksi</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

// Halaman Dashboard
function renderDashboard() {
    const revenue = transactions.reduce((s, t) => s + t.total, 0);
    const lowStock = products.filter(p => p.stock <= 5).length;
    const topProducts = Object.entries(
        transactions.reduce((acc, t) => {
            t.items.forEach(i => { acc[i.name] = (acc[i.name] || 0) + i.qty; });
            return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const topRows = topProducts.length
        ? topProducts.map(([name, qty], i) => `<tr><td>${i+1}</td><td>${escapeHtml(name)}</td><td>${qty}</td></tr>`).join('')
        : '<tr><td colspan="3">Belum ada data</td></tr>';

    return `
    <div class="header"><h1>📊 Dashboard</h1></div>
    <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon green">💰</div><div class="stat-info"><h3>Pendapatan</h3><div class="value">Rp ${revenue.toLocaleString('id-ID')}</div></div></div>
        <div class="stat-card"><div class="stat-icon blue">🧾</div><div class="stat-info"><h3>Transaksi</h3><div class="value">${transactions.length}</div></div></div>
        <div class="stat-card"><div class="stat-icon orange">📦</div><div class="stat-info"><h3>Produk</h3><div class="value">${products.length}</div></div></div>
        <div class="stat-card"><div class="stat-icon red">⚠️</div><div class="stat-info"><h3>Stok Menipis</h3><div class="value">${lowStock}</div></div></div>
    </div>
    <div class="panel">
        <h2>🏆 Produk Terlaris</h2>
        <table><thead><tr><th>#</th><th>Produk</th><th>Terjual</th></tr></thead><tbody>${topRows}</tbody></table>
    </div>
    <div class="panel">
        <h2>💾 Data & Backup</h2>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-success" onclick="exportProductsCSV()">📥 CSV Produk</button>
            <button class="btn btn-success" onclick="exportTransactionsCSV()">📥 CSV Transaksi</button>
            <button class="btn btn-primary" onclick="backupAllData()">💾 Backup JSON</button>
            <button class="btn btn-secondary" onclick="triggerRestore()">📂 Pulihkan Backup</button>
        </div>
        <p style="font-size:0.8rem; color:var(--text-light)">Backup JSON berisi seluruh data produk & transaksi.</p>
    </div>`;
}

// Fungsi filter produk (digunakan di POS)
function filterProducts(search, category) {
    return products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });
}

// Update search & filter dari input POS
function updateSearchTerm(value) {
    searchTerm = value;
    renderPage();
}

function updateFilterCategory(value) {
    filterCategory = value;
    renderPage();
}

// Attach event untuk pencarian & kategori di halaman POS
function attachUIEvents() {
    // Event sudah ditangani via oninput/onchange di dalam render
    // Hanya untuk modal overlay klik luar
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.onclick = function(e) {
            if (e.target === overlay) closeModal(overlay.id);
        };
    });
}