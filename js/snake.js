export class Snake {
    constructor(color) {
        this.body = [{ x: 5, y: 5 }];
        this.direction = "right";
        this.color = color;
        this.growPending = 0;
    }

    move() {
        const head = { ...this.body[0] };

        switch (this.direction) {
            case "right": head.x++; break;
            case "left": head.x--; break;
            case "up": head.y--; break;
            case "down": head.y++; break;
        }

        this.body.unshift(head);

        if (this.growPending > 0) {
            this.growPending--;
        } else {
            this.body.pop();
        }
    }

    grow() {
        this.growPending++;
    }
}