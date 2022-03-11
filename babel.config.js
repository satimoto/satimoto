module.exports = {
    presets: ["module:metro-react-native-babel-preset"],
    plugins: [
        [
            require.resolve("babel-plugin-module-resolver"),
            {
                cwd: "babelrc",
                extensions: [".ts", ".tsx", ".js", ".ios.js", ".android.js"],
                alias: {
                    assets: "./assets",
                    components: "./components",
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
        [
            "react-native-reanimated/plugin",
            {
                globals: ["__scanCodes"]
            }
        ]
    ]
}
