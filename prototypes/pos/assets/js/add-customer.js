/* add-customer.js */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-customer-form');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Reset errors
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));

        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const phone = formData.get('phone').trim();

        let isValid = true;

        // Simple validation
        if (!name) {
            showError('name', 'Full name is required');
            isValid = false;
        }
        if (!email || !email.includes('@')) {
            showError('email', 'Valid email is required');
            isValid = false;
        }
        if (!phone) {
            showError('phone', 'Phone number is required');
            isValid = false;
        }

        if (!isValid) return;

        // Disable button & show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Customer...';

        // Simulate save
        setTimeout(() => {
            const customers = Storage.get('customers') || [];
            
            // Check if phone already exists
            if (customers.some(c => c.phone === phone)) {
                showError('phone', 'This phone number is already registered');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Customer';
                return;
            }

            const newCustomer = {
                id: Date.now(),
                name: name,
                email: email,
                phone: phone,
                totalOrders: 0,
                lastAddress: {
                    house: formData.get('house'),
                    street: formData.get('street'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zip: formData.get('zip')
                }
            };

            customers.push(newCustomer);
            Storage.set('customers', customers);

            showToast('Customer added successfully', 'success');

            // Redirect back after a short delay
            setTimeout(() => {
                window.location.href = 'customers.html';
            }, 1000);

        }, 1200);
    });

    function showError(fieldId, message) {
        const group = document.getElementById(fieldId).parentElement;
        group.classList.add('error');
        document.getElementById(`${fieldId}-error`).textContent = message;
    }
});
