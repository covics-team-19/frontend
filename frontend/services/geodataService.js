app.factory('GeodataService', ['$http', '$q', function ($http, $q) {

    let getCountryBorders = function (country) {
        return $http.get('data/world-geojson/countries/' + country + '.json').then(function (response) {
            return response.data;
        });
    };

    let getPredictions = function () {
        return $http.get('https://covics-backend.herokuapp.com/predictions').then(function (response) {
            if (response.data && response.data) {
                let datum = response.data;
                datum.results.forEach(function (res) {
                    res.resources_requirements /= 0.15;
                    res.resources_requirements_prediction_3w /= 0.15;
                    res.remaining_capacity = res.resources_capacity - res.resources_requirements_prediction_3w;
                    res.remaining_percent = 100 * (res.remaining_capacity / res.resources_capacity);
                });
                return datum;
            } else {
                return null;
            }
        });
    };

    let getDistributions = function () {
        return $http.get('https://covics-backend.herokuapp.com/distributions').then(function (response) {
            return response.data ? response.data.distributions : [];
        });
    };

    return {
        "getCountryBorders": getCountryBorders,
        "getPredictions": getPredictions,
        "getDistributions": getDistributions
    }


}]);