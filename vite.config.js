import { defineConfig } from 'vite';
import glslify from 'rollup-plugin-glslify';
// import autoprefixer from "autoprefixer";

export default defineConfig({
  base: "/",
  root: "./src",
  build: {
    outDir: "../dist",
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.')[1];
          if (/ttf|otf|eot|woff|woff2/i.test(extType)) {
						extType = "fonts";
					}
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          if(extType === 'css') {
            return `assets/css/style.css`;
          }
          return `assets/${extType}/[name][extname]`;
        },
        chunkFileNames: 'assets/js/[name].js',
        entryFileNames: 'assets/js/script.js',
      },
      input:{
        main: './src/index.html',
      }
    },
	},
  plugins: [glslify()],
  // css: {
  //   postcss: {
  //     plugins: [autoprefixer]
  //   }
  // },
});