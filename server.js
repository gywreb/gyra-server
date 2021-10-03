import express from 'express';
import { config } from 'dotenv';
config();
import 'colors';

import ConnectMongoDB from './database/dbConnect';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import auth from './routes/auth';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

ConnectMongoDB.getConnection();

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const endPointPrefix = '/gyra/v1';

app.use(`${endPointPrefix}/auth`, auth);

app.use(errorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () =>
  console.log(`Server is running on port: ${port}`.black.bgWhite)
);
