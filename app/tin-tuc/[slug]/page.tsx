'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  publishedAt?: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    fetch(`/api/posts?where[slug][equals]=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const found = Array.isArray(data?.docs) && data.docs.length > 0 ? data.docs[0] : null;
        setPost(found);
      })
      .catch(() => {
        if (active) setPost(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-sm text-gray-500 font-medium">
        Đang tải bài viết...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <p className="text-lg font-bold text-gray-800">Không tìm thấy bài viết này</p>
        <Link href="/tin-tuc" className="inline-block px-5 py-2.5 rounded-full bg-[#ff7f5c] text-white text-sm font-bold">
          ← Xem tất cả bài viết
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <Link href="/tin-tuc" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff7f5c] hover:underline">
        ← Quay lại Cẩm nang & Tin tức
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        {post.image && (
          <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-orange-50 text-[#ff7f5c] font-bold border border-orange-200">
              {post.category || 'Tin tức'}
            </span>
            {post.publishedAt && (
              <span className="text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed border-l-4 border-[#ff7f5c] pl-4 bg-orange-50/40 py-2 rounded-r-xl">
              {post.excerpt}
            </p>
          )}

          <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line pt-2">
            {post.content || post.excerpt}
          </div>
        </div>
      </div>
    </article>
  );
}
