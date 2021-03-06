"use strict";
var controllers = angular.module('coupling.controllers', ['coupling.services']);

controllers.controller('CouplingController', ['$scope', '$location', 'Coupling', function (scope, location, Coupling) {
    scope.data = Coupling.data;
    scope.deselectionMap = [];

    if (location.path() === "/") {
        location.path("/tribes");
    }

    scope.clickSpinButton = function () {
        location.path(Coupling.data.selectedTribeId + "/pairAssignments/new");
    };

    scope.playerRoster = {minimized: false};
    scope.clickPlayerRosterHeader = function () {
        scope.playerRoster.minimized = !scope.playerRoster.minimized;
    };
}]);

controllers.controller('SelectedPlayerCardController', function ($scope, $location, Coupling) {
    $scope.isDisabled = $scope.deselectionMap[$scope.player._id] == true;

    $scope.clickPlayerCard = function () {
        $scope.isDisabled = !$scope.isDisabled;
        $scope.deselectionMap[$scope.player._id] = $scope.isDisabled;
    };
    $scope.clickPlayerName = function ($event) {
        if ($event.stopPropagation) $event.stopPropagation();
        $location.path("/" + Coupling.data.selectedTribeId + "/player/" + $scope.player._id);
    };
});

controllers.controller('TribeListController', function ($scope, $location, Coupling) {
    $scope.tribes = Coupling.data.tribes;
    $scope.playerRoster.minimized = true;
    Coupling.selectTribe(null);
    $scope.clickOnTribeCard = function (tribe) {
        $location.path("/" + tribe._id + "/pairAssignments/current");
    };
    $scope.clickOnTribeName = function (tribe) {
        $location.path("/" + tribe._id);
    };
});

controllers.controller('NewTribeController', function ($scope, Coupling, $location) {
    $scope.tribe = {name: 'New Tribe'};
    Coupling.selectTribe(null);
    $scope.saveTribe = function () {
        Coupling.saveTribe($scope.tribe, function () {
            $location.path("/" + $scope.tribe._id + "/pairAssignments/current");
        });
    }
});

controllers.controller('EditTribeController', function ($scope, Coupling, $location, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId);
    $scope.tribe = Coupling.data.selectedTribe;
    $scope.saveTribe = function () {
        Coupling.saveTribe($scope.tribe, function () {
            $location.path("/" + $scope.tribe._id + "/pairAssignments/current");
        });
    }
});

controllers.controller('HistoryController', function ($scope, Coupling, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId);
    $scope.playerRoster.minimized = true;
});

controllers.controller('NewPairAssignmentsController', function ($scope, $location, Coupling, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId, function () {
        var selectedPlayers = _.filter(Coupling.data.players, function (player) {
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
    Coupling.selectTribe($routeParams.tribeId, function () {
        Coupling.data.currentPairAssignments = Coupling.data.history[0];
    });
    $scope.playerRoster.minimized = false;
});

controllers.controller('NewPlayerController', function ($scope, Coupling, $location, $routeParams) {
    Coupling.selectTribe($routeParams.tribeId);
    $scope.playerRoster.minimized = false;
    $scope.player = {tribe: $routeParams.tribeId};
    $scope.savePlayer = function () {
        Coupling.savePlayer($scope.player, function (updatedPlayer) {
            $location.path("/" + $routeParams.tribeId + "/player/" + updatedPlayer._id);
        });
    }
});

controllers.controller('EditPlayerController', function ($scope, Coupling, $routeParams, $location) {
    Coupling.selectTribe($routeParams.tribeId);
    $scope.playerRoster.minimized = false;
    Coupling.findPlayerById($routeParams.id, function (player) {
        $scope.original = player;
        $scope.player = angular.copy(player);
    });

    $scope.savePlayer = function () {
        Coupling.savePlayer($scope.player);
    };

    $scope.removePlayer = function () {
        if (confirm("Are you sure you want to delete this player?")) {
            Coupling.removePlayer($scope.player, function () {
                $location.path("/" + $routeParams.tribeId + "/pairAssignments/current");
            });
        }
    };

    $scope.$on('$locationChangeStart', function () {
        if (!angular.equals($scope.original, $scope.player)) {
            var answer = confirm("You have unsaved data. Would you like to save before you leave?");
            if (answer) {
                Coupling.savePlayer($scope.player);
            }
        }
    });
});