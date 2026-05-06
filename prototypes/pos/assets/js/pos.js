/* pos.js */

let currentCart = JSON.parse(localStorage.getItem('pos_current_cart')) || [];
let products = Storage.get('products') || [];
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCart();
    initFilters();
    initSearch();
    initCheckout();
    updateCartHeader();
    
    // Autofocus search on load
    document.getElementById('global-search').focus();
    
    // Keyboard shortcut '/' to search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('global-search').focus();
        }
    });
});

// Render Products
function renderProducts(filter = '') {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase()) || (p.barcode && p.barcode.includes(filter));
        return matchesCategory && matchesSearch;
    });

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <span class="product-name">${product.name}</span>
                ${product.barcode ? `<span class="product-barcode-hint"><i class="fas fa-barcode"></i> ${product.barcode}</span>` : ''}
                <div class="product-footer">
                    <div class="price-stack">
                        <span class="product-price">${formatCurrency(product.price)}</span>
                        <div class="product-badge">${product.category}</div>
                    </div>
                    <button class="add-btn"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        
        // Clicking anywhere adds it
        card.onclick = () => addToCart(product);
        
        // Optional: stop propagation if we had a specific button action, 
        // but here it's fine since both do the same.
        
        grid.appendChild(card);
    });
}

// Cart Logic
function addToCart(product) {
    const existing = currentCart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        currentCart.push({ ...product, quantity: 1 });
    }
    updateCart();
    showToast(`${product.name} added to cart`, 'success');
}

function updateQuantity(id, delta) {
    const item = currentCart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeItem(id);
        } else {
            updateCart();
        }
    }
}

function removeItem(id) {
    currentCart = currentCart.filter(i => i.id !== id);
    updateCart();
}

function clearCart() {
    if (currentCart.length === 0) return;
    customConfirm(
        'Clear Cart',
        'Are you sure you want to clear all items from the cart? This cannot be undone.',
        () => {
            currentCart = [];
            updateCart();
            showToast('Cart cleared', 'info');
        },
        'danger',
        'Clear Everything'
    );
}

function updateCart() {
    localStorage.setItem('pos_current_cart', JSON.stringify(currentCart));
    renderCart();
    updateCartHeader();
}

function updateCartHeader() {
    const count = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    const headerTitle = document.querySelector('.cart-header h2');
    if (headerTitle) {
        headerTitle.innerHTML = `Current Order <span class="item-count-badge">${count}</span>`;
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (currentCart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        updateTotals();
        return;
    }

    container.innerHTML = '';
    currentCart.forEach(item => {
        const itemTaxRate = (item.tax !== undefined && item.tax !== null) ? item.tax : 0;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${formatCurrency(item.price)} each <small class="tax-badge" style="opacity: 0.7; font-size: 0.8em; margin-left: 4px;">(${itemTaxRate}% Tax)</small></span>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-right">
                <span class="cart-item-subtotal">${formatCurrency(item.price * item.quantity)}</span>
                <button class="btn-remove" onclick="removeItem(${item.id})">
                    <i class="far fa-trash-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(el);
    });

    updateTotals();
}

function updateTotals() {
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = parseFloat(document.getElementById('discount-input').value) || 0;
    const settings = Storage.get('settings') || { taxRate: 0 };
    
    const discountFactor = (1 - discountPercent / 100);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    
    // Calculate tax based on individual item rates
    let taxAmount = 0;
    currentCart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscounted = itemSubtotal * discountFactor;
        const itemTaxRate = (item.tax !== undefined && item.tax !== null) ? item.tax : 0;
        taxAmount += itemDiscounted * (itemTaxRate / 100);
    });

    const total = taxableAmount + taxAmount;

    document.getElementById('subtotal-val').textContent = formatCurrency(subtotal);
    document.getElementById('tax-val').textContent = formatCurrency(taxAmount);
    document.getElementById('total-val').textContent = formatCurrency(total);
    document.getElementById('tax-label').textContent = `Tax (Individual)`;
}

// Event Listeners
function initFilters() {
    const categories = Storage.get('categories') || ['Frames', 'Sunglasses', 'Lenses', 'Accessories'];
    const container = document.getElementById('category-tabs');
    if (!container) return;

    container.innerHTML = `<button class="tab-btn ${activeCategory === 'All' ? 'active' : ''}" data-category="All">All</button>`;
    
    categories.forEach(cat => {
        container.innerHTML += `<button class="tab-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
    });

    const btns = container.querySelectorAll('.tab-btn');
    btns.forEach((btn) => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            renderProducts();
        };
    });

    // Keyboard shortcuts for categories (Alt + 1, 2, 3...)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && !isNaN(e.key) && e.key > 0) {
            const index = parseInt(e.key) - 1;
            if (btns[index]) {
                btns[index].click();
            }
        }
    });

    const discountInput = document.getElementById('discount-input');
    if (discountInput) discountInput.oninput = updateTotals;
}

function initSearch() {
    const search = document.getElementById('global-search');
    const barcodeIcon = document.querySelector('.search-box .fa-barcode');
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    search.oninput = (e) => {
        const val = e.target.value.trim();
        renderProducts(val);
    };

    // Handle Enter key for hardware scanners when search is focused
    search.onkeydown = (e) => {
        if (e.key === 'Enter') {
            const val = search.value.trim();
            if (val) {
                const product = products.find(p => p.barcode === val);
                if (product) {
                    e.preventDefault();
                    addToCart(product);
                    search.value = '';
                    renderProducts('');
                    flashBarcodeIcon();
                }
            }
        }
    };

    // Global barcode listener (catches scans even when search isn't focused)
    document.addEventListener('keydown', (e) => {
        // Ignore if we are typing in an input (except the search box)
        if (document.activeElement.tagName === 'INPUT' && document.activeElement !== search) {
            return;
        }

        // Ignore modifier keys
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const currentTime = Date.now();
        
        // Barcode scanners usually type very fast (typically < 30ms between keys)
        // We use 100ms to be safe for various scanner configurations
        if (currentTime - lastKeyTime > 100) {
            barcodeBuffer = '';
        }

        if (e.key.length === 1) {
            barcodeBuffer += e.key;
            lastKeyTime = currentTime;
        } else if (e.key === 'Enter') {
            if (barcodeBuffer.length >= 3) {
                const product = products.find(p => p.barcode === barcodeBuffer);
                if (product) {
                    e.preventDefault();
                    addToCart(product);
                    
                    // If we were typing in search, clear it
                    if (document.activeElement === search) {
                        search.value = '';
                        renderProducts('');
                    }
                    
                    flashBarcodeIcon();
                    barcodeBuffer = '';
                }
            }
            // Reset buffer anyway on Enter
            barcodeBuffer = '';
        }
    });

    function flashBarcodeIcon() {
        if (!barcodeIcon) return;
        barcodeIcon.classList.remove('barcode-flash-active');
        void barcodeIcon.offsetWidth; // Trigger reflow
        barcodeIcon.classList.add('barcode-flash-active');
    }
}


function initCheckout() {
    const btn = document.getElementById('checkout-btn');
    if (!btn) return;
    
    btn.onclick = () => {
        if (currentCart.length === 0) {
            showToast('Cart is empty!', 'error');
            return;
        }

        const total = document.getElementById('total-val').textContent;
        const itemCount = currentCart.reduce((sum, item) => sum + item.quantity, 0);

        customConfirm(
            'Confirm Order',
            `Are you sure you want to proceed with <strong>${itemCount} items</strong> totaling <strong>${total}</strong>?`,
            () => {
                const discount = parseFloat(document.getElementById('discount-input').value) || 0;

                // Save session data for checkout
                localStorage.setItem('pos_current_cart', JSON.stringify(currentCart));
                localStorage.setItem('pos_current_discount', discount);
                
                // Redirect to checkout page
                window.location.href = 'checkout.html';
            },
            'info',
            'Complete Order'
        );
    };
}
