const { readFileSync, readdirSync } = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const scanDirs = ['server', 'js'];
const files = [];

function collectJsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath);
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.bak')) {
      files.push(fullPath);
    }
  });
}

scanDirs.forEach((dir) => collectJsFiles(path.join(rootDir, dir)));

let failed = false;

files.forEach((file) => {
  const relative = path.relative(rootDir, file);
  try {
    new vm.Script(readFileSync(file, 'utf8'), { filename: relative });
    process.stdout.write(`ok ${relative}\n`);
  } catch (error) {
    failed = true;
    process.stderr.write(`\nSyntax check failed: ${relative}\n`);
    process.stderr.write(`${error.message}\n`);
  }
});

if (failed) process.exit(1);
