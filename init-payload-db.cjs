const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Neon PostgreSQL!');

  const sql = `
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

    CREATE TABLE IF NOT EXISTS "payload_preferences" (
      "id" serial PRIMARY KEY,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload_migrations" (
      "id" serial PRIMARY KEY,
      "name" varchar,
      "batch" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "posts" (
      "id" serial PRIMARY KEY,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "category" varchar,
      "published_at" timestamp(3) with time zone DEFAULT now(),
      "summary" varchar,
      "cover_image" varchar,
      "status" varchar DEFAULT 'published',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");

    CREATE TABLE IF NOT EXISTS "products" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL,
      "price" numeric NOT NULL,
      "category" varchar NOT NULL,
      "image" varchar,
      "weight" varchar,
      "in_stock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `;

  await client.query(sql);
  console.log('Successfully created Payload tables in Neon database!');
  await client.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
