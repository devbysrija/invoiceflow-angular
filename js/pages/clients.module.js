/* ==========================================================================
   InvoiceFlow — Clients page module
   Replaces clients.js. CRUD goes through ClientService; the search box
   uses a predicate function (vm.matchesQuery) plugged into Angular's
   built-in `filter` filter in the template instead of a manual
   renderTable() that rebuilt the whole <tbody> on every keystroke.
   ========================================================================== */
angular.module('ivfClients', ['ivfCore']);

angular.module('ivfClients').controller('ClientsCtrl', ['AuthService', 'ClientService', 'ToastService',
  function (AuthService, ClientService, ToastService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    ClientService.seedIfEmpty();

    vm.clients = ClientService.getAll();
    vm.query = '';

    vm.clientModalOpen = false;
    vm.viewModalOpen = false;
    vm.modalTitle = 'Add client';
    vm.form = {};
    vm.viewClient = null;

    function refresh() {
      vm.clients = ClientService.getAll();
    }

    /* Predicate used as `vm.clients | filter:vm.matchesQuery` in the
       template — replaces the manual .filter() inside renderTable(). */
    vm.matchesQuery = function (client) {
      var q = (vm.query || '').toLowerCase();
      if (!q) return true;
      return client.name.toLowerCase().indexOf(q) > -1 ||
             client.company.toLowerCase().indexOf(q) > -1 ||
             client.email.toLowerCase().indexOf(q) > -1;
    };

    vm.openAddModal = function () {
      vm.modalTitle = 'Add client';
      vm.form = { id: '', name: '', company: '', email: '', phone: '' };
      vm.clientModalOpen = true;
    };

    vm.openEditModal = function (client) {
      vm.modalTitle = 'Edit client';
      vm.form = angular.copy(client);
      vm.clientModalOpen = true;
    };

    vm.closeClientModal = function () {
      vm.clientModalOpen = false;
    };

    vm.saveClient = function (form) {
      if (form.$invalid) return;

      var payload = {
        name: vm.form.name.trim(),
        company: vm.form.company.trim(),
        email: vm.form.email.trim(),
        phone: vm.form.phone.trim()
      };

      if (vm.form.id) {
        ClientService.update(vm.form.id, payload);
        ToastService.show('Client updated.');
      } else {
        ClientService.add(payload);
        ToastService.show('Client added.');
      }

      refresh();
      vm.clientModalOpen = false;
    };

    vm.openViewModal = function (client) {
      vm.viewClient = client;
      vm.viewModalOpen = true;
    };

    vm.closeViewModal = function () {
      vm.viewModalOpen = false;
    };

    vm.deleteClient = function (client) {
      if (confirm('Remove ' + client.name + ' from your clients?')) {
        ClientService.remove(client.id);
        ToastService.show('Client removed.');
        refresh();
      }
    };
  }
]);
