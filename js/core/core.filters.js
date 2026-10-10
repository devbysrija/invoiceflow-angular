/* ==========================================================================
   InvoiceFlow — Core filters
   Filters replace the small formatting functions from main.js/clients.js
   that used to be called manually inside template strings. In Angular
   they're used directly in markup, e.g. {{ inv.amount | ivfCurrency }}.
   ========================================================================== */

/* ---------- ivfCurrency ----------
   Replaces formatCurrency() from main.js. Reads the active currency from
   SettingsService so every page stays in sync with what's set on the
   Settings page, without each controller having to pass it in. */
angular.module('ivfCore').filter('ivfCurrency', ['SettingsService',
  function (SettingsService) {

    var SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

    return function (amount, currencyOverride) {
      var settings = SettingsService.get();
      var currency = currencyOverride || settings.currency || 'INR';
      var symbol = SYMBOLS[currency] || (currency + ' ');
      var value = Number(amount) || 0;
      return symbol + value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
  }
]);


/* ---------- initials ----------
   Replaces initials() from clients.js — used for the round avatar badge
   next to a client's name. */
angular.module('ivfCore').filter('initials', function () {
  return function (name) {
    if (!name) return '';
    return name.split(' ')
      .filter(function (w) { return w; })
      .slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); })
      .join('');
  };
});


/* ---------- statusBadgeClass ----------
   Replaces badgeClass() duplicated in both home.js and
   invoice-history.js — one definition now instead of two. */
angular.module('ivfCore').filter('statusBadgeClass', function () {
  var MAP = {
    Paid: 'badge-paid',
    Pending: 'badge-pending',
    Overdue: 'badge-overdue',
    Draft: 'badge-draft'
  };
  return function (status) {
    return MAP[status] || 'badge-draft';
  };
});


/* ---------- trustHtml ----------
   Small utility filter so the ivfSidebar directive (core.directives.js)
   can bind its icon SVG paths with ng-bind-html without pulling in the
   separate ngSanitize module. Only ever used on our own hardcoded icon
   strings, never on user-entered data. */
angular.module('ivfCore').filter('trustHtml', ['$sce',
  function ($sce) {
    return function (html) {
      return $sce.trustAsHtml(html);
    };
  }
]);
