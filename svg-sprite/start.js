const webpack = require("webpack");
const server = require("webpack-dev-server");

const config = require("./webpack.config");
const compiler = webpack(config);

const serve = new server({
  port: 9999,
}, compiler);

async function start() {
  await serve.start();
}

start();