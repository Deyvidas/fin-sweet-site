import dotenv from 'dotenv';
import GulpClient from 'gulp';

// ERROR-HANDLING
import gulpPlumber from 'gulp-plumber';
import notify from 'gulp-notify';

// DIRS & FILES
import changed, { compareContents } from 'gulp-changed';
import fileSystem from 'fs';
import gulpClean from 'gulp-clean';

// HTML
import autoPrefixer from 'gulp-autoprefixer';
import fileinclude from 'gulp-file-include';
import htmlmin from 'gulp-htmlmin';
import prettier from 'gulp-prettier';

// IMAGES
import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import webpCss from 'gulp-webp-css';
import webpHTML from 'gulp-webp-html';

// STYLES
import * as dartSass from 'sass';
import groupMedia from 'gulp-group-css-media-queries';
import gulpSass from 'gulp-sass';
import sassGlob from 'gulp-sass-glob';

// TS
import webpackConf from './webpack.config.js';
import webpack from 'webpack-stream';

dotenv.config();

const mode = process.env.MODE;
const isDev = mode === 'development';
const isProd = mode === 'production';

const rootDir = './src';
const destDir = isDev ? './build' : isProd ? './docs' : './build';

const sassCompiler = gulpSass(dartSass);
const plumberConfig = { errorHandler: notify.onError() };

const tasks = {
    includeFiles: `(${mode.toUpperCase()}) | includeFiles`,
    sassCompile: `(${mode.toUpperCase()}) | sassCompile`,
    minifyImages: `(${mode.toUpperCase()}) | minifyImages`,
    copyMedia: `(${mode.toUpperCase()}) | copyMedia`,
    cleanDist: `(${mode.toUpperCase()}) | cleanDist`,
    compileTS: `(${mode.toUpperCase()}) | compileTS`,
    watch: `(${mode.toUpperCase()}) | watch`,
};

/**
 * Substitute @@include('./some/path/file.html') with the HTML code that is present in
 * this file.
 */
GulpClient.task(tasks.includeFiles, () => {
    const source = `${rootDir}/*.html`;
    const dest = `${destDir}/`;

    var gulp = GulpClient.src(source)
        .pipe(changed(dest, { hasChanged: compareContents }))
        .pipe(gulpPlumber(plumberConfig))
        .pipe(fileinclude({ prefix: '@@', basepath: '@file' }));

    if (isProd) {
        gulp = gulp
            .pipe(webpHTML())
            .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }));
    } else {
        gulp = gulp.pipe(prettier());
    }

    return gulp.pipe(GulpClient.dest(dest));
});

/**
 * Produces one .css file by combining all .scss files and storing it in the dist
 * directory.
 */
GulpClient.task(tasks.sassCompile, () => {
    const source = `${rootDir}/*.scss`;
    const dest = `${destDir}/`;

    var gulp = GulpClient.src(source, { sourcemaps: isDev })
        .pipe(changed(dest, { hasChanged: compareContents }))
        .pipe(gulpPlumber(plumberConfig))
        .pipe(sassGlob())
        .pipe(sassCompiler({ outputStyle: 'expanded', indentWidth: 4 }));

    if (isProd) {
        gulp = gulp
            .pipe(autoPrefixer({ cascade: false })) // in time build add prefixes to new or experimental prop
            .pipe(webpCss())
            .pipe(groupMedia())
            .pipe(sassCompiler({ outputStyle: 'compressed' }));
    }

    return gulp.pipe(GulpClient.dest(dest, { sourcemaps: isDev }));
});

/**
 * Generate copies of all images and reduce the weight of them.
 */
GulpClient.task(tasks.minifyImages, () => {
    const source = `${rootDir}/media/images/**/*`;
    const dest = `${destDir}/media/images/`;

    var gulp = GulpClient.src(source).pipe(changed(dest));

    if (isProd) {
        gulp = gulp // prettier-ignore
            .pipe(webp())
            .pipe(GulpClient.src(source))
            .pipe(changed(dest));
    }

    return gulp // prettier-ignore
        .pipe(imagemin({ verbose: true }))
        .pipe(GulpClient.dest(dest));
});

/**
 * Duplicate all media files excluding images.
 */
GulpClient.task(tasks.copyMedia, () => {
    const source = [`${rootDir}/media/**/*`, `!${rootDir}/media/images/**/*`];
    const dest = `${destDir}/media/`;

    return GulpClient.src(source) // prettier-ignore
        .pipe(GulpClient.dest(dest));
});

/**
 * Delete directory dist.
 */
GulpClient.task(tasks.cleanDist, (done) => {
    if (!fileSystem.existsSync(`${destDir}`)) return done();

    return GulpClient.src(`${destDir}`, { read: false })
        .pipe(gulpClean()); // prettier-ignore
});

/**
 * Compile all TypeScript files into a JavaScript files.
 */
GulpClient.task(tasks.compileTS, () => {
    const source = `${rootDir}/*.ts`;
    const dest = `${destDir}/`;

    var gulp = GulpClient.src(source)
        .pipe(changed(dest, { hasChanged: compareContents }))
        .pipe(gulpPlumber(plumberConfig))
        .pipe(webpack(webpackConf));

    return gulp.pipe(GulpClient.dest(dest));
});

/**
 * Execute the necessary action after saving the specified file.
 */
GulpClient.task(tasks.watch, () => {
    GulpClient.watch(`${rootDir}/**/*.scss`, GulpClient.parallel(tasks.sassCompile));
    GulpClient.watch(`${rootDir}/**/*.html`, GulpClient.parallel(tasks.includeFiles));
    GulpClient.watch(`${rootDir}/**/*.ts`, GulpClient.parallel(tasks.compileTS));
    GulpClient.watch(`${rootDir}/media/images/**/*`, GulpClient.parallel(tasks.minifyImages)); // prettier-ignore
    GulpClient.watch(
        [`${rootDir}/media/**/*`, `!${rootDir}/media/images/**/*`],
        GulpClient.parallel(tasks.copyMedia),
    );
});

/**
 * Run the required action when entering the `gulp` command in the command line.
 */
GulpClient.task('default', GulpClient.series(
    tasks.cleanDist,
    GulpClient.parallel(
        tasks.includeFiles,
        tasks.sassCompile,
        tasks.minifyImages,
        tasks.copyMedia,
        tasks.compileTS
    ),
    GulpClient.parallel(tasks.watch),
)); // prettier-ignore
