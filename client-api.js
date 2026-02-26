// API Configuration
// API Configuration
const API = {
    // تغيير الرابط حسب البيئة
    baseUrl: window.location.hostname === 'localhost' 
        ? 'https://vocal-bavarois-5292d2.netlify.app/' 
        : 'https://superb-belekoy-ebabc2.netlify.app/.netlify/functions/api',
    
    // GET request
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            // Fallback to localStorage
            return this.getFromLocalStorage(endpoint);
        }
    },
    
    // POST request
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            // Save to localStorage as backup
            this.saveToLocalStorage(endpoint, data);
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            // Fallback to localStorage
            return this.saveToLocalStorage(endpoint, data);
        }
    },
    
    // LocalStorage fallback
    getFromLocalStorage(endpoint) {
        const data = localStorage.getItem(`menuflow_${endpoint}`);
        return data ? JSON.parse(data) : null;
    },
    
    saveToLocalStorage(endpoint, data) {
        const key = `menuflow_${endpoint}`;
        let existing = this.getFromLocalStorage(endpoint) || [];
        
        if (Array.isArray(existing)) {
            if (endpoint === '/orders') {
                existing.push(data);
            } else {
                existing = data;
            }
        }
        
        localStorage.setItem(key, JSON.stringify(existing));
        return data;
    }
};

// باقي الكود كما هو...;

// App State
const App = {
    menuData: { items: [] },
    cart: [],
    currentCategory: 'all',
    restaurantWhatsApp: '963994059020',
    
    // Initialize app
    async init() {
        this.showLoading();
        await this.loadMenu();
        this.render();
        this.hideLoading();
    },
    
    // Load menu from API
    async loadMenu() {
        const data = await API.get('/menu');
        if (data && data.items) {
            this.menuData = data;
        } else {
            // Fallback to localStorage
            const local = localStorage.getItem('menuData');
            if (local) {
                this.menuData = JSON.parse(local);
            }
        }
    },
    
    // Render main content
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Hero Section -->
            <section class="hero" id="home">
                <div class="container">
                    <div class="hero-content">
                        <h1>أشهى المأكولات<br>توصلك لباب البيت</h1>
                        <p>اطلب الآن من مطعمك المفضل في سوريا</p>
                        <a href="#menu" class="btn-primary">اطلب الآن <i class="fas fa-arrow-left"></i></a>
                    </div>
                </div>
            </section>

            <!-- Categories -->
            <section class="categories-section">
                <div class="container">
                    <div class="section-header">
                        <h2>الأصناف الرئيسية</h2>
                    </div>
                    <div class="categories-grid" id="categoriesGrid"></div>
                </div>
            </section>

            <!-- Menu -->
            <section class="menu-section" id="menu">
                <div class="container">
                    <div class="section-header">
                        <h2>قائمة الطعام</h2>
                    </div>
                    <div class="menu-filters" id="menuFilters"></div>
                    <div class="menu-grid" id="menuGrid"></div>
                </div>
            </section>
        `;
        
        this.renderCategories();
        this.renderFilters();
        this.renderMenu();
    },
    
    // Render categories
    renderCategories() {
        const categories = ['الكل', 'برغر', 'بيتزا', 'شاورما', 'مشاوي', 'عصائر', 'حلويات', 'مقبلات'];
        const grid = document.getElementById('categoriesGrid');
        
        grid.innerHTML = categories.map(cat => `
            <div class="category-card ${cat === 'الكل' ? 'active' : ''}" onclick="App.filterByCategory('${cat}')">
                <div class="category-icon">${this.getCategoryIcon(cat)}</div>
                <h3>${cat}</h3>
            </div>
        `).join('');
    },
    
    // Render filters
    renderFilters() {
        const categories = ['الكل', 'برغر', 'بيتزا', 'شاورما', 'مشاوي', 'عصائر', 'حلويات', 'مقبلات'];
        const filters = document.getElementById('menuFilters');
        
        filters.innerHTML = categories.map(cat => `
            <button class="filter-btn ${cat === 'الكل' ? 'active' : ''}" onclick="App.filterByCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    },
    
    // Render menu items
    renderMenu() {
        const grid = document.getElementById('menuGrid');
        
        let items = this.menuData.items;
        if (this.currentCategory !== 'الكل') {
            items = items.filter(item => item.category === this.currentCategory);
        }
        
        grid.innerHTML = items.map(item => `
            <div class="menu-item">
                <div class="menu-item-image">
                    <span class="menu-item-tag">${item.category}</span>
                    ${item.icon || '🍽️'}
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3>${item.name}</h3>
                        <span class="menu-item-price">${item.price.toLocaleString()} ل.س</span>
                    </div>
                    <p class="menu-item-desc">${item.desc}</p>
                    <button class="add-to-cart-btn" onclick="App.addToCart(${item.id})">
                        <i class="fas fa-cart-plus"></i> أضف للسلة
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Filter by category
    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update active states
        document.querySelectorAll('.category-card, .filter-btn').forEach(el => {
            el.classList.remove('active');
        });
        
        document.querySelectorAll('.category-card, .filter-btn').forEach(el => {
            if (el.textContent.includes(category)) {
                el.classList.add('active');
            }
        });
        
        this.renderMenu();
    },
    
    // Add to cart
    addToCart(itemId) {
        const item = this.menuData.items.find(i => i.id === itemId);
        if (!item) return;
        
        const existing = this.cart.find(i => i.id === itemId);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...item, quantity: 1 });
        }
        
        this.updateCart();
        this.showNotification(`تمت إضافة ${item.name} للسلة`, 'success');
    },
    
    // Update cart UI
    updateCart() {
        const cartContainer = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        // Update count
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        if (this.cart.length === 0) {
            cartContainer.innerHTML = '<div class="empty-cart">السلة فارغة</div>';
            cartTotal.textContent = '٠ ل.س';
            return;
        }
        
        // Render cart items
        let total = 0;
        cartContainer.innerHTML = this.cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <div>
                        <h4>${item.name}</h4>
                        <span>${item.price.toLocaleString()} ل.س</span>
                    </div>
                    <div class="cart-item-actions">
                        <button onclick="App.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="App.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
        }).join('');
        
        cartTotal.textContent = `${total.toLocaleString()} ل.س`;
    },
    
    // Update quantity
    updateQuantity(itemId, change) {
        const index = this.cart.findIndex(i => i.id === itemId);
        if (index === -1) return;
        
        this.cart[index].quantity += change;
        if (this.cart[index].quantity <= 0) {
            this.cart.splice(index, 1);
        }
        
        this.updateCart();
    },
    
    // Show checkout
    showCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('السلة فارغة!', 'error');
            return;
        }
        document.getElementById('checkoutModal').classList.add('show');
        this.toggleCart();
    },
    
    // Hide checkout
    hideCheckout() {
        document.getElementById('checkoutModal').classList.remove('show');
    },
    
    // Toggle cart
    toggleCart() {
        document.getElementById('cartSidebar').classList.toggle('open');
    },
    
    // Get current location
    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    document.getElementById('locationInput').value = 
                        `موقعي الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    this.showNotification('تم تحديد موقعك', 'success');
                },
                error => {
                    this.showNotification('فشل تحديد الموقع', 'error');
                }
            );
        }
    },
    
    // Send order
    async sendOrder() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        const location = document.getElementById('locationInput').value.trim();
        
        if (!name || !phone || !address) {
            this.showNotification('الرجاء إدخال جميع البيانات', 'error');
            return;
        }
        
        const order = {
            id: Date.now(),
            name,
            phone,
            address,
            location,
            items: this.cart,
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            date: new Date().toISOString(),
            status: 'جديد'
        };
        
        // Save order via API
        const result = await API.post('/orders', order);
        
        if (result) {
            // Send WhatsApp message
            const orderText = this.formatOrderMessage(order);
            window.open(`https://wa.me/${this.restaurantWhatsApp}?text=${encodeURIComponent(orderText)}`, '_blank');
            
            this.cart = [];
            this.updateCart();
            this.hideCheckout();
            this.showNotification('تم إرسال الطلب بنجاح', 'success');
        }
    },
    
    // Format order message
    formatOrderMessage(order) {
        let text = `🍽️ *طلب جديد*\n\n`;
        text += `👤 *الاسم:* ${order.name}\n`;
        text += `📞 *الجوال:* ${order.phone}\n`;
        text += `📍 *العنوان:* ${order.address}\n`;
        text += `🗺️ *الموقع:* ${order.location}\n\n`;
        text += `📋 *الطلبات:*\n`;
        
        order.items.forEach(item => {
            text += `• ${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()} ل.س\n`;
        });
        
        text += `\n💰 *الإجمالي:* ${order.total.toLocaleString()} ل.س`;
        text += `\n💵 *الدفع:* كاش`;
        
        return text;
    },
    
    // Get category icon
    getCategoryIcon(category) {
        const icons = {
            'برغر': '🍔',
            'بيتزا': '🍕',
            'شاورما': '🌯',
            'مشاوي': '🔥',
            'عصائر': '🥤',
            'حلويات': '🍰',
            'مقبلات': '🍟'
        };
        return icons[category] || '🍽️';
    },
    
    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 6000;
            animation: slideIn 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    // Show loading
    showLoading() {
        let loading = document.querySelector('.loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.className = 'loading';
            loading.innerHTML = '<div class="spinner"></div><p>جاري التحميل...</p>';
            document.body.appendChild(loading);
        }
        loading.classList.add('show');
    },
    
    // Hide loading
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.classList.remove('show');
        }
    }
};

// Global functions
window.toggleCart = () => App.toggleCart();
window.toggleMobileMenu = () => document.getElementById('navLinks').classList.toggle('show');
window.showCheckout = () => App.showCheckout();
window.hideCheckout = () => App.hideCheckout();
window.getCurrentLocation = () => App.getCurrentLocation();
window.sendOrder = () => App.sendOrder();

// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());
