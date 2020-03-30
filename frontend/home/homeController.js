app.controller('HomeController', ['$scope', '$templateCache', '$compile', '$q', 'GeodataService', function ($scope, $templateCache, $compile, $q, GeodataService) {

    // holds the geojson value of each country
    let geojsonsPerCountry = {};

    //holds the layers of all the countries with statistics values
    let capacityLayer = new L.FeatureGroup();

    // called once the map is initialized
    $scope.onMapCreated = function (map) {
        $scope.map = map;
        capacityLayer.addTo($scope.map);

        GeodataService.getAllStatistics().then(function (statistics) {
            let promises = [];
            statistics.results.forEach(function (countryResults) {
                let deferred = $q.defer();
                GeodataService.getCountryBorders(countryResults.country_code    .toLowerCase()).then(function (geojsonData) {
                    countryResults.color = getColor(countryResults.remaining_percent);
                    geojsonData.features.forEach(function (feature) {
                        feature.properties = {
                            countryResults: countryResults,
                        };
                    });
                    geojsonsPerCountry[countryResults.country_code] = L.geoJson(geojsonData, {
                        style: style,
                        onEachFeature: onEachFeature
                    }).bindTooltip(buildTooltipContent(countryResults), {
                        permanent: false
                    }).addTo(capacityLayer);

                    deferred.resolve();
                });
                promises.push(deferred.promise);
            });

            $q.all(promises).then(function () {
                $scope.map.fitBounds(capacityLayer.getBounds());
            })
        });

        addLegend();
    };

    /**
     * Computes the color of the feature depending of the needed resources
     * @param percent the percent of remaining resources
     * @returns {string} corresponding hex color
     */
    function getColor(percent) {
        return percent > 75 ? '#43e387' :
            percent > 50 ? '#fddb38' :
                percent > 25 ? '#FEB24C' :
                    percent > 10 ? '#fd6826' :
                        '#E31A1C';
    }

    // build the tooltip content that should be displayed when mouse hovers on a a country
    function buildTooltipContent(countryResults) {
        let tooltipScope = $scope.$new(true);
        tooltipScope.selectedCountry = countryResults;
        let compiled = $compile($templateCache.get('countryDetailsTooltip.html'))(tooltipScope);
        // tooltipScope.$apply();
        return compiled[0];
    }

    //bind events to each geojson feature
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    /**
     * Create style of a feature
     * @param feature a geojson feature
     */
    function style(feature) {
        let countryResults = feature.properties.countryResults;
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 0.7,
            fillColor: getColor(countryResults.remaining_percent)
        };
    }

    /**
     * Return the style to apply when a country feature is hovered
     */
    function highlightFeature(e) {
        let layer = e.target;

        layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    /**
     * Return the style to apply when a country feature is exited
     */

    function resetHighlight(e) {
        let countryCode = e.target.feature.properties.countryResults.country_code;
        geojsonsPerCountry[countryCode].resetStyle(e.target);}

    /**
     * Called when a click is triggerred on a feature
     */
    function zoomToFeature(e) {
        $scope.map.fitBounds(e.target.getBounds());
    }

    /**
     * Add a legend to the map explaining the colors codes
     */
    function addLegend() {
        let legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {

            let div = L.DomUtil.create('div', 'map-control legend'),
                grades = [0, 10, 25, 50, 75, 100],
                labels = [],
                from, to;

            for (let i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];

                if (to) {
                    labels.push(
                        '<i style="background:' + getColor(from + 1) + '"></i> ' +
                        from + (to ? ' &ndash; ' + to + '%' : '+'));
                }
            }

            div.innerHTML = labels.join('<br/>');
            return div;
        };

        legend.addTo($scope.map);
    }


}]);