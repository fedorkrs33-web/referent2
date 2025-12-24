// src/lib/auth.js
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

// 🔐 Загружаем сертификат Минцифры
const certPath = path.resolve(process.cwd(), 'certs', 'mincyfry_root_ca.pem');
console.log('🔐 [auth] Путь к сертификату:', certPath);

let accessToken = null;
let tokenExpiry = null;

export async function getGigaChatToken() {
  if (accessToken && tokenExpiry > Date.now()) {
    console.log('♻️ [auth] Используем кэшированный токен');
    return accessToken;
  }

  console.log('🔑 [auth] Запрашиваем новый токен...');

  // 🔍 Проверяем переменные
  console.log('🔍 [auth] GIGACHAT_CLIENT_ID:', process.env.GIGACHAT_CLIENT_ID ? 'есть' : 'нет');
  console.log('🔍 [auth] GIGACHAT_CLIENT_SECRET:', process.env.GIGACHAT_CLIENT_SECRET ? 'есть' : 'нет');
  console.log('🔍 [auth] GIGACHAT_RQ_UID:', process.env.GIGACHAT_RQ_UID);

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

    console.log('🔐 [auth] Basic Auth (начало):', authHeader.substring(0, 50));

    // 🔐 Проверяем сертификат
    let ca = null;
    try {
      ca = fs.readFileSync(certPath);
      console.log('✅ [auth] Сертификат Минцифры загружен');
    } catch (err) {
      console.warn('⚠️ [auth] Сертификат не найден, отключаем проверку SSL');
    }

    const httpsAgent = new https.Agent({
      ca: ca || undefined,
      rejectUnauthorized: ca ? true : false, // если сертификата нет — отключаем проверку
    });

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': process.env.GIGACHAT_RQ_UID,
        'Authorization': authHeader,
      },
      httpsAgent,
    });

    console.log('✅ [auth] Токен успешно получен');
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (error) {
    console.error('❌ [auth] ОШИБКА ПОЛУЧЕНИЯ ТОКЕНА:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      headers: {
        auth: !!error.config?.headers?.Authorization,
      },
    });

    throw new Error('Не удалось получить токен доступа к GigaChat');
  }
}
