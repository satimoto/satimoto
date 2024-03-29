module.exports = {
    presets: ["module:metro-react-native-babel-preset"],
    plugins: [
        "@realm/babel-plugin",
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        [
            require.resolve("babel-plugin-module-resolver"),
            {
                cwd: "babelrc",
                extensions: [".ts", ".tsx", ".js", ".ios.js", ".android.js"],
                alias: {
                    assets: "./assets",
                    components: "./components",
                    locales: "./locales",
                    models: "./models",
                    proto: "./proto",
                    screens: "./screens",
                    services: "./services",
                    stores: "./stores",
                    utils: "./utils"
                },
                root: ["."]
            }
        ],
        "react-native-reanimated/plugin"
    ]
}
