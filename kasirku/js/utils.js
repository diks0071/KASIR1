// utils.js - Fungsi utility global

// Escape karakter HTML
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Generate ID unik
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

// Tampilkan toast notifikasi
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Tutup modal berdasarkan ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Format tanggal Indonesia
function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Format jam
function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Toggle sidebar mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}