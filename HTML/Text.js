export class Text {
    constructor({
        x, y, htmlType, textWeight, text,
        centered = false, right = false,
        bot = false, fixed = false,
        visible = false} = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.htmlType = htmlType; /* h1, h2, pre, p, ...*/
        this.textWeight = textWeight; /* bold, ...*/
        this.centered = centered;
        this.bot = bot;
        this.right = right;
        this.fixed = fixed;
        this.visible = visible;
    }
}