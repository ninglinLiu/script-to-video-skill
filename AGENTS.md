# 本仓库的维护约定

普通视频制作从 `SKILL.md` 开始，按需取路线、经验和实际素材；不用通读整个仓库。

修改 Skill、目录、路由或工具时，先读 `CONTRIBUTING.md` 和 `docs/architecture.md`。

1. 改变职责、入口、依赖或目录结构时，先更新 `docs/architecture.mmd`、`docs/architecture-layout.json` 及相关架构说明，再实现内容。职责没有变化的新增案例不必虚改图；完整文件树仍必须更新。
2. README 的标记区和三份 inventory 文件由 `scripts/repo_inventory.py` 生成。按贡献指南暂存、生成、再次暂存、检查；每次提交都执行，不只在发布时执行。
3. 案例事实维护在 `references/experience/reflections.json`，网页由 `scripts/build_reflections.py` 生成。用户否决、技术通过、制作方观察、独立复测必须分别记录，不互相替代。
4. 维护用户授权的范围。敏感或仅本地素材不得进入公开提交；预览保持静音。修 Skill 不等于替另一个 Agent 制作新片。
5. 沿用标准 Skill 目录、Git、Mermaid、现有命令和测试。先找可复用实现，不另起下载器、记忆服务、包管理器或审美打分系统。

GitHub 工作流会报告不一致，但不能证明 Agent 理解正确，也不能证明成片好看。禁止为通过检查而伪造用户认可或删除失败记录。
