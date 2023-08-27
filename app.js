const express = require('express');
const puppeteer = require('puppeteer');
require("dotenv").config();
const readline = require('readline');
const fs = require('fs');
const filePath = './results/results.txt';
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
var content = "";

const app = express();
const port = 10000; // You can change the port if needed

const server = http.createServer(app);
// const server = https.createServer({
//   cert: fs.readFileSync('./cert/cert.pem'),
//   key: fs.readFileSync('./cert/key.pem')
// }, app);

const wss = new WebSocket.Server({ server });


app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js" integrity="sha256-2Pmvv0kuTBOenSvLm6bvfBSSHrUJ+3A7x6P5Ebd07/g=" crossorigin="anonymous"></script>
    </head>
      <body>
        <h1>Web Page Speed Checker 3</h1>
        <p>https://www.actindo.com/de/<br/>https://developers.google.com/</p>
        <div id="dataDisplay"></div>
        <textarea id="url_list" rows="10" cols="80" placeholder="enter your URL's"></textarea>
        <button onclick="runCode()">Check Speed</button>
        <input type="text" placeholder="Enter data">
        <button onclick="sendData()">Send Data</button>
        <div class="testResult"></div>
        <script>
          

          // const ws = new WebSocket('ws://localhost:${process.env.PORT || port}');
          // const ws = new WebSocket('wss://ill-pear-coral-tam.cyclic.cloud:3000');
          const ws = new WebSocket('wss://bulk-url-tester.onrender.com');

          ws.addEventListener('open', (event) => {
            console.log('WebSocket connection opened.');
          });

          ws.addEventListener('message', (event) => {
            // const dataDisplay = document.getElementById('dataDisplay');
            // dataDisplay.innerHTML = dataDisplay.innerHTML + '<br>' + event.data;

            const jsonData = JSON.parse(event.data);

            if(jsonData.type === 'url'){
                if(jsonData.index === 0){
                  const $tableContainer = $('.testResult');
                  const $table = $('<table>');
                  const $tableHeader = $('<thead>');
                  const $headerRow = $('<tr>');
                  const $headerCell1 = $('<th>').text('URL');
                  const $headerCell2 = $('<th>').text('Mobile Performance');
                  const $headerCell3 = $('<th>').text('Desktop Performance');
                  const $headerCell4 = $('<th>').text('ScreenShot');
                  $headerRow.append($headerCell1, $headerCell2, $headerCell3, $headerCell4);
                  $tableHeader.append($headerRow);
    
                  const $tableBody = $('<tbody>').addClass('result_tbody');
                  const $row = $('<tr>').addClass('data-row-0');
                  const $cell1 = $('<td>').addClass('data-url').text(jsonData.url);
                  const $cell2 = $('<td>').addClass('data-mobile-score').text('pending...');
                  const $cell3 = $('<td>').addClass('data-desktop-score').text('pending...');
                  const $cell4 = $('<td>').addClass('data-screenshot').text('pending...');
                  $row.append($cell1, $cell2, $cell3, $cell4);
                  $tableBody.append($row);

                  $table.append($tableHeader, $tableBody);
                  $tableContainer.append($table);
                }else{
                  const $tableBody = $('.testResult .result_tbody');
                  const $row = $('<tr>').addClass('data-row-'+jsonData.index);
                  const $cell1 = $('<td>').addClass('data-url').text(jsonData.url);
                  const $cell2 = $('<td>').addClass('data-mobile-score').text('pending...');
                  const $cell3 = $('<td>').addClass('data-desktop-score').text('pending...');
                  const $cell4 = $('<td>').addClass('data-screenshot').text('pending...');
                  $row.append($cell1, $cell2, $cell3, $cell4);
                  $tableBody.append($row);

                }
            }

            if(jsonData.type === 'mobile'){

              const index = jsonData.index;
              const score = jsonData.score;
              const scoreCell = $('.testResult .result_tbody .data-row-'+index+' .data-mobile-score');
              scoreCell.text(score);
              const imageCell = $('.testResult .result_tbody .data-row-'+index+' .data-screenshot');

              const screenshotBase64 = jsonData.image;
              const screenshotBuffer = new Uint8Array(atob(screenshotBase64).split('').map(char => char.charCodeAt(0)));
              const screenshotBlob = new Blob([screenshotBuffer], { type: 'image/png' });
              const screenshotUrl = URL.createObjectURL(screenshotBlob);

              const downloadButton = $('<button>').text('Mobile').click(function() {
                // When the button is clicked, trigger the download
                const downloadLink = document.createElement('a');
                downloadLink.href = screenshotUrl;
                downloadLink.download = (index+1)+'_Mobile.png';
                downloadLink.click();
              });
              // Find the <td> element with class "link-1" and append the button to it
              imageCell.text("");
              imageCell.append(downloadButton);


              // const downloadLink = document.createElement('a');
              // downloadLink.href = screenshotUrl;
              // downloadLink.download = (index+1)+'_Mobile.png'; // Set the desired filename
              // downloadLink.textContent = 'Mobile';
              // document.body.appendChild(downloadLink);
              // downloadLink.click();
            }

            if(jsonData.type === 'desktop'){

              const index = jsonData.index;
              const score = jsonData.score;
              const scoreCell = $('.testResult .result_tbody .data-row-'+index+' .data-desktop-score');
              scoreCell.text(score);
              const imageCell = $('.testResult .result_tbody .data-row-'+index+' .data-screenshot');

              const screenshotBase64 = jsonData.image;
              const screenshotBuffer = new Uint8Array(atob(screenshotBase64).split('').map(char => char.charCodeAt(0)));
              const screenshotBlob = new Blob([screenshotBuffer], { type: 'image/png' });
              const screenshotUrl = URL.createObjectURL(screenshotBlob);

              const downloadButton = $('<button>').text('Desktop').click(function() {
                // When the button is clicked, trigger the download
                const downloadLink = document.createElement('a');
                downloadLink.href = screenshotUrl;
                downloadLink.download = (index+1)+'_Desktop.png';
                downloadLink.click();
              });
              // Find the <td> element with class "link-1" and append the button to it
              // imageCell.text("");
              imageCell.append(downloadButton);

              // const downloadLink = document.createElement('a');
              // downloadLink.href = screenshotUrl;
              // downloadLink.download = (index+1)+'_Desktop.png'; // Set the desired filename
              // downloadLink.textContent = 'Desktop';
              // document.body.appendChild(downloadLink);
              // downloadLink.click();
            }

            if (jsonData.type === 'image') {
              const screenshotBase64 = jsonData.data;
          
              // Convert base64 to binary
              const screenshotBuffer = new Uint8Array(atob(screenshotBase64).split('').map(char => char.charCodeAt(0)));

              const screenshotBlob = new Blob([screenshotBuffer], { type: 'image/png' });
              const screenshotUrl = URL.createObjectURL(screenshotBlob);

              const downloadButton = $('<button>').text('Mobile').click(function() {
                // When the button is clicked, trigger the download
                const downloadLink = document.createElement('a');
                downloadLink.href = screenshotUrl;
                downloadLink.download = 'screenshot.png';
                // downloadLink.click();
              });
              // Find the <td> element with class "link-1" and append the button to it
              $('.link-1').append(downloadButton);

              // const downloadLink = document.createElement('a');
              // downloadLink.href = screenshotUrl;
              // downloadLink.download = 'screenshot.png'; // Set the desired filename
              // downloadLink.textContent = 'Download Screenshot';
              // document.body.appendChild(downloadLink);
              // downloadLink.click();

            }


          });

          function sendData() {
            const inputData = document.getElementById('inputData').value;
            ws.send(inputData); // Send data to the server
          }

          async function runCode() {
            // const inputData = document.getElementById('inputData').value;
            const urlTextarea = document.getElementById('url_list');
            const enteredUrls = urlTextarea.value;
            const urlsArray = enteredUrls.split('\\n').map(url => url.trim());

            ws.send(JSON.stringify({ type: 'url_list', data: urlsArray }));
            // const response = await fetch('/run-code');
            // const result = await response.text();
            // alert(result);
          }

        </script>
      </body>
    </html>
  `);
});



wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');
  
    // Listen for messages from the client
    ws.on('message', async(message) => {
      console.log('Received message:', message.toString());
      // ws.send(`Reply from server - ${message}`);
      const jsonData = JSON.parse(message);

            if (jsonData.type === 'url_list'){
              const result = jsonData.data;
              // await runChecker(ws,result);
              await check_speed(result,ws);
            }
    });
    
    app.get('/run-code', async (req, res) => {
        try {
          // await runChecker(ws);
          res.send('Code execution completed successfully.123');
        } catch (error) {
          res.status(500).send('An error occurred during code execution.');
        }
      });
    // Simulate sending data to the client
  //   setInterval(() => {
  //     const randomData = Math.random();
  //     ws.send(randomData.toString()); // Send data to the client
  //   }, 2000);
  });

async function runChecker(ws,result) {

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

// function processUrls(urlsArray) {
//   urlsArray.forEach((url) => {
//     console.log('Processing URL:', url);
//   });
// }

// app.listen(port, () => {
//   console.log(`App listening at http://localhost:${port}`);
// });

server.listen(process.env.PORT || port, () => {
    console.log(`App ${process.env.PORT || port} listening at https://localhost:${port}`);
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
        const browser = await puppeteer.launch({
          args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
          ],
          executablePath: 
            process.env.NODE_ENV === "production"
              ? process.env.PUPPETEER_EXECUTABLE_PATH
              : puppeteer.executablePath(),
        });

        for (let index = 0; index < linesArray.length; index++) {
          const url = linesArray[index];
          console.log(`Processing URL[${index+1}] : ${url}`);
          // ws.send(`Processing URL[${index+1}] : ${url}`);
          ws.send(JSON.stringify({ type: 'url', index: index, url: url }));
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
          // ws.send('Mobile Performance :' + mobile_performance);
          //await page.screenshot({path: `./results/${index+1}_Mobile.png`});

          // const screenshotBuffer = await page.screenshot({ encoding: 'binary' });
          // const screenshot = await page.screenshot({ type: "png" });
          // const screenshotData = screenshot.toString("base64");

          // ws.send(screenshotData);

          try {
            await page.evaluate(() => {
              const elementToRemove = document.querySelector('.glAfi');
              if (elementToRemove) {
                elementToRemove.remove();
              }
            });
            console.log('Popup Removed !');
          } catch (error) {
            console.log('No popup occured !');
          }

          const screenshotBuffer = await page.screenshot({ encoding: 'binary' });

          // ws.send(screenshotBuffer, { binary: true });
          const screenshotBase64 = screenshotBuffer.toString('base64');
          ws.send(JSON.stringify({ type: 'mobile', index:index , score:mobile_performance , image: screenshotBase64 }));

          // const payload = {
          //   type: 'image',
          //   data: screenshotData,
          // };
      
          // ws.send(JSON.stringify(payload));



          const desktopTab          = await page.$('#desktop_tab');
          await desktopTab.click();
          await page.waitForFunction(element => element.getAttribute('aria-selected') === 'true', {}, desktopTab);

          const attributeValue2     = 'desktop_tab';
          const parentElementId2    = '#performance';
          const combinedSelector2   = `[${attribute}="${attributeValue2}"] ${parentElementId2} .lh-gauge__percentage`;
          await page.waitForSelector(combinedSelector2, { timeout: timeOutMilliSeconds });
          const desktop_perfomance  = await page.$eval(combinedSelector2, div => div.textContent);
          console.log('Desktop Performance :', desktop_perfomance);
          // ws.send('Desktop Performance :' + desktop_perfomance);

          // await page.screenshot({path: `./results/${index+1}_Desktop.png`});
          try {
            await page.evaluate(() => {
              const elementToRemove = document.querySelector('.glAfi');
              if (elementToRemove) {
                elementToRemove.remove();
              }
            });
            console.log('Popup Removed !');
          } catch (error) {
            console.log('No popup occured !');
          }
          const screenshotBuffer2 = await page.screenshot({ encoding: 'binary' });

          // ws.send(screenshotBuffer, { binary: true });
          const screenshotBase642 = screenshotBuffer2.toString('base64');
          // ws.send(JSON.stringify({ type: 'image', data: screenshotBase642 }));
          ws.send(JSON.stringify({ type: 'desktop', index:index , score:desktop_perfomance , image: screenshotBase642 }));

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
