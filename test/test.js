// ************************ dependences ************************
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const b24lib = new require('../index.js');
const b24botApi = new b24lib.B24botApi();
const fs = require('fs');

// ************************ settings ************************
let clientId = 'local.5a8574efdd5835.52317922';
let clientSecret = '49dg014HyDY6xr1K2X4nbbb51MvE0yzm1w0avhKUBLYEIL58pe';
let myDomain = 'http://vkvote.kloud.one:8000';
let linkB24portal = 'https://komunikator.bitrix24.ru';

let pathToken = 'test/token.json';
let accessToken;
let refreshToken;
let botId;

// ************************ handler ************************
function queryHandler(req) {
    if (('headers' in req) && ('host' in req.headers) && ('path' in req) && ('protocol' in req)) {
        req.url = linkB24portal;

        if ( ('query' in req) && ('code' in req.query) ) {
            req.clientId = clientId;
            req.clientSecret = clientSecret;

            b24botApi.onOAuth(req);
        }
    }

    if (('body' in req) && ('event' in req.body)) {
        switch (req.body['event']) {
            case 'ONAPPINSTALL':
                b24botApi.onAppInstall(req);
                break;
            case 'ONIMBOTJOINCHAT':
                b24botApi.onImbotJoinChat(req);
                break;
            case 'ONIMBOTMESSAGEADD':
                req.message = req.body['data']['PARAMS']['MESSAGE'];
                req.answer = `Ответ на сообщение ${req.message}`;
                req.settings = {
                    access_token: req.body.auth.access_token
                }
                req.url = linkB24portal;

                b24botApi.onImbotMessageAdd(req);

                /*
                // тест формирования ответа с нуля
                let testReq = {
                    url: linkB24portal,
                    answer: 'Тестовое сообщение без запроса',
                    settings: {
                        access_token: accessToken
                    }
                };
                b24botApi.onImbotMessageAdd(testReq);
                */
                break;
            case 'ONIMBOTDELETE':
                b24botApi.onImbotDelete(req);
                break;
            case 'ONAPPUPDATE':
                b24botApi.onAppUpdate(req);
                break;
            case 'ONIMCOMMANDADD':
                b24botApi.onImCommandAdd(req);
                break;
            default:
                console.log('default: ' + req.body['event']);
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
    res.redirect(`${linkB24portal}/oauth/authorize/?client_id=${clientId}&response_type=code&redirect_uri=${myDomain}`);

    /*
    https://komunikator.bitrix24.ru/oauth/authorize/?client_id=local.5a8574efdd5835.52317922&response_type=code&redirect_uri=vkvote.kloud.one
    */
});

app.listen(8008, function() {
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
                    'accessToken': accessToken,
                    'refreshToken':  refreshToken
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

    it('B24 test register', (done) => {
        function getAndSetToken() {
            if (fs.existsSync(pathToken) ) {
                console.log('exists');

                let token = JSON.parse( fs.readFileSync(pathToken, 'utf8') );

                accessToken = token.accessToken;
                refreshToken = token.refreshToken;

                console.log(accessToken);
                console.log(refreshToken);
            } else {
                return done('Not exists token');
            }
        }

        getAndSetToken();

        if (!accessToken || !refreshToken) {
            return done('Not accesstoken and refreshtoken')
        }

        let req = {
            url: linkB24portal,
            settings: {
                access_token: accessToken,
                CODE: 'test3',
                TYPE: 'B',
                EVENT_MESSAGE_ADD: myDomain,
                EVENT_WELCOME_MESSAGE: myDomain,
                EVENT_BOT_DELETE: myDomain,
                PROPERTIES: {
                    NAME: 'NAME test3',
                    LAST_NAME: 'LAST_NAME test3',
                    COLOR: 'AQUA',
                    EMAIL: 'no@mail.com',
                    PERSONAL_BIRTHDAY: '2018-02-16',
                    WORK_POSITION: '',
                    PERSONAL_WWW: '',
                    PERSONAL_GENDER: 'M',
                    PERSONAL_PHOTO: 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300'
                }
            }
        };

        function onAppInstall(err, data) {
            if (err) {
                console.error(err);
                return done(err);
            }

            data = JSON.parse(data);

            console.log(`imbot.register data: ${data}`);
            console.log(data);

            if (data.result) {
                console.log(`data.result: ${data.result}`);
                botId = data.result;
                return done();
            } else {
                botId = null;
                accessToken = false;
                refreshToken = false;
                return done('not found data.result');
            }
        }

        b24botApi.onAppInstall(req, onAppInstall);
    });

    it('B24 test get tasks', (done) => {
        function getB24tasks() {
            return new Promise((resolve, reject) => {
                let req = {
                    url: linkB24portal,
                    settings: {
                        access_token: accessToken,
                        method: 'task.item.list',
                        ORDER: {
                            DEADLINE: 'desc'
                        },
                        FILTER: {
                            RESPONSIBLE_ID: 34,
                            '<DEADLINE': '2018-01-30'
                        },
                        PARAMS: {
                            NAV_PARAMS: {
                                nPageSize: 1,
                                iNumPage: 1
                            }
                        },
                        SELECT: ['TITLE']
                    }
                };

                b24botApi.onB24request(req, function(err, data) {
                    if (err) {
                        console.error(err);
                        return done(err);
                    }
        
                    data = JSON.parse(data);
        
                    console.log(`get tasks data: ${data}`);
        
                    if (data.result) {
                        console.log(`data.result: ${data.result}`);
                        return done();
                    } else {
                        return done('not found data.result');
                    }
                });
            });
        }

        getB24tasks();
    });

    it('B24 test unregister', (done) => {
        if (!accessToken || !refreshToken || !botId) {
            return done('not accesstoken or refreshtoken or botId')
        }

        console.log(`unregister BOT ID ${botId}`);

        let req = {
            url: linkB24portal,
            settings: {
                BOT_ID: botId,
                access_token: accessToken
            }

        };

        function onAppUninstall(err, data) {
            if (err) {
                console.error(err);
                return done(err);
            }

            data = JSON.parse(data);

            console.log(`imbot.unregister data: ${data}`);

            if (data.result) {
                console.log(`data.result: ${data.result}`);
                return done();
            } else {
                return done('not found data.result');
            }
        }

        b24botApi.onAppUninstall(req, onAppUninstall);
    });
});