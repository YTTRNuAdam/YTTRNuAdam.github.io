// api/verify.js
export default async function handler(req, res) {
    // Discord'un doğrulama sonrasında bize göndereceği geçici kod
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Eksik OAuth2 kodu.');
    }

    try {
        // 1. Bu kod ile Discord'dan kullanıcının Access Token bilgisini istenir
        // 2. Botunun şifreleri (Client Secret) kullanılarak güvenli bağlantı kurulur
        // 3. Kullanıcı kriterleri karşılıyorsa Discord API'sine "Rolü ver" isteği atılır

        // Şimdilik test amaçlı başarılı dönüş yapalım:
        return res.status(200).send('Doğrulama başarılı! Discord penceresine dönebilirsiniz.');
    } catch (error) {
        return res.status(500).send('Doğrulama sırasında hata oluştu.');
    }
}
