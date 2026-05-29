// cart.js - Logika keranjang dan transaksi

window.cart = [];
window.discountPercent = 0;
window.taxPercent = 0;
window.paymentMethod = 'cash';
window.cashAmount = 0;
window.customerName = '';

// Tambah ke keranjang
function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) return;
    if (product.stock <= 0) {
        showToast('❌ Stok habis!', 'error');
        return;
    }

    const existing = window.cart.find(item => item.productId === productId);
    if (existing) {
        if (existing.qty >= product.stock) {
            showToast('❌ Stok tidak mencukupi!', 'error');
            return;
        }
        existing.qty += 1;
    } else {
        window.cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            emoji: product.emoji || '📦',
        });
    }
    showToast(`✅ ${product.name} ditambahkan`, 'success');
    renderPage();
}

// Ubah jumlah item di keranjang
function updateCartQty(index, delta) {
    const item = window.cart[index];
    if (!item) return;
    const product = getProductById(item.productId);
    const newQty = item.qty + delta;
    if (newQty <= 0) {
        window.cart.splice(index, 1);
    } else if (product && newQty > product.stock) {
        showToast('❌ Stok tidak mencukupi!', 'error');
    } else {
        item.qty = newQty;
    }
    renderPage();
}

// Hapus item dari keranjang
function removeFromCart(index) {
    window.cart.splice(index, 1);
    renderPage();
}

// Kosongkan keranjang
function clearCart() {
    if (window.cart.length > 0 && confirm('Kosongkan keranjang?')) {
        window.cart = [];
        window.discountPercent = 0;
        window.taxPercent = 0;
        window.cashAmount = 0;
        window.customerName = '';
        renderPage();
    }
}

// Update diskon
function updateDiscount(val) {
    window.discountPercent = Math.min(100, Math.max(0, parseFloat(val) || 0));
    renderPage();
}

// Update pajak
function updateTax(val) {
    window.taxPercent = Math.min(50, Math.max(0, parseFloat(val) || 0));
    renderPage();
}

// Update cash amount
function updateCashAmount(val) {
    window.cashAmount = parseFloat(val) || 0;
    renderPage();
}

// Proses checkout
function checkout() {
    if (!window.cart || window.cart.length === 0) {
        showToast('❌ Keranjang kosong!', 'error');
        return;
    }

    const subtotal = window.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const disc = Math.round(subtotal * (window.discountPercent || 0) / 100);
    const after = subtotal - disc;
    const tax = Math.round(after * (window.taxPercent || 0) / 100);
    const total = after + tax;

    if (window.paymentMethod === 'cash' && (window.cashAmount || 0) < total) {
        showToast('❌ Uang pembayaran kurang!', 'error');
        return;
    }

    // Validasi stok
    for (const item of window.cart) {
        const product = getProductById(item.productId);
        if (!product || product.stock < item.qty) {
            showToast(`❌ Stok ${item.name} tidak cukup!`, 'error');
            return;
        }
    }

    // Kurangi stok
    window.cart.forEach(item => {
        const product = getProductById(item.productId);
        if (product) product.stock -= item.qty;
    });
    saveProducts();

    // Buat transaksi
    const transaction = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(window.cart)),
        subtotal,
        discountPercent: window.discountPercent || 0,
        discountAmount: disc,
        taxPercent: window.taxPercent || 0,
        taxAmount: tax,
        total,
        method: window.paymentMethod,
        cashAmount: window.paymentMethod === 'cash' ? window.cashAmount : total,
        change: window.paymentMethod === 'cash' ? (window.cashAmount || 0) - total : 0,
        customer: window.customerName || '-'
    };

    addTransaction(transaction);
    showToast('✅ Transaksi berhasil!', 'success');
    showReceiptModal(transaction);

    // Reset
    window.cart = [];
    window.discountPercent = 0;
    window.taxPercent = 0;
    window.cashAmount = 0;
    window.customerName = '';
    renderPage();
}

// Tampilkan modal struk
function showReceiptModal(transaction) {
    const methodLabels = { cash: 'Tunai', card: 'Kartu', transfer: 'Transfer' };
    const d = new Date(transaction.timestamp);
    const content = `
        <b>KasirKu</b><br>${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}<hr>
        ${transaction.items.map(i => `${i.name} ×${i.qty} = Rp ${(i.price*i.qty).toLocaleString('id-ID')}`).join('<br>')}<hr>
        Subtotal: Rp ${transaction.subtotal.toLocaleString('id-ID')}<br>
        Diskon (${transaction.discountPercent}%): -Rp ${transaction.discountAmount.toLocaleString('id-ID')}<br>
        Pajak (${transaction.taxPercent}%): +Rp ${transaction.taxAmount.toLocaleString('id-ID')}<br>
        <b>Total: Rp ${transaction.total.toLocaleString('id-ID')}</b><br>
        Metode: ${methodLabels[transaction.method] || transaction.method}<br>
        ${transaction.method === 'cash' ? `Bayar: Rp ${transaction.cashAmount.toLocaleString('id-ID')}<br>Kembali: Rp ${transaction.change.toLocaleString('id-ID')}<br>` : ''}
        Pelanggan: ${escapeHtml(transaction.customer)}<hr>🙏 Terima Kasih`;
    document.getElementById('receipt-content').innerHTML = content;
    document.getElementById('print-area').innerHTML = content.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
    document.getElementById('modal-receipt').classList.add('show');
}

// Cetak struk
function printReceipt() {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(`
        <html><head><title>Struk</title>
        <style>body{font-family:monospace;font-size:12px;padding:10px;width:80mm;} hr{border:0;border-top:1px dashed #000;}</style>
        </head><body>${document.getElementById('print-area').innerHTML.replace(/\n/g, '<br>')}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Lihat struk dari riwayat
function viewReceipt(transId) {
    const trx = getTransactionById(transId);
    if (trx) showReceiptModal(trx);
}

// Buka modal tambah produk
function openAddProductModal() {
    document.getElementById('modal-product-title').textContent = '➕ Tambah Produk';
    ['prod-name', 'prod-category', 'prod-price', 'prod-stock', 'prod-emoji'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prod-edit-id').value = '';
    document.getElementById('modal-product').classList.add('show');
}

// Edit produk
function editProduct(id) {
    const p = getProductById(id);
    if (!p) return;
    document.getElementById('modal-product-title').textContent = '✏️ Edit Produk';
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category || '';
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-emoji').value = p.emoji || '';
    document.getElementById('prod-edit-id').value = p.id;
    document.getElementById('modal-product').classList.add('show');
}

// Simpan produk (tambah/edit)
function saveProduct() {
    const name = document.getElementById('prod-name').value.trim();
    const price = parseInt(document.getElementById('prod-price').value) || 0;
    if (!name || price <= 0) {
        showToast('❌ Nama dan harga wajib!', 'error');
        return;
    }

    const productData = {
        name,
        category: document.getElementById('prod-category').value.trim(),
        price,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        emoji: document.getElementById('prod-emoji').value.trim() || '📦'
    };

    const editId = document.getElementById('prod-edit-id').value;
    if (editId) {
        updateProduct(editId, productData);
        showToast('✅ Produk diperbarui!', 'success');
    } else {
        productData.id = generateId();
        addProduct(productData);
        showToast('✅ Produk ditambahkan!', 'success');
    }
    closeModal('modal-product');
    renderPage();
}

// Hapus produk
function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    deleteProductFromData(id);
    // Hapus juga dari keranjang jika ada
    window.cart = window.cart.filter(item => item.productId !== id);
    showToast('🗑️ Produk dihapus', 'info');
    renderPage();
}