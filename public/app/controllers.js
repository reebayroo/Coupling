"use strict";
var controllers = angular.module('coupling.controllers', ['coupling.services']);

controllers.controller('CouplingController', ['$scope', '$location', 'Coupling', function (scope, location, Coupling) {
    scope.data = Coupling.data;
    scope.deselectionMap = [];

    scope.spin = function () {
        location.path(Coupling.data.selectedTribeId + "/pairAssignments/new");
    };

    scope.showOrHidePlayers = function () {
        scope.showPlayers = !scope.showPlayers;
    };

    scope.viewPlayer = function (id, $event) {
        if ($event.stopPropagation) $event.stopPropagation();
        location.path("/" + tribe._id + "/player/" + id);
    };

    scope.flipSelection = function (player) {
        scope.deselectionMap[player._id] = !scope.deselectionMap[player._id];
    }
}]);

controllers.controller('TribesController', function ($scope, Coupling, $location) {
    $scope.tribes = Coupling.data.tribes;
    $scope.selectTribe = function (tribe) {
        $location.path("/" + tribe._id + "/pairAssignments/current");
    }
});

controllers.controller('NewPairAssignmentsController', function ($scope, $location, Coupling, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId, function (players) {
        var selectedPlayers = _.filter(players, function (player) {
            return !$scope.deselectionMap[player._id];
        });
        Coupling.spin(selectedPlayers);
    });

    $scope.save = function () {
        Coupling.saveCurrentPairAssignments();
        $location.path("/" + $routeParams.tribeId + "/pairAssignments/current");
    };

    function findPairContainingPlayer(player) {
        return _.find($scope.data.currentPairAssignments.pairs, function (pair) {
            return _.findWhere(pair, {_id: player._id});
        });
    }

    function swapPlayers(pair, swapOutPlayer, swapInPlayer) {
        _.each(pair, function (player, index) {
            if (swapOutPlayer._id === player._id) {
                pair[index] = swapInPlayer;
            }
        });
    }

    $scope.onDrop = function ($event, draggedPlayer, droppedPlayer) {
        var pairWithDraggedPlayer = findPairContainingPlayer(draggedPlayer);
        var pairWithDroppedPlayer = findPairContainingPlayer(droppedPlayer);

        if (pairWithDraggedPlayer != pairWithDroppedPlayer) {
            swapPlayers(pairWithDraggedPlayer, draggedPlayer, droppedPlayer);
            swapPlayers(pairWithDroppedPlayer, droppedPlayer, draggedPlayer);
        }
    }
});

controllers.controller('CurrentPairAssignmentsController', function ($scope, Coupling, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId);
    $scope.data.currentPairAssignments = Coupling.data.history[0];
});

controllers.controller('NewPlayerController', function ($scope, Coupling, $location, $routeParams) {
    $scope.player = {tribe: $routeParams.tribeId};
    $scope.savePlayer = function () {
        Coupling.savePlayer($scope.player, function (updatedPlayer) {
            $location.path("/" + $routeParams.tribeId + "/player/" + updatedPlayer._id);
        });
    }
});

controllers.controller('EditPlayerController', ['$scope', 'Coupling', '$routeParams', function (scope, Coupling, params) {
    Coupling.findPlayerById(params.id, function (player) {
        scope.original = player;
        scope.player = angular.copy(player);
    });

    scope.savePlayer = function () {
        Coupling.savePlayer(scope.player);
    };

    scope.$on('$locationChangeStart', function () {
        if (!angular.equals(scope.original, scope.player)) {
            var answer = confirm("You have unsaved data. Would you like to save before you leave?");
            if (answer) {
                Coupling.savePlayer(scope.player);
            }
        }
    });

}]);