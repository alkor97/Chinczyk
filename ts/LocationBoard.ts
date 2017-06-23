/// <reference path="Board.ts" />

class LocationBoard {
  private readonly board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  allInDestination(player: Player): boolean {
    return this.board.getLocations((location: BoardLocation) =>
      player === location.player && location.offset >= Board.MAX
    ).length === 4;
  }

  cannotMove(player: Player): boolean {
    return this.board.getLocations((location: BoardLocation) =>
      location.player === player && location.offset > -1 && location.offset < Board.MAX
    ).length === 0;
  }

  anythingInOrigin(player: Player): boolean {
    return this.board.getLocations((location: BoardLocation) =>
      location.player === player && location.offset === -1
    ).length > 0;
  }

  getLocations(player: Player): BoardLocation[] {
    return this.board.getLocations((location: BoardLocation) => player === location.player);
  }

  evaluatePawnMove(player: Player, fromOffset: number, toOffset: number): number[] {
    const cloned = Tools.clone(this.board.getLocations());
    this.board.doMovePawn(player, fromOffset, toOffset, cloned);
    return this.board.evaluateLocations(cloned);
  }

  movePawn(player: Player, fromOffset: number, toOffset: number): BoardLocation[] {
    return this.board.doMovePawn(player, fromOffset, toOffset, this.board.getLocations());
  }

  getPawnMoves(player: Player, fromOffset: number, toOffset: number): BoardMove[] {
    fromOffset = Board.clampOffset(fromOffset);
    toOffset = Board.clampOffset(toOffset);
    var fromCoords = this.board.getCoordsOfPlayerOffset(player, fromOffset, this.getLocations(player));
    var toCoords = this.board.getCoordsOfPlayerOffset(player, toOffset, this.getLocations(player));
    return this.board.getPawnMoves(fromCoords, toCoords, this.getLocations(player));
  }

  getCoords(player: Player, offset: number): BoardPosition {
    return this.board.getCoordsOfPlayerOffset(player, offset, this.getLocations(player));
  }

  getPlayers(): Player[] {
    return this.board.getPlayers();
  }

  reset(): void {
    this.board.reset();
  }
}
