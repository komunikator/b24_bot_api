// ************************ dependences ************************
const b24handlers = require('../index.js');
const express = require('express');
const bodyParser = require('body-parser');

// ************************ settings ************************
let clientId = "local.5a67094a5700c1.50706248";
let clientSecret = "GX7NjgT2rHRWVOsRAQmeKSuKh3KbaoBc3GBe25bQymBOkys4wF";
let myDomain = 'vkvote.kloud.one';
let b24portal = 'https://komunikator.bitrix24.ru';

let user1 = {
    settings: {
        "CODE": "iBendere",
        "TYPE": "B",
        "EVENT_MESSAGE_ADD": "",
        "EVENT_WELCOME_MESSAGE": "",
        "EVENT_BOT_DELETE": "",
        "PROPERTIES": {
            "NAME": "NAME1",
            "LAST_NAME": "LAST_NAME",
            "COLOR": "AQUA",
            "EMAIL": "no@mail.com",
            "PERSONAL_BIRTHDAY": "2018-02-15",
            "WORK_POSITION": "",
            "PERSONAL_WWW": "",
            "PERSONAL_GENDER": "M",
            "PERSONAL_PHOTO": "https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300" // url image
        }
    }
};

// ************************ express ************************
let app = express(); 

app.use(bodyParser.urlencoded({     
    extended: true   
})); 

app.use(bodyParser.json()); 

app.all('/', function (req, res) {     
    console.log('HTTP request');
    queryHandler(req, res); 
}); 

app.get('/install', function(req, res) {
    res.redirect(`${b24portal}/oauth/authorize/?client_id=${clientId}&response_type=code&redirect_uri=${myDomain}`);
});

app.listen(8000);

// ************************ Handler ************************
function queryHandler(req) {
    if (("headers" in req) && ("host" in req.headers) && ("path" in req) && ("protocol" in req)) {
        req.url = req.protocol + "://" + req.headers.host + req.path;

        if ( ("query" in req) && ("code" in req.query) ) {
            req.clientId = clientId;
            req.clientSecret = clientSecret;

            b24Handlers.onOAuth(req);
        }
    }

    if (("body" in req) && ("event" in req.body)) {
        switch (req.body["event"]) {
            case "ONAPPINSTALL":
                b24Handlers.onAppInstall(req);
                break;
            case "ONIMBOTJOINCHAT":
                b24Handlers.onImbotJoinChat(req);
                break;
            case "ONIMBOTMESSAGEADD":
                req.message = req.body["data"]["PARAMS"]["MESSAGE"];
                req.answer = `Ответ на сообщение ${req.message}`;
                b24Handlers.onImbotMessageAdd(req);
                break;
            case "ONIMBOTDELETE":
                b24Handlers.onImbotDelete(req);
                break;
            case "ONAPPUPDATE":
                b24Handlers.onAppUpdate(req);
                break;
            case "ONIMCOMMANDADD":
                b24Handlers.onImCommandAdd(req);
                break;
            default:
                console.log("default: " + req.body["event"]);
                break;
        }
    }
};

// ************************ Tests ************************
describe('B24 tests', () => {
    it('', (done) => {

        done();
    });
});