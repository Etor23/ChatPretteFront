module.exports = {
  devServer: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        /Critical dependency: the request of a dependency is an expression/,
      ];
      return webpackConfig;
    },
  },
};
