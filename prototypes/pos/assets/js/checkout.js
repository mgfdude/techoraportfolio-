/* checkout.js */

document.addEventListener('DOMContentLoaded', () => {
    loadOrderSummary();
    initCheckoutForm();
    initCustomerLookup();
    initCheckoutUI();
});

function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('pos_current_cart')) || [];
    const settings = Storage.get('settings') || { taxRate: 10 };
    
    // Get values from inputs or defaults
    const discountInput = document.getElementById('order-discount');
    const discountPercent = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    
    let paymentMethod = 'Cash';
    const activePaymentBtn = document.querySelector('.payment-btn.active');
    if (activePaymentBtn) {
        paymentMethod = activePaymentBtn.dataset.method;
    }

    if (cart.length === 0) {
        window.location.href = 'pos.html';
        return;
    }

    const container = document.getElementById('summary-items');
    container.innerHTML = '';

    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const el = document.createElement('div');
        el.className = 'summary-item';
        el.innerHTML = `
            <div>
                <div class="sum-name">${item.name}</div>
                <div class="sum-qty">Qty: ${item.quantity} x ${formatCurrency(item.price)}</div>
            </div>
            <div class="sum-price">${formatCurrency(itemTotal)}</div>
        `;
        container.appendChild(el);
    });

    const discountFactor = (1 - discountPercent / 100);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    
    let taxAmount = 0;
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscounted = itemSubtotal * discountFactor;
        const itemTaxRate = (item.tax !== undefined && item.tax !== null) ? item.tax : 0;
        taxAmount += itemDiscounted * (itemTaxRate / 100);
    });

    const total = taxableAmount + taxAmount;

    document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summary-discount').textContent = `-${formatCurrency(discountAmount)}`;
    document.getElementById('summary-tax').textContent = formatCurrency(taxAmount);
    const totalDisplay = formatCurrency(total);
    document.getElementById('summary-total').textContent = totalDisplay;

    // Update UPI modal amount and QR code
    const upiAmount = document.getElementById('upi-amount-display');
    if (upiAmount) {
        upiAmount.textContent = totalDisplay;
        updateUPIQRCode(total);
    }

    // Save current values for finalize
    localStorage.setItem('pos_current_discount', discountPercent);
    localStorage.setItem('pos_payment_method', paymentMethod);
}

function updateUPIQRCode(amount) {
    const qrImage = document.getElementById('upi-qr-image');
    if (!qrImage) return;

    const settings = Storage.get('settings') || {};
    // Change this UPI ID to your actual business UPI ID
    const upiId = settings.storeUPI || 'merchant@upi'; 
    const storeName = settings.storeName || 'Techora POS';
    
    // Construct UPI URL: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
    // Note: UPI works with INR currency
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${amount.toFixed(2)}&cu=INR`;
    
    // Generate QR code using public API (added timestamp for cache-busting)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}&ts=${Date.now()}`;
    
    qrImage.src = qrApiUrl;
}

// Add listeners for dynamic updates
function initCheckoutUI() {
    const discountInput = document.getElementById('order-discount');
    if (discountInput) {
        discountInput.addEventListener('input', loadOrderSummary);
    }

    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadOrderSummary();
        });
    });
    
    // Custom State Dropdown Logic
    initCustomStateDropdown();
}

function initCustomStateDropdown() {
    const container = document.getElementById('state-select-container');
    const input = document.getElementById('cust-state');
    const list = document.getElementById('state-dropdown-list');
    const options = list.querySelectorAll('.suggestion-item');
    
    if (!container || !input || !list) return;
    
    container.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = container.classList.contains('active');
        
        // Close other dropdowns if any
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.suggestions-list').forEach(l => l.classList.remove('active'));
        
        if (!isActive) {
            container.classList.add('active');
            list.classList.add('active');
        } else {
            container.classList.remove('active');
            list.classList.remove('active');
        }
    });
    
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = opt.dataset.value;
            input.value = val;
            container.classList.remove('active');
            list.classList.remove('active');
            
            // Trigger sync/blur logic if needed
            input.dispatchEvent(new Event('blur'));
        });
    });
    
    document.addEventListener('click', () => {
        container.classList.remove('active');
        list.classList.remove('active');
    });
}

function initCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    // Add UPI OK button listener
    const upiOkBtn = document.getElementById('upi-ok-btn');
    if (upiOkBtn) {
        upiOkBtn.onclick = () => {
            const customerData = getCustomerFormData();
            recordOrder(customerData);
            closeModal();
        };
    }

    form.onsubmit = (e) => {
        e.preventDefault();

        const paymentMethod = localStorage.getItem('pos_payment_method') || 'Cash';
        const customerData = getCustomerFormData();
        const total = document.getElementById('summary-total').textContent;

        customConfirm(
            'Confirm Order',
            `Are you sure you want to complete this order for <strong>${total}</strong> using <strong>${paymentMethod}</strong>?`,
            () => {
                if (paymentMethod === 'UPI') {
                    openModal('upi-modal');
                } else {
                    recordOrder(customerData);
                }
            },
            'info',
            'Complete Order'
        );
    };
}

function getCustomerFormData() {
    return {
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: {
            house: document.getElementById('cust-house').value,
            street: document.getElementById('cust-street').value,
            city: document.getElementById('cust-city').value,
            state: document.getElementById('cust-state').value,
            zip: document.getElementById('cust-zip').value
        },
        notes: document.getElementById('order-notes').value
    };
}

function recordOrder(customerData) {
    const btn = document.getElementById('finalize-btn');
    btn.disabled = true;
    btn.textContent = 'Recording Order...';

    // Simulate API call
    setTimeout(() => {
        const orderId = '#' + Math.floor(10000 + Math.random() * 90000);
        
        // Record the order in history
        let orders = Storage.get('orders') || [];
        const newOrder = {
            id: orderId,
            customerPhone: customerData.phone,
            customerName: customerData.name,
            items: JSON.parse(localStorage.getItem('pos_current_cart')),
            total: document.getElementById('summary-total').textContent,
            date: new Date().toISOString(),
            address: customerData.address
        };
        orders.push(newOrder);
        Storage.set('orders', orders);

        // Update customer info
        let customers = Storage.get('customers') || [];
        let existing = customers.find(c => c.phone === customerData.phone);
        if (existing) {
            existing.totalOrders += 1;
            existing.lastAddress = customerData.address;
            Storage.set('customers', customers);
        } else {
            customers.push({
                id: Date.now(),
                name: customerData.name,
                email: customerData.email || 'N/A',
                phone: customerData.phone,
                totalOrders: 1,
                lastAddress: customerData.address
            });
            Storage.set('customers', customers);
        }

        // Populate Thermal Receipt
        const cart = JSON.parse(localStorage.getItem('pos_current_cart')) || [];
        const settings = Storage.get('settings') || { storeName: 'Visionary Eyewear', taxRate: 10 };
        const discountPercent = parseFloat(localStorage.getItem('pos_current_discount')) || 0;
        
        // Logo Handling
        const receiptLogo = document.getElementById('receipt-logo');
        const logoContainer = document.getElementById('receipt-logo-container');
        if (settings.storeLogo && receiptLogo && logoContainer) {
            receiptLogo.src = settings.storeLogo;
            logoContainer.style.display = 'block';
        } else if (logoContainer) {
            logoContainer.style.display = 'none';
        }

        document.getElementById('receipt-store-name').textContent = settings.storeName;
        document.getElementById('receipt-store-address').textContent = settings.storeAddress || '123 Style Avenue, Fashion City';
        if (settings.storePhone) {
            document.getElementById('receipt-store-phone').textContent = `Tel: ${settings.storePhone}`;
        }
        
        const receiptGST = document.getElementById('receipt-store-gst');
        if (settings.storeGST && receiptGST) {
            receiptGST.textContent = `GSTIN: ${settings.storeGST}`;
            receiptGST.style.display = 'block';
        } else if (receiptGST) {
            receiptGST.style.display = 'none';
        }

        document.getElementById('receipt-id').textContent = orderId;
        document.getElementById('receipt-date').textContent = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('receipt-method').textContent = localStorage.getItem('pos_payment_method') || 'Cash';
        document.getElementById('receipt-customer').textContent = customerData.name;

        const receiptItemsList = document.getElementById('receipt-items-list');
        receiptItemsList.innerHTML = '';
        
        let subtotal = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'receipt-item';
            itemEl.innerHTML = `
                <div class="receipt-item-info">
                    <span class="receipt-item-name">${item.name}</span>
                    <span class="receipt-item-qty">${item.quantity} x ${formatCurrency(item.price)}</span>
                </div>
                <span class="receipt-item-total">${formatCurrency(itemTotal)}</span>
            `;
            receiptItemsList.appendChild(itemEl);
        });

        const discountFactor = (1 - discountPercent / 100);
        const discountAmount = subtotal * (discountPercent / 100);
        const taxableAmount = subtotal - discountAmount;
        
        let taxAmount = 0;
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const itemDiscounted = itemSubtotal * discountFactor;
            const itemTaxRate = (item.tax !== undefined && item.tax !== null) ? item.tax : 0;
            taxAmount += itemDiscounted * (itemTaxRate / 100);
        });

        const total = taxableAmount + taxAmount;

        document.getElementById('receipt-subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('receipt-discount').textContent = `-${formatCurrency(discountAmount)}`;
        document.getElementById('receipt-tax').textContent = formatCurrency(taxAmount);
        document.getElementById('receipt-total-val').textContent = formatCurrency(total);

        // Clear cart
        localStorage.removeItem('pos_current_cart');
        localStorage.removeItem('pos_current_discount');
        
        openModal('success-modal');

        // Trigger print dialog
        setTimeout(() => {
            window.print();
        }, 800);
    }, 1500);
}
function initCustomerLookup() {
    const customers = Storage.get('customers') || [];
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const emailInput = document.getElementById('cust-email');
    const houseInput = document.getElementById('cust-house');
    const streetInput = document.getElementById('cust-street');
    const cityInput = document.getElementById('cust-city');
    const stateInput = document.getElementById('cust-state');
    const zipInput = document.getElementById('cust-zip');
    const suggestionsList = document.getElementById('name-suggestions');

    function fillCustomerDetails(customer) {
        nameInput.value = customer.name;
        phoneInput.value = customer.phone || '';
        emailInput.value = customer.email || '';
        
        if (customer.lastAddress) {
            houseInput.value = customer.lastAddress.house || '';
            streetInput.value = customer.lastAddress.street || '';
            cityInput.value = customer.lastAddress.city || '';
            stateInput.value = customer.lastAddress.state || '';
            zipInput.value = customer.lastAddress.zip || '';
        }
        
        suggestionsList.classList.remove('active');
        showToast(`Details loaded for ${customer.name}`, 'success');
    }

    nameInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (!val) {
            suggestionsList.classList.remove('active');
            return;
        }

        const filtered = customers.filter(c => 
            c.name.toLowerCase().includes(val) || 
            c.phone.includes(val)
        ).slice(0, 5); // Limit to 5 results

        if (filtered.length > 0) {
            suggestionsList.innerHTML = '';
            filtered.forEach(c => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <div class="name">${c.name}</div>
                    <div class="phone">${c.phone}</div>
                `;
                item.onclick = () => fillCustomerDetails(c);
                suggestionsList.appendChild(item);
            });
            suggestionsList.classList.add('active');
        } else {
            suggestionsList.classList.remove('active');
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!nameInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.remove('active');
        }
    });

    // Also handle lookup by phone for existing customers
    phoneInput.addEventListener('blur', (e) => {
        const val = e.target.value;
        if (!val) return;
        
        // If name is empty, try to find by phone
        if (!nameInput.value) {
            const customer = customers.find(c => c.phone === val);
            if (customer) {
                fillCustomerDetails(customer);
            }
        }
        
        // Auto-save/Sync to Customer Panel
        autoSaveCustomer();
    });

    nameInput.addEventListener('blur', autoSaveCustomer);
    emailInput.addEventListener('blur', autoSaveCustomer);
    cityInput.addEventListener('blur', autoSaveCustomer);

    function autoSaveCustomer() {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (!name || !phone) return;

        let customersList = Storage.get('customers') || [];
        let existingIndex = customersList.findIndex(c => c.phone === phone);
        
        const customerData = {
            name: name,
            phone: phone,
            email: emailInput.value.trim() || 'N/A',
            lastAddress: {
                house: houseInput.value.trim(),
                street: streetInput.value.trim(),
                city: cityInput.value.trim(),
                state: stateInput.value.trim(),
                zip: zipInput.value.trim()
            }
        };

        if (existingIndex !== -1) {
            // Update existing (preserve totalOrders)
            customersList[existingIndex] = {
                ...customersList[existingIndex],
                ...customerData
            };
        } else {
            // Add new
            customersList.push({
                id: Date.now(),
                ...customerData,
                totalOrders: 0 // New customer, but hasn't finished order yet
            });
        }
        
        Storage.set('customers', customersList);
        
        // Show sync indicator
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            setTimeout(() => indicator.classList.add('hidden'), 2000);
        }
        
        console.log('Customer synced to panel');
    }
}
