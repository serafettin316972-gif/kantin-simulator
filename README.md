# Kantin Tycoon
Tarayıcıdan oynanan 3D, 1-4 kişilik co-op kantin simülatörü.
## Render'a yayınlama
1. Klasörü GitHub'a yükle. 2. Render > New > Web Service > repo'yu seç.
3. Build Command: `npm install`  Start Command: `npm start`
4. Açılan adreste "Oda Kur" de, 4 harfli kodu arkadaşlarına ver.
Yerelde: `npm install && npm start` -> http://localhost:3000
## Kontroller
WASD hareket, Shift koş, fare bakış, E / sol tık etkileşim, sağ tık alternatif (patates doğrama, yağ değiştirme), Tab stok, ESC menü.
## Temizlik
Müşteriler yemek sonrası masayı ve yeri kirletir. Kirli masaya ve yerdeki lekelere bakıp E ile temizle. Kir arttıkça memnuniyet ve itibar düşer, denetimde ceza alırsın.
## Oynanış
Kasa'ya (E) gelen müşterinin siparişini al -> hazırla -> Teslim Tezgâhı'nda (E) ürünü ver.
Tost: ekmek+kaşar (+sucuk) tahtaya koy, E ile al, tost makinesine koy, doğru anda çıkar.
Burger: köfteyi ızgarada pişir, tahtada bun+köfte(+peynir/marul/domates) birleştir, E ile al.
Patates: patatesi tahtaya koy, sağ tık x3 doğra, E ile al, fritöze koy, çıkar.
Sandviç: ekmek + marul/domates (+peynir) tahtada birleştir, pişirmeden servis et.
Gözleme: hamuru tahtaya koy, sağ tık x3 aç, peynir ekle, E ile al, sac'a koy, çıkar.
Çay: makineye E, 9 sn demlenince E. Kola/Ayran: dolaptan al.
