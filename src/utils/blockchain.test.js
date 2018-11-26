import { isEmptyProxy } from "./blockchain";

test("isEmptyProxy works correctly", () => {
  expect(isEmptyProxy("0xc257274276a4e539741ca11b590b9447b26a8051")).toTrue();
  expect(isEmptyProxy("0x")).toTrue();
  expect(isEmptyProxy("0x0")).toTrue();
});
