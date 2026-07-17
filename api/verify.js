// api/verify.js
export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        // Eğer kullanıcı henüz giriş yapmadıysa Discord'un izin penceresine yönlendiriyoruz
        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
        const REDIRECT_URI = encodeURIComponent(process.env.REDIRECT_URI);
        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20role_connections.write`;
        
        return res.redirect(discordAuthUrl);
    }

    try {
        // Discord'dan kullanıcının Token bilgilerini alıyoruz
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokens = await tokenResponse.json();
        if (!tokens.access_token) return res.status(400).send('Discord entegrasyon hatası.');

        // Kullanıcının temel bilgilerini çekiyoruz (Discord ID)
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userResponse.json();

        // [KRİTİK ADIM]: Burada verileri doğrulaması için senin yerel ağda/sunucuda çalışan Python botuna gönderiyoruz
        // BOT_BACKEND_URL senin Python botunun çalıştığı sunucunun IP adresi veya ngrok linki olacak
        const pythonBotResponse = await fetch(`${process.env.BOT_BACKEND_URL}/verify-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discord_id: userData.id })
        });

        const result = await pythonBotResponse.json();

        if (result.success) {
            // Eğer Python botu "Evet bu kullanıcı grupta yetkili" derse Discord'a metadata yazıyoruz
            await fetch(`https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform_name: "Roblox Group Security",
                    platform_username: result.roblox_username,
                    metadata: {
                        is_verified: 1,
                        group_rank: result.rank
                    }
                }),
            });
            return res.status(200).send('<h1>Doğrulama Başarılı!</h1><p>Bağlı rolünüz tanımlandı. Discord penceresine dönebilirsiniz.</p>');
        } else {
            return res.status(400).send(`<h1>Doğrulama Başarısız</h1><p>${result.message}</p>`);
        }

    } catch (error) {
        return res.status(500).send('Sistem hatası oluştu.');
    }
}
