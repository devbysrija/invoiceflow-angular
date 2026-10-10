/* ==========================================================================
   InvoiceFlow — Landing page module
   Replaces index.js. This page has no login, no data — just the mobile
   nav toggle — so it gets a minimal module of its own rather than
   pulling in ivfCore (which it doesn't need).
   ========================================================================== */
angular.module('ivfLanding', []);

angular.module('ivfLanding').controller('LandingCtrl', function () {
  var vm = this;
  vm.navOpen = false;

  vm.toggleNav = function () {
    vm.navOpen = !vm.navOpen;
  };
});
