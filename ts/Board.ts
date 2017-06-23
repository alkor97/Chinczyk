/// <reference path="Tools.ts" />

type BoardPosition = number[];

enum Player {p1 = 1, p2 = 2, p3 = 3, p4 = 4};

class BoardLocation {
  readonly id: string;
  readonly player: Player;
  v: BoardPosition;
  w: BoardPosition;
  offset: number;
  constructor() {
    this.id = "";
    this.player = 0;
    this.v = this.w = [-1, -1];
    this.offset = -1;
  }
}

class BoardMove {
  readonly pawn: BoardLocation;
  readonly to: BoardPosition;
}

class Board {
  private readonly initial: BoardPosition[];
  private readonly origins = [
    [[0, 0], [0,  1], [1,   1], [1,  0]],
    [[0, 9], [0, 10], [1,  10], [1,  9]],
    [[9, 9], [9, 10], [10, 10], [10, 9]],
    [[9, 0], [9,  1], [10,  1], [10, 0]]
  ];

  // used by board rendering
  public board: BoardPosition[];
  // used by pawns rendering
  public locations: BoardLocation[];
  private readonly starts = [
    [4, 0], [0, 6], [6, 10], [10, 4]
  ];
  private readonly destinations = [
    [[5, 4], [5, 3], [5, 2], [5, 1]],
    [[4, 5], [3, 5], [2, 5], [1, 5]],
    [[5, 6], [5, 7], [5, 8], [5, 9]],
    [[6, 5], [7, 5], [8, 5], [9, 5]]
  ];

  private static readonly qpaths = [
    [[4,  0], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0,  4], [0,  5]],
    [[0,  6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [5, 10]],
    [[6, 10], [6, 9], [6, 8], [6, 7], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [10, 5]],
    [[10, 4], [9, 4], [8, 4], [7, 4], [6, 4], [6, 3], [6, 2], [6, 1], [6,  0], [5,  0]]
  ];

  public static readonly MAX = Board.qpaths.length*Board.qpaths[0].length;
  private readonly players = [Player.p1, Player.p2, Player.p3, Player.p4];

  constructor() {
    // players
    const p1 = Player.p1;
    const p2 = Player.p2;
    const p3 = Player.p3;
    const p4 = Player.p4;

    const t = 0; // transparent
    const e = 10; // empty modifier
    const d = 100; // destination modifier
    const s = 1000; // start modifier
    const o = 10000; // origin modifier

    this.initial = [
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

    this.reset();
  }

  reset(): void {
    this.board = Tools.clone(this.initial);

    if (!this.locations) {
      let origins = this.origins;
      this.locations = this.origins.reduce((state: any, origins: BoardPosition[], playerIndex: number) => {
        const player: Player = playerIndex + 1;
        state = state.concat(origins.map((v, idx) => {
          return {
            id: 'p' + player + '_' + (idx + 1),
            player: player,
            v: v,
            w: [-1, -1],
            offset: -1
          };
        }));
        return state;
      }, []);
    } else {
      this.locations.forEach((location: BoardLocation, index: number) => {
        location.offset = -1;
        location.v[0] = this.origins[location.player - 1][index%4][0];
        location.v[1] = this.origins[location.player - 1][index%4][1];
        location.w[0] = -1;
        location.w[1] = -1;
      });
    }
  }

  getPawn(v: BoardPosition, explicitLocations: BoardLocation[] = this.locations): BoardLocation {
    const locations = explicitLocations.filter((location: BoardLocation) => location.v[0] == v[0] && location.v[1] == v[1]);
    if (locations.length > 0) {
      return locations[0];
    }
    return new BoardLocation();
  }

  getFreeOriginCoords(player: Player, explicitLocations: BoardLocation[]): BoardPosition | undefined {
    const playerOrigins: BoardPosition[] = this.origins[player - 1];
    for (let i = playerOrigins.length - 1; i >= 0; --i) {
      let v: BoardPosition = playerOrigins[i];
      if (player !== this.getPawn(v, explicitLocations).player) {
        return [v[0], v[1]];
      }
    }
    return undefined;
  }

  getPawnMoves(fromCoords: BoardPosition, toCoords: BoardPosition, explicitLocations: BoardLocation[]): BoardMove[] {
    let pawnAtFromCoords = this.getPawn(fromCoords, explicitLocations);
    let pawnAtToCoords = this.getPawn(toCoords, explicitLocations);
    let moves: BoardMove[] = [];

    if (pawnAtFromCoords.player > 0) {
      moves.push({
        pawn: pawnAtFromCoords,
        to: toCoords
      });
      if (pawnAtToCoords.player > 0) {
        let toFreeCoords: BoardPosition = this.getFreeOriginCoords(pawnAtToCoords.player, explicitLocations);
        moves.push({
          pawn: pawnAtToCoords,
          to: toFreeCoords
        });
      }
    }
    return moves;
  }

  movePawn(fromCoords: BoardPosition, toCoords: BoardPosition, explicitLocations: BoardLocation[]): BoardLocation[] {
    const moves: BoardMove[] = this.getPawnMoves(fromCoords, toCoords, explicitLocations);
    return moves.map((move: BoardMove) => {
      move.pawn.v = move.to;
      return move.pawn;
    });
  }

  getFreeDestinationCoords(player: Player, explicitLocations: BoardLocation[]): BoardPosition {
    const playerDestinations: BoardPosition[] = this.destinations[player - 1];
    const positions = playerDestinations.filter((v: BoardPosition) => player !== this.getPawn(v, explicitLocations).player);
    return [positions[0][0], positions[0][1]];
  }

  getOccupiedOriginCoords(player: Player, explicitLocations: BoardLocation[]): BoardPosition {
    const playerOrigins: BoardPosition[] = this.origins[player - 1];
    const positions = playerOrigins.filter((v: BoardPosition) => player === this.getPawn(v, explicitLocations).player);
    return [positions[0][0], positions[0][1]];
  }

  static clampOffset(offset: number): number {
    return Math.max(-1, Math.min(Board.MAX, offset));
  }

  getCoordsOfPlayerOffset(player: Player, offset: number, explicitLocations: BoardLocation[]): BoardPosition {
    if (offset < 0) {
      return this.getOccupiedOriginCoords(player, explicitLocations);
    }

    const qpathsLength = Board.qpaths.length;
    const qpathLength = Board.qpaths[0].length;
    const qpathIndex = Tools.div(offset, qpathLength);
    if (qpathIndex < qpathsLength) {
      var qpathIndex2 = (qpathIndex + player - 1)%qpathsLength;
      var coords = Board.qpaths[qpathIndex2][offset%qpathLength];
      return [coords[0], coords[1]];
    }

    return this.getFreeDestinationCoords(player, explicitLocations);
  }

  convertOffset(fromPlayer: Player, fromOffset: number, toPlayer: Player): number {
    const qpathLength = Board.qpaths[0].length;
    const globalOffset = ((fromPlayer - 1)*qpathLength + fromOffset)%Board.MAX;
    return (Board.MAX + globalOffset - (toPlayer - 1)*qpathLength)%Board.MAX;
  }

  evaluateLocations(explicitLocations: BoardLocation[]): number[] {
    const evaluations: object = explicitLocations.reduce((evaluation: any, location: BoardLocation) => {
      if (location.player in evaluation) {
        evaluation[location.player] += location.offset;
      } else {
        evaluation[location.player] = location.offset;
      }
      return evaluation;
    }, {});
    return this.players.map(function(player) {
      return evaluations[player];
    });
  }

  doMovePawn(player: Player, fromOffset: number, toOffset: number, explicitLocations: BoardLocation[]): BoardLocation[] {
    fromOffset = Board.clampOffset(fromOffset);
    toOffset = Board.clampOffset(toOffset);
    const fromCoords = this.getCoordsOfPlayerOffset(player, fromOffset, explicitLocations);
    const toCoords = this.getCoordsOfPlayerOffset(player, toOffset, explicitLocations);
    const affectedPawns = this.movePawn(fromCoords, toCoords, explicitLocations);
    affectedPawns.forEach((affectedPawn: BoardLocation, affectedPawnIndex: number) => {
      if (affectedPawnIndex === 0) {
        affectedPawn.offset = toOffset;
      } else {
        affectedPawn.offset = -1;
      }
    });
    return affectedPawns;
  }

  getPlayers(): Player[] {
    return this.players;
  }

  getLocations(filter?: (BoardLocation) => boolean): BoardLocation[] {
    return filter ? this.locations.filter(filter) : this.locations;
  }
}
