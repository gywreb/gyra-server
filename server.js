const express = require("express");
require("dotenv").config();
require("colors");
const ConnectMongoDB = require("./database/dbConnect");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("./database/models/Column");
require("./database/models/User");
require("./database/models/Task");
require("./database/models/Activity");
require("./database/models/Release");
require("./database/models/Sprint");
require("./database/models/Project");
require("./database/models/Attachment");
require("./database/models/Comment");
const auth = require("./routes/auth");
const project = require("./routes/project");
const column = require("./routes/column");
const task = require("./routes/task");
const user = require("./routes/user");
const activity = require("./routes/activity");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

ConnectMongoDB.getConnection();

app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const endPointPrefix = "/gyra/v1";

app.use(`${endPointPrefix}/auth`, auth);
app.use(`${endPointPrefix}/project`, project);
app.use(`${endPointPrefix}/column`, column);
app.use(`${endPointPrefix}/task`, task);
app.use(`${endPointPrefix}/user`, user);
app.use(`${endPointPrefix}/activity`, activity);

app.use(errorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () =>
  console.log(`Server is running on port: ${port}`.black.bgWhite)
);
