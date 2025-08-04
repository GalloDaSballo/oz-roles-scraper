import { ethers } from "ethers";
import { whatsabi } from "@shazow/whatsabi";

const ROLES_EVENTS_ABI = [
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)"
]

const ROLES_ENUMERABLE_ABI = [
    "function getRoleMemberCount(bytes32 role) public view returns (uint256)",
    "function getRoleMember(bytes32 role, uint256 index) public view returns (address)"
]

// Get all Roles from the event
export async function getAllRolesEvents(rpcUrl: string, address: string, role: string, start: number, perRequest: number = 25000, batchSize: number = 40, latest?: number) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, ROLES_EVENTS_ABI, provider);

    // All roles can be found from the role admin?
    
    const roleAdminChangedFilter = contract.filters.RoleAdminChanged(role ? role : null, null, null);
    const roleAddedFilter = contract.filters.RoleGranted(role ? role : null, null, null);
    const roleRemovedFilter = contract.filters.RoleRevoked(role ? role : null, null, null)

    const blockEnd = latest ?? await provider.getBlockNumber();

    let adminChanged: any[] = [];
    let added: any[] = [];
    let removed: any[] = [];

    // Create batches of block ranges
    const blockRanges: Array<{start: number, end: number}> = [];
    for(let i = start; i < blockEnd; i += perRequest) {
        blockRanges.push({
            start: i,
            end: Math.min(i + perRequest, blockEnd)
        });
    }

    // Process batches in parallel
    for(let i = 0; i < blockRanges.length; i += batchSize) {
        const batch = blockRanges.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (range) => {
            // Run all 3 filter queries in parallel for this range
            const [adminEvents, addedEvents, removedEvents] = await Promise.all([
                contract.queryFilter(roleAdminChangedFilter, range.start, range.end),
                contract.queryFilter(roleAddedFilter, range.start, range.end),
                contract.queryFilter(roleRemovedFilter, range.start, range.end)
            ]);

            return {
                adminEvents,
                addedEvents,
                removedEvents
            };
        });

        // Wait for all requests in this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Collect results from this batch
        for (const result of batchResults) {
            if (result.adminEvents.length > 0) {
                adminChanged.push(...result.adminEvents);
            }
            if (result.addedEvents.length > 0) {
                added.push(...result.addedEvents);
            }
            if (result.removedEvents.length > 0) {
                removed.push(...result.removedEvents);
            }
        }
    }

    return {
        adminChanged,
        added,
        removed
    }
}

export async function inferRolesFromSource(rpcUrl: string, address: string) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    let result = await whatsabi.autoload(address, { provider });

    // We can even detect and resolve proxies!
    if (result.followProxies) {
        result = await result.followProxies();
    }

    const FILTERED_ABI = result.abi.filter((item: any) => item?.name && item.name.includes("_ROLE"));
    console.log(FILTERED_ABI);
    return FILTERED_ABI.map((item: any) => {
        return {
            name: item.name,
            hash: doKeccak256(item.name)
        }
    });
}


// Get Role
export function doKeccak256(data: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
}

export async function getRoleMembersFromEnumerable(rpcUrl: string, address: string, role: string) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, ROLES_ENUMERABLE_ABI, provider);
    const roleMembers = await contract.getRoleMemberCount(role);

    let members: string[] = [];
    for(let i = 0; i < roleMembers; i++) {
        const member = await contract.getRoleMember(role, i);
        members.push(member);
    }

    return {
        name: role,
        hash: doKeccak256(role),
        members: members
    }
}


