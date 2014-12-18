/*!
 * This file is a part of Mibew Google Maps Plugin.
 *
 * Copyright 2014 Dmitriy Simushev <simushevds@gmail.com>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (Mibew, $, google) {
    /**
     * Display popup with a map and a marker on it.
     *
     * @param {String} country Name of the country. It will be used in the
     * marker's title.
     * @param {String} city Name of the city. It will be used in the marker's
     * title.
     * @param {Number} latitude Latitude of the point the marker should be
     * placed.
     * @param {Number} longitude Longitude of the point the marker should be
     * placed.
     */
    var showMap = function (country, city, latitude, longitude) {
        var $canvas = $('<div id="map-canvas"></div>');

        $.colorbox({
            html: $canvas,
            onComplete: function() {
                var position = new google.maps.LatLng(latitude, longitude),
                    map = new google.maps.Map($canvas.get(0), {
                        center: position,
                        zoom: (city ? 8 : 6),
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    }),
                    marker = new google.maps.Marker({
                        map: map,
                        position: position,
                        title: city ? (city + ' (' + country + ')') : country
                    });
            }
        });
    }

    /**
     * Makes all necessary actions to get Geo info and show it on the map.
     *
     * This is a replacement for Mibew.Views.QueuedThread.prototype.showGeoInfo
     * and Mibew.Views.Visitor.prototype.showGeoInfo methods.
     */
    var showGeoInfo = function() {
        var ip = this.model.get('userIp'),
            agentId = Mibew.Objects.Models.agent.get('id'),
            server = Mibew.Objects.server;

        if (ip) {
            server.callFunctions(
                [{
                    'function': 'googleMapsGetInfo',
                    'arguments': {
                        'agentId': agentId,
                        'ip': ip,
                        'return': {
                            'country': 'country',
                            'city': 'city',
                            'latitude': 'latitude',
                            'longitude': 'longitude'
                        },
                        'references': {}
                    }
                }],
                function (args) {
                    // Make sure there is enough data to display the map
                    if (!args.errorCode) {
                        showMap(args.country, args.city, args.latitude, args.longitude);
                    }
                },
                true
            );
        }
    }

    /**
     * This is a temporary copy of Mibew.Views.QueuedThread which will be used
     * for extending it.
     */
    var baseThreadView = Mibew.Views.QueuedThread;

    Mibew.Views.QueuedThread = baseThreadView.extend(
        /** @lends Mibew.Views.QueuedThread.prototype */
        {
            /**
             * Open window with geo information
             *
             * This method overrides
             * Mibew.Views.QueuedThread.prototype.showGeoInfo method.
             */
            showGeoInfo: showGeoInfo
        }
    );

    /**
     * This is a temporary copy of Mibew.Views.Visitor which will be used for
     * extending it.
     */
    var baseVisitorView = Mibew.Views.Visitor;

    Mibew.Views.Visitor = baseVisitorView.extend(
        /** @lends Mibew.Views.Visitor.prototype */
        {
            /**
             * Open window with geo information.
             *
             * This method overrides Mibew.Views.Visitor.prototype.showGeoInfo
             * method.
             */
            showGeoInfo: showGeoInfo
        }
    );

})(Mibew, jQuery, google);
