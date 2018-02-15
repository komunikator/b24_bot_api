// ******************** Зависимости ******************** //
let request = require('request');
let nodeBase64image = require('node-base64-image');

// ******************** Контроллеры ******************** //
// Post запросы к bitrix24
function restCommand(method, params, auth, cb) {
    if (!method || !params || !auth) {
        return console.error(`Not method ${method} or params ${params} or auth ${auth}`);
    }

    let queryUrl  = `https://${auth['domain']}/rest/${method}`;

    params['access_token'] = auth['access_token'];

    request.post(queryUrl, {form: params}, function (err, res, data) {
        if (err) {
            if (cb) {
                cb(err)
            }
            return console.error(`Request err: ${err}`);
        }

        if (cb) {
            cb(null, data)
        }
    });
}

// На установку приложения
function onAppInstall(req) {
    if (!req.url) return false;

    if (req && req.settings && req.settings.PROPERTIES && 
        req.settings.PROPERTIES.PERSONAL_PHOTO) {

        nodeBase64image.encode(req.settings.PROPERTIES.PERSONAL_PHOTO, { string: true, local: false }, function (err, data) {
            if (err) {
                return console.error("err: ", err);
            }
            req.settings.PROPERTIES.PERSONAL_PHOTO = data || "";
            restCommand('imbot.register', req.settings, req.body['auth']);
        });
    } else {
        restCommand('imbot.register', req.settings, req.body['auth']);
    }
}

// На добавление в чат
function onImbotJoinChat(req, res) {
    let msg = "Я - чат бот. Буду помогать вам.\nЧтобы я ответил в чате, упомяните меня в сообщении или кликните на мой аватар.";
    sendMessage(msg, req);
}

// Входящее сообщение от пользователя
function onImbotMessageAdd(req, res) {
    sendMessage(req.answer, req);
}

// На удаление приложения
function onImbotDelete(req, res) {
    console.log("Удаление чат бот");
}

// На обновление приложения
function onAppUpdate(req, res) {
    console.log("Обновление приложения");
}

// Обработчик команд
function onImCommandAdd(req, res) {
    console.log("Обработчик команд");
}

// ******************** Запросы для получения данных к bitrix24 ******************** //
function onB24request(req, cb) {
    if (!('params' in req)) return console.error('B24 request. Not set params');
    if (!('method' in req.params)) return console.error('B24 request. Not set method');

    req.params.auth = req.body["auth"]["access_token"];

    restCommand(req.params.method, req.params, req.body["auth"], cb);
}

// ******************** Сообщение ******************** //
function sendMessage(msg, req) {
    let answer = {
        "DIALOG_ID": req.body['data']['PARAMS']['DIALOG_ID'],
        "MESSAGE": msg

    };

    restCommand('imbot.message.add', answer, req.body["auth"]);
}

// ******************** OAuth авторизация ******************** //
function onOAuth(req) {
    if ( ('code' in req.query) && ('state' in req.query) &&
         ('domain' in req.query) && ('member_id' in req.query) &&
         ('scope' in req.query) && ('server_domain' in req.query) &&
         ('url' in req) ) {

        let url = `https://${req.query['domain']}/oauth/token/?client_id=${req.clientId}&grant_type=authorization_code&client_secret=${req.clientSecret}&redirect_uri=${req.url}&code=${req.query['code']}&scope=${req.query['scope']}`;

        console.log(`B24 request oauth \nurl: ${url}`);

        request(url, function (err, res, data) {
            if (err) {
                console.log('Bitrix24 request error: ' + err);
            } else {
                console.log(`B24 response oauth \ndata: ${data}`);
                console.log(data);

                data = JSON.parse(data);

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

// ******************** API модуля ******************** //
module.exports.onAppInstall      = onAppInstall;
module.exports.onAppUpdate       = onAppUpdate;
module.exports.onImCommandAdd    = onImCommandAdd;
module.exports.onImbotJoinChat   = onImbotJoinChat;
module.exports.onImbotMessageAdd = onImbotMessageAdd;
module.exports.onImbotDelete     = onImbotDelete;
module.exports.sendMessage       = sendMessage;
module.exports.onB24request      = onB24request;
module.exports.onOAuth           = onOAuth;