const path = require("path");
// const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
    target: "web",
    mode: "development",
    entry: path.resolve(__dirname, "src/index.tsx"),

    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                loader: require.resolve("babel-loader"),
                include: [path.resolve(__dirname, "src"), path.resolve(__dirname, "packages/simv-three-utils/src")],
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
                    plugins: ["@babel/plugin-transform-typescript"],
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "inline-source-map",
    devServer: {
        publicPath: "/",
        contentBase: path.join(__dirname, "dist"),
        historyApiFallback: true,
        port: 9000,
        watchContentBase: true,
        hot: true,
    },
    // plugins: [isDevelopment && new ReactRefreshPlugin()],
};
