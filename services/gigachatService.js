// src/services/gigachatService.js
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

// Загружаем сертификат Минцифры
const certPath = path.resolve(process.cwd(), 'certs', 'mincyfry_root_ca.pem');
const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath) : null;

const httpsAgent = new https.Agent({
  ca: ca || undefined,
  rejectUnauthorized: ca ? true : false, // если сертификата нет — отключаем проверку (для dev)
});

// Функция: получить токен
async function getAccessToken() {
  const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  const authString = `${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`;
  const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

  const response = await axios.post(
    url,
    new URLSearchParams({
      scope: 'GIGACHAT_API_PERS',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': process.env.GIGACHAT_RQ_UID,
        'Authorization': authHeader,
      },
      httpsAgent,
    }
  );

  return response.data.access_token;
}

// Кэширование токена
let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken;
  }

  cachedToken = await getAccessToken();
  tokenExpiry = Date.now() + 1000 * 3600; // 1 час

  return cachedToken;
}

// Основная функция: получить ответ от GigaChat
export async function getResponse(message) {
  try {
    const token = await getToken();
    const url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

    const response = await axios.post(
      url,
      {
        model: 'GigaChat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data.choices?.[0]?.message?.content || 'Пустой ответ';
  } catch (error) {
    console.error('Ошибка GigaChat:', error.response?.data || error.message);
    throw new Error('Не удалось получить ответ от GigaChat');
  }
}
