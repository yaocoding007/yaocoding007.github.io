---
pubDatetime: 2023-10-08
title: nextJs13 部署详解
postSlug: nextJs13 部署详解
featured: true
draft: false
tags:
  - nextJs
description:
  对官网`standalone`模式部署的详细解释
---

> 刚开始使用nextjs写项目对于项目部署有一些疑惑的点，因此花了点时间做了整理。


官方的 [Dockerfile demo ](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) 

```dockerfile
# standalone 构建模式的部署

# 指定基础镜像 使用 base 为基础镜像的别名
FROM node:18-alpine AS base

# node:18-alpine 是一个 Docker 镜像，
# 它基于 Alpine Linux 发行版，并预装了 Node.js 18 版本。
# Alpine Linux 是一个轻量级的 Linux 发行版，它的特点是体积小、安全性高、速度快。

# 第一阶段 deps阶段  安装一些通用的依赖项
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 下载依赖
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# 第二阶段 builder 打包应用
FROM base AS builder
WORKDIR /app
## 从第一阶段拷贝依赖
COPY --from=deps /app/node_modules ./node_modules
## 将当前目录中的所有文件和子目录复制到容器中的当前工作目录
## 注意这一步只是用于构建 在最终的镜像中不会包含这里复制的所有文件
COPY . .

# 禁用遥测数据收集
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# 生产环境的镜像 复制需要用到的文推&启动服务
FROM base AS runner
WORKDIR /app



# Docker 容器不推荐用 root 身份运行
# 这边先建立一个特定的用户和用户组，为它分配必要的权限，使用 USER 切换到这个用户
# 注意，如果不是 root 权限，对于可执行文件，需要修改权限，确保文件可以执行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置时区
# 在使用 Docker 容器时，系统默认的时区就是 UTC 时间（0 时区），和我们实际需要的北京时间相差八个小时
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8 TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 设置权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODE_ENV production
# 禁用遥测数据收集
ENV NEXT_TELEMETRY_DISABLED 1
# 设置环境变量
ENV PORT 3000

# ENV HOSTNAME "0.0.0.0"
# 暴露端口 (默认是80 端口)
EXPOSE 3000

# 启动服务 使用k8s部署时，会有Pod异常监测 不再需要pm2这类的进程守护工具
CMD ["node", "server.js"]
```


dockerfile 中出现了多次 FROM 的语句，有些不解就去研究了一番

```dockerfile
FROM base AS deps
FROM base AS builder
FROM base AS runner
```
资料显示这是一种多阶段构建的方式:
不同的阶段干不同的事情，相互独立互不影响如上面的例子:

定义了三个阶段:

1. `deps` 阶段用于安装一些通用的依赖项
2. `builder` 阶段用于 安装项目的依赖项
3. `runner` 阶段用于 运行服务
   
但终生成的镜像`只包含了最后一个阶段`的内容 之前阶段的内容不会被打包到最终的镜像中，这种多阶段构建的方式可以有效地减小镜像的体积，因为在构建过程中可以丢弃不必要的文件和依赖项。

在这个示例中，阶段一中的 `FROM` 指令定义的 `deps` 阶段只安装了项目的依赖项，而没有复制应用程序的代码，因此可以避免将不必要的文件打包到镜像中。阶段二中的 `FROM` 指令定义的 `builder` 阶段只复制了项目的代码和依赖项，而没有安装依赖项，因此可以避免将不必要的依赖项打包到镜像中。最终生成的镜像只包含了构建好的应用程序和必要的依赖项，从而减小了镜像的体积。

**不同阶段的文件传递方式:**

`COPY --from`指令从另一个镜像中复制文件到当前镜像中
具体语法: `COPY --from=<image> <src> <dest>`

**构建结果**
![next构建出的镜像](/images/next-image.png)


**本地构建验证**

1. 构建镜像 `docker build -t app:1.0 .`
2. 运行: `docker run -p 3000:3000 app:1.0`

#### 语法解释

**WORKDIR:**

`WORKDIR` 是 Dockerfile 中的一个指令，用于指定容器中的工作目录。在 Docker 容器中运行应用程序时，可以使用 `WORKDIR` 指令指定应用程序的工作目录，以便在容器中执行命令时，可以相对于该目录进行操作。

在 Dockerfile 中，可以使用相对路径或绝对路径指定工作目录。如果使用相对路径，则相对于上一个 `WORKDIR` 指令或 `FROM` 指令指定的基础镜像的根目录。

在 Dockerfile 中，通常会在 `WORKDIR` 指令中指定应用程序的工作目录，以便在容器中运行应用程序时，可以相对于该目录进行操作。例如，以下是一个使用 `WORKDIR` 指令指定工作目录的 Dockerfile 文件示例：

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY . .

CMD ["yarn", "start"]
```

在这个示例中，我们使用 `WORKDIR` 指令指定了容器中的工作目录为 `/app`，这样在容器中运行命令时，就可以相对于 `/app` 目录进行操作，例如，使用 `yarn start` 命令启动应用程序。


**COPY 跟 ADD 的区别**
GitHub Copilot: `COPY` 和 `ADD` 都是 Dockerfile 中用于复制文件的指令，但它们之间有一些区别。
`COPY` 指令的语法如下：
```
COPY <src> <dest>
```
其中，
`<src>` 表示要复制的文件或目录的路径，可以是相对路径或绝对路径。
`<dest>` 表示要将文件或目录复制到容器中的路径，必须是绝对路径。

`ADD` 指令的语法与 `COPY` 类似，但它还支持一些额外的功能，例如自动解压缩和 URL 下载。`ADD` 指令的语法如下：

```
ADD <src> <dest>
```

其中，`<src>` 和 `<dest>` 的含义与 `COPY` 指令相同。

虽然 `ADD` 指令比 `COPY` 指令功能更强大，但在实际使用中，建议尽可能使用 `COPY` 指令，因为它更简单、更可预测，而且不会自动解压缩文件或从 URL 下载文件，避免了一些潜在的安全风险。


## 附带一份 pnpm 的 配置

```Dockerfile

# 指定基础镜像版本，确保每次构建都是幂等的
FROM node:18-alpine AS base

FROM base AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Node v16.13 开始支持 corepack 用于管理第三方包管理器
# 锁定包管理器版本，确保 CI 每次构建都是幂等的
# RUN corepack enable && corepack prepare pnpm@latest --activate
RUN corepack enable && corepack prepare pnpm@8.5.0 --activate

WORKDIR /app

# pnpm fetch does require only lockfile
# 注意还需要复制 `.npmrc`，因为里面可能包含 npm registry 等配置，下载依赖需要用到
COPY .npmrc pnpm-lock.yaml ./

# 推荐使用 pnpm fetch 命令下载依赖到 virtual store，专为 docker 构建优化
# 参考：https://pnpm.io/cli/fetch
RUN pnpm fetch

# 将本地文件复制到构建上下文
COPY . .

# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# 基于 virtual store 生成 node_modules && 打包构建
# 此处不需要与 package registry 进行通信，因此依赖安装速度极快
# 注意 PNPM v8.4.0 版本有一个 breaking change
# 当 `node_modules` 存在，运行 `pnpm install` 会出现命令行交互操作，导致 CI 挂掉
# 这里加上 `--force` 参数，关闭命令行交互操作
RUN pnpm install --offline --force && pnpm build

FROM base AS runner

# RUN apk update && apk add --no-cache git
RUN apk add --no-cache curl

# 如果需要是用 TZ 环境变量 实现时区控制，需要安装 tzdata 这个包
# debian 的基础镜像默认情况下已经安装了 tzdata，而 ubuntu 并没有
# RUN apk add --no-cache tzdata

ARG RUNTIME_ENV
ENV RUNTIME_ENV=$RUNTIME_ENV
ENV NODE_ENV production

# Docker 容器不推荐用 root 身份运行
# 这边先建立一个特定的用户和用户组，为它分配必要的权限，使用 USER 切换到这个用户
# 注意，如果不是 root 权限，对于可执行文件，需要修改权限，确保文件可以执行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置时区
# 在使用 Docker 容器时，系统默认的时区就是 UTC 时间（0 时区），和我们实际需要的北京时间相差八个小时
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8 TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# PNPM 有一个全局 store，项目中的 node_modules 实际上是全局 store 的 symlink
# 正常需要从上一阶段同时复制 `node_modules` 和全局 store，这样才能正常运行
# 但是由于 `standalone` 目录里面包含所有运行时依赖，且都是独立目录
# 因此可以直接复制该目录，无需复制全局 store（如果复制还会增加镜像体积）
# 另外运行需要的配置文件、dotfile 也都在 `standalone` 目录里面，无需单独复制

# `standalone` 模式打包，默认包含服务端代码，没有客户端代码
# 因为官方建议通过 CDN 托管，但也可以手动复制 `public`、`.next/static` 目录
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 注意，`standalone` 目录下已经包含了服务端代码，无需再复制 `.next/server`
# COPY --from=builder /app/.next/server ./.next/server

USER nextjs

# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# 默认暴露 80 端口
EXPOSE 3000

# 用 standalone 模式打包后，生成的 `standalone/node_modules` 目录下缺少 `.bin` 目录
# 导致无法用 `next` 命令启动项目，但可以用 `node server.js` 启动
# 参考：https://nextjs.org/docs/advanced-features/output-file-tracing
CMD ["node", "server.js"]


```