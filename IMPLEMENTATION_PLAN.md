# Implementation Plan

## File Structure

```
src/
├── index.ts                          # ✅ Exists
├── transformer/
│   ├── PlaywrightTransformer.ts      # Main orchestrator
│   ├── PatternProcessor.ts           # Routes to handlers
│   ├── handlers/
│   │   ├── PatternHandler.ts         # Abstract base
│   │   ├── FillPatternHandler.ts     # Extract values (.fill, .selectOption, etc.)
│   │   ├── DefaultPatternHandler.ts  # Text replacement
│   │   ├── TestCaseStartHandler.ts   # Test start
│   │   ├── LastLineHandler.ts        # Last line
│   │   └── CompleteFileNameHandler.ts
│   └── utils/
│       ├── tcUtil.ts                 # Helper functions
│       └── jsonBuilder.ts            # Build JSON output
├── config/
│   └── configLoader.ts               # Load JSON configs
├── types/index.ts                    # ✅ Exists
└── utils/                            # ✅ Exists (fileUtils, logger)
```

## Regex Compatibility (Java → TypeScript)

**Regex strings are mostly compatible**, with one flag difference:

- **Java**: `Pattern.compile(regex, Pattern.DOTALL)` - makes `.` match newlines
- **TypeScript**: `new RegExp(regex, 's')` - `'s'` flag = DOTALL equivalent

**Key Points**:

- ✅ Regex strings from JSON files are **reused as-is**
- ✅ We compile them to `new RegExp(regexString, 's')` when Pattern.DOTALL is needed
- ✅ Java `Pattern.DOTALL` = TypeScript `'s'` flag
- ⚠️ Test regex matching to ensure compatibility (Java/JS regex engines are very similar)

**Approach**: Use regex strings directly from JSON, add `'s'` flag when Java uses DOTALL.

## Regex/Pattern Usage

All patterns come from JSON configs (no hardcoded regex). We compile JSON regex strings to RegExp objects at runtime. Sources: `fill_patterns.json` (23 regex patterns), `replace_texts.json` (161 rules, mostly string markers), `insert_lines.json` (741 patterns, regex or string), `skip_patterns.json` (9 string patterns). We write only the compilation/matching logic, not the patterns themselves.

## Starting State

Clean slate: `src/index.ts`, `types/`, and `utils/` exist. Transformer code removed. Java reference code and config files remain in `src/egain/eureka/` and `files/`.

## Implementation Principles

- **Minimal implementation**: Only what Java does, nothing extra
- **Direct comparison**: Test output against Java at each step
- **Incremental testing**: Verify each step before proceeding
- **Reuse everything possible**: Config files, patterns, logic flow
- **No enhancements**: Get it working first, enhancements later

## Implementation Steps

### Phase 1: Foundation

- Step 1: Create file structure & define TypeScript interfaces matching Java data objects
  - **Test**: Compile project, verify no errors
- Step 2: Build config loader to read all JSON files from `files/` directory
  - **Test**: Load each JSON file, verify structure matches interfaces
  - **Compare**: Same files Java loads
- Step 3: Verify file operations (`fileUtils.ts`, `logger.ts`)
  - **Test**: Read/write test file

### Phase 2: Core Pipeline

- Step 4: Create `PlaywrightTransformer` skeleton with file discovery loop and basic transformFile() that just copies files
  - **Test**: Transform one file, verify output matches input
- Step 5: Implement `TCUtil.applyInsertLinePattern()` - insert lines from `insert_lines.json`
  - **Test**: One test file with login pattern, verify lines inserted
  - **Compare**: Output with Java version
- Step 6: Implement `TCUtil.removeAllNoiseLines()` and prepend file injection
  - **Test**: Verify noise removed, prepend added
  - **Compare**: With Java output

### Phase 3: Pattern Matching

- Step 7: Create abstract `PatternHandler` base class with chain of responsibility
  - **Test**: Simple chain works
- Step 8: Create `PatternProcessor` to route lines to appropriate handlers
  - **Test**: Correct handler selected
- Step 9: Implement `FillPatternHandler` with ONE pattern (`getByTestId().fill()`)
  - **Test**: Extract one value, transform one line
  - **Compare**: JSON output matches Java

### Phase 4: Value Extraction

- Step 10: Extend `FillPatternHandler` to handle all 23 patterns from `fill_patterns.json`
  - **Test**: Each pattern type works
  - **Compare**: All extracted values match Java
- Step 11: Implement key generation (`generateJsonKey()`) and duplicate handling (`_1`, `_2` suffixes)
  - **Test**: Duplicates handled correctly
  - **Compare**: Keys match Java format
- Step 12: Implement data maps (jsonMap, reverseJsonMap, dynamicIdsMap) storage and lookup
  - **Test**: Maps populated correctly
  - **Compare**: Map contents match Java

### Phase 5: Text Replacement

- Step 13: Create `DefaultPatternHandler` skeleton with ONE text replacement rule
  - **Test**: One text replacement works
  - **Compare**: Replacement matches Java
- Step 14: Extend to handle all 161 `replace_texts.json` rules
  - **Test**: All replacement types work
  - **Compare**: Output matches Java
- Step 15: Implement dynamic ID generation
  - **Test**: Dynamic IDs generated correctly
  - **Compare**: ID format matches Java

### Phase 6:权威 Advanced Features

- Step 16: Implement `TestCaseStartHandler` - inject test wrapper
  - **Test**: Test structure correct
  - **Compare**: Wrapper matches Java
- Step 17: Implement `LastLineHandler` - handle file ending
  - **Test**: File ends correctly
  - **Compare**: Ending matches Java
- Step 18: Implement special handlers (CompleteFileNameHandler, file uploads, frames)
  - **Test**: Special cases work
  - **Compare**: Each case matches Java

### Phase 7: Output & Polish

- Step 19: Build JSON output from jsonMap, format correctly
  - **Test**: JSON structure correct
  - **Compare**: JSON matches Java exactly
- Step 20: Integration testing - test with real files, compare with Java output, fix any discrepancies
  - **Test**: Multiple test files
  - **Compare**: Full file output matches Java line-by-line

## Verification Process

**After EACH step**:

1. Write minimal test for that step
2. Run and verify it works
3. Compare output with Java version (if applicable)
4. Fix any discrepancies before proceeding
5. Move to next step only when current step works completely

**Testing Strategy**:

- Simple test files for early steps
- Real test files for later steps
- Side-by-side comparison with Java output
- Verify: file structure, JSON content, transformations all match

## Progress Tracking

- ✅ Complete
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked
