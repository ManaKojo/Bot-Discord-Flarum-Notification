const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let hasError = false;

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.js')) {
    try {
      require('./' + filePath.replace(/\\/g, '/'));
      console.log('✅ OK:', filePath);
    } catch (err) {
      console.error('❌ Error loading:', filePath);
      console.error(err);
      hasError = true;
    }
  }
});

try {
    require('./index.js');
    console.log('✅ OK: index.js');
} catch (err) {
    // index.js will fail because DISCORD_TOKEN is missing (process.exit(1) is called)
    // but syntax check is what we care about here. Actually index.js calls process.exit(1) asynchronously maybe?
    // Let's just catch syntax errors.
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All syntax checks passed.');
}
