'use strict';

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
//rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    babelify = require("babelify"),
    watchify = require("watchify"),
    browserify = require("browserify"),
    rename = require("gulp-rename"),
    inject = require('gulp-inject-string'),
    notify = require('gulp-notify'),
    autoprefixer = require('gulp-autoprefixer'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    cssnano = require('gulp-cssnano'),
    merge = require('event-stream').merge,
    typescript = require('gulp-typescript'),
    reload = browserSync.reload,
    streamqueue = require('streamqueue');

var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');

var server = require('gulp-server-livereload');
 

function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
var path = {
    build: {
        name: 'editor3js',
        js: 'build/',
        img: 'build/assets/images/'
    },
    src: {
        js: 'src/app/main.js',
        style: ['src/app/**/*.scss', 'src/libs/**/*.scss', 'src/app/**/*.sass'],
        img: 'src/images/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    out: {
        js: {origin: 'main.js', hash: guidGenerator() + '.js'},
        style: {origin: 'style.css', hash: guidGenerator() + '.css'},
    },
    watch: {
        js: ['src/app/**/*.js', 'src/app/libs/**/*.js'],
        style: ['src/app/**/*.scss', 'src/libs/**/*.scss', 'src/app/**/*.sass'],
        img: 'src/images/**/*.*',
    },
    clean: './build'
};


gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});


gulp.task('style:build', function () {
    var paths = "./src/lib/styles/",
        csslibs = gulp.src([
            paths + 'components.css',
            paths + 'custom.css',
            paths + 'core.css'
        ])
            .pipe(concat('vendors.css'));

    var sassS = gulp.src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(sass({

            includePaths: ['src/'],
            outputStyle: 'compressed',
            sourceMap: true,
            errLogToConsole: true
        }).on('error', sass.logError))
        .pipe(prefixer())
        .pipe(cssmin())
        .pipe(cssnano({zindex: false}))
        .pipe(autoprefixer({
            browsers: ['last 16 versions'],
            cascade: false
        }));


    return merge(sassS, csslibs)
        .pipe(concat(path.build.name + ".css"))
        //.pipe(concat(path.out.style.hash))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(notify({message: 'Styles task complete'}))
        .pipe(reload({stream: true}));
});
gulp.task('js:build', function () {
    // del.sync(path.build.js);

    var paths = "./src/libs/",
        govnoKode = "../../../../page1/",
        jslibs = streamqueue({objectMode: true},
            gulp.src(paths + "threejs/three.js"),
            // gulp.src(paths + "threejs/RGBELoader.js"),
            // gulp.src(paths + "threejs/HDRCubeTextureLoader.js"),
            gulp.src(paths + "dat.gui.min.js"),
            gulp.src(paths + "threejs/STLLoader.js"), 
            gulp.src(paths + "threejs/BufferGeometryUtils.js"), 
            // gulp.src(paths + "fabric.min.js"),
            //gulp.src(paths + "pace.js"),
            gulp.src(paths + "Tween.js"),
            gulp.src(paths + "threejs/STLExporter.js"), 
            // gulp.src("src/libs/OBJExporter.js"),
            // gulp.src(paths + "../../node_modules/async/dist/async.min.js"),
           // gulp.src(paths + "threejs/stats.min.js"),
            gulp.src(paths + "threejs/Detector.js"),
            // gulp.src(paths + "threejs/env/SkyShader.js"),
            gulp.src(paths + "threejs/OOrbitControls.js"),
            gulp.src(paths + "threejs/TransformControls.js"),
            // gulp.src(paths + "threejs/OBJLoader.js"),
            // gulp.src(paths + "rs/Matrix4x4.js"),
            // gulp.src(paths + "threejs/normal/extern/blob.js"),
            // gulp.src(paths + "threejs/normal/extern/canvas-toBlob.js"),
            // gulp.src(paths + "threejs/normal/extern/MaskPass.js"),
            // gulp.src(paths + "threejs/normal/extern/NormalDisplacementShader.js"),
            // gulp.src(paths + "threejs/normal/extern/readTGA.js"),
            // gulp.src(paths + "threejs/normal/shader/AmbientOcclusionShader.js"),
            // gulp.src(paths + "threejs/normal/shader/DisplacementShader.js"),
            // gulp.src(paths + "threejs/normal/shader/HorizontalBlurShader.js"),
            // gulp.src(paths + "threejs/normal/shader/NormalMapFromPicturesShader.js"),
            // gulp.src(paths + "threejs/normal/shader/NormalMapShader.js"),
            // gulp.src(paths + "threejs/normal/shader/NormalToHeightShader.js"),
            // gulp.src(paths + "threejs/normal/shader/SpecularShader.js"),
            // gulp.src(paths + "threejs/normal/shader/VerticalBlurShader.js"),
            // gulp.src(paths + "threejs/normal/ambientOccMap.js"),
            // gulp.src(paths + "threejs/normal/diffuseMap.js"),
            // gulp.src(paths + "threejs/normal/displaceMap.js"),
            // gulp.src(paths + "threejs/normal/filedrop.js"),
            // gulp.src(paths + "threejs/normal/filters.js"),
            // gulp.src(paths + "threejs/normal/gaussianblur.js"),
            // gulp.src(paths + "threejs/normal/main.js"),
            // gulp.src(paths + "threejs/normal/normalMap.js"),
            // gulp.src(paths + "threejs/normal/parallel.js"),
            // gulp.src(paths + "threejs/normal/parallel_calc.js"),
            // gulp.src(paths + "threejs/normal/renderNormalview.js"),
            // gulp.src(paths + "threejs/normal/specularMap.js"),

            //gulp.src(paths + "threejs/postprocessing/three.composer.js"),
            //gulp.src(paths + "threejs/postprocessing/three.render.js"),
            //gulp.src(paths + "threejs/postprocessing/three.shader.js"),
            //gulp.src(paths + "threejs/postprocessing/CopyShader.js"),


            // gulp.src(paths + "threejs/pmrem/PMREMGenerator.js"),
            // gulp.src(paths + "threejs/pmrem/PMREMCubeUVPacker.js"),
            // gulp.src(paths + "threejs/postprocessing/EffectComposer.js"),
            // gulp.src(paths + "threejs/postprocessing/RenderPass.js"),
            // gulp.src(paths + "threejs/postprocessing/MaskPass.js"),
            // gulp.src(paths + "threejs/postprocessing/ShaderPass.js"),
            // gulp.src(paths + "threejs/postprocessing/UnrealBloomPass.js"),
            // gulp.src(paths + "threejs/shaders/CopyShader.js"),
            // gulp.src(paths + "threejs/shaders/FXAAShader.js"),
            // gulp.src(paths + "threejs/shaders/ConvolutionShader.js"),
            // gulp.src(paths + "threejs/shaders/LuminosityHighPassShader.js"),


            // gulp.src(paths + "Blob.js"),
            //gulp.src(paths + "jquery.min.js"),
            //gulp.src(paths + "jquery-ui.js"),
            //gulp.src(paths + "bootstrap.min.js"),
            //gulp.src(paths + "dropzone.min.js"),
            // gulp.src(paths + "ripple.min.js"),


            gulp.src( "bower_components/stackblur-canvas/dist/stackblur.js")


        )

            .on('error', function (err) {
                console.error(err);
            })
            .pipe(concat('vendors.js'));

    var jse6 = browserify(path.src.js, {debug: false}).transform(babelify, {
        presets: ["es2015"],
        plugins: ["transform-class-properties"]
    }).bundle()
        .on('error', function (err) {
            console.error(err);
            this.emit('end');
        })
        .pipe(source('build.js'))
        //.pipe(uglify())
        // .pipe(rigger())
        .pipe(buffer());

    return merge(jslibs, jse6)
        //.pipe(concat(path.out.js.hash))
        .pipe(concat(path.build.name + '.js'))
        //.pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(notify({message: 'JS task complete'}))
        .pipe(reload({stream: true}));
});

gulp.task('image:build', function () {
    // del.sync(path.build.img);
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        //.pipe(notify({ message: 'Images task complete' }))
        .pipe(reload({stream: true}));
});


gulp.task('clean', function () {
    return del.sync([path.build.js])
});

gulp.task('build', [
    'clean',
    'js:build',
    'style:build'
    //,'image:build'
]);

gulp.task('webserver', function() {
  gulp.src('')
    .pipe(server({
      livereload: true,
      directoryListing: true,
      open: true
    }));
});
gulp.task('watch', function () {
    watch(path.watch.js, function (event, cb) {
        gulp.start('js:build');
    });
    watch(path.watch.style, function (event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.img], function (event, cb) {
        gulp.start('image:build');
    });
});


// gulp.task('default', ['build', 'watch']);
gulp.task('default', ['build', 'watch','webserver']);