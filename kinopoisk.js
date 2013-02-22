/**
  * jQuery Kinopolis Plugin 0.3
  *
  * Kinopolis is a jQuery plugin that let you easily add to your web page movie rating informer. This informer shows
  * movie rating from kinopois.ru and imdb.com. It does not use any server side scripts. It use javascript and css files only.
  *
  * @name kinopolis
  * @version 0.3
  * @requires jQuery v1.5.0+
  * @author Dmitry Shamin <dmitry.shamin@gmail.com>
  * @license Dual licensed under the MIT or GPL Version 2 licenses.
  *
  * Copyright 2012-2013, Dmitry Shamin
  */
;(function( $ ) {

    var settings = {
        "movie"  : false,
        "url"    : "http://www.kinopoisk.ru/rating/",
        "range"  : 10,
        "order"  : ["kinopoisk", "imdb"],
        "kinopoisk_template": '<div>' +
                '<span class="kp_description">Рейтинг <a href="http://kinopoisk.ru" target="new">Кинопоиска</a>:</span>' +
                '<span class="kp_rating" title="Проголосовало $vote">$rating</span>' +
                '<span class="kp_stars">$stars</span></div>',
        "imdb_template": '<div>' +
                '<span class="kp_description">Рейтинг <a href="http://imdb.com" target="new">IMDB</a>:</span>' +
                '<span class="kp_rating" title="Проголосовало $vote">$rating</span>' +
                '<span class="kp_stars">$stars</span></div>'
    };

    var methods = {

        // Инициализация плагина
        init : function(options) {
            return this.each(function() {
                var $this = $(this);
                // Атрибуты data перекрывают settings, а options перекрывает data
                var params = $.extend({}, settings, $this.data(), options);
                // Если вместо идентификатора передали ссылку
                for (var i in params) {
                    if (i == 'movie') {
                        var movie = params[i].toString().split('/');
                        if (movie.length > 1) {
                            params[i] = movie[4];
                        } else {
                            params[i] = movie[0];
                        }
                    }
                }
                $this.data({'params': params}); // Записываем параметры элемента
                $this.kinopoisk('getRating');
            });
        },
        // Получение рейтинга с сайта kinopolis.ru
        getRating: function() {
            var el = $(this);
            var params = el.data('params');
            if (!params.movie) {
                throw 'Не указан идентификатор фильма на кинопоиске (data-movie).';
            }
            $.ajax(
                {
                    type: 'GET',
                    url: 'http://query.yahooapis.com/v1/public/yql?q='
                            + encodeURIComponent('select * from xml where url="' + params.url + '/' + params.movie
                            + '.xml"') + '&format=xml&callback=?',
                    dataType: 'json',
                    success: function(data) {
                        return el.kinopoisk("_showRating", data);
                    },
                    error: function(data) {
                        console.log(data);
                        $.error(data.responseText);
                    }
                }
            );
        },
        // Показ рейтинга
        _showRating: function(data) {
            var el = $(this);
            var params = el.data('params');
            if (!data.results[0]) {
                throw 'Проверьте правильность url "' + params.url + '"';
            }
            var xml_doc      = $.parseXML(data.results[0]);
            var $xml         = $(xml_doc);
            var $kp_rating   = $xml.find("kp_rating");
            var $imdb_rating = $xml.find("imdb_rating");
            // Если был указан левый movie_id
            if ($kp_rating.text() == 0 && $kp_rating.attr("num_vote") == 0) {
                return el.html('<span class="kp_container">Нет данных</span>');
            }
            $kp_rating.stars   = el.kinopoisk("_getStar", $kp_rating.text(), params);
            $imdb_rating.stars = el.kinopoisk("_getStar", $imdb_rating.text(), params);
            var ratings = {
                "kinopoisk": el.kinopoisk("_getTemplate", params.kinopoisk_template, $kp_rating),
                "imdb": el.kinopoisk("_getTemplate", params.imdb_template, $imdb_rating)
            };
            var text = "";
            for (var i in params.order) {
                text += ratings[params.order[i]];
            }
            return el.hide().html('<span class="kp_container">' + text + '</span>').fadeIn();
        },
        _getTemplate: function(template, $rating) {
            return template
                .replace("$rating", $rating.text())
                .replace("$vote", $rating.attr("num_vote"))
                .replace("$stars", $rating.stars);
        },
        // получение звёзд
        _getStar: function(rating, params) {
            var star = "";
            var round_rating = Math.round(rating * params.range / 10);
            for (var i = 1; i <= params.range; i++) {
                if (i <= round_rating) {
                    star += "<span>&#9733;</span>";
                } else {
                    star += "<span>&#9734;</span>";
                }
            }
            return star;
        }
    };

    $.fn.kinopoisk = function(method) {
        try {
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || ! method) {
                return methods.init.apply(this, arguments);
            } else {
                throw 'Метод ' +  method + ' не найден';
            }
        } catch(e) {
            $.error(e);
        }
    };

})(jQuery);

$(document).ready(function() {
    $(".kinopoisk").kinopoisk();
});