const path = require('path');
const HtmlWebpackPlugin =  require('html-webpack-plugin');
module.exports = {
  mode : 'development',
  entry : __dirname + path.sep + 'js/app.js',
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    static: [__dirname],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + path.sep + 'index.html'
    })
  ]
};