// export.js - Fungsi ekspor CSV, backup, restore

// Download CSV generik
function downloadCSV(filename, rows) {
    const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Ekspor CSV produk
function exportProductsCSV() {
    const rows = [['Nama', 'Kategori', 'Harga', 'Stok', 'Emoji']];
    products.forEach(p => rows.push([p.name, p.category || '', p.price, p.stock, p.emoji || '']));
    downloadCSV('produk-kasirku.csv', rows);
    showToast('📥 CSV produk terdownload!', 'success');
}

// Ekspor CSV transaksi
function exportTransactionsCSV() {
    const rows = [['No', 'Tanggal', 'Pelanggan', 'Item (Nama x Qty)', 'Total', 'Metode']];
    transactions.forEach((t, i) => {
        const date = formatDate(t.timestamp);
        const itemsStr = t.items.map(it => `${it.name} ×${it.qty}`).join('; ');
        rows.push([i + 1, date, t.customer || '-', itemsStr, t.total, t.method]);
    });
    downloadCSV('transaksi-kasirku.csv', rows);
    showToast('📥 CSV transaksi terdownload!', 'success');
}

// Backup semua data sebagai JSON
function backupAllData() {
    const backup = {
        products,
        transactions,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-kasirku-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Backup semua data berhasil diunduh!', 'success');
}

// Trigger dialog restore file
function triggerRestore() {
    document.getElementById('restore-file-input').click();
}

// Handle file restore
function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.products || !data.transactions) throw new Error('Format tidak valid');
            if (!confirm('⚠️ Pulihkan data dari backup? Data saat ini akan diganti. Lanjutkan?')) return;
            products = data.products;
            transactions = data.transactions;
            saveProducts();
            saveTransactions();
            window.cart = [];
            window.discountPercent = 0;
            window.taxPercent = 0;
            window.cashAmount = 0;
            window.customerName = '';
            showToast('✅ Data berhasil dipulihkan!', 'success');
            renderPage();
        } catch (err) {
            showToast('❌ File backup tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset input
}