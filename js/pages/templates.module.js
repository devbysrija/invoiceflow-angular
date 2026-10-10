/* ==========================================================================
   InvoiceFlow — Templates page module
   Replaces templates.js. Template list + the currently selected id come
   from TemplateService (shared with invoice-create.js's preview/print).
   The sample data used to render each mini invoice preview stays local
   to this controller, same as it did in the original file — it's only
   ever illustrative and is never saved anywhere.
   ========================================================================== */
angular.module('ivfTemplates', ['ivfCore']);

angular.module('ivfTemplates').controller('TemplatesCtrl', ['AuthService', 'TemplateService', 'ToastService',
  function (AuthService, TemplateService, ToastService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    vm.templates = TemplateService.getAll();
    vm.selectedId = TemplateService.getSelectedId();

    vm.sample = {
      number: 'INV-1042',
      client: 'Orion Textiles',
      items: [
        { desc: 'UI design', amount: 15000 },
        { desc: 'Hosting (1 yr)', amount: 2400 }
      ],
      total: 17400
    };

    // alpha as 2-digit hex, e.g. '1a' ≈ 10% opacity — same string
    // concatenation trick the original hexAlpha() used.
    vm.accentSoft = function (hex) {
      return hex + '1a';
    };

    vm.useTemplate = function (t) {
      TemplateService.setSelectedId(t.id);
      vm.selectedId = t.id;
      ToastService.show('Template selected for new invoices.');
    };
  }
]);
