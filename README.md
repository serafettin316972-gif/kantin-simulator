# Okul Kantini Simülatörü (Multiplayer)

Max 4 kişilik online kantin yönetim simülatörü.  
Oda kodu ile giriş, gerçek zamanlı ortak yönetim.

## Özellikler
- Oda kodu ile 1-4 kişi
- Malzeme al, yemek hazırla, müşteriye servis et
- Yükseltmeler (hızlı fırın, reklam, vs.)
- Gün / saat sistemi, itibar, para
- Güzel modern arayüz (koyu tema)
- Hiçbir indirme gerekmez, sadece tarayıcı

## Render'a Yükleme

1. Bu klasörü zip'le (kantin-sim klasörünün içini)
2. [Render Dashboard](https://dashboard.render.com) → New → Web Service
3. GitHub'a yükle veya "Deploy from existing" / drag-drop varsa kullan
4. Ayarlar:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Deploy et, linki al.
6. Arkadaşlarınla linke gir, oda oluştur / kodla katıl.

## Yerel Test
```bash
npm install
npm start
```
Tarayıcıda `http://localhost:3000`

## Nasıl Oynanır?
1. İsim yaz → **Oda Oluştur** (kod çıkar) veya kod girip **Katıl**
2. Host **Oyunu Başlat** der
3. Sol: Envanter + Malzeme satın al
4. Orta: Müşteriler + Tezgah (hazırlanan / hazır ürünler)
5. Sağ: Yemek hazırla + Yükseltme al
6. Müşteri siparişine tıklayarak servis et (önce o ürünü hazırlamış olman lazım)
7. 7 gün sonra oyun biter, sıralama çıkar

Keyifli oyunlar!
