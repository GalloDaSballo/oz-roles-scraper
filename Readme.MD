# oz-roles-scraper

## Installation

```
npm i oz-roles-scraper
```

## Usage    

```ts
import { doKeccak256, getAllRolesEvents, getRoleMembersFromEnumerable, inferRolesFromSource } from "oz-roles-scraper";

// Get the hash for a string
const hashed = doKeccak256("MY_ROLE");

// Scrape all events for a given role (NOTE: slow AF)
const allEvents = getAllRolesEvents("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "0xd3d225be1126d845fcf8733ea56e6e51b96ef5190bf72aae9f96e0bef924e437", 18290587, perRequest: number = 25000, batchSize: number = 40, latest?: number)

// Use OZ Enumerable Roles to fetch all role members
const members = await getRoleMembersFromEnumerable("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "0xa7e5f4407fb7a6903f54f2279f3aefe796f21c33a3ea2caae0d0150b895a61a9")

// Use whatsABI to find public getters that end with _ROLE
const roles = await inferRolesFromSource("https://eth.llamarpc.com", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa")



```