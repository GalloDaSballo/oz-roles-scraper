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
async function getAllRolesEvents(rpcUrl: string, address: string, role: string, start: number, latest?: number) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, ROLES_EVENTS_ABI, provider);

    // All roles can be found from the role admin?
    
    const roleAdminChangedFilter = contract.filters.RoleAdminChanged(role ? role : null, null, null);
    const roleAddedFilter = contract.filters.RoleGranted(role ? role : null, null, null);
    const roleRemovedFilter = contract.filters.RoleRevoked(role ? role : null, null, null)

    const blockEnd = latest ?? await provider.getBlockNumber();
    // 25000 per request
    for(let i = start; i < blockEnd; i += 25000) {
        const events = await contract.queryFilter(roleAdminChangedFilter, i, i + 25000);
        const events2 = await contract.queryFilter(roleAddedFilter, i, i + 25000);
        const events3 = await contract.queryFilter(roleRemovedFilter, i, i + 25000);
        if(events.length > 0) {
            console.log("Role Admin Changed:", events);
        }
        if(events2.length > 0) {
            console.log("Role Added:", events2);
            // @ts-ignore
            console.log("User Added", events2.map(event => (`${event?.args?.role} - ${event?.args?.account}`)));
        }
        if(events3.length > 0) {
            console.log("Role Removed:", events3);
        }
    }
}

async function inferRolesFromSource(rpcUrl: string, address: string) {
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
async function doKeccak256(data: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
}

async function getRoleMembersFromEnumerable(rpcUrl: string, address: string, role: string) {
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


if(require.main === module) {
    getRoleMembersFromEnumerable("http://172.33.0.4:8545", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "0xa7e5f4407fb7a6903f54f2279f3aefe796f21c33a3ea2caae0d0150b895a61a9").then(console.log).catch(console.error);
    // const start = 22685935;
    // doKeccak256("REMOVE_BLOCK_LIST_CONTRACT_ROLE").then(console.log);
    // getAllRolesEvents("http://172.33.0.4:8545", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "", start).catch(console.error);
    // const res = inferRolesFromSource("http://172.33.0.4:8545", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa").then(console.log);
    // TODO: use WhatsABI to get the IMPL and from there do the ABI scraping.
    // console.log(res);
}   