const path = require("path");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules:[
      {
        test: /\.jsx$/,
        use: "babel-loader"
      },
      {
        test: /\.svg$/,
        use: [{
          loader: "svg-sprite-loader",
          options: {
            symbolId: filename => {
              return path.basename(filename).replace(/\.svg$/, "");
            }
            // or just use 
            // symbolId: "[name]",
          }
        }]
      }
    ]
  },
  plugins: [
    new HtmlPlugin({
      title: "SVG",
      template: "./index.html"
    })
  ]
}