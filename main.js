const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const httpsRedirect = require('./utils/httpsRedirect');

const app = express();

const DIST_PATH = path.join(__dirname, 'frontend');
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV === 'production') {
    logger.debug('httpsRedirect');
    app.use(httpsRedirect);
}

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(DIST_PATH));

app.listen(PORT, () => {
    logger.success(`Server started on port ${PORT}`);
});