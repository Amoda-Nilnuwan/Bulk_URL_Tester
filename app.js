const express = require('express');
const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
const filePath = './results/results.txt';
const WebSocket = require('ws');
const http = require('http');
var content = "";

const app = express();
const port = 3000; // You can change the port if needed

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });


app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Web Page Speed Checker 3</h1>
        <div id="dataDisplay"></div>
        <textarea id="inputData" rows="10" cols="80" placeholder="enter your URL's"></textarea>
        <button onclick="runCode()">Check Speed</button>
        <input type="text" placeholder="Enter data">
        <button onclick="sendData()">Send Data</button>
        <script>
          async function runCode() {
            const response = await fetch('/run-code');
            const result = await response.text();
            alert(result);
          }

          const ws = new WebSocket('ws://bulk-url-tester.onrender.com:3000');

          ws.addEventListener('open', (event) => {
            console.log('WebSocket connection opened.');
          });

          ws.addEventListener('message', (event) => {
            const dataDisplay = document.getElementById('dataDisplay');
            dataDisplay.innerHTML = dataDisplay.innerHTML + '<br>' + event.data;
          });

          function sendData() {
            const inputData = document.getElementById('inputData').value;
            ws.send(inputData); // Send data to the server
          }

        </script>
      </body>
    </html>
  `);
});



wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');
  
    // Listen for messages from the client
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    app.get('/run-code', async (req, res) => {
        try {
          await runChecker(ws);
          res.send('Code execution completed successfully.123');
        } catch (error) {
          res.status(500).send('An error occurred during code execution.');
        }
      });
    // Simulate sending data to the client
    // setInterval(() => {
    //   const randomData = Math.random();
    //   ws.send(randomData.toString()); // Send data to the client
    // }, 2000);
  });

async function runChecker(ws) {

  await readLinesToArray('url_list.txt')
  .then(linesArray => {
    
    console.log('All lines read and stored in the array:');
    console.log(linesArray);
    check_speed(linesArray,ws);
    
  })
  .catch(error => {
    console.error('Error reading lines:', error);
  });
}

// app.listen(port, () => {
//   console.log(`App listening at http://localhost:${port}`);
// });

server.listen(process.env.PORT || port, () => {
    console.log(`App listening at https://localhost:${port}`);
});

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

 async function check_speed(linesArray,ws){
    try {
        const browser = await puppeteer.launch();

        for (let index = 0; index < linesArray.length; index++) {
          const url = linesArray[index];
          console.log(`Processing URL[${index+1}] : ${url}`);
          ws.send(`Processing URL[${index+1}] : ${url}`);
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
          ws.send('Mobile Performance :' + mobile_performance);
          await page.screenshot({path: `./results/${index+1}_Mobile.png`});

          const desktopTab          = await page.$('#desktop_tab');
          await desktopTab.click();
          await page.waitForFunction(element => element.getAttribute('aria-selected') === 'true', {}, desktopTab);

          const attributeValue2     = 'desktop_tab';
          const parentElementId2    = '#performance';
          const combinedSelector2   = `[${attribute}="${attributeValue2}"] ${parentElementId2} .lh-gauge__percentage`;
          await page.waitForSelector(combinedSelector2, { timeout: timeOutMilliSeconds });
          const desktop_perfomance  = await page.$eval(combinedSelector2, div => div.textContent);
          console.log('Desktop Performance :', desktop_perfomance);
          ws.send('Desktop Performance :' + desktop_perfomance);
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
  
}
