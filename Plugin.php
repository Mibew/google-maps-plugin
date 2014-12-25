<?php
/*
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

/**
 * @file The main file of Mibew:GoogleMaps plugin.
 */

namespace Mibew\Mibew\Plugin\GoogleMaps;

use Mibew\Asset\AssetManagerInterface;
use Mibew\EventDispatcher\EventDispatcher;
use Mibew\EventDispatcher\Events;
use Mibew\Plugin\PluginManager;

/**
 * Provides an ability to view visitors at Google Maps.
 */
class Plugin extends \Mibew\Plugin\AbstractPlugin implements \Mibew\Plugin\PluginInterface
{
    /**
     * Class constructor.
     *
     * @param array $config List of the plugin config. The following options are
     * supported:
     *   - 'api_key': string, Google Maps API key that should be used to render
     *     maps.
     */
    public function __construct($config)
    {
        if (empty($config['api_key'])) {
            trigger_error('Google API key cannot be empty', E_USER_WARNING);

            return;
        }
        parent::__construct($config);

        $this->initialized = true;
    }

    /**
     * Defines necessary event listeners.
     */
    public function run()
    {
        $dispatcher = EventDispatcher::getInstance();
        $dispatcher->attachListener(Events::USERS_FUNCTION_CALL, $this, 'usersFunctionCallHandler');
        $dispatcher->attachListener(Events::PAGE_ADD_JS, $this, 'pageAddJsHandler');
        $dispatcher->attachListener(Events::PAGE_ADD_CSS, $this, 'pageAddCssHandler');
    }

    /**
     * A handler for {@link \Mibew\EventDispatcher\Events::USERS_FUNCTION_CALL}.
     *
     * Provides an ability to use "googleMapsGetInfo" function at the client
     * side.
     *
     * @see \Mibew\EventDispatcher\Events::USERS_FUNCTION_CALL
     */
    public function usersFunctionCallHandler(&$function)
    {
        if ($function['function'] == 'googleMapsGetInfo') {
            // An IP string can contain more than one IP adress. For example it
            // can be something like this: "x.x.x.x (x.x.x.x)". Thus we need to
            // extract all IPS from the string and use the last one.
            $count = preg_match_all(
                "/(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3})/",
                $function['arguments']['ip'],
                $matches
            );
            if (!$count) {
                // There is no IP in the string. An error should be returned.
                $function['results'] = array(
                    'errorCode' => 1,
                    'errorMessage' => 'The specified IP is invalid!',
                );

                return;
            }
            $ip = end($matches[0]);
            $info = PluginManager::getInstance()
                ->getPlugin('Mibew:GeoIp')
                ->getGeoInfo($ip, get_current_locale());

            $function['results'] = array(
                'country' => $info['country_name'] ?: '',
                'city' => $info['city'] ?: '',
                'latitude' => $info['latitude'],
                'longitude' => $info['longitude'],
            );
        }
    }

    /**
     * Adds custom JS files to the page.
     *
     * @see \Mibew\EventDispatcher\Events::PAGE_ADD_JS
     */
    public function pageAddJsHandler(&$args)
    {
        if ($args['request']->attributes->get('_route') == 'users') {
            $args['js'][] = $this->getFilesPath() . '/vendor/jquery-colorbox/jquery.colorbox-min.js';
            $args['js'][] = array(
                'content' => $this->getApiUrl(),
                'type' => AssetManagerInterface::ABSOLUTE_URL,
            );
            $args['js'][] = $this->getFilesPath() . '/js/plugin.js';
        }
    }

    /**
     * Adds custom CSS files to the page.
     *
     * @see \Mibew\EventDispatcher\Events::PAGE_ADD_CSS
     */
    public function pageAddCssHandler(&$args)
    {
        if ($args['request']->attributes->get('_route') == 'users') {
            $args['css'][] = $this->getFilesPath() . '/vendor/jquery-colorbox/example3/colorbox.css';
            $args['css'][] = $this->getFilesPath() . '/css/styles.css';
        }
    }

    /**
     * {@inheritdoc}
     */
    public static function getVersion()
    {
        return '1.0.1';
    }

    /**
     * {@inheritdoc}
     */
    public static function getDependencies()
    {
        return array('Mibew:GeoIp' => '1.*');
    }

    /**
     * Builds URL for Google Maps API.
     *
     * @return string API URL
     * @throws \RuntimeException if API key was not set correctly.
     */
    protected function getApiUrl()
    {
        if (empty($this->config['api_key'])) {
            throw new \RuntimeException('Google API key cannot be empty');
        }

        return '//maps.googleapis.com/maps/api/js?key='
            . $this->config['api_key']
            . '&sensor=false';
    }
}
