const fs = require('fs');
const path = require('path');

// 简单的SFC解析函数
function parseSFC(source) {
  const descriptor = {
    template: null,
    script: null,
    styles: []
  };

  // 解析模板
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    descriptor.template = {
      content: templateMatch[1].trim()
    };
  }

  // 解析脚本
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    descriptor.script = {
      content: scriptMatch[1].trim()
    };
  }

  // 解析样式
  const styleRegex = /<style>([\s\S]*?)<\/style>/g;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(source))) {
    descriptor.styles.push({
      content: styleMatch[1].trim()
    });
  }

  return descriptor;
}

// 简单的SFC编译函数
function compileSFC(source, filename) {
  const descriptor = parseSFC(source);
  
  // 生成JavaScript代码
  let code = '';
  
  // 导入部分
  code += `import { h, defineComponent } from '../mini-vue-local/mvue.esm-bundler.js'\n\n`;
  
  // 脚本部分
  if (descriptor.script) {
    // 提取import语句
    const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
    const imports = descriptor.script.content.match(importRegex) || [];
    
    // 移除import语句
    let scriptContent = descriptor.script.content;
    imports.forEach(imp => {
      scriptContent = scriptContent.replace(imp, '');
    });
    
    // 添加import语句
    imports.forEach(imp => {
      code += imp + '\n';
    });
    
    code += '\n';
    
    // 添加脚本内容
    code += scriptContent;
  }
  
  // 样式部分
  descriptor.styles.forEach((style, i) => {
    const cssFile = filename.replace(/\.vue$/, `.${i}.css`);
    fs.writeFileSync(cssFile, style.content);
  });
  
  return code;
}

// 编译所有Vue组件
function compileAllComponents() {
  console.log('正在编译所有Vue组件...');
  
  // 编译App.vue
  console.log('编译App.vue...');
  const appSource = fs.readFileSync('./src/App.vue', 'utf-8');
  const appCode = compileSFC(appSource, './src/App.vue.js');
  fs.writeFileSync('./src/App.vue.js', appCode);
  
  // 编译HelloWorld.vue
  console.log('编译HelloWorld.vue...');
  const helloWorldSource = fs.readFileSync('./src/components/HelloWorld.vue', 'utf-8');
  const helloWorldCode = compileSFC(helloWorldSource, './src/components/HelloWorld.vue.js');
  fs.writeFileSync('./src/components/HelloWorld.vue.js', helloWorldCode);
  
  // 编译Counter.vue
  console.log('编译Counter.vue...');
  const counterSource = fs.readFileSync('./src/components/Counter.vue', 'utf-8');
  const counterCode = compileSFC(counterSource, './src/components/Counter.vue.js');
  fs.writeFileSync('./src/components/Counter.vue.js', counterCode);
  
  // 编译TodoList.vue
  console.log('编译TodoList.vue...');
  const todoListSource = fs.readFileSync('./src/components/TodoList.vue', 'utf-8');
  const todoListCode = compileSFC(todoListSource, './src/components/TodoList.vue.js');
  fs.writeFileSync('./src/components/TodoList.vue.js', todoListCode);
  
  console.log('所有Vue组件编译完成！');
}

// 执行编译
compileAllComponents(); 