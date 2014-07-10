"use strict";

var opinion = require("opinion");
var config = require("./src/config");
var routes = require("./src/routes");
var redis = require("./src/redis_client");

var app = opinion({
  middlewarOrder: opinion.DEFAULT_MIDDLEWARE_STACK,
  render: ["src/views"],
  socketio: { clientPath: "/_js/socket.io.js" },
  statics: "dist"
});

app.get("/client/:sessionid", routes.client);
app.get("/moderator", routes.moderator.index);
app.get("/session/qr_code", routes.session.qr);
app.get("/survey", routes.survey);

app.get('/', function* () {
  this.body = "Hello world!";
});

app.listen(config.server.port, function () {
  console.log("Server listening on %s", this._connectionKey);
});