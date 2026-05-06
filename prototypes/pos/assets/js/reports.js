/* reports.js */

// Extended Mock Data for Enhanced Analytics
const mockData = {
    sales: [
        { date: '2026-05-01', orders: 45, gross_sales: 12000, discount: 500, tax: 920, payment_breakdown: { cash: 4000, upi: 6000, card: 2420 } },
        { date: '2026-05-02', orders: 52, gross_sales: 14500, discount: 800, tax: 1096, payment_breakdown: { cash: 5000, upi: 7000, card: 2796 } },
        { date: '2026-05-03', orders: 38, gross_sales: 9800, discount: 300, tax: 760, payment_breakdown: { cash: 3000, upi: 5000, card: 2260 } },
        { date: '2026-05-04', orders: 60, gross_sales: 18000, discount: 1200, tax: 1344, payment_breakdown: { cash: 6000, upi: 9000, card: 3144 } },
        { date: '2026-04-30', orders: 42, gross_sales: 11000, discount: 400, tax: 848, payment_breakdown: { cash: 3500, upi: 5500, card: 2448 } },
        { date: '2026-04-29', orders: 35, gross_sales: 9000, discount: 200, tax: 704, payment_breakdown: { cash: 2500, upi: 5000, card: 2004 } },
        { date: '2026-04-28', orders: 48, gross_sales: 13000, discount: 600, tax: 992, payment_breakdown: { cash: 4500, upi: 6500, card: 2392 } }
    ],
    inventory: [
        { name: 'Casual Denim Jacket', category: 'Frames', stock: 15, status: 'In Stock' },
        { name: 'Vintage Oversized Tee', category: 'Sunglasses', stock: 4, status: 'Low Stock' },
        { name: 'High-Waist Cargo Pants', category: 'Accessories', stock: 25, status: 'In Stock' },
        { name: 'Classic Leather Belt', category: 'Accessories', stock: 0, status: 'Out of Stock' },
        { name: 'Streetwear Hoodie', category: 'Frames', stock: 8, status: 'In Stock' }
    ],
    customers: [
        { name: 'Harvey Specter', phone: '9876543210', orders: 20, spent: 45000.00, lastPurchase: '2026-05-04' },
        { name: 'Mike Ross', phone: '9876543211', orders: 15, spent: 32000.00, lastPurchase: '2026-05-01' },
        { name: 'Jessica Pearson', phone: '9876543212', orders: 18, spent: 38000.00, lastPurchase: '2026-05-03' },
        { name: 'Louis Litt', phone: '9876543213', orders: 12, spent: 25000.00, lastPurchase: '2026-05-02' },
        { name: 'Donna Paulsen', phone: '9876543214', orders: 25, spent: 52000.00, lastPurchase: '2026-05-04' },
        { name: 'Rachel Zane', phone: '9876543215', orders: 8, spent: 12000.00, lastPurchase: '2026-04-28' }
    ]
};

let salesChart = null;
let customerChart = null;
let paymentChart = null;
const ROWS_PER_PAGE = 5;
let expandedSections = {
    sales: false,
    customers: false,
    payments: false,
    inventory: false,
    tax: false,
    taxBreakdown: false,
    hsnSummary: false,
    exemptSales: false
};

function toggleLoadMore(section) {
    expandedSections[section] = !expandedSections[section];
    const btnText = document.getElementById(`${section}-load-more-text`);
    const btn = btnText.parentElement;
    
    if (expandedSections[section]) {
        btnText.textContent = 'See Less';
        btn.classList.add('active');
    } else {
        btnText.textContent = 'See More';
        btn.classList.remove('active');
    }
    
    loadDashboard(section);
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initGlobalFilters();
    
    // Initialize Custom Dropdowns
    initCustomDropdown('date-range-dropdown', 'date-range', 'selected-date-range', (val) => {
        const customDateInputs = document.getElementById('custom-date-inputs');
        if (val === 'custom') {
            customDateInputs.classList.remove('hidden');
        } else {
            customDateInputs.classList.add('hidden');
        }
    });

    initCustomDropdown('payment-method-dropdown', 'payment-method-filter', 'selected-payment-method');

    updateExportButtons('sales'); // Initial export state
    updateFilterVisibility('sales'); // Initial filter state
    loadDashboard('sales'); // Initial data load
});

function initTabs() {
    const tabs = document.querySelectorAll('.report-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.target;
            document.querySelectorAll('.report-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(`${target}-section`).classList.add('active');
            
            updateExportButtons(target);
            updateFilterVisibility(target);
            loadDashboard(target);
        });
    });
}

function updateFilterVisibility(tab) {
    const filterBar = document.querySelector('.global-filter-bar');
    const paymentFilter = document.getElementById('payment-method-filter');
    const dateFilter = document.getElementById('date-range');
    const applyBtn = document.getElementById('apply-filters');
    
    if (!paymentFilter || !dateFilter || !filterBar) return;

    const paymentItem = paymentFilter.closest('.filter-item');
    const dateItem = dateFilter.closest('.filter-item');

    if (tab === 'inventory') {
        filterBar.style.display = 'none';
    } else {
        filterBar.style.display = 'flex';
        
        paymentItem.style.display = 'flex';
        dateItem.style.display = 'flex';
        if (applyBtn) applyBtn.style.display = 'inline-flex';
        
        // Optionally hide payment filter for customers/tax if not applicable
        if (tab === 'customers' || tab === 'tax') {
            paymentItem.style.display = 'none';
        }
    }
}

function updateExportButtons(tab) {
    const container = document.getElementById('export-actions');
    if (!container) return;
    
    container.innerHTML = '';
    
    const exportRules = {
        'sales': ['excel', 'pdf'],
        'payments': ['excel', 'pdf'],
        'customers': ['excel'],
        'inventory': [],
        'tax': ['excel', 'pdf']
    };
    
    const allowed = exportRules[tab] || [];
    
    if (allowed.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.style.gap = '12px';
    
    allowed.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary btn-export';
        btn.title = 'Download report data';
        
        if (type === 'excel') {
            btn.innerHTML = `<i class="fas fa-file-excel"></i> Download Excel`;
            btn.onclick = () => handleExport(tab, 'excel');
        } else {
            btn.innerHTML = `<i class="fas fa-file-pdf"></i> Download PDF`;
            btn.onclick = () => handleExport(tab, 'pdf');
        }
        
        container.appendChild(btn);
    });
}

async function handleExport(tab, format) {
    const btn = window.event ? window.event.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';
    
    // Loading State
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Exporting...`;
    }
    
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (format === 'excel') {
        exportToExcel(tab);
    } else {
        // Capture current expanded states
        const previousStates = { ...expandedSections };
        
        // Expand all sections for printing
        Object.keys(expandedSections).forEach(key => {
            expandedSections[key] = true;
        });
        
        // Re-render the current tab with all data
        loadDashboard(tab);
        
        preparePrintHeader(tab);
        
        setTimeout(() => {
            window.print();
            showToast('Preparing PDF for print...', 'success');
            
            // Restore previous states after a short delay
            setTimeout(() => {
                Object.keys(previousStates).forEach(key => {
                    expandedSections[key] = previousStates[key];
                    
                    // Restore button UI
                    const btnText = document.getElementById(`${key}-load-more-text`);
                    if (btnText) {
                        const btn = btnText.parentElement;
                        if (expandedSections[key]) {
                            btnText.textContent = 'See Less';
                            btn.classList.add('active');
                        } else {
                            btnText.textContent = 'See More';
                            btn.classList.remove('active');
                        }
                    }
                });
                loadDashboard(tab);
            }, 500);
        }, 500);
    }
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

function initGlobalFilters() {
    const filterBtn = document.getElementById('apply-filters');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const dateRange = document.getElementById('date-range').value;
            const paymentMethod = document.getElementById('payment-method-filter').value;
            
            let dateInfo = dateRange;
            if (dateRange === 'custom') {
                const start = document.getElementById('start-date').value;
                const end = document.getElementById('end-date').value;
                if (!start || !end) {
                    showToast('Please select both start and end dates', 'error');
                    return;
                }
                dateInfo = `${start} to ${end}`;
            }

            showLoadingState();
            
            setTimeout(() => {
                const activeTab = document.querySelector('.report-tab.active').dataset.target;
                loadDashboard(activeTab);
                showToast(`Analytics updated for ${dateInfo}`, 'success');
            }, 600);
        });
    }
}

function initCustomDropdown(dropdownId, hiddenInputId, textId, callback) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger');
    const triggerIcon = trigger.querySelector('i:first-child');
    const options = dropdown.querySelectorAll('.dropdown-option');
    const hiddenInput = document.getElementById(hiddenInputId);
    const selectedText = document.getElementById(textId);

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d.id !== dropdownId) d.classList.remove('active');
        });
        dropdown.classList.toggle('active');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const text = option.innerText.trim(); // Use innerText to get just text if icon is present
            const iconClass = option.dataset.icon;

            // Update UI
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            if (selectedText) selectedText.textContent = text;
            if (hiddenInput) hiddenInput.value = value;
            
            // Update trigger icon if it exists and option has an icon
            if (triggerIcon && iconClass) {
                triggerIcon.className = iconClass;
            }

            dropdown.classList.remove('active');
            if (callback) callback(value);
        });
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });
}

function loadDashboard(type) {
    showSkeletons(type);
    
    setTimeout(() => {
        switch(type) {
            case 'sales': renderSales(); break;
            case 'customers': renderCustomers(); break;
            case 'payments': renderPayments(); break;
            case 'inventory': renderInventory(); break;
            case 'tax': renderTax(); break;
        }
    }, 400);
}

// --- RENDERERS ---

function renderSales() {
    const allData = mockData.sales;
    const isExpanded = expandedSections.sales;
    const data = isExpanded ? allData : allData.slice(0, ROWS_PER_PAGE);
    
    const loadMoreContainer = document.getElementById('sales-load-more-container');
    if (allData.length <= ROWS_PER_PAGE) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }

    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';
    
    let stats = { revenue: 0, orders: 0, tax: 0, discount: 0, cash: 0, upi: 0, card: 0 };
    
    data.forEach(item => {
        const netSales = item.gross_sales - item.discount + item.tax;
        stats.revenue += netSales;
        stats.orders += item.orders;
        stats.tax += item.tax;
        stats.discount += item.discount;
        stats.cash += item.payment_breakdown.cash;
        stats.upi += item.payment_breakdown.upi;
        stats.card += item.payment_breakdown.card;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td>${item.orders}</td>
            <td title="${formatCurrency(item.gross_sales)}">${formatShortCurrency(item.gross_sales)}</td>
            <td class="text-danger" title="${formatCurrency(item.discount)}">-${formatShortCurrency(item.discount)}</td>
            <td title="${formatCurrency(item.tax)}">${formatShortCurrency(item.tax)}</td>
            <td class="font-bold" title="${formatCurrency(netSales)}">${formatShortCurrency(netSales)}</td>
            <td title="${formatCurrency(item.payment_breakdown.cash)}">${formatShortCurrency(item.payment_breakdown.cash)}</td>
            <td title="${formatCurrency(item.payment_breakdown.upi)}">${formatShortCurrency(item.payment_breakdown.upi)}</td>
            <td title="${formatCurrency(item.payment_breakdown.card)}">${formatShortCurrency(item.payment_breakdown.card)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('total-revenue-val').textContent = formatShortCurrency(stats.revenue);
    document.getElementById('total-orders-val').textContent = stats.orders >= 1000 ? (stats.orders / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : stats.orders;
    document.getElementById('total-tax-val').textContent = formatShortCurrency(stats.tax);
    document.getElementById('total-discount-val').textContent = formatShortCurrency(stats.discount);
    
    initSalesChart(data);
}

function renderCustomers() {
    // Sort by spending to identify top customers
    const allData = [...mockData.customers].sort((a, b) => b.spent - a.spent);
    const isExpanded = expandedSections.customers;
    const data = isExpanded ? allData : allData.slice(0, ROWS_PER_PAGE);

    const loadMoreContainer = document.getElementById('customers-load-more-container');
    if (allData.length <= ROWS_PER_PAGE) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }

    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = '';
    
    let totalSpend = 0;
    let totalOrders = 0;
    
    data.forEach((cust, index) => {
        totalSpend += cust.spent;
        totalOrders += cust.orders;
        
        const tr = document.createElement('tr');
        // Apply gold/silver/bronze highlighting
        if (index === 0) tr.className = 'rank-1';
        else if (index === 1) tr.className = 'rank-2';
        else if (index === 2) tr.className = 'rank-3';
        
        tr.innerHTML = `
            <td>
                ${cust.name} 
                ${index === 0 ? '<i class="fas fa-crown" style="color: #FFD700; margin-left: 8px;"></i>' : ''}
            </td>
            <td>${cust.phone}</td>
            <td>${cust.orders}</td>
            <td class="font-bold" title="${formatCurrency(cust.spent)}">${formatShortCurrency(cust.spent)}</td>
            <td>${cust.lastPurchase}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('total-cust-val').textContent = data.length;
    document.getElementById('top-spend-val').textContent = formatShortCurrency(data[0].spent);
    document.getElementById('avg-orders-val').textContent = (totalOrders / data.length).toFixed(1);
    
    initCustomerChart(data.slice(0, 5));
}

function renderPayments() {
    const sales = mockData.sales;
    let stats = { cash: 0, upi: 0, card: 0, total: 0, count: { cash: 0, upi: 0, card: 0 } };
    
    // Payments section is summary-based so See More might not be needed for the table itself, 
    // but we'll hide the container anyway if rows < ROWS_PER_PAGE
    const loadMoreContainer = document.getElementById('payments-load-more-container');
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';

    sales.forEach(day => {
        stats.cash += day.payment_breakdown.cash;
        stats.upi += day.payment_breakdown.upi;
        stats.card += day.payment_breakdown.card;
        stats.total += (day.payment_breakdown.cash + day.payment_breakdown.upi + day.payment_breakdown.card);
        
        // Mocking count logic
        stats.count.cash += Math.floor(day.orders * 0.3);
        stats.count.upi += Math.floor(day.orders * 0.5);
        stats.count.card += Math.floor(day.orders * 0.2);
    });
    
    document.getElementById('total-cash-val').textContent = formatShortCurrency(stats.cash);
    document.getElementById('total-upi-val').textContent = formatShortCurrency(stats.upi);
    document.getElementById('total-card-val').textContent = formatShortCurrency(stats.card);
    
    const tbody = document.getElementById('payments-table-body');
    tbody.innerHTML = `
        <tr>
            <td><i class="fas fa-money-bill-wave text-success"></i> Cash</td>
            <td>${stats.count.cash}</td>
            <td title="${formatCurrency(stats.cash)}">${formatShortCurrency(stats.cash)}</td>
            <td>${((stats.cash / stats.total) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td><i class="fas fa-mobile-alt text-primary"></i> UPI</td>
            <td>${stats.count.upi}</td>
            <td title="${formatCurrency(stats.upi)}">${formatShortCurrency(stats.upi)}</td>
            <td>${((stats.upi / stats.total) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td><i class="fas fa-credit-card text-warning"></i> Card</td>
            <td>${stats.count.card}</td>
            <td title="${formatCurrency(stats.card)}">${formatShortCurrency(stats.card)}</td>
            <td>${((stats.card / stats.total) * 100).toFixed(1)}%</td>
        </tr>
    `;
    
    initPaymentChart(stats);
}

function renderInventory() {
    const allData = mockData.inventory;
    const isExpanded = expandedSections.inventory;
    const data = isExpanded ? allData : allData.slice(0, ROWS_PER_PAGE);

    const loadMoreContainer = document.getElementById('inventory-load-more-container');
    if (allData.length <= ROWS_PER_PAGE) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }

    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        let statusColor = item.stock === 0 ? 'var(--danger-color)' : (item.stock < 5 ? 'var(--warning-color)' : 'var(--success-color)');
        
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td style="font-weight: 700; color: ${statusColor}">${item.stock}</td>
            <td>
                <span class="status-badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
                    ${item.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTax() {
    const sales = mockData.sales;
    const settings = Storage.get('settings') || {};
    
    const gstDisplay = document.getElementById('report-store-gst');
    if (gstDisplay) {
        if (settings.storeGST) {
            gstDisplay.textContent = `GSTIN: ${settings.storeGST}`;
            gstDisplay.style.display = 'block';
        } else {
            gstDisplay.style.display = 'none';
        }
    }

    const invoiceBody = document.getElementById('tax-table-body');
    const breakdownBody = document.getElementById('tax-breakdown-body');
    const hsnBody = document.getElementById('hsn-body');
    const exemptBody = document.getElementById('exempt-body');

    // Button Containers
    const containers = {
        tax: document.getElementById('tax-load-more-container'),
        taxBreakdown: document.getElementById('tax-breakdown-load-more-container'),
        hsnSummary: document.getElementById('hsn-load-more-container'),
        exemptSales: document.getElementById('exempt-load-more-container')
    };

    invoiceBody.innerHTML = '';
    breakdownBody.innerHTML = '';
    hsnBody.innerHTML = '';
    exemptBody.innerHTML = '';

    let totalTax = 0;
    let totalTaxable = 0;

    let tax12 = { taxable: 0, gst: 0 };
    let tax18 = { taxable: 0, gst: 0 };

    // HSN & Exempt Data
    const hsnData = [
        { hsn: '9004', desc: 'Frames', qty: 20, value: 40000, gst: 7200 },
        { hsn: '9001', desc: 'Lenses', qty: 15, value: 35000, gst: 4200 },
        { hsn: '9005', desc: 'Sunglasses', qty: 10, value: 15000, gst: 1800 },
        { hsn: '9006', desc: 'Contact Lenses', qty: 30, value: 12000, gst: 1440 },
        { hsn: '9007', desc: 'Cases', qty: 50, value: 5000, gst: 600 },
        { hsn: '9008', desc: 'Cleaning Kit', qty: 25, value: 2500, gst: 300 }
    ];

    const exemptData = [
        { service: 'Eye Testing', amount: 5000 },
        { service: 'Consultation', amount: 2000 },
        { service: 'Fitting Service', amount: 1500 },
        { service: 'Home Delivery', amount: 800 },
        { service: 'Repair Service', amount: 1200 },
        { service: 'Frame Alignment', amount: 500 }
    ];

    // MOCK: alternate tax rates for demo
    sales.forEach((day, index) => {
        const taxable = day.gross_sales - day.discount;
        const gst = day.tax;

        totalTax += gst;
        totalTaxable += taxable;

        const rate = index % 2 === 0 ? 12 : 18;

        if (rate === 12) {
            tax12.taxable += taxable;
            tax12.gst += gst;
        } else {
            tax18.taxable += taxable;
            tax18.gst += gst;
        }
    });

    const taxBreakdownData = [
        { rate: '12%', taxable: tax12.taxable, cgst: tax12.gst / 2, sgst: tax12.gst / 2, total: tax12.gst },
        { rate: '18%', taxable: tax18.taxable, cgst: tax18.gst / 2, sgst: tax18.gst / 2, total: tax18.gst }
    ];

    // Slicing Data
    const displayInvoice = expandedSections.tax ? sales : sales.slice(0, ROWS_PER_PAGE);
    const displayBreakdown = expandedSections.taxBreakdown ? taxBreakdownData : taxBreakdownData.slice(0, ROWS_PER_PAGE);
    const displayHSN = expandedSections.hsnSummary ? hsnData : hsnData.slice(0, ROWS_PER_PAGE);
    const displayExempt = expandedSections.exemptSales ? exemptData : exemptData.slice(0, ROWS_PER_PAGE);

    // Button Visibility
    if (containers.tax) containers.tax.style.display = sales.length > ROWS_PER_PAGE ? 'block' : 'none';
    if (containers.taxBreakdown) containers.taxBreakdown.style.display = taxBreakdownData.length > ROWS_PER_PAGE ? 'block' : 'none';
    if (containers.hsnSummary) containers.hsnSummary.style.display = hsnData.length > ROWS_PER_PAGE ? 'block' : 'none';
    if (containers.exemptSales) containers.exemptSales.style.display = exemptData.length > ROWS_PER_PAGE ? 'block' : 'none';

    // RENDER INVOICE TABLE
    displayInvoice.forEach((day) => {
        const taxable = day.gross_sales - day.discount;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#TAX-${day.date.replace(/-/g, '')}</td>
            <td>Daily Summary</td>
            <td title="${formatCurrency(taxable)}">${formatShortCurrency(taxable)}</td>
            <td>${formatCurrency(day.tax)}</td>
            <td>${day.date}</td>
        `;
        invoiceBody.appendChild(tr);
    });

    // RENDER BREAKDOWN TABLE
    displayBreakdown.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.rate}</td>
            <td title="${formatCurrency(row.taxable)}">${formatShortCurrency(row.taxable)}</td>
            <td>${formatCurrency(row.cgst)}</td>
            <td>${formatCurrency(row.sgst)}</td>
            <td>${formatCurrency(row.total)}</td>
        `;
        breakdownBody.appendChild(tr);
    });

    // RENDER HSN TABLE
    displayHSN.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.hsn}</td>
            <td>${row.desc}</td>
            <td>${row.qty}</td>
            <td>${formatCurrency(row.value)}</td>
            <td>${formatCurrency(row.gst)}</td>
        `;
        hsnBody.appendChild(tr);
    });

    // RENDER EXEMPT TABLE
    displayExempt.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.service}</td>
            <td>${formatCurrency(row.amount)}</td>
        `;
        exemptBody.appendChild(tr);
    });

    // SUMMARY
    document.getElementById('gst-total-val').textContent = formatShortCurrency(6700);
    document.getElementById('cgst-val').textContent = formatShortCurrency(3350);
    document.getElementById('sgst-val').textContent = formatShortCurrency(3350);
    document.getElementById('igst-val').textContent = formatCurrency(0);
    document.getElementById('exempt-val').textContent = formatCurrency(0);

    // TAX BREAKDOWN
    breakdownBody.innerHTML = `
        <tr>
            <td>12%</td>
            <td>${formatShortCurrency(tax12.taxable)}</td>
            <td>${formatShortCurrency(tax12.gst / 2)}</td>
            <td>${formatShortCurrency(tax12.gst / 2)}</td>
            <td>${formatShortCurrency(tax12.gst)}</td>
        </tr>
        <tr>
            <td>18%</td>
            <td>${formatShortCurrency(tax18.taxable)}</td>
            <td>${formatShortCurrency(tax18.gst / 2)}</td>
            <td>${formatShortCurrency(tax18.gst / 2)}</td>
            <td>${formatShortCurrency(tax18.gst)}</td>
        </tr>
    `;

    // HSN MOCK
    hsnBody.innerHTML = `
        <tr>
            <td>9004</td>
            <td>Frames</td>
            <td>20</td>
            <td>₹40,000</td>
            <td>₹7,200</td>
        </tr>
        <tr>
            <td>9001</td>
            <td>Lenses</td>
            <td>15</td>
            <td>₹35,000</td>
            <td>₹4,200</td>
        </tr>
    `;

    // EXEMPT MOCK
    exemptBody.innerHTML = `
        <tr>
            <td>Eye Testing</td>
            <td>₹5,000</td>
        </tr>
    `;
}

// --- CHARTS ---

function initSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Net Sales',
                data: data.map(d => d.gross_sales - d.discount + d.tax),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Net Sales: ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { borderDash: [5, 5] },
                    ticks: {
                        callback: function(value) {
                            return value >= 1000 ? (value / 1000) + 'k' : value;
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function initCustomerChart(data) {
    const ctx = document.getElementById('customerBarChart');
    if (!ctx) return;
    if (customerChart) customerChart.destroy();
    
    customerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Total Spending (₹)',
                data: data.map(d => d.spent),
                backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32', '#007AFF', '#34C759'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { display: false } },
                y: { grid: { display: false } }
            }
        }
    });
}

function initPaymentChart(stats) {
    const ctx = document.getElementById('paymentPieChart');
    if (!ctx) return;
    if (paymentChart) paymentChart.destroy();
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'UPI', 'Card'],
            datasets: [{
                data: [stats.cash, stats.upi, stats.card],
                backgroundColor: ['#34C759', '#007AFF', '#FF9500'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });
}

// --- UTILITIES ---

function showSkeletons(type) {
    const tbody = document.getElementById(`${type}-table-body`);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    for(let i=0; i<5; i++) {
        const tr = document.createElement('tr');
        const colCount = document.querySelector(`#${type}-section table thead th`) ? document.querySelectorAll(`#${type}-section table thead th`).length : 3;
        let cols = '';
        for(let j=0; j<colCount; j++) cols += '<td><div class="skeleton"></div></td>';
        tr.innerHTML = cols;
        tbody.appendChild(tr);
    }
}

function showLoadingState() {
    document.querySelectorAll('.report-section').forEach(s => s.style.opacity = '0.6');
}

function exportToExcel(tab) {
    const filename = `Techora_${tab}_Report_${new Date().toISOString().split('T')[0]}.xls`;

    if (tab === 'tax') {
        const sales = mockData.sales;
        let html = `<tr><td colspan="5" class="heading">GST COMPLIANCE REPORT</td></tr>`;
        html += `<tr><td colspan="5">Export Date: ${new Date().toLocaleDateString()}</td></tr>`;
        html += `<tr><td colspan="5"></td></tr>`;

        // 1. TAX RATE BREAKDOWN
        html += `<tr><td colspan="5" class="section-header">1. TAX RATE BREAKDOWN</td></tr>`;
        html += `<tr class="sub-header"><td>Tax Rate</td><td>Taxable Value</td><td>CGST</td><td>SGST</td><td>Total GST</td></tr>`;
        
        let tax12 = { taxable: 0, gst: 0 };
        let tax18 = { taxable: 0, gst: 0 };

        sales.forEach((day, index) => {
            const taxable = day.gross_sales - day.discount;
            const gst = day.tax;
            const rate = index % 2 === 0 ? 12 : 18;
            if (rate === 12) {
                tax12.taxable += taxable;
                tax12.gst += gst;
            } else {
                tax18.taxable += taxable;
                tax18.gst += gst;
            }
        });

        html += `<tr><td>12%</td><td>${tax12.taxable.toFixed(2)}</td><td>${(tax12.gst/2).toFixed(2)}</td><td>${(tax12.gst/2).toFixed(2)}</td><td>${tax12.gst.toFixed(2)}</td></tr>`;
        html += `<tr><td>18%</td><td>${tax18.taxable.toFixed(2)}</td><td>${(tax18.gst/2).toFixed(2)}</td><td>${(tax18.gst/2).toFixed(2)}</td><td>${tax18.gst.toFixed(2)}</td></tr>`;
        html += `<tr><td colspan="5"></td></tr>`;

        // 2. INVOICE GST REPORT
        html += `<tr><td colspan="5" class="section-header">2. INVOICE GST REPORT</td></tr>`;
        html += `<tr class="sub-header"><td>Invoice ID</td><td>Customer</td><td>Taxable Amount</td><td>Tax (GST)</td><td>Date</td></tr>`;
        sales.forEach(day => {
            const taxable = day.gross_sales - day.discount;
            html += `<tr><td>#TAX-${day.date.replace(/-/g, '')}</td><td>Daily Summary</td><td>${taxable.toFixed(2)}</td><td>${day.tax.toFixed(2)}</td><td>${day.date}</td></tr>`;
        });
        html += `<tr><td colspan="5"></td></tr>`;

        // 3. HSN SUMMARY
        html += `<tr><td colspan="5" class="section-header">3. HSN SUMMARY</td></tr>`;
        html += `<tr class="sub-header"><td>HSN</td><td>Description</td><td>Qty</td><td>Value</td><td>GST</td></tr>`;
        html += `<tr><td>9004</td><td>Frames</td><td>20</td><td>40000.00</td><td>7200.00</td></tr>`;
        html += `<tr><td>9001</td><td>Lenses</td><td>15</td><td>35000.00</td><td>4200.00</td></tr>`;
        html += `<tr><td colspan="5"></td></tr>`;

        // 4. EXEMPT SALES
        html += `<tr><td colspan="5" class="section-header">4. EXEMPT SALES</td></tr>`;
        html += `<tr class="sub-header"><td>Service</td><td colspan="4">Amount</td></tr>`;
        html += `<tr><td>Eye Testing</td><td colspan="4">5000.00</td></tr>`;

        downloadExcel(html, filename);
        showToast("Comprehensive GST Report exported!", "success");
        return;
    }

    let data = [];
    switch(tab) {
        case 'sales': data = mockData.sales; break;
        case 'customers': data = mockData.customers; break;
        case 'payments': data = [{ Method: 'Cash', Amount: 4500 }, { Method: 'UPI', Amount: 8400 }, { Method: 'Card', Amount: 6200 }]; break;
    }
    
    downloadExcel(data, filename);
    showToast(`${tab.charAt(0).toUpperCase() + tab.slice(1)} report exported!`, 'success');
}

function preparePrintHeader(tab) {
    const settings = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('settings') : (JSON.parse(localStorage.getItem('pos_settings')) || {});
    const storeName = settings.storeName || 'Techora POS';
    const storeTagline = settings.storeTagline || 'Made by <a href="https://techora.in" target="_blank" style="color: inherit; text-decoration: underline;">https://techora.in</a>';
    const storeGST = settings.storeGST || '';

    const printStoreName = document.getElementById('print-store-name');
    const printStoreDetails = document.getElementById('print-store-details');
    const printReportTitle = document.getElementById('print-report-title');
    const printReportDate = document.getElementById('print-report-date');
    const printReportGST = document.getElementById('print-report-gst');

    if (printStoreName) printStoreName.textContent = storeName;
    if (printStoreDetails) printStoreDetails.innerHTML = storeTagline;
    const printLogoImg = document.getElementById('print-logo-img');
    if (printLogoImg && settings.storeLogo) printLogoImg.src = settings.storeLogo;
    
    const dateRange = document.getElementById('date-range') ? document.getElementById('date-range').value : 'month';
    let dateText = `Report Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`;
    
    if (dateRange === 'custom') {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;
        if (start && end) dateText = `Report Period: ${start} to ${end}`;
    }

    if (printReportTitle) {
        const tabNames = {
            'sales': 'Sales & Revenue Report',
            'customers': 'Customer Analytics Report',
            'payments': 'Payment Distribution Report',
            'inventory': 'Inventory Status Report',
            'tax': 'GST Compliance Report'
        };
        printReportTitle.textContent = tabNames[tab] || 'Report Summary';
    }

    if (printReportDate) {
        const now = new Date();
        printReportDate.innerHTML = `${dateText}<br>Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }

    if (printReportGST) {
        if (storeGST) {
            printReportGST.textContent = `GSTIN: ${storeGST}`;
            printReportGST.style.display = 'block';
        } else {
            printReportGST.style.display = 'none';
        }
    }
}
