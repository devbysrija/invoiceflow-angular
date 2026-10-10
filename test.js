const fs = require('fs');

console.log('Running InvoiceFlow tests...');

const requiredFiles = [
  'index.html',
  'login.html',
  'signup.html',
  'home.html',
  'create-invoice.html',
  'invoice-history.html',
  'clients.html',
  'settings.html',
  'templates.html',
  'css/main.css',
  'js/vendor/angular.min.js'
];

let failed = 0;

requiredFiles.forEach((file) => {
  if (fs.existsSync('./' + file)) {
    console.log('\u2713 ' + file + ' exists');
  } else {
    console.log('\u2717 ' + file + ' is missing');
    failed++;
  }
});

if (failed > 0) {
  console.log(failed + ' test(s) failed!');
  process.exit(1);
}

console.log('All InvoiceFlow tests passed!');