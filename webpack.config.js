const path = require("path");
// const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
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
    // plugins: [new ForkTsCheckerWebpackPlugin()],
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 9000,
    },
};
