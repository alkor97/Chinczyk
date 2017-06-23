class Tools {
  static div(a: number, b: number): number {
    return Math.floor(a/b);
  }
  static clone(other: any) {
    return JSON.parse(JSON.stringify(other));
  }
}
