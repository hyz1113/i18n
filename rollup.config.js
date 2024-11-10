import resolve from "rollup-plugin-node-resolve";
// import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import {uglify} from "rollup-plugin-uglify";

const paths = {
    input: {
        root: "./src/bin/cli.js",
    },
    output: {
        root: "dist/",
    },
};

const fileName = `cli.js`;

export default {
    input: `${paths.input.root}`,
    output: {
        file: `${paths.output.root}${fileName}`,
        format: "esm",
        name: "i18n-words",
    },
    plugins: [
        resolve(),
        // commonjs(),
        babel({
            exclude: "node_modules/**",
            runtimeHelpers: true,
        }),
        uglify(),
    ],
};