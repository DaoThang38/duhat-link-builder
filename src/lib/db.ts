import { Pool } from 'pg';
import { User, LinkRecord, CatalogItem } from '@/types';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  // Auto-initialize PostgreSQL tables and initial seeds on first load
  initDbSchema().catch((err) => console.error('Postgres Schema Auto-Init Warning:', err));
}

// Serverless environments (Netlify, Vercel, AWS Lambda) have read-only /var/task filesystem.
// We fall back to writable /tmp directory when running in serverless production without PostgreSQL.
const isServerless = process.env.NETLIFY === 'true' || process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined || process.env.NODE_ENV === 'production';
const LOCAL_DB_FILE = isServerless ? path.join('/tmp', 'local-db.json') : path.join(process.cwd(), 'local-db.json');
const ROOT_SEED_FILE = path.join(process.cwd(), 'local-db.json');

export type FieldMode = 'STRICT' | 'FREE';

interface LocalDBData {
  users: User[];
  passwords: Record<string, string>;
  catalogs: CatalogItem[];
  fieldConfigs: Record<string, FieldMode>;
  links: LinkRecord[];
}

declare global {
  var __DUHAT_LOCAL_DB__: LocalDBData | undefined;
}

const DEFAULT_FIELD_CONFIGS: Record<string, FieldMode> = {
  source: 'FREE',
  medium: 'FREE',
  deep_link_screen: 'STRICT',
  campaign: 'FREE',
  content: 'FREE',
  ad_set: 'FREE',
  campaign_id: 'FREE',
  keyword: 'FREE',
};

const INITIAL_CATALOG_SEEDS: CatalogItem[] = [
  // 1. NGUỒN (SOURCE)
  { id: 'c1', linkType: 'BOTH', categoryType: 'source', value: 'google', description: 'Google Search/Display dẫn về website', isStrict: false, usageCount: 10, lastUsedAt: new Date().toISOString() },
  { id: 'c2', linkType: 'BOTH', categoryType: 'source', value: 'facebook', description: 'Bài đăng hoặc quảng cáo dẫn về website', isStrict: false, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c3', linkType: 'BOTH', categoryType: 'source', value: 'meta', description: 'Tên nội bộ khi cần phân biệt Meta', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c4', linkType: 'BOTH', categoryType: 'source', value: 'tiktok', description: 'TikTok dẫn về website hoặc owned post', isStrict: false, usageCount: 7, lastUsedAt: new Date().toISOString() },
  { id: 'c5', linkType: 'BOTH', categoryType: 'source', value: 'zalo', description: 'Zalo OA, bài đăng hoặc tin nhắn', isStrict: false, usageCount: 6, lastUsedAt: new Date().toISOString() },
  { id: 'c6', linkType: 'BOTH', categoryType: 'source', value: 'email', description: 'Email thông thường', isStrict: false, usageCount: 5, lastUsedAt: new Date().toISOString() },
  { id: 'c7', linkType: 'BOTH', categoryType: 'source', value: 'owned_email', description: 'Nguồn email tự sở hữu dùng cho OneLink', isStrict: false, usageCount: 4, lastUsedAt: new Date().toISOString() },
  { id: 'c8', linkType: 'BOTH', categoryType: 'source', value: 'sms', description: 'Tin nhắn SMS', isStrict: false, usageCount: 3, lastUsedAt: new Date().toISOString() },
  { id: 'c9', linkType: 'BOTH', categoryType: 'source', value: 'qr', description: 'Mã QR trên tài liệu/sự kiện', isStrict: false, usageCount: 3, lastUsedAt: new Date().toISOString() },
  { id: 'c10', linkType: 'BOTH', categoryType: 'source', value: 'website', description: 'CTA hoặc banner trên website', isStrict: false, usageCount: 2, lastUsedAt: new Date().toISOString() },
  { id: 'c11', linkType: 'BOTH', categoryType: 'source', value: 'partner', description: 'Đối tác', isStrict: false, usageCount: 2, lastUsedAt: new Date().toISOString() },
  { id: 'c12', linkType: 'BOTH', categoryType: 'source', value: 'influencer', description: 'KOL/KOC/creator', isStrict: false, usageCount: 1, lastUsedAt: new Date().toISOString() },

  // 2. KÊNH (MEDIUM)
  { id: 'c13', linkType: 'BOTH', categoryType: 'medium', value: 'organic_social', description: 'Bài đăng mạng xã hội không trả phí', isStrict: false, usageCount: 10, lastUsedAt: new Date().toISOString() },
  { id: 'c14', linkType: 'BOTH', categoryType: 'medium', value: 'paid_social', description: 'Quảng cáo mạng xã hội', isStrict: false, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c15', linkType: 'BOTH', categoryType: 'medium', value: 'cpc', description: 'Quảng cáo trả phí theo click', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c16', linkType: 'BOTH', categoryType: 'medium', value: 'email', description: 'Email', isStrict: false, usageCount: 7, lastUsedAt: new Date().toISOString() },
  { id: 'c17', linkType: 'BOTH', categoryType: 'medium', value: 'sms', description: 'SMS', isStrict: false, usageCount: 6, lastUsedAt: new Date().toISOString() },
  { id: 'c18', linkType: 'BOTH', categoryType: 'medium', value: 'qr', description: 'QR code', isStrict: false, usageCount: 5, lastUsedAt: new Date().toISOString() },
  { id: 'c19', linkType: 'BOTH', categoryType: 'medium', value: 'referral', description: 'Đối tác/giới thiệu', isStrict: false, usageCount: 4, lastUsedAt: new Date().toISOString() },
  { id: 'c20', linkType: 'BOTH', categoryType: 'medium', value: 'web_banner', description: 'Banner/CTA trên website', isStrict: false, usageCount: 3, lastUsedAt: new Date().toISOString() },
  { id: 'c21', linkType: 'BOTH', categoryType: 'medium', value: 'push', description: 'Push notification', isStrict: false, usageCount: 2, lastUsedAt: new Date().toISOString() },
  { id: 'c22', linkType: 'BOTH', categoryType: 'medium', value: 'offline', description: 'Ấn phẩm hoặc sự kiện offline', isStrict: false, usageCount: 1, lastUsedAt: new Date().toISOString() },

  // 3. MÀN HÌNH APP (DEEP_LINK_SCREEN)
  { id: 'c23', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'home', description: 'Trang chủ', isStrict: true, usageCount: 10, lastUsedAt: new Date().toISOString() },
  { id: 'c24', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'create_poll', description: 'Màn hình tạo poll', isStrict: true, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c25', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'poll_detail', description: 'Chi tiết poll; có thể cần deep_link_sub', isStrict: true, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c26', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'profile', description: 'Hồ sơ người dùng', isStrict: true, usageCount: 7, lastUsedAt: new Date().toISOString() },
  { id: 'c27', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'notification', description: 'Trung tâm thông báo', isStrict: true, usageCount: 6, lastUsedAt: new Date().toISOString() },
  { id: 'c28', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'subscription', description: 'Màn hình gói dịch vụ', isStrict: true, usageCount: 5, lastUsedAt: new Date().toISOString() },
  { id: 'c29', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'login', description: 'Đăng nhập', isStrict: true, usageCount: 4, lastUsedAt: new Date().toISOString() },
  { id: 'c30', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'register', description: 'Đăng ký', isStrict: true, usageCount: 3, lastUsedAt: new Date().toISOString() },
  { id: 'c31', linkType: 'ONELINK', categoryType: 'deep_link_screen', value: 'other', description: 'Chỉ dùng sau khi Product/Kỹ thuật xác nhận', isStrict: true, usageCount: 1, lastUsedAt: new Date().toISOString() },

  // 4. TÊN CHIẾN DỊCH (CAMPAIGN)
  { id: 'c32', linkType: 'BOTH', categoryType: 'campaign', value: 'poll_activation_202608', description: 'Kích hoạt trải nghiệm tính năng poll', isStrict: false, usageCount: 10, lastUsedAt: new Date().toISOString() },
  { id: 'c33', linkType: 'BOTH', categoryType: 'campaign', value: 'tet_sale_2026', description: 'Chiến dịch ưu đãi dịp Tết 2026', isStrict: false, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c34', linkType: 'BOTH', categoryType: 'campaign', value: 'summer_growth_2026', description: 'Tăng trưởng mùa hè 2026', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c35', linkType: 'BOTH', categoryType: 'campaign', value: 'app_launch_v2', description: 'Ra mắt phiên bản ứng dụng 2.0', isStrict: false, usageCount: 7, lastUsedAt: new Date().toISOString() },

  // 5. LOẠI NỘI DUNG / MẪU QC (CONTENT / AD_NAME)
  { id: 'c36', linkType: 'BOTH', categoryType: 'content', value: 'banner_hero', description: 'Banner ảnh chính đầu trang', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c37', linkType: 'BOTH', categoryType: 'content', value: 'video_review_15s', description: 'Video review ngắn 15s', isStrict: false, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c38', linkType: 'BOTH', categoryType: 'content', value: 'carousel_image', description: 'Mẫu quảng cáo xoay vòng', isStrict: false, usageCount: 7, lastUsedAt: new Date().toISOString() },

  // 6. NHÓM QUẢNG CÁO (AD_SET)
  { id: 'c39', linkType: 'BOTH', categoryType: 'ad_set', value: 'target_genz_18_24', description: 'Đối tượng GenZ 18-24 tuổi', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
  { id: 'c40', linkType: 'BOTH', categoryType: 'ad_set', value: 'target_office_25_34', description: 'Đối tượng dân văn phòng 25-34 tuổi', isStrict: false, usageCount: 9, lastUsedAt: new Date().toISOString() },
  { id: 'c41', linkType: 'BOTH', categoryType: 'ad_set', value: 'retargeting_30d', description: 'Tiếp thị lại người dùng trong 30 ngày', isStrict: false, usageCount: 10, lastUsedAt: new Date().toISOString() },

  // 7. ID CHIẾN DỊCH (CAMPAIGN_ID)
  { id: 'c42', linkType: 'BOTH', categoryType: 'campaign_id', value: 'cmp_poll2026_01', description: 'ID định danh chiến dịch Poll 2026', isStrict: false, usageCount: 7, lastUsedAt: new Date().toISOString() },

  // 8. TỪ KHÓA (KEYWORD)
  { id: 'c43', linkType: 'BOTH', categoryType: 'keyword', value: 'khao_sat_truc_tuyen', description: 'Từ khóa tìm kiếm khảo sát trực tuyến', isStrict: false, usageCount: 8, lastUsedAt: new Date().toISOString() },
];

let hasPostgresSeeded = false;

async function ensurePostgresSeeds() {
  if (!pool || hasPostgresSeeded) return;
  try {
    for (const item of INITIAL_CATALOG_SEEDS) {
      const id = item.id || crypto.randomUUID();
      await pool.query(
        `INSERT INTO catalogs (id, link_type, category_type, value, description, is_strict, usage_count)
         VALUES ($1, 'BOTH', $2, $3, $4, $5, $6)
         ON CONFLICT (link_type, category_type, value) DO NOTHING`,
        [id, item.categoryType, item.value, item.description || null, item.isStrict || false, item.usageCount || 1]
      );
    }
    hasPostgresSeeded = true;
  } catch (e) {
    console.error('Postgres auto seed error:', e);
  }
}

function deduplicateCatalogItems(items: CatalogItem[]): CatalogItem[] {
  const map = new Map<string, CatalogItem>();
  items.forEach((item) => {
    const normCat = normalizeCategoryType(item.categoryType);
    const key = `${normCat}:${item.value.toLowerCase().trim()}`;
    if (!map.has(key)) {
      map.set(key, { ...item, linkType: 'BOTH' });
    } else {
      const existing = map.get(key)!;
      existing.usageCount = Math.max(existing.usageCount, item.usageCount);
      if (item.description && !existing.description) {
        existing.description = item.description;
      }
    }
  });
  return Array.from(map.values());
}

function getLocalDB(): LocalDBData {
  if (globalThis.__DUHAT_LOCAL_DB__) {
    return globalThis.__DUHAT_LOCAL_DB__;
  }

  let db: LocalDBData;
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    let initial: LocalDBData = {
      users: [],
      passwords: {},
      catalogs: INITIAL_CATALOG_SEEDS,
      fieldConfigs: DEFAULT_FIELD_CONFIGS,
      links: [],
    };

    if (fs.existsSync(ROOT_SEED_FILE) && ROOT_SEED_FILE !== LOCAL_DB_FILE) {
      try {
        const raw = fs.readFileSync(ROOT_SEED_FILE, 'utf8');
        initial = JSON.parse(raw);
      } catch {}
    }

    try {
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2));
    } catch (e) {
      console.warn('Could not write local db file:', e);
    }
    db = initial;
  } else {
    try {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      db = JSON.parse(raw);
    } catch {
      db = { users: [], passwords: {}, catalogs: INITIAL_CATALOG_SEEDS, fieldConfigs: DEFAULT_FIELD_CONFIGS, links: [] };
    }
  }

  if (db.catalogs) {
    db.catalogs = deduplicateCatalogItems(db.catalogs);
  }

  globalThis.__DUHAT_LOCAL_DB__ = db;
  return db;
}

function saveLocalDB(data: LocalDBData) {
  if (data.catalogs) {
    data.catalogs = deduplicateCatalogItems(data.catalogs);
  }
  globalThis.__DUHAT_LOCAL_DB__ = data;
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write to local DB file:', e);
  }
}

// Map alias categories (e.g. utm_source -> source, media_source -> source)
export function normalizeCategoryType(categoryType: string): string {
  const norm = categoryType.toLowerCase();
  if (['utm_source', 'media_source', 'pid', 'source'].includes(norm)) return 'source';
  if (['utm_medium', 'channel', 'af_channel', 'medium'].includes(norm)) return 'medium';
  if (['utm_campaign', 'campaign_name', 'c', 'campaign'].includes(norm)) return 'campaign';
  if (['utm_content', 'ad_name', 'af_ad', 'content'].includes(norm)) return 'content';
  if (['ad_group', 'ad_set', 'af_adset'].includes(norm)) return 'ad_set';
  if (['utm_id', 'campaign_id', 'af_c_id'].includes(norm)) return 'campaign_id';
  if (['utm_term', 'keywords', 'af_keywords', 'keyword'].includes(norm)) return 'keyword';
  if (['deep_link_value', 'deep_link_screen'].includes(norm)) return 'deep_link_screen';
  return norm;
}

// FIELD CONFIG MANAGEMENT
export async function getFieldConfigs(): Promise<Record<string, FieldMode>> {
  if (pool) {
    try {
      const res = await pool.query('SELECT category_type, mode FROM field_configs');
      const configs: Record<string, FieldMode> = { ...DEFAULT_FIELD_CONFIGS };
      res.rows.forEach((row) => {
        configs[row.category_type] = row.mode;
      });
      return configs;
    } catch {
      return DEFAULT_FIELD_CONFIGS;
    }
  } else {
    const db = getLocalDB();
    return { ...DEFAULT_FIELD_CONFIGS, ...db.fieldConfigs };
  }
}

export async function setFieldMode(categoryType: string, mode: FieldMode): Promise<Record<string, FieldMode>> {
  const normCategory = normalizeCategoryType(categoryType);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO field_configs (category_type, mode)
         VALUES ($1, $2)
         ON CONFLICT (category_type) DO UPDATE SET mode = $2`,
        [normCategory, mode]
      );
    } catch (e) {
      console.error('Postgres setFieldMode error:', e);
    }
  } else {
    const db = getLocalDB();
    if (!db.fieldConfigs) db.fieldConfigs = { ...DEFAULT_FIELD_CONFIGS };
    db.fieldConfigs[normCategory] = mode;
    saveLocalDB(db);
  }
  return getFieldConfigs();
}

// Ensure database tables exist and auto-seed initial catalog items on PostgreSQL
export async function initDbSchema() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS field_configs (
        category_type VARCHAR(50) PRIMARY KEY,
        mode VARCHAR(20) NOT NULL DEFAULT 'FREE'
      );

      CREATE TABLE IF NOT EXISTS catalogs (
        id VARCHAR(255) PRIMARY KEY,
        link_type VARCHAR(20) DEFAULT 'BOTH',
        category_type VARCHAR(50) NOT NULL,
        value VARCHAR(255) NOT NULL,
        description TEXT,
        is_strict BOOLEAN DEFAULT FALSE,
        usage_count INT DEFAULT 1,
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by_user_id VARCHAR(255),
        CONSTRAINT unq_cat_link_type_val UNIQUE (link_type, category_type, value)
      );

      CREATE TABLE IF NOT EXISTS link_history (
        id VARCHAR(255) PRIMARY KEY,
        link_type VARCHAR(20) NOT NULL,
        original_url TEXT NOT NULL,
        final_link TEXT NOT NULL,
        link_hash VARCHAR(64) UNIQUE NOT NULL,
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(150),
        utm_id VARCHAR(100),
        utm_content VARCHAR(150),
        utm_term VARCHAR(150),
        media_source VARCHAR(100),
        af_channel VARCHAR(100),
        af_c_id VARCHAR(100),
        af_adset VARCHAR(150),
        af_ad VARCHAR(150),
        af_keywords VARCHAR(150),
        deep_link_value VARCHAR(255),
        is_retargeting BOOLEAN DEFAULT FALSE,
        created_by_user_id VARCHAR(255) NOT NULL,
        created_by_name VARCHAR(100) NOT NULL,
        created_by_email VARCHAR(255) NOT NULL,
        sync_status VARCHAR(20) DEFAULT 'PENDING',
        sync_attempts INT DEFAULT 0,
        last_sync_error TEXT,
        synced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Delete existing duplicate rows in PostgreSQL
    try {
      await client.query(`
        DELETE FROM catalogs a
        USING catalogs b
        WHERE a.ctid < b.ctid
          AND a.category_type = b.category_type
          AND LOWER(a.value) = LOWER(b.value);
      `);
    } catch {}

    await ensurePostgresSeeds();
  } catch (err) {
    console.error('Postgres Schema Init Warning:', err);
  } finally {
    client.release();
  }
}

// USER OPERATIONS
export async function getUserByEmail(email: string): Promise<{ user: User; passwordHash: string } | null> {
  const normEmail = email.toLowerCase().trim();
  if (pool) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [normEmail]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      user: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role as any,
        createdAt: row.created_at,
      },
      passwordHash: row.password_hash,
    };
  } else {
    const db = getLocalDB();
    const u = db.users.find((x) => x.email.toLowerCase() === normEmail);
    if (!u) return null;
    return { user: u, passwordHash: db.passwords[u.id] || '' };
  }
}

export async function createUser(email: string, passwordHash: string, fullName: string): Promise<User> {
  const normEmail = email.toLowerCase().trim();
  const userId = crypto.randomUUID();
  if (pool) {
    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countRes.rows[0].count, 10);
    const role = userCount === 0 ? 'ADMIN' : 'MEMBER';

    const insertRes = await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, created_at`,
      [userId, normEmail, passwordHash, fullName.trim(), role]
    );
    const row = insertRes.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
    };
  } else {
    const db = getLocalDB();
    const role = db.users.length === 0 ? 'ADMIN' : 'MEMBER';
    const newUser: User = {
      id: userId,
      email: normEmail,
      fullName: fullName.trim(),
      role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    db.passwords[newUser.id] = passwordHash;
    saveLocalDB(db);
    return newUser;
  }
}

export async function updateUserName(userId: string, newFullName: string): Promise<User | null> {
  const trimmedName = newFullName.trim();
  if (!trimmedName) return null;

  if (pool) {
    const res = await pool.query(
      `UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, role, created_at`,
      [trimmedName, userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role as any,
      createdAt: row.created_at,
    };
  } else {
    const db = getLocalDB();
    const u = db.users.find((x) => x.id === userId);
    if (!u) return null;
    u.fullName = trimmedName;
    saveLocalDB(db);
    return u;
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (pool) {
    const res = await pool.query(`SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at ASC`);
    return res.rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role as any,
      createdAt: row.created_at,
    }));
  } else {
    const db = getLocalDB();
    return db.users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }
}

// LINK OPERATIONS
export async function getLinkByHash(linkHash: string): Promise<LinkRecord | null> {
  if (pool) {
    const res = await pool.query('SELECT * FROM link_history WHERE link_hash = $1', [linkHash]);
    if (res.rows.length === 0) return null;
    return mapPgLinkRow(res.rows[0]);
  } else {
    const db = getLocalDB();
    return db.links.find((l) => l.linkHash === linkHash) || null;
  }
}

export async function createLinkRecord(record: Omit<LinkRecord, 'id' | 'createdAt'>): Promise<LinkRecord> {
  const linkId = crypto.randomUUID();
  if (pool) {
    const existing = await getLinkByHash(record.linkHash);
    if (existing) {
      const err: any = new Error('LINK_DUPLICATE');
      err.existingRecord = existing;
      throw err;
    }

    const res = await pool.query(
      `INSERT INTO link_history (
        id, link_type, original_url, final_link, link_hash,
        utm_source, utm_medium, utm_campaign, utm_id, utm_content, utm_term,
        media_source, af_channel, af_c_id, af_adset, af_ad, af_keywords, deep_link_value, is_retargeting,
        created_by_user_id, created_by_name, created_by_email, sync_status, sync_attempts, last_sync_error
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25
      ) RETURNING *`,
      [
        linkId,
        record.linkType,
        record.originalUrl,
        record.finalLink,
        record.linkHash,
        record.utmSource || null,
        record.utmMedium || null,
        record.utmCampaign || null,
        record.utmId || null,
        record.utmContent || null,
        record.utmTerm || null,
        record.mediaSource || null,
        record.afChannel || null,
        record.afCId || null,
        record.afAdset || null,
        record.afAd || null,
        record.afKeywords || null,
        record.deepLinkValue || null,
        record.isRetargeting || false,
        record.createdByUserId,
        record.createdByName,
        record.createdByEmail,
        record.syncStatus,
        record.syncAttempts,
        record.lastSyncError || null,
      ]
    );
    return mapPgLinkRow(res.rows[0]);
  } else {
    const db = getLocalDB();
    const existing = db.links.find((l) => l.linkHash === record.linkHash);
    if (existing) {
      const err: any = new Error('LINK_DUPLICATE');
      err.existingRecord = existing;
      throw err;
    }

    const newRecord: LinkRecord = {
      ...record,
      id: linkId,
      createdAt: new Date().toISOString(),
    };
    db.links.unshift(newRecord);
    saveLocalDB(db);
    return newRecord;
  }
}

export async function getAllLinks(): Promise<LinkRecord[]> {
  if (pool) {
    const res = await pool.query('SELECT * FROM link_history ORDER BY created_at DESC');
    return res.rows.map(mapPgLinkRow);
  } else {
    const db = getLocalDB();
    return [...db.links].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function updateLinkSyncStatus(id: string, status: 'SUCCESS' | 'FAILED', error?: string): Promise<void> {
  if (pool) {
    await pool.query(
      `UPDATE link_history
       SET sync_status = $1,
           sync_attempts = sync_attempts + 1,
           last_sync_error = $2,
           synced_at = CASE WHEN $1 = 'SUCCESS' THEN CURRENT_TIMESTAMP ELSE synced_at END
       WHERE id = $3`,
      [status, error || null, id]
    );
  } else {
    const db = getLocalDB();
    const item = db.links.find((l) => l.id === id);
    if (item) {
      item.syncStatus = status;
      item.syncAttempts += 1;
      if (error) item.lastSyncError = error;
      if (status === 'SUCCESS') item.syncedAt = new Date().toISOString();
      saveLocalDB(db);
    }
  }
}

// CATALOG OPERATIONS & CRUD
export async function getCatalogItemsByCategory(rawCategoryType: string, linkType?: string): Promise<CatalogItem[]> {
  const normCategory = normalizeCategoryType(rawCategoryType);
  if (pool) {
    await ensurePostgresSeeds();
    const res = await pool.query(
      `SELECT * FROM catalogs WHERE category_type = $1 ORDER BY usage_count DESC, last_used_at DESC`,
      [normCategory]
    );
    return deduplicateCatalogItems(res.rows.map(mapPgCatalogRow));
  } else {
    const db = getLocalDB();
    const filtered = db.catalogs.filter((c) => normalizeCategoryType(c.categoryType) === normCategory);
    return deduplicateCatalogItems(filtered).sort(
      (a, b) => b.usageCount - a.usageCount || new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  }
}

export async function touchCatalogItem(rawCategoryType: string, value: string, linkType: 'UTM' | 'ONELINK', userId?: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) return;
  const normCategory = normalizeCategoryType(rawCategoryType);
  const catId = crypto.randomUUID();

  if (pool) {
    const updateRes = await pool.query(
      `UPDATE catalogs
       SET usage_count = usage_count + 1,
           last_used_at = CURRENT_TIMESTAMP,
           link_type = 'BOTH'
       WHERE category_type = $1 AND LOWER(value) = LOWER($2)`,
      [normCategory, trimmed]
    );

    if ((updateRes.rowCount || 0) === 0) {
      await pool.query(
        `INSERT INTO catalogs (id, link_type, category_type, value, usage_count, last_used_at, created_by_user_id)
         VALUES ($1, 'BOTH', $2, $3, 1, CURRENT_TIMESTAMP, $4)
         ON CONFLICT DO NOTHING`,
        [catId, normCategory, trimmed, userId || null]
      );
    }
  } else {
    const db = getLocalDB();
    const existing = db.catalogs.find(
      (c) => normalizeCategoryType(c.categoryType) === normCategory && c.value.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      existing.usageCount += 1;
      existing.lastUsedAt = new Date().toISOString();
    } else {
      db.catalogs.push({
        id: catId,
        linkType: 'BOTH',
        categoryType: normCategory,
        value: trimmed,
        isStrict: false,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
        createdByUserId: userId,
      });
    }
    saveLocalDB(db);
  }
}

export async function getAllCatalogs(): Promise<CatalogItem[]> {
  if (pool) {
    await ensurePostgresSeeds();
    const res = await pool.query('SELECT * FROM catalogs ORDER BY link_type ASC, category_type ASC, usage_count DESC');
    return deduplicateCatalogItems(res.rows.map(mapPgCatalogRow));
  } else {
    const db = getLocalDB();
    return deduplicateCatalogItems(db.catalogs);
  }
}

export async function addCatalogItem(
  linkType: 'UTM' | 'ONELINK' | 'BOTH' = 'BOTH',
  categoryType: string,
  value: string,
  description?: string,
  isStrict = false,
  userId?: string
): Promise<{ item: CatalogItem; isExisting: boolean }> {
  const trimmedVal = value.trim();
  const normCategory = normalizeCategoryType(categoryType);
  const catId = crypto.randomUUID();

  if (pool) {
    const checkRes = await pool.query(
      `SELECT * FROM catalogs WHERE category_type = $1 AND LOWER(value) = LOWER($2)`,
      [normCategory, trimmedVal]
    );

    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      const updateRes = await pool.query(
        `UPDATE catalogs
         SET link_type = 'BOTH', description = COALESCE($1, description), is_strict = $2, last_used_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [description?.trim() || null, isStrict, existing.id]
      );
      return { item: mapPgCatalogRow(updateRes.rows[0]), isExisting: true };
    }

    const res = await pool.query(
      `INSERT INTO catalogs (id, link_type, category_type, value, description, is_strict, created_by_user_id)
       VALUES ($1, 'BOTH', $2, $3, $4, $5, $6)
       RETURNING *`,
      [catId, normCategory, trimmedVal, description?.trim() || null, isStrict, userId || null]
    );
    return { item: mapPgCatalogRow(res.rows[0]), isExisting: false };
  } else {
    const db = getLocalDB();
    const existing = db.catalogs.find(
      (c) => normalizeCategoryType(c.categoryType) === normCategory && c.value.toLowerCase() === trimmedVal.toLowerCase()
    );

    if (existing) {
      existing.linkType = 'BOTH';
      if (description?.trim()) existing.description = description.trim();
      existing.isStrict = isStrict;
      existing.lastUsedAt = new Date().toISOString();
      saveLocalDB(db);
      return { item: existing, isExisting: true };
    }

    const newItem: CatalogItem = {
      id: catId,
      linkType: 'BOTH',
      categoryType: normCategory,
      value: trimmedVal,
      description: description?.trim() || '',
      isStrict,
      usageCount: 1,
      lastUsedAt: new Date().toISOString(),
      createdByUserId: userId,
    };
    db.catalogs.push(newItem);
    saveLocalDB(db);
    return { item: newItem, isExisting: false };
  }
}

export async function updateCatalogItem(
  id: string,
  linkType: 'UTM' | 'ONELINK' | 'BOTH',
  value: string,
  description?: string,
  isStrict = false
): Promise<CatalogItem | null> {
  const trimmedVal = value.trim();
  const targetLinkType = linkType || 'BOTH';

  if (pool) {
    const res = await pool.query(
      `UPDATE catalogs
       SET link_type = $1, value = $2, description = $3, is_strict = $4
       WHERE id = $5
       RETURNING *`,
      [targetLinkType, trimmedVal, description?.trim() || null, isStrict, id]
    );
    if (res.rows.length === 0) return null;
    return mapPgCatalogRow(res.rows[0]);
  } else {
    const db = getLocalDB();
    const item = db.catalogs.find((c) => c.id === id);
    if (!item) return null;
    item.linkType = targetLinkType;
    item.value = trimmedVal;
    item.description = description?.trim() || '';
    item.isStrict = isStrict;
    saveLocalDB(db);
    return item;
  }
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  if (pool) {
    const res = await pool.query('DELETE FROM catalogs WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  } else {
    const db = getLocalDB();
    const idx = db.catalogs.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    db.catalogs.splice(idx, 1);
    saveLocalDB(db);
    return true;
  }
}

function mapPgLinkRow(row: any): LinkRecord {
  return {
    id: row.id,
    linkType: row.link_type,
    originalUrl: row.original_url,
    finalLink: row.final_link,
    linkHash: row.link_hash,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmId: row.utm_id,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
    mediaSource: row.media_source,
    afChannel: row.af_channel,
    afCId: row.af_c_id,
    afAdset: row.af_adset,
    afAd: row.af_ad,
    afKeywords: row.af_keywords,
    deepLinkValue: row.deep_link_value,
    isRetargeting: row.is_retargeting,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    syncStatus: row.sync_status,
    syncAttempts: row.sync_attempts,
    lastSyncError: row.last_sync_error,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
  };
}

function mapPgCatalogRow(row: any): CatalogItem {
  return {
    id: row.id,
    linkType: row.link_type || 'BOTH',
    categoryType: row.category_type,
    value: row.value,
    description: row.description || '',
    isStrict: row.is_strict,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at,
    createdByUserId: row.created_by_user_id,
  };
}
