# Playwright Transformer - Process Flow Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSFORMATION PIPELINE                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   START: Find all .spec.ts files     │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  For each test file:                 │
        │  - Read all lines                   │
        │  - Initialize 3 maps                │
        │  - Initialize output array          │
        └─────────────────────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │         PRE-PROCESSING PHASE            │
    └─────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ Insert Lines     │      │ Remove Noise     │
│ (insert_lines.   │      │ (skip_patterns.  │
│  json)           │      │  json)           │
└──────────────────┘      └──────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Prepend Boilerplate                │
        │  (prepend.ts)                       │
        └─────────────────────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │      LINE-BY-LINE PROCESSING            │
    └─────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        │  For each line (0 to N):  │
        │                           │
        ▼                           │
┌─────────────────────────────────┐ │
│  PatternProcessor.getPattern()  │ │
│  - Analyze line content         │ │
│  - Select appropriate handlers  │ │
│  - Chain handlers together      │ │
└─────────────────────────────────┘ │
        │                           │
        ▼                           │
┌─────────────────────────────────┐ │
│  Execute Handler Chain          │ │
│                                 │ │
│  FillPatternHandler             │ │
│    ↓ (if match found, stops)    │ │
│  DefaultPatternHandler          │ │
│    ↓ (always processes)         │ │
│  (Other handlers...)            │ │
└─────────────────────────────────┘ │
        │                           │
        │  Add transformed line     │
        │  to output array          │
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │         OUTPUT GENERATION               │
    └─────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ Write Transformed│      │ Write JSON Data  │
│ .spec.ts file     │      │ .json file        │
│                  │      │                  │
│ (Output Dir)     │      │ (Data Dir)       │
└──────────────────┘      └──────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
                    [DONE]
```

---

## Detailed Handler Chain Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESSING A SINGLE LINE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Input: One line of code            │
        │  Example:                           │
        │  .fill('hardcoded_value')            │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  PatternProcessor.getPattern()      │
        │                                     │
        │  Checks:                            │
        │  ✓ Is test start?                   │
        │  ✓ Contains .fill()?                 │
        │  ✓ Is last line?                    │
        │  → Always add DefaultHandler        │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Create Handler Chain:              │
        │                                     │
        │  FillPatternHandler                 │
        │         ↓                           │
        │  DefaultPatternHandler              │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Execute Chain:                     │
        │                                     │
        │  1. FillPatternHandler.processLine()│
        │     ├─ Try each pattern from        │
        │     │  fill_patterns.json            │
        │     ├─ Match regex                  │
        │     ├─ Extract selector + value     │
        │     ├─ Generate JSON key            │
        │     ├─ Store in jsonMap             │
        │     ├─ Store in reverseJsonMap      │
        │     ├─ Transform line               │
        │     └─ Return transformed line      │
        │                                     │
        │  2. DefaultPatternHandler           │
        │     (if FillPattern didn't match):  │
        │     ├─ Try each rule from           │
        │     │  replace_texts.json           │
        │     ├─ Extract text between markers │
        │     ├─ Look up in reverseJsonMap    │
        │     ├─ Replace hardcoded text       │
        │     └─ Return: transformed line     │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Output: Transformed line           │
        │                                     │
        │  Before:                            │
        │  .fill('hardcoded_value')            │
        │                                     │
        │  After:                             │
        │  .fill(data.field_name + uniqueIndex) │
        └─────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Add to output array                │
        │  Move to next line                  │
        └─────────────────────────────────────┘
```

---

## Data Flow Through Maps

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA STRUCTURES                              │
└─────────────────────────────────────────────────────────────────┘

Input Line:
  await page.getByTestId('username-input').fill('john');

                    │
                    ▼
    ┌───────────────────────────────┐
    │  FillPatternHandler           │
    │  Extracts:                    │
    │  - Key: "username-input"      │
    │  - Value: "john"              │
    └───────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────────┐  ┌───────────────────┐
│   jsonMap         │  │ reverseJsonMap    │
│                   │  │                   │
│ Key → Value       │  │ Value → Data Ref  │
│                   │  │                   │
│ username_input    │  │ "john" →          │
│   → "john"        │  │   "data.username  │
│                   │  │   _input"         │
└───────────────────┘  └───────────────────┘
        │                       │
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Final Output:                │
        │                               │
        │  Transformed Line:            │
        │  .fill(data.username_input +   │
        │        uniqueIndex)           │
        │                               │
        │  JSON Output:                 │
        │  {                            │
        │    "username_input": "john"   │
        │  }                            │
        └───────────────────────────────┘
```

---

## Pre-Processing Sequence

```
Input File (40 lines)
        │
        ▼
┌───────────────────────┐
│ applyInsertLinePattern│
│ (insert_lines.json)   │
└───────────────────────┘
        │
        ▼
Output: 55 lines (+15 inserted)
        │
        ▼
┌───────────────────────┐
│ removeAllNoiseLines   │
│ (skip_patterns.json)  │
└───────────────────────┘
        │
        ▼
Output: 50 lines (-5 removed)
        │
        ▼
┌───────────────────────┐
│ Prepend boilerplate   │
│ (prepend.ts)          │
└───────────────────────┘
        │
        ▼
Output: 60 lines (+10 prepended)
        │
        ▼
Ready for line-by-line processing
```

---

## Handler Selection Logic

```
Line Content Analysis
        │
        ├─→ Starts with "test("?
        │   └─→ TestCaseStartHandler
        │
        ├─→ Contains ".fill(" OR ".selectOption(" OR ...?
        │   └─→ FillPatternHandler
        │
        ├─→ Is last line?
        │   └─→ LastLineHandler
        │
        └─→ Always:
            └─→ DefaultPatternHandler
                │
                └─→ Chain them together:
                    Handler1 → Handler2 → Handler3
```

---

## Transformation Example

```
INPUT FILE:
┌─────────────────────────────────────────┐
│ import { test } from '@playwright/test' │
│                                         │
│ test('test', async ({ page }) => {      │
│   await page.goto('...');               │
│   await page.getByTestId('input')       │ Url:─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ - - ─┐
│     .fill('colors');  ←───────────────┘  |                                  │
│ });                                     │                                  │
└─────────────────────────────────────────┘                                  │
                                                                             │
                            TRANSFORMATION                                   │
                                                                             │
┌─────────────────────────────────────────┐                                  │
│ OUTPUT FILE:                            │                                  │
│ import {...} from '@utilities/...'      │ ← Prepended                      │
│ for (const data of input) {             │ ← Test wrapper                   │
│   test('...', async ({...}) => {        │ ← Test structure                 │
│     await page.goto(process.env.URL);   │ ← URL replaced                   │
│     await page.getByTestId('input')     │                                  │
│       .fill(data.field_input +            │ ← Value externalized             |
│             uniqueIndex);               │                                  │
│   });                                   │                                  │
│ }                                       │                                  │
└─────────────────────────────────────────┘                                  │
        │                                                                    │
        └────────────────────────────────────────────────────────────────────┘
 CI/CD: Generate JSON
┌───────────────────────┐
│ {                     │
│   "tcName": "TC01",   │
│   "field_input":       │
│     "colors"          │
│ }                     │
└───────────────────────┘
```

---

## Key Decision Points

```
                    Is FillPattern match?
                            │
                ┌───────────┴───────────┐
                │                       │
               YES                      NO
                │                       │
                ▼                       ▼
    Extract value, store in        Pass to
    maps, transform line           DefaultHandler
                │                       │
                │                   Look in
                │                   reverseJsonMap
                │                       │
                │              ┌────────┴────────┐
                │              │                 │
                │            FOUND             NOT FOUND
                │              │                 │
                │              ▼                 ▼
                │      Replace text      Keep original
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    Add to output
```

---

This diagram shows the complete flow from input file to transformed output, matching the Java implementation exactly.
