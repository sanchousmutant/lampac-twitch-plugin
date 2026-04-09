(function () {
    'use strict';

    var API_HOST = window.location.origin || 'http://localhost:9118';
    var CLIENT_ID = 'ycln1oo1lcsydy7xmsu8br0mcyfuv9';

    // Манифест плагина
    var manifest = {
        type: 'video',
        version: '1.0.0',
        name: 'Twitch',
        description: 'Просмотр стримов Twitch',
        component: 'twitch',
        icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="currentColor"/></svg>'
    };

    // Компонент для отображения стримов
    var TwitchComponent = function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            step: 250
        });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var info;
        var last;

        this.create = function () {
            var _this = this;

            this.activity.loader(true);

            html.append(body);
            scroll.append(body);

            this.loadStreams();

            return this.render();
        };

        this.loadStreams = function () {
            var _this = this;

            network.silent(API_HOST + '/lite/twitch', function (data) {
                _this.activity.loader(false);

                if (data && data.streams && data.streams.length) {
                    _this.buildStreams(data.streams);
                } else {
                    _this.empty('Нет доступных стримов');
                }
            }, function (error) {
                _this.activity.loader(false);
                _this.empty('Ошибка загрузки: ' + (error.statusText || 'Неизвестная ошибка'));
            });
        };

        this.buildStreams = function (streams) {
            var _this = this;

            streams.forEach(function (stream) {
                var card = Lampa.Template.get('card', {
                    title: stream.title || stream.user_name,
                    release_year: stream.game_name || ''
                });

                var img = card.find('.card__img')[0];
                if (img) {
                    img.onload = function () {
                        card.addClass('card--loaded');
                    };
                    img.onerror = function () {
                        img.src = './img/img_broken.svg';
                    };
                    img.src = stream.thumbnail_url || './img/img_broken.svg';
                }

                card.find('.card__view').append('<div class="card__quality">LIVE</div>');
                card.find('.card__view').append('<div class="card__type">' + (stream.viewer_count || 0) + ' viewers</div>');

                card.on('hover:focus', function () {
                    last = card[0];
                    scroll.update(card, true);

                    info = Lampa.Template.get('info');
                    info.find('.info__title').text(stream.title || stream.user_name);
                    info.find('.info__title-original').text(stream.user_name);
                    info.find('.info__create').text(stream.game_name || '');

                    var description = 'Зрителей: ' + (stream.viewer_count || 0);
                    if (stream.language) description += ' • Язык: ' + stream.language.toUpperCase();
                    info.find('.info__description').text(description);

                    body.find('.info').remove();
                    body.prepend(info);
                });

                card.on('hover:enter', function () {
                    _this.playStream(stream);
                });

                body.append(card);
                items.push(card);
            });

            Lampa.Controller.enable('content');
        };

        this.playStream = function (stream) {
            var _this = this;

            Lampa.Activity.loader(true);

            network.silent(API_HOST + '/lite/twitch/stream?channel=' + encodeURIComponent(stream.user_login), function (data) {
                Lampa.Activity.loader(false);

                if (data && data.url) {
                    var playlist = [{
                        title: stream.title || stream.user_name,
                        url: data.url
                    }];

                    Lampa.Player.play({
                        title: stream.title || stream.user_name,
                        url: data.url
                    });

                    Lampa.Player.playlist(playlist);
                } else {
                    Lampa.Noty.show('Не удалось получить ссылку на стрим');
                }
            }, function (error) {
                Lampa.Activity.loader(false);
                Lampa.Noty.show('Ошибка загрузки стрима: ' + (error.statusText || 'Неизвестная ошибка'));
            });
        };

        this.empty = function (message) {
            var empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(message || 'Пусто');
            body.append(empty);
            this.start();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), items);
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                down: this.down,
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                back: this.back
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};

        this.stop = function () {};

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            body.remove();
            network = null;
            items = null;
            html = null;
            body = null;
            info = null;
        };
    };

    // Регистрация компонента
    Lampa.Component.add('twitch', TwitchComponent);

    // Добавление пункта в меню
    function addMenuItem() {
        var menu_item = $('<li class="menu__item selector" data-action="twitch"><div class="menu__ico">' + manifest.icon + '</div><div class="menu__text">Twitch</div></li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Twitch',
                component: 'twitch',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(menu_item);
    }

    // Инициализация плагина
    if (window.appready) {
        addMenuItem();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                addMenuItem();
            }
        });
    }

    // Регистрация манифеста
    Lampa.Manifest.plugins = manifest;

    console.log('Twitch plugin loaded');

})();
