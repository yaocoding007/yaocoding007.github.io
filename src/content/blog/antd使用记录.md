---
pubDatetime: 2023-12-04
title: antd使用上的一些记录
postSlug: antd使用上的一些记录
featured: true
draft: false
tags:
  - antd
description: antd使用上的一些记录
---

## ProTable

### 1. 设置表单项为select并设置初始值

```javascript
// 设置valueType为'select'
// 配置 valueEnum
// 设置默认值 注意⚠️ 如果 valueEnum的key为 number 如 {1: {}}  initialValue需要String一下

const valueEnum = {
  open: {
    text: "未解决",
    status: "Error",
  },
  closed: {
    text: "已解决",
    status: "Success",
  },
};

const columns = [
  {
    title: "举报类别",
    dataIndex: "type",
    valueType: "select",
    valueEnum: valueEnum,
    initialValue: String(valueEnum.open),
  },
];
```

### 2. 设置表单项的label以及设置表单项宽度

```javascript
const columns = [
  {
    title: "作品名称",
    dataIndex: "title",
    colSize: 8, // 设置表单项宽度
    formItemProps: {
      label: "作品ID/名称", // 表单项的label
    },
  },
];
```
