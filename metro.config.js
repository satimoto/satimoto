/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const { getDefaultConfig } = require("metro-config")
const { resolver: defaultResolver } = getDefaultConfig.getDefaultValues()

module.exports = {
    resolver: {
        //...defaultResolver,
        extraNodeModules: {
            ...defaultResolver.extraNodeModules,
            stream: require.resolve("readable-stream")
        },
        sourceExts: [...defaultResolver.sourceExts, "cjs"]
    },
    transformer: {
        minifierPath: "metro-minify-terser",
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true
            }
        })
    }
}
