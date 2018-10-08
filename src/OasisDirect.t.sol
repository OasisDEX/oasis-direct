pragma solidity ^0.4.24;

import "ds-test/test.sol";

import "./OasisDirect.sol";

contract OasisDirectTest is DSTest {
    OasisDirect direct;

    function setUp() public {
        direct = new OasisDirect();
    }

    function testFail_basic_sanity() public {
        assertTrue(false);
    }

    function test_basic_sanity() public {
        assertTrue(true);
    }
}
