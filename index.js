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
    restCommand(method, params, auth, cb) {
        if (!method || !params || !auth) {
            return console.error(`Not method ${method} or params ${params} or auth ${auth}`);
        }

        let queryUrl  = `${auth['domain']}/rest/${method}`;

        params['access_token'] = auth['access_token'];

        console.log(`restCommand: ${queryUrl} \nparams: ${params}`);

        request.post(queryUrl, {form: params}, (err, res, data) => {
            if (err) {
                if (cb) {
                    cb(err)
                }
                return console.error(`Request err: ${err}`);
            }

            console.log(`restCommand ${data}`);

            if (cb) {
                cb(null, data)
            }
        });
    }

    // На установку приложения
    onAppInstall(req) {
        if (!req.url) {
            console.error(`onAppInstall not found req.url [${req.url}]`);
            return false;
        }

        if (req && req.settings && req.settings.PROPERTIES && 
            req.settings.PROPERTIES.PERSONAL_PHOTO) {

            nodeBase64image.encode(req.settings.PROPERTIES.PERSONAL_PHOTO, { string: true, local: false }, (err, data) => {
                if (err) {
                    return console.error(`onAppInstall nodeBase64image.encode err: ${err}`);
                }
                req.settings.PROPERTIES.PERSONAL_PHOTO = data || "";
                
                console.error(`onAppInstall nodeBase64image.data: ${data}`);

                this.restCommand('imbot.register', req.settings, req.body['auth']);
            });
        } else {
            this.restCommand('imbot.register', req.settings, req.body['auth']);
        }
    }

    // На добавление в чат
    onImbotJoinChat(req, res) {
        let msg = "Я - чат бот. Буду помогать вам.\nЧтобы я ответил в чате, упомяните меня в сообщении или кликните на мой аватар.";
        this.sendMessage(msg, req);
    }

    // Входящее сообщение от пользователя
    onImbotMessageAdd(req, res) {
        this.sendMessage(req.answer, req);
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
        if (!('params' in req)) return console.error('B24 request. Not set params');
        if (!('method' in req.params)) return console.error('B24 request. Not set method');

        req.params.auth = req.body["auth"]["access_token"];

        this.restCommand(req.params.method, req.params, req.body["auth"], cb);
    }

    // ******************** Сообщение ******************** //
    sendMessage(msg, req) {
        let answer = {
            "DIALOG_ID": req.body['data']['PARAMS']['DIALOG_ID'],
            "MESSAGE": msg

        };

        this.restCommand('imbot.message.add', answer, req.body["auth"]);
    }

    // ******************** OAuth авторизация ******************** //
    onOAuth(req) {
        if ( ('code' in req.query) && ('state' in req.query) &&
            ('domain' in req.query) && ('member_id' in req.query) &&
            ('scope' in req.query) && ('server_domain' in req.query) &&
            ('url' in req) ) {

            let url = `https://${req.query['domain']}/oauth/token/?client_id=${req.clientId}&grant_type=authorization_code&client_secret=${req.clientSecret}&redirect_uri=${req.url}&code=${req.query['code']}&scope=${req.query['scope']}`;

            console.log(`B24 request oauth \nurl: ${url}`);

            request(url, (err, res, data) => {
                if (err) {
                    console.log('Bitrix24 request error: ' + err);
                    this.emit('oauth', err);
                } else {
                    console.log(`B24 response oauth \n: ${data}`);

                    data = JSON.parse(data);

                    this.emit('oauth', null, data);

                    // let auth = {
                    //     domain: data['domain'],
                    //     access_token: data['access_token']
                    // };

                    // let newReq = [];
                    // newReq['body'] = [];
                    // newReq['body']['auth'] = auth;
                    // newReq['body']['event'] = "ONAPPINSTALL";
                    // newReq['url'] = req.url;
                    // newReq['settings'] = req.settings;

                    // onAppInstall(newReq);
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