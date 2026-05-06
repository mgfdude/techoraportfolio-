// main.js - Shared logic for all pages

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initDateTime();
    initData();
    initLogout();
    updateGlobalBranding();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('pos_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const topBarRight = document.querySelector('.top-bar-right');
    if (topBarRight) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'theme-toggle';
        themeBtn.className = 'theme-toggle-btn';
        themeBtn.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        themeBtn.title = 'Toggle Dark/Light Mode';
        
        // Add to the left of the date/time
        topBarRight.insertBefore(themeBtn, topBarRight.firstChild);

        themeBtn.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('pos_theme', newTheme);
            themeBtn.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            
            // Animation effect
            themeBtn.style.transform = 'scale(0.8)';
            setTimeout(() => themeBtn.style.transform = 'scale(1)', 100);
        };
    }
}

// Sidebar Navigation
function initSidebar() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== '#') {
            link.parentElement.classList.add('active');
        } else if (currentPath.endsWith('/') && href === 'pos.html') {
            // Default to POS if at root
            link.parentElement.classList.add('active');
        }
    });
}

// Logout Confirmation
function initLogout() {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const href = btn.getAttribute('href');
            
            customConfirm(
                'Confirm Logout',
                'Are you sure you want to log out of the admin panel? Any unsaved changes may be lost.',
                () => {
                    window.location.href = href;
                },
                'danger',
                'Log Out'
            );
        });
    });
}

// Topbar Date & Time
function initDateTime() {
    const dateTimeElement = document.getElementById('current-date-time');
    if (!dateTimeElement) return;

    function updateTime() {
        const now = new Date();
        const options = { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        dateTimeElement.textContent = now.toLocaleDateString('en-US', options).replace(',', ' •');
    }

    updateTime();
    setInterval(updateTime, 60000); // Update every minute
}



// Global Branding Update
function updateGlobalBranding() {
    const settings = Storage.get('settings');
    const auth = Storage.get('auth');

    // Update User Name in sidebar/header
    const userNameElements = document.querySelectorAll('.user-name');
    if (auth && auth.username) {
        userNameElements.forEach(el => {
            el.textContent = auth.username;
        });
    }

    if (!settings) return;

    // Update User Avatar
    const avatarImg = document.querySelector('.avatar');
    if (avatarImg && settings.storeLogo) {
        avatarImg.src = settings.storeLogo;
    }
}
function initData() {
    if (!localStorage.getItem('pos_products')) {
        const initialProducts = [
            { id: 1, name: 'Ray-Ban Aviator', category: 'Sunglasses', price: 154.00, stock: 12, barcode: '123456001', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop' },
            { id: 2, name: 'Oakley Holbrook', category: 'Sunglasses', price: 146.00, stock: 8, barcode: '123456002', image: 'https://images.unsplash.com/photo-1511499767390-91f19760a0ac?w=400&h=400&fit=crop' },
            { id: 3, name: 'Gucci Square Frame', category: 'Frames', price: 320.00, stock: 5, barcode: '123456003', image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=400&fit=crop' },
            { id: 4, name: 'Prada Cat Eye', category: 'Frames', price: 285.00, stock: 7, barcode: '123456004', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop' },
            { id: 5, name: 'Blue Light Filter', category: 'Lenses', price: 40.00, stock: 100, barcode: '123456005', image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&h=400&fit=crop' },
            { id: 6, name: 'Transitions Gen 8', category: 'Lenses', price: 120.00, stock: 50, barcode: '123456006', image: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=400&h=400&fit=crop' },
            { id: 7, name: 'Titanium Rimless', category: 'Frames', price: 210.00, stock: 10, barcode: '123456007', image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&h=400&fit=crop' },
            { id: 8, name: 'Vogue Eyewear', category: 'Frames', price: 95.00, stock: 15, barcode: '123456008', image: 'https://images.unsplash.com/photo-1509100104048-6373f6584528?w=400&h=400&fit=crop' },
            { id: 9, name: 'Polarized Plus2', category: 'Lenses', price: 85.00, stock: 40, barcode: '123456009', image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop' },
            { id: 10, name: 'Cleaning Kit Pro', category: 'Accessories', price: 15.00, stock: 100, barcode: '123456010', image: 'https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=400&h=400&fit=crop' },
            { id: 11, name: 'Hard Shell Case', category: 'Accessories', price: 12.00, stock: 80, barcode: '123456011', image: 'https://images.unsplash.com/photo-1604433830028-1f19f20109cc?w=400&h=400&fit=crop' },
            { id: 12, name: 'Repair Tool Set', category: 'Accessories', price: 8.00, stock: 30, barcode: '123456012', image: 'https://images.unsplash.com/photo-1581578731522-aa7c04100c6d?w=400&h=400&fit=crop' }
        ];
        localStorage.setItem('pos_products', JSON.stringify(initialProducts));
    }

    if (!localStorage.getItem('pos_customers')) {
        const initialCustomers = [
            { id: 1, name: 'Alice Wong', email: 'alice@example.com', phone: '123-456-7890', totalOrders: 2 },
            { id: 2, name: 'Mark Evans', email: 'mark@example.com', phone: '987-654-3210', totalOrders: 1 },
            { id: 3, name: 'Sarah Miller', email: 'sarah@example.com', phone: '555-123-4567', totalOrders: 0 }
        ];
        localStorage.setItem('pos_customers', JSON.stringify(initialCustomers));
    }

    if (!localStorage.getItem('pos_settings')) {
        const initialSettings = {
            storeName: 'Visionary Eyewear',
            storeAddress: '123 Style Avenue, Fashion City',
            storePhone: '+1 (555) 012-3456',
            taxRate: 8,
            currency: '₹'
        };
        localStorage.setItem('pos_settings', JSON.stringify(initialSettings));
    }

    if (!localStorage.getItem('pos_auth')) {
        const initialAuth = {
            username: 'admin',
            password: 'admin123'
        };
        localStorage.setItem('pos_auth', JSON.stringify(initialAuth));
    }
}

// Global UI Helpers
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    const modal = document.getElementById(modalId);
    
    if (overlay && modal) {
        // Hide all other modals first
        modals.forEach(m => m.classList.add('hidden'));
        
        overlay.classList.add('active');
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    const confirmModal = document.querySelector('.confirm-modal');
    
    if (overlay) {
        overlay.classList.remove('active');
        modals.forEach(m => m.classList.add('hidden'));
        if (confirmModal) {
            confirmModal.remove();
        }
    }
}

/**
 * Closes ONLY the confirmation popup, leaving any background modal open.
 */
function closeConfirmOnly() {
    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal) confirmModal.remove();
}

/**
 * Custom Confirmation Dialog
 * @param {string} title - The title of the dialog
 * @param {string} message - The message body
 * @param {function} onConfirm - Callback for OK
 * @param {string} type - 'info', 'danger', 'success' (optional)
 * @param {string} okText - Text for the OK button (optional)
 * @param {function} onCancel - Callback for Cancel (optional)
 */
function customConfirm(title, message, onConfirm, type = 'info', okText = 'Confirm', onCancel = null) {
    let overlay = document.getElementById('modal-overlay');
    
    // Create overlay if it doesn't exist
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }

    // Remove any existing confirm modals
    const existing = document.querySelector('.confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = `confirm-modal ${type}`;
    
    let icon = 'info-circle';
    if (type === 'danger') icon = 'exclamation-triangle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-circle';

    modal.innerHTML = `
        <div class="confirm-header">
            <div class="confirm-icon-bg">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="confirm-title">${title}</div>
        </div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-footer">
            <button class="btn-confirm-cancel" id="confirm-cancel">Cancel</button>
            <button class="btn-confirm-ok" id="confirm-ok">${okText}</button>
        </div>
    `;

    overlay.appendChild(modal);
    overlay.classList.add('active');

    // Event Listeners
    document.getElementById('confirm-ok').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    document.getElementById('confirm-cancel').onclick = () => {
        closeConfirmOnly();
        if (onCancel) onCancel();
    };

    // Close confirm-only on overlay click (preserve background modal)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeConfirmOnly();
            if (onCancel) onCancel();
        }
    };
}

/**
 * Custom Password Prompt Dialog
 * @param {string} title - The title of the dialog
 * @param {string} message - The message body
 * @param {function} onConfirm - Callback with input value
 */
function customPrompt(title, message, onConfirm) {
    let overlay = document.getElementById('modal-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }

    const existing = document.querySelector('.confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    
    modal.innerHTML = `
        <div class="confirm-header">
            <div class="confirm-title">${title}</div>
        </div>
        <div class="confirm-message" style="margin-bottom: 15px;">${message}</div>
        <div class="confirm-input">
            <div class="password-input-wrapper">
                <input type="password" id="prompt-password-input" placeholder="Enter admin password" 
                    style="width: 100%; padding: 12px; padding-right: 48px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; font-size: 1rem;">
                <button type="button" class="toggle-password" onclick="togglePasswordVisibility('prompt-password-input')" style="color: rgba(255,255,255,0.6);">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <div class="error-message" id="prompt-error-msg">
                <i class="fas fa-exclamation-circle"></i>
                <span>The Password is wrong</span>
            </div>
        </div>
        <div class="confirm-footer" style="margin-top: 20px;">
            <button class="btn-confirm-cancel" id="confirm-cancel">Cancel</button>
            <button class="btn-confirm-ok" id="confirm-ok">Verify & Reset</button>
        </div>
    `;

    overlay.appendChild(modal);
    overlay.classList.add('active');
    
    const input = document.getElementById('prompt-password-input');
    const errorMsg = document.getElementById('prompt-error-msg');
    
    setTimeout(() => input.focus(), 100);

    document.getElementById('confirm-ok').onclick = () => {
        const val = input.value;
        if (onConfirm) onConfirm(val);
    };

    document.getElementById('confirm-cancel').onclick = () => {
        closeModal();
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') document.getElementById('confirm-ok').click();
    };

    // Clear error on input
    input.addEventListener('input', () => {
        input.style.borderColor = 'rgba(255,255,255,0.2)';
        errorMsg.classList.remove('visible');
    });
}

// LocalStorage Helpers
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(`pos_${key}`)),
    set: (key, data) => localStorage.setItem(`pos_${key}`, JSON.stringify(data)),
    update: (key, id, newData) => {
        const data = JSON.parse(localStorage.getItem(`pos_${key}`));
        const index = data.findIndex(item => item.id == id);
        if (index !== -1) {
            data[index] = { ...data[index], ...newData };
            localStorage.setItem(`pos_${key}`, JSON.stringify(data));
        }
    },
    delete: (key, id) => {
        const data = JSON.parse(localStorage.getItem(`pos_${key}`));
        const filtered = data.filter(item => item.id != id);
        localStorage.setItem(`pos_${key}`, JSON.stringify(filtered));
    }
};

function formatCurrency(amount) {
    const settings = Storage.get('settings') || { currency: '$' };
    return `${settings.currency}${parseFloat(amount).toFixed(2)}`;
}

function formatShortCurrency(amount) {
    const settings = Storage.get('settings') || { currency: '$' };
    let value = parseFloat(amount);
    let suffix = '';
    
    if (value >= 1000) {
        value = value / 1000;
        suffix = 'k';
    }
    
    const formatted = suffix ? value.toFixed(1).replace(/\.0$/, '') : value.toFixed(2);
    return `${settings.currency}${formatted}${suffix}`;
}
function downloadCSV(data, filename) {
    if (!data || !data.length) {
        showToast('No data to export', 'error');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Export data to Excel (XLS) format with basic styling
 * @param {Array|string} data - Array of objects or HTML string
 * @param {string} filename - Filename for download
 */
function downloadExcel(data, filename) {
    let tableHtml = "";

    if (typeof data === 'string') {
        tableHtml = data;
    } else {
        if (!data || !data.length) {
            showToast('No data to export', 'error');
            return;
        }
        const headers = Object.keys(data[0]);
        
        // Header Row
        tableHtml += "<tr>" + headers.map(h => `<th style="background-color: #007AFF; color: #FFFFFF; font-weight: bold; border: 1px solid #DDDDDD; padding: 10px;">${h}</th>`).join('') + "</tr>";
        
        // Data Rows
        data.forEach(row => {
            tableHtml += "<tr>" + headers.map(h => `<td style="border: 1px solid #DDDDDD; padding: 8px;">${row[h]}</td>`).join('') + "</tr>";
        });
    }

    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
            <style>
                table { border-collapse: collapse; }
                th, td { border: 1px solid #DDDDDD; padding: 8px; text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .heading { font-size: 16pt; font-weight: bold; background-color: #F0F2F5; color: #000; }
                .section-header { font-size: 12pt; font-weight: bold; background-color: #007AFF; color: #FFFFFF; }
                .sub-header { font-weight: bold; background-color: #F8F9FA; color: #333; }
                .text-danger { color: #FF3B30; }
                .font-bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <table>${tableHtml}</table>
        </body>
        </html>`;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Replace extension to .xls if it's .csv
    const finalFilename = filename.toLowerCase().endsWith('.csv') ? filename.slice(0, -4) + '.xls' : (filename.toLowerCase().endsWith('.xls') ? filename : filename + '.xls');
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Global Password Visibility Toggle
 * @param {string} inputId - ID of the password input
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Find the icon within the next element (the button)
    const button = input.parentElement.querySelector('.toggle-password');
    if (!button) return;
    
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
