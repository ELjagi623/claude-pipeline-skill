<div align="center">

# Claude Pipeline Skill

**一行命令，把 Claude Code 会话变成一个「计划 → 开发 → 测试」的自动开发小队。**

[![Release](https://img.shields.io/github/v/release/ELjagi623/claude-pipeline-skill?label=release)](https://github.com/ELjagi623/claude-pipeline-skill/releases/latest)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skill%20%2B%20subagents-d97757)](https://docs.claude.com/en/docs/claude-code)

[English](README.md) | **简体中文**

[安装](#安装) · [让 AI agent 帮你装](#让-ai-agent-帮你安装) · [使用](#使用) · [工作原理](#工作原理) · [配置](#配置) · [设计文档](docs/设计说明.md)

</div>

---

输入 `/pipeline`，当前会话就切换成**调度者**。如果你已经写好了 PRD 和开发计划，它直接按计划开发；如果只有需求，就先让计划 agent 拆成若干阶段。之后由调度者主导整个流程：

1. 计划定稿后，立刻把阶段划分成若干**测试批次**（默认每 3 个阶段一批）；
2. 开发 agent 逐个阶段实现；
3. 一批阶段全部开发完，测试 agent 统一验收一轮；
4. 失败项集中修复一轮，只复测失败项；
5. 某个阶段一直过不去时，计划 agent 调整方案或顺序，直到全部阶段处理完后交付。

**整个项目由调度者主导**：什么时候开发、什么时候测试、测什么范围、派几个测试 agent、是否采纳子 agent 的建议，都由它决定。三个子 agent 只负责执行自己的那一块，可以给建议。调度者自己不写业务代码、测试和计划，只维护进度记录。

三个子 agent 各自拥有**独立的上下文窗口**。不输入 `/pipeline` 时，这套流程完全不生效，会话照常使用。

<p align="center">
  <img src="docs/zh.png" alt="/pipeline 架构与流程图：调度者主导计划、开发、测试三个子 agent；逐阶段开发、按批次统一测试，失败集中修复后只复测失败项，全部通过后交付" width="100%">
</p>

<p align="center"><sub>源文件 <a href="docs/pipeline-diagram-zh.excalidraw">docs/pipeline-diagram-zh.excalidraw</a>，可在 <a href="https://excalidraw.com">excalidraw.com</a> 打开编辑</sub></p>

## 特性

- **真正的开关式**：只有你手动输入 `/pipeline` 才会启动。三个角色的定义放在 skill 目录里，没有注册成全局子 agent，所以平时的会话里没有任何 pipeline 角色可被自动调用。
- **调度者主导**：由主 agent 决定做什么、何时做。子 agent 执行并给建议，调度者可以采纳也可以不采纳，每个决定都记在 `DECISIONS.md`。
- **职责隔离**：调度者只调度；测试 agent 不能改源码，验收保持独立。
- **测试省 token（v1.3.0）**：阶段按事先划好的批次统一测试；开发者交付 `acceptance` 脚本，测试者只补缺口；失败后只复测失败项。详见[测试提效](#测试提效)。
- **独立上下文**：每个子 agent 自己的对话互不干扰，主 agent 只收到几行交接单。
- **复用 + 自动轮换**：agent 默认沿用以保留上下文；子 agent 发现自己被自动压缩过会主动报告，主 agent 随即换新。测试 agent 同一批次内续用、换批次才换新；开发 agent 连续服务 3 个阶段或状态异常时也会换新。
- **可中断、可恢复**：所有进度写在项目的 `.pipeline/` 文件夹里，换会话也能用 `/pipeline 继续` 接着跑。
- **自带计划直接开发**：已有 PRD 和开发计划就直接用，计划 agent 只补缺的验收标准，不改你的方案。
- **规划可问，执行不问**：规划时有需要你拍板的问题，会一次性问完；计划定稿后自动开始无人值守执行，醒来看 `.pipeline/SUMMARY.md` 就行。
- **卡住自动重新规划**：同一个问题修不好时及时叫停，交给计划 agent 换方案、调整顺序先做别的、拆分或降级，然后继续推进。
- **防死循环**：每个测试批次最多修 3 轮、每个阶段最多重新规划 2 次；到上限就记为遗留问题，继续其他阶段。

## 测试提效

实测中，测试 agent 占了总 token 的约 40%，单轮要 30–40 分钟：开发者已写了大量测试，测试者又重写一套；测得过深（变异检验、多时区穷举、整套测试连跑多遍）；每个测试 agent 还要重读计划、旧报告和设计稿。v1.3.0 的对策：

| 规则 | 做法 |
|---|---|
| 批次事先规划 | 计划定稿后，调度者把阶段划分成测试批次（`TEST_BATCH = 3`），写进 `PROGRESS.md`；一批的阶段都开发完才测这一批。标了「立即测试」的高风险地基阶段会提前结束当前批次。 |
| `acceptance` 脚本 | 开发者必须交付一条命令即可运行的验收脚本（如 `npm run acceptance`），自动核对验收标准并输出 PASS/FAIL 表；覆盖不了的列为「acceptance 未覆盖项」。 |
| 只补缺口 | 测试者先跑 `acceptance`，信任已有自动化测试，只验证它没覆盖的部分；不做变异检验、多时区穷举、整套连跑；怀疑偶发失败时，只对那一个用例重跑 3 次。 |
| 固定清单 + 预算 | 每个测试 agent 约 25 项，每项有"怎么验 / 通过标准"，预算 30–40 分钟；超时先出报告并标注未测项。报告只写 PASS/FAIL 表、失败详情、截图路径。 |
| 并行测试 | 有界面的项目同时派「数据与接口」和「界面与视觉」两个测试 agent。这是"同一时间只有一个子 agent"的唯一例外。 |
| 集中修复，只复测失败项 | 整批失败项一次交给开发修完；复测只验失败的条目，并且只派有失败的那个范围。 |
| 批内复用 | 同一批次的复测沿用同一个测试 agent，换批次才换新的。 |

## 前置条件

- 已安装 [Claude Code](https://docs.claude.com/en/docs/claude-code)（命令行、桌面版或 IDE 插件均可）。
- 一键安装需要 `curl`（macOS / Linux）或 PowerShell（Windows，系统自带）。

## 安装

安装位置是用户级配置目录 `~/.claude/`，装一次所有项目都能用。已存在的同名文件会先自动备份为 `*.bak.<时间戳>`。

### 方式一：一行命令（推荐）

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.sh | bash
```

**Windows（PowerShell）**

```powershell
irm https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.ps1 | iex
```

### 方式二：下载 Release

1. 下载 [claude-pipeline-skill.zip](https://github.com/ELjagi623/claude-pipeline-skill/releases/latest/download/claude-pipeline-skill.zip) 并解压。
2. 在解压出来的文件夹里运行：
   - macOS / Linux：`bash install.sh`
   - Windows：`powershell -ExecutionPolicy Bypass -File .\install.ps1`

### 方式三：手动复制

| 仓库中的文件 | 复制到 |
|---|---|
| `skills/pipeline/SKILL.md` | `~/.claude/skills/pipeline/SKILL.md` |
| `skills/pipeline/roles/planner.md` | `~/.claude/skills/pipeline/roles/planner.md` |
| `skills/pipeline/roles/developer.md` | `~/.claude/skills/pipeline/roles/developer.md` |
| `skills/pipeline/roles/tester.md` | `~/.claude/skills/pipeline/roles/tester.md` |

> [!TIP]
> 只想在某一个项目里用？把 `skills/pipeline/` 文件夹（含 `roles/`）复制到**该项目**的 `.claude/skills/` 下即可，不影响其他项目。

> [!IMPORTANT]
> 安装后需要**新开一个 Claude Code 会话**，新的 skill 才会被识别。

## 让 AI agent 帮你安装

把这个仓库地址发给你的 Claude Code（或其他能执行命令的 AI agent），说一句「帮我安装这个」即可：

```text
https://github.com/ELjagi623/claude-pipeline-skill 帮我安装这个
```

### 给 AI agent 的安装说明

> 如果你是正在阅读本文件的 AI agent，用户希望你安装这个 skill，请按以下步骤执行：

1. **判断系统**，运行对应的一条命令（会把 4 个文件下载并安装到用户的 Claude Code 配置目录）：
   - macOS / Linux / Windows 上的 Git Bash：
     `curl -fsSL https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.sh | bash`
   - Windows PowerShell：
     `irm https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.ps1 | iex`
2. **校验**下面 4 个文件都已存在（`~` 为用户主目录；若设置了环境变量 `CLAUDE_CONFIG_DIR`，则以它代替 `~/.claude`）：
   - `~/.claude/skills/pipeline/SKILL.md`
   - `~/.claude/skills/pipeline/roles/planner.md`
   - `~/.claude/skills/pipeline/roles/developer.md`
   - `~/.claude/skills/pipeline/roles/tester.md`
3. 如果无法联网下载，改用[方式三](#方式三手动复制)：从本仓库读取这 4 个文件，按表格原样写入目标路径。写入前若目标文件已存在，先备份。
4. **告诉用户**：安装完成，需要新开一个 Claude Code 会话，然后输入 `/pipeline <完整需求>` 启动。
5. 不要修改这 4 个文件的内容，也不要运行 `/pipeline`，除非用户要求。

## 使用

在项目文件夹里新开会话，然后：

| 命令 | 作用 |
|---|---|
| `/pipeline` | 自动在项目里找 PRD 和开发计划，开启流水线 |
| `/pipeline <文件路径…>` | 指定 PRD / 计划文件，例如 `/pipeline docs/PRD.md docs/开发计划.md` |
| `/pipeline <完整需求>` | 没有文件时，直接用文字描述需求 |
| `/pipeline 状态` | 查看进度（不派任何 agent） |
| `/pipeline 停止` | 暂停 |
| `/pipeline 继续` | 从中断处恢复，换了会话也行 |

### 两种启动方式

**方式 A：先写好 PRD 和开发计划（推荐）**

先在另一个对话里把需求讨论清楚，写出 PRD 和开发计划，存进项目文件夹（比如 `docs/`），然后输入：

```text
/pipeline
```

它会自动找到这两个文件（找到多个候选时会问你用哪个）。计划里每个阶段已经有可验证的验收标准时，直接开始开发；缺的话，计划 agent 只补验收标准和阶段依赖，不改你的阶段划分和方案。

**方式 B：只给需求**

```text
/pipeline 做一个记账网页：可以添加收入和支出、按月统计、数据保存在浏览器本地，用原生 HTML/CSS/JS，不要后端。
```

计划 agent 从零制定计划。需求写得越具体（功能、技术栈偏好、如何验收），计划越准确。

### 规划阶段：可能会问你几个问题

制定或导入计划时，如果有**会实质影响产品**的问题需要你拍板，它会一次性问完，每个问题都附上推荐答案。你可以逐个回答，也可以直接回复"按推荐来"。回答完，计划定稿，**自动开始执行**，不用再说"开始"。

### 执行阶段：不再问你任何问题，可以放心去睡觉

- **需要做选择时**，按「功能最完整 > 缺陷最少 > 可靠可测试 > 易于调整」的顺序自己挑，每个决策和理由都记在 `.pipeline/DECISIONS.md`。
- **某个阶段卡住时**（开发说做不了、修了 3 轮还不过、或连续两轮出现相同的失败），它会及时叫停修复，交给计划 agent 调整：换技术方案、把这个阶段推迟先做别的、拆分，或者缩小范围。每个阶段最多调整 2 次，还不行就记进待办，继续其他阶段。
- **红线**：需要你的账号、密钥、付费服务，或者 git push、部署、删除项目外文件这类操作，它不会替你做。它会用模拟数据或占位配置先把能做的做完，然后把这些事列给你。
- **全部结束后**，打开 `.pipeline/SUMMARY.md`：里面有怎么运行、各阶段结果、计划调整记录、待你处理的事项和它替你做的关键决策。

> [!IMPORTANT]
> 过夜运行前请确认两件事，否则流程会卡住或中断：
> 1. Claude Code 的权限模式是 **auto**，否则遇到需要审批的操作会停下来等你点。
> 2. 电脑不会自动睡眠。在 Claude 桌面版里可以打开「保持唤醒」，也可以在系统电源设置里关掉睡眠。

## 工作原理

| 角色 | 文件 | 职责 |
|---|---|---|
| 调度者 | `skills/pipeline/SKILL.md` | 主导整个项目：划分测试批次、决定下一步做什么和何时测试、判定结果、记录进度、向你汇报。不写代码。 |
| 计划 | `skills/pipeline/roles/planner.md` | 全程待命：开头新建计划或导入你的计划；开发卡住时调整计划（换方案 / 调顺序 / 拆分 / 降级）。 |
| 开发 | `skills/pipeline/roles/developer.md` | 每次只实现一个阶段，交付 `acceptance` 脚本；按测试报告找根因修复。 |
| 测试 | `skills/pipeline/roles/tester.md` | 先跑 `acceptance`，在固定清单和时间预算内补缺口，给出 PASS / FAIL。不改源码。 |

agent 之间**传路径，不传全文**：消息里只有指令和文件路径，计划、报告等长内容都写在项目的 `.pipeline/` 文件夹中；子 agent 完成后只返回一张四行的交接单（状态、报告路径、关键文件、需要注意）。

```
.pipeline/
├─ REQUIREMENTS.md       PRD / 需求原文（从你的文件原样复制，原文件不改）
├─ PLAN_SOURCE.md        你提供的计划原文（有的话）
├─ QUESTIONS.md          规划阶段的澄清问题和你的回答
├─ PLAN.md               流水线实际使用的分阶段计划（阶段 ID、依赖、执行顺序）
├─ DECISIONS.md          它替你做的决策和理由
├─ PROGRESS.md           进度、测试批次表、计划调整记录、遗留问题、待你处理（中断后靠它恢复）
├─ SUMMARY.md            最终交付总结（醒来先看这个）
└─ reports/              每阶段的开发报告和每轮、每个范围的测试报告
```

完整的架构图、通信协议、上下文管理策略和设计取舍见 **[设计文档](docs/设计说明.md)**。

## 配置

| 参数 | 位置 | 默认值 | 说明 |
|---|---|---|---|
| `MAX_FIX` | `SKILL.md` | 3 | 每个测试批次最多修复几轮，之后交给计划 agent 重新规划 |
| `MAX_REPLAN` | `SKILL.md` | 2 | 每阶段最多重新规划几次，之后记为遗留问题 |
| `ROTATE_EVERY` | `SKILL.md` | 3 | 开发 agent 连续服务几个阶段后换新 |
| `TEST_BATCH` | `SKILL.md` | 3 | 每几个阶段划为一个测试批次（遇「立即测试」阶段提前收批） |
| `model` | 各 agent 文件头部 | `inherit` | 例如改成 `sonnet` 以节省成本 |

安装脚本还支持两个环境变量：`PIPELINE_REF`（指定下载的分支或标签，默认 `main`）和 `CLAUDE_CONFIG_DIR`（Claude Code 配置目录，默认 `~/.claude`）。

## 更新与卸载

**更新**：重新运行安装命令即可，旧文件会自动备份。

**卸载**：删除以下文件和文件夹。

```bash
rm -rf ~/.claude/skills/pipeline
```

> [!NOTE]
> 多阶段、多轮测试会消耗较多 token，项目越大越明显。规则写在提示词里，模型通常会遵守，但不是代码级强制。更多限制见[设计文档](docs/设计说明.md#10-已知限制)。
