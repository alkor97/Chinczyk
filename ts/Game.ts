/// <reference path="Tools.ts" />
/// <reference path="GameEngine.ts" />

interface AngularApplication {
  controller(name: string, body: (...args) => void);
}

interface AngularInterface {
  module(name: string, ...args): AngularApplication;
}
declare const angular: AngularInterface;

const app = angular.module("Chińczyk", []);
app.controller("MainCtrl", ($scope, $timeout) => {

  const c = 11;

  const board = new Board();
  const moveEngine = new MoveEngine(new LocationBoard(board));
  const game = new GameEngine(moveEngine, $scope, $timeout);

  $scope.board = board.board;
  $scope.locations = board.locations;

  $scope.diceMarginX = 5;
  $scope.diceMarginY = 65;
  $scope.diceSize = 44;

  $scope.tileSize = 26;
  $scope.tileMargin = 1;

  $scope.boardMarginX = 5 + $scope.diceSize + $scope.diceMarginX;
  $scope.boardMarginY = 5;
  $scope.boardWidth = c*($scope.tileSize + $scope.tileMargin) + 2*$scope.boardMarginX;
  $scope.boardHeight = c*($scope.tileSize + $scope.tileMargin) + 2*$scope.boardMarginY;

  $scope.pawnMargin = 5;
  $scope.pawnRadius = ($scope.tileSize - 2*$scope.pawnMargin)/2;

  $scope.pawnClass = function(field) {
    const player = field%10;
    return "p" + player;
  };
  $scope.hasPawn = function(field, x, y) {
    return field%10 > 0;
  };
  $scope.pawnOffsetX = function(index) {
    return $scope.tileOffsetX(index) + $scope.pawnMargin + $scope.pawnRadius;
  };
  $scope.pawnOffsetY = function(index) {
    return $scope.tileOffsetY(index) + $scope.pawnMargin + $scope.pawnRadius;
  };
  $scope.tileOffsetX = function(index) {
    return $scope.boardMarginX + ($scope.tileSize + $scope.tileMargin)*index;
  };
  $scope.tileOffsetY = function(index) {
    return $scope.boardMarginY + ($scope.tileSize + $scope.tileMargin)*index;
  };
  $scope.bgClass = function(col) {
    return "b" + Tools.div(col, 10)*10;
  };

  var lowerX = $scope.diceMarginX;
  var lowerY = $scope.diceMarginY;
  var upperX = $scope.boardWidth - $scope.diceMarginX - $scope.diceSize;
  var upperY = $scope.boardHeight - $scope.diceMarginY - $scope.diceSize;

  $scope.diceObjects = [{
    transform: 'translate(' + lowerX + ' ' + lowerY + ')'
  }, {
    transform: 'translate(' + upperX + ' ' + lowerY + ')'
  }, {
    transform: 'translate(' + upperX + ' ' + upperY + ')'
  }, {
    transform: 'translate(' + lowerX + ' ' + upperY + ')'
  }];

  $scope.getDotClass = function(player, dots) {
    if (player === $scope.player && dots.indexOf($scope.dice) > -1) {
      return 'p' + player;
    }
    return 'd0';
  };
  $scope.getDiceClass = function(player) {
    if (player === $scope.player && $scope.dice > 0) {
      return 'b' + player + '000';
    }
    return 'd0';
  };

  $scope.triggerGame = function() {
    if ($scope.gamePaused) {
      game.playGame(250);
    } else {
      game.pauseGame();
    }
  };

  $scope.resetGame = function() {
    game.reset();
  };
});
