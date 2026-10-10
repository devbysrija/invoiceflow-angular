/* ==========================================================================
   InvoiceFlow — Core factories
   Each factory owns one localStorage key (or a small group of related
   ones), mirroring how main.js's LS object + read/write helpers worked —
   but now each concern is its own injectable service instead of one big
   shared object.
   ========================================================================== */

/* ---------- StorageService ----------
   Low-level localStorage wrapper. Every other factory below is built on
   top of this one instead of touching localStorage directly. */
angular.module('ivfCore').factory('StorageService', function () {

  var KEYS = {
    USER: 'invoiceflow_user',
    CLIENTS: 'invoiceflow_clients',
    INVOICES: 'invoiceflow_invoices',
    DRAFT: 'invoiceflow_draft_invoice',
    TEMPLATE: 'invoiceflow_selected_template',
    SETTINGS: 'invoiceflow_settings'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function generateId() {
    return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  return {
    KEYS: KEYS,
    read: read,
    write: write,
    remove: remove,
    generateId: generateId
  };
});


/* ---------- AuthService ----------
   Replaces requireAuth()/logout() from main.js and the submit handlers
   in auth.js. Controllers call AuthService.requireAuth() once on load;
   if nobody is logged in it redirects to login.html and returns null,
   the same contract the old requireAuth() had. */
angular.module('ivfCore').factory('AuthService', ['StorageService', '$window',
  function (StorageService, $window) {

    var KEYS = StorageService.KEYS;

    function getUser() {
      return StorageService.read(KEYS.USER, null);
    }

    function login(email, remember) {
      var existing = getUser();
      var user = {
        name: (existing && existing.email === email) ? existing.name : email.split('@')[0],
        email: email,
        company: (existing && existing.company) || 'My Company'
      };
      // localStorage is the only storage this project uses to simulate a
      // session, so the user is written on every login regardless of the
      // "keep me logged in" checkbox — otherwise requireAuth() on every
      // other page would immediately bounce them back here.
      StorageService.write(KEYS.USER, user);
      void remember;
      return user;
    }

    function signup(data) {
      var user = {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        company: 'My Company'
      };
      StorageService.write(KEYS.USER, user);
      return user;
    }

    function logout() {
      StorageService.remove(KEYS.USER);
      $window.location.href = 'index.html';
    }

    function requireAuth() {
      var user = getUser();
      if (!user) {
        $window.location.replace('login.html');
        return null;
      }
      return user;
    }

    return {
      getUser: getUser,
      login: login,
      signup: signup,
      logout: logout,
      requireAuth: requireAuth
    };
  }
]);


/* ---------- ToastService ----------
   Replaces showToast() from main.js. Holds a small piece of shared
   state; the <ivf-toast> directive (core.directives.js) just displays
   whatever is in ToastService.state. */
angular.module('ivfCore').factory('ToastService', ['$timeout',
  function ($timeout) {

    var state = { message: '', visible: false };
    var pendingTimer = null;

    function show(message) {
      state.message = message;
      state.visible = true;
      if (pendingTimer) $timeout.cancel(pendingTimer);
      pendingTimer = $timeout(function () {
        state.visible = false;
      }, 2600);
    }

    return {
      state: state,
      show: show
    };
  }
]);


/* ---------- ClientService ----------
   Replaces getClients()/setClients() plus the seed logic in clients.js
   and main.js's seedDemoData() (client half). */
angular.module('ivfCore').factory('ClientService', ['StorageService',
  function (StorageService) {

    var KEYS = StorageService.KEYS;

    function getAll() {
      return StorageService.read(KEYS.CLIENTS, []);
    }

    function save(list) {
      StorageService.write(KEYS.CLIENTS, list);
    }

    function add(payload) {
      var list = getAll();
      var client = angular.extend({ id: StorageService.generateId() }, payload);
      list.unshift(client);
      save(list);
      return client;
    }

    function update(id, payload) {
      var list = getAll();
      var idx = -1;
      list.forEach(function (c, i) { if (c.id === id) idx = i; });
      if (idx > -1) {
        list[idx] = angular.extend({}, list[idx], payload);
        save(list);
      }
      return idx > -1 ? list[idx] : null;
    }

    function remove(id) {
      save(getAll().filter(function (c) { return c.id !== id; }));
    }

    function seedIfEmpty() {
      if (!StorageService.read(KEYS.CLIENTS, null)) {
        save([
          { id: StorageService.generateId(), name: 'Ravi Shankar', company: 'Orion Textiles', email: 'ravi@oriontex.com', phone: '+91 98765 43210' },
          { id: StorageService.generateId(), name: 'Meera Krishnan', company: 'Zenith Labs', email: 'meera@zenithlabs.io', phone: '+91 90000 11223' },
          { id: StorageService.generateId(), name: 'Arjun Nair', company: 'Nair & Co.', email: 'arjun@nairco.in', phone: '+91 98123 45678' }
        ]);
      }
    }

    return {
      getAll: getAll,
      add: add,
      update: update,
      remove: remove,
      seedIfEmpty: seedIfEmpty
    };
  }
]);


/* ---------- InvoiceService ----------
   Replaces getInvoices()/setInvoices() from invoice-history.js, the
   invoice half of seedDemoData(), and the line-item math
   (rowValues()/recalc()) from invoice-create.js. Keeping the math here
   (instead of in a controller) means both the Create Invoice page and
   any future page can reuse the exact same total calculation. */
angular.module('ivfCore').factory('InvoiceService', ['StorageService',
  function (StorageService) {

    var KEYS = StorageService.KEYS;

    function getAll() {
      return StorageService.read(KEYS.INVOICES, []);
    }

    function save(list) {
      StorageService.write(KEYS.INVOICES, list);
    }

    function add(payload) {
      var list = getAll();
      var invoice = angular.extend({ id: StorageService.generateId() }, payload);
      list.unshift(invoice);
      save(list);
      return invoice;
    }

    function update(id, payload) {
      var list = getAll();
      var idx = -1;
      list.forEach(function (inv, i) { if (inv.id === id) idx = i; });
      if (idx > -1) {
        list[idx] = angular.extend({}, list[idx], payload);
        save(list);
      }
      return idx > -1 ? list[idx] : null;
    }

    function remove(id) {
      save(getAll().filter(function (inv) { return inv.id !== id; }));
    }

    // Ported 1:1 from invoice-create.js rowValues()
    function lineTotal(item) {
      var qty = Number(item.qty) || 0;
      var price = Number(item.price) || 0;
      var tax = Number(item.tax) || 0;
      var discount = Number(item.discount) || 0;
      var base = qty * price;
      var discountAmt = base * (discount / 100);
      var taxable = base - discountAmt;
      var taxAmt = taxable * (tax / 100);
      return { base: base, discountAmt: discountAmt, taxAmt: taxAmt, total: taxable + taxAmt };
    }

    // Ported 1:1 from invoice-create.js recalc()
    function computeTotals(items) {
      var subtotal = 0, taxTotal = 0, discountTotal = 0;
      (items || []).forEach(function (item) {
        var v = lineTotal(item);
        subtotal += v.base;
        taxTotal += v.taxAmt;
        discountTotal += v.discountAmt;
      });
      return {
        subtotal: subtotal,
        taxTotal: taxTotal,
        discountTotal: discountTotal,
        grand: subtotal - discountTotal + taxTotal
      };
    }

    function seedIfEmpty() {
      if (!StorageService.read(KEYS.INVOICES, null)) {
        save([
          { id: StorageService.generateId(), number: 'INV-1042', client: 'Orion Textiles', date: '2026-07-01', amount: 48250, status: 'Paid' },
          { id: StorageService.generateId(), number: 'INV-1043', client: 'Zenith Labs', date: '2026-07-06', amount: 12800, status: 'Pending' },
          { id: StorageService.generateId(), number: 'INV-1044', client: 'Nair & Co.', date: '2026-06-18', amount: 9600, status: 'Overdue' }
        ]);
      }
    }

    function getDraft() { return StorageService.read(KEYS.DRAFT, null); }
    function saveDraft(data) { StorageService.write(KEYS.DRAFT, data); }
    function clearDraft() { StorageService.remove(KEYS.DRAFT); }

    return {
      getAll: getAll,
      add: add,
      update: update,
      remove: remove,
      lineTotal: lineTotal,
      computeTotals: computeTotals,
      seedIfEmpty: seedIfEmpty,
      getDraft: getDraft,
      saveDraft: saveDraft,
      clearDraft: clearDraft
    };
  }
]);


/* ---------- SettingsService ----------
   Replaces the loadSettings()/saveSettings() pair in settings.js. Also
   what ivfCurrency (core.filters.js) reads to know the active currency. */
angular.module('ivfCore').factory('SettingsService', ['StorageService',
  function (StorageService) {

    var KEYS = StorageService.KEYS;

    function get() {
      return StorageService.read(KEYS.SETTINGS, {});
    }

    function save(settings) {
      StorageService.write(KEYS.SETTINGS, settings);
    }

    function patch(partial) {
      var merged = angular.extend({}, get(), partial);
      save(merged);
      return merged;
    }

    return {
      get: get,
      save: save,
      patch: patch
    };
  }
]);


/* ---------- TemplateService ----------
   Replaces the INVOICE_TEMPLATES array + getInvoiceTemplate() that used
   to live in main.js, plus the LS.TEMPLATE read/write calls scattered
   across templates.js and invoice-create.js. */
angular.module('ivfCore').factory('TemplateService', ['StorageService',
  function (StorageService) {

    var KEYS = StorageService.KEYS;

    var TEMPLATES = [
      { id: 'classic', name: 'Classic', tag: 'Clean lines, ideal for services', accent: '#4F46E5' },
      { id: 'minimal', name: 'Minimal', tag: 'Whitespace-first, single accent', accent: '#0EA5E9' },
      { id: 'bold', name: 'Bold Header', tag: 'Strong header block for agencies', accent: '#F59E0B' },
      { id: 'ledger', name: 'Ledger', tag: 'Table-heavy, good for many line items', accent: '#16A34A' },
      { id: 'studio', name: 'Studio', tag: 'Soft accents for creative freelancers', accent: '#DB2777' }
    ];

    function getAll() {
      return TEMPLATES;
    }

    function getById(id) {
      var found = null;
      TEMPLATES.forEach(function (t) { if (t.id === id) found = t; });
      return found || TEMPLATES[0];
    }

    function getSelectedId() {
      return StorageService.read(KEYS.TEMPLATE, 'classic');
    }

    function setSelectedId(id) {
      StorageService.write(KEYS.TEMPLATE, id);
    }

    function getSelected() {
      return getById(getSelectedId());
    }

    return {
      getAll: getAll,
      getById: getById,
      getSelectedId: getSelectedId,
      setSelectedId: setSelectedId,
      getSelected: getSelected
    };
  }
]);
