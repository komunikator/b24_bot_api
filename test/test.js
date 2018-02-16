// ************************ dependences ************************
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const b24lib = new require('../index.js');
const b24botApi = new b24lib.B24botApi();
const fs = require('fs');

// ************************ settings ************************
let clientId = "local.5a8574efdd5835.52317922";
let clientSecret = "49dg014HyDY6xr1K2X4nbbb51MvE0yzm1w0avhKUBLYEIL58pe";
let myDomain = 'vkvote.kloud.one';
let b24portal = 'https://komunikator.bitrix24.ru';

let pathToken = 'test/token.json';
let accessToken;
let refreshToken;

// ************************ handler ************************
function queryHandler(req) {
    if (("headers" in req) && ("host" in req.headers) && ("path" in req) && ("protocol" in req)) {
        req.url = req.protocol + "://" + req.headers.host + req.path;

        if ( ("query" in req) && ("code" in req.query) ) {
            req.clientId = clientId;
            req.clientSecret = clientSecret;

            b24botApi.onOAuth(req);
        }
    }

    if (("body" in req) && ("event" in req.body)) {
        switch (req.body["event"]) {
            case "ONAPPINSTALL":
                b24botApi.onAppInstall(req);
                break;
            case "ONIMBOTJOINCHAT":
                b24botApi.onImbotJoinChat(req);
                break;
            case "ONIMBOTMESSAGEADD":
                req.message = req.body["data"]["PARAMS"]["MESSAGE"];
                req.answer = `Ответ на сообщение ${req.message}`;
                b24botApi.onImbotMessageAdd(req);
                break;
            case "ONIMBOTDELETE":
                b24botApi.onImbotDelete(req);
                break;
            case "ONAPPUPDATE":
                b24botApi.onAppUpdate(req);
                break;
            case "ONIMCOMMANDADD":
                b24botApi.onImCommandAdd(req);
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

// ************************ tests ************************
describe('B24 tests', () => {
    it('B24 test oauth', (done) => {
        // ************************ b24botapi handlers ************************
        b24botApi.on('oauth', (err, data) => {
            if (err) {
                console.error(err);
                return done(err);
            }

            console.log(data);

            function writeToken() {
                let token = {
                    "accessToken": accessToken,
                    "refreshToken":  refreshToken
                }
                fs.writeFileSync(pathToken, JSON.stringify(token));
            }

            accessToken = data.access_token;
            refreshToken = data.refresh_token;

            writeToken();
            console.log(`\n accessToken: ${accessToken}, \n refreshToken: ${refreshToken}`);
            done();
        });

        function isExistsTokens() {
            if (fs.existsSync(pathToken) ) {
                console.log('exists tokens');

                let token = JSON.parse( fs.readFileSync(pathToken, 'utf8') );

                console.log('token ', token);

                if ( (token.accessToken) && (token.refreshToken) ) {
                    console.log('exists token accessToken ', token.accessToken);
                    console.log('exists token refreshToken ', token.refreshToken);
                    return true;
                }

                return false;
            } else {
                console.log('not exists');
                return false;
            }
        }

        if ( isExistsTokens() ) {
            done();
        } else {
            console.log('not exists token');
        }
    });

    it('B24 test install', (done) => {
        function getAndSetToken() {
            if (fs.existsSync(pathToken) ) {
                console.log('exists');

                let token = JSON.parse( fs.readFileSync(pathToken, 'utf8') );

                accessToken = token.accessToken;
                refreshToken = token.refreshToken;

                console.log(accessToken);
                console.log(refreshToken);
            } else {
                console.log('not exists');
                return done('not exists token');
            }
        }

        getAndSetToken();

        if (!accessToken || !refreshToken) {
            return done('not accesstoken and refreshtoken')
        }

        let req = {};
        req['body'] = [];
        req['body']['auth'] = {
            domain: b24portal,
            access_token: accessToken
        };
        req['body']['event'] = "ONAPPINSTALL";
        req['url'] = myDomain;
        req['settings'] = {
            "CODE": "test3",
            "TYPE": "B",
            "EVENT_MESSAGE_ADD": myDomain,
            "EVENT_WELCOME_MESSAGE": myDomain,
            "EVENT_BOT_DELETE": myDomain,
            "PROPERTIES": {
                "NAME": "NAME test3",
                "LAST_NAME": "LAST_NAME test3",
                "COLOR": "AQUA",
                "EMAIL": "no@mail.com",
                "PERSONAL_BIRTHDAY": "2018-02-16",
                "WORK_POSITION": "",
                "PERSONAL_WWW": "",
                "PERSONAL_GENDER": "M",
                "PERSONAL_PHOTO": "https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300" // url image
            }
        };

        b24botApi.onAppInstall(req);
    });
});