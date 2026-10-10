/* ==========================================================================
   InvoiceFlow — Settings page module
   Replaces settings.js. Company details go through SettingsService;
   logo upload uses the ivfFileChange directive instead of a manual
   'change' listener; geolocation + reverse-geocoding are ported as-is
   but use $http instead of the raw fetch() call so responses flow
   through Angular's digest cycle automatically.
   ========================================================================== */
angular.module('ivfSettings', ['ivfCore']);

angular.module('ivfSettings').controller('SettingsCtrl', ['$scope', '$http', 'AuthService', 'SettingsService', 'ToastService',
  function ($scope, $http, AuthService, SettingsService, ToastService) {
    var vm = this;

    var user = AuthService.requireAuth(); // bounces to login.html if no session
    if (!user) return;

    vm.settings = SettingsService.get();
    vm.logoDataUrl = vm.settings.logo || null;
    vm.locationStatus = '';

    vm.saveSettings = function (form) {
      if (form.$invalid) {
        ToastService.show('Check the highlighted fields.');
        return;
      }
      SettingsService.save(vm.settings);
      ToastService.show('Settings saved.');
    };

    /* ---------- Logo upload ---------- */
    vm.onLogoSelected = function (files) {
      var file = files && files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        ToastService.show('Logo must be under 2MB.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        // FileReader callbacks run outside Angular's digest cycle.
        $scope.$apply(function () {
          vm.logoDataUrl = reader.result;
          vm.settings.logo = reader.result;
          SettingsService.save(vm.settings);
        });
        ToastService.show('Logo updated.');
      };
      reader.readAsDataURL(file);
    };

    /* ---------- Geolocation ---------- */
    vm.useCurrentLocation = function () {
      if (!('geolocation' in navigator)) {
        vm.locationStatus = 'Geolocation is not supported by this browser.';
        return;
      }

      vm.locationStatus = 'Locating…';

      navigator.geolocation.getCurrentPosition(function (pos) {
        var latitude = pos.coords.latitude;
        var longitude = pos.coords.longitude;

        // Also outside Angular's digest cycle — same reason as above.
        $scope.$apply(function () {
          vm.locationStatus = 'Location found (' + latitude.toFixed(3) + ', ' + longitude.toFixed(3) + '). Looking up address…';
        });

        $http.get('https://nominatim.openstreetmap.org/reverse', {
          params: { format: 'json', lat: latitude, lon: longitude }
        }).then(function (response) {
          vm.settings.address = response.data.display_name || (latitude + ', ' + longitude);
          vm.locationStatus = 'Address filled from your current location.';
        }).catch(function () {
          vm.settings.address = 'Lat ' + latitude.toFixed(5) + ', Lng ' + longitude.toFixed(5);
          vm.locationStatus = 'Filled coordinates — address lookup was unavailable.';
        });
      }, function () {
        $scope.$apply(function () {
          vm.locationStatus = 'Location permission denied or unavailable.';
        });
      });
    };
  }
]);
