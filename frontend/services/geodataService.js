app.factory('GeodataService', ['$http', '$q', function ($http, $q) {

    const backendUrl = 'https://covics-backend.herokuapp.com';

    let getCountryBorders = function (country) {
        return $http.get('data/world-geojson/countries/' + country + '.json').then(function (response) {
            return response.data;
        });
    };

    let getPredictions = function () {
        return $http.get(backendUrl + '/predictions').then(function (response) {
            if (response.data && response.data) {
                let datum = response.data;
                datum.results.forEach(function (res) {
                    res.remaining_capacity = res.covid19_capacity - res.resources_requirements;
                    res.remaining_capacity_prediction_3w = res.covid19_capacity - res.resources_requirements_prediction_3w;
                    res.remaining_percent = 100 * (res.remaining_capacity_prediction_3w / res.covid19_capacity);
                    res.remaining_percent_current = 100 * (res.remaining_capacity / res.covid19_capacity);
                });
                return datum;
            } else {
                return null;
            }
        });
    };

    let getDistributions = function () {
        return $http.get(backendUrl + '/distributions').then(function (response) {
            return response.data ? response.data.distributions : [];
        });
    };

    return {
        "getCountryBorders": getCountryBorders,
        "getPredictions": getPredictions,
        "getDistributions": getDistributions
    }


}]);