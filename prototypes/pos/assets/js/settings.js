/* settings.js */

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initTabs();
    initLogoUpload();
    initSecurityLivePreview();
});

function initSecurityLivePreview() {
    const usernameInput = document.getElementById('set-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                const userNameElements = document.querySelectorAll('.user-name');
                userNameElements.forEach(el => el.textContent = val);
            }
        });
    }
}

let storeLogoBase64 = '';

function initLogoUpload() {
    const fileInput = document.getElementById('set-store-logo');
    const preview = document.getElementById('logo-preview');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    storeLogoBase64 = event.target.result;
                    preview.src = storeLogoBase64;
                    
                    // Update global sidebar branding immediately for better UX
                    const settings = Storage.get('settings') || {};
                    settings.storeLogo = storeLogoBase64;
                    Storage.set('settings', settings);
                    if (typeof updateGlobalBranding === 'function') {
                        updateGlobalBranding();
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.settings-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update panels
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === target) {
                    p.classList.add('active');
                }
            });
        });
    });
}

function loadSettings() {
    const settings = Storage.get('settings');
    if (settings) {
        document.getElementById('set-store-name').value = settings.storeName || '';
        document.getElementById('set-currency').value = settings.currency || '$';
        document.getElementById('set-tax-rate').value = settings.taxRate || 0;
        document.getElementById('set-store-phone').value = settings.storePhone || '';
        document.getElementById('set-store-address').value = settings.storeAddress || '';
        document.getElementById('set-admin-email').value = settings.adminEmail || '';
        document.getElementById('set-store-upi').value = settings.storeUPI || '';
        document.getElementById('set-store-gst').value = settings.storeGST || '';
        
        // Bank Details
        document.getElementById('set-bank-name').value = settings.bankName || '';
        document.getElementById('set-acc-holder').value = settings.accHolder || '';
        document.getElementById('set-acc-number').value = settings.accNumber || '';
        document.getElementById('set-ifsc-code').value = settings.ifscCode || '';
        
        // Logo Handling
        if (settings.storeLogo) {
            storeLogoBase64 = settings.storeLogo;
            document.getElementById('logo-preview').src = storeLogoBase64;
        }

        // Security
        const auth = Storage.get('auth');
        if (auth) {
            document.getElementById('set-username').value = auth.username || 'admin';
        } else {
            document.getElementById('set-username').value = 'admin';
        }
    }
}

function saveSecuritySettings() {
    customConfirm(
        'Update Security Credentials',
        'Are you sure you want to update your login username and password? You will need these new credentials for future logins.',
        () => {
            performSaveSecuritySettings();
        },
        'warning',
        'Update Credentials'
    );
}

function performSaveSecuritySettings() {
    const username = document.getElementById('set-username').value.trim();
    const oldPassword = document.getElementById('set-password-old').value;
    const password = document.getElementById('set-password').value;
    const confirm = document.getElementById('set-password-confirm').value;

    if (!username) {
        showToast('Username cannot be empty', 'error');
        return;
    }

    let auth = Storage.get('auth') || { username: 'admin', password: 'admin123' };
    
    auth.username = username;

    if (password) {
        if (!oldPassword) {
            showToast('Please enter your current password to change it', 'error');
            return;
        }
        if (oldPassword !== auth.password) {
            showToast('Current password is incorrect', 'error');
            return;
        }
        if (password !== confirm) {
            showToast('New passwords do not match', 'error');
            return;
        }
        if (password.length < 4) {
            showToast('Password must be at least 4 characters', 'error');
            return;
        }
        auth.password = password;
    }

    Storage.set('auth', auth);
    showToast('Security settings updated', 'success');
    
    // Update global branding instantly
    if (typeof updateGlobalBranding === 'function') {
        updateGlobalBranding();
    }
    
    // Clear password fields
    document.getElementById('set-password-old').value = '';
    document.getElementById('set-password').value = '';
    document.getElementById('set-password-confirm').value = '';
}

function saveSettings() {
    customConfirm(
        'Save Configuration',
        'Are you sure you want to save these changes to the store or bank configuration?',
        () => {
            performSaveSettings();
        },
        'info',
        'Save Changes'
    );
}

function performSaveSettings() {
    const settings = {
        storeName: document.getElementById('set-store-name').value,
        currency: document.getElementById('set-currency').value,
        taxRate: parseFloat(document.getElementById('set-tax-rate').value) || 0,
        storePhone: document.getElementById('set-store-phone').value,
        storeAddress: document.getElementById('set-store-address').value,
        adminEmail: document.getElementById('set-admin-email').value,
        storeUPI: document.getElementById('set-store-upi').value,
        storeGST: document.getElementById('set-store-gst').value,
        bankName: document.getElementById('set-bank-name').value,
        accHolder: document.getElementById('set-acc-holder').value,
        accNumber: document.getElementById('set-acc-number').value,
        ifscCode: document.getElementById('set-ifsc-code').value,
        storeLogo: storeLogoBase64
    };

    Storage.set('settings', settings);
    showToast('Settings saved successfully', 'success');
    
    // Ensure global branding (sidebar/avatar) is refreshed
    if (typeof updateGlobalBranding === 'function') {
        updateGlobalBranding();
    }
}




