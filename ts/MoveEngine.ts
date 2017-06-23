/// <reference path="LocationBoard.ts" />

class MoveDescription {
  readonly from: number;
  readonly to: number;
  eval?: number[];
}

class MoveEngine {
  private readonly LocationBoard: LocationBoard;

  constructor(locationsBoard: LocationBoard) {
    this.LocationBoard = locationsBoard;
  }

  private doGetAllowedMoves(player: Player, dice: number): MoveDescription[] {
    const fromOrigin = {from: -1, to: 0};

    if (this.LocationBoard.allInDestination(player)) {
      return [];
    }

    if (this.LocationBoard.cannotMove(player)) {
      return dice === 6 ? [fromOrigin] : [];
    }

    let result: MoveDescription[] = [];
    if (dice === 6 && this.LocationBoard.anythingInOrigin(player)) {
      result.push(fromOrigin);
    }

    return this.LocationBoard.getLocations(player)
      .filter((location: BoardLocation) => location.offset > -1 && location.offset < Board.MAX)
      .reduce((result: MoveDescription[], location: BoardLocation) => {
        result.push({
          from: location.offset,
          to: location.offset + dice
        });
        return result;
      }, result);
  }

  private evaluatePawnMoves(player: Player, moves: MoveDescription[]): MoveDescription[] {
    moves.forEach((move: MoveDescription) =>
      move.eval = this.LocationBoard.evaluatePawnMove(player, move.from, move.to)
    );
    return moves;
  }

  getAllowedMoves(player: Player, dice: number): MoveDescription[] {
    let moves = this.doGetAllowedMoves(player, dice);
    return this.evaluatePawnMoves(player, moves);
  }

  movePawn(player: Player, move: MoveDescription): BoardLocation[] {
    return this.LocationBoard.movePawn(player, move.from, move.to);
  }

  getPlayers(): Player[] {
    return this.LocationBoard.getPlayers();
  }

  playerHasFinished(player: Player): boolean {
    return this.LocationBoard.allInDestination(player);
  }

  playerCannotMove(player: Player): boolean {
    return this.LocationBoard.cannotMove(player);
  }

  reset(): void {
    this.LocationBoard.reset();
  }

  getCoords(player: Player, offset: number) {
    return this.LocationBoard.getCoords(player, offset);
  }

  getPawnMoves(player: Player, fromOffset: number, toOffset: number) {
    return this.LocationBoard.getPawnMoves(player, fromOffset, toOffset);
  }
}
