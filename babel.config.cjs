module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      ["@babel/preset-typescript", { allowDeclareFields: true }],
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
          },
        },
      ],
    ],
  };
};
