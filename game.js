
var Tools = function() {
  return {
    div: function(a, b) {
      return Math.floor(a/b);
    },
    clone: function(other) {
      return JSON.parse(JSON.stringify(other));
    }
  };
};

var Board = function(tools) {
  var t = 0; // transparent
  var e = 10; // empty modifier
  var d = 100; // destination modifier
  var s = 1000; // start modifier
  var o = 10000; // origin modifier

  // players
  var p1 = 1;
  var p2 = 2;
  var p3 = 3;
  var p4 = 4;

  var initial = [
    [o*p1 + p1, o*p1 + p1,    t,    t,    e,    e, s*p2,    t,    t, o*p2 + p2, o*p2 + p2],
    [o*p1 + p1, o*p1 + p1,    t,    t,    e, d*p2,    e,    t,    t, o*p2 + p2, o*p2 + p2],
    [        t,         t,    t,    t,    e, d*p2,    e,    t,    t,         t,         t],
    [        t,         t,    t,    t,    e, d*p2,    e,    t,    t,         t,         t],
    [     s*p1,         e,    e,    e,    e, d*p2,    e,    e,    e,         e,         e],
    [        e,      d*p1, d*p1, d*p1, d*p1,    t, d*p3, d*p3, d*p3,      d*p3,         e],
    [        e,         e,    e,    e,    e, d*p4,    e,    e,    e,         e,      s*p3],
    [        t,         t,    t,    t,    e, d*p4,    e,    t,    t,         t,         t],
    [        t,         t,    t,    t,    e, d*p4,    e,    t,    t,         t,         t],
    [o*p4 + p4, o*p4 + p4,    t,    t,    e, d*p4,    e,    t,    t, o*p3 + p3, o*p3 + p3],
    [o*p4 + p4, o*p4 + p4,    t,    t, s*p4,    e,    e,    t,    t, o*p3 + p3, o*p3 + p3]
  ];

  var board;

  var origins = [
    [[0, 0], [0,  1], [1,   1], [1,  0]],
    [[0, 9], [0, 10], [1,  10], [1,  9]],
    [[9, 9], [9, 10], [10, 10], [10, 9]],
    [[9, 0], [9,  1], [10,  1], [10, 0]]
  ];

  var locations;
  
  function restart() {
    board = initial;
    locations = origins.reduce(function(state, origins, playerIndex) {
      var player = playerIndex + 1;
      state = state.concat(origins.map(function(v, idx) {
        return {
          id: 'p' + player + '_' + (idx + 1),
          player: player,
          v: v
        };
      }));
      return state;
    }, []);
  }
  restart();

  var starts = [
    [4, 0], [0, 6], [6, 10], [10, 4]
  ];

  var destinations = [
    [[5, 4], [5, 3], [5, 2], [5, 1]],
    [[4, 5], [3, 5], [2, 5], [1, 5]],
    [[5, 6], [5, 7], [5, 8], [5, 9]],
    [[6, 5], [7, 5], [8, 5], [9, 5]]
  ];

  var qpaths = [
    [[4,  0], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0,  4], [0,  5]],
    [[0,  6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [5, 10]],
    [[6, 10], [6, 9], [6, 8], [6, 7], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [10, 5]],
    [[10, 4], [9, 4], [8, 4], [7, 4], [6, 4], [6, 3], [6, 2], [6, 1], [6,  0], [5,  0]]
  ];

  var max = qpaths.length*qpaths[0].length;

  function getPawn(v) {
    var idx = locations.findIndex(function(e) {
      return e.v[0] == v[0] && e.v[1] == v[1];
    });
    return idx > -1 ? locations[idx] : {player: 0};
  }

  function getFreeOriginCoords(player) {
    var playerOrigins = origins[player - 1];
    for (var i = playerOrigins.length - 1; i >= 0; --i) {
      var v = playerOrigins[i];
      if (player !== getPawn(v).player) {
        return v;
      }
    }
    return undefined;
  }

  function movePawn(fromCoords, toCoords, dryRun) {
    var affectedPlayers = [];
    var pawnAtFromCoords = getPawn(fromCoords);
    var pawnAtToCoords = getPawn(toCoords);

    if (pawnAtFromCoords.player > 0) {
      if (!dryRun) {
        pawnAtFromCoords.v = toCoords;
      }
      affectedPlayers.push(pawnAtFromCoords.player);
      if (pawnAtToCoords.player > 0) {
        var originCoords = getFreeOriginCoords(pawnAtToCoords.player);
        if (!dryRun) {
          pawnAtToCoords.v = originCoords;
        }
        affectedPlayers.push(pawnAtToCoords.player);
      }
    }
    return affectedPlayers;
  }

  function getFreeDestinationCoords(player) {
    var playerDestinations = destinations[player - 1];
    var idx = playerDestinations.findIndex(function(v) {
      return player !== getPawn(v).player;
    });
    return playerDestinations[idx];
  }

  function getOccupiedOriginCoords(player) {
    var playerOrigins = origins[player - 1];
    var idx = playerOrigins.findIndex(function(v) {
      return player === getPawn(v).player;
    });
    return playerOrigins[idx];
  }

  var players = [p1, p2, p3, p4];

  var offsetBoard = (function() {
    var initial = [
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1]
    ];
    var offsets;

    function restart() {
      offsets = initial;
    }
    restart();

    function getCoordsOfPlayerOffset(player, offset) {
      if (offset < 0) {
        return getOccupiedOriginCoords(player);
      }

      var qpathsLength = qpaths.length;
      var qpathLength = qpaths[0].length;
      var qpathIndex = tools.div(offset, qpathLength);
      if (qpathIndex < qpathsLength) {
        var qpathIndex2 = (qpathIndex + player - 1)%qpathsLength;
        return qpaths[qpathIndex2][offset%qpathLength];
      }

      return getFreeDestinationCoords(player);
    }

    function convertOffset(fromPlayer, fromOffset, toPlayer) {
      var qpathLength = qpaths[0].length;
      var globalOffset = ((fromPlayer - 1)*qpathLength + fromOffset)%max;
      return (max + globalOffset - (toPlayer - 1)*qpathLength)%max;
    }

    function clampOffset(offset) {
      return Math.max(-1, Math.min(max, offset));
    }

    function doMovePawn(player, fromOffset, toOffset, offsetsContainer, dryRun) {
      fromOffset = clampOffset(fromOffset);
      toOffset = clampOffset(toOffset);
      var fromCoords = getCoordsOfPlayerOffset(player, fromOffset);
      var toCoords = getCoordsOfPlayerOffset(player, toOffset);
      var affectedPlayers = movePawn(fromCoords, toCoords, dryRun);
      affectedPlayers.forEach(function(affectedPlayer, affectedPlayerIndex) {
        var playerOffsets = offsetsContainer[affectedPlayer - 1];
        var idx;
        if (affectedPlayerIndex === 0) {
          idx = playerOffsets.indexOf(fromOffset);
          playerOffsets[idx] = toOffset;
        } else {
          var playerOffset = convertOffset(player, toOffset, affectedPlayer);
          idx = playerOffsets.indexOf(playerOffset);
          playerOffsets[idx] = -1;
        }
      });
      return affectedPlayers;
    }

    function cloneOffsets(offsets) {
      return tools.clone(offsets);
    }

    function evaluateOffsets(offsets) {
      return offsets.map(function(playerOffsets) {
        return playerOffsets.reduce(function(sum, offset) {
          return sum + offset;
        });
      });
    }

    return {
      clampOffset: clampOffset,
      restart: function() {
        offsets.restart();
        restart();
      },
      getPawn: function(player, offset) {
        var coords = getCoordsOfPlayerOffset(player, clampOffset(offset));
        return getPawn(coords).player;
      },
      movePawn: function(player, fromOffset, toOffset) {
        return doMovePawn(player, fromOffset, toOffset, offsets);
      },
      evaluateBoard: function() {
        return evaluateOffsets(offsets);
      },
      evaluatePawnMove: function(player, fromOffset, toOffset) {
        var cloned = cloneOffsets(offsets);
        doMovePawn(player, fromOffset, toOffset, cloned, true);
        return evaluateOffsets(cloned);
      },
      anythingInOrigin: function(player) {
        return offsets[player - 1].indexOf(-1) > -1;
      },
      getOffsets: function(player) {
        return offsets[player - 1];
      },
      allInDestination: function(player) {
        return this.evaluateBoard()[player - 1] >= 160;
      },
      getPlayers: function() {
        return players;
      },
      cannotMove: function(player) {
        return offsets[player - 1].filter(function(offset) {
          return offset > -1 && offset < 40;
        }).length === 0;
      }
    };
  })();

  return {
    players: players,
    board: board,
    locations: locations,
    // basics
    getPawn: getPawn,
    movePawn: movePawn,
    // offsets
    offsetBoard: offsetBoard
  };
};

function MoveEngine(offsetBoard) {
  var fromOrigin = {from: -1, to: 0};

  function getAllowedMoves(player, dice) {
    if (offsetBoard.allInDestination(player)) {
      return [];
    }

    if (offsetBoard.cannotMove(player)) {
      return dice === 6 ? [fromOrigin] : [];
    }

    var result = [];
    if (dice === 6 && offsetBoard.anythingInOrigin(player)) {
      result.push(fromOrigin);
    }

    return offsetBoard.getOffsets(player)
      .filter(function(offset) {
        return offset > -1 && offset < 40;
      })
      .reduce(function(result, offset) {
        result.push({
          from: offset,
          to: offsetBoard.clampOffset(offset + dice)
        });
        return result;
      }, result);
  }

  function evaluatePawnMoves(player, moves) {
    return moves.map(function(move) {
      move['eval'] = offsetBoard.evaluatePawnMove(player, move.from, move.to);
      return move;
    });
  }

  return {
    getAllowedMoves: function(player, dice) {
      var moves = getAllowedMoves(player, dice);
      return evaluatePawnMoves(player, moves);
    },
    movePawn: function(player, move) {
      offsetBoard.movePawn(player, move.from, move.to);
    },
    getPlayers: function() {
      return offsetBoard.getPlayers();
    },
    playerHasFinished: function(player) {
      return offsetBoard.allInDestination(player);
    },
    playerCannotMove: function(player) {
      return offsetBoard.cannotMove(player);
    }
  };
}

function GameEngine(moveEngine, tools, $scope, $timeout) {
  $scope = $scope || {};
  $timeout = $timeout || setTimeout;

  function sortMoves(player, availableMoves) {
    function toNumberEval(state, current, idx) {
      if (idx == player - 1) {
        return state + current;
      } else {
        return state - current;
      }
    }
    return availableMoves.sort(function(a, b) {
      var aa = a.eval.reduce(toNumberEval, 0);
      var bb = b.eval.reduce(toNumberEval, 0);
      return bb - aa;
    });
  }

  $scope.usedTimeout = 250;
  function step(fn, timeout) {
    $timeout(fn, timeout || $scope.usedTimeout);
  }

  $scope.dice = 0;
  $scope.startAttempts = 0;
  $scope.players = tools.clone(moveEngine.getPlayers());
  $scope.currentPlayerIndex = $scope.players.length - 1;
  $scope.player = $scope.players[$scope.currentPlayerIndex];
  $scope.gamePaused = true;
  $scope.gamePausing = false;

  function startRound() {
    $scope.startAttempts = 0;
    if (moveEngine.playerHasFinished($scope.player)) {
      $scope.players.splice($scope.currentPlayerIndex, 1);
      if ($scope.currentPlayerIndex >= $scope.players.length) {
        $scope.currentPlayerIndex = 0;
      }
    }
    if ($scope.players.length > 0) {
      $scope.currentPlayerIndex = ($scope.currentPlayerIndex + 1)%$scope.players.length;
      $scope.player = $scope.players[$scope.currentPlayerIndex];
    }
    throwDice();
  }

  function throwDice() {
    $scope.dice = 1 + Math.floor(6*Math.random());
    if (moveEngine.playerCannotMove($scope.player) && $scope.dice !== 6) {
      step(tryToStart, $scope.usedTimeout/2);
    } else {
      step(performMove, $scope.usedTimeout/2);
    }
  }

  function tryToStart() {
    ++$scope.startAttempts;
    if ($scope.startAttempts < 3) {
      $scope.dice = 0;
      step(throwDice);
    } else {
      finishRound();
    }
  }

  function performMove() {
    var allowedMoves = moveEngine.getAllowedMoves($scope.player, $scope.dice);
    if (allowedMoves.length > 0) {
      var sortedMoves = sortMoves($scope.player, allowedMoves);
      moveEngine.movePawn($scope.player, sortedMoves[0]);
      //angular.element(document.body).scope().$root.$apply();
      if ($scope.dice === 6) {
        $scope.dice = 0;
        step(throwDice);
        return;
      }
    }
    finishRound();
  }

  function finishRound() {
    $scope.dice = 0;
    if ($scope.players.length > 0) {
      if (!$scope.gamePaused && !$scope.gamePausing) {
        step(startRound);
      }
      if ($scope.gamePausing) {
        $scope.gamePaused = true;
        $scope.gamePausing = false;
      }
    }
  }

  return {
    playGame: function(timeout) {
      $scope.usedTimeout = timeout || $scope.usedTimeout;
      $scope.gamePaused = false;
      startRound();
    },
    pauseGame: function() {
      $scope.gamePausing = true;
    },
    resetGame: function() {
      $scope.board.reset();
      $scope.board.offsetBoard.reset();
    }
  };
}

var tools = Tools();
var board = Board(tools);

var app = angular.module("Chińczyk", []);
app.controller("MainCtrl", function($scope, $timeout) {

  var c = 11;

  var moveEngine = MoveEngine(board.offsetBoard);
  var game = GameEngine(moveEngine, tools, $scope, $timeout);

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
    var player = field%10;
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
    return "b" + tools.div(col, 10)*10;
  };
  $scope.board = board.board;

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
      game.playGame(500);
    } else {
      game.pauseGame();
    }
  };

  $scope.resetGame = function() {

  };

  $scope.locations = board.locations;
});
