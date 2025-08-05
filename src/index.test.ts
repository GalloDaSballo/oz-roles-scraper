import { ethers } from "ethers";
import { doKeccak256, getAllRolesEvents, getRoleMembersFromEnumerable, inferRolesFromSource } from "./index";

async function testKeccak256() {
    const result = await doKeccak256("TEST_ROLE");
    const expected = "0x8d9cb4e0f6b5b1fc2e6b7d7f4e6d5e4c3b2a1f0e9d8c7b6a59f8e7d6c5b4a3a2a";
    
    console.log("Testing keccak256 function...");
    console.log("Input: TEST_ROLE");
    console.log("Output:", result);
    console.log("Length:", result.length);
    console.log("Starts with 0x:", result.startsWith("0x"));
    
    // Basic validation
    if (result.length === 66 && result.startsWith("0x")) {
        console.log("✓ Test passed: Valid keccak256 hash format");
    } else {
        console.log("✗ Test failed: Invalid hash format");
    }
}

if (require.main === module) {
    runAllTests();

}


async function runAllTests() {
    console.log("Running tests...");

    console.log("Running getRoleMembersFromEnumerable...");
    const members = await getRoleMembersFromEnumerable("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "0xa7e5f4407fb7a6903f54f2279f3aefe796f21c33a3ea2caae0d0150b895a61a9")
    console.log("Members:", members);
    
    console.log("Running doKeccak256...");
    const keccak256Result = doKeccak256("REMOVE_BLOCK_LIST_CONTRACT_ROLE")
    console.log("Keccak256 result:", keccak256Result);

    console.log("Running getAllRolesEvents...");
    const startTime = new Date().getTime();
    const start = 22685935;
    const events = await getAllRolesEvents("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "", start)
    console.log("Events:", events);
    const endTime = new Date().getTime();
    console.log("Time taken:", endTime - startTime);
    
    
    console.log("Running inferRolesFromSource...");
    const roles = await inferRolesFromSource("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa")
    console.log("Roles:", roles);
}