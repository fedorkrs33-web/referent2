/// src/lib/auth.js
console.log('🔐 [auth] МОДУЛЬ ЗАГРУЖЕН');

import axios from 'axios';
import https from 'https';

let accessToken = null;
let tokenExpiry = null;

export async function getGigaChatToken() {
  if (accessToken && tokenExpiry > Date.now()) {
    console.log('♻️ [auth] Используем кэшированный токен');
    return accessToken;
  }

  console.log('🔑 [auth] Запрашиваем новый токен...');

  // 🔍 ЛОГИРУЕМ ПЕРЕМЕННЫЕ
  console.log('🔍 [auth] Переменные окружения:', {
    clientId: !!process.env.GIGACHAT_CLIENT_ID,
    clientSecret: !!process.env.GIGACHAT_CLIENT_SECRET,
    rqUid: process.env.GIGACHAT_RQ_UID,
  });

  if (!process.env.GIGACHAT_CLIENT_ID || !process.env.GIGACHAT_CLIENT_SECRET || !process.env.GIGACHAT_RQ_UID) {
    console.error('❌ [auth] Не хватает переменных окружения');
    throw new Error('Не заданы параметры доступа');
  }

  try {
    const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

    const payload = new URLSearchParams({
      scope: 'GIGACHAT_API_PERS',
    });

    const authString = `${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    // 🔐 ЛОГИРУЕМ Basic Auth
    console.log('🔐 [auth] Basic Auth (начало):', authHeader.substring(0, 50));

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': process.env.GIGACHAT_RQ_UID,
      'Authorization': authHeader,
    };

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios.post(url, payload, { headers, httpsAgent });

    console.log('✅ [auth] Токен успешно получен');
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (error) {
    console.error('❌ [auth] ПОЛНАЯ ОШИБКА ПРИ ПОЛУЧЕНИИ ТОКЕНА:', {
      message: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseError: error.response?.data,
      requestURL: error.config?.url,
      requestData: error.config?.data,
      requestHeaders: {
        authorization: !!error.config?.headers?.Authorization,
      },
    });

    throw new Error('Не удалось получить токен доступа к GigaChat');
  }
}


