'use strict';

app.directive('geotrackingMap', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        scope: {
            showSearchPlacesInput: '@',
            onMapCreated: '&'
        },
        restrict: 'EA',
        template: '<div id="map_canvas" class="map-container"></div>',
        link: function ($scope, elem, attrs) {

            $scope.computeGMap = function (type) {
                if ($scope.googleLayer) {
                    $scope.googleLayer.remove();
                }
                $scope.googleLayer = L.gridLayer.googleMutant({
                    maxZoom: 22,
                    scaleControl: true,
                    type: type
                    // styles: Constants.mapsOptions.styles
                }).addTo($scope.map);
            };

            $timeout(function () {

                $scope.map = L.map('map_canvas', {attributionControl: false}).setView([0, 0], 2);
                $scope.computeGMap('roadmap');

                L.control.scale().addTo($scope.map);

                let viewButtons = [
                    L.easyButton('fa-map', function (btn, map) {
                        $scope.computeGMap('roadmap');
                    }),
                    L.easyButton('fa-globe', function (btn, map) {
                        $scope.computeGMap('hybrid');
                    }),
                    // L.easyButton('fa-road', function (btn, map) {
                    //     $scope.computeGMap('roadmap');
                    //     $scope.googleLayer.addGoogleLayer('TrafficLayer');
                    // }),
                ];
                L.easyBar(viewButtons).addTo($scope.map);


                // new L.control.polylineMeasure({
                //     clearMeasurementsOnStop: true,
                //     measureControlLabel: '&#8737;',
                //     measureControlTitleOn: "ON",
                //     measureControlTitleOff: "OFF"
                // }).addTo($scope.map);

                if ($scope.showSearchPlacesInput === 'true') {
                    let GooglePlacesSearchBox = L.Control.extend({
                        onAdd: function () {
                            let element = document.createElement("input");
                            element.id = "searchBox";
                            element.placeholder = $filter('translate')('common.forms.search') + ' ...';
                            element.className += "form-control map-input";
                            return element;
                        }
                    });
                    (new GooglePlacesSearchBox).addTo($scope.map);

                    let input = document.getElementById("searchBox");
                    let searchBox = new google.maps.places.SearchBox(input);

                    searchBox.addListener('places_changed', function () {
                        let places = searchBox.getPlaces();
                        if (places.length > 0) {
                            let place = places[0];
                            let group = L.featureGroup();
                            let marker = L.marker([
                                place.geometry.location.lat(),
                                place.geometry.location.lng()
                            ]);

                            group.addLayer(marker);
                            group.addTo($scope.map);

                            setTimeout(function () {
                                group.remove();
                            }, 2000);

                            $scope.map.fitBounds(group.getBounds(), {maxZoom: 17});
                        }
                    });
                }

                if ($scope.onMapCreated) {
                    $scope.onMapCreated({map: $scope.map});
                }

            });

        }
    };
}]);