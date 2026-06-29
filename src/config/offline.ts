/**
 * Global "networksüz çalış" anahtarı.
 *
 * true iken uygulama HİÇBİR network çağrısı yapmaz:
 *   - Supabase (auth + tüm db sorguları) → fetch stub ile anında reddedilir
 *   - Adapty SDK aktivasyonu / refund kontrolü → no-op
 *   - Firebase Analytics (event + native otomatik toplama) → kapalı
 *   - OpenAI workout analizi → devre dışı
 *
 * Online'a dönmek için tek yapman gereken: false yap, rebuild et.
 * (Demo / App Store screenshot / offline kullanım için eklendi.)
 */
export const OFFLINE_MODE = true;
