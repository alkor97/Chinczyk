/// <reference path="MoveEngine.ts" />

interface GameEngineScope {
  usedTimeout?: number;
  dice?: number;
  startAttempts?: number;
  players?: Player[];
  currentPlayerIndex?: number;
  player?: Player;
  gamePaused?: boolean;
  gamePausing?: boolean;
}

type TimeoutFunction = (callback: any, timeout: number) => void;

interface SVGAnimateElement extends Element {
  beginElement(): void;
  onend(): void;
}

class GameEngine {
  private readonly moveEngine: MoveEngine;
  private readonly $scope: GameEngineScope;
  private readonly $timeout: TimeoutFunction;

  constructor(moveEngine: MoveEngine, $scope: GameEngineScope = {}, $timeout: TimeoutFunction = setTimeout) {
    this.moveEngine = moveEngine;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.reset();
  }

  private sortMoves(player: Player, availableMoves: MoveDescription[]): MoveDescription[] {
    function toNumberEval(state: number, current: number, idx: number) {
      if (idx === player - 1) {
        return state + current;
      } else {
        return state - current;
      }
    }
    return availableMoves.sort((a: MoveDescription, b: MoveDescription) => {
      let aa = a.eval.reduce(toNumberEval, 0);
      let bb = b.eval.reduce(toNumberEval, 0);
      return bb - aa;
    });
  }

  private step(fn: () => void, timeout: number = this.$scope.usedTimeout): void {
    const ctx = this;
    this.$timeout(() => {
      fn.call(ctx);
    }, timeout);
  }

  reset(): void {
    this.$scope.usedTimeout = 250;
    this.$scope.dice = 0;
    this.$scope.startAttempts = 0;
    this.$scope.players = Tools.clone(this.moveEngine.getPlayers());
    this.$scope.currentPlayerIndex = this.$scope.players.length - 1;
    this.$scope.player = this.$scope.players[this.$scope.currentPlayerIndex];
    this.$scope.gamePaused = true;
    this.$scope.gamePausing = false;
    this.moveEngine.reset();
  }

  private startRound(): void {
    this.$scope.startAttempts = 0;
    if (this.moveEngine.playerHasFinished(this.$scope.player)) {
      this.$scope.players.splice(this.$scope.currentPlayerIndex, 1);
      if (this.$scope.currentPlayerIndex >= this.$scope.players.length) {
        this.$scope.currentPlayerIndex = 0;
      }
    }
    if (this.$scope.players.length > 0) {
      this.$scope.currentPlayerIndex = (this.$scope.currentPlayerIndex + 1)%this.$scope.players.length;
      this.$scope.player = this.$scope.players[this.$scope.currentPlayerIndex];
    }
    this.throwDice();
  }

  private throwDice(): void {
    this.$scope.dice = 1 + Math.floor(6*Math.random());
    if (this.moveEngine.playerCannotMove(this.$scope.player) && this.$scope.dice !== 6) {
      this.step(this.tryToStart, this.$scope.usedTimeout/2);
    } else {
      this.step(this.performMove, 1);
    }
  }

  private tryToStart(): void {
    ++this.$scope.startAttempts;
    if (this.$scope.startAttempts < 3) {
      this.$scope.dice = 0;
      this.step(this.throwDice);
    } else {
      this.finishRound();
    }
  }

  private moveVisually(player: Player, move: MoveDescription, afterAnimation: () => void): void {
    let moves = this.moveEngine.getPawnMoves(player, move.from, move.to);
    let movesCount = moves.length;
    moves.forEach((move: BoardMove) => {
      let dimCount = 2;
      let pawn = move.pawn;
      let toCoords = move.to;

      // lines below enable animate elements of pawn's circle...
      pawn.w[0] = toCoords[0];
      pawn.w[1] = toCoords[1];

      // ...but change will be visible a moment later
      this.step(() => {
        let animates = document.querySelectorAll('#' + pawn.id + '>animate');
        for (let i = 0; i < animates.length; ++i) {
          const e = <SVGAnimateElement> animates.item(i);
          e.beginElement();
          e.onend = () => {
            e.onend = undefined;
            if (!--dimCount) {
              pawn.w[0] = -1;
              pawn.w[1] = -1;
              if (!--movesCount) {
                this.step(afterAnimation, 1);
              }
            }
          };
        }
      }, 1);
    });
  }

  private performMove(): void {
    const allowedMoves = this.moveEngine.getAllowedMoves(this.$scope.player, this.$scope.dice);
    if (allowedMoves.length > 0) {
      const sortedMoves = this.sortMoves(this.$scope.player, allowedMoves);
      this.moveVisually(this.$scope.player, sortedMoves[0], () => {
        this.moveEngine.movePawn(this.$scope.player, sortedMoves[0]);
        if (this.$scope.dice === 6 && !this.moveEngine.playerHasFinished(this.$scope.player)) {
          this.$scope.dice = 0;
          this.step(this.throwDice);
          return;
        }
        this.finishRound();
      });
      //angular.element(document.body).scope().$root.$apply();
    } else {
      this.finishRound();
    }
  }

  private finishRound(): void {
    this.$scope.dice = 0;
    if (!this.isGameFinished()) {
      if (!this.$scope.gamePaused && !this.$scope.gamePausing) {
        this.step(this.startRound);
      }
      if (this.$scope.gamePausing) {
        this.$scope.gamePaused = true;
        this.$scope.gamePausing = false;
      }
    } else {
      this.$scope.gamePaused = true;
      this.$scope.gamePausing = false;
    }
  }

  private isGameFinished(): boolean {
    return this.$scope.players.length === 0;
  }

  pauseGame(): void {
    this.$scope.gamePausing = true;
  }

  playGame(timeout: number = this.$scope.usedTimeout): void {
    if (this.isGameFinished()) {
      this.reset();
    }
    this.$scope.gamePaused = false;
    this.startRound();
  }
}
