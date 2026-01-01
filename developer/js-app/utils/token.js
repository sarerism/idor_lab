const oidc_app_cid = process.env.INTROSPECTION_APP_CLIENTID;
const oidc_app_cs = process.env.INTROSPECTION_APP_CLIENTSECRET;
const tokenIntrospection = require('token-introspection');
/**
* Token introspection for app
*/
let tokenIntrospectionWebApp = process.env.LOCAL_DEVELOPMENT ? null : tokenIntrospection({
    endpoint: process.env.INTROSPECTION_ENDPOINT,
    client_id: oidc_app_cid,
    client_secret: oidc_app_cs
});

/**
* Intern Token introspection for web app
*/
const checkToken = (req, res, next) => {
    if(process.env.LOCAL_DEVELOPMENT) return next();
    const webapp = req.headers['web-application'];
    const header = req.headers['authorization'];
    if (typeof header !== 'undefined' && typeof webapp !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        if (webapp.includes('webapp')) {
            tokenIntrospectionWebApp(token).then(() => {
                console.log('[Info][App] Successful introspection!');
                return next();
            }).catch(err => {
                console.log(err)
                res.status(401);
                return next();
            });
        } else {
            console.log('[Error] Header "web-application" is empty!');
            res.status(401);
        }
    } else {
        console.log('[Error] Unautorized request without "Bearer"!');
        res.sendStatus(401);
    }
};

module.exports = { checkToken };