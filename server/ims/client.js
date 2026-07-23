import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const BASE = 'https://www.imsnsit.org/imsnsit';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function createImsClient() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    maxRedirects: 5,
    timeout: 30000,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    validateStatus: (s) => s < 500,
  }));

  return { client, jar, base: BASE };
}

export function absUrl(base, href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `https://www.imsnsit.org${href}`;
  return `${base}/${href.replace(/^\.\//, '')}`;
}

export async function fetchPage(client, url, referer) {
  const res = await client.get(url, {
    headers: referer ? { Referer: referer } : {},
    responseType: 'text',
  });
  return res.data;
}

export async function fetchBinary(client, url, referer) {
  const res = await client.get(url, {
    headers: referer ? { Referer: referer } : {},
    responseType: 'arraybuffer',
  });
  return Buffer.from(res.data);
}

export async function postPage(client, url, formData, referer) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(formData)) {
    params.append(key, value);
  }
  const res = await client.post(url, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(referer ? { Referer: referer } : {})
    },
    responseType: 'text',
  });
  return res.data;
}
