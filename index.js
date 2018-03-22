// ******************** Зависимости ******************** //
const events_1 = require("events");
let request = require('request');
let nodeBase64image = require('node-base64-image');

class B24botApi extends events_1.EventEmitter {

    constructor() {
        super();
    }

    // ******************** Контроллеры ******************** //
    // Post запросы к bitrix24
    restCommand(req, cb) {
        if (!req.method || !req.settings.access_token) {
            return console.error(`Not method ${req.method} or access_token ${req.settings.access_token}`);
        }

        let queryUrl  = `${req.url}/rest/${req.method}`;

        //console.log(`restCommand queryUrl: ${queryUrl}`);

        request.post(queryUrl, {form: req.settings}, (err, res, data) => {
            //console.log('err ', err);
            //console.log('data ', data);

            if (err) {
                if (cb) {
                    cb(err);
                }

                this.emit(req.method, err);

                return console.error(`Request err: ${err}`);
            }

            //console.log(`restCommand ${data}`);

            this.emit(req.method, null, data);

            if (cb) {
                cb(null, data)
            }
        });
    }

    // На обновление токенов
    onRefreshTokens(req, cb) {
        if (!req) return console.log('On refresh tokens. Not set req');
        if (!req.client_id)  return console.log('On refresh tokens. Not set client_id');
        if (!req.client_secret) return console.log('On refresh tokens. Not set client_secret');
        if (!req.refresh_token) return console.log('On refresh tokens. Not set refresh_tokens');

        let query = `https://oauth.bitrix.info/oauth/token/?grant_type=refresh_token&client_id=${req.client_id}&client_secret=${req.client_secret}&refresh_token=${req.refresh_token}`;
        request.get(query, (err, res, data) => {
            if (cb) return cb(err, data);
        });
    }

    // На удаление приложения
    onAppUninstall(req, cb) {
        if (!req.url) {
            console.error(`onAppUninstall not found req.url [${req.url}]`);
            return false;
        }
        req.method = 'imbot.unregister';
        this.restCommand(req, cb);
    }

    // На установку приложения
    onAppInstall(req, cb) {
        if (!req.url) {
            console.error(`onAppInstall not found req.url [${req.url}]`);
            return false;
        }

        req.method = 'imbot.register';

        if (req && req.settings && req.settings.PROPERTIES && 
            req.settings.PROPERTIES.PERSONAL_PHOTO) {

            nodeBase64image.encode(req.settings.PROPERTIES.PERSONAL_PHOTO, { string: true, local: false }, (err, data) => {
                if (err) {
                    return console.error(`onAppInstall nodeBase64image.encode err: ${err}`);
                }
                req.settings.PROPERTIES.PERSONAL_PHOTO = data || "";

                this.restCommand(req, cb);
            });
        } else {
            this.restCommand(req, cb);
        }
    }

    // На добавление в чат
    onImbotJoinChat(req, cb) {
        let request = {
            url: req.url,
            answer: 'Я - чат бот. Буду помогать вам.\nЧтобы я ответил в чате, упомяните меня в сообщении или кликните на мой аватар.',
            settings: {
                DIALOG_ID: req.body['data']['PARAMS']['FROM_USER_ID'],
                BOT_ID: req.body['data']['BOT'][0].BOT_ID,
                access_token: req.body['auth']['access_token']
            }
        };
        this.sendMessage(request, cb);
    }

    // На входящее сообщение
    onImbotMessageAdd(req, cb) {
        //console.log(req);
        //console.log('onImbotMessage add req ', req);
        //console.log(req);
        //this.sendMessage(req, cb);
    }

    // На удаление приложения
    onImbotDelete(req, res) {
        console.log("Удаление чат бот");
    }

    // На обновление приложения
    onAppUpdate(req, res) {
        console.log("Обновление приложения");
    }

    // Обработчик команд
    onImCommandAdd(req, res) {
        console.log("Обработчик команд");
    }

    // ******************** Запросы для получения данных к bitrix24 ******************** //
    onB24request(req, cb) {
        //console.log('req: ', req);

        if (!('settings' in req)) return console.error('B24 request. Not set settings');
        if (!('method' in req)) return console.error('B24 request. Not set method');

        this.restCommand(req, cb);
    }

    // ******************** Сообщение ******************** //
    sendMessage(req, cb) {
        if (!req) return console.log('B24 sendMessage error: not found req');
        if (!req.url) return console.log('B24 sendMessage error: not found req.url');
        if (!req.answer) return console.log('B24 sendMessage error: not found req.answer');
        if (!req.settings) return console.log('B24 sendMessage error: not found req.settings');
        if (!req.settings.access_token) return console.log('B24 sendMessage error: not found req.settings.access_token');
        if (!req.settings.BOT_ID) return console.log('B24 sendMessage error: not found req.settings.BOT_ID');

        if (!req.settings['DIALOG_ID'] && (!req.body || !req.body['data'] || 
            !req.body['data']['PARAMS'] || !req.body['data']['PARAMS']['DIALOG_ID']) ) {
            return console.log('B24 sendMessage error: not found DIALOG_ID');
        }

        if (!req.settings['DIALOG_ID'] && req.body && req.body['data'] && req.body['data']['PARAMS'] && req.body['data']['PARAMS']['DIALOG_ID']) {
            req.settings['DIALOG_ID'] = req.body['data']['PARAMS']['DIALOG_ID'];
        }
        req.settings['MESSAGE'] = req.answer;
        req.method = 'imbot.message.add';

        this.restCommand(req, cb);
    }

    // ******************** OAuth авторизация ******************** //
    onOAuth(req, cb) {
        if ( ('code' in req.query) && ('state' in req.query) &&
            ('domain' in req.query) && ('member_id' in req.query) &&
            ('scope' in req.query) && ('server_domain' in req.query) &&
            ('url' in req) ) {

            let url = `${req.url}/oauth/token/?client_id=${req.clientId}&grant_type=authorization_code&client_secret=${req.clientSecret}&redirect_uri=${req.url}&code=${req.query['code']}&scope=${req.query['scope']}`;

            console.log(`B24 request oauth \nurl: ${url}`);

            request(url, (err, res, data) => {
                if (err) {
                    console.log('Bitrix24 request error: ' + err);
                    this.emit('oauth', err);

                    if (cb) {
                        cb(err);
                    }
                } else {
                    console.log(`B24 response oauth \n: ${data}`);

                    try {
                        data = JSON.parse(data);
                    } catch(err) {
                        console.log('B24 bot api onOAuth JSON.parse error ', err);
                        return cb(err);
                    }

                    this.emit('oauth', null, data);
                }
                if (cb) {
                    cb(null, data);
                }
            });
        }
    }
}

// ******************** API модуля ******************** //
module.exports.B24botApi = B24botApi;

// module.exports.onAppInstall      = onAppInstall;
// module.exports.onAppUpdate       = onAppUpdate;
// module.exports.onImCommandAdd    = onImCommandAdd;
// module.exports.onImbotJoinChat   = onImbotJoinChat;
// module.exports.onImbotMessageAdd = onImbotMessageAdd;
// module.exports.onImbotDelete     = onImbotDelete;
// module.exports.sendMessage       = sendMessage;
// module.exports.onB24request      = onB24request;
// module.exports.onOAuth           = onOAuth;