import { threshold } from "./helpers";

// this test tries to prove that previous sorting function had bugs but it turns out that *usually* it works in chrome and thus it's hard to write proper test case
// read more: https://stackoverflow.com/questions/24080785/sorting-in-javascript-shouldnt-returning-a-boolean-be-enough-for-a-comparison
test("threshold is calculated properly", () => {
  expect(threshold("private", "eth", "dai")).toBe(2);
  expect(threshold("private", "dai", "eth")).toBe(2);
});
