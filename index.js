const puppeteer = require("puppeteer");
const https = require("https");
const schedule = require("node-schedule");
const axios = require('axios');
const fs = require("fs");
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
//This will run every 1 hour, 0th minute, 0th second( ex: execute at 1PM, 2PM, 3PM etc):
                                   
const job = schedule.scheduleJob("*/30 * * * *", function () {
  console.log("The answer to life, the universe, and everything!");
  console.log(new Date());
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const url = "https://www.briq.mx/proyectos";
    const notValidProject = "trust_rights";
    const divSearch = "div.hover-shadow-2 > a";
    const webHookURL = "https://hooks.slack.com/services/<ID>";
    const fileName = "validaciones.txt";

    try {
      await page.goto(url);

      const results = await page.$$eval(divSearch, (divs) =>
        divs.map((e) =>
          JSON.parse(e.getAttribute("data-project-clicked-tracker-event-data"))
        )
      );

      //validamos que existan campañas en la pagina y que no sean de de copropiedad y que aun esten activas
      if (results.length > 0) {
        const campaings = results.filter((e) => {
          const dateCampaing = new Date(e.target_date);
          const now = new Date();
          return (
            e.campaign_instrument !== notValidProject && dateCampaing > now
          );
        });

        //procedemos a notificar cada campaña que no lo haya sido
        if (campaings && campaings.length > 0) {
          const c_slugs = fs.readFileSync(fileName, "utf-8").split(",");

          campaings.forEach((campaign) => {
            //vaidamos si ya se notifico la campaña
            if (!c_slugs.includes(campaign.campaign_slug)) {
              fs.writeFileSync(fileName, campaign.campaign_slug + ",", {
                flag: "a+",
              });
              campaign.url = url + "/" + campaign.campaign_slug;
              console.log(
                "Notificando de nueva campaña " + campaign.campaign_name
              );
              sendTelegramMessage(campaign);
              sendSlackMessage(webHookURL, createMessage(campaign)).then(
                (slackResponse) => {
                  console.log("Message response", slackResponse);
                }
              );
            } else {
              console.log("Ya se ha notificado "+campaign.campaign_slug);
            }
          });
        } else {
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
    const webHookURL= 'https://hooks.slack.com/services/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';
    const fileName=  'validaciones.txt'  

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
              const c_slugs = fs.readFileSync(fileName, 'utf-8').split(',');
 
              campaings.forEach(campaign => {                               
                if(!c_slugs.includes(campaign.campaign_slug)){                  
                  fs.writeFileSync(fileName, campaign.campaign_slug+',',{flag:'a+'});                           
                  campaign.url =url+"/"+campaign.campaign_slug
                  console.log("Notificando de nueva campaña "+campaign.campaign_name);
                  sendTelegramMessage(campaign);
                  sendSlackMessage(webHookURL, createMessage(campaign)).then(slackResponse =>{
                    console.log('Message response', slackResponse);
                  });
                  
                }else{
                  
                  console.log("Ya se ha notificado "+campaign.campaign_slug);
                }                
              });              
                
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

*/

function createMessage(result) {
  const { campaign_name, campaign_rate, target_date, funding_progress, url } =
    result;
  return {
    text: ":dollar: Nuevo proyecto para invertir en Briq :money_mouth_face::eyes:", // text
    attachments: [
      {
        // this defines the attachment block, allows for better layout usage
        color: "#02CC86", // color of the attachments sidebar.
        fields: [
          // actual fields
          {
            title: "Campaña",
            value: campaign_name,
            short: true,
          },
          {
            title: "Tasa de interes",
            value: campaign_rate,
            short: true,
          },
          {
            title: "Porcentaje de Avance",
            value: funding_progress,
            short: true,
          },
          {
            title: "Fecha de Cierre",
            value: target_date,
            short: true,
          },
          {
            title: "Proyecto",
            value: "👉️ " + url,
            short: false,
          },
        ],
      },
    ],
  };
}

function sendTelegramMessage(campaign){
  
    const options = {
      method: 'POST',
      url:'https://api.telegram.org/bot5553104402%3AAAFuQuvFlX59MqLM_RhZ1fMPAJLHF_vSxQ8/sendMessage',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      data:{
        text: `📢📢📢📢📢📢📢📢📢📢📢📢📢📢
        <b>☘ Campaña: </b>${campaign.campaign_name}
        <b>🤑 Tasa de Interés: </b>${campaign.campaign_name}
        <b>Porcentaje de avance: </b>${campaign.funding_progress}%
        <b>Fecha de Cierre: </b>${campaign.target_date}
        <b>Proyecto: </b>",👉️ 
         ${campaign.url}`,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        disable_notification: false,
        reply_to_message_id: null,
        chat_id: '@Briqmxnot'
      }
    };



      axios
  .request(options)
  .then(function (response) {
    //console.log(response.data);
    console.log("mensaje enviado a Telegram");
  })
  .catch(function (error) {
    console.error(error);
  });
 
}

function sendSlackMessage(webhookURL, messageBody) {
  // make sure the incoming message body can be parsed into valid JSON
  try {
    messageBody = JSON.stringify(messageBody);
  } catch (e) {
    throw new Error("Failed to stringify messageBody", e);
  }

  // Promisify the https.request
  return new Promise((resolve, reject) => {
    // general request options, we defined that it's a POST request and content is JSON
    const requestOptions = {
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    };

    // actual request
    const req = https.request(webhookURL, requestOptions, (res) => {
      let response = "";

      res.on("data", (d) => {
        response += d;
      });

      // response finished, resolve the promise with data
      res.on("end", () => {
        resolve(response);
      });
    });

    // there was an error, reject the promise
    req.on("error", (e) => {
      reject(e);
    });

    // send our message body (was parsed to JSON beforehand)
    req.write(messageBody);
    req.end();
  });
}
