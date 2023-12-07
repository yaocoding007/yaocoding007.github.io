---
pubDatetime: 2023-10-13
title: nextJs13
featured: true
draft: false
tags:
  - nextJs
description: nextJs13 使用记录
---

### 在服务端组件中请求数据

总结: need absolute URLs, relative paths will fail!

```javascript
async function fetchBlogPosts() {
  // ⚠️ 注意 这里如果要使用fetch就要写完整的url
  // 下面这样写是会报错的
  //const res = await fetch("/api/posts");  在客户端组件中是可以这么请求的
  //相关issues
  // https://github.com/vercel/next.js/issues/48344
  // https://github.com/vercel/next.js/discussions/35532
  const res = await fetch("https://xxx.com/posts");

  if (!res.ok) {
    throw new Error("Error occurred when fetching posts");
  }
  return res.json();
}

export default async function Blog() {
  const posts = await fetchBlogPosts();
  return <div>文章总数: {posts.length}</div>;
}
```
