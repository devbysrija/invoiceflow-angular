/* ==========================================================================
   InvoiceFlow — Create Invoice page module
   Replaces invoice-create.js. Line-item math now lives in
   InvoiceService (shared with any other page that needs it), the
   signature canvas is the ivfSignaturePad directive, and the
   itemsBody 'input' listener + form 'input' autosave listener from the
   original file are both replaced by a single deep $watch that
   recalculates totals and writes the draft on any change.
   ========================================================================== */
angular.module('ivfInvoiceCreate', ['ivfCore']);

angular.module('ivfInvoiceCreate').controller('InvoiceCreateCtrl', [
  '$scope', '$filter', '$sce', 'AuthService', 'ClientService', 'InvoiceService', 'TemplateService', 'ToastService',
  function ($scope, $filter, $sce, AuthService, ClientService, InvoiceService, TemplateService, ToastService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    ClientService.seedIfEmpty();
    InvoiceService.seedIfEmpty();

    vm.clients = ClientService.getAll();
    vm.sigPad = null; // populated by the ivf-signature-pad directive

    function defaultDueDate() {
      var d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().slice(0, 10);
    }

    vm.invoice = {
      number: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      client: '',
      date: new Date().toISOString().slice(0, 10),
      due: defaultDueDate(),
      notes: ''
    };

    vm.items = [];
    vm.totals = { subtotal: 0, taxTotal: 0, discountTotal: 0, grand: 0 };
    vm.previewOpen = false;
    vm.previewHtml = '';

    var itemCounter = 0;
    function nextItemId() {
      itemCounter++;
      return 'item-' + itemCounter;
    }

    vm.addItem = function (item) {
      vm.items.push({
        id: nextItemId(),
        desc: (item && item.desc) || '',
        qty: item && item.qty != null ? item.qty : 1,
        price: item && item.price != null ? item.price : 0,
        tax: item && item.tax != null ? item.tax : 18,
        discount: item && item.discount != null ? item.discount : 0
      });
    };

    vm.removeItem = function (item) {
      if (vm.items.length <= 1) {
        ToastService.show('Keep at least one line item.');
        return;
      }
      vm.items = vm.items.filter(function (i) { return i.id !== item.id; });
    };

    // Delegates to InvoiceService so the math stays in one place.
    vm.lineTotal = function (item) {
      return InvoiceService.lineTotal(item).total;
    };

    function collect() {
      return {
        number: vm.invoice.number,
        client: vm.invoice.client,
        date: vm.invoice.date,
        due: vm.invoice.due,
        notes: vm.invoice.notes,
        items: vm.items,
        totals: vm.totals
      };
    }

    /* ---------- Restore draft or seed a starter line item ---------- */
    var draft = InvoiceService.getDraft();
    if (draft && draft.number) {
      vm.invoice.number = draft.number;
      vm.invoice.client = draft.client || '';
      vm.invoice.date = draft.date || vm.invoice.date;
      vm.invoice.due = draft.due || vm.invoice.due;
      vm.invoice.notes = draft.notes || '';
      if (draft.items && draft.items.length) {
        draft.items.forEach(function (it) { vm.addItem(it); });
      } else {
        vm.addItem({ desc: 'UI design & audit', qty: 1, price: 15000, tax: 18, discount: 0 });
      }
    } else {
      vm.addItem({ desc: 'UI design & audit', qty: 1, price: 15000, tax: 18, discount: 0 });
    }

    /* ---------- Live totals + autosave ----------
       Replaces both the itemsBody 'input' recalc listener and the
       invoiceForm 'input' autosave listener from the old file — one
       deep watch covers everything the form and item rows can change. */
    $scope.$watch(function () {
      return { invoice: vm.invoice, items: vm.items };
    }, function () {
      vm.totals = InvoiceService.computeTotals(vm.items);
      InvoiceService.saveDraft(collect());
    }, true);

    /* ---------- Preview / print markup ----------
       Ported from buildPreviewHTML()/getTemplateInlineCSS() in the old
       file. $filter('ivfCurrency') stands in for the old formatCurrency(). */
    function buildPreviewHtml(data) {
      var template = TemplateService.getSelected();
      var currency = $filter('ivfCurrency');

      var rows = data.items.map(function (it) {
        return '<tr>' +
          '<td>' + it.desc + '</td>' +
          '<td>' + it.qty + '</td>' +
          '<td>' + currency(it.price) + '</td>' +
          '<td>' + it.tax + '%</td>' +
          '<td>' + it.discount + '%</td>' +
          '</tr>';
      }).join('');

      return '' +
        '<div class="preview-invoice template-' + template.id + '" style="--tpl-accent:' + template.accent + '; --tpl-accent-soft:' + template.accent + '1a;">' +
          '<div class="p-head">' +
            '<div>' +
              '<span class="p-invoice-title">INVOICE</span>' +
              '<div><strong>' + (data.number || 'Untitled') + '</strong></div>' +
              '<span>Date: ' + (data.date || '—') + '</span><br><span>Due: ' + (data.due || '—') + '</span>' +
            '</div>' +
            '<div><strong>Bill to</strong><br>' + (data.client || 'No client selected') + '</div>' +
          '</div>' +
          '<table>' +
            '<thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Tax</th><th>Disc.</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<p>' + ((data.notes || '').replace(/</g, '&lt;') || 'No notes added.') + '</p>' +
          '<p class="p-total">Grand total: ' + currency(data.totals.grand) + '</p>' +
          '<p class="p-template-tag">Template: ' + template.name + '</p>' +
        '</div>';
    }

    function templateInlineCss(template) {
      var base =
        '.preview-invoice{ --tpl-accent:' + template.accent + '; --tpl-accent-soft:' + template.accent + '1a; }' +
        '.p-head{ display:flex; justify-content:space-between; margin-bottom:16px; padding-bottom:10px; border-bottom:2px solid var(--tpl-accent); }' +
        '.p-invoice-title{ display:block; font-weight:800; letter-spacing:.08em; font-size:12px; color:var(--tpl-accent); margin-bottom:4px; }' +
        'table{ width:100%; border-collapse:collapse; margin-top:16px; }' +
        'th,td{ border-bottom:1px solid #E2E8F0; padding:8px; text-align:left; font-size:13px; }' +
        '.p-total{ text-align:right; font-weight:700; font-size:18px; margin-top:16px; color:var(--tpl-accent); }' +
        '.p-template-tag{ text-align:right; font-size:11px; color:#64748B; }';

      var variants = {
        classic: 'th{ background:var(--tpl-accent-soft); }',
        minimal: '.p-head{ border-bottom:1px solid var(--tpl-accent); } th{ border-bottom:1px solid var(--tpl-accent); background:none; }',
        bold: '.p-head{ background:var(--tpl-accent); color:#fff; padding:16px; border-radius:8px 8px 0 0; margin:-32px -32px 16px; } .p-invoice-title{ color:#fff; }',
        ledger: 'table{ border:1px solid var(--tpl-accent); } tr:nth-child(even){ background:var(--tpl-accent-soft); }',
        studio: '.p-head{ border-bottom:none; } .p-total{ background:var(--tpl-accent); color:#fff; display:inline-block; padding:6px 14px; border-radius:999px; float:right; }'
      };

      return base + (variants[template.id] || '');
    }

    vm.openPreview = function () {
      vm.previewHtml = $sce.trustAsHtml(buildPreviewHtml(collect()));
      vm.previewOpen = true;
    };

    vm.closePreview = function () {
      vm.previewOpen = false;
    };

    vm.downloadInvoice = function () {
      var data = collect();
      var template = TemplateService.getSelected();
      var win = window.open('', '_blank');
      win.document.write(
        '<html><head><title>' + data.number + '</title>' +
        '<style>body{font-family:Poppins,sans-serif;padding:32px;color:#1E293B} ' + templateInlineCss(template) + '</style>' +
        '</head><body>' + buildPreviewHtml(data) +
        '<script>window.onload = () => window.print();<' + '/script>' +
        '</body></html>'
      );
      win.document.close();
    };

    vm.saveInvoice = function (form) {
      if (form.$invalid) {
        ToastService.show('Fill in the required fields first.');
        return;
      }
      var data = collect();
      InvoiceService.add({
        number: data.number,
        client: data.client,
        date: data.date,
        amount: Math.round(data.totals.grand),
        status: 'Pending'
      });
      InvoiceService.clearDraft();
      ToastService.show('Invoice saved.');
    };
  }
]);
