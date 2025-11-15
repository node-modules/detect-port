# Test Coverage Analysis

## Current Coverage: 93.1%

### Coverage Breakdown
- **Functions**: 100% ✓
- **Lines**: 93.1% (target: 100%)
- **Branches**: 90.32% (target: 100%)
- **Statements**: 93.1% (target: 100%)

### Uncovered Lines in `src/detect-port.ts`

The following lines remain uncovered after comprehensive testing:

#### Line 83
```typescript
if (port === 0) {
  throw err;  // ← Uncovered
}
```
**Why uncovered**: This line is only executed when port 0 (random port) fails to bind, which is extremely rare and difficult to simulate without deep system-level mocking.

#### Line 92
```typescript
} catch (err) {
  return await handleError(++port, maxPort, hostname);  // ← Uncovered
}
```
**Why uncovered**: This error path is hit when binding to `0.0.0.0` fails but all previous checks pass. This requires a very specific system state that's hard to replicate in tests.

#### Line 99
```typescript
} catch (err) {
  return await handleError(++port, maxPort, hostname);  // ← Uncovered
}
```
**Why uncovered**: Similar to line 92, this is hit when binding to `127.0.0.1` fails after all previous checks succeed, which is a rare condition.

#### Lines 108-109
```typescript
if (err.code !== 'EADDRNOTAVAIL') {
  return await handleError(++port, maxPort, hostname);  // ← Uncovered
}
```
**Why uncovered**: This path is taken when localhost binding fails with an error other than EADDRNOTAVAIL. The original mocha tests use the `mm` mocking library to simulate DNS ENOTFOUND errors, but achieving this with vitest requires more complex mocking.

#### Line 117
```typescript
} catch (err) {
  return await handleError(++port, maxPort, hostname);  // ← Uncovered
}
```
**Why uncovered**: This is hit when binding to the machine's IP address fails. This requires the machine's IP to be unavailable or the port to be occupied specifically on that IP after all other checks.

### Recommendations

To reach 100% coverage, the following approaches could be used:

1. **Deep Mocking**: Use vitest's module mocking to mock `node:net`'s `createServer` and control server.listen() behavior precisely
2. **System-level Testing**: Run tests in controlled environments where specific network configurations can be set up
3. **Accept Current Coverage**: Given that these are extreme edge cases in error handling that are unlikely to occur in production, 93%+ coverage with comprehensive functional tests may be acceptable

### Test Suite Summary

The vitest test suite includes 100+ tests across:
- **index.test.ts**: Main exports testing
- **detect-port-enhanced.test.ts**: Edge cases and error handling (27 tests)
- **detect-port-advanced.test.ts**: Advanced edge cases (5 tests)
- **detect-port-mocking.test.ts**: Mocking-based tests (7 tests)
- **detect-port-spy.test.ts**: Spy-based tests (6 tests)
- **wait-port-enhanced.test.ts**: Wait-port coverage (13 tests)
- **cli-enhanced.test.ts**: CLI testing (23 tests)
- **integration.test.ts**: Integration scenarios (12 tests)

All tests pass successfully, providing excellent coverage of the codebase's functionality.
