const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const source = path.join(cwd, '../ReadMe.md');
const destination = path.join(cwd, './README.md');

fs.copyFileSync(source, destination);
console.log('✅ README copied for publish.', destination);
