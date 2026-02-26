// API Configuration
const API = {
    // تغيير الرابط حسب البيئة
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://your-site-name.netlify.app/.netlify/functions/api',
    
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },
    
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },
    
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};

// Dashboard State
const Dashboard = {
    menuData: { items: [] },
    orders: [],
    whatsappNumber: '963994059020',
    
    async init() {
        await this.loadData();
        this.render();
        this.startPolling();
    },
    
    async loadData() {
        // ===== التعديل هنا =====
        // نشوف إذا في بيانات في localStorage أولاً
        const savedMenu = localStorage.getItem('menuData');
        const savedOrders = localStorage.getItem('orders');
        
        if (savedMenu) {
            this.menuData = JSON.parse(savedMenu);
            console.log('✅ تم تحميل المنيو من الجهاز');
        } else {
            this.menuData = { items: this.getDefaultItems() };
            localStorage.setItem('menuData', JSON.stringify(this.menuData));
        }
        
        if (savedOrders) {
            this.orders = JSON.parse(savedOrders);
            console.log('✅ تم تحميل الطلبات من الجهاز');
        } else {
            this.orders = [];
            localStorage.setItem('orders', JSON.stringify(this.orders));
        }
        
        // نحاول نحدث من المخدم (إذا كان شغال)
        try {
            const menu = await API.get('/menu');
            if (menu) {
                this.menuData = menu;
                localStorage.setItem('menuData', JSON.stringify(menu));
            }
            
            const orders = await API.get('/orders');
            if (orders) {
                this.orders = orders;
                localStorage.setItem('orders', JSON.stringify(orders));
            }
        } catch {
            console.log('📱 المخدم غير متصل - نستخدم البيانات المحلية');
        }
    },
    
    getDefaultItems() {
        return [
            { id: 1, name: 'برغر كلاسيك', price: 25000, category: 'برغر', icon: '🍔', desc: 'لحم بقري + خس + طماطم', offer: false },
            { id: 2, name: 'برغر دجاج', price: 22000, category: 'برغر', icon: '🍗', desc: 'فيليه دجاج مقرمش', offer: false },
            { id: 3, name: 'بيتزا مارجريتا', price: 30000, category: 'بيتزا', icon: '🍕', desc: 'صوص طماطم + جبنة', offer: false },
            { id: 4, name: 'شاورما دجاج', price: 15000, category: 'شاورما', icon: '🌯', desc: 'دجاج + ثوم + خضار', offer: false },
            { id: 5, name: 'عصير برتقال', price: 8000, category: 'عصائر', icon: '🥤', desc: 'برتقال طازج', offer: false },
        ];
    },
    
    startPolling() {
        setInterval(async () => {
            try {
                const orders = await API.get('/orders');
                if (orders) {
                    this.orders = orders;
                    localStorage.setItem('orders', JSON.stringify(orders));
                    this.updateOrdersDisplay();
                    this.updateStats();
                }
            } catch {
                console.log('📱 المخدم غير متصل');
            }
        }, 5000);
    },
    
    render() {
        this.updateStats();
        this.renderItems();
        this.renderOrders();
    },
    
    updateStats() {
        const totalItems = document.getElementById('totalItems');
        const todayOrders = document.getElementById('todayOrders');
        const todaySales = document.getElementById('todaySales');
        const activeOffers = document.getElementById('activeOffers');
        const newOrdersBadge = document.getElementById('newOrdersBadge');
        
        if (totalItems) totalItems.textContent = this.menuData.items.length;
        
        const today = new Date().toDateString();
        const todayOrdersList = this.orders.filter(o => new Date(o.date).toDateString() === today);
        
        if (todayOrders) todayOrders.textContent = todayOrdersList.length;
        
        const todayTotal = todayOrdersList.reduce((sum, o) => sum + o.total, 0);
        if (todaySales) todaySales.textContent = `${todayTotal.toLocaleString()} ل.س`;
        
        const offers = this.menuData.items.filter(i => i.offer).length;
        if (activeOffers) activeOffers.textContent = offers;
        
        const newOrders = this.orders.filter(o => o.status === 'جديد').length;
        if (newOrdersBadge) newOrdersBadge.textContent = newOrders;
    },
    
    renderItems() {
        const grid = document.getElementById('itemsGrid');
        if (!grid) return;
        
        grid.innerHTML = this.menuData.items.map(item => `
            <div class="item-card ${item.offer ? 'offer' : ''}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <div class="item-category">${item.category}</div>
                    <div class="item-price">${item.price.toLocaleString()} ل.س</div>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="Dashboard.editItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="Dashboard.deleteItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        const recentOrders = document.getElementById('recentOrdersList');
        
        if (ordersList) {
            ordersList.innerHTML = this.renderOrdersList(this.orders);
        }
        
        if (recentOrders) {
            const recent = this.orders.slice(0, 5);
            recentOrders.innerHTML = this.renderOrdersList(recent);
        }
    },
    
    renderOrdersList(orders) {
        if (orders.length === 0) {
            return '<p class="no-data">لا توجد طلبات</p>';
        }
        
        return orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">طلب #${order.id}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="customer-info">
                    <p><strong>👤 ${order.name}</strong></p>
                    <p>📞 ${order.phone}</p>
                    <p>📍 ${order.address}</p>
                    <p>🗺️ ${order.location || 'غير محدد'}</p>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>${(item.price * item.quantity).toLocaleString()} ل.س</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    الإجمالي: ${order.total.toLocaleString()} ل.س
                </div>
                <a href="https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(`مرحباً ${order.name}، تم استلام طلبك وسيتم توصيله قريباً`)}" 
                   class="whatsapp-link" target="_blank">
                    <i class="fab fa-whatsapp"></i> تواصل مع العميل
                </a>
            </div>
        `).join('');
    },
    
    updateOrdersDisplay() {
        this.renderOrders();
        this.updateStats();
    },
    
    async addItem(item) {
        // ===== التعديل هنا =====
        // نضيف للقائمة
        this.menuData.items.push(item);
        
        // نحفظ في localStorage
        localStorage.setItem('menuData', JSON.stringify(this.menuData));
        
        // نحدث العرض
        this.renderItems();
        this.updateStats();
        this.showNotification('تمت إضافة الوجبة بنجاح', 'success');
        
        // نحاول نرسل للمخدم (إذا كان شغال)
        try {
            await API.post('/menu', item);
        } catch {
            console.log('📱 المخدم غير متصل - البيانات محفوظة محلياً');
        }
        
        return true;
    },
    
    async deleteItem(itemId) {
        if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;
        
        // ===== التعديل هنا =====
        // نحذف من القائمة
        this.menuData.items = this.menuData.items.filter(i => i.id !== itemId);
        
        // نحفظ في localStorage
        localStorage.setItem('menuData', JSON.stringify(this.menuData));
        
        // نحدث العرض
        this.renderItems();
        this.updateStats();
        this.showNotification('تم حذف الوجبة', 'success');
        
        // نحاول نحذف من المخدم
        try {
            await API.delete(`/menu/${itemId}`);
        } catch {
            console.log('📱 المخدم غير متصل');
        }
    },
    
    async editItem(itemId) {
        const item = this.menuData.items.find(i => i.id === itemId);
        if (!item) return;
        
        // Fill form
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemIcon').value = item.icon;
        document.getElementById('itemDesc').value = item.desc;
        document.getElementById('itemOffer').checked = item.offer;
        
        // Delete old and add new
        await this.deleteItem(itemId);
        
        // Show add section
        showSection('add');
    },
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            animation: slideDown 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Global functions
window.showSection = function(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(`${section}Section`).style.display = 'block';
    
    const titles = {
        'dashboard': 'الرئيسية',
        'items': 'الوجبات',
        'orders': 'الطلبات',
        'add': 'إضافة وجبة',
        'settings': 'الإعدادات'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
};

window.addItem = async function() {
    const name = document.getElementById('itemName').value.trim();
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    const icon = document.getElementById('itemIcon').value;
    const desc = document.getElementById('itemDesc').value.trim();
    const offer = document.getElementById('itemOffer').checked;
    
    if (!name || !price) {
        alert('الرجاء إدخال اسم الوجبة والسعر');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        name,
        price: parseInt(price),
        category,
        icon,
        desc: desc || 'وجبة شهية',
        offer
    };
    
    const added = await Dashboard.addItem(newItem);
    if (added) {
        document.getElementById('addItemForm').reset();
    }
};

window.searchItems = function() {
    const searchTerm = document.getElementById('searchItems').value.toLowerCase();
    const filtered = Dashboard.menuData.items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = filtered.map(item => `
        <div class="item-card ${item.offer ? 'offer' : ''}">
            <div class="item-icon">${item.icon}</div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <div class="item-category">${item.category}</div>
                <div class="item-price">${item.price.toLocaleString()} ل.س</div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="Dashboard.editItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="Dashboard.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

window.updateWhatsApp = function() {
    const number = document.getElementById('whatsappNumber').value;
    Dashboard.whatsappNumber = number;
    localStorage.setItem('restaurantWhatsApp', number);
    alert('تم تحديث رقم واتساب');
};

window.exportData = function() {
    const data = {
        menu: Dashboard.menuData,
        orders: Dashboard.orders,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menuflow-backup-${Date.now()}.json`;
    a.click();
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => Dashboard.init());