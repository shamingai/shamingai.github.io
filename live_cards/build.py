# -*- coding: utf-8 -*-
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config
import data_trust, data_ai, data_attack

events = data_trust.EVENTS + data_ai.EVENTS + data_attack.EVENTS

ids = [e['id'] for e in events]
assert len(ids) == len(set(ids)), "重复 id: " + str([i for i in ids if ids.count(i) > 1])

CATS = {"trust","vuln","ot","aigov","agent","aifind","aiattack","supply","gov"}
SEVS = {"critical","high","medium","low"}
for e in events:
    need = {"id","cat","sev","date","title","sub","tags","hl","quick","fields","tpts","refs"}
    assert set(e.keys()) >= need, e['id'] + " 缺字段: " + str(need - set(e.keys()))
    assert e['cat'] in CATS, e['id'] + " 分类错误"
    assert e['sev'] in SEVS, e['id'] + " 严重度错误"
    assert 2 <= len(e['hl']) <= 4, e['id'] + " hl 数量应为 2-4"
    assert 4 <= len(e['quick']) <= 6, e['id'] + " quick 数量应为 4-6"
    assert len(e['fields']) >= 3, e['id'] + " fields 过少"
    assert len(e['tpts']) >= 2, e['id'] + " tpts 过少"
    for r in e['refs']:
        assert r['u'].startswith('http'), e['id'] + " 链接异常: " + r['u']

# 直播主讲顺序（截图确认的前 5 张 + 其余保持原有相对顺序）
HEAD = [
    "ot-fridge",            #  1
    "vuln-php2shell",       #  2
    "vuln-gitlab",          #  3
    "aigov-gemini",         #  4
    "aigov-kimi",           #  5
    "trust-emudhra",        #  6
    "agent-antian-chain",   #  7
    "aigov-mythos",         #  8
    "gov-cn-week",          #  9
    "gov-cisco-91",         # 10
    "agent-cn-audit",       # 11
    "agent-anthropic-unintended",  # 12
    "agent-openai-australia",      # 13
    "aigov-cn-framework3",         # 14
    "aigov-frontier-pact",         # 15
]
idset = {e['id'] for e in events}
for h in HEAD:
    assert h in idset, "HEAD 中的 id 不存在: " + h
rest = [e['id'] for e in events if e['id'] not in HEAD]
order = HEAD + rest
assert len(order) == len(events) and set(order) == idset, "顺序列表与事件集不一致"

print("前 15 张顺序（截图确认）：")
for i, oid in enumerate(order[:15], 1):
    e = next(x for x in events if x['id'] == oid)
    mark = "★截图" if oid in HEAD else "  顺延"
    print(f"  {i:2d}. {mark} [{e['cat']:8s}] {e['title'][:32]}")

base = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(base, 'template.html'), encoding='utf-8').read()
out = tpl.replace('__EVENTS_JSON__', json.dumps(events, ensure_ascii=False))
out = out.replace('__DEFAULT_ORDER__', json.dumps(order, ensure_ascii=False))
out = out.replace('__CONFIG_JSON__', json.dumps(config.CONFIG, ensure_ascii=False, indent=2))
target = '/data/workspace/AI安全直播卡片墙.html'
open(target, 'w', encoding='utf-8').write(out)

from collections import Counter
c = Counter(e['cat'] for e in events)
print("\n事件总数:", len(events))
for k, v in sorted(c.items(), key=lambda x: -x[1]):
    print(f"  {k:9s} {v}")
print("输出:", target, os.path.getsize(target)//1024, "KB")
