/**
 * Const and modules 
 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
const compression = require('compression');
const port = 443;
// var cookieParser = require('cookie-parser');
require('dotenv').config();


const corsOptions = {
    origin: ['*', 'https://lampa-test.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'https://lampa-dev.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'http://localhost:4200','http://127.0.0.1:8082', 'https://app-lampa-dev-container.azurewebsites.net'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', "Cookie", "Set-Cookie", "X-Forwarded-Proto"],
    method: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    optionsSuccessStatus: 200
};


const oidc_app_cid = process.env.INTROSPECTION_APP_CLIENTID;
const oidc_app_cs = process.env.INTROSPECTION_APP_CLIENTSECRET;

/**
* Token introspection for app
*/
let tokenIntrospectionWebApp = require('token-introspection')({
    endpoint: process.env.INTROSPECTION_ENDPOINT,
    client_id: oidc_app_cid,
    client_secret: oidc_app_cs
});

/**
* Intern Token introspection for web app
*/
const checkToken = (req, res, next) => {
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
}

const startServer = () => {
    const pg = require('pg').Pool;
    const postgresSQL = new pg({
        host: process.env.POSTGRES_HOST,
        port:  parseInt(process.env.POSTGRES_PORT),
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PW,
        ssl: { mode: 'prefer' }
        
    });
    
    // app.use(cookieParser());
    app.use(express.static(process.cwd() + "/"));
    app.use(compression());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '100mb', extended: true }));
    app.use(bodyParser.urlencoded({ limit: '100mb', extended: true,parameterLimit:50000 }));
    app.use(express.json({limit: '100mb'}));
    
    
    app.listen(port, async () => {
        console.log("Listening to port: " + port);
        app.locals.postgresSQL = postgresSQL;
    });
    
    /**
     * Start Angular App
     */
    app.get('/', async (req, res) => {
        const pool = req.app.locals.postgresSQL;
        const result = await pool.query("SELECT * FROM lampa.lampa_primus LIMIT 1");
        res.status(200).json({hello: "world", res: result.rows});
    });

    app.post('/api/getData', checkToken ,async (req,res) => {
        const pool = req.app.locals.postgresSQL;
        const result = await pool.query("SELECT * FROM lampa.lampa_primus LIMIT 3");
        res.status(200).json({hello: req.body.client, res: result.rows});
    });
};

/**
* Configure and start server
*/
(async () => {
    try {
        startServer();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();