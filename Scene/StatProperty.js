export class StatAttr {
    constructor({
        Health,
        MaxHealth,
        Attack,
        AttackRange,
        Defense,
    } = {}) {
        this.Health = Health;
        this.MaxHealth = MaxHealth;
        this.Attack = Attack;
        this.AttackRange = AttackRange;
        this.Defense = Defense;
    }
}