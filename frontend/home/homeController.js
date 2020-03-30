app.controller('HomeController', ['$scope', '$templateCache', '$compile', '$q', 'GeodataService', function ($scope, $templateCache, $compile, $q, GeodataService) {

    // holds the geojson value of each country
    let geojsonsPerCountry = {};

    // holds the geojson value of each country
    let displayedCountries = [];

    //holds the layers of all the countries with statistics values
    let capacityLayer = new L.FeatureGroup();

    $scope.predictions = {};
    $scope.distributions = {};

    $scope.countries2LettersCode = countries2LettersCode;

    // called once the map is initialized
    $scope.onMapCreated = function (map) {
        $scope.map = map;
        capacityLayer.addTo($scope.map);

        let promises = [];

        GeodataService.getPredictions().then(function (predictions) {
            predictions.results.forEach(function (countryPredictions) {
                countryPredictions.color = getColor(countryPredictions.remaining_percent);
                let countryCode = countryPredictions.country_code;
                $scope.predictions[countryCode] = countryPredictions;
                computeCountryData(countryCode, promises);
            });

            GeodataService.getDistributions().then(function (distributions) {
                distributions.forEach(function (countryDistribution) {
                    if (!$scope.distributions[countryDistribution.recipient]) {
                        $scope.distributions[countryDistribution.recipient] = {from: [], to: []}
                    }
                    if (!$scope.distributions[countryDistribution.donor]) {
                        $scope.distributions[countryDistribution.donor] = {from: [], to: []}
                    }

                    $scope.distributions[countryDistribution.recipient].from.push({
                        country: countryDistribution.donor,
                        number: countryDistribution.transfer_amount
                    });
                    $scope.distributions[countryDistribution.donor].to.push({
                        country: countryDistribution.recipient,
                        number: countryDistribution.transfer_amount
                    });

                    computeCountryData(countryDistribution.recipient, promises, 0);
                    computeCountryData(countryDistribution.donor, promises, 100);
                });

                $q.all(promises).then(function () {
                    Object.keys(geojsonsPerCountry).forEach(function (countryCode) {
                        geojsonsPerCountry[countryCode].bindPopup(buildTooltipContent(countryCode)).addTo(capacityLayer);
                    });
                    $scope.map.fitBounds(capacityLayer.getBounds());
                });
            });
        });

        addLegend();
    };

    function computeCountryData(countryCode, promises, remaining_percent = 0) {
        if (!$scope.predictions[countryCode]) {
            $scope.predictions[countryCode] = {
                country_code: countryCode,
                country_name: $scope.countries2LettersCode[countryCode],
                remaining_percent: remaining_percent
            };
        }
        let deferred = computeGeojsonForCountry($scope.predictions[countryCode], countryCode, remaining_percent);
        promises.push(deferred.promise);
    }

    function computeGeojsonForCountry(results, countryCode, remaining_percent) {
        let deferred = $q.defer();
        if (displayedCountries.indexOf(countryCode) < 0) {
            displayedCountries.push(countryCode);
            GeodataService.getCountryBorders(countryCode.toLowerCase()).then(function (geojsonData) {
                geojsonData.features.forEach(function (feature) {
                    feature.properties = {
                        countryCode: countryCode,
                        remaining_percent: remaining_percent
                    };
                });
                geojsonsPerCountry[countryCode] = L.geoJson(geojsonData, {
                    style: style,
                    onEachFeature: onEachFeature
                });

                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }
        return deferred;
    }

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
    function buildTooltipContent(countryCode) {
        let tooltipScope = $scope.$new(true);
        tooltipScope.selectedCountry = countryCode;
        tooltipScope.predictions = $scope.predictions;
        tooltipScope.distributions = $scope.distributions;
        tooltipScope.countries2LettersCode = $scope.countries2LettersCode;
        tooltipScope.view = $scope.predictions[countryCode].confirmed_prediction_3w ? 'predictions' : 'distributions';
        tooltipScope.toggleView = function () {
            tooltipScope.view = tooltipScope.view === 'predictions' ? 'distributions' : 'predictions'
        };

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
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 0.7,
            fillColor: getColor(feature.properties.remaining_percent)
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
        let countryCode = e.target.feature.properties.countryCode;
        geojsonsPerCountry[countryCode].resetStyle(e.target);
    }

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
                        '<div class="clearfix"><i style="background:' + getColor(from + 1) + '"></i> ' +
                        from + (to ? ' &ndash; ' + to + '%' : '+') + '</div>');
                }
            }

            div.innerHTML = labels.join('');
            return div;
        };

        legend.addTo($scope.map);
    }


}]);