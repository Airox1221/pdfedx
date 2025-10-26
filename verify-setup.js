#!/usr/bin/env node

/**
 * PDF Editor - Setup Verification Script
 * Run this after installation to verify everything is set up correctly
 * 
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PDF Editor - Setup Verification\n');
console.log('='.repeat(50));

let passedChecks = 0;
let totalChecks = 0;

function check(description, testFn) {
  totalChecks++;
  process.stdout.write(`\n[${totalChecks}] ${description}... `);
  
  try {
    const result = testFn();
    if (result) {
      console.log('✅ PASS');
      passedChecks++;
      return true;
    } else {
      console.log('❌ FAIL');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Check 1: Node.js version
check('Node.js version >= 18', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major >= 18) {
    console.log(`    Found: ${version}`);
    return true;
  }
  console.log(`    Found: ${version} (requires >= v18)`);
  return false;
});

// Check 2: package.json exists
check('package.json exists', () => {
  return fs.existsSync(path.join(__dirname, 'package.json'));
});

// Check 3: node_modules exists
check('node_modules installed', () => {
  const exists = fs.existsSync(path.join(__dirname, 'node_modules'));
  if (!exists) {
    console.log('    Run: npm install');
  }
  return exists;
});

// Check 4: Required dependencies
check('Required dependencies installed', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  const required = [
    'next', 'react', 'react-dom', 'pdf-lib', 'react-pdf',
    'express', 'multer', 'cors', 'sharp'
  ];
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missing = required.filter(dep => !dependencies[dep]);
  
  if (missing.length > 0) {
    console.log(`    Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Check 5: App directory structure
check('App directory structure', () => {
  const requiredFiles = [
    'app/layout.js',
    'app/page.js',
    'app/globals.css'
  ];
  
  const missing = requiredFiles.filter(file => 
    !fs.existsSync(path.join(__dirname, file))
  );
  
  if (missing.length > 0) {
    console.log(`    Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Check 6: Components directory
check('Components directory', () => {
  const requiredComponents = [
    'components/PDFEditor.js',
    'components/FileUpload.js',
    'components/PDFPreview.js',
    'components/Toolbar.js',
    'components/ProgressBar.js',
    'components/ErrorMessage.js'
  ];
  
  const missing = requiredComponents.filter(file => 
    !fs.existsSync(path.join(__dirname, file))
  );
  
  if (missing.length > 0) {
    console.log(`    Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Check 7: Server directory
check('Server directory', () => {
  return fs.existsSync(path.join(__dirname, 'server/index.js'));
});

// Check 8: Configuration files
check('Configuration files', () => {
  const requiredConfigs = [
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'jsconfig.json'
  ];
  
  const missing = requiredConfigs.filter(file => 
    !fs.existsSync(path.join(__dirname, file))
  );
  
  if (missing.length > 0) {
    console.log(`    Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Check 9: Environment variables
check('Environment variables', () => {
  const exists = fs.existsSync(path.join(__dirname, '.env.local'));
  if (exists) {
    const content = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    if (content.includes('NEXT_PUBLIC_API_URL')) {
      return true;
    }
    console.log('    Missing NEXT_PUBLIC_API_URL');
    return false;
  }
  console.log('    .env.local not found');
  return false;
});

// Check 10: Documentation files
check('Documentation files', () => {
  const docs = [
    'README.md',
    'QUICKSTART.md',
    'INSTALLATION.md',
    'PROJECT_SUMMARY.md'
  ];
  
  const missing = docs.filter(file => 
    !fs.existsSync(path.join(__dirname, file))
  );
  
  if (missing.length > 0) {
    console.log(`    Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All checks passed! Your setup is complete.');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000');
  console.log('   3. Upload a PDF file to test');
  console.log('\n📚 Documentation:');
  console.log('   - Quick start: QUICKSTART.md');
  console.log('   - Full guide: README.md');
} else {
  console.log('\n⚠️  Some checks failed. Please review the errors above.');
  console.log('\n🔧 Common fixes:');
  console.log('   - Run: npm install');
  console.log('   - Check file structure matches documentation');
  console.log('   - Verify Node.js version >= 18');
  console.log('\n📚 See INSTALLATION.md for detailed setup instructions.');
}

console.log('\n');

process.exit(passedChecks === totalChecks ? 0 : 1);
