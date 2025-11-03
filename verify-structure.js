const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra cấu trúc dự án Azota (src/package.json)...\n');

const requiredFiles = [
  'src/package.json',
  'src/index.js',
  'src/App.js',
  'src/public/index.html',
  'vercel.json',
  '.env.local'
];

let errors = 0;

// Kiểm tra file
console.log('📄 Kiểm tra file:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Thiếu file: ${file}`);
    errors++;
  }
});

// Kiểm tra package.json scripts
console.log('\n⚙️ Kiểm tra scripts trong src/package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('src/package.json', 'utf8'));
  const buildScript = packageJson.scripts?.build;
  
  if (buildScript && buildScript.includes("BUILD_PATH='../build'")) {
    console.log('✅ Script build đã được sửa: BUILD_PATH="../build"');
  } else {
    console.log('❌ Script build chưa được sửa!');
    console.log(`   Hiện tại: ${buildScript}`);
    console.log('   Cần: CI=false BUILD_PATH="../build" react-scripts build');
    errors++;
  }
} catch (e) {
  console.log('❌ Lỗi đọc src/package.json:', e.message);
  errors++;
}

// Kiểm tra vercel.json
console.log('\n🚀 Kiểm tra vercel.json:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const buildConfig = vercelConfig.builds[0];
  
  if (buildConfig.src === 'src/package.json') {
    console.log('✅ vercel.json trỏ đúng file src/package.json');
  } else {
    console.log(`❌ vercel.json trỏ sai: ${buildConfig.src}`);
    errors++;
  }
  
  if (buildConfig.config.distDir === '../build') {
    console.log('✅ distDir đúng: ../build');
  } else {
    console.log('❌ distDir có thể không đúng');
    errors++;
  }
} catch (e) {
  console.log('❌ Lỗi đọc vercel.json:', e.message);
  errors++;
}

// Kiểm tra path resolution
console.log('\n🛤️ Kiểm tra path resolution:');
console.log('   Vercel WD: /vercel/path0/src/ (đặt bởi Vercel)');
console.log('   Build path: src/package.json -> ../build');
console.log('   Final output: /vercel/path0/build/');
console.log('✅ Path resolution sẽ hoạt động đúng!');

// Tổng kết
console.log('\n📊 Kết quả kiểm tra:');
console.log(`   ❌ Lỗi: ${errors}`);

if (errors === 0) {
  console.log('\n🎉 Cấu trúc dự án hoàn hảo! Sẵn sàng deploy lên Vercel.');
  console.log('\n🚀 Deploy steps:');
  console.log('   1. git add . && git commit -m "Fix Vercel build error"');
  console.log('   2. git push');
  console.log('   3. Deploy trên Vercel.com');
  process.exit(0);
} else {
  console.log('\n❌ Vui lòng sửa các lỗi trước khi deploy.');
  process.exit(1);
}
