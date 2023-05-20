const path = require("path");
const htmlPlugin = require("html-webpack-plugin");
/** @type {import("webpack").Configuration} */
const config = {
  mode: "development",
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  devServer: {},
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new htmlPlugin({
      template: "template.html",
    }),
  ],
};

module.exports = config;
