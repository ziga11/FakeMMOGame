export class Skill {
    constructor({color1, color2, damage, dmgOverTime, slow}) {
        this.color1 = color1;
        this.color2 = color2;
        this.dmgOverTime = dmgOverTime;
        this.damage = damage;
        this.slow = slow;
        this.visible = false;
    }
}