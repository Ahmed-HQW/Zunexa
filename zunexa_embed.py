#!/usr/bin/env python3
"""
zunexa_embed.py — Zunexa RAG Embedding Script
═══════════════════════════════════════════════
يقرأ zunexa_qa_final.json ويحوّل كل إدخال لـ embedding
ويرفعه لـ Supabase (جدول zunexa_knowledge).

المتطلبات:
    pip install requests numpy

الاستخدام:
    python3 zunexa_embed.py

متغيرات البيئة (اختياري — يمكن تعديلها مباشرة أدناه):
    SUPABASE_URL         https://xrldhfsytysznyyhwjlr.supabase.co
    SUPABASE_SERVICE_KEY  مفتاح الـ service_role (من Supabase Settings → API)
    HF_TOKEN             مفتاح HuggingFace (اختياري — بدونه أبطأ قليلاً)
"""

import json
import os
import time
import sys
import requests
from typing import Optional

# ── إعدادات ──────────────────────────────────────────────────
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://xrldhfsytysznyyhwjlr.supabase.co"
)
# ⚠️ استخدم service_role key هنا (ليس الـ publishable key)
# احصل عليه من: Supabase Dashboard → Settings → API → service_role
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "YOUR_SERVICE_ROLE_KEY_HERE"   # ← ضعه هنا أو في متغير البيئة
)
HF_TOKEN = os.getenv("HF_TOKEN", "")  # اختياري لكن يرفع الـ rate limit

# نموذج الـ embedding — all-MiniLM-L6-v2:
#   - 384 dimension (يطابق العمود في SQL)
#   - يدعم العربية والفرنسية والإنجليزية بشكل جيد
#   - مجاني تماماً على HuggingFace
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_API_URL  = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"

KB_FILE     = "zunexa_qa_final.json"
BATCH_SIZE  = 20    # عدد الإدخالات في كل batch
SLEEP_MS    = 0.8   # ثوانٍ بين الـ batches (لتجنب rate limiting)
MAX_CONTENT = 800   # حد أقصى للنص المُرسَل للـ embedding (حرف)


# ── دوال مساعدة ──────────────────────────────────────────────

def get_embedding(texts: list[str]) -> list[list[float]]:
    """
    يحصل على embeddings من HuggingFace Inference API.
    يُرسل حتى 20 نص في طلب واحد.
    """
    headers = {"Content-Type": "application/json"}
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"

    payload = {
        "inputs": texts,
        "options": {"wait_for_model": True}
    }

    for attempt in range(4):
        try:
            res = requests.post(
                HF_API_URL,
                headers=headers,
                json=payload,
                timeout=45
            )
            if res.status_code == 200:
                data = res.json()
                # HF يرجع إما list أو list of lists
                if isinstance(data[0], list):
                    return data
                return [data]  # نص واحد
            elif res.status_code == 503:
                wait = 20 + attempt * 15
                print(f"  ⏳ النموذج يُحمَّل، انتظر {wait}ث...")
                time.sleep(wait)
            else:
                print(f"  ❌ HF Error {res.status_code}: {res.text[:200]}")
                time.sleep(5)
        except requests.exceptions.Timeout:
            print(f"  ⏱ Timeout، محاولة {attempt+1}/4...")
            time.sleep(10)
        except Exception as e:
            print(f"  ❌ {e}")
            time.sleep(5)

    raise RuntimeError(f"فشل الحصول على embedding بعد 4 محاولات")


def build_content(entry: dict) -> str:
    """
    يبني النص الذي سيُحوَّل لـ embedding من الإدخال.
    يجمع السؤال والجواب ليعطي سياقاً أفضل.
    """
    q  = entry.get("q", "")
    a  = entry.get("a", "")
    kw = " ".join(entry.get("kw", [])[:8])  # أهم 8 كلمات مفتاحية فقط

    # نبني نصاً غنياً لكن مضغوطاً للـ embedding
    text = f"{kw}\n{q}\n{a}"
    # نُنظّف العلامات الزائدة
    text = text.replace("```", "").replace("**", "")
    return text[:MAX_CONTENT]


def build_title(entry: dict) -> str:
    """عنوان قصير للإدخال."""
    kw = entry.get("kw", [])
    if kw:
        return ", ".join(kw[:3])
    return entry.get("q", "")[:60]


def upsert_batch(rows: list[dict]) -> bool:
    """
    يُدرج batch من الإدخالات في Supabase.
    يستخدم upsert بـ id لتجنب التكرار عند إعادة التشغيل.
    """
    headers = {
        "Content-Type": "application/json",
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Prefer":        "resolution=merge-duplicates"
    }
    url = f"{SUPABASE_URL}/rest/v1/zunexa_knowledge"

    res = requests.post(url, headers=headers, json=rows, timeout=30)
    if res.status_code in (200, 201, 204):
        return True
    print(f"  ❌ Supabase Error {res.status_code}: {res.text[:300]}")
    return False


def check_existing_ids() -> set:
    """
    يجلب كل الـ IDs الموجودة في Supabase لتجنب إعادة رفع ما تم بالفعل.
    مفيد عند إعادة تشغيل السكريبت بعد انقطاع.
    """
    headers = {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    url = f"{SUPABASE_URL}/rest/v1/zunexa_knowledge?select=id&limit=10000"
    try:
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            return {row["id"] for row in data}
    except Exception as e:
        print(f"  ⚠️ لم أتمكن من جلب الـ IDs الموجودة: {e}")
    return set()


# ── التنفيذ الرئيسي ───────────────────────────────────────────

def main():
    print("═" * 55)
    print("  Zunexa RAG Embedding Script")
    print("═" * 55)

    # فحص الإعدادات
    if "YOUR_SERVICE_ROLE_KEY" in SUPABASE_SERVICE_KEY:
        print("❌ ضع service_role key في السكريبت أو متغير البيئة SUPABASE_SERVICE_KEY")
        print("   احصل عليه من: Supabase → Settings → API → service_role (secret)")
        sys.exit(1)

    # قراءة الـ KB
    if not os.path.exists(KB_FILE):
        print(f"❌ الملف {KB_FILE} غير موجود في نفس المجلد")
        sys.exit(1)

    with open(KB_FILE, encoding="utf-8") as f:
        kb = json.load(f)

    print(f"✅ قُرئ {len(kb)} إدخال من {KB_FILE}")

    # جلب الـ IDs الموجودة (للتخطي عند إعادة التشغيل)
    print("🔍 فحص ما هو موجود في Supabase...")
    existing = check_existing_ids()
    print(f"   موجود بالفعل: {len(existing)} إدخال")

    # تصفية ما لم يُرفع بعد
    to_process = [e for e in kb if e.get("id") not in existing]
    print(f"   سيُرفع الآن:   {len(to_process)} إدخال")

    if not to_process:
        print("✅ كل الإدخالات موجودة بالفعل في Supabase!")
        return

    # المعالجة على batches
    total_ok  = 0
    total_err = 0
    batches   = [to_process[i:i+BATCH_SIZE] for i in range(0, len(to_process), BATCH_SIZE)]

    print(f"\n🚀 بدء المعالجة: {len(batches)} batch × {BATCH_SIZE} إدخال\n")

    for b_idx, batch in enumerate(batches):
        print(f"[{b_idx+1}/{len(batches)}] ", end="", flush=True)

        # بناء النصوص
        contents = [build_content(e) for e in batch]

        # توليد الـ embeddings
        try:
            embeddings = get_embedding(contents)
        except RuntimeError as e:
            print(f"❌ تخطّي هذا الـ batch: {e}")
            total_err += len(batch)
            continue

        # بناء الصفوف
        rows = []
        for entry, emb in zip(batch, embeddings):
            # تطبيع الـ embedding (يجب أن يكون list of 384 floats)
            if isinstance(emb, list) and len(emb) == 384:
                vec = emb
            elif isinstance(emb, list) and len(emb) > 0 and isinstance(emb[0], list):
                vec = emb[0]  # nested list
            else:
                # إذا كان الشكل غير متوقع، تخطَّ
                print(f"⚠️ embedding shape غير متوقع: {type(emb)}, len={len(emb) if isinstance(emb,list) else 'N/A'}")
                total_err += 1
                continue

            rows.append({
                "id":        entry.get("id", ""),
                "title":     build_title(entry),
                "content":   entry.get("a", "")[:2000],  # الجواب الكامل
                "category":  entry.get("cat", entry.get("category", "general")),
                "source":    entry.get("src", "kb"),
                "keywords":  entry.get("kw", [])[:20],
                "lang":      "ar",
                "embedding": vec,
                "weight":    float(entry.get("w", 1.0)),
                "is_active": True
            })

        if not rows:
            continue

        # رفع لـ Supabase
        ok = upsert_batch(rows)
        if ok:
            total_ok += len(rows)
            print(f"✅ {len(rows)} إدخال")
        else:
            total_err += len(rows)
            print(f"❌ فشل {len(rows)} إدخال")

        time.sleep(SLEEP_MS)

    # ملخص
    print(f"\n{'═'*55}")
    print(f"  ✅ نجح   : {total_ok}")
    print(f"  ❌ فشل   : {total_err}")
    print(f"  📊 المجموع: {total_ok + total_err}")
    print(f"{'═'*55}")

    if total_ok > 0:
        print("\n🎯 الخطوة التالية:")
        print("   شغّل ZUNEXA_RAG_SETUP.sql في Supabase SQL Editor")
        print("   ثم ادفع ai.html المحدَّث على GitHub")


if __name__ == "__main__":
    main()
