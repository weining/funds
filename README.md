# 自选基金助手（魔改版）

> **本项目 Fork 自 [x2rr/funds](https://github.com/x2rr/funds)，感谢原作者的出色工作，欢迎大家继续支持原项目！**
>
> This is a modified fork of [x2rr/funds](https://github.com/x2rr/funds). Please support the original project!

---

## 魔改说明

原项目部分接口已失效，本 Fork 在原有基础上做了以下修复与优化：

- **修复估值接口**：原 `FundMNFInfo` / `FundVarietieValuationDetail` 接口已停止返回实时数据，替换为：
  - 场外基金：`fundgz.1234567.com.cn/js/{code}.js` 获取实时估值
  - 场内 ETF：`push2.eastmoney.com` 获取实时行情价格
  - 净值估算曲线：`j4.dfcfw.com/charts/pic6/{code}.png` 图片直显
- **修复 ETF 市场判断**：正确区分深圳（`15xxxx`）与上海（`51xxxx`/`56xxxx`/`58xxxx`）ETF 的 secid 前缀
- **修复角标数据更新**：修复 `refreshBadge` / `refreshBadgeAllGains` 消息中字段大小写不一致导致角标显示 `0.00` 的问题
- **兼容商店版配置导入**：商店版使用 `fundListGroup` 分组结构，GitHub 版使用扁平 `fundListM`，导入时自动转换并归一化字段
- **提高刷新频率**：基金数据 60s → 15s，角标 2min → 30s
- **列表底部新增总市值展示**
- **修复构建兼容性**：`node-sass` → `sass`，支持 Apple Silicon（arm64）+ Node v22 环境构建；替换废弃的 `/deep/` 为 `::v-deep`
- **修复图表组件空指针**：`beforeDestroy` 中 `myChart.clear()` 加 null 守卫
