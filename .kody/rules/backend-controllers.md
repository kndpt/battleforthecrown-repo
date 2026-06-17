---
title: "Backend — thin controllers"
scope: "file"
path: ["battleforthecrown-backend/src/**/*.controller.ts"]
severity_min: "critical"
languages: ["jsts"]
buckets: ["style-conventions"]
enabled: true
---

@kody-sync

## Instructions

Thin controller rule: validate input via DTO + call one service method + return.

Flag any method > 20 LOC, any direct Prisma call, any business if/else rule.

## Examples

### Bad example

```typescript
@Post('attack')
async attack(@Body() dto: AttackDto) {
  const attacker = await this.prisma.village.findUnique({ where: { id: dto.attackerId } });
  if (!attacker || attacker.troops < dto.troops) {
    throw new BadRequestException('Invalid attack');
  }
  return this.prisma.battle.create({ data: { /* ... */ } });
}
```

### Good example

```typescript
@Post('attack')
async attack(@Body() dto: AttackDto): Promise<BattleResultDto> {
  return this.combatService.launchAttack(dto);
}
```
