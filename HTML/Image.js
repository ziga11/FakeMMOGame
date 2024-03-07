export class ImgObject {
    constructor({
        url, x, y,
        width, height,
        scaledWidth, scaledHeight,
        centered = false, right = false,
        mid = false, bot = false,
        fixed = false, visible = false} = {}) {
        this.url = url;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.scaledWidth = scaledWidth;
        this.scaledHeight = scaledHeight;
        this.right = right;
        this.fixed = fixed;
        this.mid = mid;
        this.bot = bot;
        this.centered = centered;
        this.visible = visible;
    }
}