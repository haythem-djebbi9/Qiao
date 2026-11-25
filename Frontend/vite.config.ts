import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import postcss from 'postcss';
import postcssRTLCSS from 'postcss-rtlcss';
import {Mode} from 'postcss-rtlcss/options';
import {defineConfig, type Plugin} from 'vite';

/**
 * Arabe : ajoute au CSS final, sous [dir="rtl"], la version miroir des marges, positions et alignements.
 * Fait sur le CSS compilé, où Tailwind n'a plus de règles imbriquées. Les éléments centrés par left-1/2 + translate restent tels quels.
 */
const rtlCss = (): Plugin => ({
  name: 'qiao-rtl-css',
  apply: 'build',
  enforce: 'post',
  async generateBundle(_, bundle) {
    const keepCentered: postcss.Plugin = {
      postcssPlugin: 'qiao-keep-centered',
      Once(root) {
        root.walkRules(/(left|right|inset-x)-1\\\/2/, (rule) => {
          rule.before(postcss.comment({text: 'rtl:ignore'}));
        });
      },
    };
    for (const file of Object.values(bundle)) {
      if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue;
      const result = await postcss([keepCentered, postcssRTLCSS({mode: Mode.override})]).process(String(file.source), {from: undefined});
      file.source = result.css;
    }
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), rtlCss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // API NestJS (Backend/) : les appels /api/* sont relayés vers le serveur local.
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
