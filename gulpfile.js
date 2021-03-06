'use strict';

// Читаем содержимое package.json в константу
const pjson = require('./package.json');
// Получим из константы другую константу с адресами папок сборки и исходников
const dirs = pjson.config.directories;

// Определим необходимые инструменты
const gulp = require('gulp');
const less = require('gulp-less');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const replace = require('gulp-replace');
const fileinclude = require('gulp-file-include');
const del = require('del');
const browserSync = require('browser-sync').create();
const ghPages = require('gulp-gh-pages');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const cheerio = require('gulp-cheerio');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const base64 = require('gulp-base64');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const cleanCSS = require('gulp-cleancss');
const pug = require('gulp-pug');
const spritesmith = require('gulp.spritesmith');
const buffer = require('vinyl-buffer');
const merge = require('merge-stream');

// ЗАДАЧА: Компиляция препроцессора
gulp.task('less', function(){
  return gulp.src(dirs.source + '/less/style.less')         // какой файл компилировать (путь из константы)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())                                // инициируем карту кода
    .pipe(less())                                           // компилируем LESS
    .pipe(postcss([                                         // делаем постпроцессинг
        autoprefixer({ browsers: ['last 2 version'] }),     // автопрефиксирование
        mqpacker({ sort: true }),                           // объединение медиавыражений
    ]))
    .pipe(sourcemaps.write('/'))                            // записываем карту кода как отдельный файл (путь из константы)
    .pipe(gulp.dest(dirs.build + '/css/'))                  // записываем CSS-файл (путь из константы)
    .pipe(browserSync.stream())
    .pipe(rename('style.min.css'))                          // переименовываем
    .pipe(cleanCSS())                                       // сжимаем
    .pipe(gulp.dest(dirs.build + '/css/'));                 // записываем CSS-файл (путь из константы)
});

// ЗАДАЧА: Сборка HTML
gulp.task('html', function() {
  return gulp.src(dirs.source + '/*.html')                  // какие файлы обрабатывать (путь из константы, маска имени)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(fileinclude({                                     // обрабатываем gulp-file-include
      prefix: '@@',
      basepath: '@file',
      indent: true,
    }))
    .pipe(replace(/\n\s*<!--DEV[\s\S]+?-->/gm, ''))         // убираем комментарии <!--DEV ... -->
    .pipe(gulp.dest(dirs.build));                           // записываем файлы (путь из константы)
});

gulp.task('pug', function() {
  return gulp.src(dirs.source + '/**/*.pug')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(pug())
    .pipe(gulp.dest(dirs.build));
});

// ЗАДАЧА: Копирование изображений
gulp.task('img', function () {
  return gulp.src([
        dirs.source + '/img/*.{gif,png,jpg,jpeg,svg}',      // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
      ],
      {since: gulp.lastRun('img')}                          // оставим в потоке обработки только изменившиеся от последнего запуска задачи (в этой сессии) файлы
    )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(dirs.build + '/img'))                       // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe(gulp.dest(dirs.build + '/img'));                  // записываем файлы (путь из константы)
});

// ЗАДАЧА: Копирование fonts
gulp.task('fonts', function () {
  return gulp.src([
      dirs.source + '/fonts/**/*.{eot,svg,ttf,woff,woff2}',                             // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
    ],
    {since: gulp.lastRun('fonts')}                          // оставим в потоке обработки только изменившиеся от последнего запуска задачи (в этой сессии) файлы
  )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(dirs.build + '/fonts'))                     // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe(gulp.dest(dirs.build + '/fonts'));                // записываем файлы (путь из константы)
});


// ЗАДАЧА: Оптимизация изображений (ЗАДАЧА ЗАПУСКАЕТСЯ ТОЛЬКО ВРУЧНУЮ)
gulp.task('img:opt', function () {
  return gulp.src([
      dirs.source + '/img/*.{gif,png,jpg,jpeg,svg}',        // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
      '!' + dirs.source + '/img/sprite-svg.svg',            // SVG-спрайт брать в обработку не будем
    ])
    .pipe(plumber({ errorHandler: onError }))
    .pipe(imagemin({                                        // оптимизируем
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(dirs.source + '/img'));                  // записываем файлы в исходную папку
});


// ЗАДАЧА: сшивка PNG-спрайта
gulp.task('png:sprite', function () {
  let fileName = 'sprite-' + Math.random().toString().replace(/[^0-9]/g, '') + '.png';
  let spriteData = gulp.src('src/img/png-sprite/*.png')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(spritesmith({
      imgName: fileName,
      cssName: 'sprite.less',
      cssFormat: 'less',
      padding: 4,
      imgPath: '../img/' + fileName
    }));
  let imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest('build/img'));
  let cssStream = spriteData.css
    .pipe(gulp.dest(dirs.source + '/less/layout/'));
  return merge(imgStream, cssStream);
});

// ЗАДАЧА: Очистка папки сборки
gulp.task('clean', function () {
  return del([                                              // стираем
    dirs.build + '/**/*',                                   // все файлы из папки сборки (путь из константы)
    '!' + dirs.build + '/readme.md'                         // кроме readme.md (путь из константы)
  ]);
});

// ЗАДАЧА: Конкатенация и углификация Javascript
gulp.task('js', function () {
  return gulp.src([
      // список обрабатываемых файлов
      dirs.source + '/js/jquery-3.2.1.min.js',
      dirs.source + '/js/owl.carousel.js',
      //dirs.source + '/js/jquery-migrate-1.4.1.min.js',
      dirs.source + '/js/script.js',
    ])
    .pipe(plumber({ errorHandler: onError }))
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dirs.build + '/js'));
});


// ЗАДАЧА: Сборка всего
gulp.task('build', gulp.series(                             // последовательно:
  'clean',                                                  // последовательно: очистку папки сборки
  'png:sprite',
  gulp.parallel('less', 'img', 'js', 'fonts'),
  // 'pug',
  'html'                                                    // последовательно: сборку разметки
));

// ЗАДАЧА: Локальный сервер, слежение
gulp.task('serve', gulp.series('build', function() {

  browserSync.init({                                        // запускаем локальный сервер (показ, автообновление, синхронизацию)
    //server: dirs.build,                                   // папка, которая будет «корнем» сервера (путь из константы)
    server: {
      baseDir: "./build/"
    },
    port: 3000,                                             // порт, на котором будет работать сервер
    startPath: '/index.html',                               // файл, который буде открываться в браузере при старте сервера
    // open: false                                          // возможно, каждый раз стартовать сервер не нужно...
  });

  gulp.watch(                                               // следим за HTML
    [
      dirs.source + '/*.html',                              // в папке с исходниками
      dirs.source + '/_include/*.html',                     // и в папке с мелкими вставляющимся файлами
    ],
    gulp.series('html', reloader)                           // при изменении файлов запускаем пересборку HTML и обновление в браузере
  );

  gulp.watch(
    dirs.source + '/pug/**/*.pug',
    gulp.series('pug', reloader)
  );

  gulp.watch(                                               // следим за LESS
    dirs.source + '/less/**/*.less',
    gulp.series('less')                                     // при изменении запускаем компиляцию (обновление браузера — в задаче компиляции)
  );


  gulp.watch(                                               // следим за PNG, которые для спрайтов
    dirs.source + '/img/png-sprite/*.png',
    gulp.series('png:sprite', 'less')
  );

  gulp.watch(                                               // следим за изображениями
    dirs.source + '/img/*.{gif,png,jpg,jpeg,svg}',
    gulp.series('img', reloader)                            // при изменении оптимизируем, копируем и обновляем в браузере
  );

  gulp.watch(                                               // следим за шрифтами
    dirs.source + '/fonts/**/*',
    gulp.series('fonts', reloader)                          // при изменении копируем и обновляем в браузере
  );

  gulp.watch(                                               // следим за JS
    dirs.source + '/js/*.js',
    gulp.series('js', reloader)                             // при изменении пересобираем и обновляем в браузере
  );

}));

// ЗАДАЧА, ВЫПОЛНЯЕМАЯ ТОЛЬКО ВРУЧНУЮ: Отправка в GH pages (ветку gh-pages репозитория)
gulp.task('deploy', function() {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

// ЗАДАЧА: Задача по умолчанию
gulp.task('default',
  gulp.series('serve')
);

// Дополнительная функция для перезагрузки в браузере
function reloader(done) {
  browserSync.reload();
  done();
}

// Проверка существования файла/папки
function fileExist(path) {
  const fs = require('fs');
  try {
    fs.statSync(path);
  } catch(err) {
    return !(err && err.code === 'ENOENT');
  }
}

var onError = function(err) {
    notify.onError({
      title: "Error in " + err.plugin,
    })(err);
    this.emit('end');
};
