// src/lib/auth.ts
import axios from 'axios';
import https from 'https';

// ⚠️ Отключаем проверку SSL на Vercel
// Сертификат Минцифры недоступен в облаке
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // 🔴 Отключаем проверку сертификата
});

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export async function getGigaChatToken(): Promise<string> {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    return accessToken;
  }

  const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

  const payload = new URLSearchParams({
    scope: 'GIGACHAT_API_PERS',
  });

  const authString = `${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`;
  const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

  try {
    const response = await axios.post<TokenResponse>(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': process.env.GIGACHAT_RQ_UID,
          'Authorization': authHeader,
        },
        httpsAgent, // ← Используем агент без проверки
        timeout: 10000,
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (error) {
    console.error('❌ [auth] Ошибка получения токена:', {
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      code: axios.isAxiosError(error) ? error.code : undefined,
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      data: axios.isAxiosError(error) ? error.response?.data : undefined,
    });

    throw new Error('Не удалось получить токен доступа к GigaChat');
  }
}

