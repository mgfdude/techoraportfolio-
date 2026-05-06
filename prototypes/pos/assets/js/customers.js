/* customers.js */

let customers = Storage.get('customers') || [];

document.addEventListener('DOMContentLoaded', () => {
    renderCustomersTable();
    initSearch();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'pos_customers') {
            customers = JSON.parse(e.newValue) || [];
            renderCustomersTable(document.getElementById('global-search')?.value || '');
        }
    });
});

function renderCustomersTable(filter = '') {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.email.toLowerCase().includes(filter.toLowerCase()) ||
        c.phone.includes(filter)
    );

    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong class="clickable-name" onclick="viewCustomerHistory(${c.id})">${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.totalOrders}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" title="View Profile" onclick="viewCustomerHistory(${c.id})"><i class="fas fa-user"></i></button>
                    <button class="btn-icon delete" title="Delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initSearch() {
    const globalSearch = document.getElementById('global-search');
    const panelSearch = document.getElementById('customer-search');
    
    const handleSearch = (e) => {
        const value = e.target.value;
        
        // Sync the other search input if it exists
        if (e.target === globalSearch && panelSearch) {
            panelSearch.value = value;
        } else if (e.target === panelSearch && globalSearch) {
            globalSearch.value = value;
        }
        
        renderCustomersTable(value);
    };

    if (globalSearch) {
        globalSearch.oninput = handleSearch;
    }
    
    if (panelSearch) {
        panelSearch.oninput = handleSearch;
    }
}

function deleteCustomer(id) {
    customConfirm(
        'Delete Customer',
        'Are you sure you want to delete this customer?',
        () => {
            Storage.delete('customers', id);
            customers = Storage.get('customers');
            renderCustomersTable();
            showToast('Customer removed');
        }
    );
}

function viewCustomerHistory(id) {
    const c = customers.find(item => item.id == id);
    if (!c) return;

    // Set basic info
    document.getElementById('hist-name').textContent = c.name;
    document.getElementById('hist-email').textContent = c.email;
    document.getElementById('hist-phone').textContent = c.phone;
    
    // Set Avatar (Initials)
    const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const avatarEl = document.getElementById('hist-avatar');
    if (avatarEl) avatarEl.textContent = initials.substring(0, 2);
    
    // Set address
    const addrEl = document.getElementById('hist-address');
    if (addrEl) {
        if (c.lastAddress) {
            const a = c.lastAddress;
            addrEl.textContent = `${a.house ? a.house + ', ' : ''}${a.street || ''}${a.city ? ', ' + a.city : ''}${a.state ? ', ' + a.state : ''}${a.zip ? ' ' + a.zip : ''}`;
        } else {
            addrEl.textContent = 'No address recorded yet.';
        }
    }

    // Load orders
    const allOrders = Storage.get('orders') || [];
    const customerOrders = allOrders.filter(o => o.customerPhone === c.phone);
    
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';

    if (customerOrders.length === 0) {
        list.innerHTML = `
            <div class="empty-history-state">
                <i class="fas fa-receipt"></i>
                <h5>No purchases yet</h5>
                <p>Orders will appear here after checkout</p>
            </div>
        `;
    } else {
        customerOrders.reverse().forEach(order => {
            const itemNames = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
            const orderDate = new Date(order.date);
            const dateStr = orderDate.toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const div = document.createElement('div');
            div.className = 'history-item';
            div.style.cursor = 'pointer';
            div.onclick = () => viewOrderDetails(order.id);
            div.innerHTML = `
                <div class="hist-header">
                    <span class="hist-date">${dateStr} • ${timeStr}</span>
                    <span class="hist-id">${order.id}</span>
                </div>
                <div class="hist-items">${itemNames}</div>
                <div class="hist-footer">
                    <span class="hist-total-label">Total</span>
                    <span class="hist-total">${order.total}</span>
                </div>
            `;
            list.appendChild(div);
        });
    }

    openModal('history-modal');
}

function viewOrderDetails(orderId) {
    const allOrders = Storage.get('orders') || [];
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    // Set order info
    document.getElementById('detail-order-id').textContent = order.id;
    const orderDate = new Date(order.date);
    document.getElementById('detail-order-date').textContent = `Date: ${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

    // Load items
    const itemsList = document.getElementById('detail-items-list');
    itemsList.innerHTML = '';

    let subtotal = 0;
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'detail-item-row';
        itemDiv.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">x${item.quantity}</span>
            </div>
            <span class="item-price">${formatCurrency(itemTotal)}</span>
        `;
        itemsList.appendChild(itemDiv);
    });

    // Calculate totals if not present in order object
    // Assuming standard tax rate if not saved in order
    const settings = Storage.get('settings') || { taxRate: 0 };
    
    // We try to reconstruct from the total string if possible, 
    // but better to just show the items and the saved total.
    // However, for a "summary" we should show the breakdown.
    
    // Check if we have subtotal/tax in order object (older orders might not have it)
    const grandTotalVal = parseFloat(order.total.replace(/[^0-9.-]+/g,""));
    
    document.getElementById('detail-subtotal').textContent = formatCurrency(subtotal);
    
    // Simplified: show tax as the difference if we don't have it explicitly
    const taxAmount = grandTotalVal - subtotal;
    document.getElementById('detail-tax').textContent = formatCurrency(taxAmount > 0 ? taxAmount : 0);
    document.getElementById('detail-discount').textContent = formatCurrency(0); // For now
    document.getElementById('detail-total').textContent = order.total;

    // Address
    const addrEl = document.getElementById('detail-address');
    if (order.address) {
        const a = order.address;
        addrEl.textContent = `${a.house ? a.house + ', ' : ''}${a.street || ''}${a.city ? ', ' + a.city : ''}${a.state ? ', ' + a.state : ''}${a.zip ? ' ' + a.zip : ''}`;
    } else {
        addrEl.textContent = 'No address provided';
    }

    openModal('order-detail-modal');
}

function printCurrentOrder() {
    window.print();
}

function exportCustomers() {
    const data = Storage.get('customers') || [];
    if (data.length === 0) {
        showToast('No customer data to export', 'error');
        return;
    }

    const processedData = data.map(c => {
        const { lastAddress, ...rest } = c;
        return {
            ...rest,
            address: lastAddress ? `${lastAddress.house || ''} ${lastAddress.street || ''} ${lastAddress.city || ''} ${lastAddress.state || ''} ${lastAddress.zip || ''}`.trim() : 'N/A'
        };
    });

    const filename = `customers_directory_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(processedData, filename);
    showToast('Customer directory exported successfully', 'success');
}
