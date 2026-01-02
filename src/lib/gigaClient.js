// src/lib/gigaClient.js
export async function getModels() {
  const token = await getGigaChatToken();
  const response = await axios.get('https://gigachat.devices.sberbank.ru/api/v1/models', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}
