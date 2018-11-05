import asyncInterval from './async-interval';

jest.useFakeTimers();

describe("async interval", () => {
  test("should call an async function using interval", async () => {
    const asyncFunc = jest.fn();
    asyncFunc.mockReturnValue(Promise.resolve(20));

    asyncInterval(asyncFunc, 1000);
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    await Promise.resolve(20);

    jest.runOnlyPendingTimers();
    expect(asyncFunc).toHaveBeenCalledTimes(2)
  });

  test("should stop calling a function if the interval is halted",async () => {
    const asyncFunc = jest.fn();
    asyncFunc.mockReturnValue(Promise.resolve(20));

    const stop = asyncInterval(asyncFunc, 1000);
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    stop();

    await Promise.resolve(20);

    jest.runOnlyPendingTimers();
    expect(asyncFunc).toHaveBeenCalledTimes(1);
  })
});

