const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const fs = require("fs")
const { default: Axios } = require('axios')
const cheerio = require('cheerio')
const qs = require('qs')

inquirer
  .prompt([
    {
      type: 'input',
      name: 'name',
      message: '[+] Insira o nome do canal:'
    },
  ]).then((answers) => {
    (async () => {

      const browser = await puppeteer.launch({ headless: false });

      const page = await browser.newPage();

      await page.emulate(puppeteer.devices['iPad Pro landscape']); // Set devices

      await page.goto(`https://www.tiktok.com/@${answers.name}`);
      await page.setViewport({ width: 1366, height: 1920 });

      const htmlContent = await page.content();
  
      const $ = cheerio.load(htmlContent);
      const links = [];
      $(`a[href*="https://www.tiktok.com/@${answers.name}/video"]`).each((index, element) => {
        const link = $(element).attr('href');
        links.push(link);
      });

      const downloadFile = async (url, fileName) => {
        try {
          const response = await Axios.get(url, { responseType: 'arraybuffer' });
          fs.mkdirSync(`./tiktoks/${answers.name}`, { recursive: true });
          fs.writeFileSync(`./tiktoks/${answers.name}/${fileName}`, response.data, 'binary');
          console.log(`Arquivo ${fileName} baixado com sucesso.`);
        } catch (error) {
          console.error(error);
        }
      };


      const tiktokdownload = async(url, filename) => {
        return new Promise(() => {
          Axios.get('https://ttdownloader.com/')
            .then((data) => {
              const $ = cheerio.load(data.data)
              const cookie = data.headers['set-cookie'].join('')
              const dataPost = {
                url: url,
                token: $('#token').attr('value')
              }

              Axios({
                method: 'POST',
                url: 'https://ttdownloader.com/search/',
                headers: {
                  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  cookie
                },
                data: qs.stringify(dataPost)
              }).then(async ({ data }) => {
                const $ = cheerio.load(data)
                const result = { nowm: $('#results-list > div:nth-child(2) > div.download > a')?.attr('href'), }
                const videoWithoutMark = result.nowm

                await downloadFile(videoWithoutMark, `${filename}.mp4`)
              })
            })
        })
      }


      links.forEach((link, i) => {
        setTimeout(async () => {
          tiktokdownload(link, link.split("/")[5])
        }, i * 1500);

      });
      await browser.close();
      console.log(`[*] Baixando conteudos...`)
    })();
  })