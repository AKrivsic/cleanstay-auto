import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/', // 🔧 Přidáš tuto řádku
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        airbnb: resolve(__dirname, 'airbnb.html'),
        cenik: resolve(__dirname, 'cenik.html'),
        uklidDomacnosti: resolve(__dirname, 'uklid-domacnosti.html'),
        uklidFirem: resolve(__dirname, 'uklid-firem.html')
      }
    }
  }
});


// export default defineConfig({
//   base: '/cleanstay/', // nahraď "NAZEV_REPOZITARE" názvem tvého repozitáře
// });