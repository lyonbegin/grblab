-- 나눔이음바자 상품 DB 스키마 (SQLite)
-- 실행: sqlite3 nanumieumbaza.db < schema.sql
--
-- 참고: categories 테이블에 group_name 컬럼이 새로 추가되어, 기존 DB가 있으면
-- 재생성이 필요합니다 (SQLite는 "컬럼 없으면 추가"가 안 돼서 DROP 후 재생성합니다).
-- products/product_categories는 그대로 두면 재적재 없이도 동작하지만,
-- 한 번에 깨끗이 맞추려면 아래 DROP을 전부 실행하고 parse_and_load.py를 다시 돌리면 됩니다.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE IF NOT EXISTS categories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,      -- 소분류, 예: "3분짜장" (스크래핑 검색어)
  group_name   TEXT NOT NULL DEFAULT '기타',  -- 대분류, 예: "식품"
  mid_category TEXT NOT NULL DEFAULT '기타',  -- 중분류, 예: "즉석식품"
  source_file  TEXT                        -- 원본 html 파일명
);

CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_name);
CREATE INDEX IF NOT EXISTS idx_categories_mid ON categories(mid_category);

CREATE TABLE IF NOT EXISTS products (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  coupang_product_id  TEXT NOT NULL,      -- coupang.com/vp/products/{이 값}
  item_id             TEXT,
  vendor_item_id      TEXT,
  name                TEXT NOT NULL,
  price               INTEGER NOT NULL,
  rating              REAL,
  review_count        INTEGER,
  image_path          TEXT,               -- 웹에서 바로 쓰는 상대경로 (쿠팡 상품 리스트/... 접두어 포함)
  product_url         TEXT,
  seller              TEXT DEFAULT '쿠팡',
  type                TEXT DEFAULT 'general',   -- general | donate
  stock               INTEGER DEFAULT 999,
  scraped_at          TEXT DEFAULT (datetime('now')),
  UNIQUE(coupang_product_id, vendor_item_id)
);

-- 상품 ↔ 카테고리 다대다 (같은 상품이 여러 검색어 파일에 겹쳐 등장하는 경우 대응)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id  INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  position    INTEGER,           -- 그 카테고리 파일 안에서의 노출 순서
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id)  REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_coupang_id ON products(coupang_product_id);
CREATE INDEX IF NOT EXISTS idx_pc_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_pc_product ON product_categories(product_id);
