export class Apple {
    constructor(cols, rows, snakeBody = []) {
        this.cols = cols;
        this.rows = rows;
        this.position = this.randomPosition(snakeBody);
    }

    randomPosition(snakeBody = []) {
        const x = Math.floor(Math.random() * (this.cols - 2)) + 1;
        const y = Math.floor(Math.random() * (this.rows - 2)) + 1;

        if (snakeBody.some(part => part.x === x && part.y === y)) {
            return this.randomPosition(snakeBody);
        }

        return { x, y };
    }
}