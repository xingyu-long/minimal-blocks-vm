const path = require('path')

module.exports = {
    webpack: {
        // alias: {
        //     "scratch-audio": path.resolve(__dirname, './node_modules/scratch-audio'),
        //     "scratch-blocks": path.resolve(__dirname, './node_modules/scratch-blocks'),
        //     "scratch-render": path.resolve(__dirname, './node_modules/scratch-render'),
        //     "scratch-storage": path.resolve(__dirname, './node_modules/scratch-storage'),
        //     "scratch-svg-renderer": path.resolve(__dirname, './node_modules/scratch-svg-renderer'),
        //     "scratch-vm": path.resolve(__dirname, './node_modules/scratch-vm')
        // },
        configure: (webpackConfig, { env, paths }) => {
            const {
                getLoader,
                loaderByName
            } = require("@craco/craco");

            const { isFound, match: fileLoaderMatch } = getLoader(
                webpackConfig,
                loaderByName("file-loader")
            );
            if (!isFound) {
                throw new Error(
                    "Can't find file-loader in the webpack config!"
                );
            }
            fileLoaderMatch.loader.exclude.push({ test: /\.(vert|frag)$/ });
            return webpackConfig;
        }

    }

}