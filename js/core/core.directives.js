/* ==========================================================================
   InvoiceFlow — Core directives
   Replaces the DOM-manipulation helpers from main.js (renderSidebar,
   the modal-overlay open/close class toggling repeated on every page)
   and the canvas signature-pad code from invoice-create.js.
   ========================================================================== */

/* ---------- ivfSidebar ----------
   Replaces renderSidebar() from main.js. Usage:
     <ivf-sidebar active-page="clients"></ivf-sidebar>
   in place of the old <div id="sidebar-root"></div>.

   Mobile open/close is driven by a $rootScope broadcast
   ('ivf:sidebar:openMobile') so the existing #mobileMenuBtn in each
   page's topbar markup can trigger it without needing a direct
   reference to this directive's isolated scope. */
angular.module('ivfCore').directive('ivfSidebar', ['$rootScope', 'AuthService',
  function ($rootScope, AuthService) {
    return {
      restrict: 'E',
      scope: {
        activePage: '@'
      },
      template: [
        '<aside class="sidebar" ng-class="{collapsed: collapsed}">',
        '  <button class="sidebar-toggle" aria-label="Collapse sidebar" ng-click="toggleCollapse()">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
        '  </button>',
        '  <a href="home.html" class="sidebar-brand">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--color-primary)"><path d="M4 12c2 3 4 3 5-1s3-4 5-1 4 3 6-1"/></svg>',
        '    <span>InvoiceFlow</span>',
        '  </a>',
        '  <nav class="sidebar-nav" aria-label="Primary">',
        '    <a class="nav-link" ng-repeat="item in navItems" ng-class="{active: item.page === activePage}" ng-href="{{item.href}}">',
        '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ng-bind-html="item.icon | trustHtml"></svg>',
        '      <span>{{item.label}}</span>',
        '    </a>',
        '  </nav>',
        '  <a href="index.html" class="nav-link logout" ng-click="logout($event)">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
        '    <span>Logout</span>',
        '  </a>',
        '</aside>',
        '<div class="sidebar-backdrop" ng-class="{show: mobileOpen}" ng-click="closeMobile()"></div>'
      ].join(''),
      link: function (scope) {
        scope.collapsed = false;
        scope.mobileOpen = false;

        scope.navItems = [
          { href: 'home.html', label: 'Home', page: 'home',
            icon: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/>' },
          { href: 'clients.html', label: 'Clients', page: 'clients',
            icon: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.7.4 4.5 2.6 4.5 5.8"/>' },
          { href: 'create-invoice.html', label: 'Create Invoice', page: 'create-invoice',
            icon: '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M13 3v5h5"/><path d="M12 12v6M9 15h6"/>' },
          { href: 'invoice-history.html', label: 'Invoice History', page: 'invoice-history',
            icon: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l4 2"/>' },
          { href: 'templates.html', label: 'Templates', page: 'templates',
            icon: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>' },
          { href: 'settings.html', label: 'Settings', page: 'settings',
            icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.5.7.9 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>' }
        ];

        scope.toggleCollapse = function () {
          if (window.innerWidth <= 900) {
            scope.mobileOpen = false;
          } else {
            scope.collapsed = !scope.collapsed;
          }
        };

        scope.closeMobile = function () {
          scope.mobileOpen = false;
        };

        scope.logout = function ($event) {
          $event.preventDefault();
          AuthService.logout();
        };

        var unbind = $rootScope.$on('ivf:sidebar:openMobile', function () {
          scope.mobileOpen = true;
        });
        scope.$on('$destroy', unbind);
      }
    };
  }
]);


/* ---------- ivfMobileMenuBtn ----------
   Drop-in replacement for the old #mobileMenuBtn click listener. Put
   this attribute on the existing button in each page's .mobile-topbar
   markup instead of giving it an id + wiring it up in page JS:
     <button ivf-mobile-menu-btn aria-label="Open menu">...</button> */
angular.module('ivfCore').directive('ivfMobileMenuBtn', ['$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.on('click', function () {
          $rootScope.$broadcast('ivf:sidebar:openMobile');
        });
      }
    };
  }
]);


/* ---------- ivfModal ----------
   Replaces the repeated "open"-class toggling + backdrop-click-to-close
   pattern used on every modal-overlay across clients.js,
   invoice-create.js and invoice-history.js. Usage:
     <div class="modal-overlay" ivf-modal="vm.clientModalOpen"> ... </div>
   Binds two-way to a boolean on the controller; setting it to true/false
   from a button's ng-click opens/closes the modal, and clicking the
   overlay backdrop sets it back to false automatically. */
angular.module('ivfCore').directive('ivfModal', function () {
  return {
    restrict: 'A',
    scope: {
      ivfModal: '='
    },
    link: function (scope, element) {
      scope.$watch('ivfModal', function (isOpen) {
        element.toggleClass('open', !!isOpen);
      });

      element.on('click', function (e) {
        if (e.target === element[0]) {
          scope.$apply(function () {
            scope.ivfModal = false;
          });
        }
      });
    }
  };
});


/* ---------- ivfSignaturePad ----------
   Replaces the canvas drawing code from invoice-create.js. Usage:
     <canvas ivf-signature-pad="vm.sigPad" width="360" height="120"></canvas>
   Exposes {clear, isEmpty, dataUrl} on vm.sigPad so the controller can
   call vm.sigPad.clear() or read vm.sigPad.dataUrl() when saving. */
angular.module('ivfCore').directive('ivfSignaturePad', function () {
  return {
    restrict: 'A',
    scope: {
      ivfSignaturePad: '='
    },
    link: function (scope, element) {
      var canvas = element[0];
      var ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      var drawing = false;
      var hasDrawn = false;

      function getPos(e) {
        var rect = canvas.getBoundingClientRect();
        var point = e.touches ? e.touches[0] : e;
        return {
          x: (point.clientX - rect.left) * (canvas.width / rect.width),
          y: (point.clientY - rect.top) * (canvas.height / rect.height)
        };
      }

      function start(e) {
        drawing = true;
        hasDrawn = true;
        var p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        e.preventDefault();
      }

      function move(e) {
        if (!drawing) return;
        var p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        e.preventDefault();
      }

      function end() {
        drawing = false;
      }

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);

      scope.ivfSignaturePad = {
        clear: function () {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasDrawn = false;
        },
        isEmpty: function () {
          return !hasDrawn;
        },
        dataUrl: function () {
          return canvas.toDataURL('image/png');
        }
      };
    }
  };
});


/* ---------- ivfPhone ----------
   Custom form validator directive, replacing VALIDATORS.phone from
   main.js. Plugs into Angular's native form validation instead of the
   old hand-rolled attachInlineValidation()/validateForm() pair — use it
   alongside required/type="email"/ng-minlength, which Angular already
   understands natively. Usage:
     <input type="tel" ng-model="vm.client.phone" ivf-phone required>
   Then in markup: <span ng-if="form.phone.$error.ivfPhone">...</span> */
angular.module('ivfCore').directive('ivfPhone', function () {
  var PHONE_RE = /^[+]?[\d\s()-]{7,15}$/;
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      ngModel.$validators.ivfPhone = function (value) {
        if (ngModel.$isEmpty(value)) return true; // let `required` own empty values
        return PHONE_RE.test(value);
      };
    }
  };
});


/* ---------- ivfFileChange ----------
   Angular has no ng-model support for <input type="file">, so this
   bridges the native 'change' event into a controller call. Usage:
     <input type="file" ivf-file-change="vm.onLogoSelected($files)">
   Replaces the settings.js logoInput 'change' listener. */
angular.module('ivfCore').directive('ivfFileChange', function () {
  return {
    restrict: 'A',
    scope: {
      ivfFileChange: '&'
    },
    link: function (scope, element) {
      element.on('change', function (e) {
        var files = e.target.files;
        scope.$apply(function () {
          scope.ivfFileChange({ $files: files });
        });
      });
    }
  };
});


/* ---------- ivfToast ----------
   Replaces showToast()'s DOM-creation logic from main.js. Drop
   <ivf-toast></ivf-toast> once near the end of <body> on each page;
   ToastService.show('message') from any controller then displays it. */
angular.module('ivfCore').directive('ivfToast', ['ToastService',
  function (ToastService) {
    return {
      restrict: 'E',
      template: '<div class="toast" ng-class="{show: toast.visible}">{{toast.message}}</div>',
      link: function (scope) {
        scope.toast = ToastService.state;
      }
    };
  }
]);
