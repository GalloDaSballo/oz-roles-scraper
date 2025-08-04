import { getAllRolesEvents } from "./index";

async function testGetAllRolesEventsBatching() {
    console.log("Testing getAllRolesEvents batch processing...");
    
    const rpcUrl = "http://172.33.0.4:8545";
    const address = "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa";
    const start = 22685935;
    
    // Test with different batch sizes
    const testCases = [
        { batchSize: 50, perRequest: 25000, description: "Medium batches" }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n--- Testing ${testCase.description} (batchSize: ${testCase.batchSize}) ---`);
        
        const startTime = Date.now();
        
        try {
            const events = await getAllRolesEvents(
                rpcUrl, 
                address, 
                "", // empty role to get all roles
                start, 
                testCase.perRequest, 
                testCase.batchSize
            );
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log("✓ Test completed successfully");
            console.log(`  Duration: ${duration}ms`);
            console.log(`  Admin changed events: ${events.adminChanged.length}`);
            console.log(`  Role granted events: ${events.added.length}`);
            console.log(`  Role revoked events: ${events.removed.length}`);
            
            // Validate structure
            if (events.adminChanged && events.added && events.removed) {
                console.log("✓ Response structure is valid");
            } else {
                console.log("✗ Invalid response structure");
            }
            
            // Validate arrays are properly concatenated
            const totalEvents = events.adminChanged.length + events.added.length + events.removed.length;
            console.log(`  Total events: ${totalEvents}`);
            
        } catch (error) {
            console.log(`✗ Test failed: ${error}`);
        }
    }
}

if(require.main === module) {
    testGetAllRolesEventsBatching();
}