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

        console.log(`restCommand queryUrl: ${queryUrl}`);

        request.post(queryUrl, {form: req.settings}, (err, res, data) => {
            if (err) {
                if (cb) {
                    cb(err)
                }

                this.emit(req.method, err);

                return console.error(`Request err: ${err}`);
            }

            console.log(`restCommand ${data}`);

            this.emit(req.method, null, data);

            if (cb) {
                cb(null, data)
            }
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
        req.answer = 'Я - чат бот. Буду помогать вам.\nЧтобы я ответил в чате, упомяните меня в сообщении или кликните на мой аватар.';
        this.sendMessage(req, cb);
    }

    // На входящее сообщение
    onImbotMessageAdd(req, cb) {
        console.log('onImbotMessage add req ', req);
        console.log(req);
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
        if (!('settings' in req)) return console.error('B24 request. Not set settings');
        if (!('method' in req)) return console.error('B24 request. Not set method');

        this.restCommand(req, cb);
    }

    // ******************** Сообщение ******************** //
    sendMessage(req, cb) {
        req.settings['DIALOG_ID'] = req.settings['DIALOG_ID'] || req.body['data']['PARAMS']['DIALOG_ID'];
        req.settings['MESSAGE'] = req.answer;
        req.method = 'imbot.message.add';

        console.log('DIALOG_ID: ', req.settings['DIALOG_ID']);

        this.restCommand(req, cb);
    }

    // ******************** OAuth авторизация ******************** //
    onOAuth(req) {
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
                } else {
                    console.log(`B24 response oauth \n: ${data}`);

                    data = JSON.parse(data);

                    this.emit('oauth', null, data);
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