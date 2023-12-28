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

formItemProps常用的配置：

- name: 字符串，表单项的名称，对应表单数据对象的 key。
- label: 字符串或 ReactNode，表单项的标签。
- rules: 对象数组，表单项的校验规则。
- initialValue: 任意，表单项的初始值。
- hidden: 布尔值，是否隐藏表单项。
- labelCol: 对象，标签布局，同 antd 的 Col 组件，例如 { span: 6 }。
- wrapperCol: 对象，需要为输入控件设置布局样式时，使用该属性，用法同 labelCol。

### 3. proTable 使用搜索是 设置默认值 在首次请求中 无法获取

```javascript
const request = (data) => {
  const values = formRef.current?.getFieldsValue();
  const searchParams = omitBy(values, isUndefined);
  const res = await fetchFn({
    ...searchParams,
    ...data,
  });
}
```
