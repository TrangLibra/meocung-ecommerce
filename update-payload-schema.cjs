const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  const sql = `
    -- Bổ sung trường cho posts
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "_status" varchar DEFAULT 'published';
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content" jsonb;

    -- Bổ sung trường cho products
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "_status" varchar DEFAULT 'published';
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" varchar;

    -- Thêm bảng payload_locked_documents
    CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
      "id" serial PRIMARY KEY,
      "global_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
      "id" serial PRIMARY KEY,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer,
      "posts_id" integer,
      "products_id" integer
    );

    CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
      "id" serial PRIMARY KEY,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer
    );
  `;

  await client.query(sql);
  console.log('Schema updated successfully for Payload Dashboard!');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
