// Sistema de Gestión de Inventario
class InventorySystem {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.editingProductId = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    // Gestión de datos
    loadData() {
        // Cargar usuarios (en un sistema real, esto estaría en una base de datos)
        const defaultUsers = [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrador' },
            { id: 2, username: 'usuario', password: '123456', name: 'Usuario General' }
        ];

        if (!localStorage.getItem('inventory_users')) {
            localStorage.setItem('inventory_users', JSON.stringify(defaultUsers));
        }

        // Cargar productos
        const savedProducts = localStorage.getItem('inventory_products');
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
        } else {
            // Datos de ejemplo
            this.products = [
                {
                    id: 1,
                    code: 'PROD001',
                    name: 'Laptop Dell Inspiron',
                    category: 'Electrónicos',
                    stock: 15,
                    minStock: 5,
                    price: 899.99,
                    description: 'Laptop Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD'
                },
                {
                    id: 2,
                    code: 'PROD002',
                    name: 'Mouse Inalámbrico Logitech',
                    category: 'Accesorios',
                    stock: 3,
                    minStock: 10,
                    price: 25.50,
                    description: 'Mouse inalámbrico Logitech M185, color negro'
                },
                {
                    id: 3,
                    code: 'PROD003',
                    name: 'Teclado Mecánico RGB',
                    category: 'Accesorios',
                    stock: 0,
                    minStock: 5,
                    price: 79.99,
                    description: 'Teclado mecánico con retroiluminación RGB'
                },
                {
                    id: 4,
                    code: 'PROD004',
                    name: 'Monitor Samsung 24"',
                    category: 'Monitores',
                    stock: 8,
                    minStock: 3,
                    price: 199.99,
                    description: 'Monitor Samsung 24 pulgadas, Full HD, IPS'
                }
            ];
            this.saveProducts();
        }

        // Cargar usuario autenticado
        const savedUser = localStorage.getItem('inventory_currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    saveProducts() {
        localStorage.setItem('inventory_products', JSON.stringify(this.products));
    }

    // Autenticación
    login(username, password) {
        const users = JSON.parse(localStorage.getItem('inventory_users'));
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('inventory_currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('inventory_currentUser');
        this.showLoginScreen();
    }

    checkAuthentication() {
        if (this.currentUser) {
            this.showDashboard();
        } else {
            this.showLoginScreen();
        }
    }

    // Gestión de pantallas
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('dashboardScreen').classList.add('d-none');
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').classList.add('d-none');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('dashboardScreen').classList.remove('d-none');
        document.getElementById('userWelcome').textContent = this.currentUser.name;
        this.updateStats();
        this.renderProducts();
        this.loadCategories();
    }

    // Gestión de productos
    getProductStats() {
        const total = this.products.length;
        const inStock = this.products.filter(p => p.stock > p.minStock).length;
        const lowStock = this.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
        const outOfStock = this.products.filter(p => p.stock === 0).length;

        return { total, inStock, lowStock, outOfStock };
    }

    updateStats() {
        const stats = this.getProductStats();
        document.getElementById('totalProducts').textContent = stats.total;
        document.getElementById('inStock').textContent = stats.inStock;
        document.getElementById('lowStock').textContent = stats.lowStock;
        document.getElementById('outOfStock').textContent = stats.outOfStock;
    }

    getProductStatus(product) {
        if (product.stock === 0) return 'outstock';
        if (product.stock <= product.minStock) return 'lowstock';
        return 'instock';
    }

    getStatusLabel(status) {
        const labels = {
            'instock': 'En Stock',
            'lowstock': 'Stock Bajo',
            'outstock': 'Sin Stock'
        };
        return labels[status] || 'Desconocido';
    }

    renderProducts(productsToRender = null) {
        const products = productsToRender || this.products;
        const tbody = document.getElementById('productsTable');
        const noProductsDiv = document.getElementById('noProducts');

        if (products.length === 0) {
            tbody.innerHTML = '';
            noProductsDiv.classList.remove('d-none');
            return;
        }

        noProductsDiv.classList.add('d-none');

        tbody.innerHTML = products.map(product => {
            const status = this.getProductStatus(product);
            return `
                <tr>
                    <td><strong>${product.code}</strong></td>
                    <td>
                        <div>
                            <strong>${product.name}</strong>
                            ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
                        </div>
                    </td>
                    <td>${product.category}</td>
                    <td>
                        <span class="fw-bold ${product.stock === 0 ? 'text-danger' : product.stock <= product.minStock ? 'text-warning' : 'text-success'}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>${product.minStock}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>
                        <span class="status-badge status-${status}">
                            ${this.getStatusLabel(status)}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action btn-qr" onclick="inventorySystem.showProductQR(${product.id})" title="Ver QR">
                            <i class="bi bi-qr-code"></i>
                        </button>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="inventorySystem.editProduct(${product.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="inventorySystem.confirmDeleteProduct(${product.id})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadCategories() {
        const categories = [...new Set(this.products.map(p => p.category))].sort();
        const categoryFilter = document.getElementById('categoryFilter');

        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });
    }

    filterProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        let filteredProducts = this.products.filter(product => {
            const matchesSearch = !searchTerm ||
                product.name.toLowerCase().includes(searchTerm) ||
                product.code.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm);

            const matchesCategory = !categoryFilter || product.category === categoryFilter;

            let matchesStock = true;
            if (stockFilter === 'instock') {
                matchesStock = product.stock > product.minStock;
            } else if (stockFilter === 'lowstock') {
                matchesStock = product.stock > 0 && product.stock <= product.minStock;
            } else if (stockFilter === 'outstock') {
                matchesStock = product.stock === 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.renderProducts(filteredProducts);
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        this.renderProducts();
    }

    openAddProductModal() {
        console.log('Abriendo modal para agregar producto'); // Debug
        this.editingProductId = null;

        // Limpiar cualquier modal existente
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // Cambiar título
        document.getElementById('modalTitle').textContent = 'Agregar Producto';

        // Limpiar formulario
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';

        // Limpiar validaciones
        this.clearValidation();

        // Mostrar modal
        const modalElement = document.getElementById('productModal');

        // Destruir instancia existente si existe
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }

        // Crear nueva instancia y mostrar
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });
        modal.show();
    }

    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        this.editingProductId = id;

        // Limpiar cualquier modal existente
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        document.getElementById('modalTitle').textContent = 'Editar Producto';

        // Llenar el formulario
        document.getElementById('productId').value = product.id;
        document.getElementById('productCode').value = product.code;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productMinStock').value = product.minStock;
        document.getElementById('productDescription').value = product.description || '';

        // Limpiar validaciones
        this.clearValidation();

        const modalElement = document.getElementById('productModal');

        // Destruir instancia existente si existe
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }

        // Crear nueva instancia y mostrar
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });
        modal.show();
    }

    saveProduct() {
        console.log('Ejecutando saveProduct()'); // Debug

        if (!this.validateProductForm()) {
            console.log('Validación falló'); // Debug
            return;
        }

        console.log('Validación exitosa, procesando datos'); // Debug

        const formData = {
            code: document.getElementById('productCode').value.trim().toUpperCase(),
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            minStock: parseInt(document.getElementById('productMinStock').value),
            description: document.getElementById('productDescription').value.trim()
        };

        console.log('Datos del formulario:', formData); // Debug

        if (this.editingProductId) {
            // Editar producto existente
            const productIndex = this.products.findIndex(p => p.id === this.editingProductId);
            if (productIndex !== -1) {
                // Verificar código duplicado (excluyendo el producto actual)
                const codeExists = this.products.some(p => p.code === formData.code && p.id !== this.editingProductId);
                if (codeExists) {
                    this.showValidationError('productCode', 'Este código ya existe');
                    return;
                }

                this.products[productIndex] = { ...this.products[productIndex], ...formData };
            }
        } else {
            // Agregar nuevo producto
            // Verificar código duplicado
            const codeExists = this.products.some(p => p.code === formData.code);
            if (codeExists) {
                this.showValidationError('productCode', 'Este código ya existe');
                return;
            }

            const newProduct = {
                id: Date.now(), // ID simple basado en timestamp
                ...formData
            };
            this.products.push(newProduct);
        }

        this.saveProducts();
        this.updateStats();
        this.renderProducts();
        this.loadCategories();

        // Cerrar modal correctamente
        const modalElement = document.getElementById('productModal');
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.hide();
        }

        // Limpiar el backdrop manualmente si queda
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
        }, 300);

        // Mostrar mensaje de éxito
        this.showSuccessMessage(this.editingProductId ? 'Producto actualizado correctamente' : 'Producto agregado correctamente');
    }

    validateProductForm() {
        let isValid = true;
        this.clearValidation();

        // Validar código
        const code = document.getElementById('productCode').value.trim();
        if (!code) {
            this.showValidationError('productCode', 'El código es requerido');
            isValid = false;
        }

        // Validar nombre
        const name = document.getElementById('productName').value.trim();
        if (!name) {
            this.showValidationError('productName', 'El nombre es requerido');
            isValid = false;
        }

        // Validar categoría
        const category = document.getElementById('productCategory').value.trim();
        if (!category) {
            this.showValidationError('productCategory', 'La categoría es requerida');
            isValid = false;
        }

        // Validar precio
        const price = parseFloat(document.getElementById('productPrice').value);
        if (isNaN(price) || price < 0) {
            this.showValidationError('productPrice', 'El precio debe ser un número válido mayor o igual a 0');
            isValid = false;
        }

        // Validar stock
        const stock = parseInt(document.getElementById('productStock').value);
        if (isNaN(stock) || stock < 0) {
            this.showValidationError('productStock', 'El stock debe ser un número entero mayor o igual a 0');
            isValid = false;
        }

        // Validar stock mínimo
        const minStock = parseInt(document.getElementById('productMinStock').value);
        if (isNaN(minStock) || minStock < 0) {
            this.showValidationError('productMinStock', 'El stock mínimo debe ser un número entero mayor o igual a 0');
            isValid = false;
        }

        return isValid;
    }

    showValidationError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('is-invalid');

        // Remover feedback anterior si existe
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Agregar nuevo mensaje de error
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);
    }

    clearValidation() {
        const fields = ['productCode', 'productName', 'productCategory', 'productPrice', 'productStock', 'productMinStock'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.classList.remove('is-invalid', 'is-valid');

            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        });
    }

    confirmDeleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        document.getElementById('confirmMessage').textContent =
            `¿Está seguro que desea eliminar el producto "${product.name}" (${product.code})?`;

        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();

        // Configurar el botón de confirmación
        document.getElementById('confirmDeleteBtn').onclick = () => {
            this.deleteProduct(id);
            modal.hide();
        };
    }

    deleteProduct(id) {
        const productIndex = this.products.findIndex(p => p.id === id);
        if (productIndex !== -1) {
            this.products.splice(productIndex, 1);
            this.saveProducts();
            this.updateStats();
            this.renderProducts();
            this.loadCategories();
            this.showSuccessMessage('Producto eliminado correctamente');
        }
    }

    showSuccessMessage(message) {
        // Crear o mostrar un toast de éxito
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2 color-white"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remover el toast después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Función para mostrar alertas generales
    showAlert(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        let bgClass = 'bg-info';
        let iconClass = 'bi-info-circle-fill';

        switch (type) {
            case 'success':
                bgClass = 'bg-success';
                iconClass = 'bi-check-circle-fill';
                break;
            case 'warning':
                bgClass = 'bg-warning text-dark';
                iconClass = 'bi-exclamation-triangle-fill';
                break;
            case 'error':
            case 'danger':
                bgClass = 'bg-danger';
                iconClass = 'bi-x-circle-fill';
                break;
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white ${bgClass} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${iconClass} me-2 color-white"></i>${message}
                </div>
                <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remover el toast después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // Event Listeners
    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (this.login(username, password)) {
                this.showDashboard();
            } else {
                const errorDiv = document.getElementById('loginError');
                errorDiv.textContent = 'Usuario o contraseña incorrectos';
                errorDiv.classList.remove('d-none');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Agregar producto
        document.getElementById('addProductBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openAddProductModal();
        });

        // Guardar producto
        document.getElementById('saveProductBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón guardar presionado'); // Debug
            this.saveProduct();
        });

        // Filtros
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterProducts();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('stockFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Validación en tiempo real para el formulario de productos
        const productFields = ['productCode', 'productName', 'productCategory', 'productPrice', 'productStock', 'productMinStock'];
        productFields.forEach(fieldId => {
            document.getElementById(fieldId).addEventListener('blur', () => {
                this.validateField(fieldId);
            });
        });

        // Formatear código en mayúsculas
        document.getElementById('productCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Prevenir valores negativos en campos numéricos
        ['productPrice', 'productStock', 'productMinStock'].forEach(fieldId => {
            document.getElementById(fieldId).addEventListener('input', (e) => {
                if (parseFloat(e.target.value) < 0) {
                    e.target.value = 0;
                }
            });
        });

        // Configurar eventos QR
        this.setupQREvents();
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (fieldId) {
            case 'productCode':
                if (!value) {
                    isValid = false;
                    message = 'El código es requerido';
                }
                break;
            case 'productName':
                if (!value) {
                    isValid = false;
                    message = 'El nombre es requerido';
                }
                break;
            case 'productCategory':
                if (!value) {
                    isValid = false;
                    message = 'La categoría es requerida';
                }
                break;
            case 'productPrice':
                const price = parseFloat(value);
                if (isNaN(price) || price < 0) {
                    isValid = false;
                    message = 'El precio debe ser un número válido mayor o igual a 0';
                }
                break;
            case 'productStock':
                const stock = parseInt(value);
                if (isNaN(stock) || stock < 0) {
                    isValid = false;
                    message = 'El stock debe ser un número entero mayor o igual a 0';
                }
                break;
            case 'productMinStock':
                const minStock = parseInt(value);
                if (isNaN(minStock) || minStock < 0) {
                    isValid = false;
                    message = 'El stock mínimo debe ser un número entero mayor o igual a 0';
                }
                break;
        }

        // Limpiar validación anterior
        field.classList.remove('is-invalid', 'is-valid');
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Aplicar nueva validación
        if (value && !isValid) {
            this.showValidationError(fieldId, message);
        } else if (value && isValid) {
            field.classList.add('is-valid');
        }
    }

    // Funcionalidad QR
    showProductQR(productId) {
        console.log('Mostrando QR para producto ID:', productId);

        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showAlert('Producto no encontrado', 'error');
            return;
        }

        console.log('Producto encontrado:', product);

        // Actualizar información del producto en el modal
        document.getElementById('qrProductName').textContent = product.name;
        document.getElementById('qrProductCode').textContent = product.code;
        document.getElementById('qrProductStock').textContent = product.stock;

        // Crear datos del QR más simples para mejor escaneo
        const qrData = product.code; // Solo el código para facilitar el escaneo
        console.log('Datos QR a generar:', qrData);

        // Guardar código del producto para descarga
        this.currentProductCode = product.code;

        // Limpiar referencias anteriores
        this.currentQRCanvas = null;
        this.currentQRImage = null;

        const qrDisplay = document.getElementById('qrCodeDisplay');
        qrDisplay.innerHTML = '<p class="text-info"><i class="bi bi-hourglass-split"></i> Generando código QR...</p>'; // Mostrar loading

        // Usar nuestro generador QR simple
        try {
            console.log('Generando QR con implementación simple...');

            // Limpiar el contenido anterior
            qrDisplay.innerHTML = '';

            // Generar QR usando nuestra función simple
            const qrImg = window.createSimpleQR(qrData, 256);

            // Configurar CORS
            qrImg.crossOrigin = 'anonymous';

            qrImg.onload = () => {
                console.log('✅ QR generado exitosamente');

                try {
                    // Crear canvas para poder descargar la imagen
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 256;

                    // Dibujar la imagen en el canvas
                    ctx.drawImage(qrImg, 0, 0, 256, 256);

                    // Guardar el canvas para descarga
                    this.currentQRCanvas = canvas;
                    this.currentQRImage = null; // Limpiar imagen anterior

                    console.log('🎯 Canvas QR creado correctamente');

                } catch (canvasCreateError) {
                    console.warn('⚠️ Error creando canvas, usando imagen directa:', canvasCreateError);
                    this.currentQRImage = qrImg;
                    this.currentQRCanvas = null;
                }

                // Contenedor para centrar la imagen
                const qrContainer = document.createElement('div');
                qrContainer.className = 'text-center';
                qrContainer.appendChild(qrImg);

                // Agregar texto del código debajo del QR
                const codeLabel = document.createElement('div');
                codeLabel.className = 'mt-3 text-center';
                codeLabel.innerHTML = `
                    <div class="btn btn-primary btn-sm">
                        <i class="bi bi-upc-scan"></i> ${product.code}
                    </div>
                `;
                qrContainer.appendChild(codeLabel);

                qrDisplay.appendChild(qrContainer);

                // Guardar la imagen para descargar
                this.currentQRImage = qrImg;
            };

            qrImg.onerror = () => {
                console.log('Fallback: mostrando código sin imagen QR');
                qrDisplay.innerHTML = `
                    <div class="alert alert-info text-center">
                        <h6><i class="bi bi-qr-code"></i> Código del Producto</h6>
                        <div class="badge bg-primary fs-4 px-4 py-3 mb-3">${product.code}</div>
                        <p><strong>Stock:</strong> ${product.stock} unidades</p>
                        <small class="text-muted">Código QR no disponible sin conexión a internet</small>
                    </div>
                `;
            };

            // Agregar la imagen inmediatamente (se cargará en background)
            const qrContainer = document.createElement('div');
            qrContainer.className = 'text-center';
            qrContainer.appendChild(qrImg);
            qrDisplay.appendChild(qrContainer);

        } catch (error) {
            console.error('Error generando QR:', error);
            qrDisplay.innerHTML = `
                <div class="alert alert-info text-center">
                    <h6><i class="bi bi-qr-code"></i> Código del Producto</h6>
                    <div class="badge bg-primary fs-4 px-4 py-3 mb-3">${product.code}</div>
                    <p><strong>Stock:</strong> ${product.stock} unidades</p>
                    <small class="text-muted">Error generando QR: ${error.message}</small>
                </div>
            `;
        }

        // Mostrar modal
        try {
            const modalElement = document.getElementById('qrModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Modal QR mostrado');
        } catch (error) {
            console.error('Error mostrando modal:', error);
            this.showAlert('Error mostrando el modal QR', 'error');
        }
    }

    downloadQR() {
        console.log('🔽 Intentando descargar QR...');
        console.log('Canvas disponible:', !!this.currentQRCanvas);
        console.log('Imagen disponible:', !!this.currentQRImage);
        console.log('Código producto:', this.currentProductCode);

        try {
            if (this.currentQRCanvas) {
                // Descargar desde canvas
                console.log('📥 Descargando desde canvas...');
                const link = document.createElement('a');
                const productCode = this.currentProductCode || 'producto';
                link.download = `qr-${productCode}.png`;

                try {
                    link.href = this.currentQRCanvas.toDataURL('image/png');

                    // Agregar al DOM, hacer clic y remover
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showAlert('Código QR descargado exitosamente', 'success');
                    console.log('✅ QR descargado desde canvas exitosamente');
                    return;

                } catch (canvasError) {
                    console.error('❌ Error con canvas:', canvasError);
                    this.generateFallbackQR();
                    return;
                }

            } else if (this.currentQRImage && this.currentQRImage.complete) {
                // Convertir imagen a canvas y descargar
                console.log('🖼️ Intentando conversión imagen -> canvas...');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = this.currentQRImage.naturalWidth || 256;
                canvas.height = this.currentQRImage.naturalHeight || 256;

                // Intentar dibujar la imagen
                try {
                    ctx.drawImage(this.currentQRImage, 0, 0);

                    const link = document.createElement('a');
                    const productCode = this.currentProductCode || 'producto';
                    link.download = `qr-${productCode}.png`;
                    link.href = canvas.toDataURL('image/png');

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showAlert('Código QR descargado exitosamente', 'success');
                    console.log('✅ QR descargado desde imagen convertida');

                } catch (corsError) {
                    console.warn('❌ Error CORS, usando método alternativo:', corsError);
                    this.generateFallbackQR();
                }

            } else {
                console.log('⚠️ No hay QR disponible, generando fallback...');
                this.generateFallbackQR();
            }
        } catch (error) {
            console.error('Error descargando QR:', error);
            this.showAlert('Error al descargar el código QR', 'error');
        }
    }

    generateFallbackQR() {
        try {
            console.log('🔄 Generando QR fallback...');
            // Generar QR básico como imagen cuando hay problemas CORS
            const productCode = this.currentProductCode || 'PRODUCTO';

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;

            // Fondo blanco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 300);

            // Borde negro
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeRect(5, 5, 290, 290);

            // Esquinas QR
            this.drawSimpleQRCorner(ctx, 20, 20, 60);
            this.drawSimpleQRCorner(ctx, 220, 20, 60);
            this.drawSimpleQRCorner(ctx, 20, 220, 60);

            // Patrón central más consistente
            const seed = this.simpleHash(productCode);
            for (let i = 0; i < 15; i++) {
                for (let j = 0; j < 15; j++) {
                    const cellValue = (seed + i * 15 + j) % 3;
                    if (cellValue === 0) {
                        ctx.fillRect(100 + i * 10, 100 + j * 10, 8, 8);
                    }
                }
            }

            // Código en el centro con mejor visibilidad
            ctx.fillStyle = 'white';
            ctx.fillRect(120, 135, 60, 30);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeRect(120, 135, 60, 30);

            ctx.fillStyle = 'black';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(productCode, 150, 152);

            // Título
            ctx.font = 'bold 14px Arial';
            ctx.fillText('CÓDIGO QR', 150, 30);

            // Descargar
            const link = document.createElement('a');
            link.download = `qr-${productCode}.png`;
            link.href = canvas.toDataURL('image/png');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showAlert('Código QR básico descargado exitosamente', 'success');
            console.log('✅ QR fallback generado y descargado');

        } catch (fallbackError) {
            console.error('❌ Error crítico en fallback:', fallbackError);
            this.showAlert('Error crítico al generar código QR', 'error');
        }
    }

    // Función hash simple para patrón consistente
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    drawSimpleQRCorner(ctx, x, y, size) {
        // Borde externo
        ctx.fillRect(x, y, size, size);
        // Hueco interno
        ctx.fillStyle = 'white';
        ctx.fillRect(x + 10, y + 10, size - 20, size - 20);
        // Centro
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 20, y + 20, size - 40, size - 40);
    }

    searchProductByQR(code) {
        // Limpiar código (quitar espacios, convertir a mayúsculas)
        const cleanCode = code.trim().toUpperCase();

        // Buscar por código exacto o intentar parsear JSON si viene de QR complejo
        let product = this.products.find(p => p.code === cleanCode);

        if (!product && cleanCode.startsWith('{')) {
            try {
                const qrData = JSON.parse(cleanCode);
                if (qrData.code) {
                    product = this.products.find(p => p.code === qrData.code);
                }
            } catch (e) {
                // No es JSON válido, continuar con búsqueda normal
            }
        }

        const resultDiv = document.getElementById('qrSearchResult');
        const notFoundDiv = document.getElementById('qrNotFound');

        // Ocultar ambos divs primero
        resultDiv.style.display = 'none';
        notFoundDiv.style.display = 'none';

        if (product) {
            // Determinar color del badge según stock
            let stockBadgeClass = 'bg-success';
            let stockStatus = 'En Stock';

            if (product.stock === 0) {
                stockBadgeClass = 'bg-danger';
                stockStatus = 'Sin Stock';
            } else if (product.stock <= product.minStock) {
                stockBadgeClass = 'bg-warning text-dark';
                stockStatus = 'Stock Bajo';
            }

            // Mostrar información del producto encontrado con énfasis en la cantidad
            document.getElementById('foundProductInfo').innerHTML = `
                <div class="text-center mb-3">
                    <h5 class="text-primary">${product.name}</h5>
                    <div class="mb-2">
                        <span class="badge ${stockBadgeClass} fs-5 px-3 py-2">
                            <i class="fas fa-boxes color-white"></i> ${product.stock} unidades disponibles
                        </span>
                    </div>
                    <small class="text-muted">${stockStatus}</small>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Código:</strong> <code>${product.code}</code></p>
                        <p><strong>Categoría:</strong> ${product.category}</p>
                        <p><strong>Precio:</strong> $${product.price.toFixed(2)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Stock Actual:</strong> ${product.stock}</p>
                        <p><strong>Stock Mínimo:</strong> ${product.minStock}</p>
                        <p><strong>Estado:</strong> <span class="badge ${stockBadgeClass.replace('fs-5 px-3 py-2', '')}">${stockStatus}</span></p>
                    </div>
                </div>
                
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="window.inventorySystem.editProduct(${product.id}); bootstrap.Modal.getInstance(document.getElementById('scanQrModal')).hide();">
                        <i class="bi bi-pencil"></i> Editar Producto
                    </button>
                    <button class="btn btn-info ms-2" onclick="window.inventorySystem.showProductQR(${product.id}); bootstrap.Modal.getInstance(document.getElementById('scanQrModal')).hide();">
                        <i class="bi bi-qr-code"></i> Ver QR
                    </button>
                </div>
            `;
            resultDiv.style.display = 'block';
        } else {
            // Mostrar mensaje de no encontrado
            document.getElementById('qrNotFound').innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="bi bi-exclamation-triangle"></i> Producto No Encontrado</h6>
                    <p class="mb-2">No se encontró ningún producto con el código: <code>${cleanCode}</code></p>
                    <small class="text-muted">Verifica que el código sea correcto o que el producto esté registrado en el sistema.</small>
                </div>
            `;
            notFoundDiv.style.display = 'block';
        }
    }

    setupQREvents() {
        // Botón de búsqueda por QR manual
        document.getElementById('searchByQrCode').addEventListener('click', () => {
            const code = document.getElementById('manualQrCode').value.trim();
            if (code) {
                this.searchProductByQR(code);
            } else {
                this.showAlert('Por favor ingrese un código', 'warning');
            }
        });

        // Enter en el campo de código QR
        document.getElementById('manualQrCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const code = e.target.value.trim();
                if (code) {
                    this.searchProductByQR(code);
                } else {
                    this.showAlert('Por favor ingrese un código', 'warning');
                }
            }
        });

        // Eventos de pestañas
        document.getElementById('camera-tab').addEventListener('shown.bs.tab', () => {
            this.initQRScanner();
        });

        document.getElementById('manual-tab').addEventListener('shown.bs.tab', () => {
            this.stopQRScanner();
        });

        // Botones de cámara
        document.getElementById('startCamera').addEventListener('click', () => {
            this.initQRScanner();
        });

        document.getElementById('stopCamera').addEventListener('click', () => {
            this.stopQRScanner();
        });

        // Eventos del modal
        document.getElementById('scanQrModal').addEventListener('shown.bs.modal', () => {
            // Iniciar cámara automáticamente si está en la pestaña de cámara
            const cameraTab = document.getElementById('camera-tab');
            if (cameraTab.classList.contains('active')) {
                setTimeout(() => this.initQRScanner(), 500);
            }
        });

        document.getElementById('scanQrModal').addEventListener('hidden.bs.modal', () => {
            this.stopQRScanner();
            document.getElementById('manualQrCode').value = '';
            document.getElementById('qrSearchResult').style.display = 'none';
            document.getElementById('qrNotFound').style.display = 'none';
        });
    }

    // Inicializar escáner QR con detección automática
    initQRScanner() {
        const statusDiv = document.getElementById('cameraStatus');
        const startBtn = document.getElementById('startCamera');
        const stopBtn = document.getElementById('stopCamera');
        const readerDiv = document.getElementById('qr-reader');

        if (this.qrScanner || this.cameraStream) {
            return; // Ya está iniciado
        }

        statusDiv.innerHTML = '<small class="text-info"><i class="fas fa-camera color-white"></i> Iniciando escáner QR...</small>';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        try {
            // Verificar si ZXing está disponible
            console.log('Verificando ZXing...', typeof ZXing);

            if (typeof ZXing !== 'undefined' && ZXing.BrowserQRCodeReader) {
                console.log('✅ ZXing disponible, iniciando scanner avanzado');
                this.startZXingScanner(statusDiv, startBtn, stopBtn, readerDiv);
            } else {
                console.log('❌ ZXing no disponible, usando detección básica');
                statusDiv.innerHTML = '<small class="text-warning"><i class="fas fa-exclamation-triangle color-white"></i> ZXing no cargado, usando modo básico</small>';
                this.startBasicScanner(statusDiv, startBtn, stopBtn, readerDiv);
            }
        } catch (error) {
            console.error('Error iniciando escáner:', error);
            statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle color-white"></i> Error iniciando escáner</small>';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
        }
    }

    // Escáner con ZXing (detección automática)
    startZXingScanner(statusDiv, startBtn, stopBtn, readerDiv) {
        try {
            this.qrScanner = new ZXing.BrowserQRCodeReader();

            // Mostrar indicador de carga
            this.showLoadingIndicator();

            // Crear video element
            const video = document.createElement('video');
            video.id = 'qr-video';
            video.style.width = '100%';
            video.style.maxWidth = '400px';
            video.style.borderRadius = '8px';
            video.style.display = 'none'; // Oculto hasta que esté listo
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;

            // Agregar video al contenedor (pero aún no visible)
            readerDiv.appendChild(video);

            this.qrScanner.decodeFromVideoDevice(null, 'qr-video', (result, err) => {
                if (result) {
                    console.log('🎯 ZXing detectó QR:', result.text);
                    this.handleQRDetected(result.text);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.log('Error de escaneo ZXing:', err);
                }
            })
                .then(() => {
                    // Ocultar indicador de carga
                    this.hideLoadingIndicator();

                    // Mostrar video
                    video.style.display = 'block';

                    // Posicionar overlay correctamente sobre el video
                    setTimeout(() => {
                        this.positionOverlayOnVideo(video);
                        this.showQRScannerOverlay();
                        this.updateQRScannerState('scanning');
                    }, 100);

                    statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-camera color-white"></i> 🎯 Escáner QR activo - Apunte hacia un código</small>';
                    console.log('✅ Escáner ZXing iniciado correctamente');
                })
                .catch(error => {
                    console.error('Error con ZXing:', error);
                    this.hideLoadingIndicator();

                    // Mostrar error específico
                    if (error.name === 'NotAllowedError') {
                        statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle color-white"></i> Permisos de cámara denegados</small>';
                    } else if (error.name === 'NotFoundError') {
                        statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle color-white"></i> No se encontró cámara</small>';
                    } else {
                        statusDiv.innerHTML = '<small class="text-warning"><i class="fas fa-exclamation-triangle color-white"></i> Error con ZXing, usando modo básico</small>';
                        this.startBasicScanner(statusDiv, startBtn, stopBtn, readerDiv);
                        return;
                    }

                    startBtn.style.display = 'inline-block';
                    stopBtn.style.display = 'none';
                });

        } catch (error) {
            console.error('Error iniciando ZXing:', error);
            this.startBasicScanner(statusDiv, startBtn, stopBtn, readerDiv);
        }
    }

    // Escáner básico (solo video, entrada manual)
    startBasicScanner(statusDiv, startBtn, stopBtn, readerDiv) {
        // Mostrar indicador de carga
        this.showLoadingIndicator();

        // Crear elemento de video para la cámara
        const video = document.createElement('video');
        video.id = 'qr-video';
        video.style.width = '100%';
        video.style.maxWidth = '400px';
        video.style.height = 'auto';
        video.style.borderRadius = '8px';
        video.style.display = 'none'; // Oculto hasta que esté listo
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        // Agregar video al contenedor
        readerDiv.appendChild(video);

        // Acceder a la cámara
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        })
            .then(stream => {
                this.cameraStream = stream;
                video.srcObject = stream;

                // Esperar a que el video esté listo
                video.onloadedmetadata = () => {
                    // Ocultar indicador de carga
                    this.hideLoadingIndicator();

                    // Mostrar video
                    video.style.display = 'block';

                    // Posicionar overlay correctamente sobre el video
                    setTimeout(() => {
                        this.positionOverlayOnVideo(video);
                        this.showQRScannerOverlay();
                        this.updateQRScannerState('scanning');
                    }, 100);
                };

                statusDiv.innerHTML = `
                <small class="text-success"><i class="fas fa-camera color-white"></i> Cámara activa</small><br>
                <small class="text-warning">⚠️ Detección automática no disponible - Use entrada manual</small>
            `;

                console.log('Cámara básica iniciada');
            })
            .catch(error => {
                console.error('Error accediendo a la cámara:', error);
                statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle color-white"></i> No se pudo acceder a la cámara</small>';
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';

                // Mostrar mensaje informativo
                readerDiv.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-camera-slash display-4 mb-2 color-white"></i>
                    <h6>Cámara no disponible</h6>
                    <p class="mb-2">Use la pestaña "Manual" para ingresar códigos</p>
                    <small class="text-muted">Error: ${error.message}</small>
                </div>
            `;
            });
    }

    // Detener escáner QR
    stopQRScanner() {
        const statusDiv = document.getElementById('cameraStatus');
        const startBtn = document.getElementById('startCamera');
        const stopBtn = document.getElementById('stopCamera');
        const readerDiv = document.getElementById('qr-reader');

        try {
            // Detener escáner ZXing si existe
            if (this.qrScanner && this.qrScanner.reset) {
                console.log('Deteniendo escáner ZXing');
                this.qrScanner.reset();
                this.qrScanner = null;
            }

            // Detener stream de cámara si existe
            if (this.cameraStream) {
                console.log('Deteniendo stream de cámara');
                this.cameraStream.getTracks().forEach(track => track.stop());
                this.cameraStream = null;
            }

            // Ocultar indicador de carga si está visible
            this.hideLoadingIndicator();

            // Limpiar el contenedor y mostrar indicador de carga por defecto
            const loadingHTML = `
                <div id="qr-loading-indicator" class="qr-loading-container">
                    <div class="qr-loading-content">
                        <div style="text-align: center;">
                            <i class="fas fa-camera display-4 text-muted"></i>
                            <h6 class="mt-3 text-muted">Cámara detenida</h6>
                        </div>
                    </div>
                </div>
            `;
            readerDiv.innerHTML = loadingHTML;

            statusDiv.innerHTML = '<small class="text-muted"><i class="fas fa-camera color-white"></i> Escáner detenido</small>';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';

            // Ocultar overlay de esquinas
            this.hideQRScannerOverlay();

            // Limpiar estado del escáner
            this.updateQRScannerState('stopped');

            console.log('Escáner QR detenido exitosamente');

        } catch (error) {
            console.error('Error deteniendo escáner:', error);

            // Limpiar variables de todas formas
            this.qrScanner = null;
            this.cameraStream = null;

            statusDiv.innerHTML = '<small class="text-muted"><i class="fas fa-camera color-white"></i> Escáner detenido</small>';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
        }
    }

    // Manejar QR detectado por cámara
    handleQRDetected(decodedText) {
        console.log('🎯 QR detectado:', decodedText);

        // Evitar detecciones duplicadas rápidas
        const now = Date.now();
        if (this.lastQRDetection && (now - this.lastQRDetection) < 3000) {
            console.log('Ignorando detección duplicada');
            return;
        }
        this.lastQRDetection = now;

        // Mostrar indicador visual de detección
        this.showQRDetectionIndicator();

        // Cambiar estado del escáner a "detectado"
        this.updateQRScannerState('detected');

        // Añadir clase al video para efecto visual
        const video = document.getElementById('qr-video');
        if (video) {
            video.parentElement.classList.add('qr-detected');
        }

        // Detener escáner temporalmente
        setTimeout(() => {
            this.stopQRScanner();
        }, 1000);

        // Buscar producto
        this.searchProductByQR(decodedText);

        // Mostrar alerta de éxito con información del código
        this.showAlert(`🎯 QR detectado: ${decodedText}`, 'success');

        // Cambiar a pestaña manual para mostrar el resultado después de un breve delay
        setTimeout(() => {
            const manualTab = new bootstrap.Tab(document.getElementById('manual-tab'));
            manualTab.show();

            // Llenar el campo manual con el código detectado
            document.getElementById('manualQrCode').value = decodedText;
        }, 1500);

        // Reiniciar escáner después de 5 segundos para permitir nuevos escaneos
        setTimeout(() => {
            const cameraTab = document.getElementById('camera-tab');
            if (cameraTab && cameraTab.classList.contains('active')) {
                console.log('🔄 Reiniciando escáner para nuevas detecciones');
                this.initQRScanner();
            }
        }, 5000);
    }

    // Mostrar indicador visual de detección
    showQRDetectionIndicator() {
        const indicator = document.getElementById('qr-detection-indicator');
        if (indicator) {
            indicator.style.display = 'flex';

            // Ocultar después de 2 segundos
            setTimeout(() => {
                indicator.style.display = 'none';

                // Remover clase del video
                const video = document.getElementById('qr-video');
                if (video && video.parentElement) {
                    video.parentElement.classList.remove('qr-detected');
                }
            }, 2000);
        }
    }

    // Mostrar overlay de esquinas del escáner
    showQRScannerOverlay() {
        const overlay = document.getElementById('qr-scanner-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';

            // Asegurar que la línea de scan esté visible
            const scanLine = overlay.querySelector('.qr-scan-line');
            if (scanLine) {
                scanLine.style.display = 'block';
                scanLine.style.opacity = '1';
            }

            console.log('📐 Esquinas del escáner QR activadas con línea de scan');
        }
    }

    // Ocultar overlay de esquinas del escáner
    hideQRScannerOverlay() {
        const overlay = document.getElementById('qr-scanner-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            console.log('📐 Esquinas del escáner QR desactivadas');
        }
    }

    // Actualizar estado del overlay según detección
    updateQRScannerState(state) {
        const container = document.querySelector('.qr-scanner-container');
        if (container) {
            // Remover clases anteriores
            container.classList.remove('qr-scanning', 'qr-detected');

            // Agregar nueva clase según el estado
            if (state === 'scanning') {
                container.classList.add('qr-scanning');
            } else if (state === 'detected') {
                container.classList.add('qr-detected');
            }
        }
    }

    // Mostrar indicador de carga
    showLoadingIndicator() {
        const loadingIndicator = document.getElementById('qr-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
    }

    // Ocultar indicador de carga
    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('qr-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    // Posicionar overlay exactamente sobre el video
    positionOverlayOnVideo(video) {
        const overlay = document.getElementById('qr-scanner-overlay');
        if (!overlay || !video) return;

        // Mover el overlay dentro del contenedor del video si no está ahí
        if (overlay.parentElement !== video.parentElement) {
            video.parentElement.appendChild(overlay);
        }

        // El overlay ahora debe cubrir exactamente el video
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.borderRadius = '8px';

        console.log('📐 Overlay reposicionado dentro del contenedor del video');
    }
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando Sistema de Inventario...');
    window.inventorySystem = new InventorySystem();
});

// Funciones globales para los event handlers inline
function editProduct(id) {
    window.inventorySystem.editProduct(id);
}

function confirmDeleteProduct(id) {
    window.inventorySystem.confirmDeleteProduct(id);
}

function showProductQR(id) {
    window.inventorySystem.showProductQR(id);
}

function downloadQR() {
    window.inventorySystem.downloadQR();
}

