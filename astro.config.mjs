// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  // 한글 도메인 "민건축.com" 의 Punycode 형태.
  // src/lib/seo.ts 의 SITE_URL, public/robots.txt 와 반드시 같은 값을 유지할 것.
  site: 'https://xn--z69an80agjn.com',
  trailingSlash: 'never',

  // output 은 기본값 'static' 을 그대로 둔다.
  // 어댑터만 붙이면 "전부 정적, 필요한 라우트만 서버"가 된다.
  // output: 'server' 로 바꾸면 기본값이 뒤집혀 모든 공개 페이지가 SSR 이 되고
  // 지금까지 쌓은 SEO 작업이 통째로 위험해진다. 절대 바꾸지 말 것.
  adapter: vercel(),

  // 런타임 비밀은 astro:env 로 읽는다.
  // import.meta.env 를 쓰면 Astro 가 빌드 시점에 값을 번들에 인라인해버려
  // 배포 산출물에 비밀이 박히고, 키를 바꾸려면 재빌드해야 한다.
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret' }),
      ADMIN_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret' }),
      ADMIN_SESSION_SECRET: envField.string({ context: 'server', access: 'secret' }),
      VERCEL_DEPLOY_HOOK_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      })
    }
  },

  integrations: [
    react(),
    sitemap({
      // 사이트맵 URL은 canonical 과 정확히 일치해야 한다.
      // 끝 슬래시가 붙으면 네이버가 별개 주소로 보고 색인이 갈린다.
      changefreq: 'weekly',
      lastmod: new Date(),
      // 관리자 영역은 prerender=false 라 애초에 사이트맵에 오르지 않지만,
      // 실수로 정적화되는 경우를 대비해 명시적으로도 막는다.
      filter: (page) =>
        !page.includes('?') &&
        !page.includes('/admin') &&
        !page.includes('/api/'),
      serialize(item) {
        const parsed = new URL(item.url);
        // 하위 경로의 끝 슬래시를 떼어 canonical 과 정확히 일치시킨다.
        // (루트는 슬래시 유무가 동일 주소로 정규화되므로 그대로 둔다)
        const path = parsed.pathname.replace(/\/+$/, '') || '/';
        const url = `${parsed.origin}${path === '/' ? '/' : path}`;

        // 홈 > 시공사례 목록 > 시공사례 상세 > 문의 순으로 중요도를 매긴다.
        let priority = 0.6;
        if (path === '/') {
          priority = 1.0;
        } else if (path === '/projects') {
          priority = 0.9;
        } else if (path.startsWith('/projects/')) {
          priority = 0.8;
        } else if (path === '/contact') {
          priority = 0.7;
        }
        return { ...item, url, priority };
      }
    })
  ]
});
