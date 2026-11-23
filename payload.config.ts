import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'products',
      labels: {
        singular: 'Sản phẩm Mèo',
        plural: 'Danh sách Sản phẩm Mèo',
      },
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Tên sản phẩm',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Giá bán (VNĐ)',
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          label: 'Danh mục',
          options: [
            { label: 'Thức ăn hạt', value: 'thuc-an-hat' },
            { label: 'Pate cho mèo', value: 'pate-cho-meo' },
            { label: 'Cát vệ sinh', value: 'cat-ve-sinh' },
            { label: 'Phụ kiện & Đồ chơi', value: 'phu-kien' },
          ],
          required: true,
        },
        {
          name: 'image',
          type: 'text',
          label: 'URL Hình ảnh',
        },
        {
          name: 'weight',
          type: 'text',
          label: 'Quy cách / Trọng lượng',
        },
        {
          name: 'inStock',
          type: 'checkbox',
          label: 'Còn hàng',
          defaultValue: true,
        },
      ],
    },
    {
      slug: 'posts',
      labels: {
        singular: 'Bài viết Cẩm nang',
        plural: 'Cẩm nang Chăm sóc Mèo',
      },
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Tiêu đề bài viết',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          label: 'Đường dẫn (Slug)',
          required: true,
        },
        {
          name: 'category',
          type: 'text',
          label: 'Chuyên mục',
        },
        {
          name: 'summary',
          type: 'textarea',
          label: 'Tóm tắt bài viết',
        },
      ],
    },
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'meocung_payload_secret_key_2026_super_secure',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    },
  }),
});
