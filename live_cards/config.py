# -*- coding: utf-8 -*-
"""每次直播只改这个文件。改完运行 `python3 build.py` 重新生成 HTML。"""

CONFIG = {
    # ---------- 品牌 / 场次信息 ----------
    "brand": {
        "title":   "AI 与网络安全近期事件",   # 主标题
        "program": "AI质效大家谈",            # 栏目名（置空则不显示）
        "host":    "中关村智联联盟",          # 主办单位（置空则隐藏整个徽标）
        "hostRole":"主办",                    # 主办 / 承办 / 协办
        "time":    "2026年10月29日 19:30",    # 直播时间（置空则不显示）
    },

    # ---------- 分类（顺序即筛选栏顺序）----------
    # v 为配色变量名，可选：
    #   --catTrust 青  --catVuln 红   --catOt 橙
    #   --catAigov 紫  --catAgent 橘  --catAifind 绿
    #   --catAiattack 粉 --catSupply 黄 --catGov 蓝
    "cats": [
        {"key": "trust",    "n": "信任基础设施", "v": "--catTrust"},
        {"key": "vuln",     "n": "基础软件漏洞", "v": "--catVuln"},
        {"key": "ot",       "n": "工控与物理世界","v": "--catOt"},
        {"key": "aigov",    "n": "AI 模型治理",  "v": "--catAigov"},
        {"key": "agent",    "n": "AI 智能体事故","v": "--catAgent"},
        {"key": "aifind",   "n": "AI 辅助发现",  "v": "--catAifind"},
        {"key": "aiattack", "n": "AI 被用于攻击","v": "--catAiattack"},
        {"key": "supply",   "n": "供应链",       "v": "--catSupply"},
        {"key": "gov",      "n": "治理与行业",   "v": "--catGov"},
    ],

    # ---------- 严重度 ----------
    "sev": {
        "critical": {"n": "严重", "v": "--sevCritical"},
        "high":     {"n": "高",   "v": "--sevHigh"},
        "medium":   {"n": "中",   "v": "--sevMedium"},
        "low":      {"n": "低",   "v": "--sevLow"},
    },
}
