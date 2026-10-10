/* ==========================================================================
   InvoiceFlow — Auth page module
   Replaces auth.js. Depends on ivfCore for AuthService and ToastService.
   Two controllers, one per page — login.html uses LoginCtrl,
   signup.html uses SignupCtrl. Both use the "controller as vm" syntax
   so the HTML reads as vm.something instead of bare $scope properties.
   ========================================================================== */
angular.module('ivfAuth', ['ivfCore']);


/* ---------- LoginCtrl ---------- */
angular.module('ivfAuth').controller('LoginCtrl', ['AuthService', 'ToastService', '$window', '$timeout',
  function (AuthService, ToastService, $window, $timeout) {
    var vm = this;

    vm.credentials = {
      email: '',
      password: '',
      remember: true
    };

    vm.submit = function (form) {
      if (form.$invalid) {
        return;
      }

      AuthService.login(vm.credentials.email, vm.credentials.remember);
      ToastService.show('Logged in. Redirecting…');

      $timeout(function () {
        $window.location.href = 'home.html';
      }, 600);
    };
  }
]);


/* ---------- SignupCtrl ---------- */
angular.module('ivfAuth').controller('SignupCtrl', ['AuthService', 'ToastService', '$window', '$timeout',
  function (AuthService, ToastService, $window, $timeout) {
    var vm = this;

    vm.account = {
      fullName: '',
      email: '',
      phone: '',
      password: ''
    };

    vm.submit = function (form) {
      if (form.$invalid) {
        return;
      }

      AuthService.signup(vm.account);
      ToastService.show('Account created. Redirecting…');

      $timeout(function () {
        $window.location.href = 'home.html';
      }, 600);
    };
  }
]);
