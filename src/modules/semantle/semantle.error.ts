export class NotSemantleThreadError extends Error {
  constructor(threadName: string) {
    super(`Not a Semantle thread: ${threadName}`);
    this.name = 'NotSemantleThreadError';
  }
}

export class EmptySemantleGuessError extends Error {
  constructor() {
    super('추측할 단어를 입력해주세요.');
    this.name = 'EmptySemantleGuessError';
  }
}
