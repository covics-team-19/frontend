const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();

const DIST_PATH = 

/* if (process.env.NODE_ENV === 'production') {
    logger.debug('httpsRedirect');
    app.use(httpsRedirect);
} */

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(DIST_PATH));

logger.success('Added middlewares!!!');

/* ADDING ROUTES */

logger.hr();

logger.info('Adding routes...');
app.use('/api', routes());
logger.success('Added routes!!!');

/* STARTING SERVER */

logger.hr();

logger.info('Starting server...');
app.listen(PORT, () => {
    logger.success('Server started!!!');
    logger.debug(`Server listening on port ${PORT}`);
    logger.hr();
    logger.br();
});