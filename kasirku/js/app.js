// app.js - Inisialisasi aplikasi dan navigasi

// Navigasi halaman
function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar nav a[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
    renderPage();
    // Tutup sidebar mobile
    if (window.innerWidth <= 1000) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// Inisialisasi saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    loadData();           // Muat produk & transaksi dari localStorage
    navigate('pos');      // Mulai dari halaman kasir

    // Tutup modal saat klik overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('show');
        });
    });

    // Keyboard shortcut ESC untuk menutup modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        }
    });
}); 