// ************************ dependences ************************
const b24handlers = require('../index.js');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

// ************************ settings ************************
let clientId = "local.5a8574efdd5835.52317922";
let clientSecret = "49dg014HyDY6xr1K2X4nbbb51MvE0yzm1w0avhKUBLYEIL58pe";
let myDomain = 'vkvote.kloud.one';
let b24portal = 'https://komunikator.bitrix24.ru';

let user1 = {
    settings: {
        "CODE": "test3",
        "TYPE": "B",
        "EVENT_MESSAGE_ADD": "",
        "EVENT_WELCOME_MESSAGE": "",
        "EVENT_BOT_DELETE": "",
        "PROPERTIES": {
            "NAME": "NAME test3",
            "LAST_NAME": "LAST_NAME test3",
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

// ************************ Handler ************************
function queryHandler(req) {
    if (("headers" in req) && ("host" in req.headers) && ("path" in req) && ("protocol" in req)) {
        req.url = req.protocol + "://" + req.headers.host + req.path;

        if ( ("query" in req) && ("code" in req.query) ) {
            req.clientId = clientId;
            req.clientSecret = clientSecret;

            b24handlers.onOAuth(req);
        }
    }

    if (("body" in req) && ("event" in req.body)) {
        switch (req.body["event"]) {
            case "ONAPPINSTALL":
                b24handlers.onAppInstall(req);
                break;
            case "ONIMBOTJOINCHAT":
                b24handlers.onImbotJoinChat(req);
                break;
            case "ONIMBOTMESSAGEADD":
                req.message = req.body["data"]["PARAMS"]["MESSAGE"];
                req.answer = `Ответ на сообщение ${req.message}`;
                b24handlers.onImbotMessageAdd(req);
                break;
            case "ONIMBOTDELETE":
                b24handlers.onImbotDelete(req);
                break;
            case "ONAPPUPDATE":
                b24handlers.onAppUpdate(req);
                break;
            case "ONIMCOMMANDADD":
                b24handlers.onImCommandAdd(req);
                break;
            default:
                console.log("default: " + req.body["event"]);
                break;
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
    /*
    https://komunikator.bitrix24.ru/oauth/authorize/?client_id=local.5a8574efdd5835.52317922&response_type=code&redirect_uri=vkvote.kloud.one
    */
});

app.listen(8000, function() {
    console.log('Listen port 8000');
});

// ************************ Tests ************************
describe('B24 tests', () => {
    it('B24 test install', (done) => {
        // request     

        done();
    });
});