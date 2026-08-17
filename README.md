# Ownly

Ownly 是一个个人资产管理网页应用，用来记录物品、购买成本、使用天数、日均成本和心愿单。

如果希望从技术人员视角系统了解项目架构、数据模型、成本公式、登录同步和构建部署，请阅读 [Ownly 技术实现说明](docs/TECHNICAL_OVERVIEW.md)。

当前版本采用“本地缓存 + Cloudflare D1 云同步”方案：

- 每个用户通过用户名和密码登录，账号数据彼此隔离。
- 数据先保存在当前浏览器的 IndexedDB，修改后自动同步到 D1。
- 更换设备后登录同一账号，会自动从 D1 恢复数据。
- 密码使用 PBKDF2-SHA256 哈希保存，登录状态使用 HttpOnly Cookie。
- 注册必须提供管理员设置的注册码，适合 2～3 人的小范围自用。
- 物品图片改为内置轻量图标，不上传照片；服务端仍会拒绝超过 10KB 的兼容图片字段。

## 安装与普通前端开发

```powershell
npm install
npm run dev
```

普通 Vite 开发服务器没有 Cloudflare Functions 和 D1，只适合调整页面样式。涉及注册、登录或同步时，请使用下方的云端联调方式。

## Cloudflare 初始化

项目当前已绑定 `ownly-db`。如果是在一个全新的 Cloudflare 账号中重新初始化，执行：

```powershell
npx wrangler login
npx wrangler d1 create ownly-db
```

然后把命令返回的 `database_id` 更新到 `wrangler.toml`，再初始化数据库表：

```powershell
npm run db:migrate:local
npm run db:migrate:remote
```

## 本地联调登录和同步

在项目根目录创建不会提交到 Git 的 `.dev.vars`：

```text
REGISTRATION_CODE=你自己设置的本地测试注册码
```

然后运行：

```powershell
npm run dev:cloud
```

访问 Wrangler 输出的本地地址。测试数据保存在 `.wrangler` 的本地 D1 中，不会写入线上数据库。

## 设置线上注册码

注册码不要写进源码或提交到 Git。首次部署前，在终端交互输入以下命令（注册码执行命令后填写）：

```powershell
npx wrangler pages secret put REGISTRATION_CODE --project-name ownly
```

只有持有该注册码的人可以创建账号；已注册用户以后只需要用户名和密码。

## 管理员人工重置密码

忘记密码时，由已登录 Cloudflare Wrangler 的管理员在项目根目录执行：

```powershell
npm run admin:reset-password -- --remote
```

脚本会依次要求输入用户名、新密码并再次确认新密码。密码输入不会显示在终端，也不能通过命令行参数传入；操作线上 D1 时还必须输入 `RESET` 二次确认。重置成功后，该账号的全部旧会话都会失效，所有设备需要使用新密码重新登录。

如需测试本地 D1，使用：

```powershell
npm run admin:reset-password -- --local
```

该功能直接通过 Wrangler 修改 D1，不提供公开的管理员 HTTP 接口，也不需要重新构建或部署网页。执行线上重置前请确认 `npx wrangler login` 登录的是正确的 Cloudflare 账号。

## 构建与部署

```powershell
npm run deploy
```

`npm run deploy` 内部会先执行完整构建，无需提前单独运行 `npm run build`；构建完成后会部署到 `ownly` 项目的 `production` 分支。部署完成后访问：

```text
https://ownly.pages.dev
```

## 数据同步规则

- 登录时优先读取该账号的 D1 数据；云端还没有数据时，上传当前本地数据作为初始快照。
- 本地修改后约 700ms 自动上传，也可以在“我的”页面点击“立即同步”。
- 当前采用完整快照和最后保存覆盖，避免为少量用户引入复杂的冲突合并逻辑。
- 不建议在两个设备上同时离线修改；后同步的设备会覆盖先前的完整快照。
- “我的 → 数据与备份”仍可导出和恢复 JSON，建议偶尔保留一份离线备份。
- 浏览器缓存只用于离线和加速；换设备后只要登录同一账号即可恢复云端数据。

## 常用检查

```powershell
npm run lint
npm run typecheck:functions
npm run build
```
