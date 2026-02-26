// هذا الملف سيتم استخدامه مع Netlify Functions
const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');

// قراءة قاعدة البيانات
const dbPath = path.join(__dirname, '../db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const server = jsonServer.create();
const router = jsonServer.router(db);
const middlewares = jsonServer.defaults();

// إعداد CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// دوال مخصصة للطلبات
server.post('/orders', (req, res) => {
  const orders = db.orders || [];
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: 'جديد',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  db.orders = orders;
  
  // حفظ التغييرات
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  res.json(newOrder);
});

server.get('/orders', (req, res) => {
  res.json(db.orders || []);
});

server.get('/menu', (req, res) => {
  res.json(db.menu || { items: [] });
});

server.post('/menu', (req, res) => {
  const menu = db.menu || { items: [] };
  const newItem = {
    id: Date.now(),
    ...req.body
  };
  
  menu.items.push(newItem);
  db.menu = menu;
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  res.json(newItem);
});

server.put('/menu/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const menu = db.menu || { items: [] };
  const index = menu.items.findIndex(item => item.id === id);
  
  if (index !== -1) {
    menu.items[index] = { ...menu.items[index], ...req.body };
    db.menu = menu;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  }
  
  res.json(req.body);
});

server.delete('/menu/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const menu = db.menu || { items: [] };
  menu.items = menu.items.filter(item => item.id !== id);
  db.menu = menu;
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  res.json({ id });
});

// استخدام router
server.use(router);

// تصدير الدالة لـ Netlify Functions
exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const path = event.path.replace('/.netlify/functions/api', '');
    const request = {
      method: event.httpMethod,
      path: path,
      headers: event.headers,
      body: event.body
    };
    
    server(request, {
      setHeader: (key, value) => {},
      end: (data) => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        });
      }
    });
  });
};