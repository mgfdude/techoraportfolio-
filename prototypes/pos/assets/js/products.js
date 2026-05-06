/* products.js */

let products = Storage.get('products') || [];
let categories = Storage.get('categories') || ['Frames', 'Sunglasses', 'Lenses', 'Accessories'];

document.addEventListener('DOMContentLoaded', () => {
    renderProductsTable();
    initSearch();
    initForm();
    initCategoryForm();
    initImageUpload();
    refreshCategorySelects();
    initBulkImport();
    initBarcodeListener();
});

function initBarcodeListener() {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('product-modal');
        if (!modal || modal.classList.contains('hidden')) return;

        // Ignore modifier keys
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const currentTime = Date.now();
        
        // Reset buffer if typing is slow
        if (currentTime - lastKeyTime > 100) {
            barcodeBuffer = '';
        }

        if (e.key.length === 1) {
            barcodeBuffer += e.key;
            lastKeyTime = currentTime;
        } else if (e.key === 'Enter') {
            if (barcodeBuffer.length >= 3) {
                const barcodeInput = document.getElementById('p-barcode');
                if (barcodeInput) {
                    barcodeInput.value = barcodeBuffer;
                    barcodeInput.focus();
                    barcodeBuffer = '';
                    showToast('Barcode scanned!', 'success');
                }
            }
            barcodeBuffer = '';
        }
    });
}

function renderProductsTable(filter = '') {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.category.toLowerCase().includes(filter.toLowerCase()) ||
        (p.barcode && p.barcode.includes(filter))
    );
    
    // Update header count
    const headerTitle = document.querySelector('.header-text h1');
    if (headerTitle) {
        headerTitle.innerHTML = `Product Inventory <span class="item-count-badge">${products.length}</span>`;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        
        let status = 'instock';
        let statusText = 'In Stock';
        if (p.stock <= 0) {
            status = 'outofstock';
            statusText = 'Out of Stock';
        } else if (p.stock < 10) {
            status = 'lowstock';
            statusText = 'Low Stock';
        }

        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="${p.image}" class="product-img-mini">
                    <div class="product-info-cell">
                        <span class="product-name-main">${p.name}</span>
                        <span class="product-tax-hint">Tax: ${p.tax || 0}%</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="barcode-badge">
                    <i class="fas fa-barcode"></i> ${p.barcode || '---'}
                </span>
            </td>
            <td>${p.category}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>${p.stock}</td>
            <td><span class="status-badge ${status}">${statusText}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initSearch() {
    const search = document.getElementById('global-search');
    search.oninput = (e) => renderProductsTable(e.target.value);
}

function openProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    form.reset();
    document.getElementById('p-id').value = '';
    
    // Reset image tabs
    switchImageSource('upload');

    if (id) {
        title.textContent = 'Edit Product';
        const p = products.find(item => item.id == id);
        if (p) {
            document.getElementById('p-id').value = p.id;
            document.getElementById('p-name').value = p.name;
            document.getElementById('p-category').value = p.category;
            document.getElementById('p-price').value = p.price;
            document.getElementById('p-stock').value = p.stock;
            document.getElementById('p-barcode').value = p.barcode || '';
            document.getElementById('p-tax').value = p.tax || 0;
            document.getElementById('p-image-data').value = p.image;
            
            // Set preview
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${p.image}" alt="Preview">`;
            
            // If it's a URL, switch to URL tab
            if (p.image.startsWith('http')) {
                switchImageSource('url');
                document.getElementById('p-image-url').value = p.image;
            }
        }
    } else {
        title.textContent = 'Add New Product';
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<i class="fas fa-image"></i><p>Click to upload</p>`;
        document.getElementById('p-image-data').value = '';
        document.getElementById('p-image-url').value = '';
        document.getElementById('p-tax').value = 0;
    }

    openModal('product-modal');
}

function initForm() {
    const form = document.getElementById('product-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const id = document.getElementById('p-id').value;
        const productName = document.getElementById('p-name').value;
        const isUrlTab = document.getElementById('url-source').classList.contains('hidden') === false;
        const imageUrl = document.getElementById('p-image-url').value;
        const imageData = document.getElementById('p-image-data').value;

        const finalImage = isUrlTab && imageUrl ? imageUrl : (imageData || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop');

        const productData = {
            name: productName,
            category: document.getElementById('p-category').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value),
            barcode: document.getElementById('p-barcode').value.trim(),
            tax: parseFloat(document.getElementById('p-tax').value) || 0,
            image: finalImage
        };

        const actionText = id ? 'update' : 'add';
        customConfirm(
            id ? 'Update Product' : 'Add Product',
            `Are you sure you want to ${actionText} <strong>${productName}</strong>?`,
            () => {
                if (id) {
                    Storage.update('products', id, productData);
                    showToast('Product updated successfully', 'success');
                } else {
                    productData.id = Date.now();
                    products.push(productData);
                    Storage.set('products', products);
                    showToast('Product added successfully', 'success');
                }

                products = Storage.get('products');
                renderProductsTable();
                closeModal();
            },
            'info',
            id ? 'Update Product' : 'Add Product'
        );
    };
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    customConfirm(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        () => {
            Storage.delete('products', id);
            products = Storage.get('products');
            renderProductsTable();
            showToast('Product deleted', 'error');
        },
        'danger',
        'Delete Product'
    );
}

function switchImageSource(source) {
    const uploadBtn = document.querySelector('.tab-btn:nth-child(1)');
    const urlBtn = document.querySelector('.tab-btn:nth-child(2)');
    const uploadSource = document.getElementById('upload-source');
    const urlSource = document.getElementById('url-source');

    if (source === 'upload') {
        uploadBtn.classList.add('active');
        urlBtn.classList.remove('active');
        uploadSource.classList.remove('hidden');
        urlSource.classList.add('hidden');
    } else {
        uploadBtn.classList.remove('active');
        urlBtn.classList.add('active');
        uploadSource.classList.add('hidden');
        urlSource.classList.remove('hidden');
    }
}

function previewUrlImage() {
    const urlInput = document.getElementById('p-image-url');
    const preview = document.getElementById('image-preview');
    const dataInput = document.getElementById('p-image-data');
    
    if (urlInput.value) {
        // Show loading or just update
        preview.innerHTML = `<img src="${urlInput.value}" alt="Preview" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';">`;
        dataInput.value = urlInput.value;
    } else {
        preview.innerHTML = `<i class="fas fa-image"></i><p>Image URL empty</p>`;
        dataInput.value = '';
    }
}

// Add auto-preview on input
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('p-image-url');
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            // Debounce or just preview
            previewUrlImage();
        });
    }
});

function initImageUpload() {
    const preview = document.getElementById('image-preview');
    const fileInput = document.getElementById('p-image-file');
    const dataInput = document.getElementById('p-image-data');
    if (!preview) return;

    preview.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Resize and compress image
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    dataInput.value = compressedBase64;
                    preview.innerHTML = `<img src="${compressedBase64}" alt="Preview">`;
                    document.getElementById('p-image-url').value = '';
                    showToast('Image optimized successfully', 'success');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
}

// Category Management Functions
function openCategoryModal() {
    renderCategoryList();
    openModal('category-modal');
}

function initCategoryForm() {
    const form = document.getElementById('category-form');
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('cat-name');
        const name = input.value.trim();
        
        if (name && !categories.includes(name)) {
            categories.push(name);
            Storage.set('categories', categories);
            input.value = '';
            renderCategoryList();
            refreshCategorySelects();
            showToast('Category added', 'success');
        } else if (categories.includes(name)) {
            showToast('Category already exists', 'error');
        }
    };
}

function renderCategoryList() {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cat}</span>
            <button class="btn-icon delete" onclick="deleteCategory('${cat}')"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
}

function deleteCategory(name) {
    customConfirm(
        'Delete Category',
        `Are you sure you want to delete "${name}"? Products in this category will remain, but the category option will be removed.`,
        () => {
            categories = categories.filter(c => c !== name);
            Storage.set('categories', categories);
            renderCategoryList();
            refreshCategorySelects();
            showToast('Category removed');
        },
        'danger',
        'Delete Category'
    );
}

function refreshCategorySelects() {
    const select = document.getElementById('p-category');
    if (!select) return;
    
    const currentVal = select.value;
    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (categories.includes(currentVal)) {
        select.value = currentVal;
    }
}

function initBulkImport() {
    const fileInput = document.getElementById('bulk-import-input');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const lines = content.split('\n');
            const newProducts = [];
            let importedCount = 0;
            let skippedCount = 0;

            // Skip header if it exists
            const startLine = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('product')) ? 1 : 0;

            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple CSV parsing (splits by comma, handles basic quoted strings if needed, 
                // but here we'll assume a simple Name,Category,Price,Stock,Image format)
                const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                
                if (parts.length >= 4) {
                    const name = parts[0];
                    const category = parts[1];
                    const price = parseFloat(parts[2]);
                    const stock = parseInt(parts[3]);
                    const image = parts[4] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';

                    if (name && category && !isNaN(price) && !isNaN(stock)) {
                        newProducts.push({
                            id: Date.now() + i, // Unique-ish ID
                            name,
                            category,
                            price,
                            stock,
                            barcode: parts[4] || '',
                            tax: parseFloat(parts[5]) || 0,
                            image: parts[6] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
                        });
                        
                        // Auto-add category if it doesn't exist
                        if (!categories.includes(category)) {
                            categories.push(category);
                        }
                        
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            }

            if (newProducts.length > 0) {
                products = [...products, ...newProducts];
                Storage.set('products', products);
                Storage.set('categories', categories);
                
                renderProductsTable();
                refreshCategorySelects();
                showToast(`Imported ${importedCount} products. Skipped ${skippedCount} invalid rows.`, 'success');
            } else {
                showToast('No valid products found in CSV.', 'error');
            }
            
            // Reset input so the same file can be imported again if needed
            fileInput.value = '';
        };
        reader.readAsText(file);
    });
}
