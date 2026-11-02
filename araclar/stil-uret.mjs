// Eklentinin WhatsApp Web'e eklediği tek dosyayı, icerik.css'i üretir: npm run stil
// Kurallar aşağıdaki dil listesinden üretilir, böylece her seçenek her kurala aynı biçimde girer. Testler depodaki
// icerik.css'in bu listeden üretilenle birebir aynı olduğunu denetler.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Menü seçeneklerinin WhatsApp Web'deki adları, dillere göre. WhatsApp'ın arayüz metinleri değişirse ya da başka bir dil
// eklemek isterseniz yalnızca bu listeyi güncelleyin ve "npm run stil" çalıştırın.
//   - sil, temizle: Gizlenecek seçenekler ("Sohbeti sil" ve "Sohbeti temizle").
//   - mesajSec, kapat: Sohbet menüsünü tanıtan seçenekler ("Mesaj seç" ve "Sohbeti kapat"). İçinde bunlardan biri bulunan
//     menü, açık sohbetin menüsüdür. Soldaki sohbet listesinin menüsünde ve mesaj menüsünde bunlar yoktur, o menülerde
//     hiçbir şey gizlenmez.
// Her yazı, menü düğmesinin etiketiyle (aria-label) BİREBİR karşılaştırılır: Büyük/küçük harf ve boşluklar dâhil tam aynı
// olmalıdır, "içeriyor" araması yapılmaz. Bu yüzden mesajı silen "Sil" etkilenmez. Bir seçeneğin birden çok adı varsa
// (WhatsApp aynı seçeneği iki yerde ayrı çevirmiş ya da dilin bölgesel biçimleri ayrı çevrilmiş) hepsi yazılır.
// Türkçe ve İngilizce adlar gerçek WhatsApp Web'de ölçüldü (2026-10). Öbürleri WhatsApp Web'in o dildeki betiklerinden
// alındı (2026-11): Her dilin betiğinde, İngilizce betikte bu adların durduğu yerdeki yazı alındı ve yazının önündeki ve
// arkasındaki kodun İngilizce betiktekiyle aynı olduğu denetlendi. Satır sonundakiler WhatsApp'ın dil kodlarıdır.
// Yeni bir dilin adlarından biri o dilin sohbet listesi menüsündeki ya da mesaj menüsündeki başka bir seçeneğin adıyla
// aynıysa o ad tanıtan olarak yazılmaz, yoksa o menüde de gizlenirdi.
export const DILLER = [
  { dil: 'Türkçe', sil: ['Sohbeti sil'], temizle: ['Sohbeti temizle'], // tr_TR
    mesajSec: ['Mesaj seç'], kapat: ['Sohbeti kapat'] },
  { dil: 'İngilizce', sil: ['Delete chat'], temizle: ['Clear chat'], // en_GB
    mesajSec: ['Select messages'], kapat: ['Close chat'] },
  { dil: 'Fransızca', sil: ['Supprimer la discussion'], temizle: ['Effacer la discussion'], // fr_FR, fr_CA
    mesajSec: ['Sélectionner des messages'], kapat: ['Fermer la discussion'] },
  { dil: 'Almanca', sil: ['Chat löschen'], temizle: ['Chat leeren'], // de_DE
    mesajSec: ['Nachrichten auswählen'], kapat: ['Chat schließen'] },
  { dil: 'Rusça', sil: ['Удалить чат'], temizle: ['Очистить чат'], // ru_RU
    mesajSec: ['Выбрать сообщения'], kapat: ['Закрыть окно чата'] },
  { dil: 'Japonca', sil: ['チャットを削除'], temizle: ['チャットを消去'], // ja_JP
    mesajSec: ['メッセージを選択'], kapat: ['チャットを閉じる'] },
  { dil: 'İspanyolca', sil: ['Eliminar chat'], temizle: ['Vaciar chat'], // es_ES, es_LA
    mesajSec: ['Seleccionar mensajes'], kapat: ['Cerrar chat'] },
  { dil: 'Portekizce', sil: ['Apagar conversa', 'Eliminar conversa'], temizle: ['Limpar conversa'], // pt_BR, pt_PT
    mesajSec: ['Selecionar mensagens'], kapat: ['Fechar conversa'] },
  { dil: 'Hintçe', sil: ['चैट डिलीट करें'], temizle: ['चैट हटाएँ'], // hi_IN
    mesajSec: ['मैसेजेस चुनें'], kapat: ['चैट बंद करें'] },
  { dil: 'Arapça', sil: ['حذف الدردشة'], temizle: ['مسح الدردشة'], // ar_AR
    mesajSec: ['تحديد الرسائل'], kapat: ['إغلاق الدردشة'] },
  { dil: 'Endonezce', sil: ['Hapus obrolan'], temizle: ['Bersihkan obrolan'], // id_ID
    mesajSec: ['Pilih pesan'], kapat: ['Tutup obrolan'] }
];

const yinelenmeyen = liste => [...new Set(liste)];
export const GIZLENECEK_SECENEKLER = yinelenmeyen(DILLER.flatMap(d => [...d.sil, ...d.temizle]));
export const SOHBET_MENUSU_SECENEKLERI = yinelenmeyen(DILLER.flatMap(d => [...d.mesajSec, ...d.kapat]));
// Bir sohbet menüsünde yan yana gelebilecek en çok gizlenen seçenek sayısı: Menüde yalnızca bir dilin adları bulunur, o
// dilin "Sohbeti temizle"si ve "Sohbeti sil"i.
export const YAN_YANA_EN_COK = 2;

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const STIL_DOSYASI = path.join(KOK, 'icerik.css');
// Katmanın, kökteki kabın ve değişkenin adı. Sayfanın kendi adlarıyla karışmasın diye eklentinin adını taşır.
export const AD = 'wa-sohbet-sil-buton-gizleyici';
export const UC_NOKTA_DEGISKENI = `--${AD}-uc-nokta`;

const ACIKLAMA = `/*
 * WhatsApp Web için Sohbeti Sil Gizleyici: web.whatsapp.com'a eklenen stil kuralları.
 *
 * Bu dosya araclar/stil-uret.mjs ile üretilir. Elle değiştirmeyin: Seçenek listeleri o dosyadadır, listeleri değiştirince
 * "npm run stil" çalıştırın.
 *
 * Eklentide çalışan kod yoktur. Chrome bu dosyayı WhatsApp Web açılırken sayfaya ekler ve kuralları kendi çizim motoruyla
 * uygular. Dosyada yalnızca seçenekleri gizleyen kurallar vardır: Bir şey yükleyen ya da sayfadaki bir yazıyı ekrana
 * getiren kural bulunmaz.
 *
 * Kurallar yalnızca sohbet alanında sağ tıkla açılan sohbet menüsünde gizler:
 *   - Sohbet menüsü: İçinde SOHBET_MENUSU_SECENEKLERI'nden biri bulunan menü.
 *   - Sağ tıkla açılan: Aynı sohbet menüsü sohbetin üstündeki üç nokta düğmesiyle de açılır. O düğme, menüsü açıkken
 *     aria-expanded="true" taşır. Bu durumda kurallar uygulanmaz, seçenekler üç nokta menüsünde görünür kalır.
 *
 * Seçenekler adlarıyla tanınır. Adlar ${DILLER.length} dilde yazılıdır, dosyanın uzunluğunun çoğu her kuralda yinelenen ad
 * listeleridir.
 *
 * WhatsApp Web'in yapısı (2026-10'da ölçüldü): Menüler sonradan eklenen div[role="menu"] öğeleridir ve hepsi aynı ortak
 * katmanda açılır. Seçenekler button[role="menuitem"] öğeleridir ve aria-label değerleri görünen yazıyla aynıdır. Ayırıcı
 * çizgiler, seçeneklerle aynı kapta duran rolsüz ve boş div'lerdir. Açık sohbetin üst çubuğu #main içindeki header'dır,
 * üç nokta düğmesi aria-haspopup taşır. Sınıf adları rastgele olduğu için kullanılmaz.
 *
 * Yazım, WhatsApp sayfası değiştikçe Chrome'a fazladan iş çıkarmayacak biçimde seçildi:
 *   - Üç nokta düğmesinin durumu kökte (:root) kalıtılmayan tek bir değişkene yazılır, menü kuralları ona kökün kabı
 *     üzerinden bakar. Sayfaya mesaj ya da sohbet eklenip çıktıkça Chrome yalnızca kökü yeniden hesaplar, bütün sayfayı değil.
 *   - Ayırıcı kuralları önce çizginin bir menünün içinde olduğuna bakar. Menü dışındaki boş div'lerin komşularına bakılmaz.
 *   - Kurallar kendi katmanlarındadır (@layer). Chrome eklentinin kurallarını sayfanınkilerden önce sıraladığı için
 *     sayfanın stil dosyalarındaki !important kuralları gizlemeyi bozamaz.
 *
 * Bilinen sınır: Kökteki kap adı ve değişken olağan önceliktedir, böylece sayfanın kendi kök kurallarını bozmaz. WhatsApp
 * köke kendi kap adını (container-name) verirse kurallar kökün kabını bulamaz, gizleme kalkar ve seçenekler görünür. Sayfa
 * bozulmaz.
 */`;

// Bir adın CSS'teki etiket seçicisi. Görünmeyen biçim karakterleri (Unicode Cf) onaltılık kaçışla yazılır, dosyada
// görünsünler diye. Kaçıştan sonraki boşluk kaçışın parçasıdır, ada girmez.
export const etiketSecicisi = yazi =>
  `[aria-label="${yazi.replace(/["\\]/g, '\\$&').replace(/\p{Cf}/gu, k => `\\${k.codePointAt(0).toString(16)} `)}"]`;

export function stilUret(gizlenecek = GIZLENECEK_SECENEKLER, tanitan = SOHBET_MENUSU_SECENEKLERI) {
  const seceneklerden = liste => `[role="menuitem"]:is(${liste.map(etiketSecicisi).join(', ')})`;
  const HEDEF = seceneklerden(gizlenecek);
  const MENU = `[role="menu"]:has(${seceneklerden(tanitan)})`;
  const AYIRICI = 'div:not([role]):empty';
  const MENUDEKI_AYIRICI = `${AYIRICI}:is([role="menu"] *)`;
  const UC_NOKTA_ACIK = '#main header [aria-haspopup][aria-expanded="true"]';
  const GIZLE = '{ display: none !important; }';
  const yanYana = adet => ` + ${HEDEF}`.repeat(adet);
  const adetler = Array.from({ length: Math.min(YAN_YANA_EN_COK, gizlenecek.length) }, (_, sira) => sira + 1);
  return [
    ACIKLAMA,
    '',
    `@property ${UC_NOKTA_DEGISKENI} { syntax: '*'; inherits: false; }`,
    '',
    `@layer ${AD} {`,
    '  /* Kök, menü kurallarının baktığı kaptır. Üç nokta menüsü açıkken kökün değişkeni 1 olur. */',
    `  :root { container-name: ${AD}; }`,
    `  :root:has(${UC_NOKTA_ACIK}) { ${UC_NOKTA_DEGISKENI}: 1; }`,
    '',
    `  @container ${AD} not style(${UC_NOKTA_DEGISKENI}: 1) {`,
    '    /* Sohbet menüsündeki gizlenecek seçenekler. */',
    `    ${MENU} ${HEDEF} ${GIZLE}`,
    '',
    '    /*',
    '     * Gizlenen seçeneklerin yanında boşta kalan ayırıcı çizgiler:',
    '     *   - Sondaki: Arkasında yalnızca gizlenen seçenekler ve çizgiler kalan çizgi.',
    '     *   - Baştaki: Önünde yalnızca gizlenen seçenekler olan çizgi.',
    '     *   - Art arda: İki çizgi arasında yalnızca gizlenen seçenekler kalırsa ikinci çizgi.',
    `     * Baştaki ve art arda çizgi kuralları, yan yana ${adetler.join(' ve ')} gizlenen seçenek için ayrı ayrı yazılır: Bir`,
    '     * sohbet menüsünde yalnızca bir dilin adları bulunur, yan yana en çok o dilin gizlenen seçenekleri gelir. Gizlenen',
    '     * seçenek yoksa çizgilere dokunulmaz.',
    '     */',
    `    ${MENU} [role="menuitem"] ~ ${MENUDEKI_AYIRICI}:has(~ ${HEDEF}):not(:has(~ :not(${HEDEF}, ${AYIRICI}))) ${GIZLE}`,
    ...adetler.map(adet => `    ${MENU} ${HEDEF}:first-child${yanYana(adet - 1)} + ${MENUDEKI_AYIRICI} ${GIZLE}`),
    ...adetler.map(adet => `    ${MENU} ${AYIRICI}${yanYana(adet)} + ${MENUDEKI_AYIRICI} ${GIZLE}`),
    '  }',
    '}',
    ''
  ].join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('stil-uret.mjs')) {
  fs.writeFileSync(STIL_DOSYASI, stilUret());
  console.log(`${path.relative(KOK, STIL_DOSYASI)} · ${fs.statSync(STIL_DOSYASI).size} bayt`);
}
