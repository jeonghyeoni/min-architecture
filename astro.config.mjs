// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  // 한글 도메인 "민건축.com" 의 Punycode 형태.
  // src/lib/seo.ts 의 SITE_URL, public/robots.txt 와 반드시 같은 값을 유지할 것.
  site: 'https://xn--z69an80agjn.com',
  trailingSlash: 'never',
  integrations: [
    react(),
    sitemap({
      // 사이트맵 URL은 canonical 과 정확히 일치해야 한다.
      // 끝 슬래시가 붙으면 네이버가 별개 주소로 보고 색인이 갈린다.
      changefreq: 'weekly',
      lastmod: new Date(),
      filter: (page) => !page.includes('?'),
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
