# Slot Search Performance Analysis

## Current Implementation: 3-Day Slot Search

### Overview
The slot search now checks up to 3 days (today, tomorrow, day after tomorrow) to find the next available appointment slot.

---

## Performance Impact Analysis

### 1. **Database Queries**

#### Before (2-day search):
- **Queries per clinic card**: 2 RPC calls maximum
  - 1 query for today's slots
  - 1 query for tomorrow's slots (if today has none)
- **Total queries for 4 clinic cards**: 4-8 queries

#### After (3-day search):
- **Queries per clinic card**: 3 RPC calls maximum
  - 1 query for today's slots
  - 1 query for tomorrow's slots
  - 1 query for day after tomorrow's slots
- **Total queries for 4 clinic cards**: 4-12 queries

**Impact**: +50% increase in maximum queries (from 8 to 12)

---

### 2. **Network Overhead**

#### Estimated Response Times:
- **Single RPC call**: ~50-150ms (depending on network + DB)
- **3 sequential calls**: ~150-450ms per clinic card
- **4 clinic cards in parallel**: ~150-450ms total (if parallelized)

**Current implementation**: Sequential within each card, but cards load in parallel.

**Impact**: Moderate - adds ~50-150ms per clinic card in worst case

---

### 3. **UI/UX Impact**

#### Loading State:
- **Skeleton loader**: Shows while fetching slots
- **User perception**: Minimal impact since cards load progressively
- **Staggered animations**: Hide loading delays

#### Display Changes:
- **"No slots today"** → **"No slots soon"** (when no slots in 3 days)
- **Better UX**: Shows "Wed, 2:30 PM" instead of giving up after tomorrow

---

### 4. **Scalability Analysis**

#### Current Scale (Homepage):
- **4 clinic cards** × **3 queries** = **12 queries maximum**
- **Load time**: ~150-450ms (acceptable)

#### Search Results Page (20-50 clinics):
- **20 clinics** × **3 queries** = **60 queries maximum**
- **50 clinics** × **3 queries** = **150 queries maximum**
- **Load time**: Could be 1-3 seconds for all cards

**Concern**: This could become a bottleneck on search results pages with many clinics.

---

## Optimization Recommendations

### ✅ **Already Implemented (Good Practices)**

1. **Early Exit**: Loop stops as soon as a slot is found
2. **Cancelled Flag**: Prevents state updates on unmounted components
3. **Single Doctor Query**: Only checks first doctor (not all doctors)
4. **Parallel Card Loading**: Cards fetch independently

### 🚀 **Recommended Optimizations**

#### 1. **Backend Aggregation** (Best Solution)
Create a new RPC function that checks multiple days in one call:

```sql
CREATE OR REPLACE FUNCTION get_next_available_slot(
  p_clinic_id UUID,
  p_days_ahead INT DEFAULT 3
)
RETURNS TABLE (
  slot_date DATE,
  slot_time TIME,
  day_offset INT
) AS $$
BEGIN
  -- Single query that checks multiple days
  -- Returns first available slot across all days
END;
$$ LANGUAGE plpgsql;
```

**Impact**: Reduces 3 queries to 1 query per clinic
- **Before**: 12 queries for 4 clinics
- **After**: 4 queries for 4 clinics
- **Improvement**: 66% reduction in queries

---

#### 2. **Caching Strategy**
Cache slot availability for 5-10 minutes:

```typescript
// Simple in-memory cache
const slotCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSlot(clinicId: string) {
  const cached = slotCache.get(clinicId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

**Impact**: Eliminates redundant queries for same clinic
- **Use case**: User scrolls back to same clinic cards
- **Improvement**: Near-instant load on cache hit

---

#### 3. **Batch Query API**
Create an endpoint that fetches slots for multiple clinics at once:

```typescript
// Instead of 4 separate calls
const slots = await Promise.all([
  getSlot(clinic1),
  getSlot(clinic2),
  getSlot(clinic3),
  getSlot(clinic4),
]);

// Use batch API
const slots = await getSlotsBatch([clinic1, clinic2, clinic3, clinic4]);
```

**Impact**: Reduces network overhead
- **Before**: 4 HTTP requests
- **After**: 1 HTTP request
- **Improvement**: Faster overall load time

---

#### 4. **Lazy Loading with Intersection Observer**
Only fetch slots when clinic card is visible:

```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      fetchSlots();
    }
  });
  
  if (cardRef.current) {
    observer.observe(cardRef.current);
  }
  
  return () => observer.disconnect();
}, []);
```

**Impact**: Reduces initial load
- **Homepage**: Load only visible cards first
- **Search page**: Load as user scrolls
- **Improvement**: Faster perceived performance

---

#### 5. **Precomputed Slot Availability**
Add a `next_available_slot` column to clinics table, updated via trigger:

```sql
ALTER TABLE clinics ADD COLUMN next_available_slot JSONB;

-- Trigger updates this when slots change
-- { "date": "2024-01-15", "time": "14:30", "day_offset": 1 }
```

**Impact**: Zero queries for slot display
- **Before**: 3 queries per clinic
- **After**: 0 queries (data already in clinic record)
- **Improvement**: Instant display, 100% reduction

**Trade-off**: Requires background job to keep data fresh

---

## Current Performance Verdict

### ✅ **Acceptable for Current Use Case**
- **Homepage (4 clinics)**: Perfectly fine
- **Load time**: 150-450ms is acceptable
- **User experience**: Smooth with skeleton loaders

### ⚠️ **Potential Issues at Scale**
- **Search results (50+ clinics)**: Could be slow
- **Mobile networks**: 3 queries per card might be noticeable
- **Database load**: 150 queries for 50 clinics is heavy

---

## Recommended Implementation Priority

### Phase 1: Quick Wins (Implement Now)
1. ✅ **Early exit optimization** (already done)
2. ✅ **Parallel loading** (already done)
3. 🔄 **Add simple caching** (5 minutes TTL)

### Phase 2: Backend Optimization (Next Sprint)
1. 🎯 **Create `get_next_available_slot` RPC** (single query for 3 days)
2. 🎯 **Add batch query endpoint** (multiple clinics at once)

### Phase 3: Advanced Optimization (Future)
1. 🔮 **Precomputed slot availability** (background job)
2. 🔮 **Redis caching layer** (distributed cache)
3. 🔮 **Lazy loading with Intersection Observer**

---

## Monitoring Recommendations

### Metrics to Track:
1. **Average query time** per clinic card
2. **95th percentile load time** for clinic cards
3. **Database query count** per page load
4. **User bounce rate** on search results page

### Alert Thresholds:
- ⚠️ **Warning**: Average load time > 500ms
- 🚨 **Critical**: Average load time > 1000ms
- 🚨 **Critical**: Database queries > 200 per page

---

## Conclusion

### Current Implementation (3-day search):
- ✅ **Good for homepage** (4 clinics)
- ⚠️ **Acceptable for small search results** (10-20 clinics)
- ❌ **Not scalable for large search results** (50+ clinics)

### Recommendation:
**Implement Phase 1 (caching) immediately**, then plan Phase 2 (backend optimization) for next sprint. The current implementation is fine for MVP but needs optimization before scaling to high-traffic search results pages.

### Performance Score:
- **Current**: 7/10 (good for MVP, needs optimization for scale)
- **With Phase 1**: 8/10 (production-ready for moderate traffic)
- **With Phase 2**: 9/10 (production-ready for high traffic)
- **With Phase 3**: 10/10 (enterprise-grade performance)
