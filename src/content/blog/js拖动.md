---
pubDatetime: 2023-12-06
title: 你真的了解Javascript的事件吗
featured: true
draft: false
tags:
  - javascript
  - event
description: 从简单的拖拽来复习js的事件系统
---

> 给一个按钮添加了拖拽 居然有点挠头的感觉 好久没有自己去写事件了
> 正好总结一下啊

效果如下: 页面上的一个元素可以拖动，并且可以设置边界

<iframe src="/demo/drag.html"></iframe>

### 基本的拖动思路:

- btn元素的 mousedown 事件记录鼠标初始位置距离元素左上角的距离 disY
- document的 mousemove 事件计算鼠标移动的距离
- 移动时的位置计算: 鼠标移动的距离 - disY

![拖动](/demo/images/drag.excalidraw.png)

### show me code

```javascript
const btn = document.querySelector("#btn");
let disY;
btn.addEventListener("mousedown", function (event) {
  event.preventDefault();
  // 鼠标初始位置距离元素左上角的距离
  disY = event.pageY - btn.offsetTop;
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", stop);
  document.addEventListener("mouseleave", stop);
});
function move(event) {
  // 鼠标移动的距离
  let roughY = event.pageY - disY;
  let y = roughY;
  // 计算边界
  if (roughY > 0) {
    // 下边界
    let max = document.documentElement.clientHeight - btn.offsetHeight;
    y = roughY > max ? max : roughY;
  } else {
    // 上边界
    y = 0;
  }
  btn.style.top = y + "px";
}
function stop() {
  document.removeEventListener("mousemove", move);
  document.removeEventListener("mouseup", stop);
  document.removeEventListener("mouseleave", stop);
}
```

## 事件冲突

拖拽完事了，不过这才完成了一半，需求还要求`btn`可以点击触发另一个事件。
easy，上代码

```javascript
btn.addEventListener("click", () => {
  // do other something
});
```

运行测试就会发现,拖拽结束也会触发`click`事件, 卒...

在mdn上看到[元素：click 事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/click_event)会在 mousedown 和 mouseup 事件依次触发后触发。

## 解决方案

## 问题记录

### 事件的绑定

参考网上的demo有些事件的绑定是这么写的

```javascript
document.onmousemove = () => {};
```

刚开始看没啥问题，但是仔细一想还是不建议这么写的，组件大概率不是一个独立的项目
会跟其他的组件一起使用, 这样的赋值操作是会覆盖掉其他使用这种形式监听的事件,
推荐使用 `addEventListener`去添加事件监听

## 参考

- https://blog.51cto.com/u_15328720/5684489
- https://blog.csdn.net/halo1416/article/details/122859191
- https://www.jianshu.com/p/d294ea1cc47a
