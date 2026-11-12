# KANTİN TYCOON 3D

Birinci şahıs okul kantini işletme prototipi.

## Çalıştırma
1. Node.js 18+ kurulu olmalı.
2. Klasörde terminal açıp `npm install` çalıştır.
3. `npm start` komutunu çalıştır.
4. Tarayıcıda `http://localhost:3000` aç.

Three.js modülü CDN üzerinden yüklenir; ilk açılışta internet bağlantısı gerekir.

## Kontroller
- WASD: hareket
- Fare: bakış
- Shift: koş
- E: etkileşim
- ESC: duraklat

## İçerik
- Birinci şahıs 3D kantin sahnesi
- Kasa etkileşimi, ürün okutma ve ödeme
- Stok siparişi ve hazırlık tezgâhı
- Farklı görünüşlü müşteri NPC'leri; kasada sipariş verme ve masaya oturma
- Tost, döner, çiğ köfte dürüm, sandviç, çikolata, su, süt, ayran, meyve suyu ve poğaça siparişleri
- Hazırlanan siparişi müşteriye teslim etme
- Ciro, kasa, memnuniyet ve günlük hedef HUD'u

Bu sürüm oynanabilir bir başlangıç prototipidir; profesyonel 3D model ve animasyon paketleriyle daha ileri görsel kaliteye taşınabilir.


## Güncelleme notu
- Menü açıldığında fare serbest kalır; paneldeki butonlara tıklayabilirsin. Kapatınca oyun kontrolüne dönersin.
- Karakter kamera yüksekliği artırıldı; görsel kalite ve gölge ayarları performans için dengelendi.
- Müşteri sipariş akışı eklendi: müşteri kasaya gelir, siparişini söyler, masaya oturur; ürünü hazırlayıp müşteriye E ile yaklaşarak teslim edersin.
