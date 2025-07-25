@echo off
echo 正在编译所有Vue组件...

echo 编译App.vue...
node .\mini-vue-local\cli\vue-compiler.js ./src/App.vue ./src/App.vue.js

echo 编译HelloWorld.vue...
node .\mini-vue-local\cli\vue-compiler.js ./src/components/HelloWorld.vue ./src/components/HelloWorld.vue.js

echo 编译Counter.vue...
node .\mini-vue-local\cli\vue-compiler.js ./src/components/Counter.vue ./src/components/Counter.vue.js

echo 编译TodoList.vue...
node .\mini-vue-local\cli\vue-compiler.js ./src/components/TodoList.vue ./src/components/TodoList.vue.js

echo 所有Vue组件编译完成！ 