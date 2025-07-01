const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建dist目录
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// 创建dist/cli目录
if (!fs.existsSync('dist/cli')) {
  fs.mkdirSync('dist/cli', { recursive: true });
}

// 简单的打包函数
function buildModule(srcDir, outDir) {
  console.log(`Building ${srcDir} to ${outDir}...`);
  
  // 递归复制文件
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else if (entry.name.endsWith('.ts')) {
        // 简单地将.ts文件转换为.js文件
        const content = fs.readFileSync(srcPath, 'utf-8');
        const jsContent = content
          .replace(/import\s+(.+)\s+from\s+['"](.+)\.ts['"]/g, 'import $1 from "$2.js"')
          .replace(/\.ts/g, '.js');
        
        fs.writeFileSync(destPath.replace('.ts', '.js'), jsContent);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(srcDir, outDir);
}

// 构建所有模块
buildModule('src/reactivity', 'dist/reactivity');
buildModule('src/runtime-core', 'dist/runtime-core');
buildModule('src/runtime-dom', 'dist/runtime-dom');
buildModule('src/compiler', 'dist/compiler');
buildModule('src/compiler-sfc', 'dist/compiler-sfc');
buildModule('src/shared', 'dist/shared');
buildModule('src/cli', 'dist/cli');

// 复制入口文件
fs.copyFileSync('src/index.ts', 'dist/index.js');

// 创建简单的打包文件
const bundleContent = `
import * as mvue from './index.js';
export default mvue;
export * from './index.js';
`;

fs.writeFileSync('dist/mvue.esm-bundler.js', bundleContent);

console.log('Build completed successfully!'); 