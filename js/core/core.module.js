/* ==========================================================================
   InvoiceFlow — Core module
   Every authenticated page loads this module before its own page module.
   It has no controllers of its own — only factories, filters and
   directives that are shared across every page (equivalent to what
   main.js used to hold as plain functions).
   ========================================================================== */
angular.module('ivfCore', []);
