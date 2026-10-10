/* ==========================================================================
   InvoiceFlow — Home page module
   Replaces home.js. Reads clients/invoices via ClientService/
   InvoiceService instead of calling readLS() directly, and leaves all
   formatting (currency, status badges) to the ivfCurrency /
   statusBadgeClass filters in the template rather than building HTML
   strings here.
   ========================================================================== */
angular.module('ivfHome', ['ivfCore']);

angular.module('ivfHome').controller('HomeCtrl', ['AuthService', 'ClientService', 'InvoiceService',
  function (AuthService, ClientService, InvoiceService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    ClientService.seedIfEmpty();
    InvoiceService.seedIfEmpty();

    vm.user = user;
    vm.invoices = InvoiceService.getAll();
    vm.clients = ClientService.getAll();

    vm.totalInvoiced = vm.invoices.reduce(function (sum, inv) {
      return sum + Number(inv.amount || 0);
    }, 0);

    vm.pendingCount = vm.invoices.filter(function (inv) { return inv.status === 'Pending'; }).length;
    vm.overdueCount = vm.invoices.filter(function (inv) { return inv.status === 'Overdue'; }).length;
    vm.clientCount = vm.clients.length;

    vm.recentInvoices = vm.invoices.slice(0, 5);
  }
]);
