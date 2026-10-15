<!--
Sync Impact Report
==================
Version change: (unversioned template) → 1.0.0
Ratification: initial adoption of this constitution for ai-spec-demo

Modified principles (template → current):
  [PRINCIPLE_1_NAME]                 → I. 代码质量优先 (Code Quality First)
  [PRINCIPLE_2_NAME]                 → II. 测试覆盖率不低于 80% (Test Coverage ≥ 80%)
  [PRINCIPLE_3_NAME]                 → III. RESTful API 设计规范 (RESTful API Design)
  [PRINCIPLE_4_NAME]                 → IV. 前后端分离 (Frontend/Backend Separation)
  [PRINCIPLE_5_NAME]                 → (removed — user requested four principles)

Added sections:
  - 技术约束 (Additional Constraints)
  - 开发工作流与质量门禁 (Development Workflow & Quality Gates)
  - Governance (governance rules, amendment procedure, versioning policy)

Removed sections:
  - Template principle 5 slot (only four principles requested)

Deferred TODOs:
  - TODO(RATIFICATION_DATE): 原始采纳日期未知；已暂用本次编写日期 2026-10-12。
    如项目有更早的正式采纳日期，请在下次修订时更正。
  - TODO(PROJECT_NAME): 项目正式名称未提供；标题暂用仓库名 ai-spec-demo。
-->

# ai-spec-demo Constitution

## Core Principles

### I. 代码质量优先 (Code Quality First)

代码可读性与可维护性优先于交付速度；任何"先跑通再说"的临时实现 MUST NOT 合入主干。

- 每个源文件 MUST 有清晰、单一的职责；跨模块的重复逻辑 MUST 抽取为共享单元，禁止复制粘贴式实现。
- 命名 MUST 表意（领域词汇优先于缩写）；公共函数与模块 MUST 在签名或文档中说明其契约（输入、输出、失败模式）。
- 静态检查、格式化、类型检查 MUST 纳入构建脚本，且 MUST 在 CI 中作为阻断项运行；不得依赖人工记忆执行。
- 死代码、被注释掉的旧实现、调试输出 MUST 在合入前删除。
- 复杂实现（自定义算法、额外抽象层、新增第三方依赖）MUST 在 plan 的 Complexity Tracking 中给出理由与被否决的更简方案。
- 代码评审 MUST 拒绝"仅能工作但无法维护"的改动。

**Rationale**: 质量是后续迭代的成本基线。一次妥协会被复制，修复成本随代码量增长而非线性增长。

### II. 测试覆盖率不低于 80% (Test Coverage ≥ 80%)

项目整体语句/行覆盖率 MUST ≥ 80%，该阈值是合并阻断项，而非事后报告指标。

- 每个新增或修改的行为 MUST 伴随可自动化执行的测试；无测试的行为变更为不完整变更。
- 覆盖率 MUST 由 CI 在每次提交上计算；低于 80% 的分支 MUST NOT 合并。
- 覆盖率 MUST NOT 通过无断言的测试、排除配置或对新增代码的覆盖率豁免来达成；此类手段视为违规。
- 覆盖重心 MUST 落在业务规则、边界条件、错误路径与对外契约（API 请求/响应、数据模型），而非仅覆盖 happy path。
- 缺陷修复 MUST 先补充可复现该缺陷的失败测试，再修复；该测试 MUST 保留为回归测试。
- 覆盖率下降（即使仍在 80% 以上）MUST 在评审中说明原因。

**Rationale**: 80% 是"主要路径与关键分支已被验证"的经验下限；它使回归可在几秒内被发现，而非在生产环境。

### III. RESTful API 设计规范 (RESTful API Design)

所有对外 HTTP 接口 MUST 遵循 REST 语义；违反语义的接口 MUST NOT 上线。

- 资源 MUST 用名词复数表示（`/orders`，`/users/{id}`）；URL 中 MUST NOT 出现动词、操作名或 RPC 风格路径（如 `/getOrderList`、`/order/create`）。
- HTTP 方法 MUST 表达意图：`GET` 读取（无副作用）、`POST` 创建、`PUT` 整体替换、`PATCH` 部分更新、`DELETE` 删除。
- 状态码 MUST 准确：`200`/`201`/`204` 成功语义、`400` 参数错误、`401` 未认证、`403` 无权限、`404` 资源不存在、`409` 冲突、`500` 服务端错误；MUST NOT 用 `200` 包装失败结果。
- 请求与响应体 MUST 为 `application/json`；错误响应 MUST 使用统一结构（至少包含机器可读的错误码与人类可读的消息）。
- 列表接口 MUST 支持分页并返回总数或页游标；分页、排序、过滤 MUST 通过查询参数表达，MUST NOT 编码进路径。
- 接口契约变更 MUST 同步更新 `specs/[###-feature]/contracts/` 中的契约文件；破坏性变更 MUST 通过版本化并提供迁移路径。
- 写操作 MUST 具备幂等性或明确的重复保护；`GET`/`DELETE`/`PUT` MUST 为幂等操作。
- 接口 MUST 无状态：认证信息随请求携带，服务端 MUST NOT 依赖会话中的隐式状态。

**Rationale**: 一致且可预测的接口语义使前端、客户端与第三方集成方无需逐接口学习用法，也让网关、缓存与监控可以按 HTTP 语义统一处理。

### IV. 前后端分离 (Frontend/Backend Separation)

前端与后端 MUST 作为可独立构建、独立部署的单元存在，两者的唯一契约是 HTTP/JSON 接口。

- 前端 MUST 通过公开 API 获取数据，MUST NOT 直接访问后端数据库、后端内部模块或服务端会话存储。
- 后端 MUST 提供完整的对外接口与数据契约，MUST NOT 渲染、拼接前端模板或向前端注入代码逻辑；面向浏览器的产物由前端独立构建。
- 跨域、认证、错误码语义 MUST 在接口层显式定义，MUST NOT 依赖同源部署或隐式约定。
- 接口契约 MUST 有单一事实来源（`contracts/` 中的契约文件），前后端各自据此开发，并以此编写契约测试。
- 前后端 MUST 可分别启动与验证：任一方的开发不得要求另一方先运行在特定内部状态。
- 共享代码 MUST 通过独立发布的包或显式复制的契约产物提供，MUST NOT 通过在对方代码库内直接引用源码实现。

**Rationale**: 分离使两端可独立演进、独立扩容与独立测试，也是并行开发与后续替换任一端的前提。

## 技术约束 (Additional Constraints)

- 项目布局 MUST 采用前后端分离结构：`backend/src/{models,services,api}` 与 `frontend/src/{components,pages,services}`；测试分别置于 `backend/tests/` 与 `frontend/tests/`。
- 测试层级 MUST 覆盖：单元测试（业务规则与工具函数）、契约测试（对 `contracts/` 中定义的接口）、集成测试（端到端用户旅程）。
- 后端 MUST 提供可在本地与 CI 中一键运行的启动、测试与覆盖率命令；前端同理。
- 秘密信息（密钥、令牌、连接串）MUST NOT 进入代码库；MUST 经环境变量或密钥管理注入。
- 依赖 MUST 保持最小：新增运行时依赖 MUST 在 plan 中说明用途与替代方案。
- 日志 MUST 结构化并含请求标识；MUST NOT 记录凭据、令牌或个人敏感数据。

## 开发工作流与质量门禁 (Development Workflow & Quality Gates)

变更 MUST 遵循 Spec Kit 的工作流顺序：`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`。

合并前 MUST 全部通过，任一项失败即阻断合并：

1. 静态检查与格式化无告警。
2. 全部测试通过（单元 + 契约 + 集成）。
3. 覆盖率 ≥ 80% 且新增代码被测试覆盖。
4. `/speckit-analyze` 无未解决的一致性问题（spec ↔ plan ↔ tasks ↔ 代码）。
5. `plan.md` 的 Constitution Check 通过；存在违规时 MUST 在 Complexity Tracking 中逐条说明理由。

评审 MUST 显式核对本宪法四条原则；评审者 MUST 拒绝缺少测试、绕过覆盖率或违反 REST 语义的改动。功能分支 MUST 在合入前与主干同步并重跑门禁。

## Governance

本宪法优先于其他开发实践与临时约定；与之冲突的既有代码在下次被修改时 MUST 按本宪法修正。

- **修订程序**：修订 MUST 以对 `.specify/memory/constitution.md` 的变更提案形式提出，说明动机、受影响的原则与迁移影响，经项目维护者确认后方可生效；变更 MUST 同步更新版本号与修订日期。
- **版本策略**：遵循语义化版本。MAJOR 用于原则的删除或重新定义等不兼容治理变更；MINOR 用于新增原则或实质性扩展；PATCH 用于措辞澄清与表述修正。
- **合规审查**：所有 Pull Request 与本仓库内的 `/speckit-plan`、`/speckit-implement` 输出 MUST 验证对本宪法的合规性；无法满足的约束 MUST 被显式记录为豁免理由，而非静默忽略。
- **运行时指引**：本仓库的 agent 运行时指引见 `AGENTS.md`；当本宪法原则与 `AGENTS.md` 冲突时，以本宪法为准，并 MUST 修正 `AGENTS.md`。

**Version**: 1.0.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-12
