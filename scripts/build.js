const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

const JS_FILES = [
  'supabase-config.js',
  'config.js',
  'src/constants.js',
  'src/app.js',
  'src/app-sync.js',
  'src/app-notifs.js',
  'src/app-users.js',
  'src/app-mobile.js',
  // 'src/alas-auth-client.js',  // fuera del bundle: el Calendario usa su propio
  //                             // padron y no depende del Launcher. Ver el encabezado
  //                             // del archivo para reactivarlo.
  'src/app-boot.js',
  'src/supabase-db.js'
].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f));

const CSS_FILES = [
  'tokens.css',
  'layout.css',
  'components.css',
  'mobile.css'
].map(f => path.join(ROOT, 'src', 'styles', f)).filter(f => fs.existsSync(f));

async function build() {
  // Build supabase-js as standalone library
  const supabaseEntry = path.join(ROOT, 'scripts', '_supabase_entry.js');
  const supabaseCode = `
    import { createClient } from '@supabase/supabase-js';
    window.__supabase__ = { createClient };
  `;
  fs.writeFileSync(supabaseEntry, supabaseCode);

  const supabaseResult = await esbuild.build({
    entryPoints: [supabaseEntry],
    bundle: true,
    minify: true,
    write: false,
    platform: 'browser',
    target: ['es2020'],
    format: 'iife'
  });

  const supabaseHash = crypto.createHash('md5').update(supabaseResult.outputFiles[0].contents).digest('hex').slice(0, 8);
  const supabaseFilename = `supabase-lib.${supabaseHash}.min.js`;
  fs.writeFileSync(path.join(ROOT, supabaseFilename), supabaseResult.outputFiles[0].contents);
  console.log(`Supabase lib: ${supabaseFilename} (${(supabaseResult.outputFiles[0].contents.length / 1024).toFixed(0)} KB)`);

  fs.unlinkSync(supabaseEntry);

  // Concatenate JS files in order
  let jsContent = '';
  for (const file of JS_FILES) {
    const content = fs.readFileSync(file, 'utf-8');
    const modified = content.replace(
      /const \{ createClient \} = window\.supabase \|\| \{\};/g,
      'const { createClient } = window.__supabase__ || window.supabase || {};'
    ).replace(
      /window\.SUPABASE = null;\s+return;\s+\}\s+const supabase = createClient/g,
      'return;\n  }\n  if (!createClient) { window.SUPABASE = null; return; }\n  const supabase = createClient'
    );
    jsContent += modified + ';\n';
  }

  const minified = await esbuild.transform(jsContent, {
    minify: true,
    target: ['es2020'],
    platform: 'browser'
  });

  const hash = crypto.createHash('md5').update(minified.code).digest('hex').slice(0, 8);
  const jsFilename = `app.${hash}.min.js`;

  fs.writeFileSync(path.join(ROOT, jsFilename), minified.code);
  console.log(`App bundle: ${jsFilename} (${(minified.code.length / 1024).toFixed(0)} KB)`);

  // Bundle CSS
  let cssContent = '';
  for (const file of CSS_FILES) {
    cssContent += fs.readFileSync(file, 'utf-8') + '\n';
  }

  const cssHash = crypto.createHash('md5').update(cssContent).digest('hex').slice(0, 8);
  const cssFilename = `styles.${cssHash}.min.css`;

  const cssMinified = await esbuild.transform(cssContent, {
    loader: 'css',
    minify: true
  });

  fs.writeFileSync(path.join(ROOT, cssFilename), cssMinified.code);
  console.log(`CSS bundle: ${cssFilename} (${(cssMinified.code.length / 1024).toFixed(0)} KB)`);

  // Update index.html
  const indexPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Remove all individual JS/CSS script tags except supabase-lib and app bundle
  html = html.replace(
    /<script[^>]+src="(?:supabase-config\.js(?:\?[^"]*)?|config\.js(?:\?[^"]*)?|src\/constants\.js(?:\?[^"]*)?|src\/app\.js(?:\?[^"]*)?|src\/app-sync\.js(?:\?[^"]*)?|src\/app-notifs\.js(?:\?[^"]*)?|src\/app-users\.js(?:\?[^"]*)?|src\/app-mobile\.js(?:\?[^"]*)?|src\/app-boot\.js(?:\?[^"]*)?|src\/supabase-db\.js(?:\?[^"]*)?)"[^>]*><\/script>/g,
    ''
  );
  html = html.replace(/<link rel="stylesheet"[^>]*href="[^"]*tokens\.css[^"]*"[^>]*>[\s\S]*?<link rel="stylesheet"[^>]*href="[^"]*mobile\.css[^"]*"[^>]*>/, '');

  // Remove old bundle references
  html = html.replace(/<script[^>]+src="app\.[a-f0-9]+\.min\.js"[^>]*><\/script>/g, '');
  html = html.replace(/<link[^>]+href="styles\.[a-f0-9]+\.min\.css"[^>]*>/g, '');
  html = html.replace(/<script[^>]+src="supabase-lib\.[a-f0-9]+\.min\.js"[^>]*><\/script>/g, '');

  // Add CSS bundle before </head>
  const cssTag = `<link rel="stylesheet" href="${cssFilename}">`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${cssTag}\n</head>`);
  }

  // Add supabase-lib and app bundle before </body>
  const scripts = [
    `<script src="${supabaseFilename}" defer></script>`,
    `<script src="${jsFilename}" defer></script>`
  ].join('\n  ');

  if (html.includes('</body>')) {
    html = html.replace('</body>', `  ${scripts}\n</body>`);
  }

  fs.writeFileSync(indexPath, html);
  console.log('index.html updated');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
