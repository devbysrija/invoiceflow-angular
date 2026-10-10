/* ==========================================================================
   InvoiceFlow — Invoice History page module
   Replaces invoice-history.js. Search box + status <select> combine
   into one predicate function (vm.matchesFilters) fed to Angular's
   built-in `filter`, replacing the manual query/status re-render in
   renderTable(). Edit-status modal and delete both go through
   InvoiceService instead of touching localStorage directly.
   ========================================================================== */
angular.module('ivfInvoiceHistory', ['ivfCore']);

angular.module('ivfInvoiceHistory').controller('InvoiceHistoryCtrl', ['$filter', 'AuthService', 'InvoiceService', 'ToastService',
  function ($filter, AuthService, InvoiceService, ToastService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    InvoiceService.seedIfEmpty();

    vm.invoices = InvoiceService.getAll();
    vm.query = '';
    vm.status = '';

    vm.viewModalOpen = false;
    vm.editModalOpen = false;
    vm.viewInvoice = null;
    vm.editForm = {};

    function refresh() {
      vm.invoices = InvoiceService.getAll();
    }

    /* Combined search + status predicate, used as
       `vm.invoices | filter:vm.matchesFilters` in the template. */
    vm.matchesFilters = function (inv) {
      var q = (vm.query || '').toLowerCase();
      var matchesQuery = !q || inv.number.toLowerCase().indexOf(q) > -1 || inv.client.toLowerCase().indexOf(q) > -1;
      var matchesStatus = !vm.status || inv.status === vm.status;
      return matchesQuery && matchesStatus;
    };

    vm.openView = function (inv) {
      vm.viewInvoice = inv;
      vm.viewModalOpen = true;
    };

    vm.closeView = function () {
      vm.viewModalOpen = false;
    };

    vm.openEdit = function (inv) {
      vm.editForm = { id: inv.id, amount: inv.amount, status: inv.status };
      vm.editModalOpen = true;
    };

    vm.closeEdit = function () {
      vm.editModalOpen = false;
    };

    vm.saveEdit = function (form) {
      if (form.$invalid) return;
      InvoiceService.update(vm.editForm.id, {
        amount: parseFloat(vm.editForm.amount) || 0,
        status: vm.editForm.status
      });
      refresh();
      ToastService.show('Invoice updated.');
      vm.editModalOpen = false;
    };

    vm.deleteInvoice = function (inv) {
      if (confirm('Delete invoice ' + inv.number + '? This can\'t be undone.')) {
        InvoiceService.remove(inv.id);
        refresh();
        ToastService.show('Invoice deleted.');
      }
    };

    vm.downloadInvoice = function (inv) {
      var currency = $filter('ivfCurrency');
      var win = window.open('', '_blank');
      win.document.write(
        '<html><head><title>' + inv.number + '</title>' +
        '<style>body{font-family:Poppins,sans-serif;padding:32px;color:#1E293B}</style></head>' +
        '<body>' +
          '<h2>' + inv.number + '</h2>' +
          '<p>Client: ' + inv.client + '</p>' +
          '<p>Date: ' + inv.date + '</p>' +
          '<p>Status: ' + inv.status + '</p>' +
          '<h3>Amount due: ' + currency(inv.amount) + '</h3>' +
          '<script>window.onload = () => window.print();<' + '/script>' +
        '</body></html>'
      );
      win.document.close();
    };
  }
]);
