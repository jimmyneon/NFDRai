# Battery Health Quick Reference

## How to Check iPhone Battery Health

**Customer Instructions:**
```
Settings > Battery > Battery Health & Charging
```

## Battery Health Thresholds

| Percentage | Recommendation | AI Response |
|------------|---------------|-------------|
| **85% or below** | ✅ **Definitely replace** | "That definitely needs replacing! Below 85% is when you'll notice poor battery life" |
| **86-90%** | ⚠️ **Starting to degrade** | "It's starting to degrade. If you're noticing issues, it's worth replacing" |
| **Above 90%** | ✔️ **Still good** | "Still pretty good! But if you feel it's not performing well, trust your experience" |

## Key Principle

**Always validate subjective experience over percentage:**
> "If you're noticing issues, that's what matters - the percentage is just a guide"

## Battery Combo Discount

When customer books screen repair:
- Battery normally: **£50**
- Battery with screen: **£30** (£20 off)
- Total savings: **£20**

## Proactive Mention

When confirming screen repair, always mention:
```
"By the way, you can check your battery health in Settings > Battery > 
Battery Health & Charging. If it's 85% or below, or if you feel it's 
not performing well, we do £20 off battery replacements when done with 
a screen - so it'd be £30 instead of £50. Worth checking before you 
come in!"
```

## Multi-Question Efficiency

### ❌ Old Way (Inefficient)
```
Customer: "Do you think my battery needs doing?"
AI: "It's hard to say without checking it in person..."
```

### ✅ New Way (Efficient)
```
Customer: "Do you think my battery needs doing?"
AI: "You can check yourself! Go to Settings > Battery > Battery Health 
& Charging - if it shows 85% or below, it definitely needs replacing. 
Or if you feel it's not performing well, trust your experience. Since 
you're getting the screen done anyway, we do £20 off batteries when 
done together - so it'd be £30 instead of £50. Worth checking before 
you come in!"
```

## Benefits

### For Customers:
- 🎓 **Educated** - Know how to check battery health
- 💪 **Empowered** - Can self-diagnose before visit
- ✅ **Validated** - Subjective experience respected
- 💰 **Informed** - Know about combo savings

### For Business:
- 📈 **Higher conversion** - Customers book with confidence
- 💵 **Better upsells** - Proactive combo mentions
- ⚡ **More efficient** - Fewer back-and-forth messages
- 🌟 **Professional** - Shows expertise and care

## Quick Test

Send these test messages to verify:

1. **"My battery drains fast"**
   - Expected: AI guides to check Settings > Battery > Battery Health & Charging

2. **"Battery health is 78%"**
   - Expected: "That definitely needs replacing! Below 85%..."

3. **"Do you think my battery needs doing?"** (during screen repair)
   - Expected: Comprehensive answer with self-check + combo discount

---

**Updated:** 8 Nov 2024  
**Migration:** `020_improve_battery_guidance.sql`  
**Full Docs:** `BATTERY_AND_FLOW_IMPROVEMENTS.md`
