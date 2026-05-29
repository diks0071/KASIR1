// data.js - Manajemen data produk dan transaksi

const STORAGE_KEY_PRODUCTS = 'kasirku_products';
const STORAGE_KEY_TRANSACTIONS = 'kasirku_transactions';

let products = [];
let transactions = [];

// Muat data dari localStorage
function loadData() {
    const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    const storedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

    products = storedProducts ? JSON.parse(storedProducts) : [];
    transactions = storedTransactions ? JSON.parse(storedTransactions) : [];

    // Jika produk kosong, isi default
    if (products.length === 0) {
        products = [
            { id: 'p1', name: 'Kopi Latte', category: 'Minuman', price: 18000, stock: 40, emoji: '☕' },
            { id: 'p2', name: 'Cappuccino', category: 'Minuman', price: 20000, stock: 35, emoji: '☕' },
            { id: 'p3', name: 'Nasi Goreng', category: 'Makanan', price: 25000, stock: 20, emoji: '🍛' },
            { id: 'p4', name: 'Mie Ayam', category: 'Makanan', price: 15000, stock: 25, emoji: '🍜' },
            { id: 'p5', name: 'Es Teh Manis', category: 'Minuman', price: 5000, stock: 60, emoji: '🧊' },
            { id: 'p6', name: 'Donat Coklat', category: 'Snack', price: 8000, stock: 30, emoji: '🍩' },
            { id: 'p7', name: 'Roti Bakar', category: 'Snack', price: 12000, stock: 15, emoji: '🍞' },
            { id: 'p8', name: 'Air Mineral', category: 'Minuman', price: 3000, stock: 100, emoji: '💧' },
        ];
        saveProducts();
    }
}

// Simpan produk ke localStorage
function saveProducts() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

// Simpan transaksi ke localStorage
function saveTransactions() {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

// Tambah produk baru
function addProduct(productData) {
    products.push(productData);
    saveProducts();
}

// Update produk
function updateProduct(id, newData) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...newData };
        saveProducts();
    }
}

// Hapus produk
function deleteProductFromData(id) {
    products = products.filter(p => p.id !== id);
    saveProducts();
}

// Tambah transaksi
function addTransaction(transactionData) {
    transactions.push(transactionData);
    saveTransactions();
}

// Cari produk by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}

// Cari transaksi by ID
function getTransactionById(id) {
    return transactions.find(t => t.id === id);
}