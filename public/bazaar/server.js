/**
 * 나눔이음바자 상품 API 서버
 *
 * 실행 방법 (bazaar 폴더에서, npm install 필요 없음):
 *   node server.js
 *
 * Node.js 내장 node:sqlite 모듈만 사용합니다 (better-sqlite3처럼
 * 컴파일러/Visual Studio Build Tools가 필요 없습니다. Node.js 22.5+ 필요).
 *
 * 엔드포인트
 *   GET /api/products?page=1&limit=24&major=식품&mid=간식·과자&minor=강정&q=검색어&sort=low|high
 *     -> { items: [...], total, page, limit, totalPages }
 *   GET /api/categories/tree
 *     -> [{ major, count, mids: [{ mid, count, minors: [{ name, count }, ...] }, ...] }, ...]
 *        (대분류→중분류→소분류 트리, 카테고리 메가메뉴/JSON 다운로드용)
 *
 * DB 파일(nanumieumbaza.db)은 "쿠팡 상품 리스트" 하위 폴더에 있습니다
 * (parse_and_load.py가 그 폴더 안에서 실행되어 만든 파일).
 */

const http = require('http');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, '쿠팡 상품 리스트', 'nanumieumbaza.db');

let db;
try {
  db = new DatabaseSync(DB_PATH, { readOnly: true });
} catch (e) {
  console.error(`DB를 열 수 없습니다: ${DB_PATH}`);
  console.error('먼저 parse_and_load.py를 실행해 DB를 만들어주세요.');
  console.error(e.message);
  process.exit(1);
}

const BASE_SELECT = `
  SELECT
    p.id,
    p.coupang_product_id,
    p.name,
    p.price,
    p.rating,
    p.review_count,
    p.image_path,
    p.product_url,
    p.seller,
    p.type,
    p.stock,
    (
      SELECT c.group_name FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = p.id
      ORDER BY pc.position
      LIMIT 1
    ) AS major,
    (
      SELECT c.mid_category FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = p.id
      ORDER BY pc.position
      LIMIT 1
    ) AS mid,
    (
      SELECT c.name FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = p.id
      ORDER BY pc.position
      LIMIT 1
    ) AS minor
  FROM products p
`;

function rowToProduct(r) {
  return {
    id: `cp-${r.coupang_product_id}`,
    name: r.name,
    price: r.price,
    rating: r.rating,
    reviewCount: r.review_count,
    image: r.image_path,
    url: r.product_url,
    category: r.major,
    mid: r.mid,
    minor: r.minor,
    seller: r.seller,
    type: r.type,
    stock: r.stock,
  };
}

function getProducts(params) {
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const limit = Math.min(1000, Math.max(1, parseInt(params.get('limit') || '24', 10)));
  const major = params.get('major') || '';
  const mid = params.get('mid') || '';
  const minor = params.get('minor') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || '';

  let sql = `SELECT * FROM (${BASE_SELECT}) t WHERE 1=1`;
  const args = [];
  if (major) { sql += ' AND t.major = ?'; args.push(major); }
  if (mid)   { sql += ' AND t.mid = ?';   args.push(mid); }
  if (minor) { sql += ' AND t.minor = ?'; args.push(minor); }
  if (q) { sql += ' AND t.name LIKE ?'; args.push(`%${q}%`); }

  const countRow = db.prepare(`SELECT COUNT(*) AS n FROM (${sql})`).get(...args);
  const total = countRow.n;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (sort === 'low') sql += ' ORDER BY t.price ASC';
  else if (sort === 'high') sql += ' ORDER BY t.price DESC';
  else sql += ' ORDER BY t.id';

  sql += ' LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  const rows = db.prepare(sql).all(...args);
  return {
    items: rows.map(rowToProduct),
    total,
    page,
    limit,
    totalPages,
  };
}

function getCategoryTree() {
  const rows = db.prepare(`
    SELECT c.group_name AS major, c.mid_category AS mid, c.name AS minor,
           COUNT(DISTINCT pc.product_id) AS count
    FROM categories c
    JOIN product_categories pc ON pc.category_id = c.id
    GROUP BY c.group_name, c.mid_category, c.name
  `).all();

  const majors = new Map();
  for (const r of rows) {
    if (!majors.has(r.major)) majors.set(r.major, { major: r.major, count: 0, mids: new Map() });
    const majorNode = majors.get(r.major);
    majorNode.count += r.count;

    if (!majorNode.mids.has(r.mid)) majorNode.mids.set(r.mid, { mid: r.mid, count: 0, minors: [] });
    const midNode = majorNode.mids.get(r.mid);
    midNode.count += r.count;
    midNode.minors.push({ name: r.minor, count: r.count });
  }

  return [...majors.values()]
    .sort((a, b) => b.count - a.count)
    .map(m => ({
      major: m.major,
      count: m.count,
      mids: [...m.mids.values()]
        .sort((a, b) => b.count - a.count)
        .map(mi => ({
          mid: mi.mid,
          count: mi.count,
          minors: mi.minors.sort((a, b) => b.count - a.count),
        })),
    }));
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/products') {
      return send(res, 200, getProducts(url.searchParams));
    }
    if (req.method === 'GET' && url.pathname === '/api/categories/tree') {
      return send(res, 200, getCategoryTree());
    }
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message });
  }

  send(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`나눔이음바자 API 서버 실행 중: http://localhost:${PORT}/api/products`);
});
