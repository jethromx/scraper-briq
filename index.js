const puppeteer = require('puppeteer');
const https = require('https');
const schedule = require('node-schedule');

/*
1    *    *    *    *    *
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)

*/
const job = schedule.scheduleJob('1 * * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = "https://www.briq.mx/proyectos";    
        const notValidProject = 'trust_rights';
        const divSearch= "div.hover-shadow-2 > a";
        const webHookURL= 'https://hooks.slack.com/services/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'   
    
    
        try {
            await page.goto(url);
    
            const results = await page
            .$$eval(divSearch, divs => divs.map(e => JSON.parse(e.getAttribute('data-project-clicked-tracker-event-data')) ));
    
    
            if(results.length>0){            
                const campaings= results.filter(e=>{
                    
                    const dateCampaing = new Date(e.target_date);
                    const now = new Date();
    
                    return e.campaign_instrument!== notValidProject && ( dateCampaing > now)
                })
    
                if(campaings && campaings.length > 0){
                    let campaign =results[0];           
                    campaign.url ="https://www.briq.mx/proyectos/"+campaign.campaign_slug
                    console.log(campaign);
                    const slackResponse = await sendSlackMessage(webHookURL, createMessage(campaign));
                    console.log('Message response', slackResponse);
                }else{
                    console.log("No hay proyectos disponibles");
                }
                
                
    
    
    
                
            }
            
        } catch (error) {
            console.log("**************************");
            console.log(error);
        }
    
        await browser.close();
    
    
        
    })();

  });

/*
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = "https://www.briq.mx/proyectos";    
    const notValidProject = 'trust_rights';
    const divSearch= "div.hover-shadow-2 > a";
    const webHookURL= 'https://hooks.slack.com/services/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'   


    try {
        await page.goto(url);

        const results = await page
        .$$eval(divSearch, divs => divs.map(e => JSON.parse(e.getAttribute('data-project-clicked-tracker-event-data')) ));


        if(results.length>0){            
            const campaings= results.filter(e=>{
                
                const dateCampaing = new Date(e.target_date);
                const now = new Date();

                return e.campaign_instrument!== notValidProject && ( dateCampaing > now)
            })

            if(campaings && campaings.length > 0){
                let campaign =results[0];           
                campaign.url ="https://www.briq.mx/proyectos/"+campaign.campaign_slug
                console.log(campaign);
                const slackResponse = await sendSlackMessage(webHookURL, createMessage(campaign));
                console.log('Message response', slackResponse);
            }else{
                console.log("No hay proyectos disponibles");
            }
            
            



            
        }
        
    } catch (error) {
        console.log("**************************");
        console.log(error);
    }

    await browser.close();


    
})();*/


function createMessage(result){
    const {campaign_name,campaign_rate,target_date,funding_progress,url } = result;
    return {
        "text": ":dollar: Nuevo proyecto para invertir en Briq :money_mouth_face::eyes:", // text        
        "attachments": [{ // this defines the attachment block, allows for better layout usage
          "color": "#02CC86", // color of the attachments sidebar.
          "fields": [ // actual fields
            {
              "title": "Campaña",
              "value": campaign_name, 
              "short": true 
            },
            {
                "title": "Tasa de interes",
                "value": campaign_rate, 
                "short": true 
              },
              {
                "title": "Porcentaje de Avance",
                "value": funding_progress, 
                "short": true 
              },
            {
              "title": "Fecha de Cierre",
              "value": target_date,
              "short": true
            },
            {
                "title": "Proyecto",
                "value": "👉️ "+ url,
                "short": false
              }

            
          ]
        }]
      };

}

function sendSlackMessage (webhookURL, messageBody) {
    // make sure the incoming message body can be parsed into valid JSON
    try {
      messageBody = JSON.stringify(messageBody);
    } catch (e) {
      throw new Error('Failed to stringify messageBody', e);
    }
  
    // Promisify the https.request
    return new Promise((resolve, reject) => {
      // general request options, we defined that it's a POST request and content is JSON
      const requestOptions = {
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        }
      };
  
      // actual request
      const req = https.request(webhookURL, requestOptions, (res) => {
        let response = '';
  
  
        res.on('data', (d) => {
          response += d;
        });
  
        // response finished, resolve the promise with data
        res.on('end', () => {
          resolve(response);
        })
      });
  
      // there was an error, reject the promise
      req.on('error', (e) => {
        reject(e);
      });
  
      // send our message body (was parsed to JSON beforehand)
      req.write(messageBody);
      req.end();
    });
  }