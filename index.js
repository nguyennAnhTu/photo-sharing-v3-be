const express = require("express");
const app = express();
const dbConnect = require("./db/dbConnect");
const cors = require("cors");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const bodyParser = require("body-parser");

const session = require("express-session");
const cookieParser = require("cookie-parser");

dbConnect();
app.use(cookieParser("keyboard cat"));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 30,
    },
  })
);

app.use(bodyParser.json());
app.use(
  cors({
    origin: ["https://c6cd52-3000.csb.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
