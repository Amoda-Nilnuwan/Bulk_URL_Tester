// https://www.actindo.com/de/sg-home-de
// https://www.actindo.com/de/sg-unternehmen-0
const puppeteer = require('puppeteer');
const readline  = require('readline');
const fs        = require('fs');
const filePath  = './results/results.txt';
var   content   = "";

function readLinesToArray(filePath) {
  return new Promise((resolve, reject) => {
    const fileStream  = fs.createReadStream(filePath);
    const rl          = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity // Recognize all instances of CR LF (Carriage Return Line Feed) as line breaks
    });

    const linesArray = [];

    rl.on('line', (line) => {
      linesArray.push(line);
    });

    rl.on('close', () => {
      resolve(linesArray);
    });

    rl.on('error', (error) => {
      reject(error); // Reject the promise if there's an error
    });
  });
}



readLinesToArray('url_list.txt')
  .then(linesArray => {
    console.log('All lines read and stored in the array:');
    console.log(linesArray);
    check_speed(linesArray);
    

  })
  .catch(error => {
    console.error('Error reading lines:', error);
  });


function check_speed(linesArray){
    (async () => {
    try {
        const browser = await puppeteer.launch();

        for (let index = 0; index < linesArray.length; index++) {
          const url = linesArray[index];
          console.log(`Processing URL[${index+1}] : ${url}`);
          const page                = await browser.newPage();
          const timeOutMilliSeconds = 120000;
          await page.goto(`https://pagespeed.web.dev/analysis?url=${url}`);
          const attribute           = 'aria-labelledby';
          const attributeValue      = 'mobile_tab';
          const parentElementId     = '#performance';
          const combinedSelector    = `[${attribute}="${attributeValue}"] ${parentElementId} .lh-gauge__percentage`;

          await page.waitForSelector(combinedSelector, { timeout: timeOutMilliSeconds });

          const mobile_performance  = await page.$eval(combinedSelector, div => div.textContent);
          console.log('Mobile Performance :', mobile_performance);
          await page.screenshot({path: `./results/${index+1}_Mobile.png`});

          const desktopTab          = await page.$('#desktop_tab');
          await desktopTab.click();
          await page.waitForFunction(element => element.getAttribute('aria-selected') === 'true', {}, desktopTab);

          const attributeValue2     = 'desktop_tab';
          const parentElementId2    = '#performance';
          const combinedSelector2   = `[${attribute}="${attributeValue2}"] ${parentElementId2} .lh-gauge__percentage`;
          await page.waitForSelector(combinedSelector2);
          const desktop_perfomance  = await page.$eval(combinedSelector2, div => div.textContent);
          console.log('Desktop Performance :', desktop_perfomance);
          await page.screenshot({path: `./results/${index+1}_Desktop.png`});


          content = content + `${mobile_performance}\t${desktop_perfomance}\n`;
          fs.writeFile(filePath, content, (err) => {
            if (err) {
              console.error('Error writing to file:', err);
            } else {
              console.log('Text Updated !');
            }
          });

          
          await page.close();
        }

        await browser.close();

    } catch (error) {
        console.log("Error Catched ");
        console.log(error);
    }

    })();
}

