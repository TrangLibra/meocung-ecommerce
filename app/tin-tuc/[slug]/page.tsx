import PostDetailPage, { generateMetadata } from '@/app/posts/[slug]/page';

export const dynamic = 'force-dynamic';
export { generateMetadata };
export default PostDetailPage;
