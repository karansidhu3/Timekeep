# TimeKeep — Recording Checklist

## Before every session

1. Run `VIDEO_PREP.sql` in the [Supabase SQL editor](https://supabase.com/dashboard/project/zacwmkjldmnxwjsrdttl/editor)
2. Open the app and verify: Jake shows as "Clocked In" in admin dashboard
3. Open Screen Studio, set device frame if doing mobile clip

---

## What to record

Acts I, IV, and V are pure text — done entirely in editing, no screen recording needed.

---

### CLIP A — Employee experience (Act II)

**Duration target:** 25–35 seconds  
**Viewport:** Mobile (375px or iPhone frame in Screen Studio)  
**One continuous take — no cuts, no restarts mid-flow**

Sequence:
1. Employee login page — employees listed
2. Tap **Todd**
3. Enter PIN: **5 5 5 5**
4. Dashboard loads — shows "Your shift started"
5. Tap **Clock in**
6. Dark on-shift screen appears — elapsed timer ticking
7. *(pause 2–3 seconds on the timer)*
8. Navigate to **Schedule** tab
9. View the week — let it settle
10. *(pause 2–3 seconds)*
11. Navigate back to **Clock** tab
12. Hold **Clock out** until it completes

**Notes:**
- Let every transition finish before the next tap
- The typography card ("tap once. / clocked in.") is added in editing — you don't need to pause for it
- If you want a second take: run VIDEO_PREP.sql again, then redo from step 1

---

### CLIP B — Admin dashboard (Act III, part 1)

**Duration target:** 10–15 seconds  
**Viewport:** Desktop or tablet  

Sequence:
1. Open admin dashboard
2. Dashboard loads — Jake clocked in, Sara late, Todd late
3. Slow scroll or deliberate pause to let each section register
4. Hold on the full dashboard view

**Notes:**
- Don't click anything — just let the state speak
- If Sara and/or Todd show as "Upcoming" instead of "Late" (recording early in the morning), that's fine — it still demonstrates the dashboard

---

### CLIP C — Admin schedule + create shift (Act III, part 2)

**Duration target:** 20–25 seconds  
**Viewport:** Desktop or tablet  

Sequence:
1. Navigate to **Schedule**
2. Week grid loads — all three employees visible
3. *(pause on the grid)*
4. Navigate to **next week** using the arrow
5. Click **Add shift** (or the + button)
6. Modal opens — fill in deliberately:
   - Employee: Sara
   - Day: Monday
   - Start: 10:00 AM, End: 6:00 PM
7. Submit — shift appears on the grid

**Notes:**
- Do this for next week so VIDEO_PREP.sql resets it cleanly on the next take
- The typography card ("schedule set. / four seconds.") is added in editing

---

### CLIP D — Apply template (Act III, part 3)

**Duration target:** 10 seconds  
**Viewport:** Desktop or tablet  
**Record immediately after CLIP C while still on next week's schedule**

Sequence:
1. Still on next week's schedule view
2. Open the options/template menu (top right of schedule)
3. Click **Apply template for this week**
4. Remaining shifts populate across the week grid

**Notes:**
- This adds the rest of next week's shifts alongside the one you created in Clip C
- Safe to combine with CLIP C in a single take if the flow feels natural

---

### CLIP E — Admin time entries (Act III, part 4)

**Duration target:** 8–10 seconds  
**Viewport:** Desktop or tablet  

Sequence:
1. Navigate to **Time Entries**
2. List loads — Jake's entries across this week and last week visible
3. Slow scroll through the list
4. Hold on the full list

---

## Full section map

| Film section | Type | Source |
|---|---|---|
| Act I — Observation | Text cards | Editing only |
| Act II — Product | Screen recording | CLIP A |
| Act II — Typography card | Text overlay | Editing only |
| Act III — Dashboard | Screen recording | CLIP B |
| Act III — Schedule | Screen recording | CLIP C + D |
| Act III — Typography card | Text overlay | Editing only |
| Act III — Time Entries | Screen recording | CLIP E |
| Act IV — Reflection | Text cards | Editing only |
| Act V — End Card | Text cards | Editing only |

---

## After recording is done

1. Review all clips — confirm you have clean takes of A through E
2. Let me know — I'll clean up the demo data and deploy the app live
3. Edit in the text cards and typography overlays
4. Export and publish
