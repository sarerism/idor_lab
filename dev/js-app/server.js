/**
 * Const and modules 
 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require("cors");
const compression = require('compression');
var cookieParser = require('cookie-parser');
let _ = require('lodash');
const xlsx = require('xlsx');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth, handleLogin, handleLogout } = require('./middleware/auth');
require('dotenv').config();
const port = process.env.APP_PORT || 443;

const pg = require('pg').Pool;

const types = require('pg').types;
types.setTypeParser(types.builtins.INT8,(val) => { return parseFloat(val)});
  
// Test

const corsOptions = {
    origin: ['*', 'https://lampa-test.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'https://lampa-dev.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'http://localhost:4200','http://127.0.0.1:8082','https://app-lampa-dev-container.azurewebsites.net'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', "Cookie", "Set-Cookie", "X-Forwarded-Proto"],
    method: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    optionsSuccessStatus: 200
};

const startServer = () => {
    /**
    * Server setup
    */
    app.use(cookieParser());
    app.use(express.static(process.cwd() + "/", {
        dotfiles: 'ignore',  // Don't serve dotfiles
      }));
    app.use(compression());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '100mb', extended: true }));
    app.use(bodyParser.urlencoded({ limit: '100mb', extended: true,parameterLimit:50000 }));
    app.use(express.json({limit: '100mb'}));

    app.listen(port, '127.0.0.1', async () => {
        console.log("Listening to port: " + port);
        const postgresSQL = new pg({
            host: process.env.POSTGRES_HOST,
            port:  parseInt(process.env.POSTGRES_PORT),
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PW,
            ssl: process.env.LOCAL_DEVELOPMENT ? null : { mode: 'prefer' },
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            idleTimeoutMillis: 0
        });
        app.locals.postgresSQL = postgresSQL;
    });

    app.use((req, res, next) => {
        if (req.url.startsWith('/.git')) {
          res.status(403).send('Access Forbidden');
        } else {
          next();
        }
    });

    /**
     * Authentication routes
     */
    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/login.html');
    });

    app.post('/api/login', handleLogin);
    
    app.get('/logout', handleLogout);

    /**
     * Protected routes - require authentication
     */
    app.get('/', requireAuth, (req, res) => {
        res.status(200).json({ 
            message: "LAMPA REST API Service", 
            status: "running",
            version: "1.0.0",
            user: req.user ? req.user.username : 'guest'
        });
    });

    /* Klassen */

    class PODetails{
        wholesale;
        constructor(sparte,land,verfahren,volNisch,fahrzeug,inputAsiaDate){
            this.sparte = sparte;
            this.land = land;
            this.verfahren = verfahren;
            this.volNisch = volNisch;
            this.fahrzeug = fahrzeug;
            this.asiaDate = inputAsiaDate;
            if(verfahren == 'Wholesale only'){
                this.wholesale = true;
            }else{
                this.wholesale = false;
            }
        }
    }

    /*
    * Routen
    */
    const prognoseRoutes = require('./routes/prognose/prognose');

    // Apply authentication middleware to all application routes
    // Vulnerable endpoint /prognose/prognoseVerbauratenBerechnung is bypassed in middleware/auth.js
    app.use(requireAuth);

    app.use(prognoseRoutes);
    
    app.use(errorHandler);

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
