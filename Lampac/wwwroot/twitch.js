(function () {
    'use strict';

    var CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
    var TWITCH_PROXY = '/twitch/proxy';

    // --- Helper: GQL request via server proxy ---
    function gqlRequest(queryData, callback, errorCallback) {
        $.ajax({
            url: TWITCH_PROXY,
            type: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            data: JSON.stringify(Array.isArray(queryData) ? queryData : [queryData]),
            success: callback,
            error: errorCallback
        });
    }

    // --- Top Streams Component ---
    function TwitchComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var last;

        this.create = function () {
            this.activity.loader(true);
            scroll.minus();
            html.append(scroll.render());
            this.loadTopStreams();
            return this.render();
        };

        this.loadTopStreams = function () {
            var _this = this;

            var query = [{
                query: 'query { streams(first: 30) { edges { node { id title viewersCount previewImageURL(width: 440, height: 248) broadcaster { displayName login } game { name } } } } }'
            }];

            gqlRequest(query, function (data) {
                _this.activity.loader(false);

                if (data && data[0] && data[0].data) {
                    var streams = data[0].data.streams && data[0].data.streams.edges ? data[0].data.streams.edges : null;
                    if (streams && streams.length) {
                        _this.buildCards(streams, 'live');
                    } else {
                        _this.empty('No streams available');
                    }
                } else {
                    _this.empty('No streams available');
                }

                _this.activity.toggle();
            }, function (xhr) {
                _this.activity.loader(false);
                _this.empty('Loading error: ' + xhr.status);
            });
        };

        this.buildCards = function (edges, type) {
            var _this = this;

            edges.forEach(function (edge) {
                var stream = edge.node;

                var cardData = {
                    title: stream.broadcaster ? stream.broadcaster.displayName : (stream.owner ? stream.owner.displayName : ''),
                    original_title: stream.title,
                    release_year: stream.game ? stream.game.name : '',
                    poster: stream.previewImageURL || stream.previewThumbnailURL || '',
                    quality: type === 'live' ? 'LIVE' : 'VOD',
                    number_of_seasons: type === 'live' ? (stream.viewersCount || 0).toLocaleString() + ' viewers' : ''
                };

                var card = new Lampa.Card(cardData, { card_collection: true });
                card.create();

                card.onFocus = function (target) {
                    last = target;
                    scroll.update(card.render(), true);
                };

                card.onEnter = function () {
                    if (type === 'live') {
                        _this.playLive(stream);
                    } else {
                        _this.playVod(stream);
                    }
                };

                card.visible();
                body.append(card.render());
                items.push(card);
            });

            scroll.append(body);
            this.start();
        };

        this.playLive = function (stream) {
            var channel = stream.broadcaster ? stream.broadcaster.login : stream.login;

            $.ajax({
                url: '/twitch/stream?channel=' + encodeURIComponent(channel),
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data && data.url) {
                        Lampa.Player.play({
                            title: stream.broadcaster ? stream.broadcaster.displayName : stream.displayName,
                            url: data.url
                        });
                    } else {
                        Lampa.Noty.show('Failed to get stream link');
                    }
                },
                error: function () {
                    Lampa.Noty.show('Stream loading error');
                }
            });
        };

        this.playVod = function (vod) {
            var vodId = vod.id;

            $.ajax({
                url: '/twitch/vod?id=' + encodeURIComponent(vodId),
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data && data.url) {
                        Lampa.Player.play({
                            title: vod.title || vod.owner.displayName,
                            url: data.url
                        });
                    } else {
                        Lampa.Noty.show('Failed to get VOD link');
                    }
                },
                error: function () {
                    Lampa.Noty.show('VOD loading error');
                }
            });
        };

        this.empty = function (message) {
            var empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(message);
            body.append(empty);
            this.start();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = null;
        };
    }

    // --- Channel page: live stream + past broadcasts ---
    function TwitchChannelComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var last;

        this.create = function () {
            this.activity.loader(true);
            scroll.minus();
            html.append(scroll.render());

            var login = object.login;
            this.loadChannel(login);
            return this.render();
        };

        this.loadChannel = function (login) {
            var _this = this;

            var query = [{
                query: 'query($login: String!) { user(login: $login) { displayName login profileImageURL(width: 150) stream { id title viewersCount previewImageURL(width: 440, height: 248) game { name } } videos(first: 20, type: ARCHIVE, sort: TIME) { edges { node { id title previewThumbnailURL(width: 440, height: 248) createdAt lengthSeconds viewCount game { name } owner { displayName login } } } } } }',
                variables: { login: login }
            }];

            gqlRequest(query, function (data) {
                _this.activity.loader(false);

                if (data && data[0] && data[0].data && data[0].data.user) {
                    var user = data[0].data.user;

                    // Live stream card
                    if (user.stream) {
                        var liveStream = user.stream;
                        liveStream.broadcaster = { displayName: user.displayName, login: user.login };

                        var liveData = {
                            title: user.displayName,
                            original_title: liveStream.title,
                            release_year: liveStream.game ? liveStream.game.name : '',
                            poster: liveStream.previewImageURL,
                            quality: 'LIVE',
                            number_of_seasons: (liveStream.viewersCount || 0).toLocaleString() + ' viewers'
                        };

                        var liveCard = new Lampa.Card(liveData, { card_collection: true });
                        liveCard.create();
                        liveCard.onFocus = function (target) { last = target; scroll.update(liveCard.render(), true); };
                        liveCard.onEnter = function () { _this.playLive(liveStream); };
                        liveCard.visible();
                        body.append(liveCard.render());
                        items.push(liveCard);
                    }

                    // VODs
                    var videos = user.videos && user.videos.edges ? user.videos.edges : [];
                    videos.forEach(function (edge) {
                        var vod = edge.node;
                        var duration = '';
                        if (vod.lengthSeconds) {
                            var h = Math.floor(vod.lengthSeconds / 3600);
                            var m = Math.floor((vod.lengthSeconds % 3600) / 60);
                            duration = h + 'h ' + m + 'm';
                        }

                        var thumb = vod.previewThumbnailURL || '';
                        if (thumb.indexOf('_404/') !== -1 || thumb.indexOf('404_processing') !== -1) thumb = '';

                        var vodData = {
                            title: vod.title || user.displayName,
                            original_title: vod.game ? vod.game.name : '',
                            release_year: duration,
                            poster: thumb,
                            quality: 'VOD',
                            number_of_seasons: (vod.viewCount || 0).toLocaleString() + ' views'
                        };

                        var vodCard = new Lampa.Card(vodData, { card_collection: true });
                        vodCard.create();
                        vodCard.onFocus = function (target) { last = target; scroll.update(vodCard.render(), true); };
                        vodCard.onEnter = function () { _this.playVod(vod); };
                        vodCard.visible();
                        body.append(vodCard.render());
                        items.push(vodCard);
                    });

                    if (!user.stream && !videos.length) {
                        _this.empty('Channel offline, no past broadcasts');
                    }

                    scroll.append(body);
                    _this.start();
                } else {
                    _this.empty('Channel not found');
                    _this.start();
                }

                _this.activity.toggle();
            }, function (xhr) {
                _this.activity.loader(false);
                _this.empty('Loading error: ' + xhr.status);
                _this.start();
            });
        };

        this.playLive = function (stream) {
            var channel = stream.broadcaster.login;

            $.ajax({
                url: '/twitch/stream?channel=' + encodeURIComponent(channel),
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data && data.url) {
                        Lampa.Player.play({ title: stream.broadcaster.displayName, url: data.url });
                    } else {
                        Lampa.Noty.show('Failed to get stream link');
                    }
                },
                error: function () { Lampa.Noty.show('Stream loading error'); }
            });
        };

        this.playVod = function (vod) {
            $.ajax({
                url: '/twitch/vod?id=' + encodeURIComponent(vod.id),
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data && data.url) {
                        Lampa.Player.play({ title: vod.title || '', url: data.url });
                    } else {
                        Lampa.Noty.show('Failed to get VOD link');
                    }
                },
                error: function () { Lampa.Noty.show('VOD loading error'); }
            });
        };

        this.empty = function (message) {
            var empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(message);
            body.append(empty);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = null;
        };
    }

    // --- Search Component ---
    function TwitchSearchComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var last;

        this.create = function () {
            this.activity.loader(true);
            scroll.minus();
            html.append(scroll.render());

            var searchText = object.search || '';
            if (searchText) {
                this.doSearch(searchText);
            } else {
                this.activity.loader(false);
                this.empty('Enter a channel name to search');
                this.activity.toggle();
            }

            return this.render();
        };

        this.doSearch = function (text) {
            var _this = this;

            var query = [{
                query: 'query($query: String!) { searchFor(userQuery: $query, platform: "web", options: { targets: [{ index: CHANNEL }] }) { channels { items { id login displayName profileImageURL(width: 150) followers { totalCount } stream { id title viewersCount game { name } } } } } }',
                variables: { query: text }
            }];

            gqlRequest(query, function (data) {
                _this.activity.loader(false);

                if (data && data[0] && data[0].data && data[0].data.searchFor && data[0].data.searchFor.channels) {
                    var channels = data[0].data.searchFor.channels.items;
                    if (channels && channels.length) {
                        _this.buildResults(channels);
                    } else {
                        _this.empty('No channels found');
                    }
                } else {
                    _this.empty('No results');
                }

                _this.activity.toggle();
            }, function (xhr) {
                _this.activity.loader(false);
                _this.empty('Search error: ' + xhr.status);
            });
        };

        this.buildResults = function (channels) {
            var _this = this;

            channels.forEach(function (ch) {
                var isLive = ch.stream != null;

                var cardData = {
                    title: ch.displayName,
                    original_title: isLive ? ch.stream.title : '',
                    release_year: isLive && ch.stream.game ? ch.stream.game.name : (ch.followers ? ch.followers.totalCount.toLocaleString() + ' followers' : ''),
                    poster: ch.profileImageURL || '',
                    quality: isLive ? 'LIVE' : 'OFFLINE',
                    number_of_seasons: isLive ? (ch.stream.viewersCount || 0).toLocaleString() + ' viewers' : ''
                };

                var card = new Lampa.Card(cardData, { card_collection: true });
                card.create();

                card.onFocus = function (target) {
                    last = target;
                    scroll.update(card.render(), true);
                };

                card.onEnter = function () {
                    // Open channel page with live + VODs
                    Lampa.Activity.push({
                        url: '',
                        title: ch.displayName,
                        component: 'twitch_channel',
                        login: ch.login,
                        page: 1
                    });
                };

                card.visible();
                body.append(card.render());
                items.push(card);
            });

            scroll.append(body);
            this.start();
        };

        this.empty = function (message) {
            var empty = Lampa.Template.get('list_empty');
            empty.find('.empty__descr').text(message);
            body.append(empty);
            this.start();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = null;
        };
    }

    // --- Register components ---
    Lampa.Component.add('twitch', TwitchComponent);
    Lampa.Component.add('twitch_search', TwitchSearchComponent);
    Lampa.Component.add('twitch_channel', TwitchChannelComponent);

    // --- Plugin init ---
    function startPlugin() {
        var icon = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="currentColor"/></svg>';

        // Main menu: Twitch (top streams)
        var menu_item = $('<li class="menu__item selector" data-action="twitch">' +
            '<div class="menu__ico">' + icon + '</div>' +
            '<div class="menu__text">Twitch</div>' +
            '</li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Twitch',
                component: 'twitch',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(menu_item);

        // Search menu item
        var search_icon = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>';

        var search_item = $('<li class="menu__item selector" data-action="twitch_search">' +
            '<div class="menu__ico">' + search_icon + '</div>' +
            '<div class="menu__text">Twitch Search</div>' +
            '</li>');

        search_item.on('hover:enter', function () {
            Lampa.Input.edit({ title: 'Twitch: channel search', value: '' }, function (text) {
                if (text) {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Twitch: ' + text,
                        component: 'twitch_search',
                        search: text,
                        page: 1
                    });
                }
            });
        });

        $('.menu .menu__list').eq(0).append(search_item);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                startPlugin();
            }
        });
    }

})();
