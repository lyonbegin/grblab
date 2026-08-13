"""
'쿠팡 상품 리스트' 폴더 안에서 실행하세요:

    cd "C:\\nanumieum_site\\bazaar\\쿠팡 상품 리스트"
    python parse_and_load.py

이 폴더 안의 모든 "쿠팡이 추천하는 *.html" 파일을 순회하며
JSON-LD 구조화 데이터를 파싱해 같은 폴더의 nanumieumbaza.db(SQLite)에 적재합니다.
DB가 없으면 schema.sql로 새로 만듭니다. 여러 번 실행해도 같은 상품은 중복 적재되지 않습니다(upsert).
"""

import glob
import json
import os
import re
import sqlite3
import sys

FOLDER = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(FOLDER, "nanumieumbaza.db")
SCHEMA_PATH = os.path.join(FOLDER, "schema.sql")

# 웹(bazaar/)에서 이미지를 찾을 때 필요한 접두어.
# 실제 폴더 구조: bazaar/쿠팡 상품 리스트/{파일명}_files/{해시}.jpg
IMAGE_PATH_PREFIX = "쿠팡 상품 리스트"


def ensure_db():
    if not os.path.exists(SCHEMA_PATH):
        print(f"[경고] {SCHEMA_PATH} 이(가) 없습니다. schema.sql을 같은 폴더에 넣어주세요.")
        sys.exit(1)
    # timeout: 다른 프로세스(Node API 서버 등)가 DB를 잠깐 잡고 있어도
    # 바로 에러내지 않고 최대 15초까지 기다렸다가 재시도합니다.
    conn = sqlite3.connect(DB_PATH, timeout=15)
    try:
        with open(SCHEMA_PATH, encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.commit()
    except sqlite3.OperationalError as e:
        print(f"[오류] DB가 잠겨 있어 스키마를 적용하지 못했습니다: {e}")
        print("→ node server.js 를 실행 중이라면 먼저 종료한 뒤 다시 실행해주세요.")
        print("→ DB Browser for SQLite 등으로 nanumieumbaza.db를 열어둔 창이 있다면 닫아주세요.")
        sys.exit(1)
    return conn


def extract_category(filename):
    # "쿠팡이 추천하는 3분짜장 관련 혜택과 특가.html" -> "3분짜장"
    m = re.search(r"쿠팡이 추천하는 (.+?) 관련 혜택과 특가", filename)
    return m.group(1) if m else os.path.splitext(filename)[0]


# 소분류(스크래핑 검색어) -> (대분류, 중분류) 매핑.
# 여기 없는 새 검색어는 자동으로 ("기타","기타")로 들어갑니다 — 나중에 여기에 추가하면 됩니다.
CATEGORY_MAP = {}

def _add(major, mid, names):
    for n in names:
        CATEGORY_MAP[n] = (major, mid)

_add("식품", "즉석식품", ["3분짜장","3분카레","냉동돈까스","냉동만두","냉동볶음밥","밀키트","즉석밥","즉석죽","즉석미역국","즉석북어국","컵반","떡국","볶음김치"])
_add("식품", "면류", ["볶음면","봉지라면","비빔면","칼국수","소면","당면","컵라면"])
_add("식품", "간식·과자", ["강정","건빵","건조과일","견과류멸치볶음","고구마말랭이","곡물바","낱개포장과자","누룽지","단백질바","롤리폴리","모나카","사탕","시리얼바","양갱","에너지바","오예스","웨하스","전통과자","젤리","진미채","천하장사","초코파이","초콜릿","크래커","비스킷","소포장견과류","컵시리얼","아이스크림"])
_add("식품", "조미료·식자재", ["굴소스","다시다","된장","들기름","미원","비빔양념장","쌈장","식자재용간장","식자재용고추장","업소용식용유","참기름","케첩","대용량설탕","대용량소금","대용량시리얼","양념깻잎"])
_add("식품", "음료", ["귀리유","두유","멸균우유","발효유","보리차","비타민음료","아몬드유","에너지드링크","옥수수차","요구르트","유자차","율무차","저지방우유","탄산음료","팩주스","믹스커피","생수2L","영양보충음료"])
_add("식품", "수산·가공식품", ["구운계란","김자반","단무지","도시락김","반찬용멸치","반찬통조림","북어채","소시지","어묵","자른미역","전장김","참치캔","콩자반","통조림햄","훈제란","슬라이스치즈","스프레드","잼","사골곰탕"])
_add("식품", "특수식품", ["환자식음료","함박스테이크","피클"])

_add("생활용품", "티슈·제지", ["각티슈","캡형물티슈","비데물티슈","휴대용물티슈","롤화장지","점보롤","핸드타올","행주"])
_add("생활용품", "세제·청소", ["락스","배수구세정제","살균소독제","섬유유연제","세탁세제","주방세제","주방수세미","종량제봉투"])
_add("생활용품", "위생용품", ["핸드워시","니트릴장갑","위생장갑","일회용 방수 매트"])


def infer_categories(category_name):
    return CATEGORY_MAP.get(category_name, ("기타", "기타"))


def parse_file(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        content = f.read()

    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', content, re.S)
    if not m:
        print(f"  [건너뜀] JSON-LD를 찾을 수 없음: {os.path.basename(path)}")
        return []

    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        print(f"  [건너뜀] JSON 파싱 실패: {os.path.basename(path)} ({e})")
        return []

    items = data.get("mainEntity", {}).get("itemListElement", [])
    filename = os.path.basename(path)
    files_folder = f"{os.path.splitext(filename)[0]}_files"

    products = []
    for it in items:
        p = it.get("item", {})
        if not p:
            continue
        image_url = p.get("image", "")
        filename_hash = image_url.rsplit("/", 1)[-1] if image_url else ""
        local_image = f"{IMAGE_PATH_PREFIX}/{files_folder}/{filename_hash}" if filename_hash else None

        url = p.get("url", "")
        pid_m = re.search(r"/vp/products/(\d+)", url)
        item_m = re.search(r"itemId=(\d+)", url)
        vendor_m = re.search(r"vendorItemId=(\d+)", url)

        rating = p.get("aggregateRating", {})
        offers = p.get("offers", {})

        products.append({
            "position": it.get("position"),
            "coupang_product_id": pid_m.group(1) if pid_m else None,
            "item_id": item_m.group(1) if item_m else None,
            "vendor_item_id": vendor_m.group(1) if vendor_m else None,
            "name": p.get("name"),
            "price": int(offers.get("price", 0)),
            "rating": rating.get("ratingValue"),
            "review_count": rating.get("reviewCount"),
            "image_path": local_image,
            "product_url": url,
        })
    return products


def upsert(conn, category_name, source_file, products):
    cur = conn.cursor()
    group_name, mid_category = infer_categories(category_name)
    cur.execute(
        "INSERT INTO categories(name, group_name, mid_category, source_file) VALUES(?,?,?,?) "
        "ON CONFLICT(name) DO UPDATE SET group_name=excluded.group_name, "
        "mid_category=excluded.mid_category, source_file=excluded.source_file",
        (category_name, group_name, mid_category, source_file),
    )
    cur.execute("SELECT id FROM categories WHERE name=?", (category_name,))
    category_id = cur.fetchone()[0]

    inserted, updated, linked = 0, 0, 0
    for p in products:
        if not p["coupang_product_id"]:
            continue
        cur.execute(
            "SELECT id FROM products WHERE coupang_product_id=? AND vendor_item_id IS ?",
            (p["coupang_product_id"], p["vendor_item_id"]),
        )
        row = cur.fetchone()
        if row:
            product_id = row[0]
            cur.execute(
                """UPDATE products SET item_id=?, name=?, price=?, rating=?, review_count=?,
                   image_path=?, product_url=?, scraped_at=datetime('now') WHERE id=?""",
                (p["item_id"], p["name"], p["price"], p["rating"], p["review_count"],
                 p["image_path"], p["product_url"], product_id),
            )
            updated += 1
        else:
            cur.execute(
                """INSERT INTO products
                   (coupang_product_id, item_id, vendor_item_id, name, price, rating,
                    review_count, image_path, product_url)
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (p["coupang_product_id"], p["item_id"], p["vendor_item_id"], p["name"],
                 p["price"], p["rating"], p["review_count"], p["image_path"], p["product_url"]),
            )
            product_id = cur.lastrowid
            inserted += 1

        cur.execute(
            "INSERT INTO product_categories(product_id, category_id, position) VALUES(?,?,?) "
            "ON CONFLICT(product_id, category_id) DO UPDATE SET position=excluded.position",
            (product_id, category_id, p["position"]),
        )
        linked += 1

    conn.commit()
    return inserted, updated, linked


def main():
    conn = ensure_db()
    html_files = sorted(glob.glob(os.path.join(FOLDER, "쿠팡이 추천하는 *.html")))

    if not html_files:
        print(f"'{FOLDER}' 안에서 '쿠팡이 추천하는 *.html' 파일을 찾지 못했습니다.")
        return

    print(f"총 {len(html_files)}개 파일 발견\n")

    total_products = 0
    for path in html_files:
        filename = os.path.basename(path)
        category = extract_category(filename)
        products = parse_file(path)
        if not products:
            continue
        inserted, updated, linked = upsert(conn, category, filename, products)
        total_products += len(products)
        major, mid = infer_categories(category)
        print(f"[{major} > {mid} > {category}] {filename} → 상품 {len(products)}개 (신규 {inserted}, 갱신 {updated}, 카테고리 연결 {linked})")

    conn.close()
    print(f"\n완료. 총 {total_products}건 처리, DB: {DB_PATH}")


if __name__ == "__main__":
    main()
