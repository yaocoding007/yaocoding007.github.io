---
pubDatetime: 2024-01-10
title: next 本地化
postSlug: next 本地化
featured: true
draft: false
tags:
  - nextJs
description: next 本地化
---

# next 构建静态资源支持file://协议加载

背景: c++ 关卡为了提升性能 需要支持在客户端内使用本地化方案，项目的框架是 nextjs@9.0.2

是服务端渲染的, 获取关卡数据的接口 newlevel 是通过 getInitialProps 在 node层 取获取的。

### 问题一：next请求的html页面的是通过服务端返回的

通过翻文档发现 `next export`可以支持导出为 静态文件

[https://www.nextjs.cn/docs/advanced-features/static-html-export](https://www.nextjs.cn/docs/advanced-features/static-html-export)

配置 exportPathMap 告知 next export 要生成哪些页面

```jsx
// next.config.js

async exportPathMap() {
    return {
      '/ada/cpp/index': { page: '/ada/cpp/index', query: { id: null } },
    }
},
```

### 问题二: 如何处理服务端进行的接口请求

> `getInitialProps` **will be called on every client-side navigation**

getInitialProps 在客户端渲染的时候也会触发，

不过在服务端请时参数时使通过 `ctx.query` 获取的 需要支持 /ada/cpp/index.html?id=xxx的形式

也就是支持从 location 上获取 通过判断 `global.location` 的值来区分是不是客户端渲染

```jsx
let { query } = ctx;
if (global.location) {
  const { search } = global.location;
  const searchObj = queryString.parse(search);
  query = searchObj;
}
```

### 问题三: 资源路径问题 [file://](file://) 协议加载需要使用相对路径

**静态文件路径**

`next` 提供了 `assetPrefix` 可以修改静态文件的前缀 可以针对本地化 将值配置成 “../../”

> 名词解释 `assetPrefix`
>
> `assetPrefix` 选项用于设置静态文件的前缀。这个选项通常用于在你的应用部署在非根路径，或者你想要从 CDN 服务上提供静态文件时。
>
> 例如，假设你的应用部署在 `https://example.com/myapp/`，你可以设置 `assetPrefix` 为 `/myapp/`。然后，Next.js 会在所有静态文件的 URL 前面添加这个前缀。例如，一个名为 `main.js` 的静态文件的 URL 会变成 `/myapp/_next/static/main.js`。
>
> 或者，假设你想要从 CDN 服务上提供静态文件，你可以设置 `assetPrefix` 为你的 CDN 服务的 URL。例如，你可以设置 `assetPrefix` 为 `https://cdn.example.com/`。然后，Next.js 会在所有静态文件的 URL 前面添加这个前缀。例如，一个名为 `main.js` 的静态文件的 URL 会变成 `https://cdn.example.com/_next/static/main.js`。

**图片资源**

1. 对于在 /static 文件夹中的图片资源

项目中使用了 `babel` 插件 `transform-assets-import-to-string` 来处理图片的路径问题

修改插件的配置 这样可以支持 本地化、测试、线上cdn 三种模式

```jsx
// .babelrc.js
const getBaseUri = () => {
  if (isStatic) {
    return "../../";
  }
  return isDev ? "" : `https://cdn/xxx`;
};

[
  "transform-assets-import-to-string",
  {
    baseDir: "/static",
    baseUri: getBaseUri(),
  },
];
```

> 名字解释 `transform-assets-import-to-string`  是一个 Babel 插件
>
> 它的作用是将 `import` 或 `require` 的图片文件转换为字符串。
>
> 当你在代码中 `import` 或 `require` 一个资源文件（例如图片或样式文件）时，
>
> 这个插件会将这个 `import` 或 `require` 语句转换为一个字符串，
>
> 这个字符串是这个资源文件在服务器上的 URL。
>
> 例如，假设你有如下的代码：
>
> `import imageUrl from './image.png';`
>
> 如果你使用了 `transform-assets-import-to-string` 插件，那么这段代码会被转换为：
>
> `const imageUrl = '/path/to/image.png';`
>
> 这个插件通常用于处理那些不能直接在 JavaScript 中使用的资源文件，例如图片、样式文件等。通过这个插件，你可以在 JavaScript 代码中直接引用这些资源文件，而不需要手动处理它们的路径和 URL。

1. css中引入的图片资源 `next`中 使用 `next-images` 来处理 图片的引入

`next-images` 实际上就是配置了 `webpack` 的 `loader` ，通过 `url-loader`/ `file-loader` 来处理图片资源

源码如下：

```jsx
config.module.rules.push({
  test: /\.(jpe?g|png|svg|gif|ico|webp)$/,
  exclude: nextConfig.exclude,
  use: [
    {
      loader: require.resolve("url-loader"),
      options: {
        limit: nextConfig.inlineImageLimit,
        fallback: require.resolve("file-loader"),
        publicPath: `${nextConfig.assetPrefix}/_next/static/images/`,
        outputPath: `${isServer ? "../" : ""}static/images/`,
        name: "[name]-[hash].[ext]",
      },
    },
  ],
});
```

那只要将 `publicPath` 修改成需要的路径形式即可 `'../images/’`

### 一些思考

1. **next export 都干了啥 ??**

   将你的应用导出为静态 HTML 文件。这个命令会预渲染所有的页面，并生成对应的 HTML 文件和静态资源文件。

2. **webpack中 loader的执行顺序**

   loader 的执行顺序是从右到左，从下到上。例如，假设你有如下的配置：

   ```jsx
   module: {
     rules: [
       {
         test: /\.css$/,
         use: ["style-loader", "css-loader", "sass-loader"],
       },
     ];
   }
   ```

   在这个配置中，当 Webpack 处理 `.css` 文件时，它会首先使用 `sass-loader` 来处理文件，然后是 `css-loader`，最后是 `style-loader`。

   这是因为 `sass-loader` 需要将 Sass 代码转换为 CSS 代码，然后 `css-loader` 需要将 CSS 代码转换为 JavaScript 代码，最后 `style-loader` 需要将 JavaScript 代码插入到 HTML 文档中。

   同样，如果你有多个规则，那么 Webpack 会从下面的规则开始处理，然后是上面的规则。例如：

   ```jsx
   module: {
     rules: [
       {
         test: /\.css$/,
         use: ["style-loader", "css-loader"],
       },
       {
         test: /\.scss$/,
         use: ["style-loader", "css-loader", "sass-loader"],
       },
     ];
   }
   ```

   在这个配置中，当 Webpack 处理 `.scss` 文件时，它会首先使用下面的规则，然后是上面的规则。

3. **bable & loader 的执行顺序**

   在 Webpack 的构建过程中，Babel 和 Loader 都是非常重要的工具。

   1. **Babel** 是一个 JavaScript 编译器，主要用于将新的 JavaScript 语法（例如 ES6、ES7 等）转换为旧的 JavaScript 语法（例如 ES5），以确保你的代码可以在旧的浏览器中运行。Babel 还可以处理 JSX 语法和流类型注释等。
   2. **Loader** 是 Webpack 的一个功能，用于处理和转换源代码。Webpack 本身只能处理 JavaScript 和 JSON 文件，但是通过使用 Loader，Webpack 可以处理任何类型的文件，并将它们转换为有效的模块，可以添加到依赖图中。

   在 Webpack 的构建过程中，Loader 的执行顺序是从右到左，从下到上。而 Babel 通常作为一个 Loader（`babel-loader`）在这个过程中使用。

   例如，假设你有如下的配置：

   ```jsx
   module: {
     rules: [
       {
         test: /\.js$/,
         use: ["babel-loader"],
       },
     ];
   }
   ```

   在这个配置中，当 Webpack 处理 `.js` 文件时，它会使用 `babel-loader` 来处理文件。`babel-loader` 会调用 Babel 来转换文件中的 JavaScript 代码。

   所以，你可以认为 Babel 是在 Loader 的过程中执行的。首先，Webpack 会使用 Loader 来处理文件，然后在这个过程中，`babel-loader` 会调用 Babel 来转换 JavaScript 代码。

   在 Webpack 中，Babel 的配置通常通过 `babel-loader` 来使用。`babel-loader` 是一个 Webpack 插件，它允许你使用 Babel 来转换你的 JavaScript 代码。

   在你的 Webpack 配置文件中，你可以添加一个规则来使用 `babel-loader`。例如：

   ```jsx
   module.exports = {
     module: {
       rules: [
         {
           test: /\.js$/,
           exclude: /node_modules/,
           use: {
             loader: "babel-loader",
           },
         },
       ],
     },
   };
   ```

   在这个配置中，当 Webpack 处理 `.js` 文件时，它会使用 `babel-loader` 来处理文件。`babel-loader` 会调用 Babel 来转换文件中的 JavaScript 代码。

   `babel-loader` 会自动读取你的 Babel 配置文件（例如 `.babelrc.js` 或 `babel.config.js`）。在这个配置文件中，你可以配置 Babel 的插件、预设等。

   例如，假设你的 `.babelrc.js` 文件如下：

   ```jsx
   module.exports = {
     presets: ["@babel/preset-env"],
     plugins: ["@babel/plugin-transform-classes"],
   };
   ```

   在这个配置中，我们使用了 `@babel/preset-env` 预设和 `@babel/plugin-transform-classes` 插件。当 `babel-loader` 处理文件时，它会使用这些预设和插件来转换 JavaScript 代码。

### 一些小收获

1. `require.resolve("url-loader")`
2. `next export -o turing-ada` 可以指定输出目录
3. row-loader 获取文件内容
   1. `import bar from 'raw-loader!./bar';` 可以直接获取文件的所有内容字符串
4. webpack 的一些知识点

### `url-loader`

是一个 webpack 的 loader，它的作用是将小于指定大小的文件转为 Base64 的 URL。

`url-loader` 会将文件转为 data URL（也就是 Base64 编码的字符串），然后直接嵌入到代码中，而不是作为一个单独的文件。这样可以减少 HTTP 请求的数量，但是会增加 JavaScript 文件的大小。

`url-loader` 的配置通常如下：

```jsx
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 8192,  // 小于 8kb 的图片会被转为 base64 },
          },
        ],
      },
    ],
  },
};
```

在这个配置中，所有小于 8kb 的 `.png`、`.jpg` 和 `.gif` 文件都会被转为 Base64 的 URL。如果文件大于 8kb，`url-loader` 会像 `file-loader` 那样处理文件，即将文件复制到输出目录，并返回文件的 URL。

请注意，虽然 `url-loader` 可以减少 HTTP 请求的数量，但是它会增加 JavaScript 文件的大小，可能会影响页面的加载速度。因此，你应该根据你的应用的需求来决定是否使用 `url-loader`，以及设置合适的文件大小限制。

### `file-loader`

是一个 webpack 的 loader，它的作用是将文件处理并输出到指定的目录，

然后返回这个文件的最终路径。

当你在代码中导入一个文件时，`file-loader` 会将这个文件复制到 webpack 的输出目录，并返回这个文件在输出目录中的路径。这样，你就可以在代码中使用这个路径来引用这个文件。

`file-loader` 的配置通常如下：

```jsx
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[hash].[ext]",
              outputPath: "images/",
            },
          },
        ],
      },
    ],
  },
};
```

在这个配置中，所有 `.png`、`.jpg` 和 `.gif` 文件都会被 `file-loader` 处理。处理后的文件会被放在 `images/` 目录下，文件名是原文件名加上文件内容的哈希值和原文件扩展名。

然后，你可以在你的代码中这样导入图片：

`import img from './my-image.png';`

在构建时，`img` 变量的值会被替换为图片文件的 URL，例如 `'images/my-image.abc123.png'`。

请注意，`file-loader` 只是将文件复制到输出目录，并返回文件的 URL。它不会对文件进行任何处理。如果你想对文件进行处理（例如压缩图片或转换 SVG 文件），你需要使用其他 loader。

`file-loader` 和 `url-loader` 可以同时使用，它们的工作方式是互补的。

`url-loader` 可以将小于指定大小的文件转为 Base64 的 URL，而 `file-loader` 则处理所有文件，将它们复制到输出目录，并返回文件的 URL。

当你同时使用 `file-loader` 和 `url-loader` 时，`url-loader` 会先处理文件。如果文件的大小小于 `url-loader` 的 `limit` 选项指定的值，`url-loader` 会将文件转为 Base64 的 URL。如果文件的大小大于 `limit` 选项指定的值，`url-loader` 会“退化”为 `file-loader`，即将文件复制到输出目录，并返回文件的 URL。

以下是一个同时使用 `file-loader` 和 `url-loader` 的配置示例：

```jsx
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192, // 小于 8kb 的图片会被转为 base64
              fallback: "file-loader", // 大于 8kb 的图片会被 file-loader 处理
              name: "[name].[hash].[ext]",
              outputPath: "images/",
            },
          },
        ],
      },
    ],
  },
};
```

在这个配置中，所有 `.png`、`.jpg` 和 `.gif` 文件都会被 `url-loader` 处理。如果文件的大小小于 8kb，`url-loader` 会将文件转为 Base64 的 URL。如果文件的大小大于 8kb，`url-loader` 会使用 `file-loader` 来处理文件。处理后的文件会被放在 `images/` 目录下，文件名是原文件名加上文件内容的哈希值和原文件扩展名。

outputPath/publicPath 可以配置函数来处理更复杂的情况

```jsx
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[hash].[ext]",
              outputPath: (url, resourcePath, context) => {
                if (/my-custom-image\.png/.test(resourcePath)) {
                  return `other_output_path/${url}`;
                }
                return `images/${url}`;
              },
              publicPath: (url, resourcePath, context) => {
                if (/my-custom-image\.png/.test(resourcePath)) {
                  return `other_public_path/${url}`;
                }
                return `images/${url}`;
              },
              context: "project",
              emitFile: true,
              esModule: false,
            },
          },
        ],
      },
    ],
  },
};
```

### 参考：

[https://zhuanlan.zhihu.com/p/659040417](https://zhuanlan.zhihu.com/p/659040417)
