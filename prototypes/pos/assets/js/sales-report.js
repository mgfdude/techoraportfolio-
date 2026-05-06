/* sales-report.js */

// Advanced Mock Data
const salesRecords = [
    { date: '2026-05-01', total_orders: 45, gross_sales: 12000, discount: 500, tax: 920, payment_breakdown: { cash: 4000, upi: 6000, card: 2420 } },
    { date: '2026-05-02', total_orders: 52, gross_sales: 14500, discount: 800, tax: 1096, payment_breakdown: { cash: 5000, upi: 7000, card: 2796 } },
    { date: '2026-05-03', total_orders: 38, gross_sales: 9800, discount: 300, tax: 760, payment_breakdown: { cash: 3000, upi: 5000, card: 2260 } },
    { date: '2026-05-04', total_orders: 60, gross_sales: 18000, discount: 1200, tax: 1344, payment_breakdown: { cash: 6000, upi: 9000, card: 3144 } },
    { date: '2026-04-30', total_orders: 42, gross_sales: 11000, discount: 400, tax: 848, payment_breakdown: { cash: 3500, upi: 5500, card: 2448 } },
    { date: '2026-04-29', total_orders: 35, gross_sales: 9000, discount: 200, tax: 704, payment_breakdown: { cash: 2500, upi: 5000, card: 2004 } },
    { date: '2026-04-28', total_orders: 48, gross_sales: 13000, discount: 600, tax: 992, payment_breakdown: { cash: 4500, upi: 6500, card: 2392 } },
    { date: '2026-04-27', total_orders: 50, gross_sales: 14000, discount: 750, tax: 1060, payment_breakdown: { cash: 4800, upi: 7200, card: 2310 } },
    { date: '2026-04-26', total_orders: 33, gross_sales: 8500, discount: 150, tax: 668, payment_breakdown: { cash: 2000, upi: 4500, card: 2518 } },
    { date: '2026-04-25', total_orders: 55, gross_sales: 16500, discount: 1000, tax: 1240, payment_breakdown: { cash: 5500, upi: 8500, card: 2740 } },
    { date: '2026-04-24', total_orders: 40, gross_sales: 10500, discount: 350, tax: 812, payment_breakdown: { cash: 3200, upi: 5300, card: 2462 } },
    { date: '2026-04-23', total_orders: 47, gross_sales: 12800, discount: 550, tax: 980, payment_breakdown: { cash: 4300, upi: 6400, card: 2530 } },
    { date: '2026-04-22', total_orders: 58, gross_sales: 17500, discount: 1100, tax: 1312, payment_breakdown: { cash: 5900, upi: 8800, card: 3012 } }
];

let filteredData = [...salesRecords];
let salesChart = null;
let currentSort = { column: 'date', direction: 'desc' };
const ROWS_PER_PAGE = 8;
let isExpanded = false;

function toggleLoadMore() {
    isExpanded = !isExpanded;
    const btnText = document.getElementById('load-more-text');
    const btn = btnText.parentElement;
    
    if (isExpanded) {
        btnText.textContent = 'See Less';
        btn.classList.add('active');
    } else {
        btnText.textContent = 'See More';
        btn.classList.remove('active');
    }
    
    renderReport();
}

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSorting();
    renderReport();
});

function initFilters() {
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const dateRange = document.getElementById('date-range').value;
            const paymentFilter = document.getElementById('payment-filter').value;
            
            showLoading();
            
            setTimeout(() => {
                filterData(dateRange, paymentFilter);
                renderReport();
                hideLoading();
                showToast('Report updated!', 'success');
            }, 600);
        });
    }
}

function filterData(range, payment) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    filteredData = salesRecords.filter(record => {
        // Date Filtering
        let dateMatch = true;
        if (range === 'today') dateMatch = record.date === todayStr;
        else if (range === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dateMatch = record.date >= weekAgo;
        } else if (range === 'month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
            dateMatch = record.date >= monthAgo;
        } else if (range === 'year') {
            const yearStart = `${now.getFullYear()}-01-01`;
            dateMatch = record.date >= yearStart;
        }
        
        return dateMatch;
    });
    
    // Sort after filter
    sortData(currentSort.column, currentSort.direction);
}

function initSorting() {
    const headers = document.querySelectorAll('.data-table th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
            
            currentSort = { column, direction };
            
            // Update UI
            headers.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(direction);
            
            sortData(column, direction);
            renderReport();
        });
    });
}

function sortData(column, direction) {
    filteredData.sort((a, b) => {
        let valA, valB;
        
        if (column === 'cash' || column === 'upi' || column === 'card') {
            valA = a.payment_breakdown[column];
            valB = b.payment_breakdown[column];
        } else if (column === 'net_sales') {
            valA = a.gross_sales - a.discount + a.tax;
            valB = b.gross_sales - b.discount + b.tax;
        } else {
            valA = a[column];
            valB = b[column];
        }
        
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function renderReport() {
    const tbody = document.getElementById('sales-report-body');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('sales-report-table');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '';
        table.classList.add('hidden');
        emptyState.classList.remove('hidden');
        updateSummary(0, 0, 0, 0);
        if (salesChart) salesChart.destroy();
        return;
    }
    
    table.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tbody.innerHTML = '';
    
    let totalNet = 0, totalOrders = 0, totalTax = 0, totalDiscount = 0;
    let maxNet = 0;
    
    // First pass for summary and finding max
    filteredData.forEach(r => {
        const net = r.gross_sales - r.discount + r.tax;
        totalNet += net;
        totalOrders += r.total_orders;
        totalTax += r.tax;
        totalDiscount += r.discount;
        if (net > maxNet) maxNet = net;
    });
    
    const displayData = isExpanded ? filteredData : filteredData.slice(0, ROWS_PER_PAGE);
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (filteredData.length <= ROWS_PER_PAGE) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
    
    displayData.forEach(r => {
        const net = r.gross_sales - r.discount + r.tax;
        const tr = document.createElement('tr');
        if (net === maxNet) tr.className = 'highlight-row';
        
        tr.innerHTML = `
            <td>${r.date}</td>
            <td>${r.total_orders}</td>
            <td title="${formatINR(r.gross_sales)}">${formatShortINR(r.gross_sales)}</td>
            <td class="text-danger" title="${formatINR(r.discount)}">-${formatShortINR(r.discount)}</td>
            <td title="${formatINR(r.tax)}">${formatShortINR(r.tax)}</td>
            <td class="font-bold text-primary" title="${formatINR(net)}">${formatShortINR(net)}</td>
            <td title="${formatINR(r.payment_breakdown.cash)}">${formatShortINR(r.payment_breakdown.cash)}</td>
            <td title="${formatINR(r.payment_breakdown.upi)}">${formatShortINR(r.payment_breakdown.upi)}</td>
            <td title="${formatINR(r.payment_breakdown.card)}">${formatShortINR(r.payment_breakdown.card)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    updateSummary(totalNet, totalOrders, totalTax, totalDiscount);
    updateChart();
}

function updateSummary(revenue, orders, tax, discount) {
    document.getElementById('sum-revenue').textContent = formatShortINR(revenue);
    document.getElementById('sum-orders').textContent = orders >= 1000 ? (orders / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : orders;
    document.getElementById('sum-tax').textContent = formatShortINR(tax);
    document.getElementById('sum-discount').textContent = formatShortINR(discount);
}

function updateChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChart) salesChart.destroy();
    
    // Sort by date for chart
    const chartData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(r => r.date),
            datasets: [{
                label: 'Net Sales (₹)',
                data: chartData.map(r => r.gross_sales - r.discount + r.tax),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#007AFF'
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
                            return 'Net Sales: ' + formatINR(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(0,0,0,0.05)' },
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

// Helpers
function formatINR(val) {
    return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShortINR(val) {
    const value = parseFloat(val);
    if (value >= 1000) {
        return '₹' + (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return '₹' + value.toFixed(2);
}

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// Export Functions
function downloadExcel() {
    const headers = ['Date', 'Orders', 'Gross Sales', 'Discount', 'Tax', 'Net Sales', 'Cash', 'UPI', 'Card'];
    const data = filteredData.map(r => {
        const net = r.gross_sales - r.discount + r.tax;
        return [
            r.date,
            r.total_orders,
            r.gross_sales,
            r.discount,
            r.tax,
            net,
            r.payment_breakdown.cash,
            r.payment_breakdown.upi,
            r.payment_breakdown.card
        ];
    });
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Excel/CSV Export started!');
}

function downloadPDF() {
    // Capture current state
    const previousExpanded = isExpanded;
    
    // Expand to show all data
    isExpanded = true;
    renderReport();
    
    preparePrintHeader();
    
    setTimeout(() => {
        window.print();
        showToast('Preparing for print/PDF...', 'success');
        
        // Restore state
        setTimeout(() => {
            isExpanded = previousExpanded;
            const btnText = document.getElementById('load-more-text');
            const btn = btnText.parentElement;
            
            if (isExpanded) {
                btnText.textContent = 'See Less';
                btn.classList.add('active');
            } else {
                btnText.textContent = 'See More';
                btn.classList.remove('active');
            }
            renderReport();
        }, 500);
    }, 500);
}

function preparePrintHeader() {
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
    if (printReportTitle) printReportTitle.textContent = 'Advanced Sales Report';

    const dateRange = document.getElementById('date-range') ? document.getElementById('date-range').value : 'month';
    const paymentFilter = document.getElementById('payment-filter') ? document.getElementById('payment-filter').value : 'all';
    
    let dateText = `Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`;
    let filterText = `Payment Mode: ${paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)}`;

    if (printReportDate) {
        const now = new Date();
        printReportDate.innerHTML = `${dateText} | ${filterText}<br>Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
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

// Simple Toast (if main.js is not included)
function showToast(msg, type = 'info') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}
