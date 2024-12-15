class Resource {
  constructor(url, index) {
    this.index = index;
    this.url = url;
  }

  async download(config = {}) {
    const response = await fetch(this.url, {
      ...config
    });
    return response;
  }
}

class SnapTikClient {
  constructor(config = {}) {
    this.config = {
      baseURL: 'https://dev.snaptik.app',
      ...config,
    };
  }

  async get_token() {
    const response = await fetch(this.config.baseURL + '/');
    const data = await response.text();
    const tokenMatch = data.match(/<input[^>]*name="token"[^>]*value="([^"]*)"[^>]*>/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  async get_script(url) {
    const token = await this.get_token();
    const formData = new URLSearchParams();
    formData.append('token', token);
    formData.append('url', url);

    const response = await fetch(this.config.baseURL + '/abc2.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    return response.text();
  }

  async eval_script(script1) {
    const script2 = await new Promise(resolve => Function('eval', script1)(resolve));
    return new Promise((resolve, reject) => {
      let html = '';
      const [k, v] = ['keys', 'values'].map(x => Object[x]({
        $: () => Object.defineProperty({
          remove() {},
          style: {
            display: ''
          }
        }, 'innerHTML', {
          set: t => (html = t)
        }),
        app: {
          showAlert: reject
        },
        document: {
          getElementById: () => ({
            src: ''
          })
        },
        fetch: a => {
          return resolve({
            html,
            oembed_url: a
          }), {
            json: () => ({
              thumbnail_url: ''
            })
          };
        },
        gtag: () => 0,
        Math: {
          round: () => 0
        },
        XMLHttpRequest: function() {
          return {
            open() {},
            send() {}
          }
        },
        window: {
          location: {
            hostname: 'snaptik.app'
          }
        }
      }));

      Function(...k, script2)(...v);
    });
  }

  async get_hd_video(token) {
    const response = await fetch(this.config.baseURL + '/getHdLink.php?token=' + token);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.url;
  }

  async parse_html(html) {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    const is_video = !$('div.render-wrapper').length;

    return is_video ? await (async () => {
      const hd_token = $('div.video-links > button[data-tokenhd]').data('tokenhd');
      const hd_url = new URL(await this.get_hd_video(hd_token));
      const token = hd_url.searchParams.get('token');
      const { url } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      return {
        type: 'video',
        data: {
          sources: [
            url,
            hd_url.href,
            ...$('div.video-links > a:not(a[href="/"])').toArray()
              .map(elem => $(elem).attr('href'))
              .map(x => x.startsWith('/') ? this.config.baseURL + x : x)
          ].map((...x) => new Resource(...x))
        }
      };
    })() : (x => x.data.photos.length == 1 ? ({
      ...x,
      type: 'photo',
      data: {
        sources: x.data.photos[0].sources
      }
    }) : x)({
      type: 'slideshow',
      data: {
        photos: $('div.columns > div.column > div.photo').toArray().map(elem => ({
          sources: [
            $(elem).find('img[alt="Photo"]').attr('src'),
            $(elem).find('a[data-event="download_albumPhoto_photo"]').attr('href')
          ].map((...x) => new Resource(...x))
        }))
      }
    });
  }

  async process(url) {
    const script = await this.get_script(url);
    const { html, oembed_url } = await this.eval_script(script);

    const res = {
      ...(await this.parse_html(html)),
      url
    };

    return res.data.oembed_url = oembed_url, res;
  }
}

module.exports = SnapTikClient;

