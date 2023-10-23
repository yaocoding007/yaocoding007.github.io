---
pubDatetime: 2023-10-3
title: 在electron客户端中集成Python环境
featured: true
draft: true
tags:
  - electron
description: 提供独立可用的python环境在 electron 客户端中
---

### 背景:

目前python课程的代码运行采用的方案是在web端写代码, 运行时代码通过接口由服务器来执行，然后返回执行的结果。基础的代码场景是可以满足的，涉及到文件交互就会比较复杂，而且还会有使用`pyppeteer`去做自动化操作的场景，难以实现，就尝试能否将`python环境`嵌入到PC客户端内。

**方案有以下几种**

1. 使用`skulpt`运行`python`代码，使用到的第三方模块，通过 `skulpt`自定义模块去模拟实现
   1. 优点: 无需考虑python环境
   2. 缺点: 每次新的模块都需要开发，局限性较高
2. 套壳thonny, 修改thonny,使用其内置的python环境
   1. 优点: 自带有python环境
   2. python 项目，需要熟悉 python 开发的同学
3. 使用官方的安装包
   1. 优点: 官方出品有保障
   2. 缺点: 安装过程繁琐，mac 没有静默安装的版本
4. 使用 standalone
   1. 优点: 能较为容易的集成到 electron 客户端，支持 pip 安装使用到的库

### 开发

从 [standalone](https://github.com/indygreg/python-build-standalone/releases) 仓库下载需要的版本 放到项目根目录 我使用的 3.9 的版本

mac: `cpython-3.9.6-x86_64-apple-darwin-install_only-20210724T1424.tar.gz`

window: `cpython-3.8.11-x86_64-pc-windows-msvc-static-noopt-20210724T1424.tar`

确认可以正常运行 `python/bin/python3.9 --version`

### Python代码的执行

```jsx
function executePythonCode(e, code, inputs = "") {
  return new Promise((resolve, reject) => {
    const python = findPython();
    const cwdPath = path.join(__dirname, "..", "user-root-dir");
    const child = cp.spawn(python, ["-c", code], {
      cwd: cwdPath, // 指定子进程的工作目录
    });
    // 将输入数据写入子进程的标准输入流中
    child.stdin.write(inputs);
    // 关闭标准输入流
    child.stdin.end();
    child.stdout.on("data", data => {
      resolve(data.toString());
    });
    child.stderr.on("data", data => {
      reject(data.toString());
    });
  });
}

const pythonPath = {
  win32: [
    path.join(process.resourcesPath, "..", "python", "install", "python.exe"),
    path.join(__dirname, "..", "python", "install", "python.exe"),
  ],
  darwin: [
    path.join(process.resourcesPath, "..", "python", "bin", "python3.9"),
    path.join(__dirname, "..", "python", "bin", "python3.9"),
  ],
};
function findPython() {
  const platform = os.platform();
  const possibilities = pythonPath[platform];
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
}
```

### 打包

需要将该 python 文件夹打包进electron中，可以通过package.json 中的 build 配置项来实现

```jsx
"extraResources": [
    {
      "from": "python",
      "to": "python",
      "filter": [
        "**/*"
      ]
    }
],
```

这样 `electron-builder` 就会将 python 文件夹的内容复制到打包后的应用内

### 参考:

- [https://github.com/thonny/thonny](https://github.com/thonny/thonny)
- [https://til.simonwillison.net/electron/python-inside-electron](https://til.simonwillison.net/electron/python-inside-electron)
- [https://github.com/simonw/datasette-app](https://github.com/simonw/datasette-app)
- [https://github.com/indygreg/python-build-standalone](https://github.com/indygreg/python-build-standalone)
